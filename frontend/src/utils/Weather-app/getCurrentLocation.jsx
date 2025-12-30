import { useEffect, useState } from "react";
import { AlertBox } from "../../components/AlertBox.jsx";

export default function useCurrentLocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      AlertBox("error", "Geolocation not supported", 503);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setError("Location permission denied");
        AlertBox("error", "Location permission denied", 503);
      }
    );
  }, []);

  return { coords, error };
}
