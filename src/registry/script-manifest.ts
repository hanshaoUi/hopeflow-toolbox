// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScriptParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'range';
  label: string;
  description?: string;
  default?: any;
  options?: { value: string; label: string }[];
  required?: boolean;
  excludes?: string[];
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export interface ScriptMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  params?: ScriptParam[];
  serverSide?: boolean;
  requiresNetwork?: boolean;
  shortcut?: string;
  persistParams?: boolean;
}

// ─── Registry (aggregated from per-category files) ───────────────────────────

import { alignmentScripts }   from './scripts/alignment';
import { artboardScripts }    from './scripts/artboard';
import { batchScripts }       from './scripts/batch';
import { colorScripts }       from './scripts/color';
import { exportScripts }      from './scripts/export';
import { textScripts }        from './scripts/text';
import { effectsScripts }     from './scripts/effects';
import { pathScripts }        from './scripts/path';
import { measurementScripts } from './scripts/measurement';
import { imagesScripts }      from './scripts/images';
import { nestingScripts }     from './scripts/nesting';

export const SCRIPT_REGISTRY: ScriptMetadata[] = [
  ...alignmentScripts,
  ...artboardScripts,
  ...batchScripts,
  ...colorScripts,
  ...exportScripts,
  ...textScripts,
  ...effectsScripts,
  ...pathScripts,
  ...measurementScripts,
  ...imagesScripts,
  ...nestingScripts,
];

// ─── Utility functions ────────────────────────────────────────────────────────

export function getScriptById(id: string): ScriptMetadata | undefined {
  return SCRIPT_REGISTRY.find((s) => s.id === id);
}

export function getScriptsByCategory(category: string): ScriptMetadata[] {
  return SCRIPT_REGISTRY.filter((s) => s.category === category);
}

export function getServerSideScripts(): ScriptMetadata[] {
  return SCRIPT_REGISTRY.filter((s) => s.serverSide);
}

export function searchScripts(query: string): ScriptMetadata[] {
  const q = query.toLowerCase();
  return SCRIPT_REGISTRY.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
}
