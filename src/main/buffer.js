export function splitCommands(buffer, eom) {
  return buffer
    .toString('ascii')
    .split(eom)
    .map(s => s.trim())
    .filter(Boolean);
}
