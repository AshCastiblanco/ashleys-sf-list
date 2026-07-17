import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ACTIVITIES,
  EXPERIENCES,
  DIETARY,
  ACTIVITY_MAP,
  EXPERIENCE_MAP,
  DIETARY_MAP,
  type ActivityId,
  type DietaryId,
  type ExperienceId,
  type Neighborhood,
  type NeighborhoodId,
  type Tag,
} from '../data/places';

export interface Filters {
  neighborhood: NeighborhoodId | 'any';
  activity: ActivityId | 'any';
  experience: ExperienceId | 'any';
  dietary: DietaryId | 'any';
}

export interface FilterCounts {
  neighborhood: Record<string, number>;
  activity: Record<string, number>;
  experience: Record<string, number>;
  dietary: Record<string, number>;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  query: string;
  onQueryChange: (q: string) => void;
  counts: FilterCounts;
  neighborhoods: Neighborhood[];
  showMapButton?: boolean;
  onOpenMap?: () => void;
}

const COLLAPSED_KEY = 'ashleys-sf-filters-collapsed';

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function activeFilterSummary(filters: Filters, neighborhoods: Neighborhood[]): string {
  const parts: string[] = [];
  if (filters.neighborhood !== 'any') {
    parts.push(
      neighborhoods.find((n) => n.id === filters.neighborhood)?.label ?? filters.neighborhood,
    );
  }
  if (filters.activity !== 'any') {
    parts.push(ACTIVITY_MAP[filters.activity]?.label ?? filters.activity);
  }
  if (filters.experience !== 'any') {
    parts.push(EXPERIENCE_MAP[filters.experience]?.label ?? filters.experience);
  }
  if (filters.dietary !== 'any') {
    parts.push(DIETARY_MAP[filters.dietary]?.label ?? filters.dietary);
  }
  return parts.join(' · ');
}

export function FilterBar({
  filters,
  onChange,
  query,
  onQueryChange,
  counts,
  neighborhoods,
  showMapButton,
  onOpenMap,
}: FilterBarProps) {
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const summary = activeFilterSummary(filters, neighborhoods);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // private mode
    }
  }, [collapsed]);

  return (
    <div className={`filter-bar${collapsed ? ' filter-bar--collapsed' : ''}`}>
      <div className="filter-bar-header">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar… search the list"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search places"
          />
          <span className="search-cable-car" aria-hidden="true">
            <CableCarIcon />
          </span>
        </div>
        {showMapButton && onOpenMap && (
          <button type="button" className="filter-map-btn" onClick={onOpenMap}>
            Map
          </button>
        )}
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={!collapsed}
          aria-controls="filter-groups"
          onClick={() => setCollapsed((c) => !c)}
        >
          Filters
          <span className="filter-toggle-chevron" aria-hidden="true">
            {collapsed ? '▾' : '▴'}
          </span>
        </button>
      </div>

      {collapsed && summary && (
        <p className="filter-summary" aria-live="polite">
          {summary}
        </p>
      )}

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            id="filter-groups"
            className="filter-bar-groups"
            key="filter-groups"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <FilterGroup
              groupId="neighborhood"
              label="Neighborhood"
              anyEmoji="🌉"
              options={neighborhoods}
              active={filters.neighborhood}
              counts={counts.neighborhood}
              onSelect={(id) => onChange({ ...filters, neighborhood: id as NeighborhoodId | 'any' })}
            />
            <FilterGroup
              groupId="activity"
              label="Activity"
              anyEmoji="🎉"
              options={ACTIVITIES}
              active={filters.activity}
              counts={counts.activity}
              onSelect={(id) => onChange({ ...filters, activity: id as ActivityId | 'any' })}
            />
            <FilterGroup
              groupId="experience"
              label="Experience"
              anyEmoji="💫"
              options={EXPERIENCES}
              active={filters.experience}
              counts={counts.experience}
              onSelect={(id) => onChange({ ...filters, experience: id as ExperienceId | 'any' })}
            />
            <FilterGroup
              groupId="dietary"
              label="Dietary"
              anyEmoji="🍽️"
              options={DIETARY}
              active={filters.dietary}
              counts={counts.dietary}
              onSelect={(id) => onChange({ ...filters, dietary: id as DietaryId | 'any' })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterGroupProps {
  groupId: string;
  label: string;
  anyEmoji: string;
  options: Tag<string>[];
  active: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
}

function FilterGroup({ groupId, label, anyEmoji, options, active, counts, onSelect }: FilterGroupProps) {
  return (
    <div className="filter-group">
      <span className="filter-group-label">{label}</span>
      <div className="chips" role="tablist" aria-label={`Filter by ${label}`}>
        <Chip
          pillId={`pill-${groupId}`}
          isActive={active === 'any'}
          onClick={() => onSelect('any')}
          emoji={anyEmoji}
          label="Any"
          count={counts.any ?? 0}
          accent="#b33a2b"
        />
        {options.map((opt) => (
          <Chip
            key={opt.id}
            pillId={`pill-${groupId}`}
            isActive={active === opt.id}
            onClick={() => onSelect(opt.id)}
            emoji={opt.emoji}
            label={opt.label}
            count={counts[opt.id] ?? 0}
            accent={opt.accent}
            showCableCar={opt.id === 'cafe' || opt.id === 'explore'}
          />
        ))}
      </div>
    </div>
  );
}

interface ChipProps {
  pillId: string;
  isActive: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  count: number;
  accent: string;
  showCableCar?: boolean;
}

function CableCarIcon() {
  return (
    <svg className="chip-cable-car" viewBox="0 0 72 48" fill="none" aria-hidden="true">
      <path d="M2 40 H70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <path d="M36 4 V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      <path d="M14 16 H58 L54 12 H18 Z" fill="currentColor" />
      <rect x="16" y="16" width="40" height="18" rx="1.5" fill="currentColor" />
      <rect x="20" y="19" width="7" height="7" rx="0.8" className="chip-cable-car-glass" />
      <rect x="30" y="19" width="7" height="7" rx="0.8" className="chip-cable-car-glass" />
      <rect x="40" y="19" width="7" height="7" rx="0.8" className="chip-cable-car-glass" />
      <path d="M49 16 V34" className="chip-cable-car-line" strokeWidth="1.2" opacity="0.7" />
      <path d="M16 34 L10 38 H18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M56 34 L62 38 H54" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <circle cx="24" cy="38" r="3" fill="currentColor" />
      <circle cx="48" cy="38" r="3" fill="currentColor" />
      <circle cx="24" cy="38" r="1.2" className="chip-cable-car-glass" />
      <circle cx="48" cy="38" r="1.2" className="chip-cable-car-glass" />
    </svg>
  );
}

function Chip({ pillId, isActive, onClick, emoji, label, count, accent, showCableCar }: ChipProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`chip${isActive ? ' chip--active' : ''}`}
      style={{ '--chip-accent': accent } as React.CSSProperties}
      onClick={onClick}
    >
      {isActive && (
        <motion.span
          layoutId={pillId}
          className="chip-pill"
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        />
      )}
      <span className="chip-content">
        {showCableCar ? <CableCarIcon /> : (
          <span className="chip-emoji" aria-hidden="true">{emoji}</span>
        )}
        {label}
        <span className="chip-count">{count}</span>
      </span>
    </button>
  );
}
