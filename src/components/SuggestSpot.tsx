import { useEffect, useState, type FormEvent } from 'react';
import type { CityConfig } from '../data/cities';
import { ACTIVITIES, type ActivityId, type NeighborhoodId } from '../data/places';

const ISSUES_URL = 'https://github.com/AshCastiblanco/ashleys-sf-list/issues/new';

interface SuggestSpotProps {
  city: CityConfig;
}

export function SuggestSpot({ city }: SuggestSpotProps) {
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState<NeighborhoodId | ''>('');
  const [activity, setActivity] = useState<ActivityId | ''>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setNeighborhood('');
  }, [city.id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const hoodLabel = neighborhood
      ? city.neighborhoods.find((n) => n.id === neighborhood)?.label ?? neighborhood
      : 'Not sure';
    const activityLabel = activity
      ? ACTIVITIES.find((a) => a.id === activity)?.label ?? activity
      : 'Not sure';

    const title = `[${city.shortLabel}] Suggestion: ${trimmed}`;
    const body = [
      `**City:** ${city.displayName}`,
      `**Place:** ${trimmed}`,
      `**Neighborhood:** ${hoodLabel}`,
      `**Activity:** ${activityLabel}`,
      note.trim() ? `**Note:** ${note.trim()}` : null,
      '',
      `_Submitted from ${city.suggestFormLabel} suggest form._`,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const url = `${ISSUES_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="suggest" aria-labelledby="suggest-heading">
      <div className="suggest-inner">
        <p className="suggest-eyebrow">para Ashley</p>
        <h2 id="suggest-heading" className="suggest-title">
          Suggest a spot
        </h2>
        <p className="suggest-sub">Know a place Ashley should try in {city.displayName}? Send it her way.</p>

        <form className="suggest-form" onSubmit={handleSubmit}>
          <label className="suggest-field">
            <span className="suggest-label">Place name</span>
            <input
              className="suggest-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. a favorite corner spot"
              aria-required="true"
            />
          </label>

          <div className="suggest-row">
            <label className="suggest-field">
              <span className="suggest-label">Neighborhood</span>
              <select
                className="suggest-input suggest-select"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value as NeighborhoodId | '')}
              >
                <option value="">Not sure</option>
                {city.neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="suggest-field">
              <span className="suggest-label">Activity</span>
              <select
                className="suggest-input suggest-select"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityId | '')}
              >
                <option value="">Not sure</option>
                {ACTIVITIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="suggest-field">
            <span className="suggest-label">Note (optional)</span>
            <textarea
              className="suggest-input suggest-textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why it’s worth a visit…"
            />
          </label>

          <button type="submit" className="suggest-submit" disabled={!name.trim()}>
            Open suggestion
          </button>
          <p className="suggest-hint">Opens a GitHub issue so Ashley can review and add it to the list.</p>
        </form>
      </div>
    </section>
  );
}
