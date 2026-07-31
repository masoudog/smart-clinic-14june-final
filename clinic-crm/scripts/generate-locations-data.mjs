#!/usr/bin/env node
// Generates lib/data/locations.generated.json — a free, offline, real-world
// city/timezone dataset for the Existing Patient / Abroad booking flow,
// replacing the earlier 15-city mock fixture (lib/mock/locations.ts).
//
// Source: `city-timezones` (MIT license,
// https://github.com/kevinroberts/city-timezones) — a devDependency only,
// not part of the client bundle. Filtered to cities with population >
// 50,000 to keep the generated file small while staying comprehensive
// (~4,000 real cities); deduplicated by (country + city), keeping the
// higher-population entry where two cities share a name in the same
// country; sorted by population descending so default/search results
// surface the most relevant cities first.
//
// Iranian cities (iso2 'IR') are excluded — this dataset only feeds the
// Existing Patient / Abroad flow's location picker, which by definition is
// for patients booking from outside Iran, so Iran itself is not a valid
// selection there.
//
// utcOffsetMinutes and the Farsi country name are deliberately NOT baked in
// here — lib/locationService.ts computes both live via native Intl APIs,
// so they always reflect the real current UTC offset (including DST) and a
// real localized country name.
//
// Regenerate with: node scripts/generate-locations-data.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cityTimezones from 'city-timezones';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'lib', 'data', 'locations.generated.json');
const POPULATION_THRESHOLD = 50000;

function makeId(iso2, city) {
  return `${iso2}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const byId = new Map();
for (const c of cityTimezones.cityMapping) {
  if (!c.pop || c.pop <= POPULATION_THRESHOLD) continue;
  if (!c.timezone || !c.iso2 || !c.city) continue;
  if (c.iso2 === 'IR') continue;
  const id = makeId(c.iso2, c.city);
  const existing = byId.get(id);
  if (existing && existing.pop >= c.pop) continue;
  byId.set(id, {
    id,
    city: c.city,
    country: c.country,
    iso2: c.iso2,
    timezone: c.timezone,
    pop: Math.round(c.pop),
  });
}

const records = Array.from(byId.values()).sort((a, b) => b.pop - a.pop);
writeFileSync(OUTPUT_PATH, JSON.stringify(records));
console.log(`Wrote ${records.length} cities to ${OUTPUT_PATH}`);
