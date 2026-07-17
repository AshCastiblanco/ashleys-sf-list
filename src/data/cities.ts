import type { Neighborhood } from './places';

export type CityId = 'sf' | 'nyc';

export type HeroMotif = 'bridge' | 'subway7';

export interface CityConfig {
  id: CityId;
  shortLabel: string;
  displayName: string;
  heroTitle: string;
  tagline: string;
  footerCity: string;
  placesPath: string;
  mapsCitySuffix: string;
  skylineSrc: string;
  accent: string;
  motif: HeroMotif;
  neighborhoods: Neighborhood[];
  defaultNeighborhood: string;
  suggestFormLabel: string;
}

const SF_NEIGHBORHOODS: Neighborhood[] = [
  { id: 'mission', label: 'Mission', emoji: '🌮', accent: '#c1512f' },
  { id: 'north-beach', label: 'North Beach', emoji: '🍝', accent: '#8e2437' },
  { id: 'marina', label: 'Marina & Cow Hollow', emoji: '⛵', accent: '#2d5da8' },
  { id: 'haight', label: 'Haight & Cole Valley', emoji: '🌺', accent: '#7b3f9d' },
  { id: 'fillmore', label: 'Fillmore & NoPa', emoji: '🎷', accent: '#b8860b' },
  { id: 'chinatown', label: 'Chinatown', emoji: '🏮', accent: '#ce1126' },
  { id: 'fidi', label: 'Embarcadero & FiDi', emoji: '🏙️', accent: '#17767b' },
  { id: 'castro', label: 'Castro', emoji: '🌈', accent: '#d1477a' },
  { id: 'richmond', label: 'Richmond & Sunset', emoji: '🌊', accent: '#2e7d4f' },
  { id: 'nob-hill', label: 'Nob Hill & Downtown', emoji: '🚡', accent: '#4a2c4e' },
  { id: 'outside', label: 'Outside the City', emoji: '🏞️', accent: '#5a7d2e' },
];

const NYC_NEIGHBORHOODS: Neighborhood[] = [
  { id: 'west-village', label: 'West Village', emoji: '🌳', accent: '#2e7d4f' },
  { id: 'east-village', label: 'East Village', emoji: '🎸', accent: '#7b3f9d' },
  { id: 'les', label: 'Lower East Side', emoji: '🥯', accent: '#c1512f' },
  { id: 'soho-nolita', label: 'SoHo / Nolita', emoji: '🛍️', accent: '#8e2437' },
  { id: 'williamsburg', label: 'Williamsburg', emoji: '🎨', accent: '#2d5da8' },
  { id: 'midtown', label: 'Midtown', emoji: '🗽', accent: '#17767b' },
  { id: 'uws', label: 'Upper West Side', emoji: '🎻', accent: '#4a2c4e' },
  { id: 'outside', label: 'Outside the City', emoji: '🏞️', accent: '#5a7d2e' },
];

export const CITIES: Record<CityId, CityConfig> = {
  sf: {
    id: 'sf',
    shortLabel: 'SF',
    displayName: 'San Francisco',
    heroTitle: 'Dearest San Francisco',
    tagline: "Wear some flowers. I'll show you the rest.",
    footerCity: 'San Francisco, CA',
    placesPath: 'places-sf.json',
    mapsCitySuffix: 'San Francisco',
    skylineSrc: 'sf-skyline.png',
    accent: '#b33a2b',
    motif: 'bridge',
    neighborhoods: SF_NEIGHBORHOODS,
    defaultNeighborhood: 'mission',
    suggestFormLabel: 'Dearest San Francisco',
  },
  nyc: {
    id: 'nyc',
    shortLabel: 'NYC',
    displayName: 'New York City',
    heroTitle: 'My Beloved, NYC',
    tagline: "I'll meet you on the corner.",
    footerCity: 'New York, NY',
    placesPath: 'places-nyc.json',
    mapsCitySuffix: 'New York',
    skylineSrc: 'nyc-skyline.svg',
    accent: '#1a2744',
    motif: 'subway7',
    neighborhoods: NYC_NEIGHBORHOODS,
    defaultNeighborhood: 'west-village',
    suggestFormLabel: 'My Beloved, NYC',
  },
};

export const CITY_LIST: CityConfig[] = [CITIES.sf, CITIES.nyc];

const CITY_KEY = 'ashleys-active-city';

export function loadCityId(): CityId {
  try {
    const raw = localStorage.getItem(CITY_KEY);
    if (raw === 'sf' || raw === 'nyc') return raw;
  } catch {
    // private mode
  }
  return 'sf';
}

export function saveCityId(id: CityId): void {
  try {
    localStorage.setItem(CITY_KEY, id);
  } catch {
    // private mode
  }
}

export function draftStorageKey(city: CityId): string {
  return `ashleys-${city}-draft`;
}

export function visitedStorageKey(city: CityId): string {
  return `ashleys-${city}-visited`;
}
