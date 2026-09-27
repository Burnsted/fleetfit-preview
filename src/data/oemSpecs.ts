/**
 * OEM specs — TypeScript entry (Score v2 §5).
 * Implementation remains in oemSpecs.js; this re-exports for TS imports.
 */
export {
  OEM_SPECS_BUILD,
  oemSpecKey,
  lookupOemSpec,
  mergeOemSpecs,
  listOemSpecCoverage,
} from './oemSpecs.js'
