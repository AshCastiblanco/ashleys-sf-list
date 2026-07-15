export type NeighborhoodId =
  | 'mission'
  | 'north-beach'
  | 'marina'
  | 'haight'
  | 'fillmore'
  | 'chinatown'
  | 'fidi'
  | 'castro'
  | 'richmond'
  | 'nob-hill'
  | 'outside';

export type ActivityId =
  | 'wine'
  | 'beer'
  | 'cocktails'
  | 'eat'
  | 'cafe'
  | 'outdoors'
  | 'explore';

export type ExperienceId =
  | 'vibes'
  | 'speakeasy'
  | 'scenic'
  | 'elevated'
  | 'discover'
  | 'classic';

export type DietaryId = 'gluten-free' | 'dairy-free';

export interface Tag<TId extends string> {
  id: TId;
  label: string;
  emoji: string;
  accent: string;
}

export type Neighborhood = Tag<NeighborhoodId>;
export type Activity = Tag<ActivityId>;
export type Experience = Tag<ExperienceId>;
export type Dietary = Tag<DietaryId>;

export interface Place {
  id: string;
  name: string;
  neighborhood: NeighborhoodId;
  activities: ActivityId[];
  experiences: ExperienceId[];
  note?: string;
  address?: string;
  lat?: number;
  lng?: number;
  dietary?: DietaryId[];
}

export const NEIGHBORHOODS: Neighborhood[] = [
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

export const ACTIVITIES: Activity[] = [
  { id: 'wine', label: 'Wine', emoji: '🍷', accent: '#8e2437' },
  { id: 'beer', label: 'Beer', emoji: '🍺', accent: '#c8861f' },
  { id: 'cocktails', label: 'Cocktails', emoji: '🍸', accent: '#ce1126' },
  { id: 'eat', label: 'Eat', emoji: '🍽️', accent: '#c1512f' },
  { id: 'cafe', label: 'Cafe', emoji: '☕', accent: '#6b4226' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌿', accent: '#2e7d4f' },
  { id: 'explore', label: 'Explore', emoji: '🧭', accent: '#17767b' },
];

export const EXPERIENCES: Experience[] = [
  { id: 'vibes', label: 'Vibes', emoji: '✨', accent: '#2d5da8' },
  { id: 'speakeasy', label: 'Speakeasy', emoji: '🎩', accent: '#4a2c4e' },
  { id: 'scenic', label: 'Scenic', emoji: '🏞️', accent: '#2e7d4f' },
  { id: 'elevated', label: 'Elevated', emoji: '🥂', accent: '#a8842c' },
  { id: 'discover', label: 'Discover', emoji: '🔦', accent: '#c26a2f' },
  { id: 'classic', label: 'Classic', emoji: '⭐', accent: '#6b4a2b' },
];

export const DIETARY: Dietary[] = [
  { id: 'gluten-free', label: 'Gluten free', emoji: '🌾', accent: '#8b6914' },
  { id: 'dairy-free', label: 'Dairy free', emoji: '🥛', accent: '#3d6b8a' },
];

export const NEIGHBORHOOD_MAP: Record<NeighborhoodId, Neighborhood> = Object.fromEntries(
  NEIGHBORHOODS.map((n) => [n.id, n]),
) as Record<NeighborhoodId, Neighborhood>;

export const ACTIVITY_MAP: Record<ActivityId, Activity> = Object.fromEntries(
  ACTIVITIES.map((a) => [a.id, a]),
) as Record<ActivityId, Activity>;

export const EXPERIENCE_MAP: Record<ExperienceId, Experience> = Object.fromEntries(
  EXPERIENCES.map((e) => [e.id, e]),
) as Record<ExperienceId, Experience>;

export const DIETARY_MAP: Record<DietaryId, Dietary> = Object.fromEntries(
  DIETARY.map((d) => [d.id, d]),
) as Record<DietaryId, Dietary>;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function uniqueId(name: string, existing: Place[]): string {
  const base = slugify(name) || 'place';
  let id = base;
  let n = 2;
  while (existing.some((p) => p.id === id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}
