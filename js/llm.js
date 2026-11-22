// ============================================================
// LLM-ADAPTER — Sprache → strukturierte Konfig-Anfrage + Antwort
// Steht stellvertretend fuer das echte LLM (spaeter Ollama).
// Die ENTSCHEIDUNG trifft immer rules.js.
// ============================================================

const LLM = {

  parse(text) {
    const t = text.toLowerCase();
    if (/^bestell|in den korb|in den warenkorb/.test(t)) return { type: 'order', text };
    const intent = { type: 'buy' };

    // --- Flow: Ersatzteil / Zubehör für Bestandsbike ---
    if (/defekt|kaputt|beschädigt|beschaedigt|schaden|reparier|platt|kratzer|gebrochen|quietsc/.test(t)) intent.type = 'defect';
    else if (/zubeh[öo]|zubehoe|zubehör|ersatz|spare|welcher akku|welche batterie|pass.*akku|brauch.*(akku|batterie)|stärker.*akku|größer.*akku|nachrüst|nachruest|aufrüst|aufruest|upgrade/.test(t)) intent.type = 'parts';

    // --- Rahmentyp ---
    if (/e-?fully/.test(t)) intent.ebike = true;
    if (/e-mtb|emtb/.test(t)) { intent.ebike = true; intent.frameId = 'emtb'; }
    else if (/e-?trek|etrek/.test(t)) { intent.ebike = true; intent.frameId = 'etrek'; }
    else if (/\be-?bikes?\b|pedelec|elektro|\bmotor\b/.test(t)) intent.ebike = true;
    if (/mtb|mountain|montain|mountin|hardtail|geländerad|trailrad/.test(t) && !intent.frameId) intent.frameId = 'mtb';
    if (/fully|vollgefedert|fullsuspension|enduro|downhill/.test(t)) intent.frameId = 'fully';
    if (/trekking|treking|tourenrad|touringrad|alltagsrad/.test(t)) intent.frameId = intent.ebike ? 'etrek' : 'trekking';
    if (/gravel|gravler|schotter/.test(t)) intent.frameId = 'gravel';
    if (/rennrad|\brenn\b|road|renner|rennmaschine|roadbike|racer\b/.test(t)) intent.frameId = 'road';
    if (/normal|bio-?bike|muskel|ohne motor|konventionell|analog/.test(t)) intent.ebike = false;
    // ebike + Rahmentyp → auf die E-Variante mappen
    if (intent.ebike) {
      if (intent.frameId === 'mtb') intent.frameId = 'emtb';
      if (intent.frameId === 'trekking') intent.frameId = 'etrek';
      if (intent.frameId === 'road') intent.eRoadRequest = true;   // Constraint: kein eRennrad im Sortiment
      if (['fully', 'gravel'].includes(intent.frameId)) intent.frameId = 'emtb'; // naechste E-Variante
    }

    // --- Optionen ---
    if (/groß|gross|große|big|lang|750|reichweite/.test(t) && /akku|batterie|wh|reichweite/.test(t)) intent.battery = 'bt750';
    else if (/mittel|medium|625/.test(t) && /akku|batterie|wh/.test(t)) intent.battery = 'bt625';
    else if (/klein|small|400/.test(t) && /akku|batterie|wh/.test(t)) intent.battery = 'bt400';
    if (/zusatzakku|zweitakku|zweiter akku|range ?extender|ext250/.test(t)) intent.extrabat = true;
    if (/mittelmotor|mid-?motor|bosch|shimano motor|center motor/.test(t)) intent.motor = 'mid';
    if (/nabenmotor|hub-?motor|heckmotor|frontmotor/.test(t)) intent.motor = 'hub';
    if (/schutzblech|fender|schmutzfänger|blech/.test(t)) intent.fender = true;
    if (/gepäckträger|gepaecktraeger|gepäck|träger|rack|packtaschen/.test(t)) intent.rack = true;
    if (/licht|beleuchtung|lampe|scheinwerfer|leuchte/.test(t)) intent.light = true;
    if (/\bxt\b|12f|12-fach|12 fach/.test(t)) intent.groupset = 'xt12';
    if (/deore|11f|11-fach|11 fach/.test(t)) intent.groupset = 'deore';
    if (/ultegra|105er|\b105\b/.test(t)) intent.groupset = 'ultegra';
    if (/slick|28mm|rennreifen/.test(t)) intent.tire = 'slick28';
    if (/2\.25|mtb-?reifen|stollen/.test(t)) intent.tire = 'mtb225';
    if (/touring|35mm|trekking-?reifen/.test(t)) intent.tire = 'tour35';
    if (/45mm|gravel-?reifen/.test(t)) intent.tire = 'gravel45';
    if (/flaschenhalter|flasche|trinkflasche|bottle/.test(t)) intent.bottle = true;
    if (/ständer|staender|kickstand/.test(t)) intent.stand = true;
    if (/sattelstütze|sattelstuetze|federsattel|stütze|seatpost/.test(t)) intent.seatpost = true;
    if (/dämpfer|daempfer|stoßdämpfer|stossdaempfer|luftdämpfer|federbein|shock/.test(t)) intent.shock = true;
    if (/rahmentasche|\btasche|bikepacking|\bbag/.test(t)) intent.bag = true;
    if (/schloss|faltschloss|bügelschloss|kettenschloss|\block/.test(t)) intent.lock = true;
    if (/kindersitz|childseat|kinder-?sitz/.test(t)) intent.childseat = true;
    if (/handschrift|script/.test(t) && /signatur|gravur|schrift/.test(t)) intent.signature = 'sig_hand';
    else if (/modern/.test(t) && /signatur|gravur|schrift/.test(t)) intent.signature = 'sig_modern';
    else if (/geätzt|geaetzt|ätz|aetz|laser|sandgestrahlt|sandstrahl|signatur|gravier|gravur|signé|signe|inscribe|name auf|personalisier/.test(t)) intent.signature = 'sig_klassik';
    if (/kid|kinderfahrrad|kinderrad|jugend|junior|24-?zoll/.test(t) && !intent.frameId) intent.frameId = 'kids';
    if (/violett|lila|purple/.test(t)) intent.color = 'violett';
    else if (/blau|blue|ocean/.test(t)) intent.color = 'blau';
    else if (/grün|gruen|green/.test(t)) intent.color = 'gruen';
    else if (/gelb|yellow/.test(t)) intent.color = 'gelb';
    else if (/orange/.test(t)) intent.color = 'orange';
    else if (/rot\b|red|feuerrot/.test(t)) intent.color = 'rot';
    else if (/schwarz|black|graphit|farbe|farbig|lack/.test(t)) intent.color = 'std';
    const sz = t.match(/(?:größe|grösse|groesse|rahmengröße|size)\s*([a-z]{1,2}|\d{2})/);
    if (sz) intent.size = /^\d/.test(sz[1]) ? ({44:'xs',46:'xs',48:'s',50:'s',52:'m',54:'m',56:'l',58:'l',60:'xl',62:'xl'})[sz[1]] || 'm' : sz[1];
    if (/carbon.*(laufr|felg|wheel)|aero.*(laufr|felg|wheel)|carbonlaufr|carbonfelg/.test(t)) intent.wheelset = /trail|mtb/.test(t) ? 'trail' : 'aero';
    if (/e-?verstärkt|e-?laufr|erated/.test(t)) intent.wheelset = 'erated';
    if (/laufräder|laufradsatz|felgen|wheels?/.test(t) && !intent.wheelset) intent.wheelset = 'std';

    // --- Budget ---
    const m = t.match(/(\d{3,5})\s*(euro|€|eur)/) || t.match(/(?:unter|max|bis)\s*(\d{3,5})/);
    if (m) intent.budget = +m[1] || +m[2];

    // --- Gruppen ohne konkrete Wahl → Auswahl anbieten ---
    const askGroups = [];
    if (/schaltung|schaltgruppe|groupset/.test(t) && !intent.groupset) askGroups.push('groupset');
    if (/akku|batterie/.test(t) && !intent.battery) askGroups.push('battery');
    if (/motor/.test(t) && !intent.motor) askGroups.push('motor');
    if (/reifen|bereifung/.test(t) && !intent.tire) askGroups.push('tire');
    if (/laufräder|laufradsatz|felgen|wheelset/.test(t) && !intent.wheelset) askGroups.push('wheelset');
    if (/farbe|lack/.test(t) && !intent.color) askGroups.push('color');
    if (/größe|grösse|groesse|rahmengröße/.test(t) && !intent.size) askGroups.push('size');
    if (askGroups.length) intent.askGroups = askGroups;

    // --- Meta ---
    if (/^fertig|^abschl|^checkout|^das wars|^das war's/.test(t.trim())) return { type: 'finish' };
    if (/^(ok|okay|ja|passt|stimmt|genau|yep)\b/.test(t.trim())) return { type: 'confirm' };
    if (/^reset/.test(t)) return { type: 'reset' };
    // leere Anfrage → nichts Verstandenes
    const meaningful = ['frameId','ebike','battery','motor','fender','rack','light','groupset','budget',
                        'bottle','stand','seatpost','shock','bag','lock','childseat','signature','size','wheelset','extrabat','color']
      .some(k => intent[k] !== undefined);
    if (!meaningful && !/bike|fahrrad|rad|akku|kauf|brauche|suche|will|hätte|haette|konfig/.test(t))
      return { type: 'unknown' };
    return intent;
  },

  // strukturierte Anfrage → Bestätigungsfrage
  confirmText(intent) {
    if (intent.type === 'spare') {
      const f = intent.frameId ? FRAMES.find(x => x.id === intent.frameId) : null;
      return `Ersatzteil-Anfrage: Akku für ${f ? f.name : '(Modell?)'}.\nPasst so? — 'ok' oder Korrektur.`;
    }
    const bits = [];
    bits.push(intent.ebike === undefined ? 'Antrieb offen' : intent.ebike ? 'eBike' : 'muskelbetrieben');
    if (intent.frameId) bits.push(FRAMES.find(f => f.id === intent.frameId).name);
    if (intent.battery) bits.push(OPTION_GROUPS.battery.find(b => b.id === intent.battery).name);
    if (intent.motor) bits.push(OPTION_GROUPS.motor.find(o => o.id === intent.motor).name);
    if (intent.groupset) bits.push(OPTION_GROUPS.groupset.find(g => g.id === intent.groupset).name);
    if (intent.fender) bits.push('Schutzblech');
    if (intent.rack) bits.push('Gepäckträger');
    if (intent.light) bits.push('Licht');
    if (intent.bottle) bits.push('Flaschenhalter');
    if (intent.stand) bits.push('Ständer');
    if (intent.seatpost) bits.push('Federsattelstütze');
    if (intent.shock) bits.push('Luftdämpfer');
    if (intent.bag) bits.push('Rahmentasche');
    if (intent.lock) bits.push('Faltschloss');
    if (intent.childseat) bits.push('Kindersitz');
    if (intent.signature) bits.push(OPTION_GROUPS.signature.find(s => s.id === intent.signature).name + ' (≤12 Zeichen)');
    if (intent.extrabat) bits.push('Zusatzakku');
    if (intent.color) bits.push(OPTION_GROUPS.color.find(c => c.id === intent.color).name);
    if (intent.size) bits.push(`Größe ${intent.size.toUpperCase()}`);
    if (intent.wheelset) bits.push(OPTION_GROUPS.wheelset.find(w => w.id === intent.wheelset).name);
    if (intent.budget) bits.push(`≤ ${intent.budget} €`);
    return `Verstanden als: ${bits.join(' + ')}.\nPasst so? — 'ok' zum Bestätigen, oder Korrektur nennen.`;
  },

  // Engine-Ergebnis → Text
  format(res) {
    let s = '';
    if (res.ok.length === 0 && !res.overBudget.length) {
      s += 'Keine verbaubare Konfiguration gefunden.\n';
    }
    res.blocked.forEach(b =>
      b.reasons.concat(b.warnings || []).forEach(r => s += `✗ ${b.frame.name}: ${r}\n`));
    return s;
  },

  formatConfig(b) {
    const c = b.config;
    const parts = [c.motor, c.battery, c.groupset, c.tire, c.fender, c.rack, c.light,
                   c.bottle, c.stand, c.seatpost, c.shock, c.bag, c.lock, c.childseat, c.signature, c.size, c.wheelset, c.extrabat, c.color]
      .filter(o => o.id !== 'none').map(o => `  • ${o.name} (+${o.price} €)`).join('\n');
    return `${b.frame.name} — ${b.price} €\n  Basis ${b.frame.basePrice} €\n${parts || '  • keine Extras'}`;
  },
};
