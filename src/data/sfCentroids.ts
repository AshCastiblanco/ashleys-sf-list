/** Approximate neighborhood centers for SF map pins when lat/lng are missing. */
export const SF_NEIGHBORHOOD_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  mission: { lat: 37.7599, lng: -122.4148 },
  'north-beach': { lat: 37.8061, lng: -122.4103 },
  marina: { lat: 37.8037, lng: -122.4368 },
  haight: { lat: 37.7692, lng: -122.4481 },
  fillmore: { lat: 37.7806, lng: -122.4342 },
  chinatown: { lat: 37.7941, lng: -122.4078 },
  fidi: { lat: 37.7946, lng: -122.3999 },
  castro: { lat: 37.7609, lng: -122.435 },
  richmond: { lat: 37.7798, lng: -122.475 },
  'nob-hill': { lat: 37.793, lng: -122.4161 },
  outside: { lat: 37.7749, lng: -122.4194 },
};

/** Deterministic jitter so pins in the same hood don't stack perfectly. */
export function jitterForPlace(id: string, base: { lat: number; lng: number }) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const dLat = ((hash % 100) - 50) / 12000;
  const dLng = (((hash >> 8) % 100) - 50) / 12000;
  return { lat: base.lat + dLat, lng: base.lng + dLng };
}
