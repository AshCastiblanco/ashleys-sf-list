#!/usr/bin/env node
/**
 * One-time enrichment: look up each place on Google Places (New) Text Search
 * and write address / lat / lng back into public/places.json.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... npm run enrich:addresses
 *   # or put the key in a local .env file
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const placesPath = join(root, 'public', 'places.json');
const delayMs = 200;

function loadEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildQuery(place) {
  if (place.neighborhood === 'outside') {
    const hint = place.note?.trim();
    return hint ? `${place.name} ${hint}` : `${place.name} California`;
  }
  return `${place.name} San Francisco CA`;
}

async function searchPlace(apiKey, textQuery) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.formattedAddress,places.location,places.displayName',
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 1,
      locationBias: {
        circle: {
          center: { latitude: 37.7749, longitude: -122.4194 },
          radius: 40000.0,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const hit = data.places?.[0];
  if (!hit) return null;

  return {
    address: hit.formattedAddress ?? undefined,
    lat: hit.location?.latitude,
    lng: hit.location?.longitude,
    displayName: hit.displayName?.text,
  };
}

async function main() {
  loadEnv();
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'Missing GOOGLE_PLACES_API_KEY.\n' +
        'Create a Places API key in Google Cloud, then either:\n' +
        '  export GOOGLE_PLACES_API_KEY=your_key\n' +
        '  # or add GOOGLE_PLACES_API_KEY=your_key to a local .env file\n' +
        'Then run: npm run enrich:addresses',
    );
    process.exit(1);
  }

  const places = JSON.parse(readFileSync(placesPath, 'utf8'));
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const rows = [];

  for (const place of places) {
    if (place.address) {
      skipped += 1;
      rows.push({
        name: place.name,
        neighborhood: place.neighborhood,
        address: place.address,
        status: 'skipped (already has address)',
      });
      continue;
    }

    const query = buildQuery(place);
    try {
      const result = await searchPlace(apiKey, query);
      if (!result?.address) {
        failed += 1;
        rows.push({
          name: place.name,
          neighborhood: place.neighborhood,
          address: '—',
          status: `no match for "${query}"`,
        });
        console.warn(`⚠ No match: ${place.name} (${query})`);
      } else {
        place.address = result.address;
        if (typeof result.lat === 'number') place.lat = result.lat;
        if (typeof result.lng === 'number') place.lng = result.lng;
        updated += 1;
        rows.push({
          name: place.name,
          neighborhood: place.neighborhood,
          address: result.address,
          status: 'updated',
        });
        console.log(`✓ ${place.name} → ${result.address}`);
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      rows.push({
        name: place.name,
        neighborhood: place.neighborhood,
        address: '—',
        status: `error: ${message}`,
      });
      console.error(`✗ ${place.name}: ${message}`);
    }

    await sleep(delayMs);
  }

  writeFileSync(placesPath, JSON.stringify(places, null, 2) + '\n');

  console.log('\n--- Review table (name | neighborhood | address) ---');
  for (const row of rows) {
    console.log(`${row.name}\t${row.neighborhood}\t${row.address}\t[${row.status}]`);
  }
  console.log(
    `\nDone. updated=${updated} skipped=${skipped} failed=${failed}. Wrote ${placesPath}`,
  );
  console.log('Fix wrong neighborhoods in the admin panel using the new addresses.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
