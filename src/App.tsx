import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { FilterBar, type Filters } from './components/FilterBar';
import { PlaceCard } from './components/PlaceCard';
import { AdminPanel } from './components/AdminPanel';
import { usePlaces } from './hooks/usePlaces';
import { ACTIVITIES, DIETARY, EXPERIENCES, NEIGHBORHOODS, type Place } from './data/places';

const NO_FILTERS: Filters = {
  neighborhood: 'any',
  activity: 'any',
  experience: 'any',
  dietary: 'any',
};

const VISITED_KEY = 'ashleys-sf-visited';
const NO_PLACES: never[] = [];

function loadVisited(): Set<string> {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
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

export default function App() {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [query, setQuery] = useState('');
  const [visited, setVisited] = useState<Set<string>>(loadVisited);
  const [adminOpen, setAdminOpen] = useState(() => window.location.hash === '#admin');
  const flagTaps = useRef<number[]>([]);

  const { places, loading, hasDraft, setDraft, markPublished } = usePlaces();
  const allPlaces = places ?? NO_PLACES;

  useEffect(() => {
    const onHash = () => setAdminOpen(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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

  // Secret entrance: tap the flag in the footer five times within 3 seconds
  const onFlagTap = () => {
    const now = Date.now();
    flagTaps.current = [...flagTaps.current.filter((t) => now - t < 3000), now];
    if (flagTaps.current.length >= 5) {
      flagTaps.current = [];
      openAdmin();
    }
  };

  useEffect(() => {
    localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
  }, [visited]);

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

    // Counts within a dimension reflect the OTHER active filters (plus search),
    // so the numbers stay meaningful as you narrow things down.
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
    for (const n of NEIGHBORHOODS) neighborhood[n.id] = nbBase.filter((p) => p.neighborhood === n.id).length;

    const activity: Record<string, number> = { any: acBase.length };
    for (const a of ACTIVITIES) activity[a.id] = acBase.filter((p) => p.activities.includes(a.id)).length;

    const experience: Record<string, number> = { any: exBase.length };
    for (const e of EXPERIENCES) experience[e.id] = exBase.filter((p) => p.experiences.includes(e.id)).length;

    const dietary: Record<string, number> = { any: diBase.length };
    for (const d of DIETARY) dietary[d.id] = diBase.filter((p) => (p.dietary ?? []).includes(d.id)).length;

    return { neighborhood, activity, experience, dietary };
  }, [allPlaces, filters, query]);

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
        <motion.p
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          una guía de la ciudad · a city guide
        </motion.p>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 24 }}
        >
          <em>SF Guide</em>
        </motion.h1>
        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          {allPlaces.length || '…'} spots to eat, drink &amp; wander — con un toquecito colombiano&nbsp;🇨🇴
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
                  key={p.id}
                  place={p}
                  visited={visited.has(p.id)}
                  onToggleVisited={toggleVisited}
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
        <p>Hecho con amor para Ashley — San Francisco, CA</p>
      </footer>

      <AdminPanel
        open={adminOpen}
        onClose={closeAdmin}
        places={allPlaces}
        hasDraft={hasDraft}
        onChange={setDraft}
        onDiscard={() => setDraft(null)}
        onPublished={markPublished}
      />
    </div>
  );
}
