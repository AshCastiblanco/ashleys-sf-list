#!/usr/bin/env node
/**
 * Geocode SF place addresses via Nominatim into lat/lng on places-sf.json.
 * Usage: node scripts/geocode-sf.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, '..', 'public', 'places-sf.json');
const places = JSON.parse(readFileSync(path, 'utf8'));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ashleys-sf-list/1.0 (personal city guide; github.com/AshCastiblanco/ashleys-sf-list)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  if (!data?.[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

let updated = 0;
let skipped = 0;
let failed = 0;

for (const place of places) {
  if (place.lat != null && place.lng != null) {
    skipped += 1;
    continue;
  }
  const query =
    place.neighborhood === 'outside'
      ? place.address
        ? `${place.name}, ${place.address}`
        : `${place.name}`
      : place.address
        ? `${place.name}, ${place.address}, San Francisco, CA`
        : `${place.name}, San Francisco, CA`;

  try {
    const coords = await geocode(query);
    if (coords) {
      place.lat = coords.lat;
      place.lng = coords.lng;
      updated += 1;
      console.log('✓', place.name, coords.lat.toFixed(5), coords.lng.toFixed(5));
    } else {
      failed += 1;
      console.log('✗', place.name, '(no result)');
    }
  } catch (e) {
    failed += 1;
    console.log('✗', place.name, e.message);
  }
  await sleep(1100); // Nominatim rate limit
}

writeFileSync(path, JSON.stringify(places, null, 2) + '\n');
console.log(`done: updated=${updated} skipped=${skipped} failed=${failed}`);
