# SIGNATO Bikes — Custom Bike Configurator

Conversational CPQ-Demo (Configure · Price · Quote) für einen fiktiven Custom-Bike-Shop.
Statische Web-App — kein Build, kein Backend.

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
| `js/llm.js` | **LLM-Stub**: Regex-Parser `Sprache → Intent` (steht stellvertretend für ein echtes LLM, z. B. Ollama — Schnittstelle bleibt gleich) |

Trennung: `llm.js` versteht nur Sprache, `rules.js` entscheidet deterministisch. In echt ersetzt ein LLM den Parser; das Regelwerk bleibt.

## Kern-Flows

- **Guided Selling:** Rahmen klicken oder per Text ("mtb fully", "efully") → Bot fragt Core-Komponenten der Reihe nach (Motor → Akku → Schaltung → Bereifung → Laufradsatz → Farbe → Größe), dann Sonderzubehör als Multi-Select. Chips setzen Optionen direkt (`guidePick`), nicht über den Parser.
- **Verbaubarkeit:** nicht wählbare Optionen = ausgegraute Chips + Tooltip-Grund. Per Freitext erzwungene Verstöße → rote `✗/⚠`-Meldung mit Begründung aus `COMPAT_RULES`.
- **Live-Panel** ("Dein neues Custom Bike"): schwebend rechts unten, aktualisiert Preis + Auswahl bei jedem Pick; Button "In den Warenkorb".
- **Personalisierung:** Signatur in 3 Schrifttypen (Klassik/Modern/Handschrift), 99 €, Text ≤ 12 Zeichen alphanumerisch (wird abgefragt und validiert).
- **Meine Bikes:** Bestandsräder des Kunden mit Custom-Order-Ausstattung und nachbestellbarem Zubehör (Dropdown in der Bike-Karte).
- **Service-Flows:** Bike anklicken → Ersatzteil / Zubehör / defekt → nur verbaubare Teile als Auswahl.
- **Checkout:** Warenkorb (localStorage) → "Zur Kasse" → Positionen werden `paid` und erscheinen als "Bestelltes Zubehör" am Bike.

## Regelwerk (Auszug)

- E-Rahmen: Motor + Hauptakku Pflicht; Zusatzakku (250 Wh) erlaubt, Zweitmotor nicht
- Akku 750 Wh nur eMTB; E-verstärkter Laufradsatz nur E-Rahmen
- Rahmentasche ✗ Flaschenhalter (Platz im Rahmendreieck)
- Vollblech ✗ Reifen ≥ 45 mm / 2.25"; Carbon-Aero ✗ MTB-Reifen
- Kindersitz → impliziert Gepäckträger (braucht `rackMounts`)
- Rennrad erst ab Größe M; Kids Edition nur XS–S, kein Motor, keine High-End-Schaltung
- Kein E-Rennrad im Sortiment → Alternativ-Angebot eMTB/eTrekking

## Demo-Hinweise

- State in `localStorage` (`bikecart`) — Browser-Reset via `localStorage.clear()` in der Konsole
- `reset` im Chat startet eine neue Anfrage; `fertig` schließt die Konfiguration ab
- Der Regex-Parser ist bewusst simpel — Tippfehler/Synonyme sind die Stelle, an der ein echtes LLM ansetzt
