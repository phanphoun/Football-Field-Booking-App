import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { hasGoogleMapsApiKey, loadGoogleMaps } from './googleMapsLoader';
import { loadLeaflet } from './leafletLoader';

const DEFAULT_CENTER = { lat: 11.5564, lng: 104.9282 };
const DEFAULT_ZOOM = 12;

const extractAddressComponent = (components, types) => {
  const match = components.find((component) => types.some((type) => component.types.includes(type)));
  return match?.long_name || '';
};

const reverseGeocodeWithGoogle = async (maps, latitude, longitude) => {
  const geocoder = new maps.Geocoder();
  const response = await geocoder.geocode({
    location: { lat: latitude, lng: longitude }
  });

  const result = Array.isArray(response.results) ? response.results[0] : null;
  if (!result) {
    throw new Error('Reverse geocoding failed.');
  }

  const components = Array.isArray(result.address_components) ? result.address_components : [];
  const city = extractAddressComponent(components, [
    'locality',
    'administrative_area_level_2',
    'postal_town',
    'sublocality_level_1'
  ]);

  return {
    latitude,
    longitude,
    address: result.formatted_address || '',
    city,
    province: extractAddressComponent(components, ['administrative_area_level_1']) || '',
    label: result.formatted_address || ''
  };
};

const reverseGeocodeWithOsm = async (latitude, longitude) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Reverse geocoding failed.');
  }

  const data = await response.json();
  const address = data.address || {};
  const city =
    address.city ||
    address.town ||
    address.municipality ||
    address.county ||
    address.state_district ||
    '';

  return {
    latitude,
    longitude,
    address:
      data.display_name ||
      [address.road, address.suburb, city].filter(Boolean).join(', '),
    city,
    province: address.state || address.region || '',
    label: data.display_name || ''
  };
};

