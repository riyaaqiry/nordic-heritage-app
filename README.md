# Nordic Heritage - Mobilapp

React Native (Expo) app som integrerar med Nordic Digital Solutions annonsmodul. Appen bevakar användarens position och skickar notiser (push, SMS, e-post) när ett UNESCO-världsarv finns i närheten.

---

## Innehåll

1. [Förutsättningar](#förutsättningar)
2. [Ladda ner projektet](#ladda-ner-projektet)
3. [Installation](#installation)
4. [Konfigurera backend-URL](#konfigurera-backend-url)
5. [Starta appen](#starta-appen)
6. [Öppna på telefonen (iOS & Android)](#öppna-på-telefonen)
7. [Köra egen backend med ngrok](#köra-egen-backend-med-ngrok)
8. [Funktioner i appen](#funktioner-i-appen)
9. [Projektstruktur](#projektstruktur)
10. [Vanliga problem och lösningar](#vanliga-problem-och-lösningar)

---

## Förutsättningar

Installera följande **innan** du börjar:

| Verktyg | Version | Installera |
|---------|---------|------------|
| Node.js | 18 eller nyare | [nodejs.org](https://nodejs.org/) |
| npm | Följer med Node.js | - |
| Expo Go (iOS) | Senaste från App Store | [App Store-länk](https://apps.apple.com/app/expo-go/id982107779) |
| Expo Go (Android) | Senaste från Google Play | [Google Play-länk](https://play.google.com/store/apps/details?id=host.exp.exponent) |

> **OBS:** Du behöver **inte** installera Xcode eller Android Studio for att testa. Expo Go räcker.

---

## Ladda ner projektet

### Alt 1 - Git (rekommenderat)

```bash
git clone <repo-url>
cd nordic-heritage-app
```

### Alt 2 - Manuellt

Ladda ner ZIP-filen, packa upp och navigera till mappen:

```bash
cd nordic-heritage-app
```

---

## Installation

Kör i projektmappen:

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` behövs p.g.a. Expo SDK 54:s beroenden. **Kör aldrig** `npm audit fix --force` — det bryter paketversioner.

---

## Konfigurera backend-URL

Appen behöver nå backend-servern via en publik URL. Vi använder **ngrok** med en statisk domän.

Öppna `src/config.js`:

```javascript
export const API_BASE_URL = 'https://unrushed-maximum-subatomic.ngrok-free.dev';
```

Ändra URL:en **bara om** backend körs på en annan adress. Om du kör backend lokalt behöver ngrok vara igång:

```bash
# I backend-mappen (Nordic-Digital-Solutions)
ngrok http --url=unrushed-maximum-subatomic.ngrok-free.dev 8000
```

> Ngrok-domänen är permanent och ändras inte mellan sessioner.

---

## Starta appen

Kör i projektmappen:

```bash
npx expo start --host lan
```

> `--host lan` är **viktigt** — utan det försöker telefonen ansluta till `localhost` vilket inte fungerar.

Du ser nu en QR-kod i terminalen.

---

## Öppna på telefonen

### iOS

1. Öppna **Kamera-appen** (inte Expo Go)
2. Rikta kameran mot QR-koden i terminalen
3. Tryck på bannern "Öppna i Expo Go" som dyker upp
4. Appen laddas och startar

### Android

1. Öppna **Expo Go**-appen
2. Tryck **Scan QR code**
3. Skanna QR-koden i terminalen
4. Appen laddas och startar

### Flera användare samtidigt

Alla i gruppen kan öppna appen samtidigt så länge:
- Din dator (som kör `npx expo start`) och alla telefoner är på **samma Wi-Fi-nätverk**
- Backend + ngrok-tunneln är igång

Varje telefon kör sin egen instans av appen med egen prenumerationsdata.

---

## Köra egen backend med ngrok

### Om du bara testar appen (ingen egen backend)

Du behöver inte göra något extra. Appen pekar redan mot den delade ngrok-URL:en i `src/config.js`. Så länge den som äger tunneln kör sin backend + ngrok fungerar det för alla.

### Om du vill köra egen backend på din dator

Ngrok-domänen i `src/config.js` är knuten till ett specifikt ngrok-konto. Du kan **inte** använda någon annans domän — du får felet `ERR_NGROK_DOMAIN_NOT_FOUND`. Du behöver skapa en egen tunnel:

**1. Skapa gratis ngrok-konto**

Gå till [ngrok.com](https://dashboard.ngrok.com/signup) och skapa ett konto.

**2. Installera ngrok och lägg till din authtoken**

```bash
# macOS
brew install ngrok

# Eller ladda ner från https://ngrok.com/download

# Lägg till din token (hittas på https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken <din-token>
```

**3. Skapa en statisk domän (gratis, 1 st per konto)**

Gå till [ngrok Dashboard → Domains](https://dashboard.ngrok.com/domains) och klicka **Create Domain**. Du får en domän i stil med:

```
ditt-unika-namn.ngrok-free.dev
```

**4. Starta tunneln mot din lokala backend**

```bash
ngrok http --url=ditt-unika-namn.ngrok-free.dev 8000
```

**5. Uppdatera `src/config.js` med din domän**

```javascript
export const API_BASE_URL = 'https://ditt-unika-namn.ngrok-free.dev';
```

**6. Starta backend + app**

```bash
# Terminal 1 — backend
cd Nordic-Digital-Solutions
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2 — ngrok (redan startad i steg 4)

# Terminal 3 — Expo-appen
cd nordic-heritage-app
npx expo start --host lan
```

> **Tips:** Den statiska domänen är permanent och ändras aldrig, men ngrok-processen måste köras för att tunneln ska vara aktiv.

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
│       ├── api.js                 # HTTP-anrop till backend (med ngrok-header)
│       ├── location.js            # Platsbehörigheter + bakgrundsspårning
│       ├── locationTask.js        # Bakgrundsuppgift (TaskManager)
│       ├── foregroundTracking.js  # Förgrundsspårning (fallback i Expo Go)
│       └── notifications.js       # Push-notis-konfiguration
└── assets/                        # Ikoner och splash screen
```

---

## API-endpoints som appen använder

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/unesco/sites?lat=X&lon=Y&radius=Z` | Hämta världsarv nära position |
| POST | `/api/notification/subscribe` | Registrera prenumeration (telefon/e-post) |
| POST | `/api/notification/unsubscribe` | Avsluta prenumeration |
| GET | `/api/notification/trigger` | Trigga notis för en användare nära en plats |
| POST | `/api/notification/mark-visited` | Markera världsarv som besökt |
| GET | `/widget` | Annonswidgeten (visas i WebView) |

---

## Vanliga problem och lösningar

### "Inga världsarv hittades i din närhet" men Annonsmodul visar data

Ngrok-tunneln är inte igång. Starta den:

```bash
ngrok http --url=unrushed-maximum-subatomic.ngrok-free.dev 8000
```

### Appen hittar inte servern / "Network request failed"

- Kontrollera att datorn och telefonen är på **samma Wi-Fi**
- Kontrollera att backend (`uvicorn`) och ngrok körs
- Testa URL:en i telefonens webbläsare: `https://unrushed-maximum-subatomic.ngrok-free.dev/docs`

### npm install ger peer dependency-fel

Kör alltid med flaggan:

```bash
npm install --legacy-peer-deps
```

### Expo Go visar "Incompatible SDK version"

Projektet kräver **Expo SDK 54**. Uppdatera Expo Go till senaste version via App Store / Google Play.

### Platsspårning-togglen fungerar inte

Kontrollera att du har gett appen platsbehörighet. Gå till telefonens Inställningar > Nordic Heritage > Plats och välj "Medan appen används". Förgrundsspårningen aktiveras automatiskt i Expo Go.

### Prenumeration misslyckas med "Anropet misslyckades"

Backend-servern svarar inte. Kontrollera att både `uvicorn` och `ngrok` körs.

---

## Snabbstart (tl;dr)

```bash
# 1. Installera beroenden
npm install --legacy-peer-deps

# 2. Starta appen
npx expo start --host lan

# 3. Skanna QR-koden med telefonen

# 4. I en annan terminal — starta backend + ngrok
cd ../Nordic-Digital-Solutions
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 &
ngrok http --url=unrushed-maximum-subatomic.ngrok-free.dev 8000
```
