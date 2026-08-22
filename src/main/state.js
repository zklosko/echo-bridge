const ZONE_COUNT = 16;

export function createControllerState() {
  // Map<space, { zones: Map<zone, value>, off: boolean, preset: value, sequence: value }>
  const spaces = new Map();

  function createSpace() {
    const zones = new Map();
    for (let z = 1; z <= ZONE_COUNT; z++) {
      zones.set(z, 0);
    }
    return { zones, preset: 0, sequence: null };
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

  //TODO: unfinished
  function setSequence(spaceId, sequence, active) {
    const space = getSpace(spaceId);
    space.sequence = active ? sequence : null;
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
