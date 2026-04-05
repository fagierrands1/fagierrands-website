// Global configuration settings
import { getFrontendUrl, getApiBaseUrl } from './utils/environment';

const config = {
  // API base URL determined dynamically based on environment
  API_BASE_URL: getApiBaseUrl(),
  
  // Frontend URL determined dynamically based on environment
  FRONTEND_URL: getFrontendUrl(),
  
  // Add any other configuration settings here
  APP_NAME: 'Fagi Errands',
  APP_VERSION: '1.0.0',
};

export default config;