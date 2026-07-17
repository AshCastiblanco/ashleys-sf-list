import { useCallback, useEffect, useState } from 'react';
import { draftStorageKey, type CityId } from '../data/cities';
import type { Place } from '../data/places';

function loadDraft(city: CityId): Place[] | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(city));
    return raw ? (JSON.parse(raw) as Place[]) : null;
  } catch {
    return null;
  }
}

/**
 * Published data lives in public/places-{city}.json (fetched at runtime so admin
 * commits show up after each deploy). A local draft in localStorage overlays
 * it while Ashley is editing, before she publishes.
 */
export function usePlaces(cityId: CityId, placesPath: string) {
  const [published, setPublished] = useState<Place[] | null>(null);
  const [draft, setDraftState] = useState<Place[] | null>(() => loadDraft(cityId));

  useEffect(() => {
    setDraftState(loadDraft(cityId));
    setPublished(null);
  }, [cityId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}${placesPath}`)
      .then((r) => r.json())
      .then((data: Place[]) => {
        if (!cancelled) setPublished(data);
      })
      .catch(() => {
        if (!cancelled) setPublished([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placesPath]);

  const setDraft = useCallback(
    (next: Place[] | null) => {
      setDraftState(next);
      try {
        const key = draftStorageKey(cityId);
        if (next === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private mode) — draft stays in memory only
      }
    },
    [cityId],
  );

  const markPublished = useCallback(
    (places: Place[]) => {
      setPublished(places);
      setDraft(null);
    },
    [setDraft],
  );

  return {
    places: draft ?? published,
    loading: published === null && draft === null,
    hasDraft: draft !== null,
    setDraft,
    markPublished,
  };
}
