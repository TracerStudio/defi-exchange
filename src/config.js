// Конфігурація для різних середовищ
const config = {
  development: {
    adminServerUrl: 'http://localhost:3002',
    apiBaseUrl: 'http://localhost:3002/api'
  },
  production: {
    adminServerUrl: process.env.REACT_APP_ADMIN_SERVER_URL || 'https://defi-exchange-main.onrender.com',
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'https://defi-exchange-main.onrender.com/api'
  }
};

// Визначаємо поточне середовище
const environment = process.env.NODE_ENV || 'development';

// Експортуємо конфігурацію для поточного середовища
export default config[environment];
