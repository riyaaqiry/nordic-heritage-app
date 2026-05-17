// Byt denna URL till er servers riktiga adress vid deployment
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:8000'  // Byt till din lokala IP vid utveckling
  : 'https://api.nordicdigitalsolutions.se';

// Avstånd i meter för att trigga notis om världsarv
export const PROXIMITY_THRESHOLD_METERS = 5000;

// Hur ofta bakgrundsplatsen uppdateras (millisekunder)
export const BACKGROUND_LOCATION_INTERVAL = 60000; // 1 minut

// Minsta förflyttning för att trigga uppdatering (meter)
export const BACKGROUND_LOCATION_DISTANCE = 100;
