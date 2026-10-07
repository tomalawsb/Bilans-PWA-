// Testy funkcjonalne rozpoznawania wpisów (parser lokalny + reguły jawne).
// Uruchomienie: node tests/parser.test.mjs  (bez zależności, Node 18+)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let code = fs.readFileSync(path.join(here, '..', 'src', 'app.js'), 'utf8');
code = code.replace(/\ninit\(\)\.catch\([\s\S]*$/, '\n');
code += `\n;globalThis.__api = { parseNaturalText, applyBilansAiAnalysis, detectExplicitCommands, tagRulesSet: v => { tagRules = v.map(normalizeRule); }, DEFAULT_TAG_RULES };`;

const store = new Map();
const nullEl = () => null;
const documentStub = {
  querySelector: nullEl, querySelectorAll: () => [], getElementById: nullEl,
  addEventListener() {}, createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, appendChild() {} }),
  documentElement: { dataset: {}, style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} } },
  body: { dataset: {}, classList: { add() {}, remove() {}, toggle() {} } }
};
const ctx = {
  console, URL, URLSearchParams, setTimeout, clearTimeout, Intl, crypto: globalThis.crypto, TextEncoder,
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  navigator: { onLine: false, userAgent: 'node' },
  document: documentStub, location: { href: 'http://localhost/', search: '' }, matchMedia: () => ({ matches: false, addEventListener() {} })
};
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'app.js' });
const api = ctx.__api;
api.tagRulesSet(api.DEFAULT_TAG_RULES);

// Kategorie zgodne z domyślnymi regułami tagów programu (router → Komputerowe, ustawienie anteny → Montaże).
const cases = [
  ['Dino 13,50 karta', { entryType: 'wydatek', amount: 13.5, paymentMethod: 'karta', scope: 'domowe', category: 'Jedzenie' }],
  ['Dino 13,50 gotówka', { entryType: 'wydatek', amount: 13.5, paymentMethod: 'gotówka', scope: 'domowe', category: 'Jedzenie' }],
  ['firmowe paliwo 200 karta', { entryType: 'wydatek', amount: 200, paymentMethod: 'karta', scope: 'firmowe', category: 'Paliwo' }],
  ['prywatnie paliwo 200 karta', { entryType: 'wydatek', amount: 200, paymentMethod: 'karta', scope: 'domowe', category: 'Paliwo' }],
  ['zarobek 150 ustawienie anteny gotówka', { entryType: 'przychód', amount: 150, paymentMethod: 'gotówka', scope: 'firmowe', category: 'Montaże' }],
  ['firmowe router 300 przelew', { entryType: 'wydatek', amount: 300, paymentMethod: 'bank', scope: 'firmowe', category: 'Komputerowe' }],
  ['hot dog 12,50', { entryType: 'wydatek', amount: 12.5, paymentMethod: 'gotówka', scope: 'domowe', category: 'Jedzenie' }],
  ['zakup dwóch routerów po 150 karta', { entryType: 'wydatek', amount: 300, paymentMethod: 'karta', scope: 'firmowe', category: 'Komputerowe' }],
  // Jawne słowa muszą wygrać z AI:
  ['Dino 13,50 kartą', { paymentMethod: 'karta' }, { platnosc: 'gotówka', rodzaj: 'firmowe' }],
  ['prywatnie paliwo 200 blik', { paymentMethod: 'blik', scope: 'domowe' }, { platnosc: 'karta', rodzaj: 'firmowe' }],
  ['firmowe router 300 z konta', { paymentMethod: 'bank', scope: 'firmowe' }, { platnosc: 'gotówka', rodzaj: 'domowe' }],
  ['do firmy kabel 40 gotówką', { paymentMethod: 'gotówka', scope: 'firmowe' }, { platnosc: 'karta', rodzaj: 'domowe' }],
  ['służbowe obiad 45 blik', { paymentMethod: 'blik', scope: 'firmowe' }, { platnosc: 'gotówka', rodzaj: 'domowe' }],
  ['dla domu wiertarka 250 przelew', { paymentMethod: 'bank', scope: 'domowe' }, { platnosc: 'karta', rodzaj: 'firmowe' }],
  ['Dino 1 250,00 karta', { amount: 1250, paymentMethod: 'karta' }],
  ['na firmę kabel 40 gotówką', { paymentMethod: 'gotówka', scope: 'firmowe' }, { platnosc: 'karta', rodzaj: 'domowe' }]
];

let failed = 0;
for (const [text, expected, ai] of cases) {
  let [entry] = api.parseNaturalText(text);
  if (ai) {
    [entry] = api.applyBilansAiAnalysis([entry], { wpisy: [{ indeks: 0, typ: 'wydatek', kategoria: 'Inne', opis: entry.description, pewnosc: 90, ...ai }] });
  }
  if (process.env.DEBUG) console.log(entry.description, "|", entry.originalText, "|", entry.learningSourceText);
  const errors = Object.entries(expected).filter(([k, v]) => entry?.[k] !== v).map(([k, v]) => `${k}: oczekiwano "${v}", jest "${entry?.[k]}"`);
  if (errors.length) failed++;
  console.log(`${errors.length ? 'FAIL' : 'OK  '} ${ai ? '[AI] ' : ''}${text}  →  ${entry?.entryType} | ${entry?.amount} | ${entry?.paymentMethod} | ${entry?.scope} | ${entry?.category}${errors.length ? '\n      ' + errors.join('\n      ') : ''}`);
}
console.log(`\nWynik: ${cases.length - failed}/${cases.length} OK`);
process.exit(failed ? 1 : 0);
