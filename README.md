# SIGNATO Bikes — Custom Bike Configurator

Conversational CPQ-Demo (Configure · Price · Quote) für einen fiktiven Custom-Bike-Shop.
Statische Web-App — kein Build, kein Backend.

**Live-Demo:** https://raimundpaul.github.io/signato-bikeshop/ (GitHub Pages, `main`-Branch)

> **EN:** Conversational CPQ bike configurator — a static demo of LLM-guided
> selling: an LLM (Ollama, local) or a regex fallback parser maps natural
> language to structured intents; a deterministic rule engine decides
> compatibility, price and validity. Guided selling, live price panel,
> cart → checkout → owned bikes. Docs below in German; the app UI is German.

## Starten

- **Empfohlen:** `Start-BikeShop.ps1` ausführen → öffnet `http://localhost:8124/index.html` (TcpListener, keine Admin-Rechte nötig)
- Alternativ: `python -m http.server 8124` im Ordner → `http://localhost:8124/index.html`
- `file://`-Doppelklick kann je nach Browser die `js/`-Skripte blockieren — deshalb der lokale Server.

## Architektur

| Datei | Rolle |
|---|---|
| `index.html` | UI + Dialogsteuerung (Sidebar, Chat, Chips, Live-Panel, Warenkorb) |
| `js/data.js` | **Stammdaten**: Rahmen, Optionsgruppen (Preise, `only`/`except`, Mount-Flags) + `COMPAT_RULES` (harte Constraints mit Begründung) |
| `js/rules.js` | **Engine**: `compatOptions` (Verbaubarkeit), `build` (Konfig + Preis + Violations/Warnings), `recommend` (Kandidaten → ok / blocked / overBudget) |
| `js/llm.js` | **LLM-Adapter + Fallback**: erst Ollama (`localhost:11434`), bei Fehler/Timeout Regex-Parser — beide liefern `Sprache → Intent` |

Trennung: `llm.js` versteht nur Sprache, `rules.js` entscheidet deterministisch. Das LLM ersetzt nur den Parser; das Regelwerk bleibt.

## LLM-Betrieb (optional)

- `ollama pull llama3.2:3b` einmalig, danach `ollama serve` (oder `Start-BikeShop.ps1`, startet Ollama mit)
- `OLLAMA_ORIGINS=http://localhost:8124` setzen, sonst blockt CORS den Browser-Call
- Engine-Indikator im Chat unten rechts: **🧠 llm** (Ollama) vs **🔤 regex** (Fallback — Demo läuft auch ohne Ollama)
- **Der 🧠-LLM-Pfad ist nur lokal testbar:** auf der GitHub-Pages-Demo blockt Chrome den Call nach `localhost` (Private Network Access / Mixed Content) — Besucher bekommen dort immer den Regex-Fallback, Ollama läuft nur auf dem eigenen Rechner. `test.js` (Parser-Tests, `node test.js`) testet bewusst nur den Fallback-Pfad.

## Kern-Flows

- **Guided Selling:** Rahmen klicken oder per Text ("mtb fully", "efully") → Bot fragt Core-Komponenten der Reihe nach (Motor → Akku → Schaltung → Bereifung → Laufradsatz → Farbe → Größe), dann Sonderzubehör als Multi-Select. Chips setzen Optionen direkt (`guidePick`), nicht über den Parser.
- **Verbaubarkeit:** nicht wählbare Optionen = ausgegraute Chips + Tooltip-Grund. Per Freitext erzwungene Verstöße → rote `✗/⚠`-Meldung mit Begründung aus `COMPAT_RULES`.
- **Live-Panel** ("Dein neues Custom Bike"): schwebend rechts unten, aktualisiert Preis + Auswahl bei jedem Pick; Button "In den Warenkorb".
- **Personalisierung:** Signatur in 3 Schrifttypen (Klassik/Modern/Handschrift), 99 €, Text ≤ 12 Zeichen alphanumerisch (wird abgefragt und validiert).
- **Meine Bikes:** Bestandsräder + neu gekaufte Custom-Bikes (nach Checkout) des Kunden, mit Ausstattung und nachbestellbarem Zubehör (Dropdowns in der Bike-Karte).
- **Service-Flows:** Bike anklicken → Ersatzteil / Zubehör / defekt → nur verbaubare Teile als Auswahl.
- **Checkout:** Warenkorb (Session) → "Zur Kasse" → Zubehör erscheint als "Bestelltes Zubehör" am Bike, Custom-Bikes als neues Bike unter "Meine Bikes".

## Demo-Skript (2 Use Cases)

**Einstieg — zwei mögliche Start-Sätze:**
- *"ich will ein fahrrad kaufen"* / *"ich will ein bike"* → Rückfrage (Motor ja/nein + Zweck), dann Guided Selling
- *"ich will zubehör"* → Rückfrage "Für welches deiner Bikes?" mit Bike-Chips

**Use Case 1 — Kunde kauft neues Custom-Bike:**
1. `mtb fully` tippen (oder "MTB Fully" in der Sidebar klicken — oder vage starten, s.o.) → Guided Selling
2. Chips durchklicken: Schaltung → Bereifung → Laufradsatz → Farbe → Größe → Zubehör → `fertig`
3. Optional Signatur (`signatur` → Text eingeben, z. B. "Ray")
4. "In den Warenkorb" → "Zur Kasse" → **das Bike erscheint unter "Meine Bikes"** beim Kunden

**Use Case 2 — Kunde kauft Zubehör für ein bestehendes Bike:**
1. `ich will zubehör für mein hardtail` tippen (oder vage `ich will zubehör` → Bike wählen) → Kategorie-Chips
2. Kategorie wählen → Option "in den Korb" → "Zur Kasse"
3. **Das Zubehör erscheint als "Bestelltes Zubehör" am betreffenden Bike** (Dropdown in der Karte)

Bonus-Demos: `erennrad` (nicht im Sortiment → Alternative), `defekter akku` (Service-Flow), Tippfehler wie `efully` (LLM vs. Regex-Fallback).

## Regelwerk (Auszug)

- E-Rahmen: Motor + Hauptakku Pflicht; Zusatzakku (250 Wh) erlaubt, Zweitmotor nicht
- Akku 750 Wh nur eMTB; E-verstärkter Laufradsatz nur E-Rahmen
- Rahmentasche ✗ Flaschenhalter (Platz im Rahmendreieck)
- Vollblech ✗ Reifen ≥ 45 mm / 2.25"; Carbon-Aero ✗ MTB-Reifen
- Kindersitz → impliziert Gepäckträger (braucht `rackMounts`)
- Rennrad erst ab Größe M; Kids Edition nur XS–S, kein Motor, keine High-End-Schaltung
- Kein E-Rennrad im Sortiment → Alternativ-Angebot eMTB/eTrekking

## Demo-Hinweise

- `reset` im Chat = neue Anfrage · **`reset alles`/F5 = Demo-Reset** — State ist bewusst session-only (kein localStorage), damit mehrere Tester nacheinander immer mit Max' zwei Ausgangsrädern starten

## Hintergrund / Rolle

Side project, ~4h, pair-programmed with an AI coding agent (Devin).
My role: product owner + domain architect — defined the CPQ scope, the
compatibility rule model (frames, mount flags, conflicts), the guided-selling
dialog flow, the two demo use cases, and acceptance-tested everything
(incl. edge cases like typos and invalid combos). The agent implemented
the code; the parser/rules split (LLM proposes intents, `rules.js` decides)
was a deliberate design constraint.
