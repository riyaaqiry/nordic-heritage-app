# Nordic Heritage - Mobilapp

React Native (Expo) app som integrerar med Nordic Digital Solutions annonsmodul. Appen bevakar användarens position i bakgrunden och skickar notiser när ett UNESCO-världsarv finns i närheten.

## Funktioner

- **Bakgrundsplatsövervakning** — Spårar position även när appen är stängd (iOS + Android)
- **Push-notiser** — Lokal notis direkt i appen + SMS/e-post via backend
- **Annonswidget** — Visar er webb-widget via WebView
- **Prenumeration** — Anslut telefonnummer/e-post för SMS/e-post-notiser

## Kom igång

### Förutsättningar
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- Expo Go-appen på din telefon (för testning)

### Installation

```bash
cd mobile-app
npm install
```

### Konfigurera

Redigera `src/config.js` och sätt `API_BASE_URL` till din backend-server:
- **Utveckling:** Din lokala IP (t.ex. `http://192.168.1.100:8000`)
- **Produktion:** Serverns publika URL

### Starta

```bash
npx expo start
```

Skanna QR-koden med Expo Go (Android) eller Kamera-appen (iOS).

### Bygga för distribution

```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Arkitektur

```
mobile-app/
├── App.js                    # Huvudapp med navigation
├── src/
│   ├── config.js             # API-URL och tröskelvärden
│   ├── screens/
│   │   ├── HomeScreen.js     # Lista världsarv i närheten
│   │   ├── WidgetScreen.js   # WebView med annonswidget
│   │   └── SettingsScreen.js # Prenumeration & platsinställningar
│   └── services/
│       ├── api.js            # HTTP-anrop till backend
│       ├── location.js       # Platshantering (förgrund/bakgrund)
│       ├── locationTask.js   # Bakgrundsuppgift (TaskManager)
│       └── notifications.js  # Push-notis setup
```

## Hur bakgrundsspårningen fungerar

1. Användaren aktiverar "Bakgrundsspårning" i Inställningar
2. Appen begär "Alltid"-platsåtkomst från OS
3. `expo-task-manager` kör `locationTask.js` i bakgrunden
4. Vid varje platsuppdatering:
   - Hämtar världsarv nära positionen via `/unesco/sites`
   - Om ett världsarv finns inom 5 km: triggar notis via `/api/notification/trigger`
   - Visar lokal push-notis i appen
5. Cooldown: max en notis per världsarv per timme

## Integration med backend

Appen använder dessa befintliga API-endpoints:

| Endpoint | Användning |
|----------|-----------|
| `GET /unesco/sites?lat=X&lon=Y&radius=Z` | Hämta världsarv nära position |
| `POST /api/notification/subscribe` | Registrera prenumeration |
| `POST /api/notification/unsubscribe` | Avsluta prenumeration |
| `GET /api/notification/trigger` | Trigga notis för användare nära plats |
| `POST /api/notification/mark-visited` | Markera världsarv som besökt |
| `GET /widget` | Annonswidgeten (visas i WebView) |

## Behörigheter

### iOS
- Plats: "Alltid" (för bakgrundsspårning)
- Notiser: Push-notiser
- Nätverk: Åtkomst till API-server

### Android
- `ACCESS_FINE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `POST_NOTIFICATIONS` (Android 13+)
