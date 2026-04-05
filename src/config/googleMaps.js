export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyBUcpU5oFfeaMgxslWs0TmpgMw254AaMSY',
  PLACES_API_KEY: process.env.REACT_APP_GOOGLE_PLACES_API_KEY || 'AIzaSyBUcpU5oFfeaMgxslWs0TmpgMw254AaMSY',
  
  DEFAULT_CENTER: {
    lat: -1.2876,
    lng: 36.8228
  },
  
  DEFAULT_ZOOM: 14,
  
  LIBRARIES: ['places', 'geometry', 'drawing']
};

export default GOOGLE_MAPS_CONFIG;
