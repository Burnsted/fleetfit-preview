/**
 * CLEARED OEM specs · oem-cargo-kwh-20260926-1910
 * Real OEM / EPA published values only. Never invent.
 * Sources live here for Steve spot-check — not shown in UI.
 *
 * Key: year|make|model|trim (normalized). Aliases cover listing trim variants.
 */

export const OEM_SPECS_BUILD = 'oem-score-v2-f-20260927-1400'

/** @typedef {{
 *  payloadLb: number|null,
 *  towingLb: number|null,
 *  epaRangeMi: number|null,
 *  usableKwh: number|null,
 *  drivetrain: string|null,
 *  bedLength: string|null,
 *  cargoCuFt: number|null,
 *  gvwrLb: number|null,
 *  curbLb: number|null,
 *  cab: string|null,
 *  onboardAcKw: number|null,
 *  dcFastMaxKw: number|null,
 *  note?: string,
 *  sources: Record<string, string>,
 * }} OemSpec */

/** @type {Record<string, OemSpec>} */
const BY_KEY = {
  // 2023 Ford E-Transit Cargo / Base — listed unit is Medium Roof 130" WB (Zeigler VDP)
  '2023|ford|e-transit|base': {
    payloadLb: 3880,
    towingLb: null, // Ford 2023 RV & Trailer Towing Guide: E-Transit not recommended for trailer towing
    epaRangeMi: 126, // Ford targeted / EPA-method projection for low-roof cargo
    usableKwh: 68,
    drivetrain: 'RWD',
    bedLength: null,
    cargoCuFt: 358.7, // Regular / Medium Roof max cargo (Ford config chart)
    // GVWR FACT from SOURCES-V2 B (b_preview_ev_specs) / Bob Swope + Ford tech specs
    gvwrLb: 9500,
    // Curb: no single published curb for this trim in SOURCES-V2 → Not published
    curbLb: null,
    seats: null,
    epaKwhPer100mi: null,
    towLbNoWdh: null,
    battWarrantyYr: 8,
    battWarrantyMi: 100000,
    warrantyProgram: 'consumer',
    maintClass: 'van',
    cab: 'Cargo van',
    onboardAcKw: 11.3,
    dcFastMaxKw: 115,
    note: 'Listed Zeigler unit is Medium Roof 130" WB → Ford Regular/Medium max cargo 358.7 cu ft (315.2 behind first row). Tow unpublished — Ford guide not recommended for trailer towing. GVWR 9,500 lb from SOURCES-V2 B.',
    sources: {
      payloadLb: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      usableKwh: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      epaRangeMi: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      towingLb: 'https://www.ford.com/content/dam/brand_ford/en_us/brand/towing/pdf/2023-Ford-RV-and-Trailer-Towing-Guide.pdf',
      onboardAcKw: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      cargoCuFt: 'https://www.imlaycityfordsales.com/research-ford-etransit.html',
      gvwrLb: 'https://learn.bobswopeford.com/models/ford/e-transit/2023',
    },
  },
  '2023|ford|e-transit|cargo 250': {
    // Alias → same as Base cargo van when listing uses Cargo 250
    payloadLb: 3880,
    towingLb: null,
    epaRangeMi: 126,
    usableKwh: 68,
    drivetrain: 'RWD',
    bedLength: null,
    cargoCuFt: 358.7,
    gvwrLb: 9500,
    curbLb: null,
    seats: null,
    epaKwhPer100mi: null,
    towLbNoWdh: null,
    battWarrantyYr: 8,
    battWarrantyMi: 100000,
    warrantyProgram: 'consumer',
    maintClass: 'van',
    cab: 'Cargo van',
    onboardAcKw: 11.3,
    dcFastMaxKw: 115,
    note: 'Mapped from Cargo 250 listing trim to Ford E-Transit Medium Roof 130" WB cargo figures. GVWR 9,500 lb from SOURCES-V2 B.',
    sources: {
      payloadLb: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      usableKwh: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      epaRangeMi: 'https://media.ford.com/content/fordmedia/fna/us/en/products/evs/e-transit/2022-ford-e-transit.html',
      towingLb: 'https://www.ford.com/content/dam/brand_ford/en_us/brand/towing/pdf/2023-Ford-RV-and-Trailer-Towing-Guide.pdf',
      cargoCuFt: 'https://www.imlaycityfordsales.com/research-ford-etransit.html',
      gvwrLb: 'https://learn.bobswopeford.com/models/ford/e-transit/2023',
    },
  },

  // 2024 Chevrolet Silverado EV Work Truck (4WT long-range pack — listing "Work Truck")
  '2024|chevrolet|silverado ev|work truck': {
    payloadLb: 1440,
    towingLb: 10000,
    epaRangeMi: 450,
    usableKwh: 205,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: 8568,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 350,
    note: '4WT long-range Work Truck figures (GM / Chevy confirmed tow & payload). Usable pack ~205 kWh from Ultium 24-module pack reporting.',
    sources: {
      payloadLb: 'https://www.greencarreports.com/news/1140037_chevrolet-silverado-ev-work-truck-tow-payload-confirmed',
      towingLb: 'https://www.greencarreports.com/news/1140037_chevrolet-silverado-ev-work-truck-tow-payload-confirmed',
      epaRangeMi: 'https://gmauthority.com/blog/gm/chevrolet/silverado/silverado-ev-electric/2024-chevrolet-silverado-ev/2024-chevrolet-silverado-ev-specifications/',
      usableKwh: 'https://gmauthority.com/blog/gm/chevrolet/silverado/silverado-ev-electric/2024-chevrolet-silverado-ev/2024-chevrolet-silverado-ev-specifications/',
      curbLb: 'https://gmauthority.com/blog/gm/chevrolet/silverado/silverado-ev-electric/2024-chevrolet-silverado-ev/2024-chevrolet-silverado-ev-specifications/',
      onboardAcKw: 'https://www.caranddriver.com/reviews/a44325529/2024-chevrolet-silverado-ev-work-truck-drive/',
      dcFastMaxKw: 'https://www.caranddriver.com/reviews/a44325529/2024-chevrolet-silverado-ev-work-truck-drive/',
    },
  },
  '2024|chevrolet|silverado ev|wt': {
    payloadLb: 1440,
    towingLb: 10000,
    epaRangeMi: 450,
    usableKwh: 205,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: 8568,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 350,
    note: 'Alias for Work Truck / WT listing trim.',
    sources: {
      payloadLb: 'https://www.greencarreports.com/news/1140037_chevrolet-silverado-ev-work-truck-tow-payload-confirmed',
      towingLb: 'https://www.greencarreports.com/news/1140037_chevrolet-silverado-ev-work-truck-tow-payload-confirmed',
      epaRangeMi: 'https://gmauthority.com/blog/gm/chevrolet/silverado/silverado-ev-electric/2024-chevrolet-silverado-ev/2024-chevrolet-silverado-ev-specifications/',
    },
  },

  // 2022 Ford F-150 Lightning Pro (standard-range)
  '2022|ford|f-150 lightning|pro': {
    payloadLb: 2235,
    towingLb: 5000,
    epaRangeMi: 230,
    usableKwh: 98,
    drivetrain: 'AWD',
    bedLength: '5.5 ft',
    cargoCuFt: null,
    gvwrLb: 8250,
    curbLb: null,
    cab: 'SuperCrew',
    onboardAcKw: 11.3,
    dcFastMaxKw: 150,
    note: 'Standard-range Pro per Ford Lightning Tech Specs PDF. Max tow 5,000 lb base; 7,700 with Max Trailer Tow Package — base published used.',
    sources: {
      payloadLb: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      towingLb: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      epaRangeMi: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      usableKwh: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      gvwrLb: 'https://www.caranddriver.com/ford/f-150-lightning/specs/2022/ford_f-150-electric_ford-f-150-lightning_2022',
      onboardAcKw: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
    },
  },

  // 2023 Ford F-150 Lightning XLT (listing) — same published Lightning family; use SR XLT when pack unknown
  '2023|ford|f-150 lightning|xlt': {
    payloadLb: null, // MY23 door-jamb specific; not publishing a borrowed 2022 Pro max without MY23 sheet
    towingLb: 5000,
    epaRangeMi: 230,
    usableKwh: 98,
    drivetrain: 'AWD',
    bedLength: '5.5 ft',
    cargoCuFt: null,
    gvwrLb: 8250,
    curbLb: null,
    cab: 'SuperCrew',
    onboardAcKw: 11.3,
    dcFastMaxKw: 150,
    note: 'EPA 230 mi / 98 kWh SR class aligned with Lightning SR family. Payload left null — MY23 XLT door-jamb max not confirmed in this ship.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/',
      usableKwh: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      towingLb: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      gvwrLb: 'https://www.caranddriver.com/ford/f-150-lightning/specs/2022/ford_f-150-electric_ford-f-150-lightning_2022',
    },
  },
  '2025|ford|f-150 lightning|xlt': {
    payloadLb: null,
    towingLb: 5000,
    epaRangeMi: 230,
    usableKwh: 98,
    drivetrain: 'AWD',
    bedLength: '5.5 ft',
    cargoCuFt: null,
    gvwrLb: 8250,
    curbLb: null,
    cab: 'SuperCrew',
    onboardAcKw: 11.3,
    dcFastMaxKw: 150,
    note: 'Landscape seed unit — SR-class published figures; payload Not published without MY25 trim sheet match.',
    sources: {
      usableKwh: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
      epaRangeMi: 'https://www.fueleconomy.gov/',
      towingLb: 'https://media.ford.com/content/dam/fordmedia/North%20America/US/product/2022/f-150-lightning/pdf/F-150_Lightning_Tech_Specs.pdf',
    },
  },

  // 2024 RAM ProMaster EV Super High Roof (delivery / SHR)
  '2024|ram|promaster ev|super high roof': {
    payloadLb: 2782,
    towingLb: null,
    epaRangeMi: 162, // OEM targeted city range
    usableKwh: 110,
    drivetrain: 'FWD',
    bedLength: null,
    cargoCuFt: 524,
    gvwrLb: 9350,
    curbLb: 6568,
    cab: 'Cargo van',
    onboardAcKw: 11,
    dcFastMaxKw: 150,
    note: '3500 159" WB Ext. Super High Roof delivery hot-sheet (Stellantis / CA HVIP). City range targeted up to 162 mi.',
    sources: {
      payloadLb: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      usableKwh: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      epaRangeMi: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      cargoCuFt: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      gvwrLb: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      curbLb: 'https://californiahvip.org/wp-content/uploads/2024/05/AL-MY24-Ram-ProMaster-BEV-Delivery-Van-Hot-Sheets-010424-spec-sheet-240528.pdf',
      dcFastMaxKw: 'https://media.stellantisnorthamerica.com/newsrelease.do?id=25617&mid=1548',
    },
  },
  '2023|ram|promaster ev|cargo': {
    payloadLb: 3020,
    towingLb: null,
    epaRangeMi: 162,
    usableKwh: 110,
    drivetrain: 'FWD',
    bedLength: null,
    cargoCuFt: 524, // Stellantis press: ProMaster EV offers 524 cu ft (cargo volume unchanged vs ICE max)
    gvwrLb: null,
    curbLb: null,
    cab: 'Cargo van',
    onboardAcKw: 11,
    dcFastMaxKw: 150,
    note: 'Stellantis press: cargo config up to 3,020 lb payload; 110 kWh; city range up to 162 mi; 524 cu ft cargo.',
    sources: {
      payloadLb: 'https://media.stellantisnorthamerica.com/newsrelease.do?id=25617&mid=1548',
      usableKwh: 'https://media.stellantisnorthamerica.com/newsrelease.do?id=25617&mid=1548',
      epaRangeMi: 'https://media.stellantisnorthamerica.com/newsrelease.do?id=25617&mid=1548',
      cargoCuFt: 'https://media.stellantisnorthamerica.com/newsrelease.do?id=25617&mid=1548',
    },
  },

  // 2026 GMC Sierra EV Standard Range Elevation
  // GVWR + curb: not published in SOURCES-V2 B for Sierra EV → Not published (do not invent)
  '2026|gmc|sierra ev|standard range elevation': {
    payloadLb: 2250,
    towingLb: 8500,
    epaRangeMi: 283,
    usableKwh: 120,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    seats: null,
    epaKwhPer100mi: null,
    towLbNoWdh: 8500,
    battWarrantyYr: 8,
    battWarrantyMi: 100000,
    warrantyProgram: 'consumer',
    maintClass: 'ev-pickup',
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 300,
    note: 'Elevation Standard Range — EPA-est. 283 mi; 8,500 lb tow / 2,250 lb payload (GMC trim table). 120 kWh SR pack (14-module). GVWR/curb Not published in SOURCES-V2.',
    sources: {
      epaRangeMi: 'https://www.gmc.com/electric/sierra-ev',
      payloadLb: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
      towingLb: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
      usableKwh: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
    },
  },
  '2026|gmc|sierra ev|elevation': {
    payloadLb: 2250,
    towingLb: 8500,
    epaRangeMi: 283,
    usableKwh: 120,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    seats: null,
    epaKwhPer100mi: null,
    towLbNoWdh: 8500,
    battWarrantyYr: 8,
    battWarrantyMi: 100000,
    warrantyProgram: 'consumer',
    maintClass: 'ev-pickup',
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 300,
    note: 'Listing trim "Elevation" without Extended Range → Standard Range published figures. GVWR/curb Not published in SOURCES-V2.',
    sources: {
      epaRangeMi: 'https://www.gmc.com/electric/sierra-ev',
      payloadLb: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
      towingLb: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
      usableKwh: 'https://www.octanegmc.com/new-gmc-sierra-ev.htm',
    },
  },

  // 2025 Chevrolet BrightDrop 600 (listing FWD, trim blank)
  '2025|chevrolet|brightdrop 600|': {
    payloadLb: 3350,
    towingLb: null,
    epaRangeMi: 174,
    usableKwh: 102.4,
    drivetrain: 'FWD',
    bedLength: null,
    cargoCuFt: 614.7,
    gvwrLb: 9990,
    curbLb: null,
    cab: 'Cargo van',
    onboardAcKw: 11.5,
    dcFastMaxKw: 120,
    note: 'FWD Standard Range BrightDrop 600 — EPA 174 mi combined; max FWD payload 3,350 lb; cargo 614.7 cu ft (Chevrolet).',
    sources: {
      payloadLb: 'https://www.chevrolet.com/commercial/brightdrop',
      epaRangeMi: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      usableKwh: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      cargoCuFt: 'https://www.chevrolet.com/commercial/brightdrop',
      gvwrLb: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      onboardAcKw: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      dcFastMaxKw: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
    },
  },
  '2025|chevrolet|brightdrop 600|zevo 600': {
    payloadLb: 3350,
    towingLb: null,
    epaRangeMi: 174,
    usableKwh: 102.4,
    drivetrain: 'FWD',
    bedLength: null,
    cargoCuFt: 614.7,
    gvwrLb: 9990,
    curbLb: null,
    cab: 'Cargo van',
    onboardAcKw: 11.5,
    dcFastMaxKw: 120,
    note: 'Alias for package trim Zevo 600.',
    sources: {
      payloadLb: 'https://www.chevrolet.com/commercial/brightdrop',
      epaRangeMi: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      usableKwh: 'https://www.electricmotornews.com/gb/veicoli-ecologici/chevrolet-brightdrop-600/',
      cargoCuFt: 'https://www.chevrolet.com/commercial/brightdrop',
    },
  },

  // 2026 Silverado EV Trail Boss Extended Range 4WD
  '2026|chevrolet|silverado ev|trail boss - extended range 4wd': {
    payloadLb: null,
    towingLb: null,
    epaRangeMi: null,
    usableKwh: null,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 350,
    note: 'MY26 Trail Boss ER — drivetrain/cab/bed/charger from Silverado EV family; payload/tow/range/kWh left Not published pending Chevy MY26 Trail Boss trim sheet match.',
    sources: {
      drivetrain: 'https://www.chevrolet.com/electric/silverado-ev',
      onboardAcKw: 'https://www.chevrolet.com/electric/silverado-ev',
    },
  },

  // 2026 Silverado EV LT Standard Range 4WD
  '2026|chevrolet|silverado ev|lt - standard range 4wd': {
    payloadLb: null,
    towingLb: null,
    epaRangeMi: null,
    usableKwh: null,
    drivetrain: 'e4WD',
    bedLength: '5 ft 11 in',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 350,
    note: 'MY26 LT SR — family chassis fields only; numeric capability Not published without LT SR OEM sheet.',
    sources: {
      drivetrain: 'https://www.chevrolet.com/electric/silverado-ev',
    },
  },

  // 2022 Rivian R1T Adventure → Quad Large (SOURCES-V2 A / EPA id 44462)
  '2022|rivian|r1t|adventure': {
    payloadLb: 1764,
    towingLb: 11000,
    epaRangeMi: 314,
    usableKwh: 131, // a_r1t_specs.csv FACT
    drivetrain: 'AWD',
    bedLength: '4.5 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: 7173,
    seats: null,
    epaKwhPer100mi: 48.1,
    towLbNoWdh: 5000,
    battWarrantyYr: 8,
    battWarrantyMi: 175000,
    warrantyProgram: 'consumer',
    maintClass: 'ev-pickup',
    cab: 'Crew',
    onboardAcKw: 11.5,
    dcFastMaxKw: 200,
    note: 'Adventure mapped to Quad Large (EPA 44462). Payload/tow/kWh/warranty from SOURCES-V2 A.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/feg/noframes/44462.shtml',
      payloadLb: 'https://rivian.com/support/article/what-is-the-maximum-payload',
      towingLb: 'https://rivian.com/support/article/what-is-the-maximum-towing-capacity',
      curbLb: 'https://www.iseecars.com/car/2022-rivian-r1t-specs',
      usableKwh: 'https://rivian.com/support/article/what-is-the-usable-kwh-capacity-of-your-batteries',
      epaKwhPer100mi: 'https://www.fueleconomy.gov/feg/noframes/44462.shtml',
      battWarrantyYr:
        'https://assets.ctfassets.net/2md5qhoeajym/3jyOsY7odpa35j9Yzb0KXK/edc6d556b122b351117b409a9bb8cf8a/r1t_r1s-new-vehicle-limited-warranty-guide-us-en-us-20260813.pdf',
    },
  },
  '2022|rivian|r1t|adventure dual-motor': {
    payloadLb: 1764,
    towingLb: 11000,
    epaRangeMi: 314,
    usableKwh: 131,
    drivetrain: 'AWD',
    bedLength: '4.5 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: 7173,
    seats: null,
    epaKwhPer100mi: 48.1,
    towLbNoWdh: 5000,
    battWarrantyYr: 8,
    battWarrantyMi: 175000,
    warrantyProgram: 'consumer',
    maintClass: 'ev-pickup',
    cab: 'Crew',
    onboardAcKw: 11.5,
    dcFastMaxKw: 200,
    note: 'Alias for seed listing trim Adventure Dual-Motor → Quad Large score inputs.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/feg/noframes/44462.shtml',
      payloadLb: 'https://rivian.com/support/article/what-is-the-maximum-payload',
      towingLb: 'https://rivian.com/support/article/what-is-the-maximum-towing-capacity',
    },
  },

  // 2024 + 2025 Tesla Cybertruck Base / AWD
  '2024|tesla|cybertruck|base': {
    payloadLb: 2500,
    towingLb: 11000,
    epaRangeMi: 325,
    usableKwh: null, // Tesla does not publish usable kWh for Cybertruck
    drivetrain: 'AWD',
    bedLength: '6 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 11.5,
    dcFastMaxKw: 250,
    note: 'Dual Motor AWD / Base listing — EPA ~325 mi; Tesla published payload up to 2,500 lb and tow 11,000 lb. Usable kWh Not published by Tesla.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/',
      payloadLb: 'https://www.tesla.com/cybertruck',
      towingLb: 'https://www.tesla.com/cybertruck',
    },
  },
  '2024|tesla|cybertruck|awd': {
    payloadLb: 2500,
    towingLb: 11000,
    epaRangeMi: 325,
    usableKwh: null,
    drivetrain: 'AWD',
    bedLength: '6 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 11.5,
    dcFastMaxKw: 250,
    note: 'Alias for seed AWD trim.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/',
      payloadLb: 'https://www.tesla.com/cybertruck',
      towingLb: 'https://www.tesla.com/cybertruck',
    },
  },
  '2025|tesla|cybertruck|base': {
    payloadLb: 2500,
    towingLb: 11000,
    epaRangeMi: 325,
    usableKwh: null,
    drivetrain: 'AWD',
    bedLength: '6 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 11.5,
    dcFastMaxKw: 250,
    note: 'MY25 Base — same published Dual Motor capability class; usable kWh still Not published.',
    sources: {
      payloadLb: 'https://www.tesla.com/cybertruck',
      towingLb: 'https://www.tesla.com/cybertruck',
      epaRangeMi: 'https://www.fueleconomy.gov/',
    },
  },

  // 2023 GMC HUMMER EV Pickup 3X
  '2023|gmc|hummer ev pickup|3x': {
    payloadLb: 1300,
    towingLb: 7500,
    epaRangeMi: 314,
    usableKwh: 212,
    drivetrain: 'e4WD',
    bedLength: '5 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 300,
    note: 'Edition 1 / 3X class — EPA ~314 mi; payload ~1,300 lb; tow commonly published 7,500 lb for early 3X (GM).',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/',
      payloadLb: 'https://www.gmc.com/electric/hummer-ev/pickup',
      towingLb: 'https://www.gmc.com/electric/hummer-ev/pickup',
      usableKwh: 'https://gmauthority.com/blog/gm/gmc/hummer-ev/',
    },
  },
  '2023|gmc|hummer ev|pickup 3x': {
    payloadLb: 1300,
    towingLb: 7500,
    epaRangeMi: 314,
    usableKwh: 212,
    drivetrain: 'e4WD',
    bedLength: '5 ft',
    cargoCuFt: null,
    gvwrLb: null,
    curbLb: null,
    cab: 'Crew',
    onboardAcKw: 19.2,
    dcFastMaxKw: 300,
    note: 'Alias for seed model Hummer EV / trim Pickup 3X.',
    sources: {
      epaRangeMi: 'https://www.fueleconomy.gov/',
      payloadLb: 'https://www.gmc.com/electric/hummer-ev/pickup',
      towingLb: 'https://www.gmc.com/electric/hummer-ev/pickup',
    },
  },
}

