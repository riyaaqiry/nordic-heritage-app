# Nordic Heritage - Mobilapp

React Native (Expo) app för iOS och Android som spårar användarens position i bakgrunden och skickar platsdata till `POST /api/notification/location`. Backend hittar närmaste UNESCO-världsarv och triggar notifikationer (lokal push-notis, SMS och e-post) till prenumeranter.

Expo-utvecklingsservern hostas på **Railway** så att appen alltid är tillgänglig via Expo Go — ingen dator behöver vara igång.

---

## Innehåll

1. [Snabbstart — öppna appen](#snabbstart--öppna-appen)
2. [Köra på fysisk iPhone](#köra-på-fysisk-iphone)
3. [Köra på fysisk Android](#köra-på-fysisk-android)
4. [Köra på emulator (dator)](#köra-på-emulator-dator)
5. [Hur appen fungerar](#hur-appen-fungerar)
6. [Flikar i appen](#flikar-i-appen)
7. [Hosting och deployment](#hosting-och-deployment)
8. [Projektstruktur](#projektstruktur)
9. [API-endpoints som appen använder](#api-endpoints-som-appen-använder)
10. [Lokal utveckling (valfritt)](#lokal-utveckling-valfritt)
11. [Vanliga problem och lösningar](#vanliga-problem-och-lösningar)

---

## Snabbstart — öppna appen

Appen hostas på Railway. Ingen dator behöver vara igång.

1. Ladda ner **Expo Go** — [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779) | [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Öppna Expo Go → **Enter URL manually**
3. Skriv in: `exp://calm-beauty.up.railway.app`
4. Appen startar — logga in, platsspårning och notiser fungerar direkt

> Ingen dator, inget Wi-Fi-krav, ingen installation. Fungerar på både iPhone och Android.

---

## Köra på fysisk iPhone

### Förutsättningar

- iPhone med **Expo Go** installerad från App Store

### Steg för steg

1. Öppna **Expo Go** på iPhone
2. Tryck **Enter URL manually**
3. Skriv in: `exp://calm-beauty.up.railway.app`
4. Appen laddas och startar
5. Gå till fliken **Inställningar**
6. Logga in med e-post och lösenord
7. Appen hämtar din GPS-position och skickar till `/api/notification/location`
8. En push-notis visas: **"Världsarv i närheten!"** med närmaste UNESCO-plats
9. Aktivera **Platsspårning** — appen fortsätter skicka position medan den är öppen
10. Aktivera **Prenumeration** med telefonnummer — du får nu även SMS/e-post

> **OBS:** I Expo Go på iPhone körs förgrundsspårning (appen måste vara öppen). Full bakgrundsspårning kräver ett produktionsbygge via `eas build`.

---

## Köra på fysisk Android

### Förutsättningar

- Android-telefon med **Expo Go** installerad från Google Play

### Steg för steg

1. Öppna **Expo Go** på Android-telefonen
2. Tryck **Enter URL manually**
3. Skriv in: `exp://calm-beauty.up.railway.app`
4. Appen laddas och startar
5. Gå till fliken **Inställningar**
6. Logga in med e-post och lösenord
7. Appen frågar om **platsbehörighet** — tryck "Tillåt"
8. Position skickas till `/api/notification/location`
9. Push-notis visas: **"Världsarv i närheten!"**
10. Aktivera **Platsspårning** — appen frågar om bakgrundsbehörighet
11. Välj **"Tillåt hela tiden"** för bakgrundsspårning
12. Minimera appen — spårningen fortsätter i bakgrunden
13. Aktivera **Prenumeration** med telefonnummer — du får nu även SMS/e-post

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

Antingen anslut till Railway-servern:
- Öppna Expo Go i emulatorn → **Enter URL manually** → `exp://calm-beauty.up.railway.app`

Eller kör lokalt:
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

Antingen anslut till Railway-servern:
- Öppna Expo Go i simulatorn → **Enter URL manually** → `exp://calm-beauty.up.railway.app`

Eller kör lokalt:
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

Alla i gruppen kan öppna appen samtidigt via Railway-URL:en — inget Wi-Fi-krav.

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

## Hosting och deployment

### Arkitektur

```
Railway (calm-beauty)                Railway (NDS-backend)
Expo dev-server                      FastAPI-server
exp://calm-beauty.up.railway.app     nds.samincodes.com
        │                                    │
        │  Serverar JS-bundle till            │  Hanterar API-anrop:
        │  Expo Go på telefonen               │  /api/notification/location
        │                                    │  /unesco/sites
        ▼                                    │  /api/notification/subscribe
   Expo Go (iPhone/Android)  ────────────────┘
```

### Auto-deploy

Båda Railway-projekten är kopplade till GitHub. Vid varje `git push`:
- Railway bygger och startar om automatiskt
- Inga manuella steg krävs
- Appen är alltid tillgänglig

### Miljövariabler

| Projekt | Variabler |
|---------|-----------|
| **calm-beauty** (appen) | Inga — API-URL:en är hårdkodad i `src/config.js` |
| **NDS-backend** | `SMTP2GO_API_KEY`, `HELLOSMS_API_KEY`, `ADMIN_TOKEN`, m.fl. |

### Lokal utveckling

Om du vill köra appen lokalt istället för via Railway:

```bash
cd nordic-heritage-app
npm install --legacy-peer-deps
npx expo start --host lan
```

> Telefon och dator måste vara på samma Wi-Fi. Appen pekar fortfarande mot `nds.samincodes.com` för backend.

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

1. Ladda ner **Expo Go** på telefonen ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Öppna Expo Go → **Enter URL manually**
3. Skriv in: `exp://calm-beauty.up.railway.app`
4. Logga in → notis om närmaste världsarv visas direkt
