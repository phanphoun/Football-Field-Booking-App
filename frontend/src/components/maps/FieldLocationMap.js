import React, { useEffect, useRef, useState } from 'react';
import { hasGoogleMapsApiKey, loadGoogleMaps } from './googleMapsLoader';
import { loadLeaflet } from './leafletLoader';

const FieldLocationMap = ({ latitude, longitude }) => {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const providerRef = useRef(hasGoogleMapsApiKey ? 'google' : 'leaflet');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      try {
        const lat = Number(latitude);
        const lng = Number(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        if (hasGoogleMapsApiKey) {
          providerRef.current = 'google';
          const maps = await loadGoogleMaps();
          if (!active || !mapElementRef.current || mapRef.current) return;

          mapRef.current = new maps.Map(mapElementRef.current, {
            center: { lat, lng },
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });

          new maps.Marker({
            position: { lat, lng },
            map: mapRef.current
          });
          return;
        }

        providerRef.current = 'leaflet';
        const L = await loadLeaflet();
        if (!active || !mapElementRef.current || mapRef.current) return;

        mapRef.current = L.map(mapElementRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          dragging: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        L.marker([lat, lng]).addTo(mapRef.current);
      } catch (leafletError) {
        setError(leafletError.message || 'Failed to load map.');
      }
    };

    initMap();

    return () => {
      active = false;
      if (providerRef.current === 'leaflet' && mapRef.current?.remove) {
        mapRef.current.remove();
      }
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
      <div ref={mapElementRef} className="h-[320px] w-full bg-slate-100" />
      <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
      </div>
    </div>
  );
};

export default FieldLocationMap;
