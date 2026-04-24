import React from 'react';
import { ScriptPanelProps } from './types';
import { CreateGuidesPanel } from './CreateGuidesPanel';

// Standalone panels: manage their own state entirely, need no props from ScriptCard
import { LargeScaleExport } from '../components/LargeScaleExport';
import { SplitOverlapArtboards } from '../components/SplitOverlapArtboards';
import { AIEnhance } from '../components/AIEnhance';
import { OpenPDF } from '../components/OpenPDF';
import { DataMerge } from '../components/DataMerge';
import { TextStyleRules } from '../components/TextStyleRules';
import { ArtboardSizeTableExport } from '../components/ArtboardSizeTableExport';

// Panels that receive params/execution props from ScriptCard
export const PARAM_PANELS: Record<string, React.FC<ScriptPanelProps>> = {
    'create-guides': CreateGuidesPanel,
};

// Panels that are fully self-contained (no props needed)
export const STANDALONE_PANELS: Record<string, React.FC> = {
    'export-large-scale': LargeScaleExport,
    'split-overlap-artboards': SplitOverlapArtboards,
    'ai-enhance': AIEnhance,
    'open-pdf': OpenPDF,
    'data-merge': DataMerge,
    'text-style-rules': TextStyleRules,
    'export-artboard-size-table': ArtboardSizeTableExport,
};

// Returns true if a script ID has a registered panel (standalone or param-based)
export function hasRegisteredPanel(scriptId: string): boolean {
    return scriptId in STANDALONE_PANELS || scriptId in PARAM_PANELS;
}
