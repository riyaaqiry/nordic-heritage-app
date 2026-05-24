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

> **Verifierat:** notisen har bekräftats fungera end-to-end i emulatorn —
> "🏛️ Världsarv i närheten! Royal Domain of Drottningholm är bara 0.2 km bort"
> — med exakt **en** notis per plats (ingen dubblettspam).

---

## Alternativ A — Emulator på datorn

Fungerar, men emulatorns simulerade GPS är **känslig på den här datorn**. Följ
stegen i ordning och läs gotchas-rutan — då blir demon pålitlig.

### 1. Kallstarta emulatorn

En *kallstart* (cold boot) startar emulatorn helt från grunden — som att starta
om en telefon — i stället för att återuppta en sparad ögonblicksbild. Det är det
som tinar upp den frusna GPS:en. Flaggan **`-no-snapshot-load`** tvingar fram en
kallstart.

```powershell
C:\Android\Sdk\emulator\emulator.exe -avd nordic_pixel -gpu swiftshader_indirect -memory 4096 -no-snapshot-load
```

- `-gpu swiftshader_indirect` = mjukvarurendering. Långsammare än `-gpu host`
  men **mycket stabilare** på den här datorn (slipper "System UI svarar inte").
- Om en ruta **"System UI svarar inte"** ändå dyker upp: klicka **Wait/Vänta**
  och ge emulatorn en minut att starta klart. Klicka inte "Close app".
- Alternativ kallstart via Android Studio: Device Manager → **▼/⋮** bredvid
  enheten → **"Cold Boot Now"**.
- Stäng en redan körande emulator först (stäng fönstret) eller kör:
  `C:\Android\Sdk\platform-tools\adb.exe -s emulator-5554 emu kill`

### 2. Starta appen

```powershell
cd C:\dev\nordic-heritage-app
npx expo start --dev-client
```

Tryck sedan **`a`** i terminalen för att öppna appen på emulatorn (appen är
redan installerad). Första laddningen efter en kallstart kan ta 30–60 s.

> Om appen visar "Port 8081 används" → svara **n** (appen letar efter Metro på
> just 8081). Stäng den gamla Metro-processen i stället och kör om kommandot.

### 3. Slå på spårning — **viktigaste steget**

1. När appen frågar om plats: välj **"Endast medan appen används"**
   (*While using the app*).
   > Välj **inte** "Tillåt alltid" på emulatorn — det läget använder geofencing
   > som inte triggar i emulatorn. "Medan appen används" använder
   > förgrundsspårning som fungerar.
2. Gå till fliken **Inställningar** och se till att **Platsspårning** är **på**.
   - **Detta steg är obligatoriskt:** spårningen startar bara när skärmen
     Inställningar öppnas. Hoppar du direkt till att fejka position utan att ha
     öppnat Inställningar kommer ingen notis.

### 4. Fejka din position nära ett världsarv

I emulatorfönstret: klicka **"⋯"** (Extended controls) → fliken **Location** →
underfliken **"Single points"**. Skriv in **lat/lng** och klicka **SET
LOCATION** (titta att kartan hoppar dit — annars tog det inte).

| Världsarv | Latitud | Longitud |
|-----------|---------|----------|
| Drottningholm | `59.32306` | `17.88333` |
| Skogskyrkogården (Stockholm) | `59.27556` | `18.09944` |
| Birka och Hovgården | `59.33514` | `17.54264` |
| Falun (Stora Kopparberget) | `60.5986` | `15.6294` |
| Engelsbergs bruk | `59.9572` | `16.0086` |

Inom några sekunder visas notisen. **Dra ner från skärmens överkant** för att
öppna notisfältet och visa den:

> 🏛️ **Världsarv i närheten!**
> Royal Domain of Drottningholm är bara 0.2 km bort. Tryck för att läsa mer!

### ⚠️ Gotchas att känna till (emulatorn)

- **En plats per kallstart.** Emulatorns GPS accepterar oftast bara *en*
  positionsändring och fryser sedan. Vill du visa ett annat världsarv:
  kallstarta om (steg 1) och välj en ny plats. Använd **GUI:t** (SET LOCATION),
  inte kommandoraden — `adb emu geo fix` fryser lättare.
- **1 timmes cooldown per plats.** Samma världsarv notifierar bara en gång per
  timme (så det inte tjatar). Växla mellan olika platser i tabellen, eller vänta
  en timme.
- Planera demon: kallstarta strax innan redovisningen, sätt **den** plats du ska
  visa, slå på spårning, klart. Vill du visa flera platser → en kallstart per
  plats.

---

## Alternativ B — Fysisk Android-telefon (mest pålitlig)

Helt utan emulatorkrångel — verklig eller fejkad GPS är stabil, och du kan visa
hur många platser du vill.

1. Kopiera **`C:\dev\nordic-heritage.apk`** till telefonen (USB, mejl eller moln).
2. Öppna filen på telefonen och tillåt installation från okänd källa.
3. Starta appen, slå på **Platsspårning** och välj **"Tillåt alltid"** för plats.
4. För att trigga en notis: befinn dig inom 2 km från ett världsarv, eller
   använd en *mock location*-app (Utvecklaralternativ → "Välj app för
   skenposition") och sätt en koordinat enligt tabellen ovan.

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
- **Robust avstörning** — notisen skickas exakt en gång per plats (in-memory-
  dedup + beständig cooldown), även om positionen uppdateras snabbt.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| "System UI svarar inte" vid start | Klicka **Wait**, vänta. Starta med `-gpu swiftshader_indirect` (se steg 1) — stabilare än `-gpu host`. |
| Ingen notis trots satt position | 1) Har du öppnat **Inställningar** så spårningen startat? 2) Är platsen ny (inte i 1h-cooldown)? 3) Är positionen inom 2 km från ett världsarv? |
| Positionen ändras inte i appen | Emulatorns GPS har frusit (en plats per kallstart). **Kallstarta om** och sätt platsen på nytt. |
| "Inga världsarv hittades" | Kontrollera att en position är satt och att appen fått platsbehörighet. |
| "Cannot connect to Metro" | Se till att `npx expo start --dev-client` körs på datorn, samma nätverk. Ladda om appen. |
| Appen når inte servern | Testa `https://nds.samincodes.com/docs` i en webbläsare. |
| Emulatorn startar inte | Kontrollera att hårdvaruvirtualisering (WHPX/Hyper-V) är aktiverat i Windows. |
