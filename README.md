# Nordic Heritage - Mobilapp

React Native (Expo) app för iOS och Android som spårar användarens position i bakgrunden och skickar platsdata till `POST /api/notification/location`. Backend hittar närmaste UNESCO-världsarv och triggar notifikationer (lokal push-notis, SMS och e-post) till prenumeranter.

---

## Innehåll

1. [Förutsättningar](#förutsättningar)
2. [Installation](#installation)
3. [Starta appen](#starta-appen)
4. [Köra på fysisk iPhone](#köra-på-fysisk-iphone)
5. [Köra på fysisk Android](#köra-på-fysisk-android)
6. [Köra på emulator (dator)](#köra-på-emulator-dator)
7. [Hur appen fungerar](#hur-appen-fungerar)
8. [Flikar i appen](#flikar-i-appen)
9. [Projektstruktur](#projektstruktur)
10. [API-endpoints som appen använder](#api-endpoints-som-appen-använder)
11. [Lokal utveckling (valfritt)](#lokal-utveckling-valfritt)
12. [Vanliga problem och lösningar](#vanliga-problem-och-lösningar)

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

## Köra på fysisk iPhone

### Förutsättningar

- iPhone med **Expo Go** installerad från App Store
- Telefon och dator på **samma Wi-Fi**

### Steg för steg

1. Starta appen på datorn:
   ```bash
   cd nordic-heritage-app
   npx expo start --host lan
   ```
2. QR-kod visas i terminalen
3. Öppna **Kamera-appen** på iPhone (inte Expo Go)
4. Rikta kameran mot QR-koden
5. Tryck på bannern **"Öppna i Expo Go"**
6. Appen laddas och startar
7. Gå till fliken **Inställningar**
8. Logga in med e-post och lösenord
9. Appen hämtar din GPS-position och skickar till `/api/notification/location`
10. En push-notis visas: **"Världsarv i närheten!"** med närmaste UNESCO-plats
11. Aktivera **Platsspårning** — appen fortsätter skicka position medan den är öppen (förgrundsspårning i Expo Go)
12. Aktivera **Prenumeration** med telefonnummer — du får nu även SMS/e-post

> **OBS:** I Expo Go på iPhone körs förgrundsspårning (appen måste vara öppen). Full bakgrundsspårning kräver ett produktionsbygge via `eas build`.

---

## Köra på fysisk Android

### Förutsättningar

- Android-telefon med **Expo Go** installerad från Google Play
- Telefon och dator på **samma Wi-Fi**

### Steg för steg

1. Starta appen på datorn:
   ```bash
   cd nordic-heritage-app
   npx expo start --host lan
   ```
2. QR-kod visas i terminalen
3. Öppna **Expo Go** på Android-telefonen
4. Tryck **Scan QR code**
5. Skanna QR-koden i terminalen
6. Appen laddas och startar
7. Gå till fliken **Inställningar**
8. Logga in med e-post och lösenord
9. Appen frågar om **platsbehörighet** — tryck "Tillåt"
10. Position skickas till `/api/notification/location`
11. Push-notis visas: **"Världsarv i närheten!"**
12. Aktivera **Platsspårning** — appen frågar om bakgrundsbehörighet
13. Välj **"Tillåt hela tiden"** för bakgrundsspårning
14. Minimera appen — spårningen fortsätter i bakgrunden
15. Aktivera **Prenumeration** med telefonnummer — du får nu även SMS/e-post

> **Alternativ: Installera som riktig app (APK)**
>
> ```bash
> eas build --platform android --profile preview
> ```
> Ladda ner APK:en från länken som visas och installera på telefonen. Då fungerar bakgrundsspårning fullt ut utan Expo Go.

---

## Köra på emulator (dator)

### Alternativ A: Android-emulator (rekommenderat)

#### 1. Installera Android Studio

Ladda ner från [developer.android.com/studio](https://developer.android.com/studio) och installera.

#### 2. Skapa en virtuell enhet

1. Öppna Android Studio
2. Gå till **Tools → Device Manager**
3. Klicka **Create Device**
4. Välj en telefon (t.ex. **Pixel 7**)
5. Välj system image **API 34** (Android 14) — klicka **Download** om det behövs
6. Klicka **Finish**
7. Starta emulatorn genom att klicka **Play**-knappen

#### 3. Starta appen

```bash
cd nordic-heritage-app
npx expo start --host lan
```

Tryck **a** i terminalen för att öppna appen i Android-emulatorn.

#### 4. Simulera GPS-position

1. Klicka **...** (tre punkter) på emulatorn
2. Gå till **Location**
3. Ange koordinater nära ett världsarv, t.ex.:
   - **Drottningholm:** Lat `59.3217`, Lon `17.8867`
   - **Falun gruva:** Lat `60.6065`, Lon `15.6355`
   - **Visby:** Lat `57.6389`, Lon `18.2948`
4. Klicka **Send**

#### 5. Testa flödet

1. Gå till **Inställningar** → Logga in
2. Position skickas till `/api/notification/location`
3. Push-notis visas med närmaste världsarv
4. Aktivera **Platsspårning** och ändra GPS-koordinater i emulatorn
5. Nya notiser triggas när du "rör dig" nära ett annat världsarv

---

### Alternativ B: iOS-simulator (kräver Mac med Xcode)

#### 1. Installera Xcode

Ladda ner **Xcode** från Mac App Store (ca 12 GB). Öppna Xcode en gång för att installera komponenterna.

#### 2. Starta appen

```bash
cd nordic-heritage-app
npx expo start --host lan
```

Tryck **i** i terminalen för att öppna appen i iOS-simulatorn.

#### 3. Simulera GPS-position

1. I iOS-simulatorn, gå till menyn **Features → Location → Custom Location...**
2. Ange koordinater, t.ex. Drottningholm: Lat `59.3217`, Lon `17.8867`

#### 4. Testa flödet

Samma steg som Android-emulatorn ovan.

> **OBS:** iOS-simulatorn stöder **inte** push-notiser. Lokala notiser visas i konsolen men inte som popup. Använd Android-emulatorn eller en fysisk enhet för att demo:a notiser.

---

### Flera användare samtidigt

Alla i gruppen kan öppna appen samtidigt — varje telefon/emulator behöver bara vara på samma Wi-Fi som datorn som kör `npx expo start`.

---

## Hur appen fungerar

### Kärnflöde: Platsspårning → `/api/notification/location` → Notis

Appen spårar användarens position och skickar koordinater till backend via `POST /api/notification/location`. Backend hittar närmaste UNESCO-världsarv och triggar notifikationer.

```
Appen (mobil)                         Backend (nds.samincodes.com)
─────────────                         ───────────────────────────
GPS-position hämtas
        │
        ├── POST /api/notification/location ──→ Hittar närmaste världsarv
        │   { user_id, latitude, longitude }     │
        │                                        ├── Skickar SMS (HelloSMS)
        │                                        ├── Skickar e-post (SMTP2GO)
        │                                        │
        │◄── { site_name, distance_km } ─────────┘
        │
Lokal push-notis visas
"🏛️ Världsarv i närheten!"
```

### När triggas `/api/notification/location`?

| Händelse | Beskrivning |
|----------|-------------|
| **Inloggning** | Direkt efter lyckad inloggning skickas position till `/api/notification/location` och en notis visas |
| **Bakgrundsspårning** | Appen spårar position även när den är stängd (kräver produktionsbygge) och anropar `/api/notification/location` vid rörelse (100+ m) eller var 60:e sekund |
| **Förgrundsspårning** | Fallback i Expo Go — samma flöde men bara medan appen är öppen |

### Notis-typer

| Typ | Kanal | Krav |
|-----|-------|------|
| **Lokal push-notis** | Visas direkt på telefonen | Push-notiser aktiverade |
| **SMS** | Skickas av backend via HelloSMS | Aktiv prenumeration med telefonnummer |
| **E-post** | Skickas av backend via SMTP2GO | Aktiv prenumeration med e-postadress |

### Cooldown

Max en notis per världsarv per timme per kanal. Om användaren markerar ett världsarv som besökt skickas inga fler notiser för det.

---

## Flikar i appen

### Upptäck

Listar UNESCO-världsarv inom 150 km från din position. Tryck på ett världsarv för att öppna annonswidgeten med mer information.

### Annonsmodul

Visar backend-widgeten i en WebView med information om närliggande världsarv och kopplad annonsering.

### Inställningar

| Funktion | Beskrivning |
|----------|-------------|
| **Inloggning** | Logga in med e-post och lösenord. Triggar direkt en notis om närmaste världsarv via `/api/notification/location`. |
| **Platsspårning** | Aktivera bakgrundsspårning som löpande skickar position till `/api/notification/location`. |
| **Push-notiser** | Aktivera för att visa lokala notiser på enheten. |
| **Prenumeration** | Ange telefonnummer och/eller e-post. Backend skickar då SMS/e-post när du är nära ett världsarv. |

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
| POST | `/api/notification/location` | Skicka koordinater — backend hittar närmaste världsarv och triggar SMS/e-post |
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
