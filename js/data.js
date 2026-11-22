// ============================================================
// DATA — Mandant "SIGNATO Bikes": Produktkatalog + Optionen + Regeln
// Reine Stammdaten, getrennt von Engine (rules.js) und Sprache (llm.js):
//   TENANT/CUSTOMER = Mandant + Kunde inkl. Bestellhistorie (Assets)
//   FRAMES          = Basisprodukte mit Mount-Flags (fenderMounts, rackMounts, ...)
//   OPTION_GROUPS   = Varianten mit Preis + Verbaubarkeits-Metadaten
// Kompatibilitaet deklarativ: only/except (Rahmen), Mount-/Rack-Flags,
// conflicts (Option↔Option) + COMPAT_RULES (harte Constraints mit Grund).
// ============================================================

const TENANT = { name: "SIGNATO Bikes", tagline: "Custom-Built E-Commerce" };

// --- eingeloggter Kunde: Besitz + Bestellhistorie (Mandanten-Stammdaten) ---
const CUSTOMER = {
  name: "Max Testkäufer",
  owned: ["etrek", "mtb"],          // gekaufte Rahmen-Modelle
  orders: [
    { frameId: "etrek", date: "2024-03", config: "Mittelmotor, Akku 625 Wh, Licht",
      items: ["Mittelmotor", "Akku 625 Wh", "Lichtanlage", "Touring 35mm"] },
    { frameId: "mtb",   date: "2023-06", config: "Basis-Schaltung, MTB 2.25\"",
      items: ["Basis-Schaltung", 'MTB 2.25"', "Federsattelstütze"] },
  ],
};

// --- Rahmen (Basisprodukte) ---
const FRAMES = [
  { id: "mtb",    name: "MTB Hardtail",     basePrice: 899,  fenderMounts: true,  rackMounts: true,  maxTire: "mtb225", bottleMounts: true,  standMounts: false },
  { id: "fully",  name: "MTB Fully",        basePrice: 1499, fenderMounts: true,  rackMounts: false, maxTire: "mtb225", bottleMounts: false, standMounts: false },
  { id: "trekking", name: "Trekking",       basePrice: 749,  fenderMounts: true,  rackMounts: true,  maxTire: "tour35", bottleMounts: true,  standMounts: true },
  { id: "gravel", name: "Gravel",           basePrice: 1199, fenderMounts: true,  rackMounts: true,  maxTire: "gravel45", bottleMounts: true, standMounts: false },
  { id: "road",   name: "Rennrad",          basePrice: 1099, fenderMounts: false, rackMounts: false, maxTire: "slick28", bottleMounts: true,  standMounts: false },
  { id: "emtb",   name: "eMTB",             basePrice: 1899, fenderMounts: true,  rackMounts: true,  maxTire: "mtb225", bottleMounts: true,  standMounts: true,  e: true },
  { id: "etrek",  name: "eTrekking",        basePrice: 1799, fenderMounts: true,  rackMounts: true,  maxTire: "tour35", bottleMounts: true,  standMounts: true,  e: true },
  { id: "kids",   name: "Kids Edition 24\"", basePrice: 399, fenderMounts: true,  rackMounts: true,  maxTire: "tour35", bottleMounts: true,  standMounts: true,  kids: true },
];

