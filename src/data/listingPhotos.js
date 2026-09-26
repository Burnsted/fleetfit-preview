/**
 * FACT Hot Deals listing photos for considered units.
 * Thumbnails are the dealer listing image for that for-sale row.
 * Never invent VIN / price / miles / dealer. No Commons / OEM stock.
 */
import unit_e1 from '../assets/listings/unit-e1.webp'
import unit_e2 from '../assets/listings/unit-e2.webp'
import unit_e3 from '../assets/listings/unit-e3.webp'
import unit_e4 from '../assets/listings/unit-e4.webp'
import unit_l1 from '../assets/listings/unit-l1.webp'
import unit_l2 from '../assets/listings/unit-l2.webp'
import vnd_001 from '../assets/listings/vnd-001.webp'
import vnd_002 from '../assets/listings/vnd-002.webp'
import vnd_003 from '../assets/listings/vnd-003.webp'
import vnd_004 from '../assets/listings/vnd-004.webp'
import vnd_005 from '../assets/listings/vnd-005.webp'
import vnd_006 from '../assets/listings/vnd-006.webp'
import vnd_007 from '../assets/listings/vnd-007.webp'
import vnd_008 from '../assets/listings/vnd-008.webp'

export const LISTING_PHOTO_FILES = {
  'unit-e1': unit_e1,
  'unit-e2': unit_e2,
  'unit-e3': unit_e3,
  'unit-e4': unit_e4,
  'unit-l1': unit_l1,
  'unit-l2': unit_l2,
  'vnd-001': vnd_001,
  'vnd-002': vnd_002,
  'vnd-003': vnd_003,
  'vnd-004': vnd_004,
  'vnd-005': vnd_005,
  'vnd-006': vnd_006,
  'vnd-007': vnd_007,
  'vnd-008': vnd_008,
}

export const LISTING_ALIASES = {
  'strip-lightning': 'unit-e3',
  'strip-cyber': 'vnd-006',
  'strip-r1t': 'vnd-005',
  'hero': 'unit-e3',
}

