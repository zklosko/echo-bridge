const RESPONSE_PREFIX = 'E>';

export function buildPstActLine(spaceId, presetId, eom) {
  return `${RESPONSE_PREFIX}pst act: ${spaceId}, ${presetId}${eom}`;
}

export function buildZoneIntLine(spaceId, zoneId, level, eom) {
  return `${RESPONSE_PREFIX}zone int: ${spaceId}, ${zoneId}, ${level}${eom}`;
}

export function buildPstGetReply(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  return `${RESPONSE_PREFIX}pst get: ${spaceId}, ${space.preset}${eom}`;
}

export function buildZoneIntGetReply(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  const lines = [];
  for (const [zone, level] of space.zones) {
    lines.push(buildZoneIntLine(spaceId, zone, level, eom));
  }
  return lines.join('');
}

export function buildOffGetReply(spaceId, state, eom) {
  const boolChar = state.isOff(spaceId) ? '1' : '0';
  return `${RESPONSE_PREFIX}space off: ${spaceId}, ${boolChar}${eom}`;
}

export function buildSpaceDumpLines(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  const lines = [buildPstActLine(spaceId, space.preset, eom)];
  for (const [zoneNum, level] of space.zones) {
    lines.push(buildZoneIntLine(spaceId, zoneNum, level, eom));
  }
  // TODO sequence lines
  return lines.join('');
}

export function buildSyncGetReply(spaceId, state, eom) {
  const spaceIds =
    spaceId === 0 ? Array.from({ length: 16 }, (_, i) => i + 1) : [spaceId];

  const lines = [`${RESPONSE_PREFIX}lok${eom}`];

  for (const spaceId of spaceIds) {
    lines.push(buildSpaceDumpLines(spaceId, state, eom));
  }
  return lines.join('');
}

export function buildHelpReply(eom) {
  const lines = [
    'E$pst act: spc_num(1-16), pst_num(1-64), time',
    'E$off: spc_num(1-16), time',
    'E$seq act: spc_num(1-16), seq_num(1-4)',
    'E$seq dact: spc_num(1-16), seq_num(1-4)',
    'E$zone int: spc_num(1-16), zn_num(1-16), level(0-255), time',
    'E$pst get: spc_num(1-16)',
    'E$off get: spc_num(1-16)',
    'E$seq get: spc_num(1-16)',
    'E$sync get: spc_num(0-16)',
    'E$zone int get: spc_num(1-16)',
    'E$help',
  ];

  const body = lines.map(line => `${line}${eom}`).join('');
  return `Available commands:${body}`;
}
