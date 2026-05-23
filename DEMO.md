# Demoguide — Nordic Heritage

Den här guiden beskriver hur du visar appens platsspårning och notiser live,
t.ex. vid en redovisning. Appen meddelar dig när du är inom **2 km** från ett
UNESCO-världsarv.

> **Två spårningslägen:** appen använder *geofencing* (operativsystemet väcker
> appen vid gränspassage) när bakgrundsbehörighet är beviljad, och faller
> annars tillbaka på *förgrundsspårning* (pollar position medan appen är öppen).
> Äkta geofencing fungerar på en fysisk telefon men **inte i emulatorn** —
> Android Play Services utvärderar inte gränspassager för en simulerad GPS.
> Därför använder emulatordemon förgrundsläget, som kör exakt samma notiskod.

---

## Alternativ A — Emulator på datorn (rekommenderas för redovisning)

Enklast och mest pålitligt. Du behöver inte vara nära ett riktigt världsarv.

### 1. Starta emulatorn

```powershell
C:\Android\Sdk\emulator\emulator.exe -avd nordic_pixel
```

### 2. Starta appen

```powershell
cd C:\dev\nordic-heritage-app
npx expo start --dev-client
```

Tryck sedan **`a`** i terminalen för att öppna appen på emulatorn (appen är
redan installerad).

### 3. Ge behörighet och slå på spårning

1. När appen frågar om plats: välj **"Endast medan appen används"**
   (*While using the app*).
   > Viktigt: välj **inte** "Tillåt alltid" på emulatorn — det läget använder
   > geofencing som inte triggar i emulatorn. "Medan appen används" använder
   > förgrundsspårning som fungerar.
2. Gå till fliken **Inställningar** och slå på **Platsspårning**.

### 4. Fejka din position nära ett världsarv

I emulatorfönstret, klicka på **"⋯"** (tre prickar) → fliken **Location**.
Skriv in en koordinat och klicka **Set location**:

| Världsarv | Latitud | Longitud |
|-----------|---------|----------|
| Skogskyrkogården (Stockholm) | `59.27556` | `18.09944` |
| Drottningholm | `59.32306` | `17.88333` |
| Birka och Hovgården | `59.33514` | `17.54264` |

Inom några sekunder visas notisen:

> 🏛️ **Världsarv i närheten!**
> Skogskyrkogården är bara 0 km bort. Tryck för att läsa mer!

Går det trögt: sätt en andra koordinat strax intill för att "putta igång"
positionsuppdateringen.

---

## Alternativ B — Fysisk Android-telefon (visar äkta bakgrundsspårning)

Visar att det är en riktig, installerbar app och att geofencing fungerar på
riktig hårdvara.

1. Kopiera **`app-release.apk`** till telefonen (USB, mejl eller molnlagring).
2. Öppna filen på telefonen och tillåt installation från okänd källa.
3. Starta appen, slå på **Platsspårning** och välj **"Tillåt alltid"** för plats.
4. För att trigga en notis behöver du antingen befinna dig inom 2 km från ett
   världsarv, eller använda en *mock location*-app (Utvecklaralternativ →
   "Välj app för skenposition") och sätta en koordinat enligt tabellen ovan.

> APK:n innehåller JavaScript-paketet inbyggt och behöver **ingen** dator eller
> Metro igång för att köra.

---

## Vad du kan lyfta fram för läraren

- **Live API-integration** — fliken Upptäck hämtar UNESCO-världsarv från
  backend (`nds.samincodes.com`) baserat på din GPS-position.
- **Behörighetsflöde** — appen begär plats- och notisbehörighet på rätt sätt.
- **Arkitekturval: geofencing** — istället för att kontinuerligt polla GPS:en
  (batteritjuv) registrerar appen geofence-regioner som operativsystemet
  bevakar och väcker appen vid gränspassage. Det är därför äkta
  bakgrundsspårning fungerar på telefon men inte i emulatorn.
- **Två notiskanaler** — lokal push-notis på enheten direkt, plus en
  backend-trigger för SMS/e-post när användaren är inloggad.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| "Inga världsarv hittades" | Kontrollera att en position är satt i emulatorn och att appen fått platsbehörighet. |
| Ingen notis dyker upp | Bekräfta att notisbehörighet är tillåten, att spårning är på, och sätt en position inom 2 km från ett världsarv. |
| Appen når inte servern | Testa `https://nds.samincodes.com/docs` i en webbläsare. |
| Emulatorn startar inte | Kontrollera att hårdvaruvirtualisering (WHPX/Hyper-V) är aktiverat i Windows. |