export const LISTING_ROWS = {
  'unit-e1': {"id": "unit-e1", "year": 2023, "make": "Ford", "model": "E-Transit", "trim": "T-350 Medium Roof", "price_usd": 27537, "mileage": 3161, "dealer": "Huntley Ford", "city": "Huntley", "state": "IL", "listing_url": "https://www.cars.com/vehicledetail/ea1e287e-76cc-4e52-b95d-3e2a7d820707/", "source_site": "Cars.com", "drivetrain": "Rear-wheel Drive", "has_photo": true},
  'unit-e2': {"id": "unit-e2", "year": 2026, "make": "Chevrolet", "model": "Silverado EV", "trim": "LT - Extended Range 4WD", "price_usd": 57340, "mileage": 992, "dealer": "Chevrolet of Culver City", "city": "Culver City", "state": "CA", "listing_url": "https://www.cars.com/vehicledetail/adb6ff99-036c-48f0-b0ee-148861064025/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'unit-e3': {"id": "unit-e3", "year": 2022, "make": "Ford", "model": "F-150 Lightning", "trim": "Pro", "price_usd": 34495, "mileage": 34255, "dealer": "Soerens Ford", "city": "Brookfield", "state": "WI", "listing_url": "https://www.cars.com/vehicledetail/4f2340ed-2c5b-484b-8e2f-0dfe98898a15/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'unit-e4': {"id": "unit-e4", "year": 2024, "make": "Ram", "model": "ProMaster EV", "trim": "Super High Roof", "price_usd": 27439, "mileage": 14225, "dealer": "Rob Lambdin's University Dodge RAM", "city": "Davie", "state": "FL", "listing_url": "https://www.cars.com/vehicledetail/2ee45bdc-2cd0-4ebf-8c6b-3e7f871eb0c0/", "source_site": "Cars.com", "drivetrain": "Front-wheel Drive", "has_photo": true},
  'unit-l1': {"id": "unit-l1", "year": 2024, "make": "Chevrolet", "model": "Silverado EV", "trim": "RST", "price_usd": 65694, "mileage": 1945, "dealer": "Hare Chevrolet", "city": "Noblesville", "state": "IN", "listing_url": "https://www.cars.com/vehicledetail/6cba2831-1f37-409c-9c01-990257ff7639/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'unit-l2': {"id": "unit-l2", "year": 2025, "make": "Ford", "model": "F-150 Lightning", "trim": "XLT", "price_usd": 44096, "mileage": 8104, "dealer": "Grieco Ford of Delray Beach", "city": "Delray Beach", "state": "FL", "listing_url": "https://www.cars.com/vehicledetail/0a0ecd2e-f8ff-4cba-9f4c-67aa40ce467f/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-001': {"id": "vnd-001", "year": 2023, "make": "Ford", "model": "F-150 Lightning", "trim": "Pro", "price_usd": 38125, "mileage": 19451, "dealer": "Austin Subaru", "city": "Austin", "state": "TX", "listing_url": "https://www.cars.com/vehicledetail/14b62763-2b75-4e4a-aedc-9d8a4a0c312e/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-002': {"id": "vnd-002", "year": 2026, "make": "Chevrolet", "model": "Silverado EV", "trim": "LT - Standard Range 4WD", "price_usd": 54489, "mileage": 3127, "dealer": "Montrose Nissan", "city": "Hermitage", "state": "PA", "listing_url": "https://www.cars.com/vehicledetail/1c7f28ad-29d0-485f-ab24-e84c0fac299a/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-003': {"id": "vnd-003", "year": 2022, "make": "Ford", "model": "F-150 Lightning", "trim": "XLT", "price_usd": 34900, "mileage": 49082, "dealer": "Marchese Ford of Mechanicville", "city": "Mechanicville", "state": "NY", "listing_url": "https://www.cars.com/vehicledetail/914115f7-6810-4378-bec5-af52a43c6871/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-004': {"id": "vnd-004", "year": 2024, "make": "GMC", "model": "Sierra EV", "trim": "Denali", "price_usd": 63065, "mileage": 19869, "dealer": "Watsonville Cadillac GMC", "city": "Watsonville", "state": "CA", "listing_url": "https://www.cars.com/vehicledetail/6a69cb98-0eba-4993-9798-0c9535b1ea0b/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-005': {"id": "vnd-005", "year": 2023, "make": "Rivian", "model": "R1T", "trim": "Adventure", "price_usd": 62622, "mileage": 13658, "dealer": "Capitol Subaru", "city": "San Jose", "state": "CA", "listing_url": "https://www.cars.com/vehicledetail/73f4d1f9-7d11-42a9-a98f-54dc2bf99675/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-006': {"id": "vnd-006", "year": 2024, "make": "Tesla", "model": "Cybertruck", "trim": "Base", "price_usd": 66838, "mileage": 67888, "dealer": "Schumacher Buick GMC of West Palm Beach", "city": "West Palm Beach", "state": "FL", "listing_url": "https://www.cars.com/vehicledetail/7bc9b3cc-e567-4b10-8637-95768880c6de/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-007': {"id": "vnd-007", "year": 2023, "make": "GMC", "model": "Hummer EV", "trim": "3X", "price_usd": 59942, "mileage": 27000, "dealer": "Luxury Motor Cars", "city": "Hillside", "state": "NJ", "listing_url": "https://www.cars.com/vehicledetail/957a7884-159b-41a1-84d1-8505647611fd/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
  'vnd-008': {"id": "vnd-008", "year": 2025, "make": "Chevrolet", "model": "Silverado EV", "trim": "RST", "price_usd": 65398, "mileage": 12660, "dealer": "Jeff Schmitt Chevrolet East", "city": "Beavercreek", "state": "OH", "listing_url": "https://www.cars.com/vehicledetail/06f2bb69-38f6-477f-948d-829f6696d6ed/", "source_site": "Cars.com", "drivetrain": "All-wheel Drive", "has_photo": true},
}
