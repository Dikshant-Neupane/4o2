import { useState, useEffect } from 'react';

const useGPS = () => {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    console.log('[GPS] Requesting...');
    
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      setLoading(false);
      console.error('[GPS] ❌ Error:', msg);
      return;
    }

    const successCallback = (position) => {
      const newCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(newCoords);
      setAccuracy(position.coords.accuracy);
      setLoading(false);
      console.log('[GPS] ✅ Acquired:', newCoords);
    };

    const errorCallback = (err) => {
      let msg = 'Failed to get location';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg = 'User denied the request for Geolocation. Please enable location permissions in your browser settings.';
          break;
        case err.POSITION_UNAVAILABLE:
          msg = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          msg = 'The request to get user location timed out.';
          break;
        default:
          msg = 'An unknown error occurred.';
          break;
      }
      setError(msg);
      setLoading(false);
      console.error('[GPS] ❌ Error:', msg);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  return { loading, coords, error, accuracy };
};

export default useGPS;
