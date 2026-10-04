import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Button from './Button';
import toast from 'react-hot-toast';

// Fix Leaflet's default marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function MapCenterer({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom() || 15);
    }
  }, [position?.[0], position?.[1]]);
  return null;
}

const LocationPicker = ({
  value,
  onChange,
  defaultCenter = [11.4443, 77.6898],
  required = false,
  label = 'Pin Your Location',
  addressQuery = '',
  showAddressInput = false, // NEW: show internal address input
}) => {
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [localAddress, setLocalAddress] = useState('');

  // Sync external address if provided
  useEffect(() => {
    if (addressQuery) setLocalAddress(addressQuery);
  }, [addressQuery]);

  const lat = value?.latitude != null ? parseFloat(value.latitude) : null;
  const lng = value?.longitude != null ? parseFloat(value.longitude) : null;
  const position =
    lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
      ? [lat, lng]
      : null;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latVal = pos.coords.latitude;
        const lngVal = pos.coords.longitude;
        onChange(latVal, lngVal);
        setLocating(false);
        setShowMap(true);
        toast.success('Location captured from GPS');
      },
      (err) => {
        setLocating(false);
        console.error(err);
        toast.error(
          'Unable to access your location. Please pick on the map manually.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = (newLat, newLng) => {
    onChange(newLat, newLng);
  };

  const handleManualInput = (field, val) => {
    const num = parseFloat(val);
    if (Number.isNaN(num)) return;
    if (field === 'lat') onChange(num, lng ?? 0);
    else onChange(lat ?? 0, num);
  };

  const handleFindAddress = async () => {
    const address = (localAddress || '').trim();
    if (!address) {
      toast.error('Please type an address first');
      return;
    }

    setGeocoding(true);
    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const url = `${API_BASE_URL}/discovery/geocode?q=${encodeURIComponent(
        address
      )}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Address not found');
        return;
      }

      onChange(data.data.latitude, data.data.longitude);
      setShowMap(true);

      if (data.data.used_fallback) {
        toast(data.data.fallback_note || 'Using nearest match', {
          icon: '⚠️',
          duration: 6000,
        });
      } else {
        toast.success(`Found: ${data.data.display_name}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to look up address');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <label className="text-sm font-medium text-gray-700">
          📍 {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMap((v) => !v)}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
      </div>

      {/* Address input + Find button (used when no external addressQuery) */}
      {(showAddressInput || !addressQuery) && (
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            type="text"
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFindAddress()}
            placeholder="Type area / city (e.g. Komarapalayam, Tamil Nadu)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleFindAddress}
            loading={geocoding}
          >
            🔍 Find
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleUseMyLocation}
            loading={locating}
          >
            📍 GPS
          </Button>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-2">
        Or click anywhere on the map to pin your exact location.
      </p>

      {showMap && (
        <div
          className="rounded-lg overflow-hidden border border-gray-300 mb-3"
          style={{ height: '300px', width: '100%' }}
        >
          <MapContainer
            center={position || defaultCenter}
            zoom={position ? 15 : 12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler position={position} onChange={handleMapClick} />
            <MapCenterer position={position} />
          </MapContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat ?? ''}
            onChange={(e) => handleManualInput('lat', e.target.value)}
            placeholder="e.g. 11.4443"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng ?? ''}
            onChange={(e) => handleManualInput('lng', e.target.value)}
            placeholder="e.g. 77.6898"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {position && (
        <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
          ✓ Location set: {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
      )}

      {required && !position && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
          Location is required. Please set it above.
        </div>
      )}
    </div>
  );
};

export default LocationPicker;