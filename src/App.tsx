import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { FilterBar, type Filters } from './components/FilterBar';
import { PlaceCard } from './components/PlaceCard';
import { AdminPanel } from './components/AdminPanel';
import { SuggestSpot } from './components/SuggestSpot';
import { CityToggle } from './components/CityToggle';
import { PlacesMap } from './components/PlacesMap';
import { usePlaces } from './hooks/usePlaces';
import {
  CITIES,
  loadCityId,
  saveCityId,
  visitedStorageKey,
  type CityId,
} from './data/cities';
import { ACTIVITIES, DIETARY, EXPERIENCES, type Place } from './data/places';

const NO_FILTERS: Filters = {
  neighborhood: 'any',
  activity: 'any',
  experience: 'any',
  dietary: 'any',
};

const NO_PLACES: never[] = [];

function loadVisited(cityId: CityId): Set<string> {
  try {
    const raw = localStorage.getItem(visitedStorageKey(cityId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function matchesQuery(p: Place, q: string): boolean {
  if (q === '') return true;
  return (
    p.name.toLowerCase().includes(q) ||
    (p.note ?? '').toLowerCase().includes(q) ||
    (p.address ?? '').toLowerCase().includes(q)
  );
}

function BridgeMotif() {
  return (
    <span className="hero-bridge" aria-hidden="true">
      <svg viewBox="0 0 200 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 22 H196" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M48 22 V6 H54 V22 M48 10 H54 M48 14 H54"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M146 22 V6 H152 V22 M146 10 H152 M146 14 H152"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 10 C28 10, 36 20, 51 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M51 6 C88 24, 112 24, 149 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M149 6 C164 20, 172 10, 196 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M28 14 V22 M36 17 V22 M64 12 V22 M76 16 V22 M88 18 V22 M100 19 V22 M112 18 V22 M124 16 V22 M136 12 V22 M164 17 V22 M172 14 V22"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}

function Subway7Motif() {
  // Boxy MTA car (flat ends, side doors, blue stripe)
  return (
    <span className="hero-bridge hero-bridge--subway" aria-hidden="true">
      <svg viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" strokeLinecap="round" fill="none">
          <path d="M12 46 H188" strokeWidth="2.2" />
          <path d="M12 50 H188" strokeWidth="1.5" opacity="0.5" />
          <g strokeWidth="1.3" opacity="0.4">
            <path d="M28 44 V52 M52 44 V52 M76 44 V52 M100 44 V52 M124 44 V52 M148 44 V52 M172 44 V52" />
          </g>
        </g>

        <rect x="38" y="40" width="22" height="5" rx="1" fill="currentColor" />
        <rect x="140" y="40" width="22" height="5" rx="1" fill="currentColor" />
        <circle cx="44" cy="46" r="3.2" fill="currentColor" />
        <circle cx="54" cy="46" r="3.2" fill="currentColor" />
        <circle cx="146" cy="46" r="3.2" fill="currentColor" />
        <circle cx="156" cy="46" r="3.2" fill="currentColor" />

        <rect x="24" y="12" width="152" height="30" rx="3" fill="currentColor" />
        <rect x="24" y="34" width="152" height="4" fill="#0039a6" />

        <rect x="28" y="16" width="14" height="12" rx="1.5" className="hero-subway-glass" />
        <circle cx="35" cy="22" r="5.5" fill="#ad4da8" />
        <text
          x="35"
          y="25.2"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="8"
          fontWeight="700"
        >
          7
        </text>

        <g className="hero-subway-glass">
          <rect x="48" y="16" width="12" height="11" rx="1" />
          <rect x="78" y="16" width="12" height="11" rx="1" />
          <rect x="108" y="16" width="12" height="11" rx="1" />
          <rect x="138" y="16" width="12" height="11" rx="1" />
          <rect x="162" y="16" width="10" height="11" rx="1" />
        </g>

        <g fill="none" stroke="var(--sky-cream)" strokeWidth="1.35" opacity="0.75">
          <rect x="62" y="14" width="14" height="20" rx="1" />
          <path d="M69 14 V34" />
          <rect x="92" y="14" width="14" height="20" rx="1" />
          <path d="M99 14 V34" />
          <rect x="122" y="14" width="14" height="20" rx="1" />
          <path d="M129 14 V34" />
        </g>

        <rect x="20" y="24" width="4" height="6" rx="0.5" fill="currentColor" />
        <rect x="176" y="24" width="4" height="6" rx="0.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function App() {
  const [cityId, setCityId] = useState<CityId>(loadCityId);
  const city = CITIES[cityId];

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [query, setQuery] = useState('');
  const [visited, setVisited] = useState<Set<string>>(() => loadVisited(cityId));
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === '#admin');
  const [mapOpen, setMapOpen] = useState(false);
  const flagTaps = useRef<number[]>([]);

  const { places, loading, hasDraft, setDraft, markPublished } = usePlaces(cityId, city.placesPath);
  const allPlaces = places ?? NO_PLACES;

  useEffect(() => {
    const onHash = () => setAdminOpen(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = city.heroTitle;
    document.documentElement.style.setProperty('--bridge', city.accent);
    document.documentElement.style.setProperty(
      '--bridge-soft',
      `${city.accent}24`,
    );
    document.documentElement.dataset.city = cityId;
  }, [city, cityId]);

  const switchCity = (next: CityId) => {
    if (next === cityId) return;
    setCityId(next);
    saveCityId(next);
    setFilters(NO_FILTERS);
    setQuery('');
    setVisited(loadVisited(next));
    setMapOpen(false);
  };

  const openAdmin = () => {
    window.location.hash = 'admin';
    setAdminOpen(true);
  };

  const closeAdmin = () => {
    if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setAdminOpen(false);
  };

  const onFlagTap = () => {
    const now = Date.now();
    flagTaps.current = [...flagTaps.current.filter((t) => now - t < 3000), now];
    if (flagTaps.current.length >= 5) {
      flagTaps.current = [];
      openAdmin();
    }
  };

  useEffect(() => {
    localStorage.setItem(visitedStorageKey(cityId), JSON.stringify([...visited]));
  }, [visited, cityId]);

  const toggleVisited = (id: string) => {
    setVisited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const anyActive =
    filters.neighborhood !== 'any' ||
    filters.activity !== 'any' ||
    filters.experience !== 'any' ||
    filters.dietary !== 'any' ||
    query.trim() !== '';

  const counts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const neighborhoods = city.neighborhoods;

    const base = (ignore: keyof Filters) =>
      allPlaces.filter(
        (p) =>
          matchesQuery(p, q) &&
          (ignore === 'neighborhood' || filters.neighborhood === 'any' || p.neighborhood === filters.neighborhood) &&
          (ignore === 'activity' || filters.activity === 'any' || p.activities.includes(filters.activity)) &&
          (ignore === 'experience' || filters.experience === 'any' || p.experiences.includes(filters.experience)) &&
          (ignore === 'dietary' ||
            filters.dietary === 'any' ||
            (p.dietary ?? []).includes(filters.dietary)),
      );

    const nbBase = base('neighborhood');
    const acBase = base('activity');
    const exBase = base('experience');
    const diBase = base('dietary');

    const neighborhood: Record<string, number> = { any: nbBase.length };
    for (const n of neighborhoods) neighborhood[n.id] = nbBase.filter((p) => p.neighborhood === n.id).length;

    const activity: Record<string, number> = { any: acBase.length };
    for (const a of ACTIVITIES) activity[a.id] = acBase.filter((p) => p.activities.includes(a.id)).length;

    const experience: Record<string, number> = { any: exBase.length };
    for (const e of EXPERIENCES) experience[e.id] = exBase.filter((p) => p.experiences.includes(e.id)).length;

    const dietary: Record<string, number> = { any: diBase.length };
    for (const d of DIETARY) dietary[d.id] = diBase.filter((p) => (p.dietary ?? []).includes(d.id)).length;

    return { neighborhood, activity, experience, dietary };
  }, [allPlaces, filters, query, city.neighborhoods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPlaces.filter((p) => {
      const matchesNeighborhood = filters.neighborhood === 'any' || p.neighborhood === filters.neighborhood;
      const matchesActivity = filters.activity === 'any' || p.activities.includes(filters.activity);
      const matchesExperience = filters.experience === 'any' || p.experiences.includes(filters.experience);
      const matchesDietary =
        filters.dietary === 'any' || (p.dietary ?? []).includes(filters.dietary);
      return (
        matchesQuery(p, q) &&
        matchesNeighborhood &&
        matchesActivity &&
        matchesExperience &&
        matchesDietary
      );
    });
  }, [allPlaces, filters, query]);

  return (
    <div className="app">
      <div className="skyline" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}${city.skylineSrc}`} alt="" />
      </div>

      <div className="tricolor" aria-hidden="true">
        <span className="tricolor-yellow" />
        <span className="tricolor-blue" />
        <span className="tricolor-red" />
      </div>

      {hasDraft && !adminOpen && (
        <button className="draft-banner" onClick={openAdmin}>
          Previewing unpublished changes — tap to open the panel
        </button>
      )}

      <header className="hero">
        <motion.h1
          className="hero-title"
          key={cityId}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 24 }}
        >
          <em>{city.heroTitle}</em>
          {city.motif === 'bridge' ? <BridgeMotif /> : <Subway7Motif />}
        </motion.h1>
        <motion.p
          className="hero-sub"
          key={`${cityId}-sub`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          {city.tagline}
        </motion.p>
      </header>

      <main className="main">
        <LayoutGroup>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            query={query}
            onQueryChange={setQuery}
            counts={counts}
            neighborhoods={city.neighborhoods}
            showMapButton={cityId === 'sf'}
            onOpenMap={() => setMapOpen(true)}
          />

          <div className="results-meta" aria-live="polite">
            {loading
              ? 'Loading the list…'
              : !anyActive
                ? `Showing everything (${filtered.length})`
                : `${filtered.length} place${filtered.length === 1 ? '' : 's'}`}
            {visited.size > 0 && (
              <span className="visited-count"> · {visited.size} visited 💛</span>
            )}
          </div>

          <motion.ul className="grid" layout>
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <PlaceCard
                  key={`${cityId}-${p.id}`}
                  place={p}
                  visited={visited.has(p.id)}
                  onToggleVisited={toggleVisited}
                  mapsCitySuffix={city.mapsCitySuffix}
                  neighborhoods={city.neighborhoods}
                />
              ))}
            </AnimatePresence>
          </motion.ul>

          {!loading && filtered.length === 0 && (
            <motion.p
              className="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Nada por aquí… try a different search 🔍
            </motion.p>
          )}
        </LayoutGroup>
      </main>

      <SuggestSpot city={city} />

      <div className="city-toggle-wrap">
        <CityToggle cityId={cityId} onChange={switchCity} />
      </div>

      <footer className="footer">
        <button
          className="footer-flag"
          onClick={onFlagTap}
          aria-label="Colombian flag"
          title="🤫"
        >
          <span className="tricolor-yellow" />
          <span className="tricolor-blue" />
          <span className="tricolor-red" />
        </button>
        <p>
          Hecho con Amor — <span className="footer-ashley">Ashley</span>
        </p>
      </footer>

      {cityId === 'sf' && (
        <PlacesMap open={mapOpen} onClose={() => setMapOpen(false)} places={filtered} />
      )}

      <AdminPanel
        open={adminOpen}
        onClose={closeAdmin}
        places={allPlaces}
        hasDraft={hasDraft}
        onChange={setDraft}
        onDiscard={() => setDraft(null)}
        onPublished={markPublished}
        city={city}
      />
    </div>
  );
}
