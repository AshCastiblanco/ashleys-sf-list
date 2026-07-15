import { motion } from 'framer-motion';
import {
  ACTIVITY_MAP,
  DIETARY_MAP,
  EXPERIENCE_MAP,
  NEIGHBORHOOD_MAP,
  type Place,
} from '../data/places';

interface PlaceCardProps {
  place: Place;
  visited: boolean;
  onToggleVisited: (id: string) => void;
}

function mapsUrl(place: Place): string | undefined {
  if (place.lat != null && place.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  if (place.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
  }
  return undefined;
}

export function PlaceCard({ place, visited, onToggleVisited }: PlaceCardProps) {
  const primary = ACTIVITY_MAP[place.activities[0]] ?? ACTIVITY_MAP.eat;
  const neighborhood = NEIGHBORHOOD_MAP[place.neighborhood];
  const mapLink = mapsUrl(place);
  const dietary = place.dietary ?? [];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      whileHover={{ y: -5 }}
      className={`card${visited ? ' card--visited' : ''}`}
      style={{ '--accent': primary.accent } as React.CSSProperties}
    >
      <span className="card-stripe" aria-hidden="true" />
      <div className="card-body">
        <div className="card-top">
          <span className="card-emoji" aria-hidden="true">{primary.emoji}</span>
          <button
            className={`visit-btn${visited ? ' visit-btn--on' : ''}`}
            onClick={() => onToggleVisited(place.id)}
            aria-pressed={visited}
            aria-label={visited ? `Unmark ${place.name} as visited` : `Mark ${place.name} as visited`}
            title={visited ? 'Been here!' : 'Mark as visited'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-7.5-4.7-10-9.3C.4 8.4 2.4 4.5 6.2 4.5c2.2 0 3.7 1.2 4.6 2.6C11.7 5.7 13.2 4.5 15.4 4.5c3.8 0 5.8 3.9 4.2 7.2C19.5 16.3 12 21 12 21z" />
            </svg>
          </button>
        </div>
        <h3 className="card-name">{place.name}</h3>
        {place.address && (
          mapLink ? (
            <a
              className="card-address"
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {place.address}
            </a>
          ) : (
            <p className="card-address">{place.address}</p>
          )
        )}
        {place.note && <p className="card-note">{place.note}</p>}
        <div className="card-tags">
          {neighborhood && (
            <span
              className="tag tag--hood"
              style={{ '--accent': neighborhood.accent } as React.CSSProperties}
            >
              {neighborhood.emoji} {neighborhood.label}
            </span>
          )}
          {place.activities.map((id) => {
            const activity = ACTIVITY_MAP[id];
            if (!activity) return null;
            return (
              <span key={id} className="tag" style={{ '--accent': activity.accent } as React.CSSProperties}>
                {activity.label}
              </span>
            );
          })}
          {place.experiences.map((id) => {
            const experience = EXPERIENCE_MAP[id];
            if (!experience) return null;
            return (
              <span
                key={id}
                className="tag tag--exp"
                style={{ '--accent': experience.accent } as React.CSSProperties}
              >
                {experience.label}
              </span>
            );
          })}
          {dietary.map((id) => {
            const tag = DIETARY_MAP[id];
            if (!tag) return null;
            return (
              <span
                key={id}
                className="tag tag--dietary"
                style={{ '--accent': tag.accent } as React.CSSProperties}
              >
                {tag.emoji} {tag.label}
              </span>
            );
          })}
        </div>
      </div>
      {visited && <span className="visited-badge">estuve aquí ✓</span>}
    </motion.li>
  );
}
