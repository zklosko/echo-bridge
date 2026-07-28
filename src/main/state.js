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

  function getSpace(spaceId) {
    if (!spaces.has(spaceId)) {
      spaces.set(spaceId, createSpace());
    }
    return spaces.get(spaceId);
  }

  function isOff(spaceId) {
    const space = getSpace(spaceId);
    return [...space.zones.values()].every(level => level === 0);
  }

  function setZoneLevel(spaceId, zoneId, value) {
    const space = getSpace(spaceId);
    space.zones.set(zoneId, value);
    return space;
  }

  function setPreset(spaceId, preset) {
    const space = getSpace(spaceId);
    space.preset = preset;
    return space;
  }

  function setOff(spaceId, off = true) {
    const space = getSpace(spaceId);
    for (const zone of space.zones.keys()) {
      space.zones.set(zone, 0);
    }
    return space;
  }

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
