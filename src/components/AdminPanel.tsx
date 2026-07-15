import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ACTIVITIES,
  DIETARY,
  EXPERIENCES,
  NEIGHBORHOODS,
  uniqueId,
  type ActivityId,
  type DietaryId,
  type ExperienceId,
  type NeighborhoodId,
  type Place,
} from '../data/places';

const REPO = 'ben-berube/ashleys-sf-list';
const FILE_PATH = 'public/places.json';
const TOKEN_KEY = 'ashleys-sf-admin-token';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  places: Place[];
  hasDraft: boolean;
  onChange: (next: Place[]) => void;
  onDiscard: () => void;
  onPublished: (places: Place[]) => void;
}

type PublishState =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

async function publishToGitHub(places: Place[], token: string): Promise<void> {
  const api = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  const current = await fetch(`${api}?ref=main`, { headers });
  if (!current.ok) {
    throw new Error(
      current.status === 401 || current.status === 403 || current.status === 404
        ? 'GitHub rejected the token — check it has Contents read/write access to the repo.'
        : `GitHub error (${current.status}) while reading the current list.`,
    );
  }
  const { sha } = (await current.json()) as { sha: string };

  const json = JSON.stringify(places, null, 2) + '\n';
  const content = btoa(String.fromCharCode(...new TextEncoder().encode(json)));

  const put = await fetch(api, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: "Update Ashley's list from the admin panel",
      content,
      sha,
      branch: 'main',
    }),
  });
  if (!put.ok) {
    throw new Error(`GitHub error (${put.status}) while saving. Try again in a moment.`);
  }
}

