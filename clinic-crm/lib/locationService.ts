// Dedicated location/timezone service layer for the Abroad booking flow.
// The booking UI only ever talks to this module, never to the underlying
// dataset directly — so the dataset (lib/data/locations.ts, see that file
// for provenance) was swapped from a 15-city mock fixture to a real,
// free, offline ~4,000-city dataset without any UI component changing.
//
// The dataset is loaded via a dynamic import (not a top-level import) so
// its ~60KB (gzipped) JSON is only fetched when a user actually opens the
// Abroad flow's location step, keeping the Landing Page's initial bundle
// exactly as small as before this data source was swapped in.

import { toFa } from './utils';
import type { RawLocation } from './data/locations';

export interface LocationRecord {
  id: string;
  city: string;
  country: string;
  // Farsi country name — the Abroad Time Selection step displays this
  // (not the English `country` or the `city`), per the original explicit
  // instruction. Computed live via Intl.DisplayNames from the ISO country
  // code, rather than a hand-picked translation.
  countryFa: string;
  timezone: string; // IANA zone name
  utcOffsetMinutes: number;
}

const SEARCH_DELAY_MS = 250;
// Bounds the result size the same way a real backend would paginate/limit.
const MAX_RESULTS = 50;

let rawLocationsPromise: Promise<RawLocation[]> | null = null;
function loadRawLocations(): Promise<RawLocation[]> {
  if (!rawLocationsPromise) {
    rawLocationsPromise = import('./data/locations').then((m) => m.RAW_LOCATIONS);
  }
  return rawLocationsPromise;
}

const regionNamesFa =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['fa'], { type: 'region' })
    : null;

// Computes the real current UTC offset for an IANA timezone (accounting for
// daylight saving, unlike a single static offset per city) via the native
// Intl API — no timezone-data library needed.
function getUtcOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = tzName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1].startsWith('-') ? -1 : 1;
    const hours = Math.abs(parseInt(match[1], 10));
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

// A handful of source entries (disputed territories without a real ISO
// 3166-1 code, e.g. Kosovo/Somaliland) carry a non-standard iso2 placeholder
// from the upstream city-timezones package instead of a two-letter code.
// Intl.DisplayNames.of() throws a RangeError for those instead of returning
// undefined, so the format is validated first — falling back to the plain
// English country name for exactly the cases the `??` below already existed
// to handle.
function getCountryNameFa(iso2: string, fallback: string): string {
  if (!regionNamesFa || !/^[A-Z]{2}$/.test(iso2)) return fallback;
  try {
    return regionNamesFa.of(iso2) ?? fallback;
  } catch {
    return fallback;
  }
}

function enrich(raw: RawLocation): LocationRecord {
  return {
    id: raw.id,
    city: raw.city,
    country: raw.country,
    countryFa: getCountryNameFa(raw.iso2, raw.country),
    timezone: raw.timezone,
    utcOffsetMinutes: getUtcOffsetMinutes(raw.timezone),
  };
}

export interface LocationServiceApi {
  searchLocations: (query: string) => Promise<LocationRecord[]>;
  getLocationById: (id: string) => Promise<LocationRecord | null>;
}

const searchLocations = (query: string): Promise<LocationRecord[]> =>
  loadRawLocations().then(
    (raw) =>
      new Promise((resolve) => {
        setTimeout(() => {
          const q = query.trim().toLowerCase();
          const matches = q
            ? raw.filter(
                (loc) => loc.city.toLowerCase().includes(q) || loc.country.toLowerCase().includes(q),
              )
            : raw;
          resolve(matches.slice(0, MAX_RESULTS).map(enrich));
        }, SEARCH_DELAY_MS);
      }),
  );

const getLocationById = (id: string): Promise<LocationRecord | null> =>
  loadRawLocations().then((raw) => {
    const match = raw.find((loc) => loc.id === id);
    return match ? enrich(match) : null;
  });

export const locationService: LocationServiceApi = {
  searchLocations,
  getLocationById,
};

// --- Display/conversion helpers (pure functions, no I/O) ---

// Matches the reference screenshot's dropdown-option format exactly
// ("Belgrade (UTC+1:00)"); the prose spec's "GMT+1" shorthand was treated
// as a paraphrase for illustration, not a literal format — flagged for review.
export function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
}

// Iran Standard Time is a fixed UTC+3:30 (no DST) — the clinic side of every
// conversion in the Abroad flow.
const IRAN_UTC_OFFSET_MINUTES = 210;

export function convertIranHourToLocal(
  iranHour: number,
  location: LocationRecord,
): { hour: number; minute: number } {
  const iranMinutes = iranHour * 60;
  const utcMinutes = iranMinutes - IRAN_UTC_OFFSET_MINUTES;
  const localMinutes = (((utcMinutes + location.utcOffsetMinutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(localMinutes / 60), minute: localMinutes % 60 };
}

// Farsi-digit "HH:MM" for the given local hour/minute (mirrors the existing
// `${toFa(hour)}:۰۰` pattern already used throughout the booking components).
export function formatLocalTimeFa(iranHour: number, location: LocationRecord): string {
  const { hour, minute } = convertIranHourToLocal(iranHour, location);
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${toFa(hh)}:${toFa(mm)}`;
}
