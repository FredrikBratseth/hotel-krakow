# Hotel Kraków – egen server

Mappen inneholder alt som trengs for å kjøre spillet på en vanlig nettadresse, uten Claude-innlogging.

- `server.js` – liten relé-server (Node.js) som sender posisjoner mellom alle i samme spill
- `public/index.html` – selve spillet
- `package.json` – forteller serveren hva den trenger

## Legge den ut gratis på Render (ca. 15 min)

1. Lag konto på github.com. Trykk **New repository**, kall det `hotel-krakow` og velg **Public**. Trykk **Create repository**.
2. Trykk **uploading an existing file** og dra inn alt fra denne mappen (`server.js`, `package.json`, `package-lock.json`, `LESMEG.md` og hele `public`-mappen). Trykk **Commit changes**.
3. Gå til render.com og trykk **Get Started**. Logg inn med GitHub.
4. Trykk **New +** og velg **Web Service**. Velg repoet `hotel-krakow`.
5. Sjekk innstillingene:
   - Language: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: **Free**
6. Trykk **Create Web Service**. Etter 2–3 minutter står det **Live**, og du får en adresse som `https://hotel-krakow-xxxx.onrender.com`.

## Bruk i klassen

- Gratisversjonen sover etter 15 min uten bruk. Åpne lenken 5 minutter før timen, så er den våken (første lasting tar opptil 1 minutt).
- Læreren åpner lenken på PC-en (gjerne på storskjerm), skriver navn og trykker **LAG SPILL**. Fjern haken for **Jeg spiller selv** hvis PC-en bare skal vise spillet.
- Elevene åpner samme lenke på mobilen, skriver kallenavn og den 4-sifrede koden.
- PC-en som lager spillet styrer hele runden, så den må stå på og være åpen hele tiden.
- Tips: lag en QR-kode av lenken, så slipper elevene å skrive den.

## Oppdatere spillet senere

Last opp en ny `public/index.html` i GitHub-repoet. Render bygger og publiserer automatisk på nytt.
