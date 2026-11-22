// ============================================================
// RULES — deterministische Konfigurations-Engine
// Baut aus einer strukturierten Anfrage verbaubare Konfigurationen,
// begruendet jede Ablehnung, rechnet den Gesamtpreis.
// Kein LLM — nur Optionen-Kompatibilitaet + Constraints + Preis.
// ============================================================

const Rules = {

  // Optionen einer Gruppe, die auf dem Rahmen grundsätzlich montierbar sind
  compatOptions(frame, group) {
    return OPTION_GROUPS[group].filter(o =>
      (!o.only || o.only.includes(frame.id)) && !(o.except || []).includes(frame.id) &&
      (!o.needsBottleMounts || frame.bottleMounts) &&
      (!o.needsStandMounts || frame.standMounts) &&
      (o.needsMounts !== true || frame.fenderMounts) &&
      (o.needsMounts !== 'rack' || frame.rackMounts) &&
      (!o.needsRack || frame.rackMounts));
  },

  // eine Konfiguration fuer einen Rahmen zusammenstellen
  // intent: { ebike, fender, rack, light, battery, groupset, tire, budget }
  build(frame, intent) {
    const pick = (group, wantId) => {
      const opts = this.compatOptions(frame, group);
      if (wantId) {
        const hit = opts.find(o => o.id === wantId);
        return hit || { ...OPTION_GROUPS[group].find(o => o.id === wantId), _blocked: true };
      }
      return opts.find(o => o.id !== 'none') && ['battery','motor'].includes(group) && frame.e
        ? opts.find(o => o.id !== 'none') : opts[0];
    };
    const c = {
      frame,
      motor:    pick('motor',    intent.ebike ? (intent.motor || 'mid') : (frame.e ? 'mid' : 'none')),
      battery:  pick('battery',  intent.battery || ((intent.ebike || frame.e) ? 'bt625' : 'none')),
      groupset: pick('groupset', intent.groupset || 'base'),
      tire:     pick('tire',     intent.tire || 'std'),
      fender:   pick('fender',   intent.fender ? 'full' : 'none'),
      rack:     pick('rack',     intent.rack || intent.childseat ? 'rack' : 'none'),
      light:    pick('light',    intent.light ? 'light' : 'none'),
      bottle:   pick('bottle',   intent.bottle ? 'bottle' : 'none'),
      stand:    pick('stand',    intent.stand ? 'stand' : 'none'),
      seatpost: pick('seatpost', intent.seatpost ? 'sprung' : 'none'),
      shock:    pick('shock',    intent.shock ? 'air' : 'none'),
      bag:      pick('bag',      intent.bag ? 'bag' : 'none'),
      lock:     pick('lock',     intent.lock ? 'lock' : 'none'),
      childseat: pick('childseat', intent.childseat ? 'seat' : 'none'),
      signature: pick('signature', intent.signature || 'none'),
      extrabat: pick('extrabat', intent.extrabat ? 'ext250' : 'none'),
      color:    pick('color',    intent.color || 'std'),
      size:     pick('size',     intent.size || 'none'),
      wheelset: pick('wheelset', intent.wheelset || (frame.kids ? 'kids24' : 'std')),
    };

    // Verbaubarkeit prüfen (data.js COMPAT_RULES + _blocked-Picks + only/except)
    const CFG_GROUPS = ['motor','battery','extrabat','groupset','tire','fender','rack','light','bottle','stand','seatpost','shock','bag','lock','childseat','signature','size','wheelset','color'];
    const violations = [], warnings = [];
    // erst nicht verbaubare Picks auf Default zurücksetzen (Warnung), dann Regeln prüfen
    for (const g of CFG_GROUPS)
      if (c[g]._blocked) {
        warnings.push(`${OPTION_GROUPS[g].find(o => o.id === c[g].id).name} ist auf ${frame.name} nicht verbaubar — weggelassen`);
        c[g] = this.compatOptions(frame, g)[0];
      }
    for (const r of COMPAT_RULES)
      if (r.check(c)) violations.push(typeof r.reason === 'function' ? r.reason(c) : r.reason);

    const price = CFG_GROUPS.map(g => c[g])
      .reduce((s, o) => s + o.price, frame.basePrice);

    return { frame, config: c, price, violations, warnings, withinBudget: !intent.budget || price <= intent.budget };
  },

  // Rahmenkandidaten → { ok: [...], blocked: [{frame, reasons}], overBudget: [...] }
  recommend(intent) {
    const frames = FRAMES.filter(f =>
      (!intent.frameId || f.id === intent.frameId) &&
      (intent.ebike === undefined || !!f.e === intent.ebike) &&
      (!f.kids || intent.frameId === 'kids'));
    const ok = [], blocked = [], overBudget = [];
    for (const f of frames) {
      const b = this.build(f, intent);
      if (b.violations.length) blocked.push({ frame: f, reasons: b.violations, warnings: b.warnings });
      else if (!b.withinBudget) overBudget.push(b);
      else ok.push(b);
    }
    // Sortierung: Preis aufsteigend (Budget-treue zuerst)
    ok.sort((a, b) => a.price - b.price);
    overBudget.sort((a, b) => a.price - b.price);
    return { ok, blocked, overBudget };
  },

  // Ersatzteillogik: kompatible Akkus für ein Rahmenmodell
  spareParts(frameId, group = 'battery') {
    const frame = FRAMES.find(f => f.id === frameId);
    if (!frame) return { frame: null, parts: [], note: "Modell unbekannt" };
    const parts = this.compatOptions(frame, group).filter(o => o.spare);
    return { frame, parts };
  },
};
