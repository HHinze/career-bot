# Harald Hinze – Personal AI Career Concierge

Ein persönlicher KI-Assistent der Fragen über Harald beantwortet.

## Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Umgebungsvariablen eintragen
Öffne `.env.local` und trage deine Keys ein:
- `ANTHROPIC_API_KEY` → von console.anthropic.com
- `NEXT_PUBLIC_SUPABASE_URL` → von Supabase > Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` → von Supabase > Settings > API

### 3. Supabase Datenbank einrichten
Öffne Supabase > SQL Editor und führe den Inhalt von `supabase-setup.sql` aus.

### 4. Profildaten anpassen
Bearbeite `data/profil.txt` mit deinen echten Informationen.

### 5. Daten in Supabase laden
```bash
node scripts/ingest.mjs
```

### 6. Bot lokal starten
```bash
npm run dev
```
Dann im Browser: http://localhost:3000

## Deployment auf Vercel
1. Code auf GitHub pushen
2. Vercel mit GitHub verbinden
3. Umgebungsvariablen in Vercel eintragen
4. Deploy klicken
