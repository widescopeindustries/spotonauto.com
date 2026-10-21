/**
 * clarity.ts — Lightweight no-op stubs.
 * Clarity tracking has been scrapped to eliminate main-thread CPU overhead and maximize mobile TBT performance.
 */

export function claritySetTag(_key: string, _value: string | string[]): void {}
export function clarityEvent(_name: string, _metadata?: Record<string, string | number | boolean>): void {}
export function clarityIdentify(_customId: string, _friendlyName?: string): void {}
export function clarityUpgrade(_reason: string): void {}

export type ClarityPageType = string;
export interface ClarityPageTags {
  page_type?: string;
  vehicle_known?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  content_depth?: string;
  traffic_source?: string;
}

export function deriveClarityPageTags(_pathname: string, _search?: string): ClarityPageTags {
  return {};
}

export function applyClarityPageTags(_tags: ClarityPageTags): void {}