export function AdminPanel({
  open,
  onClose,
  places,
  hasDraft,
  onChange,
  onDiscard,
  onPublished,
}: AdminPanelProps) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [publish, setPublish] = useState<PublishState>({ kind: 'idle' });
  const [newName, setNewName] = useState('');

  const saveToken = (value: string) => {
    setToken(value);
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // private mode — token stays in memory for this session
    }
  };

  const updatePlace = (id: string, patch: Partial<Place>) => {
    onChange(places.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const setNeighborhood = (place: Place, neighborhood: NeighborhoodId) => {
    updatePlace(place.id, { neighborhood });
  };

  const toggleActivity = (place: Place, id: ActivityId) => {
    const has = place.activities.includes(id);
    if (has && place.activities.length === 1) return; // keep at least one
    updatePlace(place.id, {
      activities: has ? place.activities.filter((a) => a !== id) : [...place.activities, id],
    });
  };

  const toggleExperience = (place: Place, id: ExperienceId) => {
    const has = place.experiences.includes(id);
    if (has && place.experiences.length === 1) return; // keep at least one
    updatePlace(place.id, {
      experiences: has ? place.experiences.filter((e) => e !== id) : [...place.experiences, id],
    });
  };

  const toggleDietary = (place: Place, id: DietaryId) => {
    const current = place.dietary ?? [];
    const has = current.includes(id);
    const next = has ? current.filter((d) => d !== id) : [...current, id];
    updatePlace(place.id, { dietary: next.length ? next : undefined });
  };

  const addPlace = () => {
    const name = newName.trim();
    if (!name) return;
    const next: Place = {
      id: uniqueId(name, places),
      name,
      neighborhood: 'mission',
      activities: ['eat'],
      experiences: ['classic'],
    };
    onChange([next, ...places]);
    setNewName('');
  };

  const removePlace = (id: string) => {
    onChange(places.filter((p) => p.id !== id));
  };

  const handlePublish = async () => {
    if (!token.trim()) {
      setPublish({ kind: 'error', message: 'Paste your GitHub token first.' });
      return;
    }
    setPublish({ kind: 'working' });
    try {
      await publishToGitHub(places, token.trim());
      onPublished(places);
      setPublish({ kind: 'done' });
    } catch (e) {
      setPublish({ kind: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="admin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="admin"
            role="dialog"
            aria-label="Admin panel"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <header className="admin-header">
              <div>
                <h2 className="admin-title">Ashley&rsquo;s Panel 🤫</h2>
                <p className="admin-sub">Edits preview instantly on the page behind. Publish to make them live for everyone.</p>
              </div>
              <button className="admin-close" onClick={onClose} aria-label="Close admin panel">×</button>
            </header>

            <div className="admin-add">
              <input
                className="admin-input"
                placeholder="New spot name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlace()}
                aria-label="New place name"
              />
              <button className="admin-btn admin-btn--primary" onClick={addPlace} disabled={!newName.trim()}>
                + Add
              </button>
            </div>

            <ul className="admin-list">
              {places.map((p) => (
                <li key={p.id} className="admin-row">
                  <div className="admin-row-top">
                    <input
                      className="admin-input admin-input--name"
                      value={p.name}
                      onChange={(e) => updatePlace(p.id, { name: e.target.value })}
                      aria-label={`Name for ${p.name}`}
                    />
                    <button
                      className="admin-delete"
                      onClick={() => removePlace(p.id)}
                      aria-label={`Delete ${p.name}`}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                  <input
                    className="admin-input admin-input--note"
                    value={p.note ?? ''}
                    placeholder="Note (optional) — e.g. new wine bar"
                    onChange={(e) => updatePlace(p.id, { note: e.target.value || undefined })}
                    aria-label={`Note for ${p.name}`}
                  />
                  <input
                    className="admin-input admin-input--address"
                    value={p.address ?? ''}
                    placeholder="Address (optional)"
                    onChange={(e) => {
                      const address = e.target.value.trim();
                      updatePlace(p.id, { address: address || undefined });
                    }}
                    aria-label={`Address for ${p.name}`}
                  />
                  <div className="admin-field">
                    <span className="admin-field-label">Neighborhood</span>
                    <div className="admin-cats">
                      {NEIGHBORHOODS.map((n) => {
                        const on = p.neighborhood === n.id;
                        return (
                          <button
                            key={n.id}
                            className={`admin-cat${on ? ' admin-cat--on' : ''}`}
                            style={{ '--accent': n.accent } as React.CSSProperties}
                            onClick={() => setNeighborhood(p, n.id)}
                            aria-pressed={on}
                          >
                            {n.emoji} {n.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">Activity</span>
                    <div className="admin-cats">
                      {ACTIVITIES.map((a) => {
                        const on = p.activities.includes(a.id);
                        return (
                          <button
                            key={a.id}
                            className={`admin-cat${on ? ' admin-cat--on' : ''}`}
                            style={{ '--accent': a.accent } as React.CSSProperties}
                            onClick={() => toggleActivity(p, a.id)}
                            aria-pressed={on}
                          >
                            {a.emoji} {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">Experience</span>
                    <div className="admin-cats">
                      {EXPERIENCES.map((e) => {
                        const on = p.experiences.includes(e.id);
                        return (
                          <button
                            key={e.id}
                            className={`admin-cat${on ? ' admin-cat--on' : ''}`}
                            style={{ '--accent': e.accent } as React.CSSProperties}
                            onClick={() => toggleExperience(p, e.id)}
                            aria-pressed={on}
                          >
                            {e.emoji} {e.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">Dietary</span>
                    <div className="admin-cats">
                      {DIETARY.map((d) => {
                        const on = (p.dietary ?? []).includes(d.id);
                        return (
                          <button
                            key={d.id}
                            className={`admin-cat${on ? ' admin-cat--on' : ''}`}
                            style={{ '--accent': d.accent } as React.CSSProperties}
                            onClick={() => toggleDietary(p, d.id)}
                            aria-pressed={on}
                          >
                            {d.emoji} {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="admin-footer">
              <input
                className="admin-input"
                type="password"
                placeholder="GitHub token (stays on this device)"
                value={token}
                onChange={(e) => saveToken(e.target.value)}
                aria-label="GitHub token"
              />
              <div className="admin-actions">
                {hasDraft && (
                  <button className="admin-btn" onClick={() => { onDiscard(); setPublish({ kind: 'idle' }); }}>
                    Discard changes
                  </button>
                )}
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={handlePublish}
                  disabled={publish.kind === 'working' || !hasDraft}
                >
                  {publish.kind === 'working' ? 'Publishing…' : 'Publish to the site'}
                </button>
              </div>
              {publish.kind === 'done' && (
                <p className="admin-status admin-status--ok">
                  Published! The live site updates in a minute or two. 💛💙❤️
                </p>
              )}
              {publish.kind === 'error' && (
                <p className="admin-status admin-status--err">{publish.message}</p>
              )}
              {hasDraft && publish.kind === 'idle' && (
                <p className="admin-status">You have unpublished changes.</p>
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
