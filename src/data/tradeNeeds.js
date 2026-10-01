/**
 * Trade needs seeds from fleetfit/product/trade-packages/data/trade_needs.csv
 * + product desk decisions (CLEARED §13, 2026-09-27).
 *
 * UNKNOWN stays null — never invent mi/day, payload, crew, tow, or tongue.
 * INTERNAL FL shop names from the detail CSV must never appear in UI.
 *
 * Source URLs (Sherlock, accessed 2026-09-27) live beside the CSV under
 * fleetfit/product/trade-packages/. Spot-check those; do not invent listings.
 */

/** @typedef {'Electrical'|'HVAC'|'Plumbing'|'Landscaping'|'General contracting'} TradeName */

/**
 * Binding seeds per CLEARED §13 product desk decisions.
 * Plumbing dailyMiles: null (UNKNOWN).
 * Electrical dailyMiles: 62. Crew electrical 2 / HVAC 1: use them, editable.
 * Landscaping: tows true, trailer 7000, tongue default 1050 (15%) when unset.
 */
export const TRADE_NEEDS = {
  Electrical: {
    trade: 'Electrical',
    dailyMiles: 62,
    loadLb: null,
    crew: 2,
    tows: false,
    trailerLb: null,
    tongueLb: null,
    workDayCopy:
      'Ladders on the roof, wire and parts inside, several job sites a day.',
    headerPattern: (n) => `Electrical package · ${n} vehicles`,
    sourceUrls: [
      'https://www.worktruckonline.com/news/ford-pro-e-telematics-helps-fleet-track-e-transit-efficiency',
      'https://www.fromtheroad.ford.com/us/en/articles/2024/ford-pro-marks-10-years-of-u-s--transit-by-bolstering-e-transit',
      'https://www.ecmag.com/docs/default-source/profile-reports/profile-topic-specific-reports/ec_2024_profile_breakout-report_vehicles.pdf',
      'https://www.bls.gov/ooh/construction-and-extraction/electricians.htm',
      'https://industrialladder.com/adrian-steel-4319tl148-electrical-contractor-package-ford-transit-low-roof-148-wb/',
      'https://industrialladder.com/Adrian-ELE-FTMR148B-Electrical-Package-FTM148/',
      'https://rangerdesign.com/trades/electrician-van-shelving/',
    ],
  },
  HVAC: {
    trade: 'HVAC',
    dailyMiles: 63,
    loadLb: null,
    crew: 1,
    tows: false,
    trailerLb: null,
    tongueLb: null,
    workDayCopy:
      'Service calls across town, with parts, tools, and units riding in back.',
    headerPattern: (n) => `HVAC package · ${n} vehicles`,
    sourceUrls: [
      'https://azuga.com/blog/productivity-gains-for-hvac-fleets-our-reports-highlights',
      'https://www.achrnews.com/ext/resources/2019/01-2019/1-21-2019/HVAC-Satellite-Office.pdf',
      'https://www.contractingbusiness.com/residential-hvac/article/20866156/2013-hvac-service-vehicle-survey-making-tracks',
      'https://www.bls.gov/ooh/installation-maintenance-and-repair/heating-air-conditioning-and-refrigeration-mechanics-and-installers.htm',
      'https://industrialtruckandvan.com/Adrian-HVAC-FTMR148B-HVAC-Package.FTM148/',
      'http://chadwellsupply.s3.amazonaws.com/Forms/goodman_glxs4b-r32.pdf',
      'https://rangerdesign.com/blog/upfit-truck-van-accessories/',
    ],
  },
  Plumbing: {
    trade: 'Plumbing',
    dailyMiles: null,
    loadLb: null,
    crew: 2,
    tows: false,
    trailerLb: null,
    tongueLb: null,
    workDayCopy:
      'Pipe on the rack, fittings in the bins, back-to-back service stops.',
    headerPattern: (n) => `Plumbing package · ${n} vehicles`,
    sourceUrls: [
      'https://www.worktruckonline.com/articles/keeping-hvac-and-plumbing-fleets-on-track',
      'https://www.pmmag.com/articles/86616-contractors-love-trucks',
      'https://www.bls.gov/ooh/construction-and-extraction/plumbers-pipefitters-and-steamfitters.htm',
      'https://industrialladder.com/Adrian-PLUM-FTMR148B-Plumbing-Package-FTM148/',
      'https://hvacdirect.com/media/pdf/PROG50-38N%20RH60%20spec%20sheet.pdf',
      'https://rangerdesign.com/blog/upfit-truck-van-accessories/',
      'https://www.adriansteel.com/wp-content/uploads/2023/12/Ford-Interior-Starter-Packages.pdf',
    ],
  },
  Landscaping: {
    trade: 'Landscaping',
    dailyMiles: null,
    loadLb: null,
    crew: 3,
    tows: true,
    trailerLb: 7000,
    /** Default 15% of trailer when user has not entered tongue. */
    tongueLb: 1050,
    workDayCopy:
      'Crew and equipment out on a trailer, route of properties, back to the yard.',
    headerPattern: (n) => `Landscaping package · ${n} vehicles`,
    sourceUrls: [
      'https://www.spencertrailers.com/best-trailers-for-landscaping-businesses-in-2024/',
      'https://stage.landscapemanagement.net/tips-for-determining-your-ideal-maintenance-crew-size/',
      'https://stage.landscapemanagement.net/lm-state-of-the-industry-something-to-smile-about/',
      'https://commercialfleetvehicles.com/industries/landscaping-companies/',
      'https://www.bls.gov/ooh/building-and-grounds-cleaning/grounds-maintenance-workers.htm',
    ],
  },
  'General contracting': {
    trade: 'General contracting',
    dailyMiles: null,
    loadLb: null,
    crew: null,
    tows: false,
    trailerLb: null,
    tongueLb: null,
    workDayCopy:
      'Materials and tools to the site, supply runs, crew to and from the job.',
    headerPattern: (n) => `General contracting package · ${n} vehicles`,
    sourceUrls: [
      'https://www.knapheide.com/industries/skilled-trades',
      'https://www.bls.gov/ooh/construction-and-extraction/construction-laborers-and-helpers.htm',
    ],
  },
}

