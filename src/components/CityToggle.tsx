import type { CityConfig, CityId } from '../data/cities';
import { CITY_LIST } from '../data/cities';

interface CityToggleProps {
  cityId: CityId;
  onChange: (id: CityId) => void;
}

export function CityToggle({ cityId, onChange }: CityToggleProps) {
  return (
    <div className="city-toggle" role="group" aria-label="Choose city">
      {CITY_LIST.map((city: CityConfig) => {
        const active = city.id === cityId;
        return (
          <button
            key={city.id}
            type="button"
            className={`city-toggle-btn${active ? ' city-toggle-btn--active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(city.id)}
          >
            {city.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
