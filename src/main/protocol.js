const COMMAND_PATTERNS = [
  {
    type: 'setPreset',
    regex: /^E\$pst act:\s*(\d+),\s*(\d+),\s*([\d.]+)$/,
    parse: m => ({
      type: 'setPreset',
      spaceId: Number(m[1]),
      presetId: Number(m[2]),
      time: Number(m[3]), // fade_time
    }),
  },
  {
    type: 'off',
    regex: /^E\$off:\s*(\d+),\s*([\d.]+)$/,
    parse: m => ({
      type: 'off',
      spaceId: Number(m[1]),
      time: Number(m[2]), // fade_time
    }),
  },
  {
    type: 'seqActivate',
    regex: /^E\$seq act:\s*(\d+),\s*(\d+)$/,
    parse: m => ({
      type: 'seqActivate',
      spaceId: Number(m[1]),
      seqId: Number(m[2]),
    }),
  },
  {
    type: 'seqDeactivate',
    regex: /^E\$seq dact:\s*(\d+),\s*(\d+)$/,
    parse: m => ({
      type: 'seqDeactivate',
      spaceId: Number(m[1]),
      seqId: Number(m[2]),
    }),
  },
  {
    type: 'zoneIntensity',
    regex: /^E\$zone int:\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)$/,
    parse: m => ({
      type: 'zoneIntensity',
      spaceId: Number(m[1]),
      zoneId: Number(m[2]),
      level: Number(m[3]),
      time: Number(m[4]), // fade_time
    }),
  },
  {
    type: 'presetGet',
    regex: /^E\$pst get:\s*(\d+)$/,
    parse: m => ({ type: 'presetGet', spaceId: Number(m[1]) }),
  },
  {
    type: 'offGet',
    regex: /^E\$off get:\s*(\d+)$/,
    parse: m => ({ type: 'offGet', spaceId: Number(m[1]) }),
  },
  {
    type: 'seqGet',
    regex: /^E\$seq get:\s*(\d+)$/,
    parse: m => ({ type: 'seqGet', spaceId: Number(m[1]) }),
  },
  {
    type: 'seqGet',
    regex: /^E\$sync get:\s*(\d+)$/,
    parse: m => ({ type: 'syncGet', spaceId: Number(m[1]) }), // 0 = all spaces
  },
  {
    type: 'zoneIntensityGet',
    regex: /^E\$zone int get:\s*(\d+)$/,
    parse: m => ({ type: 'zoneIntensityGet', spaceId: Number(m[1]) }),
  },
  {
    type: 'help',
    regex: /^E\$help$/,
    parse: m => ({ type: 'help' }),
  },
];

export function parseCommand(rawStr) {
  const str = rawStr.trim(); // assumes EOM removed by socket layer

  for (const { regex, parse } of COMMAND_PATTERNS) {
    const match = str.match(regex);
    if (match) return parse(match);
  }

  return { type: 'unknown', raw: str };
}