// --- Optionen (Varianten-Erweiterungen) ---
// only/except = Rahmen-IDs; required = muss bei diesem Rahmen gewaehlt werden
const OPTION_GROUPS = {
  motor: [
    { id: "none", name: "ohne Motor",        price: 0,   except: ["emtb", "etrek"] },
    { id: "hub",  name: "Nabenmotor",        price: 349, only: ["emtb", "etrek"] },
    { id: "mid",  name: "Mittelmotor",       price: 799, only: ["emtb", "etrek"] },
  ],
  battery: [
    { id: "none",  name: "ohne Akku",        price: 0,   except: ["emtb", "etrek"] },
    { id: "bt400", name: "Akku 400 Wh",      price: 399, only: ["emtb", "etrek"], spare: true },
    { id: "bt625", name: "Akku 625 Wh",      price: 549, only: ["emtb", "etrek"], spare: true },
    { id: "bt750", name: "Akku 750 Wh",      price: 649, only: ["emtb"],          spare: true },
  ],
  extrabat: [
    { id: "none",   name: "kein Zweitakku",        price: 0 },
    { id: "ext250", name: "Zusatzakku 250 Wh",     price: 279, only: ["emtb", "etrek"], spare: true, needsBattery: true },
  ],
  groupset: [
    { id: "base",    name: "Basis-Schaltung",      price: 0 },
    { id: "deore",   name: "Shimano Deore 11f",    price: 289, except: ["road"] },
    { id: "xt12",    name: "Shimano XT 12f",       price: 549, only: ["mtb", "fully", "emtb"] },
    { id: "ultegra", name: "Shimano Ultegra",      price: 499, only: ["road", "gravel"] },
  ],
  tire: [
    { id: "std",      name: "Basis-Bereifung",        price: 0 },
    { id: "slick28",  name: "Slicks 28mm",            price: 0,  only: ["road", "trekking"] },
    { id: "tour35",   name: "Touring 35mm",           price: 39, except: ["road"] },
    { id: "gravel45", name: "Gravel 45mm",            price: 49, only: ["gravel", "mtb", "fully", "emtb"] },
    { id: "mtb225",   name: 'MTB 2.25"',              price: 49, only: ["mtb", "fully", "emtb"] },
  ],
  fender: [
    { id: "none",  name: "ohne Schutzblech",       price: 0 },
    { id: "short", name: "Schutzblech kurz",       price: 29, only: ["mtb", "fully", "emtb"] },
    { id: "full",  name: "Schutzblech ganz",       price: 59,
      conflicts: ["mtb225", "gravel45"],   // Reifen zu breit fuer Vollblech
      needsMounts: true },
  ],
  rack: [
    { id: "none", name: "ohne Gepaecktraeger", price: 0 },
    { id: "rack", name: "Gepaecktraeger",      price: 49, needsMounts: "rack" },
  ],
  light: [
    { id: "none",  name: "ohne Licht",        price: 0 },
    { id: "light", name: "Lichtanlage",       price: 79, except: ["road"] },
  ],
  bottle: [
    { id: "none",   name: "ohne Flaschenhalter", price: 0 },
    { id: "bottle", name: "Flaschenhalter",      price: 19, needsBottleMounts: true },
  ],
  stand: [
    { id: "none",  name: "ohne Ständer",     price: 0 },
    { id: "stand", name: "Seitenständer",    price: 29, needsStandMounts: true },
  ],
  seatpost: [
    { id: "none",   name: "starre Sattelstütze",   price: 0 },
    { id: "sprung", name: "Federsattelstütze",     price: 89, except: ["road"] },
  ],
  shock: [
    { id: "none",  name: "Serien-Dämpfer",         price: 0 },
    { id: "air",   name: "Luftdämpfer-Upgrade",    price: 399, only: ["fully"], spare: true },
  ],
  bag: [
    { id: "none", name: "ohne Tasche",      price: 0 },
    { id: "bag",  name: "Rahmentasche",     price: 49, only: ["gravel", "mtb", "emtb", "trekking"] },
  ],
  lock: [
    { id: "none", name: "ohne Schloss",     price: 0 },
    { id: "lock", name: "Faltschloss",      price: 69 },
  ],
  childseat: [
    { id: "none",  name: "ohne Kindersitz", price: 0 },
    { id: "seat",  name: "Kindersitz",      price: 99, needsRack: true, except: ["road", "fully"] },
  ],
  signature: [
    { id: "none",      name: "ohne Signatur",              price: 0 },
    { id: "sig_klassik", name: "Signatur · Klassik",       price: 99 },
    { id: "sig_modern",  name: "Signatur · Modern",        price: 99 },
    { id: "sig_hand",    name: "Signatur · Handschrift",   price: 99 },
  ],
  color: [
    { id: "std",     name: "Graphitschwarz",  price: 0,   hex: "#212529" },
    { id: "rot",     name: "Feuerrot",        price: 49,  hex: "#e03131" },
    { id: "orange",  name: "Sunset Orange",   price: 49,  hex: "#e8590c" },
    { id: "gelb",    name: "Racing Gelb",     price: 49,  hex: "#f59f00" },
    { id: "gruen",   name: "Forest Grün",     price: 49,  hex: "#37b24d" },
    { id: "blau",    name: "Ocean Blau",      price: 49,  hex: "#1971c2" },
    { id: "violett", name: "Deep Violett",    price: 49,  hex: "#7048e8" },
  ],
  size: [
    { id: "none", name: "Größe offen",      price: 0 },
    { id: "xs",   name: 'XS / 44–46',        price: 0 },
    { id: "s",    name: 'S / 48–50',         price: 0 },
    { id: "m",    name: 'M / 52–54',         price: 0 },
    { id: "l",    name: 'L / 56–58',         price: 0 },
    { id: "xl",   name: 'XL / 60–62',        price: 0 },
  ],
  wheelset: [
    { id: "std",      name: "Alu-Laufradsatz",           price: 0 },
    { id: "aero",     name: "Carbon-Aero-Laufräder",     price: 899, only: ["road", "gravel"] },
    { id: "trail",    name: "Carbon-Trail-Laufräder",    price: 749, only: ["mtb", "fully", "emtb"] },
    { id: "erated",   name: "E-verstärkter Laufradsatz", price: 249, only: ["emtb", "etrek"] },
    { id: "kids24",   name: 'Kids 24" Laufradsatz',      price: 0,   only: ["kids"] },
  ],
};