const FieldLocationPicker = ({ value, onChange }) => {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const providerRef = useRef(hasGoogleMapsApiKey ? 'google' : 'leaflet');
  const mapsApiRef = useRef(null);
  const initialCoordinatesRef = useRef({
    latitude: value?.latitude,
    longitude: value?.longitude
  });
  const [mapError, setMapError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      try {
        const initialLat = Number(initialCoordinatesRef.current.latitude);
        const initialLng = Number(initialCoordinatesRef.current.longitude);
        const hasCoordinates = Number.isFinite(initialLat) && Number.isFinite(initialLng);
        if (hasGoogleMapsApiKey) {
          providerRef.current = 'google';
          const maps = await loadGoogleMaps();
          mapsApiRef.current = maps;
          if (!active || !mapElementRef.current || mapRef.current) return;

          const center = hasCoordinates ? { lat: initialLat, lng: initialLng } : DEFAULT_CENTER;

          mapRef.current = new maps.Map(mapElementRef.current, {
            center,
            zoom: hasCoordinates ? 15 : DEFAULT_ZOOM,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });

          const updateLocation = async (latitude, longitude) => {
            const position = { lat: latitude, lng: longitude };

            if (!markerRef.current) {
              markerRef.current = new maps.Marker({
                position,
                map: mapRef.current,
                draggable: true
              });
              markerRef.current.addListener('dragend', async (dragEvent) => {
                const lat = Number(dragEvent.latLng.lat().toFixed(8));
                const lng = Number(dragEvent.latLng.lng().toFixed(8));
                await updateLocation(lat, lng);
              });
            } else {
              markerRef.current.setPosition(position);
            }

            mapRef.current.panTo(position);

            setLocationLoading(true);
            setLocationError('');

            try {
              const nextLocation = await reverseGeocodeWithGoogle(maps, latitude, longitude);
              onChange(nextLocation);
            } catch (error) {
              setLocationError(error.message || 'Could not read address from the map.');
              onChange({
                latitude,
                longitude,
                address: '',
                city: '',
                province: '',
                label: ''
              });
            } finally {
              setLocationLoading(false);
            }
          };

          if (hasCoordinates) {
            await updateLocation(initialLat, initialLng);
          }

          mapRef.current.addListener('click', async (event) => {
            const latitude = Number(event.latLng.lat().toFixed(8));
            const longitude = Number(event.latLng.lng().toFixed(8));
            await updateLocation(latitude, longitude);
          });
          return;
        }

        providerRef.current = 'leaflet';
        const L = await loadLeaflet();
        if (!active || !mapElementRef.current || mapRef.current) return;

        const center = hasCoordinates ? [initialLat, initialLng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

        mapRef.current = L.map(mapElementRef.current, {
          center,
          zoom: hasCoordinates ? 15 : DEFAULT_ZOOM,
          scrollWheelZoom: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapRef.current);

        if (hasCoordinates) {
          markerRef.current = L.marker(center).addTo(mapRef.current);
        }

        mapRef.current.on('click', async (event) => {
          const latitude = Number(event.latlng.lat.toFixed(8));
          const longitude = Number(event.latlng.lng.toFixed(8));

          if (!markerRef.current) {
            markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
          } else {
            markerRef.current.setLatLng([latitude, longitude]);
          }

          setLocationLoading(true);
          setLocationError('');

          try {
            const nextLocation = await reverseGeocodeWithOsm(latitude, longitude);
            onChange(nextLocation);
          } catch (error) {
            setLocationError(error.message || 'Could not read address from the map.');
            onChange({
              latitude,
              longitude,
              address: '',
              city: '',
              province: '',
              label: ''
            });
          } finally {
            setLocationLoading(false);
          }
        });
      } catch (error) {
        setMapError(error.message || 'Failed to load map.');
      }
    };

    initMap();

    return () => {
      active = false;
      if (providerRef.current === 'leaflet' && mapRef.current?.remove) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latitude = Number(value?.latitude);
    const longitude = Number(value?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    if (providerRef.current === 'google') {
      const nextLatLng = { lat: latitude, lng: longitude };
      map.setCenter(nextLatLng);
      map.setZoom(15);

      if (!markerRef.current && mapsApiRef.current) {
        markerRef.current = new mapsApiRef.current.Marker({
          position: nextLatLng,
          map,
          draggable: true
        });
      } else if (markerRef.current) {
        markerRef.current.setPosition(nextLatLng);
      }
      return;
    }

    const nextLatLng = [latitude, longitude];
    map.setView(nextLatLng, 15);
    if (!markerRef.current && window.L) {
      markerRef.current = window.L.marker(nextLatLng).addTo(map);
    } else if (markerRef.current?.setLatLng) {
      markerRef.current.setLatLng(nextLatLng);
    }
  }, [value?.latitude, value?.longitude]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available in this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(8));
        const longitude = Number(position.coords.longitude.toFixed(8));

        try {
          const nextLocation =
            hasGoogleMapsApiKey
              ? await reverseGeocodeWithGoogle(
                  mapsApiRef.current || (await loadGoogleMaps()),
                  latitude,
                  longitude
                )
              : await reverseGeocodeWithOsm(latitude, longitude);
          onChange(nextLocation);
        } catch (error) {
          setLocationError(error.message || 'Could not read address from the map.');
          onChange({
            latitude,
            longitude,
            address: '',
            city: '',
            province: '',
            label: ''
          });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationError('Could not access your current location.');
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Location</h3>
          <p className="mt-1 text-sm text-slate-500">
            Click on the map to capture the field address automatically.
            {!hasGoogleMapsApiKey ? ' Using fallback map until a Google Maps key is added.' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Use My Location
        </button>
      </div>

      {mapError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {mapError}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
          <div ref={mapElementRef} className="h-[320px] w-full bg-slate-100" />
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <MapPinIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {locationLoading ? 'Reading map location...' : value?.address || 'No location selected yet'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {value?.city || 'City unknown'}
              {value?.province ? `, ${value.province}` : ''}
            </p>
            {Number.isFinite(Number(value?.latitude)) && Number.isFinite(Number(value?.longitude)) && (
              <p className="mt-1 text-xs text-slate-500">
                {Number(value.latitude).toFixed(6)}, {Number(value.longitude).toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>

      {locationError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {locationError}
        </div>
      )}
    </div>
  );
};

export default FieldLocationPicker;
