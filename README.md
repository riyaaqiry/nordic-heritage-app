# Nordic Heritage - Mobilapp

React Native (Expo) app som integrerar med Nordic Digital Solutions annonsmodul. Appen bevakar användarens position och skickar notiser (push, SMS, e-post) när ett UNESCO-världsarv finns i närheten.

---

## Innehåll

1. [Förutsättningar](#förutsättningar)
2. [Installation](#installation)
3. [Starta appen](#starta-appen)
4. [Öppna på telefonen (iOS & Android)](#öppna-på-telefonen)
5. [Funktioner i appen](#funktioner-i-appen)
6. [Projektstruktur](#projektstruktur)
7. [API-endpoints som appen använder](#api-endpoints-som-appen-använder)
8. [Lokal utveckling (valfritt)](#lokal-utveckling-valfritt)
9. [Vanliga problem och lösningar](#vanliga-problem-och-lösningar)

---

## Förutsättningar

| Verktyg | Version | Installera |
|---------|---------|------------|
| Node.js | 18 eller nyare | [nodejs.org](https://nodejs.org/) |
| npm | Följer med Node.js | - |
| Expo Go (iOS) | Senaste från App Store | [App Store-länk](https://apps.apple.com/app/expo-go/id982107779) |
| Expo Go (Android) | Senaste från Google Play | [Google Play-länk](https://play.google.com/store/apps/details?id=host.exp.exponent) |

> **OBS:** Du behöver **inte** installera Xcode eller Android Studio for att testa. Expo Go räcker.

---

## Installation

```bash
cd nordic-heritage-app
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` behövs p.g.a. Expo SDK 54:s beroenden. **Kör aldrig** `npm audit fix --force` — det bryter paketversioner.

---

## Starta appen

```bash
npx expo start --host lan
```

> `--host lan` är **viktigt** — utan det försöker telefonen ansluta till `localhost` vilket inte fungerar.

Du ser nu en QR-kod i terminalen. Ingen backend eller ngrok behövs — appen pekar direkt mot produktionsservern `nds.samincodes.com`.

---

## Öppna på telefonen

### iOS

1. Öppna **Kamera-appen** (inte Expo Go)
2. Rikta kameran mot QR-koden i terminalen
3. Tryck på bannern "Öppna i Expo Go" som dyker upp

### Android

1. Öppna **Expo Go**-appen
2. Tryck **Scan QR code**
3. Skanna QR-koden i terminalen

### Flera användare samtidigt

Alla i gruppen kan öppna appen samtidigt — telefonen behöver bara vara på samma Wi-Fi som datorn som kör `npx expo start`.

---

## Funktioner i appen

Appen har tre flikar:

### Upptäck

Listar UNESCO-världsarv inom 150 km från din position. Tryck på ett världsarv för att öppna annonswidgeten med mer information.

### Annonsmodul

Visar backend-widgeten i en WebView med information om närliggande världsarv och kopplad annonsering.

### Inställningar

| Funktion | Beskrivning |
|----------|-------------|
| **Platsspårning** | Aktivera för att bevaka din position. I Expo Go körs förgrundsspårning (medan appen är öppen). I en produktionsbygge körs full bakgrundsspårning. |
| **Push-notiser** | Aktivera för att visa lokala notiser på enheten. |
| **Prenumeration** | Ange telefonnummer och/eller e-post. Backend skickar då SMS/e-post via HelloSMS/SMTP2GO när du är nära ett världsarv. |

### Hur platsspårning fungerar

1. Du aktiverar togglen i Inställningar
2. Appen frågar om platsbehörighet
3. Positionen kollas vid rörelse (100+ meter) och var 60:e sekund
4. Om ett världsarv finns inom 5 km:
   - Lokal push-notis visas i appen
   - Backend triggas att skicka SMS/e-post (om prenumeration är aktiv)
5. Cooldown: max en notis per världsarv per timme

---

## Projektstruktur

```
nordic-heritage-app/
├── App.js                         # Huvudapp med tab-navigation
├── app.json                       # Expo-konfiguration
├── package.json                   # Beroenden (Expo SDK 54)
├── src/
│   ├── config.js                  # API-URL, avståndströsklar, intervall
│   ├── screens/
│   │   ├── HomeScreen.js          # "Upptäck" — lista världsarv i närheten
│   │   ├── WidgetScreen.js        # "Annonsmodul" — WebView med widget
│   │   └── SettingsScreen.js      # "Inställningar" — spårning & prenumeration
│   └── services/
│       ├── api.js                 # HTTP-anrop till backend
│       ├── location.js            # Platsbehörigheter + bakgrundsspårning
│       ├── locationTask.js        # Bakgrundsuppgift (TaskManager)
│       ├── foregroundTracking.js  # Förgrundsspårning (fallback i Expo Go)
│       └── notifications.js       # Push-notis-konfiguration
└── assets/                        # Ikoner och splash screen
```

---

## API-endpoints som appen använder

Alla anrop går mot `https://nds.samincodes.com`.

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/unesco/sites?lat=X&lon=Y&radius=Z` | Hämta världsarv nära position |
| POST | `/api/notification/subscribe` | Registrera prenumeration (telefon/e-post) |
| POST | `/api/notification/unsubscribe` | Avsluta prenumeration |
| GET | `/api/notification/trigger` | Trigga notis för en användare nära en plats |
| POST | `/api/notification/mark-visited` | Markera världsarv som besökt |
| GET | `/widget` | Annonswidgeten (visas i WebView) |

---

## Lokal utveckling (valfritt)

Om du vill köra mot en lokal backend istället för produktionsservern, ändra `src/config.js`:

```javascript
export const API_BASE_URL = 'http://<din-dators-ip>:8000';
```

Starta sedan backend:

```bash
cd Nordic-Digital-Solutions
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000
```

> Telefonen och datorn måste vara på samma Wi-Fi. Använd datorns LAN-IP (t.ex. `192.168.1.x`), inte `localhost`.

---

## Vanliga problem och lösningar

### "Inga världsarv hittades i din närhet"

Kontrollera att platsdelning är aktiverad på telefonen och att appen har fått platsbehörighet.

### Appen hittar inte servern / "Network request failed"

- Kontrollera att telefonen har internetåtkomst
- Testa URL:en i telefonens webbläsare: `https://nds.samincodes.com/docs`

### npm install ger peer dependency-fel

Kör alltid med flaggan:

```bash
npm install --legacy-peer-deps
```

### Expo Go visar "Incompatible SDK version"

Projektet kräver **Expo SDK 54**. Uppdatera Expo Go till senaste version via App Store / Google Play.

### Platsspårning-togglen fungerar inte

Kontrollera att du har gett appen platsbehörighet. Gå till telefonens Inställningar > Nordic Heritage > Plats och välj "Medan appen används".

### Prenumeration misslyckas med "Anropet misslyckades"

Produktionsservern `nds.samincodes.com` svarar inte. Kontrollera din internetanslutning eller försök igen senare.

---

## Snabbstart

```bash
# 1. Installera beroenden
npm install --legacy-peer-deps

# 2. Starta appen
npx expo start --host lan

# 3. Skanna QR-koden med telefonen — klart!
```