// ============================================================
// RULES-Tabelle: Verbaubarkeit (fachliche Begruendungen fuer den Chat)
// ============================================================
// Wird von rules.js ausgewertet; jede Regel hat einen erklaerbaren Grund.
const COMPAT_RULES = [
  { check: (c) => c.frame.e && (c.motor.id === "none" || c.battery.id === "none"),
    reason: "E-Bike braucht Motor UND Akku" },
  { check: (c) => c.motor.id === "none" && c.battery.id !== "none",
    reason: "Akku nur sinnvoll mit Motor — erst Motor wählen" },
  { check: (c) => !c.frame.e && (c.motor.id !== "none" || c.battery.id !== "none"),
    reason: "Motor/Akku nur auf E-Bike-Rahmen" },
  { check: (c) => c.fender.needsMounts && !c.frame.fenderMounts && c.fender.id !== "none",
    reason: (c) => `${c.fender.name} braucht Schutzblech-Aufnahmen — ${c.frame.name} hat keine` },
  { check: (c) => c.fender.conflicts && c.fender.conflicts.includes(c.tire.id),
    reason: (c) => `${c.fender.name} passt nicht zu ${c.tire.name} (Reifen zu breit)` },
  { check: (c) => c.rack.id !== "none" && !c.frame.rackMounts,
    reason: (c) => `Gepaecktraeger nicht montierbar auf ${c.frame.name}` },
  { check: (c) => c.bottle.needsBottleMounts && c.bottle.id !== "none" && !c.frame.bottleMounts,
    reason: (c) => `Flaschenhalter braucht Gewinde im Rahmendreieck — ${c.frame.name} hat keins (Dämpfer im Weg)` },
  { check: (c) => c.stand.needsStandMounts && c.stand.id !== "none" && !c.frame.standMounts,
    reason: (c) => `Ständer braucht KSA-Aufnahme — ${c.frame.name} hat keine` },
  { check: (c) => c.childseat.needsRack && c.childseat.id !== "none" && c.rack.id === "none",
    reason: "Kindersitz nur auf montiertem Gepäckträger — erst Gepäckträger wählen" },
  { check: (c) => c.frame.kids && (c.motor.id !== "none" || c.groupset.id === "xt12" || c.groupset.id === "ultegra"),
    reason: "Kids Edition: kein Motor, keine High-End-Schaltgruppen" },
  { check: (c) => c.frame.kids && c.size.id !== "none" && !["xs", "s"].includes(c.size.id),
    reason: "Kids Edition gibt's nur in XS–S" },
  { check: (c) => !c.frame.kids && ["xs", "s"].includes(c.size.id) && c.frame.id === "road",
    reason: (c) => `${c.frame.name} gibt's erst ab Größe M — für XS/S → Kids Edition oder Gravel` },
  { check: (c) => c.tire.id === "mtb225" && c.wheelset.id === "aero",
    reason: "Carbon-Aero-Felgen zu schmal für 2.25\"-Reifen" },
  { check: (c) => c.frame.kids && c.wheelset.id !== "kids24" && c.wheelset.id !== "std",
    reason: "Kids Edition braucht 24\"-Laufradsatz" },
  { check: (c) => c.bag.id !== "none" && c.bottle.id !== "none",
    reason: "Rahmentasche und Flaschenhalter teilen sich den Platz im Rahmendreieck — bitte eins wählen" },
  { check: (c) => c.extrabat && c.extrabat.id !== "none" && c.battery.id === "none",
    reason: "Zusatzakku braucht Hauptakku" },
];