export const TRADE_PACKAGE_COPY = {
  entry: 'Trade packages',
  helper: 'Pick your trade. We’ve lined up real listings you can trim.',
  fleetSize: 'Fleet size',
  removeAria: 'Remove',
  removedToast: 'Removed from package.',
  undo: 'Undo',
  buildYourOwn: 'Build your own',
  buildYourOwnHelper: 'Start from scratch on the intake form.',
  sellerUnavailable: 'Seller listing not available',
  nextRankedAdded: 'Next-ranked unit added.',
  combinedDeadReplace: 'Seller listing not available. Next-ranked unit added.',
  noOtherListing: 'No other listing ranks for this spot yet.',
  emptyPackage: 'Package is empty. Add a unit or build your own.',
  addPackageToFleet: 'Add package to fleet',
  addUnit: 'Add unit',
  orderedByScore: 'Ordered by score',
  unitsTitle: 'Units',
  unitsSubcaption: 'Replacement score, high → low',
  packageTotalExample: 'Package total · example',
  editJobNumbers:
    'These job numbers are a starting point. Tap any to change it, and fill in the blank ones.',
  editJobNumbersShort: 'Edit any job number. Fill in the blanks.',
  addYours: 'Add yours',
  atSizeFive: 'This package has 5 units. Remove one to add another.',
  addCurrentBanner: 'Add your current vehicle to compare',
  nextRankedFilledSlot: 'Next-ranked unit filled the open slot. Total updated.',
  exampleDataTag: 'Example data',
  tradePackageKicker: 'TRADE PACKAGE · EXAMPLE',
  scoreFoot:
    'Score = replacement score out of points possible, relative to the vehicle being replaced.',
  conceptFoot:
    'Concept mock · FleetFit · all units, prices and scores are examples.',
}

export const JOB_STORAGE_KEY = 'fleetfit-trade-package-job'

export function tradeNeedsFor(trade) {
  if (!trade) return null
  const key = String(trade)
  if (TRADE_NEEDS[key]) return TRADE_NEEDS[key]
  if (/landscap/i.test(key) || /lawn/i.test(key)) return TRADE_NEEDS.Landscaping
  if (/hvac/i.test(key)) return TRADE_NEEDS.HVAC
  if (/plumb/i.test(key)) return TRADE_NEEDS.Plumbing
  if (/electric/i.test(key)) return TRADE_NEEDS.Electrical
  if (/general|contract/i.test(key)) return TRADE_NEEDS['General contracting']
  return null
}
