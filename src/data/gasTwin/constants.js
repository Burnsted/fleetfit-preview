/** Gas twin Option 1 — copy and constants (FleetFit naming only). */

export const GAS_TWIN_BUILD = 'gas-twin-option1-20261003'

export const NOT_CONFIRMED = 'not confirmed'

export const COPY = {
  controlLabel: 'Compare with gas twin',
  off: 'Off',
  on: 'On',
  overYears: (n) => `Over ${n} years`,
  years3: '3 years',
  years5: '5 years',
  years7: '7 years',
  whyThisTwin: 'Why this twin',
  fullComparison: 'Full comparison',
  otherCandidates: 'Other candidates considered',
  scoreCaption: 'Spec and price score, not a quality rating.',
  howScored: 'How we scored and estimated',
  addMiles: 'Add your yearly miles to see this.',
  gasTwinMissing: 'Gas twin not confirmed',
  notConfirmed: NOT_CONFIRMED,
  roughMatch: 'Rough match',
  fleetTotal: 'Fleet total',
  suggestedEv: 'Suggested EV',
  gasTwin: 'Gas twin',
  close: 'Close',
  upfront: 'Upfront',
  perYear: 'Per year',
  overNYears: (n) => `Over ${n} years`,
  overNYearsAfter: (n) => `Over ${n} years, after the upfront price difference`,
  estimateFooter:
    'Estimates use Florida energy prices, the miles per year you entered, and listed prices. Not a quote.',
  insuranceNote: 'Insurance is not included yet.',
  milesLabel: 'Yearly miles per vehicle',
  milesHelper: 'Starting value from your answer, change it',
  inferenceFootnote: 'Score is an estimate from listed specs.',
  notEnoughData: 'not enough confirmed data',
  scoredOn: (n, of) => `Scored on ${n} of ${of} factors`,
  classLevelMaint: 'Maintenance is class-level AFDC.',
}

export const YEAR_OPTIONS = [3, 5, 7]
export const DEFAULT_YEARS = 5
/** Ted 10/3: starting yearly miles. Cleared field still shows add-miles state. */
export const DEFAULT_YEARLY_MILES = 20000

/** AFDC class-level maintenance USD per mile (also carried on FACT rows). */
export const AFDC_MAINT_EV_USD_PER_MI = 0.061
export const AFDC_MAINT_GAS_USD_PER_MI = 0.101

export const OVERALL_POINTS_FLOOR = 60

export const FACTOR_ROWS = [
  {
    key: 'payload',
    label: 'Payload',
    unitSuffix: 'lb',
    tedFactor: 'TED:Payload/cargo fit',
    closenessField: 'scorePayloadCloseness',
  },
  {
    key: 'tow',
    label: 'Towing capacity',
    unitSuffix: 'lb',
    tedFactor: 'TED:Tow fit',
    closenessField: 'scoreTowCloseness',
  },
  {
    key: 'cargo',
    label: 'Cargo or bed size',
    unitSuffix: '',
    tedFactor: 'TED:Payload/cargo fit',
    closenessField: 'scoreCargoCloseness',
  },
  {
    key: 'cab',
    label: 'Cab size',
    unitSuffix: 'seats',
    tedFactor: 'TED:Cab/crew fit',
    closenessField: 'scoreCabCloseness',
  },
  {
    key: 'range',
    label: 'Range',
    unitSuffix: 'mi',
    tedFactor: 'TED:Range fit',
    closenessField: 'scoreRangeCloseness',
  },
  {
    key: 'tow_range',
    label: 'Towing range',
    unitSuffix: 'mi',
    tedFactor: null,
    closenessField: null,
    onlyIfConfirmed: true,
  },
  {
    key: 'msrp',
    label: 'New price',
    unitSuffix: 'usd',
    tedFactor: null,
    closenessField: 'scorePriceCloseness',
  },
  {
    key: 'resale_3yr_retained',
    label: 'Resale value',
    unitSuffix: 'pct',
    tedFactor: 'TED:Resale (3-yr retained %)',
    closenessField: null,
  },
]
