// Real, free, offline city/timezone dataset for the Existing Patient /
// Abroad booking flow — replaces the earlier 15-city mock fixture
// (lib/mock/locations.ts). See scripts/generate-locations-data.mjs for
// provenance (source package, filtering, dedup) and regeneration
// instructions; `city-timezones` itself is a devDependency only and is not
// part of the client bundle — only this generated JSON is.
//
// utcOffsetMinutes and the Farsi country name are intentionally NOT stored
// here — see lib/locationService.ts, which computes both live via native
// Intl APIs (Intl.DateTimeFormat / Intl.DisplayNames) from `iso2` and
// `timezone`, so they always reflect the real current UTC offset
// (including daylight saving) and a real localized country name.

import rawLocations from './locations.generated.json';

export interface RawLocation {
  id: string;
  city: string;
  country: string;
  iso2: string;
  timezone: string;
}

export const RAW_LOCATIONS: RawLocation[] = rawLocations as RawLocation[];
