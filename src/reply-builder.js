// All responses begin with 'E>'
const RESPONSE_PREFIX = 'E>';

/**
 * Builds preset response after SET command
 *
 * (Can possibly be replaced with buildPstGetReply())
 * @param {number} spaceId
 * @param {number} presetId
 * @param {string} eom
 * @returns
 */
export function buildPstActLine(spaceId, presetId, eom) {
  return `${RESPONSE_PREFIX}pst act: ${spaceId}, ${presetId}${eom}`;
}

/**
 * Builds each line of zone GET request
 * @param {number} spaceId number id of space
 * @param {number} zoneId number id of zone
 * @param {number} level level (0 - 255)
 * @param {string} eom eom character
 * @returns
 */
export function buildZoneIntLine(spaceId, zoneId, level, eom) {
  return `${RESPONSE_PREFIX}zone int: ${spaceId}, ${zoneId}, ${level}${eom}`;
}

/**
 * Builds preset GET reply
 * @param {number} spaceId
 * @param {*} state
 * @param {string} eom
 * @returns
 */
export function buildPstGetReply(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  return `${RESPONSE_PREFIX}pst get: ${spaceId}, ${space.preset}${eom}`;
}

/**
 * Builds entirety of zone GET response
 * @param {number} spaceId number id of space
 * @param {*} state
 * @param {string} eom eom character
 * @returns
 */
export function buildZoneIntGetReply(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  const lines = [];
  for (const [zone, level] of space.zones) {
    lines.push(buildZoneIntLine(spaceId, zone, level, eom));
  }
  return lines.join('');
}

/**
 * Builds reply for space off get request
 * @param {number} spaceId number id of space
 * @param {*} state
 * @param {string} eom eom character
 * @returns
 */
export function buildOffGetReply(spaceId, state, eom) {
  const boolChar = state.isOff(spaceId) ? '1' : '0';
  return `${RESPONSE_PREFIX}space off: ${spaceId}, ${boolChar}${eom}`;
}

/**
 * Build response for a single sequence's status
 * @param {number} spaceId number id of space
 * @param {number} seqId number id of sequence
 * @param {boolean} active has sequence been activated?
 * @param {string} eom eom character
 * @returns
 */
export function buildSeqActLine(spaceId, seqId, active, eom) {
  const boolChar = active ? '1' : '0';
  return `${RESPONSE_PREFIX}seq act: ${spaceId}, ${seqId}, ${boolChar}${eom}`;
}

/**
 * Builds reply for sequence status data
 * @param {number} spaceId number id of space
 * @param {*} state
 * @param {string} eom eom character
 */
export function buildSeqGetReply(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  const lines = [];
  for (const [seqId, active] of space.sequences) {
    lines.push(buildSeqActLine(spaceId, seqId, active, eom));
  }
  return lines.join('');
}
/**
 * Builds sync reply per space
 * @param {number} spaceId number id of space
 * @param {*} state
 * @param {string} eom eom character
 * @returns
 */
export function buildSpaceDumpLines(spaceId, state, eom) {
  const space = state.getSpace(spaceId);
  const lines = [buildPstActLine(spaceId, space.preset, eom)];
  for (const [zoneNum, level] of space.zones) {
    lines.push(buildZoneIntLine(spaceId, zoneNum, level, eom));
  }
  for (const [seqId, active] of space.sequences) {
    lines.push(buildSeqActLine(spaceId, seqId, active, eom));
  }
  return lines.join('');
}

/**
 * Builds sync reply for specific or all spaces
 * @param {number} spaceId number id of space (0 means get all spaces)
 * @param {*} state
 * @param {string} eom eom character
 * @returns
 */
export function buildSyncGetReply(spaceId, state, eom) {
  const spaceIds =
    spaceId === 0 ? Array.from({ length: 16 }, (_, i) => i + 1) : [spaceId];

  const lines = [`${RESPONSE_PREFIX}lok${eom}`];

  for (const spaceId of spaceIds) {
    lines.push(buildSpaceDumpLines(spaceId, state, eom));
  }
  return lines.join('');
}

/**
 * Builds reply using help text when $>help{eom} is received
 * @param {string} eom eom character
 * @returns
 */
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
