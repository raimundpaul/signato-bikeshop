// Parser-Tests: node test.js  (kein Browser noetig — nur llm.js + data.js + rules.js)
// HINWEIS: testet nur den Regex-Fallback (_parseRegex). Der Ollama-Pfad ist
// browser-only + localhost-only (github.io -> localhost blockt Chrome als
// Private Network Access) und wird manuell ueber das Engine-Badge geprueft:
// 🧠 llm auf localhost:8124, 🔤 regex auf der GitHub-Pages-Demo.
const fs = require('fs');
const src = ['js/data.js', 'js/rules.js', 'js/llm.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const { LLM, Rules, FRAMES } = eval(src + '\n;({ LLM, Rules, FRAMES })');

const cases = [
  // [input, expected type (null = egal), muss enthaltenes Feld]
  ['zub für mein trekking rad',            'parts',  { frameId: 'trekking' }],
  ['zubehör meint eich',                   'parts',  {}],
  ['ich will ein beke',                    'buy',    {}],
  ['pfannkuchen',                          'unknown',{}],
  ['ich will ein zubehor kaufen',          'parts',  {}],
  ['fully',                                'buy',    { frameId: 'fully' }],
  ['mtb fully',                            'buy',    { frameId: 'fully' }],
  ['efully',                               'buy',    { ebike: true }],
  ['defekter akku',                        'defect', {}],
  ['erennrad',                             'buy',    { eRoadRequest: true }],
  ['ebike mtb mit großem akku unter 3500', 'buy',    { frameId: 'emtb', battery: 'bt750', budget: 3500 }],
  ['ersatzakku für etrekking',             'parts',  { frameId: 'etrek' }],
  ['ich will ein montainbike',             'buy',    { frameId: 'mtb' }],
];

let fails = 0;
for (const [input, type, fields] of cases) {
  const i = LLM._parseRegex(input);
  const bad = [];
  if (type && i.type !== type) bad.push(`type=${i.type} (erwartet ${type})`);
  for (const [k, v] of Object.entries(fields))
    if (i[k] !== v) bad.push(`${k}=${i[k]} (erwartet ${v})`);
  if (bad.length) { fails++; console.log(`FAIL "${input}" → ${JSON.stringify(i)}  [${bad.join('; ')}]`); }
  else console.log(`ok   "${input}" → ${i.type}${i.frameId ? '/' + i.frameId : ''}`);
}
console.log(fails ? `\n${fails} Fehler` : '\nalle Tests bestanden');
process.exit(fails ? 1 : 0);
