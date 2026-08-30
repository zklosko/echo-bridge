/**
 * Validates remote client IP address
 * @param {string} address
 * @returns {boolean}
 */
export function isValidIPv4(address) {
  const parts = address.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

/**
 * Validates remote client port
 * @param {Number} port
 * @returns {boolean}
 */
export function isValidPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
