import React, { useState, useEffect } from 'react';
import { customerAPI } from '../../services/api';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LocationPicker from '../common/LocationPicker';
import toast from 'react-hot-toast';

// Compact location bar: shows current discovery location + "Change" button.
// Saves location to backend so it persists across sessions.
// Calls onLocationChange(lat, lng) when the location updates.
const LocationBar = ({ onLocationChange }) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSaved();
    // eslint-disable-next-line
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await customerAPI.getDiscoveryLocation();
      const lat = res.data.data.latitude;
      const lng = res.data.data.longitude;
      if (lat != null && lng != null) {
        const loc = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        };
        setLocation(loc);
        setTempLocation(loc);
        onLocationChange && onLocationChange(loc.latitude, loc.longitude);
      }
    } catch (e) {
      console.error('Failed to fetch saved location:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setTempLocation(location);
    setShowPicker(true);
  };

  const handleSave = async () => {
    if (tempLocation.latitude == null || tempLocation.longitude == null) {
      toast.error('Please pick a location first');
      return;
    }

    setSaving(true);
    try {
      await customerAPI.updateDiscoveryLocation({
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
      });
      setLocation(tempLocation);
      onLocationChange && onLocationChange(tempLocation.latitude, tempLocation.longitude);
      toast.success('Location saved');
      setShowPicker(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const hasLocation = location.latitude != null && location.longitude != null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📍</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Your location</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {loading
                ? 'Loading...'
                : hasLocation
                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : 'Not set — please set your location to see nearby shops'}
            </p>
          </div>
        </div>
        <Button size="sm" variant={hasLocation ? 'secondary' : 'primary'} onClick={handleOpen}>
          {hasLocation ? 'Change Location' : 'Set Location'}
        </Button>
      </div>

      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Set Your Location"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set your location to discover nearby businesses. This is saved to
            your profile and used every time you use Nearby or Search.
          </p>

                   <LocationPicker
            value={tempLocation}
            onChange={(lat, lng) =>
              setTempLocation({ latitude: lat, longitude: lng })
            }
            required={true}
            label="Your Location"
            showAddressInput={true}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowPicker(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Location
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LocationBar;