/**
 * Shared manual front matter. One Silverado book pasted this pack under
 * 72 wiring sections. The text is not about that vehicle. A Jaguar files
 * the same idea under Abbreviations / "A".
 *
 * Match the folder name, not a vague word. "Fastener Tightening
 * Specifications" is a real torque list and must stay.
 */

const DIAGNOSTIC_AID_BLOCKS = new Set([
  'general electrical diagnostic procedures',
  'abbreviations and meanings',
  'arrows and symbols',
  'conversion - english',
  'conversion - english/metric',
  'decimal and metric equivalents',
  'diagnostic work sheets',
  'diagnostic worksheets',
  'fasteners',
  'special tools ordering information',
  'thread inserts',
  'training',
]);

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value).replace(/\s+/g, ' ').trim();
  } catch {
    return value.replace(/\s+/g, ' ').trim();
  }
}

export function isBoilerplateManualPath(segments: string[]): boolean {
  const decoded = segments.map(decodeSegment).filter(Boolean);
  for (let i = 0; i < decoded.length; i++) {
    const current = decoded[i].toLowerCase();
    const parent = (decoded[i - 1] || '').toLowerCase();

    if (current === 'abbreviations and meanings') return true;
    if (current.startsWith('conversion - english')) return true;
    if (current.startsWith('commonly used abbreviations')) return true;
    if (current === 'general electrical diagnostic procedures') return true;
    if (parent === 'diagnostic aids' && DIAGNOSTIC_AID_BLOCKS.has(current)) return true;
    if (parent.includes('abbreviation') && /^"?[a-z]"?$/.test(current)) return true;
  }
  return false;
}

export function isBoilerplateManualStoredPath(storedPath: string): boolean {
  return isBoilerplateManualPath(storedPath.split('/').filter(Boolean));
}
