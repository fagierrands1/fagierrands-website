// src/utils/loadGoogleMaps.js
// Utility to dynamically load Google Maps API

let loadPromise = null;
let isLoaded = false;

export const loadGoogleMaps = (apiKey) => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isLoaded || (window.google && window.google.maps && window.google.maps.Map)) {
    isLoaded = true;
    window.googleMapsLoaded = true;
    return Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkLoaded);
          isLoaded = true;
          window.googleMapsLoaded = true;
          window.dispatchEvent(new Event('googlemapsloaded'));
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!isLoaded) {
          reject(new Error('Google Maps API load timeout'));
        }
      }, 10000);
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing&v=3.54`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait for google.maps to be fully available
      const checkReady = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkReady);
          isLoaded = true;
          window.googleMapsLoaded = true;
          window.dispatchEvent(new Event('googlemapsloaded'));
          console.log('Google Maps API loaded successfully');
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkReady);
        if (!isLoaded) {
          reject(new Error('Google Maps API initialization timeout'));
        }
      }, 5000);
    };
    
    script.onerror = (error) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API script'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};

// Check if Google Maps is already loaded
export const isGoogleMapsLoaded = () => {
  return isLoaded || (window.google && window.google.maps && window.google.maps.Map);
};