function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function oemSpecKey({ year, make, model, trim } = {}) {
  return `${year}|${norm(make)}|${norm(model)}|${norm(trim)}`
}

export function lookupOemSpec(vehicle) {
  if (!vehicle?.year || !vehicle?.make || !vehicle?.model) return null
  const key = oemSpecKey(vehicle)
  if (BY_KEY[key]) return { key, spec: BY_KEY[key] }
  // Try blank trim
  const blank = oemSpecKey({ ...vehicle, trim: '' })
  if (BY_KEY[blank]) return { key: blank, spec: BY_KEY[blank] }
  // Try model without EV suffix variants already covered
  return null
}

/**
 * Merge OEM published fields onto a unit/listing.
 * Existing non-null listing/unit values win (dealer stated).
 * Never invent — null stays null → UI "Not published".
 */
export function mergeOemSpecs(vehicle) {
  if (!vehicle) return vehicle
  const hit = lookupOemSpec(vehicle)
  if (!hit) {
    return { ...vehicle, oemSpecKey: null, oemSpecsBuild: OEM_SPECS_BUILD }
  }
  const s = hit.spec
  const pick = (current, oem) => (current != null && current !== '' ? current : oem)

  const next = {
    ...vehicle,
    oemSpecKey: hit.key,
    oemSpecsBuild: OEM_SPECS_BUILD,
    payload: pick(vehicle.payload, s.payloadLb),
    tow: pick(vehicle.tow ?? vehicle.towingLb, s.towingLb),
    towingLb: pick(vehicle.towingLb ?? vehicle.tow, s.towingLb),
    ratedRange: pick(vehicle.ratedRange, s.epaRangeMi),
    gvwr: pick(vehicle.gvwr ?? vehicle.gvwrLb, s.gvwrLb),
    gvwrLb: pick(vehicle.gvwrLb ?? vehicle.gvwr, s.gvwrLb),
    curb: pick(vehicle.curb ?? vehicle.curbLb, s.curbLb),
    curbLb: pick(vehicle.curbLb ?? vehicle.curb, s.curbLb),
    onboardAcKw: pick(vehicle.onboardAcKw ?? vehicle.onboardChargerKw, s.onboardAcKw),
    cab: pick(vehicle.cab, s.cab),
    bed: pick(vehicle.bed, s.bedLength),
    cargoCuFt: pick(vehicle.cargoCuFt ?? vehicle.cargoVolume ?? vehicle.cargo, s.cargoCuFt),
    cargoVolume: pick(vehicle.cargoVolume ?? vehicle.cargo ?? vehicle.cargoCuFt, s.cargoCuFt),
    drivetrain: pick(vehicle.drivetrain, s.drivetrain),
    onboardChargerKw: pick(
      vehicle.onboardChargerKw ?? vehicle.onboardAcKw,
      s.onboardAcKw,
    ),
    dcFastMaxKw: pick(vehicle.dcFastMaxKw, s.dcFastMaxKw),
    seats: pick(vehicle.seats, s.seats),
    epaKwhPer100mi: pick(vehicle.epaKwhPer100mi, s.epaKwhPer100mi),
    towLbNoWdh: pick(vehicle.towLbNoWdh, s.towLbNoWdh),
    battWarrantyYr: pick(vehicle.battWarrantyYr, s.battWarrantyYr),
    battWarrantyMi: pick(vehicle.battWarrantyMi, s.battWarrantyMi),
    warrantyProgram: pick(vehicle.warrantyProgram, s.warrantyProgram),
    maintClass: pick(vehicle.maintClass, s.maintClass),
  }

  const usable = pick(vehicle.battery?.usableKwh ?? vehicle.usableKwh, s.usableKwh)
  if (vehicle.battery || usable != null) {
    next.battery = {
      ...(vehicle.battery || {}),
      usableKwh: usable,
      // soh stays dealer-only — never fill from OEM
      soh: vehicle.battery?.soh ?? null,
    }
  }
  if (usable != null) next.usableKwh = usable

  return next
}

export function listOemSpecCoverage() {
  return Object.entries(BY_KEY).map(([key, spec]) => ({
    key,
    payloadLb: spec.payloadLb,
    towingLb: spec.towingLb,
    epaRangeMi: spec.epaRangeMi,
    usableKwh: spec.usableKwh,
  }))
}
