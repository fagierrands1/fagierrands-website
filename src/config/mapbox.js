// src/config/mapbox.js
// Mapbox configuration

const getMapboxToken = () => {
  const token = process.env.REACT_APP_MAPBOX_TOKEN;
  if (!token) {
    console.warn('REACT_APP_MAPBOX_TOKEN not set. Map features may not work.');
  }
  return token || '';
};

const getMapboxSecretToken = () => {
  const token = process.env.REACT_APP_MAPBOX_SECRET_TOKEN;
  if (!token) {
    console.warn('REACT_APP_MAPBOX_SECRET_TOKEN not set. Tile caching may not work.');
  }
  return token || '';
};

export const MAPBOX_CONFIG = {
  // Public access token for client-side Mapbox GL
  ACCESS_TOKEN: getMapboxToken(),
  
  // Secret token for server-side tile requests (for caching)
  SECRET_TOKEN: getMapboxSecretToken(),
  
  // Available map styles
  STYLES: {
    STREETS: 'mapbox://styles/mapbox/streets-v12',
    SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
    SATELLITE_STREETS: 'mapbox://styles/mapbox/satellite-streets-v12',
    LIGHT: 'mapbox://styles/mapbox/light-v11',
    DARK: 'mapbox://styles/mapbox/dark-v11',
    OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
    NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
    NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1'
  },
  
  // Default configuration
  DEFAULT_STYLE: 'mapbox://styles/mapbox/satellite-streets-v12',
  DEFAULT_ZOOM: 14,
  DEFAULT_CENTER: [36.8228, -1.2876], // Nairobi CBD center [lng, lat]
  
  // Tile server URLs for OpenLayers integration
  getTileUrl: (style) => {
    const token = getMapboxSecretToken();
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${token}`;
  },
  
  TILE_URLS: {
    get STREETS() { return MAPBOX_CONFIG.getTileUrl('streets-v12'); },
    get SATELLITE() { return MAPBOX_CONFIG.getTileUrl('satellite-v9'); },
    get SATELLITE_STREETS() { return MAPBOX_CONFIG.getTileUrl('satellite-streets-v12'); },
    get LIGHT() { return MAPBOX_CONFIG.getTileUrl('light-v11'); },
    get DARK() { return MAPBOX_CONFIG.getTileUrl('dark-v11'); },
    get OUTDOORS() { return MAPBOX_CONFIG.getTileUrl('outdoors-v12'); }
  },
  
  // Attribution text
  ATTRIBUTION: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
};

export default MAPBOX_CONFIG;