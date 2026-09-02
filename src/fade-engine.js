const TICK_MS = 40; // ~25 updates/sec, needs tuning

/**
 * Fade engine: calculates zone intensity value over time for frontend display
 */
export class FadeEngine {
  #fades = new Map(); // Map<"spaceId:zoneId", Map<spaceId, zoneId, from, to, startTime, duration>>
  #timer = null;
  #state;
  #onChange; // (spaceId) => void -- call whenever a space's zones update

  constructor(state, onChange) {
    this.#state = state;
    this.#onChange = onChange;
  }

  /**
   * Initial command to fade a zone's intensity
   * @param {number} spaceId
   * @param {number} zoneId
   * @param {number} targetLevel
   * @param {number} duration
   * @returns
   */
  requestZoneLevel(spaceId, zoneId, targetLevel, duration) {
    const key = `${spaceId}:${zoneId}`;

    if (this.#fades.has(key)) {
      this.#fades.delete(key);
      this.#state.setZoneLevel(spaceId, zoneId, targetLevel);
      this.#onChange(spaceId);
      return;
    }

    if (!duration || duration <= 0) {
      this.#state.setZoneLevel(spaceId, zoneId, targetLevel);
      this.#onChange(spaceId);
      return;
    }

    const space = this.#state.getSpace(spaceId);
    const fromLevel = space.zones.get(zoneId) ?? 0;

    if (fromLevel === targetLevel) return;

    this.#fades.set(key, {
      spaceId,
      zoneId,
      from: fromLevel,
      to: targetLevel,
      startTime: Date.now(),
      duration: duration * 1000,
    });

    this.#ensureTimerRunning();
  }

  /**
   * Fades all zones in a given space to 0, over a set period of time
   * @param {number} spaceId
   * @param {number} duration 0.0 - 25.4 seconds
   */
  requestSpaceOff(spaceId, duration) {
    const space = this.#state.getSpace(spaceId);
    for (const zoneId of space.zones.keys()) {
      this.requestZoneLevel(spaceId, zoneId, 0, duration);
    }
  }

  /**
   * Makes sure the timer is running
   * @returns
   */
  #ensureTimerRunning() {
    if (this.#timer) return;
    this.#timer = setInterval(() => this.#tick(), TICK_MS);
    this.#timer.unref?.(); // don't let this keep the process alive by itself
  }

  /**
   * Executes a single calculation cycle
   * @returns
   */
  #tick() {
    if (this.#fades.size === 0) {
      clearInterval(this.#timer);
      this.#timer = null;
      return;
    }

    const now = Date.now();
    const affectedSpaces = new Set();

    for (const [key, fade] of this.#fades) {
      const elapsed = now - fade.startTime;
      const ratio = Math.min(elapsed / fade.duration, 1);
      const level = Math.round(fade.from + (fade.to - fade.from) * ratio);

      this.#state.setZoneLevel(fade.spaceId, fade.zoneId, level);
      affectedSpaces.add(fade.spaceId);

      if (ratio >= 1) this.#fades.delete(key);
    }

    for (const spaceId of affectedSpaces) {
      this.#onChange(spaceId);
    }
  }

  /**
   * Stops fading after timer expires
   */
  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#fades.clear();
  }
}
