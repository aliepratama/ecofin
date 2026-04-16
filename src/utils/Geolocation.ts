export interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

export function getCurrentLocation(): Promise<GeolocationData> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "An unknown error occurred.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
        }
        resolve({
          latitude: null,
          longitude: null,
          error: errorMessage,
        });
      },
      {
        timeout: 10000,
        maximumAge: 0,
        enableHighAccuracy: true,
      },
    );
  });
}
