import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { jitterForPlace, SF_NEIGHBORHOOD_CENTROIDS } from '../data/sfCentroids';
import type { Place } from '../data/places';

interface PlacesMapProps {
  open: boolean;
  onClose: () => void;
  places: Place[];
}

const SF_CENTER: L.LatLngExpression = [37.7749, -122.4194];
const SF_BOUNDS = L.latLngBounds([37.7, -122.52], [37.83, -122.35]);

function resolveCoords(place: Place): { lat: number; lng: number; approximate: boolean } | null {
  if (place.lat != null && place.lng != null) {
    return { lat: place.lat, lng: place.lng, approximate: false };
  }
  const base = SF_NEIGHBORHOOD_CENTROIDS[place.neighborhood];
  if (!base) return null;
  return { ...jitterForPlace(place.id, base), approximate: true };
}

const pinIcon = L.divIcon({
  className: 'map-pin',
  html: `<span class="map-pin-dot"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

export function PlacesMap({ open, onClose, places }: PlacesMapProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const mappable = useMemo(() => {
    return places
      .map((place) => {
        const coords = resolveCoords(place);
        return coords ? { place, coords } : null;
      })
      .filter((x): x is { place: Place; coords: { lat: number; lng: number; approximate: boolean } } => x != null);
  }, [places]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !mapEl.current) return;

    const map = L.map(mapEl.current, {
      center: SF_CENTER,
      zoom: 12,
      maxBounds: SF_BOUNDS.pad(0.25),
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;

    const layer = L.layerGroup().addTo(map);
    const bounds: L.LatLngExpression[] = [];

    for (const { place, coords } of mappable) {
      const latlng: L.LatLngExpression = [coords.lat, coords.lng];
      bounds.push(latlng);
      const marker = L.marker(latlng, { icon: pinIcon });
      const addr = place.address
        ? `<div class="map-popup-addr">${place.address}${coords.approximate ? ' · approx.' : ''}</div>`
        : coords.approximate
          ? `<div class="map-popup-addr">Neighborhood approx.</div>`
          : '';
      marker.bindPopup(`<div class="map-popup"><strong>${place.name}</strong>${addr}</div>`, {
        maxWidth: 220,
      });
      marker.addTo(layer);
    }

    const fit = () => {
      if (bounds.length === 1) map.setView(bounds[0], 15);
      else if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
      else map.setView(SF_CENTER, 12);
      map.invalidateSize();
    };

    const t1 = window.setTimeout(fit, 40);
    const t2 = window.setTimeout(() => map.invalidateSize(), 200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      map.remove();
      mapRef.current = null;
    };
  }, [open, mappable]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="map-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="map-modal"
            role="dialog"
            aria-modal="true"
            aria-label="San Francisco map"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <header className="map-modal-header">
              <div>
                <h2 className="map-modal-title">San Francisco map</h2>
                <p className="map-modal-sub">
                  {mappable.length} pin{mappable.length === 1 ? '' : 's'} from your current filters
                  {' · '}tap a pin for details
                </p>
              </div>
              <button type="button" className="map-modal-close" onClick={onClose} aria-label="Close map">
                ×
              </button>
            </header>
            <div className="map-canvas" ref={mapEl} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
