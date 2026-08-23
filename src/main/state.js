export function createControllerState() {
  // Map<space, { zones: Map<zone, value>, off: boolean, preset: value, sequence: value }>
  const spaces = new Map();

  function createSpace() {
    const zones = new Map();
    for (let z = 1; z <= 16; z++) zones.set(z, 0);

    const sequences = new Map();
    for (let s = 1; s <= 4; s++) sequences.set(s, false);

    return { zones, preset: 0, sequences };
  }

  /**
   * Loads space into variable, creating if space does not exist
   * @param {number} spaceId
   * @returns
   */
  function getSpace(spaceId) {
    if (!spaces.has(spaceId)) {
      spaces.set(spaceId, createSpace());
    }
    return spaces.get(spaceId);
  }

  /**
   * GET command: is space off?
   * @param {number} spaceId
   * @returns
   */
  function isOff(spaceId) {
    const space = getSpace(spaceId);
    return [...space.zones.values()].every(level => level === 0);
  }

  /**
   * SET command: sets a given zone's intensity to a specific value
   * @param {number} spaceId space from 1 to 16
   * @param {number} zoneId zone from 1 to 16
   * @param {number} value intensity from 0 to 255
   * @returns
   */
  function setZoneLevel(spaceId, zoneId, value) {
    const space = getSpace(spaceId);
    space.zones.set(zoneId, value);
    return space;
  }

  /**
   * SET command: activates a given preset
   * @param {number} spaceId space from 1 to 16
   * @param {number} preset preset from 1 to 64
   * @returns
   */
  function setPreset(spaceId, preset) {
    const space = getSpace(spaceId);
    space.preset = preset;
    return space;
  }

  /**
   * SET command: turns a given space off by setting all zones within the space to 0 intensity
   * @param {number} spaceId space from 1 to 16
   * @returns
   */
  function setOff(spaceId) {
    const space = getSpace(spaceId);
    for (const zone of space.zones.keys()) {
      space.zones.set(zone, 0);
    }
    return space;
  }

  /**
   * SET command: activates or deactivates a given sequence
   * @param {number} spaceId
   * @param {number} seqId
   * @param {boolean} active
   * @returns
   */
  function setSequence(spaceId, seqId, active) {
    const space = getSpace(spaceId);
    space.sequences.set(seqId, active);
    return space;
  }

  return {
    spaces,
    getSpace,
    isOff,
    setZoneLevel,
    setPreset,
    setOff,
    setSequence,
  };
}
