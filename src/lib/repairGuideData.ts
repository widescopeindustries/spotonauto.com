import type { RepairGuide, RepairStep } from '@/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeList(value: unknown, allowNamedItems = false): string[] | null {
  if (!Array.isArray(value)) return null;
  const result: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      result.push(item);
    } else if (allowNamedItems && isRecord(item) && typeof item.name === 'string' && item.name.trim()) {
      if (item.spec != null && typeof item.spec !== 'string') return null;
      result.push(item.name + (item.spec ? ` (${item.spec})` : ''));
    } else {
      return null;
    }
  }
  return result;
}

/** Validate generated and persisted data before it reaches React or affiliate helpers. */
export function normalizeRepairGuide(value: unknown): RepairGuide | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.vehicle !== 'string') return null;
  const parts = normalizeList(value.parts, true);
  const tools = normalizeList(value.tools, true);
  const safetyWarnings = normalizeList(value.safetyWarnings);
  if (!parts || !tools || !safetyWarnings || !Array.isArray(value.steps)) return null;
  const steps: RepairStep[] = [];
  for (const [index, step] of value.steps.entries()) {
    if (!isRecord(step) || typeof step.instruction !== 'string') return null;
    steps.push({
      step: typeof step.step === 'number' && Number.isFinite(step.step) ? step.step : index + 1,
      instruction: step.instruction,
      imagePrompt: typeof step.imagePrompt === 'string' ? step.imagePrompt : '',
      ...(typeof step.imageUrl === 'string' ? { imageUrl: step.imageUrl } : {}),
    });
  }
  return { ...value, id: value.id, title: value.title, vehicle: value.vehicle, parts, tools, safetyWarnings, steps } as RepairGuide;
}
