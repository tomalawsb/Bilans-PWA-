const DB_NAME = 'bilans-pwa-etap1';
const DB_VERSION = 3;
const APP_VERSION = 18;
const STORE = 'entries';
const TAG_RULE_STORE = 'tagRules';
const DEVICE_ID_KEY = 'bilans-pwa-device-id';
const THEME_KEY = 'bilans-pwa-theme';
const STORAGE_MODE_KEY = 'bilans-pwa-storage-mode';
const DROPBOX_CONFIG_KEY = 'bilans-pwa-dropbox-config';
const DROPBOX_TOKEN_KEY = 'bilans-pwa-dropbox-token';
const DROPBOX_OAUTH_KEY = 'bilans-pwa-dropbox-oauth';

const THEMES = {
  classic: { name: 'Jasny klasyczny', color: '#f6f3ea' },
  blue: { name: 'Błękitny firmowy', color: '#edf5ff' },
  green: { name: 'Zielony bilans', color: '#eef8f1' },
  gold: { name: 'Grafitowo-złoty', color: '#f6f2e7' },
  contrast: { name: 'Kontrastowy', color: '#ffffff' },
  dark: { name: 'Ciemny', color: '#101827' }
};

const CATEGORIES = [
  'Komputerowe',
  'Antenowe',
  'Montaże',
  'Monitoring',
  'Paliwo',
  'Mechanik',
  'Jedzenie',
  'Usługi',
  'Dom',
  'Bank',
  'Hurtownia',
  'Podatki/ZUS',
  'Inne'
];

const SCOPES = ['nieokreślone', 'domowe', 'firmowe'];

function formatScope(value) {
  const normalized = normalizeScope(value);
  if (normalized === 'domowe') return 'Domowe';
  if (normalized === 'firmowe') return 'Firmowe';
  return 'Nie określono';
}

function normalizeScope(value) {
  const raw = normalizeText(value);
  if (['domowe', 'domowy', 'domowa', 'dom', 'prywatne', 'prywatny', 'prywatna'].includes(raw)) return 'domowe';
  if (['firmowe', 'firmowy', 'firmowa', 'firma', 'sluzbowe', 'sluzbowy', 'sluzbowa'].includes(raw)) return 'firmowe';
  return 'nieokreślone';
}



const DEFAULT_TAG_RULES = [
  {
    id: 'default-hotdog',
    name: 'Hotdog',
    aliases: ['hotdog', 'hot dog', 'hot-dog', 'hot doga', 'hot-doga', 'hotdogi'],
    category: 'Jedzenie',
    entryType: 'wydatek',
    system: true
  },
  {
    id: 'default-kamera',
    name: 'Kamera',
    aliases: ['kamera', 'kamery', 'kamerę', 'kamere', 'kamera ezviz', 'ezviz', 'hikvision', 'dahua'],
    category: 'Monitoring',
    entryType: 'wydatek',
    system: true
  },
  {
    id: 'default-router',
    name: 'Router',
    aliases: ['router', 'routery', 'routera', 'router wifi', 'wi-fi'],
    category: 'Komputerowe',
    entryType: 'wydatek',
    system: true
  },
  {
    id: 'default-antena',
    name: 'Antena satelitarna',
    aliases: ['antena satelitarna', 'antene satelitarna', 'antenę satelitarną', 'antena', 'anteny', 'talerz', 'konwerter'],
    category: 'Antenowe',
    entryType: 'wydatek',
    system: true
  },
  {
    id: 'default-paliwo',
    name: 'Paliwo',
    aliases: ['paliwo', 'benzyna', 'diesel', 'ropa', 'lpg', 'orlen', 'shell', 'bp'],
    category: 'Paliwo',
    entryType: 'wydatek',
    system: true
  },
  {
    id: 'default-ustawienie-anteny',
    name: 'Ustawienie anteny',
    aliases: ['ustawienie anteny', 'ustawianie anteny', 'montaz anteny', 'montaż anteny', 'serwis anteny'],
    category: 'Montaże',
    entryType: 'przychód',
    system: true
  }
];

const WEEKDAYS = [
  'niedziela',
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota'
];

let db;
let allEntries = [];
let filteredEntries = [];
let editingId = null;
let deferredInstallPrompt = null;
let parsedDrafts = [];
let tagRules = [];
let calendarMonth = todayISO().slice(0, 7);
let selectedCalendarDate = todayISO();
let calendarYear = Number(todayISO().slice(0, 4));
let draggedEntryId = null;
let voiceRecognition = null;
let voiceIsRecording = false;
let voiceFinalText = "";
let voiceInterimText = "";

const el = {
  todayLabel: document.querySelector('#todayLabel'),
  messageBox: document.querySelector('#messageBox'),
  installButton: document.querySelector('#installButton'),
  voiceShortcutButton: document.querySelector('#voiceShortcutButton'),
  voiceQuickPanel: document.querySelector('#voiceQuickPanel'),
  voiceCloseButton: document.querySelector('#voiceCloseButton'),
  voiceRecordButton: document.querySelector('#voiceRecordButton'),
  voiceStopButton: document.querySelector('#voiceStopButton'),
  voiceParseButton: document.querySelector('#voiceParseButton'),
  voiceSaveButton: document.querySelector('#voiceSaveButton'),
  voiceStatus: document.querySelector('#voiceStatus'),
  voiceText: document.querySelector('#voiceText'),
  voicePreview: document.querySelector('#voicePreview'),
  cacheResetButton: document.querySelector('#cacheResetButton'),
  appVersionBadge: document.querySelector('#appVersionBadge'),
  exportButton: document.querySelector('#exportButton'),
  importInput: document.querySelector('#importInput'),
  quickText: document.querySelector('#quickText'),
  parseButton: document.querySelector('#parseButton'),
  addParsedButton: document.querySelector('#addParsedButton'),
  parsePreview: document.querySelector('#parsePreview'),
  calendarPrevButton: document.querySelector('#calendarPrevButton'),
  calendarTodayButton: document.querySelector('#calendarTodayButton'),
  calendarNextButton: document.querySelector('#calendarNextButton'),
  calendarClearDayButton: document.querySelector('#calendarClearDayButton'),
  calendarMonthLabel: document.querySelector('#calendarMonthLabel'),
  calendarMonthSummary: document.querySelector('#calendarMonthSummary'),
  calendarGrid: document.querySelector('#calendarGrid'),
  calendarDayDetails: document.querySelector('#calendarDayDetails'),
  moveInfo: document.querySelector('#moveInfo'),
  yearPrevButton: document.querySelector('#yearPrevButton'),
  yearTodayButton: document.querySelector('#yearTodayButton'),
  yearNextButton: document.querySelector('#yearNextButton'),
  yearCalendarLabel: document.querySelector('#yearCalendarLabel'),
  yearCalendarSummary: document.querySelector('#yearCalendarSummary'),
  yearCalendarGrid: document.querySelector('#yearCalendarGrid'),
  yearTopDays: document.querySelector('#yearTopDays'),
  exportMonthPngButton: document.querySelector('#exportMonthPngButton'),
  printMonthPdfButton: document.querySelector('#printMonthPdfButton'),
  exportYearPngButton: document.querySelector('#exportYearPngButton'),
  printYearPdfButton: document.querySelector('#printYearPdfButton'),
  syncExportButton: document.querySelector('#syncExportButton'),
  syncImportInput: document.querySelector('#syncImportInput'),
  replaceImportInput: document.querySelector('#replaceImportInput'),
  syncInfo: document.querySelector('#syncInfo'),
  startupModePanel: document.querySelector('#startupModePanel'),
  chooseLocalModeButton: document.querySelector('#chooseLocalModeButton'),
  chooseDropboxModeButton: document.querySelector('#chooseDropboxModeButton'),
  storageModeSelect: document.querySelector('#storageModeSelect'),
  dropboxAppKeyInput: document.querySelector('#dropboxAppKeyInput'),
  dropboxFilePathInput: document.querySelector('#dropboxFilePathInput'),
  dropboxConnectButton: document.querySelector('#dropboxConnectButton'),
  dropboxSyncNowButton: document.querySelector('#dropboxSyncNowButton'),
  dropboxDisconnectButton: document.querySelector('#dropboxDisconnectButton'),
  cloudStatus: document.querySelector('#cloudStatus'),
  tagRuleForm: document.querySelector('#tagRuleForm'),
  tagGroupName: document.querySelector('#tagGroupName'),
  tagAliases: document.querySelector('#tagAliases'),
  tagRuleCategory: document.querySelector('#tagRuleCategory'),
  tagRuleType: document.querySelector('#tagRuleType'),
  tagRulesList: document.querySelector('#tagRulesList'),
  entryForm: document.querySelector('#entryForm'),
  formTitle: document.querySelector('#formTitle'),
  saveButton: document.querySelector('#saveButton'),
  resetButton: document.querySelector('#resetButton'),
  cancelEditButton: document.querySelector('#cancelEditButton'),
  entryDate: document.querySelector('#entryDate'),
  entryType: document.querySelector('#entryType'),
  entryScope: document.querySelector('#entryScope'),
  category: document.querySelector('#category'),
  amount: document.querySelector('#amount'),
  paymentMethod: document.querySelector('#paymentMethod'),
  tags: document.querySelector('#tags'),
  description: document.querySelector('#description'),
  originalText: document.querySelector('#originalText'),
  todayBalance: document.querySelector('#todayBalance'),
  todayDetails: document.querySelector('#todayDetails'),
  monthBalance: document.querySelector('#monthBalance'),
  monthDetails: document.querySelector('#monthDetails'),
  allBalance: document.querySelector('#allBalance'),
  allDetails: document.querySelector('#allDetails'),
  mainReport: document.querySelector('#mainReport'),
  categoryReport: document.querySelector('#categoryReport'),
  itemReport: document.querySelector('#itemReport'),
  entriesCounter: document.querySelector('#entriesCounter'),
  filterForm: document.querySelector('#filterForm'),
  searchQuery: document.querySelector('#searchQuery'),
  filterFrom: document.querySelector('#filterFrom'),
  filterTo: document.querySelector('#filterTo'),
  filterType: document.querySelector('#filterType'),
  filterScope: document.querySelector('#filterScope'),
  filterCategory: document.querySelector('#filterCategory'),
  filterPayment: document.querySelector('#filterPayment'),
  clearFiltersButton: document.querySelector('#clearFiltersButton'),
  clearAllButton: document.querySelector('#clearAllButton'),
  entriesTableBody: document.querySelector('#entriesTableBody'),
  mobileEntries: document.querySelector('#mobileEntries'),
  themeSelect: document.querySelector('#themeSelect'),
  themeCards: Array.from(document.querySelectorAll('[data-theme-option]'))
};


function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES[saved] ? saved : 'classic';
  } catch (_) {
    return 'classic';
  }
}

function applyTheme(themeName, save = true) {
  const safeTheme = THEMES[themeName] ? themeName : 'classic';
  document.body.dataset.theme = safeTheme;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', THEMES[safeTheme].color);
  if (el.themeSelect) el.themeSelect.value = safeTheme;
  for (const card of el.themeCards || []) {
    card.classList.toggle('active', card.dataset.themeOption === safeTheme);
  }
  if (save) {
    try { localStorage.setItem(THEME_KEY, safeTheme); } catch (_) {}
  }
}

function setupThemes() {
  applyTheme(getSavedTheme(), false);
  if (el.themeSelect) {
    el.themeSelect.addEventListener('change', () => applyTheme(el.themeSelect.value));
  }
  for (const card of el.themeCards || []) {
    card.addEventListener('click', () => applyTheme(card.dataset.themeOption));
  }
}

function randomToken() {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint32Array(4);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(36)).join('-');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${randomToken()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function makeSyncId(prefix = 'entry') {
  return `${prefix}-${getDeviceId()}-${Date.now().toString(36)}-${randomToken()}`;
}

let localIdCounter = 0;

function makeLocalEntryId() {
  localIdCounter += 1;
  return Date.now() * 1000 + localIdCounter;
}

function isValidLocalEntryId(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function prepareEntryForStorage(entry, options = {}) {
  const { forceNewId = false } = options;
  const cleaned = { ...entry };
  const numericId = Number(cleaned.id);

  if (forceNewId || !isValidLocalEntryId(numericId)) {
    cleaned.id = makeLocalEntryId();
  } else {
    cleaned.id = numericId;
  }

  cleaned.syncId = cleaned.syncId || makeSyncId('entry');
  cleaned.sourceDeviceId = cleaned.sourceDeviceId || getDeviceId();
  return cleaned;
}

function stripLocalId(entry) {
  const cleaned = { ...entry };
  delete cleaned.id;
  return cleaned;
}

function sanitizeEntryKey(entry) {
  return prepareEntryForStorage(entry);
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekday(dateISO) {
  const date = new Date(`${dateISO}T12:00:00`);
  return WEEKDAYS[date.getDay()] ?? '';
}

function monthKey(dateISO) {
  return dateISO.slice(0, 7);
}

function formatMoney(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' zł';
}

function parseAmount(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace('zł', '')
    .replace('zl', '')
    .replace(',', '.');

  const value = Number(cleaned);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Podaj poprawną kwotę większą od zera.');
  }

  return Math.round(value * 100) / 100;
}

function normalizeTags(raw) {
  return String(raw ?? '')
    .split(',')
    .map(item => item.trim().replace(/^#/, ''))
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex(x => x.toLowerCase() === item.toLowerCase()) === index);
}



function ruleIdFromName(name) {
  return `rule-${normalizeText(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || Date.now()}`;
}

function normalizeAlias(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRule(rule) {
  const name = String(rule?.name ?? '').trim();
  const aliases = Array.isArray(rule?.aliases)
    ? rule.aliases
    : String(rule?.aliases ?? '').split(',');

  return {
    id: rule?.id || ruleIdFromName(name),
    name,
    aliases: normalizeTags(aliases.join(',')).filter(Boolean),
    category: CATEGORIES.includes(rule?.category) ? rule.category : 'Inne',
    entryType: ['przychód', 'wydatek', ''].includes(rule?.entryType) ? rule.entryType : '',
    system: Boolean(rule?.system),
    syncId: rule?.syncId || rule?.sync_id || rule?.id || makeSyncId('rule'),
    createdAt: rule?.createdAt || rule?.created_at || new Date().toISOString(),
    updatedAt: rule?.updatedAt || rule?.updated_at || new Date().toISOString()
  };
}

function findTagRule(text) {
  const source = ` ${normalizeAlias(text)} `;
  if (!source.trim()) return null;

  const candidates = tagRules
    .flatMap(rule => [rule.name, ...(rule.aliases ?? [])].map(alias => ({ rule, alias: normalizeAlias(alias) })))
    .filter(item => item.alias.length >= 2)
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const item of candidates) {
    const escaped = item.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (pattern.test(source)) return item.rule;
  }

  return null;
}

function inferReportGroup(description) {
  const cleaned = cleanDescription(description)
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:szt|sztuk|sztuki|m|km)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Inne';
  return cleaned.split(/\s+/).slice(0, 3).join(' ');
}

function enrichEntryWithTagRules(entry, options = {}) {
  const searchText = [
    entry.description,
    entry.originalText,
    entry.category,
    ...(entry.tags ?? [])
  ].join(' ');

  const matchedRule = findTagRule(searchText);
  const updated = { ...entry, tags: normalizeTags((entry.tags ?? []).join(',')) };

  if (matchedRule) {
    updated.reportGroup = matchedRule.name;
    if (options.overrideCategory || !updated.category || ['Inne', 'Dom'].includes(updated.category)) {
      updated.category = matchedRule.category || updated.category || 'Inne';
    }
    if (options.overrideType && matchedRule.entryType) {
      updated.entryType = matchedRule.entryType;
    }
    updated.tags = normalizeTags([...updated.tags, matchedRule.name, matchedRule.category].join(','));
  } else {
    updated.reportGroup = updated.reportGroup || inferReportGroup(updated.description || updated.originalText || updated.category);
  }

  return updated;
}

function resolveReportGroup(entry) {
  if (entry.reportGroup) return entry.reportGroup;
  const matchedRule = findTagRule([entry.description, entry.originalText, entry.category, ...(entry.tags ?? [])].join(' '));
  return matchedRule?.name || inferReportGroup(entry.description || entry.originalText || entry.category);
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseLooseAmount(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '');

  const firstDot = cleaned.indexOf('.');
  const normalized = firstDot === -1
    ? cleaned
    : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

function addDaysISO(baseISO, offset) {
  const date = new Date(`${baseISO}T12:00:00`);
  date.setDate(date.getDate() + offset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const MONTHS_PL = {
  stycznia: 1, styczen: 1, styczniu: 1,
  lutego: 2, luty: 2, lutym: 2,
  marca: 3, marzec: 3, marcu: 3,
  kwietnia: 4, kwiecien: 4, kwietniu: 4,
  maja: 5, maj: 5,
  czerwca: 6, czerwiec: 6, czerwcu: 6,
  lipca: 7, lipiec: 7, lipcu: 7,
  sierpnia: 8, sierpien: 8, sierpniu: 8,
  wrzesnia: 9, wrzesien: 9, wrzesniu: 9,
  pazdziernika: 10, pazdziernik: 10, pazdzierniku: 10,
  listopada: 11, listopad: 11, listopadzie: 11,
  grudnia: 12, grudzien: 12, grudniu: 12
};

function parseDateFromText(text) {
  const source = String(text ?? '');
  const normalized = normalizeText(source);
  const today = todayISO();

  if (/\bprzedwczoraj\b/.test(normalized)) return addDaysISO(today, -2);
  if (/\bwczoraj\b/.test(normalized)) return addDaysISO(today, -1);
  if (/\bjutro\b/.test(normalized)) return addDaysISO(today, 1);
  if (/\bdzisiaj\b|\bdzis\b/.test(normalized)) return today;

  const iso = source.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const numeric = source.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])(?:[-/.](20\d{2}|\d{2}))?\b/);
  if (numeric) {
    let [, day, month, year] = numeric;
    if (!year) year = today.slice(0, 4);
    if (year.length === 2) year = `20${year}`;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const monthNames = Object.keys(MONTHS_PL).join('|');
  const named = normalized.match(new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s+(${monthNames})(?:\\s+(20\\d{2}|\\d{2}))?\\b`));
  if (named) {
    let [, day, monthName, year] = named;
    if (!year) year = today.slice(0, 4);
    if (year.length === 2) year = `20${year}`;
    const month = MONTHS_PL[monthName];
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return el.entryDate.value || today;
}

const CATEGORY_RULES = [
  { category: 'Komputerowe', words: ['router', 'komputer', 'laptop', 'dysk', 'ssd', 'ram', 'plyta glowna', 'procesor', 'mysz', 'klawiatura', 'monitor', 'drukarka', 'toner'] },
  { category: 'Monitoring', words: ['kamera', 'kamery', 'monitoring', 'rejestrator', 'hikvision', 'ezviz', 'dahua', 'ipcam', 'puszka montazowa'] },
  { category: 'Antenowe', words: ['antena', 'anteny', 'antene', 'satelitarna', 'satelitarne', 'konwerter', 'talerz', 'maszt', 'obejma', 'kabel antenowy'] },
  { category: 'Montaże', words: ['montaz', 'instalacja', 'ustawienie', 'serwis', 'robocizna', 'dojazd', 'usluga'] },
  { category: 'Paliwo', words: ['paliwo', 'benzyna', 'diesel', 'ropa', 'lpg', 'orlen', 'bp', 'shell'] },
  { category: 'Mechanik', words: ['mechanik', 'olej', 'opona', 'opony', 'czesci auto', 'naprawa auta', 'samochod'] },
  { category: 'Jedzenie', words: ['hotdog', 'hot dog', 'hot-dog', 'jedzenie', 'obiad', 'kolacja', 'sniadanie', 'kebab', 'pizza', 'zabka', 'biedronka'] },
  { category: 'Bank', words: ['bank', 'konto', 'przelew', 'prowizja', 'odsetki', 'rata', 'kredyt'] },
  { category: 'Podatki/ZUS', words: ['zus', 'podatek', 'pit', 'vat', 'skarbowy'] },
  { category: 'Hurtownia', words: ['hurtownia', 'faktura', 'magazyn', 'towar'] },
  { category: 'Usługi', words: ['zarobek', 'przychod', 'wyplata', 'zaplata za', 'klient', 'fucha'] }
];

function detectCategory(text) {
  const normalized = normalizeText(text);
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(word => normalized.includes(word))) return rule.category;
  }
  return el.category.value || 'Inne';
}

function detectEntryType(text) {
  const normalized = normalizeText(text);
  const incomeWords = ['zarobek', 'zarobilem', 'przychod', 'wplyw', 'wplata', 'dostalem', 'otrzymalem', 'wyplata', 'faktura sprzedaz', 'usluga dla'];
  const expenseWords = ['kupilem', 'kupilam', 'zakup', 'zaplacilem', 'zaplacilam', 'wydalem', 'wydalam', 'koszt', 'kosztowalo', 'paragon'];

  if (incomeWords.some(word => normalized.includes(word))) return 'przychód';
  if (expenseWords.some(word => normalized.includes(word))) return 'wydatek';
  return el.entryType.value || 'wydatek';
}

function detectScope(text, entryType = 'wydatek', category = '') {
  const normalized = normalizeText(text);
  const firmWords = [
    'firmowe', 'firmowy', 'firmowa', 'na firme', 'dla firmy', 'faktura', 'nip', 'vat',
    'koszt firmowy', 'towar', 'hurtownia', 'klient', 'zlecenie', 'usluga', 'robocizna',
    'montaz', 'monitoring', 'kamera', 'antena', 'router', 'dojazd do klienta'
  ];
  const homeWords = [
    'domowe', 'domowy', 'domowa', 'do domu', 'dla domu', 'prywatne', 'prywatny', 'prywatna',
    'rodzinne', 'zakupy domowe', 'jedzenie do domu', 'rachunek domowy'
  ];

  if (homeWords.some(word => normalized.includes(word))) return 'domowe';
  if (firmWords.some(word => normalized.includes(word))) return 'firmowe';

  const normalizedCategory = normalizeText(category);
  if (['komputerowe', 'antenowe', 'montaze', 'monitoring', 'hurtownia', 'podatki/zus', 'uslugi'].some(word => normalizedCategory.includes(word))) return 'firmowe';
  if (['dom', 'jedzenie'].some(word => normalizedCategory.includes(word))) return 'domowe';

  if (entryType === 'przychód') return 'firmowe';
  return el.entryScope?.value || 'nieokreślone';
}

function detectPaymentMethod(text) {
  const normalized = normalizeText(text);

  if (/\bblik\b|\bbli(?:kiem|ka)?\b/.test(normalized)) return 'blik';

  if (/\bkarta\b|\bkarta platnicza\b|\bkarta debetowa\b|\bkarta kredytowa\b|\bkarta firmowa\b|\bkarta prywatna\b|\bterminal\b|\bterminalem\b|\bplatnosc karta\b|\bzaplacilem karta\b|\bzaplacilam karta\b/.test(normalized)) {
    return 'karta';
  }

  if (/\bbank\b|\bbankiem\b|\bprzelew\b|\bprzelewem\b|\bkonto\b|\bz konta\b|\bna konto\b|\bonline\b|\binternetowo\b|\belektronicznie\b|\bplatnosc elektroniczna\b|\bplatnosc online\b|\bpaypal\b|\bpayu\b|\bgoogle pay\b|\bapple pay\b/.test(normalized)) {
    return 'bank';
  }

  if (/\bgotowka\b|\bgotowkowo\b|\bcash\b|\bdo reki\b|\bw gotowce\b/.test(normalized)) return 'gotówka';

  return 'gotówka';
}

function extractQuantity(text) {
  const normalized = normalizeText(text);
  const patterns = [
    /(?:x|×)\s*(\d+(?:[,.]\d+)?)/,
    /\b(\d+(?:[,.]\d+)?)\s*(?:szt|szt\.|sztuk|sztuki)\b/,
    /\b(\d+(?:[,.]\d+)?)\s*(?:metry|metrow|m|km)\b/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const quantity = Number(match[1].replace(',', '.'));
      if (Number.isFinite(quantity) && quantity > 0) return quantity;
    }
  }

  return 1;
}

function shouldMultiplyByQuantity(text, amountBeforeDescription) {
  const normalized = normalizeText(text);
  return amountBeforeDescription
    || /\bza\s+(?:sztuke|sztuka|szt|metr|m)\b/.test(normalized)
    || /\bpo\s+\d/.test(normalized)
    || /\bjednostk/.test(normalized);
}

function cleanDescription(raw) {
  let value = String(raw ?? '')
    .replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?\b/g, ' ')
    .replace(/\b\d{1,2}\s+(stycznia|styczen|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|wrzesnia|października|pazdziernika|listopada|grudnia)(?:\s+\d{2,4})?\b/gi, ' ')
    .replace(/\b(dzisiaj|dziś|dzis|wczoraj|jutro|przedwczoraj)\b/gi, ' ')
    .replace(/\b(kupiłem|kupilem|kupiłam|kupilam|zakup|zakupy|zapłaciłem|zaplacilem|zapłaciłam|zaplacilam|wydałem|wydalem|wydałam|wydalam|koszt|kosztowało|kosztowalo|zarobek|zarobiłem|zarobilem|przychód|przychod|wpływ|wplyw|dostałem|dostalem|otrzymałem|otrzymalem|wpłata|wplata|paragon)\b/gi, ' ')
    .replace(/\b(gotówka|gotowka|kartą|karta|blik|bank|przelew|konto|firmowe|firmowy|firmowa|firma|na firmę|na firme|domowe|domowy|domowa|prywatne|prywatny|prywatna)\b/gi, ' ')
    .replace(/[=:+;|]/g, ' ')
    .replace(/\b(za|po|i|oraz|plus)\s*$/gi, ' ')
    .replace(/^\s*(za|po|i|oraz|plus)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  value = value.replace(/^[-–—,.]+|[-–—,.]+$/g, '').trim();
  return value;
}

function makeTagsFromDescription(description, category) {
  const base = normalizeTags(`${category}, parser`);
  const words = String(description ?? '')
    .split(/\s+/)
    .map(word => word.replace(/[^\p{L}\p{N}-]/gu, '').toLowerCase())
    .filter(word => word.length >= 4)
    .slice(0, 3);
  return normalizeTags([...base, ...words].join(','));
}

function findAmountMatches(text) {
  const regex = /(?:\b(\d+(?:[\s.]\d{3})*(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?)\s*(?:złotych|zlotych|zł|zl|pln)(?=$|\s|[.,;:!?]))|(?:(?:zł|zl|pln)\s*(\d+(?:[\s.]\d{3})*(?:[,.]\d{1,2})?|\d+(?:[,.]\d{1,2})?))/giu;
  return Array.from(text.matchAll(regex)).map(match => ({
    index: match.index,
    end: match.index + match[0].length,
    raw: match[0],
    value: parseLooseAmount(match[1] || match[2])
  })).filter(item => item.value && item.value > 0);
}

function takeBeforeDescription(text, from, to) {
  let part = text.slice(from, to);
  const lastSeparator = Math.max(part.lastIndexOf('\n'), part.lastIndexOf(';'), part.lastIndexOf(','));
  if (lastSeparator >= 0) part = part.slice(lastSeparator + 1);
  return cleanDescription(part);
}

function takeAfterDescription(text, from, to) {
  let part = text.slice(from, to);
  const firstSeparator = part.search(/(?:\s+i\s+|\s+oraz\s+|\s+plus\s+|[;\n,])/i);
  if (firstSeparator >= 0) part = part.slice(0, firstSeparator);
  return cleanDescription(part);
}

function parseNaturalText(rawText) {
  const source = String(rawText ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
  if (!source) throw new Error('Wpisz tekst do rozpoznania.');

  const matches = findAmountMatches(source);
  if (!matches.length) throw new Error('Nie znalazłem kwoty. Podaj np. „120 zł” albo „12,50 zł”.');

  const entryDate = parseDateFromText(source);
  const entryType = detectEntryType(source);
  const paymentMethod = detectPaymentMethod(source);

  const drafts = matches.map((match, index) => {
    const prevEnd = index === 0 ? 0 : matches[index - 1].end;
    const nextIndex = index + 1 < matches.length ? matches[index + 1].index : source.length;
    const before = takeBeforeDescription(source, prevEnd, match.index);
    const after = takeAfterDescription(source, match.end, nextIndex);
    const amountBeforeDescription = !before || before.length < 3 || /^(za|po)$/i.test(before);
    const description = amountBeforeDescription && after ? after : before || after || 'Wpis z tekstu';
    const context = `${before} ${match.raw} ${after}`;
    const quantity = extractQuantity(description || context);
    const multiplier = shouldMultiplyByQuantity(context, amountBeforeDescription) ? quantity : 1;
    const amount = Math.round(match.value * multiplier * 100) / 100;
    const category = detectCategory(`${description} ${context}`);
    const scope = detectScope(`${source} ${description} ${context}`, entryType, category);

    return enrichEntryWithTagRules({
      entryDate,
      weekday: getWeekday(entryDate),
      entryType,
      category,
      scope,
      amount,
      unitAmount: match.value,
      quantity,
      paymentMethod,
      description,
      originalText: source,
      tags: makeTagsFromDescription(description, category),
      syncId: makeSyncId('entry'),
      sourceDeviceId: getDeviceId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { overrideCategory: true, overrideType: true });
  });

  return drafts.filter(item => item.amount > 0 && item.description);
}

function optionsHtml(values, selectedValue) {
  const selected = String(selectedValue ?? '');
  const list = selected && !values.includes(selected) ? [selected, ...values] : values;
  return list.map(value => {
    const isSelected = value === selected ? ' selected' : '';
    return `<option value="${escapeHtml(value)}"${isSelected}>${escapeHtml(value)}</option>`;
  }).join('');
}

function updateParseSummary() {
  const summary = document.querySelector('#parseSummaryText');
  if (!summary) return;
  const total = summarize(parsedDrafts);
  summary.innerHTML = `Rozpoznane pozycje: <b>${parsedDrafts.length}</b> · Bilans: <b>${formatMoney(total.balance)}</b>`;
}

function updateParsedDraftFromElement(target) {
  const card = target.closest('[data-parse-index]');
  if (!card) return;

  const index = Number(card.dataset.parseIndex);
  const entry = parsedDrafts[index];
  if (!entry) return;

  const field = target.dataset.field;
  const value = target.value;

  if (field === 'entryDate') {
    entry.entryDate = value;
    entry.weekday = isValidDateISO(value) ? getWeekday(value) : entry.weekday;
  } else if (field === 'entryType') {
    entry.entryType = value === 'przychód' ? 'przychód' : 'wydatek';
  } else if (field === 'scope') {
    entry.scope = normalizeScope(value);
  } else if (field === 'category') {
    entry.category = value || 'Inne';
  } else if (field === 'amount') {
    const amount = parseLooseAmount(value);
    if (amount) {
      entry.amount = amount;
      if (!entry.unitAmount || entry.quantity <= 1) entry.unitAmount = amount;
    }
  } else if (field === 'quantity') {
    const quantity = parseLooseAmount(value) || 1;
    entry.quantity = quantity;
  } else if (field === 'paymentMethod') {
    entry.paymentMethod = value || 'gotówka';
  } else if (field === 'description') {
    entry.description = value.trim();
  } else if (field === 'tags') {
    entry.tags = normalizeTags(value);
  } else if (field === 'originalText') {
    entry.originalText = value;
  }

  entry.updatedAt = new Date().toISOString();
  updateParseSummary();
}

function collectParsedDraftsFromPreview() {
  const cards = Array.from(el.parsePreview.querySelectorAll('[data-parse-index]'));
  if (!cards.length) return;

  parsedDrafts = cards.map((card, index) => {
    const current = parsedDrafts[index] || {};
    const read = field => card.querySelector(`[data-field="${field}"]`)?.value ?? '';
    const entryDate = read('entryDate');
    const amount = parseLooseAmount(read('amount'));
    const quantity = parseLooseAmount(read('quantity')) || 1;
    const description = read('description').trim();

    if (!isValidDateISO(entryDate)) throw new Error(`Pozycja ${index + 1}: popraw datę.`);
    if (!amount) throw new Error(`Pozycja ${index + 1}: popraw kwotę.`);
    if (!description) throw new Error(`Pozycja ${index + 1}: wpisz opis.`);

    return {
      ...current,
      entryDate,
      weekday: getWeekday(entryDate),
      entryType: read('entryType') === 'przychód' ? 'przychód' : 'wydatek',
      scope: normalizeScope(read('scope')),
      category: read('category') || 'Inne',
      amount,
      unitAmount: current.unitAmount || amount,
      quantity,
      paymentMethod: read('paymentMethod') || 'gotówka',
      description,
      originalText: read('originalText'),
      tags: normalizeTags(read('tags')),
      updatedAt: new Date().toISOString()
    };
  });
}

function renderParsePreview() {
  if (!parsedDrafts.length) {
    el.parsePreview.innerHTML = '<div class="empty-state">Brak rozpoznanych pozycji.</div>';
    el.addParsedButton.disabled = true;
    return;
  }

  const total = summarize(parsedDrafts);
  el.parsePreview.innerHTML = `
    <div class="parse-summary" id="parseSummaryText">
      Rozpoznane pozycje: <b>${parsedDrafts.length}</b> · Bilans: <b>${formatMoney(total.balance)}</b>
    </div>
    ${parsedDrafts.map((entry, index) => {
      const amountClass = entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense';
      return `
        <article class="parse-card parse-card-editable" data-parse-index="${index}">
          <div class="parse-card-header">
            <strong>${index + 1}. Pozycja do zatwierdzenia</strong>
            <span class="${amountClass}">${entry.entryType === 'przychód' ? '+' : '-'}${formatMoney(entry.amount)}</span>
          </div>
          <div class="parse-edit-grid">
            <label>Data
              <input data-field="entryDate" type="date" value="${escapeHtml(entry.entryDate)}">
            </label>
            <label>Typ
              <select data-field="entryType">${optionsHtml(['wydatek', 'przychód'], entry.entryType)}</select>
            </label>
            <label>Rodzaj
              <select data-field="scope">${optionsHtml(SCOPES, normalizeScope(entry.scope))}</select>
            </label>
            <label>Kategoria
              <select data-field="category">${optionsHtml(CATEGORIES, entry.category || 'Inne')}</select>
            </label>
            <label>Kwota łączna
              <input data-field="amount" type="text" inputmode="decimal" value="${escapeHtml(String(entry.amount).replace('.', ','))}">
            </label>
            <label>Ilość
              <input data-field="quantity" type="text" inputmode="decimal" value="${escapeHtml(String(entry.quantity || 1).replace('.', ','))}">
            </label>
            <label>Płatność
              <select data-field="paymentMethod">${optionsHtml(['gotówka', 'karta', 'bank', 'blik', 'inne'], entry.paymentMethod || 'gotówka')}</select>
            </label>
            <label class="wide">Opis
              <input data-field="description" type="text" value="${escapeHtml(entry.description)}">
            </label>
            <label class="wide">Tagi
              <input data-field="tags" type="text" value="${escapeHtml((entry.tags ?? []).join(', '))}">
            </label>
            <label class="wide">Tekst źródłowy
              <textarea data-field="originalText" rows="2">${escapeHtml(entry.originalText || '')}</textarea>
            </label>
          </div>
          <small>${escapeHtml(entry.weekday || '')} · grupa: ${escapeHtml(resolveReportGroup(entry))}${entry.quantity > 1 ? ` · ilość ${escapeHtml(entry.quantity)} · cena ${escapeHtml(formatMoney(entry.unitAmount))}` : ''}</small>
        </article>
      `;
    }).join('')}
  `;
  el.addParsedButton.disabled = false;
}

function handleParseText() {
  try {
    parsedDrafts = parseNaturalText(el.quickText.value);
    renderParsePreview();
    showMessage(`Rozpoznano pozycji: ${parsedDrafts.length}. Sprawdź podgląd i zapisz.`);
  } catch (error) {
    parsedDrafts = [];
    renderParsePreview();
    showMessage(error.message || 'Nie udało się rozpoznać tekstu.', 'error');
  }
}

async function handleAddParsedEntries() {
  if (!parsedDrafts.length) {
    showMessage('Najpierw rozpoznaj tekst.', 'error');
    return;
  }

  collectParsedDraftsFromPreview();
  await ensureDatabaseReady();

  const now = new Date().toISOString();
  const entries = parsedDrafts.map(entry => {
    const cleanEntry = stripLocalId(entry);
    return {
      ...cleanEntry,
      syncId: cleanEntry.syncId || makeSyncId('entry'),
      sourceDeviceId: cleanEntry.sourceDeviceId || getDeviceId(),
      createdAt: cleanEntry.createdAt || now,
      updatedAt: now
    };
  });

  await addManyEntries(entries);
  el.quickText.value = '';
  parsedDrafts = [];
  renderParsePreview();
  await reloadEntries();
  el.quickText.focus();
  showMessage(`Dodano wpisy z parsera: ${entries.length}.`);
  scheduleDropboxAutoSync();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showMessage(text, type = 'success') {
  el.messageBox.textContent = text;
  el.messageBox.classList.toggle('error', type === 'error');
  el.messageBox.classList.remove('hidden');
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => el.messageBox.classList.add('hidden'), 4200);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('entryDate', 'entryDate', { unique: false });
        store.createIndex('entryType', 'entryType', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('paymentMethod', 'paymentMethod', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(TAG_RULE_STORE)) {
        const ruleStore = database.createObjectStore(TAG_RULE_STORE, { keyPath: 'id' });
        ruleStore.createIndex('name', 'name', { unique: false });
        ruleStore.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

async function ensureDatabaseReady() {
  if (db?.transaction) return db;
  if (!('indexedDB' in window)) {
    throw new Error('Ta przeglądarka nie obsługuje IndexedDB. Program nie może zapisać danych.');
  }
  db = await openDatabase();
  return db;
}

function txStore(mode = 'readonly') {
  return db.transaction(STORE, mode).objectStore(STORE);
}


function txNamedStore(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function getAllTagRules() {
  return new Promise((resolve, reject) => {
    const request = txNamedStore(TAG_RULE_STORE).getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = event => reject(event.target.error);
  });
}

function saveTagRule(rule) {
  return new Promise((resolve, reject) => {
    const normalized = normalizeRule(rule);
    if (!normalized.name) {
      reject(new Error('Podaj nazwę grupy.'));
      return;
    }
    if (!normalized.aliases.length) {
      reject(new Error('Podaj przynajmniej jeden wariant nazwy.'));
      return;
    }

    const request = txNamedStore(TAG_RULE_STORE, 'readwrite').put(normalized);
    request.onsuccess = () => resolve(normalized);
    request.onerror = event => reject(event.target.error);
  });
}

function deleteTagRule(id) {
  return new Promise((resolve, reject) => {
    const request = txNamedStore(TAG_RULE_STORE, 'readwrite').delete(id);
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
  });
}

async function seedDefaultTagRules() {
  const existing = await getAllTagRules();
  if (existing.length) {
    tagRules = existing.map(normalizeRule).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    return;
  }

  for (const rule of DEFAULT_TAG_RULES) {
    await saveTagRule(rule);
  }
  tagRules = await getAllTagRules();
  tagRules = tagRules.map(normalizeRule).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

async function reloadTagRules() {
  tagRules = await getAllTagRules();
  tagRules = tagRules.map(normalizeRule).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  renderTagRules();
}

function getAllEntries() {
  return new Promise((resolve, reject) => {
    const request = txStore().getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = event => reject(event.target.error);
  });
}

function saveEntry(entry, options = {}) {
  return new Promise((resolve, reject) => {
    const prepared = prepareEntryForStorage(entry, options);
    const request = txStore('readwrite').put(prepared);
    request.onsuccess = () => resolve(request.result);
    request.onerror = event => reject(event.target.error);
  });
}

function deleteEntry(id) {
  return new Promise((resolve, reject) => {
    const request = txStore('readwrite').delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
  });
}

function getEntryById(id) {
  const numericId = Number(id);
  return allEntries.find(entry => Number(entry.id) === numericId) || null;
}

function isValidDateISO(dateISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateISO ?? ''))) return false;
  const date = new Date(`${dateISO}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateISO;
}

async function moveEntryToDate(id, newDateISO) {
  if (!isValidDateISO(newDateISO)) {
    throw new Error('Podaj poprawną datę w formacie RRRR-MM-DD.');
  }

  const entry = getEntryById(id);
  if (!entry) {
    throw new Error('Nie znaleziono wpisu do przeniesienia.');
  }

  if (entry.entryDate === newDateISO) {
    showMessage('Wpis jest już przypisany do tego dnia.');
    return;
  }

  const updated = enrichEntryWithTagRules({
    ...entry,
    entryDate: newDateISO,
    weekday: getWeekday(newDateISO),
    updatedAt: new Date().toISOString()
  });

  await saveEntry(updated);
  selectedCalendarDate = newDateISO;
  calendarMonth = newDateISO.slice(0, 7);
  calendarYear = Number(newDateISO.slice(0, 4));

  if (el.filterFrom.value && el.filterTo.value && el.filterFrom.value === el.filterTo.value) {
    el.filterFrom.value = newDateISO;
    el.filterTo.value = newDateISO;
  }

  await reloadEntries();
  showMessage(`Wpis przeniesiony na ${newDateISO}.`);
  scheduleDropboxAutoSync();
}

function promptMoveEntry(id) {
  const entry = getEntryById(id);
  if (!entry) return;
  const description = entry.description || entry.category || 'wpis';
  const newDate = window.prompt(`Na jaką datę przenieść wpis: ${description}?`, entry.entryDate);
  if (newDate === null) return;
  moveEntryToDate(id, newDate.trim()).catch(error => showMessage(error.message, 'error'));
}

function clearDropTargets() {
  document.querySelectorAll('.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
  document.querySelectorAll('.dragging-source').forEach(node => node.classList.remove('dragging-source'));
}

function handleEntryDragStart(event) {
  const source = event.target.closest('[data-entry-id]');
  if (!source) return;
  draggedEntryId = source.dataset.entryId;
  source.classList.add('dragging-source');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedEntryId);
}

function handleEntryDragEnd() {
  draggedEntryId = null;
  clearDropTargets();
}

function handleCalendarDragOver(event) {
  const dayButton = event.target.closest('button[data-date]');
  if (!dayButton || !draggedEntryId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  clearDropTargets();
  dayButton.classList.add('is-drop-target');
}

function handleCalendarDrop(event) {
  const dayButton = event.target.closest('button[data-date]');
  if (!dayButton) return;
  const entryId = event.dataTransfer.getData('text/plain') || draggedEntryId;
  if (!entryId) return;
  event.preventDefault();
  clearDropTargets();
  moveEntryToDate(entryId, dayButton.dataset.date).catch(error => showMessage(error.message, 'error'));
}

function clearEntries() {
  return new Promise((resolve, reject) => {
    const request = txStore('readwrite').clear();
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
  });
}

async function addManyEntries(entries) {
  const database = await ensureDatabaseReady();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    entries.forEach(entry => store.put(prepareEntryForStorage(entry, { forceNewId: true })));
    transaction.oncomplete = () => resolve();
    transaction.onerror = event => reject(event.target.error);
  });
}

function fillSelect(select, values, includeEmpty = false) {
  const empty = includeEmpty ? '<option value="">Wszystko</option>' : '';
  select.innerHTML = empty + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}

function resetForm() {
  editingId = null;
  el.formTitle.textContent = 'Dodaj wpis';
  el.saveButton.textContent = 'Dodaj wpis';
  el.cancelEditButton.classList.add('hidden');
  el.entryForm.reset();
  el.entryDate.value = todayISO();
  el.entryType.value = 'wydatek';
  el.entryScope.value = 'nieokreślone';
  el.category.value = 'Inne';
  el.paymentMethod.value = 'gotówka';
}

async function reloadEntries() {
  allEntries = await getAllEntries();
  allEntries.sort((a, b) => {
    if (a.entryDate !== b.entryDate) return b.entryDate.localeCompare(a.entryDate);
    return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  });
  applyFilters();
}

function makeEntryFromForm() {
  const now = new Date().toISOString();
  const entryDate = el.entryDate.value || todayISO();
  const existing = editingId ? allEntries.find(entry => entry.id === editingId) : null;

  return enrichEntryWithTagRules({
    ...(existing ?? {}),
    id: editingId ?? existing?.id,
    entryDate,
    weekday: getWeekday(entryDate),
    entryType: el.entryType.value,
    scope: el.entryScope.value,
    category: el.category.value,
    amount: parseAmount(el.amount.value),
    paymentMethod: el.paymentMethod.value,
    description: el.description.value.trim(),
    originalText: el.originalText.value.trim(),
    tags: normalizeTags(el.tags.value),
    syncId: existing?.syncId || makeSyncId('entry'),
    sourceDeviceId: existing?.sourceDeviceId || getDeviceId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  });
}

function summarize(entries) {
  return entries.reduce((acc, entry) => {
    if (entry.entryType === 'przychód') {
      acc.income += Number(entry.amount) || 0;
    } else {
      acc.expense += Number(entry.amount) || 0;
    }
    acc.balance = acc.income - acc.expense;
    return acc;
  }, { income: 0, expense: 0, balance: 0 });
}

const MAIN_REPORT_INSTALL_CATEGORIES = ['Montaże', 'Antenowe', 'Monitoring', 'Usługi'];
const MAIN_REPORT_FIRM_EXPENSE_CATEGORIES = [
  'Komputerowe',
  'Antenowe',
  'Montaże',
  'Monitoring',
  'Paliwo',
  'Mechanik',
  'Usługi',
  'Bank',
  'Hurtownia',
  'Podatki/ZUS'
];

function isHomeExpense(entry) {
  const scope = normalizeScope(entry.scope);
  if (entry.entryType !== 'wydatek') return false;
  if (scope === 'domowe') return true;
  if (scope === 'firmowe') return false;
  return ['Dom', 'Jedzenie'].includes(entry.category);
}

function isFirmEntry(entry) {
  const scope = normalizeScope(entry.scope);
  if (scope === 'domowe') return false;
  if (scope === 'firmowe') return true;
  if (entry.entryType === 'przychód') return true;
  return MAIN_REPORT_FIRM_EXPENSE_CATEGORIES.includes(entry.category);
}

function isComputerReportEntry(entry) {
  return !isHomeExpense(entry) && entry.category === 'Komputerowe';
}

function isInstallationReportEntry(entry) {
  return !isHomeExpense(entry) && MAIN_REPORT_INSTALL_CATEGORIES.includes(entry.category);
}

function summarizeMainReport(entries) {
  const computers = summarize(entries.filter(isComputerReportEntry));
  const installations = summarize(entries.filter(isInstallationReportEntry));
  const company = summarize(entries.filter(isFirmEntry));
  const homeExpense = entries
    .filter(isHomeExpense)
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

  return { computers, installations, company, homeExpense };
}

function mainReportRow(title, note, value, extraClass = '') {
  const amountClass = value >= 0 ? 'amount-income' : 'amount-expense';
  return `
    <div class="category-row main-report-row ${extraClass}">
      <div>
        <b>${escapeHtml(title)}</b><br>
        <span>${escapeHtml(note)}</span>
      </div>
      <strong class="${amountClass}">${formatMoney(value)}</strong>
    </div>
  `;
}

function renderMainReport() {
  if (!el.mainReport) return;

  if (!filteredEntries.length) {
    el.mainReport.innerHTML = '<div class="empty-state">Brak danych do raportu głównego.</div>';
    return;
  }

  const report = summarizeMainReport(filteredEntries);

  el.mainReport.innerHTML = [
    mainReportRow(
      'Komputerowe',
      `Przychody ${formatMoney(report.computers.income)} · koszty ${formatMoney(report.computers.expense)}`,
      report.computers.balance
    ),
    mainReportRow(
      'Montaże',
      `Przychody ${formatMoney(report.installations.income)} · koszty ${formatMoney(report.installations.expense)} · obejmuje: Montaże, Antenowe, Monitoring, Usługi`,
      report.installations.balance
    ),
    mainReportRow(
      'Wydatki domowe',
      'Nie są odejmowane od wyniku firmy.',
      -report.homeExpense,
      'home-report-row'
    ),
    mainReportRow(
      'Wynik firmy / wypłata',
      `Przychody firmowe ${formatMoney(report.company.income)} - koszty firmowe ${formatMoney(report.company.expense)}. Wydatki domowe pominięte.`,
      report.company.balance,
      'company-result-row'
    )
  ].join('');
}

function renderSummary() {
  const today = todayISO();
  const currentMonth = monthKey(today);

  const todaySummary = summarize(allEntries.filter(entry => entry.entryDate === today));
  const monthSummary = summarize(allEntries.filter(entry => monthKey(entry.entryDate) === currentMonth));
  const totalSummary = summarize(allEntries);

  el.todayBalance.textContent = formatMoney(todaySummary.balance);
  el.todayDetails.textContent = `Przychody ${formatMoney(todaySummary.income)} · Wydatki ${formatMoney(todaySummary.expense)}`;

  el.monthBalance.textContent = formatMoney(monthSummary.balance);
  el.monthDetails.textContent = `Przychody ${formatMoney(monthSummary.income)} · Wydatki ${formatMoney(monthSummary.expense)}`;

  el.allBalance.textContent = formatMoney(totalSummary.balance);
  el.allDetails.textContent = `Przychody ${formatMoney(totalSummary.income)} · Wydatki ${formatMoney(totalSummary.expense)}`;
}

const CALENDAR_MONTHS_PL = [
  'styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec',
  'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'
];

function splitMonthKey(value) {
  const [year, month] = String(value || todayISO().slice(0, 7)).split('-').map(Number);
  return {
    year: Number.isFinite(year) ? year : Number(todayISO().slice(0, 4)),
    monthIndex: Number.isFinite(month) ? Math.max(0, Math.min(11, month - 1)) : Number(todayISO().slice(5, 7)) - 1
  };
}

function buildMonthKey(year, monthIndex) {
  const date = new Date(year, monthIndex, 1, 12, 0, 0);
  const fixedYear = date.getFullYear();
  const fixedMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${fixedYear}-${fixedMonth}`;
}

function shiftCalendarMonth(offset) {
  const { year, monthIndex } = splitMonthKey(calendarMonth);
  calendarMonth = buildMonthKey(year, monthIndex + offset);
  selectedCalendarDate = '';
  renderCalendar();
}

function entriesForDate(dateISO) {
  return allEntries.filter(entry => entry.entryDate === dateISO);
}

function entriesForYear(year) {
  const prefix = `${year}-`;
  return allEntries.filter(entry => String(entry.entryDate || '').startsWith(prefix));
}

function summarizeDayActivity(entries) {
  const summary = summarize(entries);
  return {
    ...summary,
    count: entries.length,
    activity: summary.income + summary.expense
  };
}

function getHeatLevel(activity, maxActivity) {
  if (!activity || !maxActivity) return 0;
  const ratio = activity / maxActivity;
  if (ratio >= 0.8) return 5;
  if (ratio >= 0.6) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}

function renderCalendarDayDetails(dayEntries) {
  if (!el.calendarDayDetails) return;

  if (!selectedCalendarDate) {
    el.calendarDayDetails.innerHTML = '<div class="empty-state">Wybierz dzień w kalendarzu, żeby zobaczyć szczegóły.</div>';
    return;
  }

  if (!dayEntries.length) {
    el.calendarDayDetails.innerHTML = `<div class="empty-state">${escapeHtml(selectedCalendarDate)} — brak wpisów.</div>`;
    return;
  }

  const summary = summarize(dayEntries);
  el.calendarDayDetails.innerHTML = `
    <div class="calendar-day-summary">
      <strong>${escapeHtml(selectedCalendarDate)}</strong>
      <span>Wpisy: ${dayEntries.length} · Przychody ${formatMoney(summary.income)} · Wydatki ${formatMoney(summary.expense)} · Bilans ${formatMoney(summary.balance)}</span>
    </div>
    <div class="calendar-day-list">
      ${dayEntries.slice(0, 6).map(entry => {
        const sign = entry.entryType === 'przychód' ? '+' : '-';
        const amountClass = entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense';
        return `
          <div class="calendar-day-entry" draggable="true" data-entry-id="${entry.id}" title="Przeciągnij wpis na inny dzień w kalendarzu">
            <span>${escapeHtml(entry.description || entry.category || 'Wpis')}<br><small>${escapeHtml(formatScope(entry.scope))} · ${escapeHtml(entry.category)}</small></span>
            <strong class="${amountClass}">${sign}${formatMoney(entry.amount)}</strong>
            <div class="calendar-entry-actions">
              <button class="secondary" type="button" data-action="edit" data-id="${entry.id}">Edytuj</button>
              <button class="ghost" type="button" data-action="move" data-id="${entry.id}">Przenieś</button>
            </div>
          </div>
        `;
      }).join('')}
      ${dayEntries.length > 6 ? `<small>Pokazano 6 z ${dayEntries.length} wpisów. Pełna lista jest niżej w historii.</small>` : ''}
    </div>
  `;
}

function renderCalendar() {
  if (!el.calendarGrid) return;

  const today = todayISO();
  const { year, monthIndex } = splitMonthKey(calendarMonth);
  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const monthPrefix = buildMonthKey(year, monthIndex);
  const monthEntries = allEntries.filter(entry => entry.entryDate?.startsWith(monthPrefix));
  const monthSummary = summarize(monthEntries);

  el.calendarMonthLabel.textContent = `${CALENDAR_MONTHS_PL[monthIndex]} ${year}`;
  el.calendarMonthSummary.textContent = `Wpisy: ${monthEntries.length} · Przychody ${formatMoney(monthSummary.income)} · Wydatki ${formatMoney(monthSummary.expense)} · Bilans ${formatMoney(monthSummary.balance)}`;

  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push('<div class="calendar-day is-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateISO = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const dayEntries = entriesForDate(dateISO);
    const daySummary = summarize(dayEntries);
    const hasEntries = dayEntries.length > 0;
    const isToday = dateISO === today;
    const isSelected = dateISO === selectedCalendarDate;
    const balanceClass = daySummary.balance >= 0 ? 'amount-income' : 'amount-expense';
    const classes = [
      'calendar-day',
      hasEntries ? 'has-entries' : '',
      isToday ? 'is-today' : '',
      isSelected ? 'is-selected' : ''
    ].filter(Boolean).join(' ');

    cells.push(`
      <button class="${classes}" type="button" data-date="${dateISO}" title="Kliknij, aby filtrować. Upuść tutaj wpis, aby zmienić jego datę.">
        <span class="calendar-day-number">${day}</span>
        ${hasEntries ? `
          <span class="calendar-day-count">${dayEntries.length} wpis${dayEntries.length === 1 ? '' : 'y'}</span>
          <strong class="${balanceClass}">${formatMoney(daySummary.balance)}</strong>
        ` : '<span class="calendar-day-empty">—</span>'}
      </button>
    `);
  }

  el.calendarGrid.innerHTML = cells.join('');
  renderCalendarDayDetails(selectedCalendarDate ? entriesForDate(selectedCalendarDate) : []);
}

function renderYearCalendar() {
  if (!el.yearCalendarGrid) return;

  const year = Number(calendarYear) || Number(todayISO().slice(0, 4));
  const today = todayISO();
  const yearEntries = entriesForYear(year);
  const yearSummary = summarize(yearEntries);
  const entriesByDate = new Map();
  const activityByDate = new Map();

  yearEntries.forEach(entry => {
    const dateKey = entry.entryDate;
    if (!dateKey) return;
    if (!entriesByDate.has(dateKey)) entriesByDate.set(dateKey, []);
    entriesByDate.get(dateKey).push(entry);
  });

  let maxActivity = 0;
  entriesByDate.forEach((items, dateKey) => {
    const dayActivity = summarizeDayActivity(items);
    activityByDate.set(dateKey, dayActivity);
    if (dayActivity.activity > maxActivity) maxActivity = dayActivity.activity;
  });

  el.yearCalendarLabel.textContent = `Rok ${year}`;
  el.yearCalendarSummary.textContent = `Wpisy: ${yearEntries.length} · Przychody ${formatMoney(yearSummary.income)} · Wydatki ${formatMoney(yearSummary.expense)} · Bilans ${formatMoney(yearSummary.balance)}`;

  const monthsHtml = CALENDAR_MONTHS_PL.map((monthName, monthIndex) => {
    const monthPrefix = buildMonthKey(year, monthIndex);
    const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const monthEntries = yearEntries.filter(entry => entry.entryDate?.startsWith(monthPrefix));
    const monthSummary = summarize(monthEntries);
    const monthBalanceClass = monthSummary.balance >= 0 ? 'amount-income' : 'amount-expense';

    const dayCells = [];
    for (let i = 0; i < leadingBlanks; i += 1) {
      dayCells.push('<span class="year-day is-empty" aria-hidden="true"></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateISO = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const dayData = activityByDate.get(dateISO) || { income: 0, expense: 0, balance: 0, count: 0, activity: 0 };
      const heatLevel = getHeatLevel(dayData.activity, maxActivity);
      const isToday = dateISO === today;
      const isSelected = dateISO === selectedCalendarDate;
      const title = `${dateISO}\nWpisy: ${dayData.count}\nPrzychody: ${formatMoney(dayData.income)}\nWydatki: ${formatMoney(dayData.expense)}\nBilans: ${formatMoney(dayData.balance)}`;
      const classes = [
        'year-day',
        `heat-level-${heatLevel}`,
        dayData.count ? 'has-entries' : '',
        isToday ? 'is-today' : '',
        isSelected ? 'is-selected' : ''
      ].filter(Boolean).join(' ');

      dayCells.push(`<button class="${classes}" type="button" data-date="${dateISO}" title="${escapeHtml(title)}"><span>${day}</span></button>`);
    }

    return `
      <article class="year-month-card">
        <div class="year-month-head">
          <strong>${escapeHtml(monthName)}</strong>
          <span class="${monthBalanceClass}">${formatMoney(monthSummary.balance)}</span>
        </div>
        <small>Wpisy: ${monthEntries.length} · Obrót ${formatMoney(monthSummary.income + monthSummary.expense)}</small>
        <div class="mini-weekdays" aria-hidden="true"><span>P</span><span>W</span><span>Ś</span><span>C</span><span>P</span><span>S</span><span>N</span></div>
        <div class="year-month-days">${dayCells.join('')}</div>
      </article>
    `;
  }).join('');

  el.yearCalendarGrid.innerHTML = monthsHtml;
  renderYearTopDays(activityByDate);
}

function renderYearTopDays(activityByDate) {
  if (!el.yearTopDays) return;

  const rows = Array.from(activityByDate.entries())
    .map(([dateISO, data]) => ({ dateISO, ...data }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 8);

  if (!rows.length) {
    el.yearTopDays.innerHTML = '<div class="empty-state">Brak wpisów w wybranym roku.</div>';
    return;
  }

  el.yearTopDays.innerHTML = `
    <div class="year-top-title">Największy obrót w roku</div>
    <div class="year-top-list">
      ${rows.map(row => `
        <button class="year-top-row" type="button" data-date="${row.dateISO}">
          <span><strong>${escapeHtml(row.dateISO)}</strong><br><small>${row.count} wpis${row.count === 1 ? '' : 'ów'}</small></span>
          <span>Obrót ${formatMoney(row.activity)}<br><small>Bilans ${formatMoney(row.balance)}</small></span>
        </button>
      `).join('')}
    </div>
  `;
}

function shiftCalendarYear(offset) {
  calendarYear = (Number(calendarYear) || Number(todayISO().slice(0, 4))) + offset;
  selectedCalendarDate = '';
  renderYearCalendar();
}

function selectCalendarDate(dateISO) {
  selectedCalendarDate = dateISO;
  calendarMonth = dateISO.slice(0, 7);
  calendarYear = Number(dateISO.slice(0, 4));
  el.filterFrom.value = dateISO;
  el.filterTo.value = dateISO;
  applyFilters();
  showMessage(`Pokazuję wpisy z dnia ${dateISO}.`);
}

function getCurrentFilters() {
  return {
    query: el.searchQuery.value.trim().toLowerCase(),
    from: el.filterFrom.value,
    to: el.filterTo.value,
    type: el.filterType.value,
    scope: el.filterScope.value,
    category: el.filterCategory.value,
    payment: el.filterPayment.value
  };
}

function entryMatchesFilters(entry, filters) {
  if (filters.from && entry.entryDate < filters.from) return false;
  if (filters.to && entry.entryDate > filters.to) return false;
  if (filters.type && entry.entryType !== filters.type) return false;
  if (filters.scope && normalizeScope(entry.scope) !== filters.scope) return false;
  if (filters.category && entry.category !== filters.category) return false;
  if (filters.payment && entry.paymentMethod !== filters.payment) return false;

  if (filters.query) {
    const searchable = [
      entry.entryDate,
      entry.weekday,
      entry.entryType,
      formatScope(entry.scope),
      entry.category,
      entry.description,
      entry.originalText,
      entry.paymentMethod,
      ...(entry.tags ?? [])
    ].join(' ').toLowerCase();

    if (!searchable.includes(filters.query)) return false;
  }

  return true;
}

function applyFilters() {
  const filters = getCurrentFilters();
  filteredEntries = allEntries.filter(entry => entryMatchesFilters(entry, filters));
  renderSummary();
  renderCalendar();
  renderYearCalendar();
  renderMainReport();
  renderCategoryReport();
  renderItemReport();
  renderEntries();
}

function renderCategoryReport() {
  if (!filteredEntries.length) {
    el.categoryReport.innerHTML = '<div class="empty-state">Brak danych do raportu.</div>';
    return;
  }

  const rows = new Map();
  filteredEntries.forEach(entry => {
    if (!rows.has(entry.category)) {
      rows.set(entry.category, { category: entry.category, income: 0, expense: 0 });
    }
    const row = rows.get(entry.category);
    if (entry.entryType === 'przychód') row.income += Number(entry.amount) || 0;
    else row.expense += Number(entry.amount) || 0;
  });

  const sorted = Array.from(rows.values()).sort((a, b) => (b.income - b.expense) - (a.income - a.expense));

  el.categoryReport.innerHTML = sorted.map(row => {
    const balance = row.income - row.expense;
    return `
      <div class="category-row">
        <div>
          <b>${escapeHtml(row.category)}</b><br>
          <span>Przychody ${formatMoney(row.income)} · Wydatki ${formatMoney(row.expense)}</span>
        </div>
        <strong class="${balance >= 0 ? 'amount-income' : 'amount-expense'}">${formatMoney(balance)}</strong>
      </div>
    `;
  }).join('');
}


function renderItemReport() {
  if (!el.itemReport) return;

  if (!filteredEntries.length) {
    el.itemReport.innerHTML = '<div class="empty-state">Brak danych do grupowania.</div>';
    return;
  }

  const rows = new Map();
  filteredEntries.forEach(entry => {
    const group = resolveReportGroup(entry);
    if (!rows.has(group)) {
      rows.set(group, { group, count: 0, income: 0, expense: 0, category: entry.category || 'Inne' });
    }
    const row = rows.get(group);
    row.count += 1;
    if (entry.entryType === 'przychód') row.income += Number(entry.amount) || 0;
    else row.expense += Number(entry.amount) || 0;
  });

  const sorted = Array.from(rows.values())
    .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
    .slice(0, 12);

  el.itemReport.innerHTML = sorted.map(row => {
    const balance = row.income - row.expense;
    return `
      <div class="category-row compact-row">
        <div>
          <b>${escapeHtml(row.group)}</b><br>
          <span>${escapeHtml(row.category)} · wpisy: ${row.count} · przychody ${formatMoney(row.income)} · wydatki ${formatMoney(row.expense)}</span>
        </div>
        <strong class="${balance >= 0 ? 'amount-income' : 'amount-expense'}">${formatMoney(balance)}</strong>
      </div>
    `;
  }).join('');
}

function renderTagRules() {
  if (!el.tagRulesList) return;

  if (!tagRules.length) {
    el.tagRulesList.innerHTML = '<div class="empty-state">Brak reguł tagów.</div>';
    return;
  }

  el.tagRulesList.innerHTML = tagRules.map(rule => `
    <article class="tag-rule-card">
      <div>
        <strong>${escapeHtml(rule.name)}</strong>
        <small>${escapeHtml(rule.category)}${rule.entryType ? ` · ${escapeHtml(rule.entryType)}` : ''}${rule.system ? ' · domyślna' : ''}</small>
        <div class="tag-list">${rule.aliases.map(alias => `<span class="tag">${escapeHtml(alias)}</span>`).join('')}</div>
      </div>
      <div class="row-actions">
        <button class="secondary" type="button" data-rule-action="edit" data-id="${escapeHtml(rule.id)}">Edytuj</button>
        <button class="danger" type="button" data-rule-action="delete" data-id="${escapeHtml(rule.id)}">Usuń</button>
      </div>
    </article>
  `).join('');
}

function editTagRule(id) {
  const rule = tagRules.find(item => item.id === id);
  if (!rule) return;
  el.tagGroupName.value = rule.name;
  el.tagAliases.value = rule.aliases.join(', ');
  el.tagRuleCategory.value = rule.category;
  el.tagRuleType.value = rule.entryType || '';
  el.tagRuleForm.dataset.editingId = rule.id;
  el.tagGroupName.focus();
}

async function handleTagRuleSubmit(event) {
  event.preventDefault();
  const editingId = el.tagRuleForm.dataset.editingId;
  const existing = editingId ? tagRules.find(rule => rule.id === editingId) : null;
  const rule = {
    ...(existing ?? {}),
    id: editingId || ruleIdFromName(el.tagGroupName.value),
    name: el.tagGroupName.value,
    aliases: el.tagAliases.value,
    category: el.tagRuleCategory.value,
    entryType: el.tagRuleType.value,
    system: existing?.system ?? false
  };

  await saveTagRule(rule);
  el.tagRuleForm.reset();
  delete el.tagRuleForm.dataset.editingId;
  el.tagRuleCategory.value = 'Inne';
  el.tagRuleType.value = '';
  await reloadTagRules();
  applyFilters();
  showMessage('Reguła tagów zapisana.');
}

async function handleTagRuleDelete(id) {
  const rule = tagRules.find(item => item.id === id);
  if (!rule) return;
  if (!window.confirm(`Usunąć regułę: ${rule.name}? Wpisy nie zostaną usunięte.`)) return;
  await deleteTagRule(id);
  await reloadTagRules();
  applyFilters();
  showMessage('Reguła tagów usunięta.');
}

function handleTagRulesClick(event) {
  const button = event.target.closest('button[data-rule-action]');
  if (!button) return;
  const { ruleAction, id } = button.dataset;
  if (ruleAction === 'edit') editTagRule(id);
  if (ruleAction === 'delete') handleTagRuleDelete(id).catch(error => showMessage(error.message, 'error'));
}

function tagsHtml(tags) {
  if (!tags?.length) return '—';
  return `<div class="tag-list">${tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div>`;
}

function renderEntries() {
  el.entriesCounter.textContent = filteredEntries.length
    ? `Widoczne wpisy: ${filteredEntries.length} z ${allEntries.length}`
    : allEntries.length ? 'Brak wpisów dla wybranych filtrów.' : 'Brak wpisów.';

  if (!filteredEntries.length) {
    el.entriesTableBody.innerHTML = '<tr><td colspan="10" class="empty-state">Brak wpisów.</td></tr>';
    el.mobileEntries.innerHTML = '<div class="empty-state">Brak wpisów.</div>';
    return;
  }

  el.entriesTableBody.innerHTML = filteredEntries.map(entry => {
    const amountClass = entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense';
    const sign = entry.entryType === 'przychód' ? '+' : '-';

    return `
      <tr draggable="true" data-entry-id="${entry.id}" title="Przeciągnij na dzień w kalendarzu, aby zmienić datę">
        <td>${escapeHtml(entry.entryDate)}</td>
        <td>${escapeHtml(entry.weekday)}</td>
        <td>${escapeHtml(entry.entryType)}</td>
        <td>${escapeHtml(formatScope(entry.scope))}</td>
        <td>${escapeHtml(entry.category)}</td>
        <td>${escapeHtml(entry.description || '—')}<br><small>Grupa: ${escapeHtml(resolveReportGroup(entry))}${entry.originalText ? ' · ' + escapeHtml(entry.originalText) : ''}</small></td>
        <td>${tagsHtml(entry.tags)}</td>
        <td class="${amountClass}">${sign}${formatMoney(entry.amount)}</td>
        <td>${escapeHtml(entry.paymentMethod)}</td>
        <td>
          <div class="row-actions">
            <button class="secondary" type="button" data-action="edit" data-id="${entry.id}">Edytuj</button>
            <button class="ghost" type="button" data-action="move" data-id="${entry.id}">Przenieś</button>
            <button class="danger" type="button" data-action="delete" data-id="${entry.id}">Usuń</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  el.mobileEntries.innerHTML = filteredEntries.map(entry => {
    const amountClass = entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense';
    const sign = entry.entryType === 'przychód' ? '+' : '-';

    return `
      <article class="entry-card" draggable="true" data-entry-id="${entry.id}" title="Przeciągnij na dzień w kalendarzu, aby zmienić datę">
        <div class="entry-card-head">
          <div>
            <strong>${escapeHtml(entry.category)}</strong><br>
            <small>${escapeHtml(entry.entryDate)} · ${escapeHtml(entry.weekday)} · ${escapeHtml(formatScope(entry.scope))} · ${escapeHtml(entry.paymentMethod)}</small>
          </div>
          <strong class="${amountClass}">${sign}${formatMoney(entry.amount)}</strong>
        </div>
        <div>${escapeHtml(entry.description || '—')}</div>
        <small>Grupa: ${escapeHtml(resolveReportGroup(entry))}</small>
        <div>${tagsHtml(entry.tags)}</div>
        <div class="row-actions">
          <button class="secondary" type="button" data-action="edit" data-id="${entry.id}">Edytuj</button>
          <button class="ghost" type="button" data-action="move" data-id="${entry.id}">Przenieś</button>
          <button class="danger" type="button" data-action="delete" data-id="${entry.id}">Usuń</button>
        </div>
      </article>
    `;
  }).join('');
}

function startEdit(id) {
  const entry = allEntries.find(item => item.id === Number(id));
  if (!entry) return;

  editingId = entry.id;
  el.formTitle.textContent = 'Edytuj wpis';
  el.saveButton.textContent = 'Zapisz zmiany';
  el.cancelEditButton.classList.remove('hidden');

  el.entryDate.value = entry.entryDate;
  el.entryType.value = entry.entryType;
  el.entryScope.value = normalizeScope(entry.scope);
  el.category.value = entry.category;
  el.amount.value = String(entry.amount).replace('.', ',');
  el.paymentMethod.value = entry.paymentMethod;
  el.description.value = entry.description ?? '';
  el.originalText.value = entry.originalText ?? '';
  el.tags.value = (entry.tags ?? []).join(', ');

  const startTab = document.querySelector('[data-tab="start"]');
  if (startTab) startTab.click();
  const manualDetails = document.querySelector('.compact-manual-panel details');
  if (manualDetails) manualDetails.open = true;
  el.entryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleDelete(id) {
  const entry = allEntries.find(item => item.id === Number(id));
  const label = entry?.description || entry?.category || 'ten wpis';
  if (!window.confirm(`Usunąć wpis: ${label}?`)) return;

  await deleteEntry(id);
  if (editingId === Number(id)) resetForm();
  await reloadEntries();
  showMessage('Wpis usunięty.');
  scheduleDropboxAutoSync();
}

function handleEntriesClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === 'edit') startEdit(id);
  if (action === 'move') promptMoveEntry(id);
  if (action === 'delete') handleDelete(id).catch(error => showMessage(error.message, 'error'));
}

async function handleFormSubmit(event) {
  event.preventDefault();

  try {
    const entry = makeEntryFromForm();
    await saveEntry(entry);
    showMessage(editingId ? 'Zmiany zapisane.' : 'Wpis dodany.');
    resetForm();
    await reloadEntries();
    scheduleDropboxAutoSync();
  } catch (error) {
    showMessage(error.message || 'Nie udało się zapisać wpisu.', 'error');
  }
}


function entrySignature(entry) {
  return [
    entry.entryDate,
    entry.entryType,
    normalizeScope(entry.scope),
    entry.category,
    Number(entry.amount || 0).toFixed(2),
    normalizeText(entry.description || ''),
    normalizeText(entry.originalText || ''),
    entry.createdAt || ''
  ].join('|');
}

function pickImportedField(item, names, fallback = '') {
  for (const name of names) {
    if (item?.[name] !== undefined && item?.[name] !== null && item?.[name] !== '') {
      return item[name];
    }
  }
  return fallback;
}

function normalizeImportedEntryType(value, amountValue = null) {
  const normalized = normalizeText(value);
  if (normalized) {
    if (['przychod', 'przychody', 'income', 'in', 'plus', 'zarobek', 'wplyw', 'wplata'].includes(normalized)) return 'przychód';
    if (['wydatek', 'wydatki', 'expense', 'out', 'minus', 'koszt', 'koszty'].includes(normalized)) return 'wydatek';
    if (normalized.includes('przych') || normalized.includes('zarob') || normalized.includes('wplyw')) return 'przychód';
    if (normalized.includes('wydat') || normalized.includes('koszt') || normalized.includes('zakup')) return 'wydatek';
  }

  const rawAmount = String(amountValue ?? '').trim();
  if (rawAmount.startsWith('-')) return 'wydatek';
  return 'wydatek';
}

function normalizeImportedDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return todayISO();

  const iso = raw.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const european = raw.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2}|\d{2})\b/);
  if (european) {
    let [, day, month, year] = european;
    if (year.length === 2) year = `20${year}`;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return parseDateFromText(raw);
}

function normalizeImportedCategory(value, fallbackText = '') {
  const raw = String(value ?? '').trim();
  if (CATEGORIES.includes(raw)) return raw;

  const normalized = normalizeText(raw);
  const aliases = {
    komputery: 'Komputerowe',
    komputer: 'Komputerowe',
    komputerowe: 'Komputerowe',
    montaz: 'Montaże',
    montaze: 'Montaże',
    montazowe: 'Montaże',
    uslugi: 'Usługi',
    usluga: 'Usługi',
    antenowe: 'Antenowe',
    antena: 'Antenowe',
    monitoring: 'Monitoring',
    kamery: 'Monitoring',
    kamera: 'Monitoring',
    paliwo: 'Paliwo',
    mechanik: 'Mechanik',
    jedzenie: 'Jedzenie',
    dom: 'Dom',
    domowe: 'Dom',
    'wydatki domowe': 'Dom',
    bank: 'Bank',
    hurtownia: 'Hurtownia',
    zus: 'Podatki/ZUS',
    podatki: 'Podatki/ZUS',
    inne: 'Inne'
  };

  if (aliases[normalized]) return aliases[normalized];
  return detectCategory(`${raw} ${fallbackText}`);
}

function collectImportedEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const directKeys = ['entries', 'items', 'data', 'records', 'rows', 'transactions', 'wpisy', 'lista'];
  for (const key of directKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  for (const key of directKeys) {
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = collectImportedEntries(payload[key]);
      if (nested.length) return nested;
    }
  }

  const firstArray = Object.values(payload).find(value => Array.isArray(value) && value.some(item => item && typeof item === 'object'));
  return firstArray || [];
}

function normalizeImportedEntry(item, now = new Date().toISOString()) {
  const amountSource = pickImportedField(item, ['amount', 'kwota', 'value', 'wartosc', 'suma', 'total', 'price', 'cena'], 0);
  const amount = parseLooseAmount(amountSource) || 0;
  const typeSource = pickImportedField(item, ['entryType', 'entry_type', 'type', 'typ', 'rodzajWpisu', 'rodzaj_wpisu'], '');
  const entryType = normalizeImportedEntryType(typeSource, amountSource);
  const description = String(pickImportedField(item, ['description', 'opis', 'name', 'nazwa', 'title', 'tytul', 'text', 'tekst'], '')).trim();
  const originalText = String(pickImportedField(item, ['originalText', 'original_text', 'sourceText', 'source_text', 'tekstZrodlowy', 'tekst_źródłowy'], description)).trim();
  const category = normalizeImportedCategory(pickImportedField(item, ['category', 'kategoria'], ''), `${description} ${originalText}`);
  const explicitScope = pickImportedField(item, ['scope', 'entryScope', 'entry_scope', 'rodzaj', 'context', 'kontekst'], '');
  const scope = normalizeScope(explicitScope) !== 'nieokreślone'
    ? normalizeScope(explicitScope)
    : detectScope(`${description} ${originalText} ${category}`, entryType, category);
  const entryDate = normalizeImportedDate(pickImportedField(item, ['entryDate', 'entry_date', 'date', 'data', 'createdDate', 'created_date'], ''));
  const legacyId = item.id && Number.isFinite(Number(item.id)) ? Number(item.id) : '';
  const legacySyncId = item.syncId || item.sync_id || item.uuid || '';
  const syncId = legacySyncId || `legacy-${legacyId || entrySignature({
    entryDate,
    entryType,
    scope,
    category,
    amount,
    description,
    originalText,
    createdAt: item.createdAt || item.created_at || ''
  })}`;

  return enrichEntryWithTagRules({
    id: item.id && Number.isFinite(Number(item.id)) ? Number(item.id) : undefined,
    syncId,
    sourceDeviceId: item.sourceDeviceId || item.source_device_id || 'import',
    entryDate,
    weekday: item.weekday || getWeekday(entryDate),
    entryType,
    scope,
    category,
    amount,
    paymentMethod: item.paymentMethod || item.payment_method || item.platnosc || item.płatność || 'gotówka',
    description,
    originalText,
    tags: Array.isArray(item.tags) ? item.tags : normalizeTags(item.tags || item.tagi || ''),
    reportGroup: item.reportGroup || item.report_group || item.grupaRaportowa || item.grupa_raportowa || '',
    createdAt: item.createdAt || item.created_at || now,
    updatedAt: item.updatedAt || item.updated_at || now
  });
}

async function ensureEntrySyncIds() {
  const entries = await getAllEntries();
  const missing = entries.filter(entry => !entry.syncId || !entry.sourceDeviceId);
  if (!missing.length) return;
  for (const entry of missing) {
    await saveEntry({
      ...entry,
      syncId: entry.syncId || makeSyncId('entry'),
      sourceDeviceId: entry.sourceDeviceId || getDeviceId(),
      updatedAt: entry.updatedAt || new Date().toISOString()
    });
  }
}


function getStorageMode() {
  try { return localStorage.getItem(STORAGE_MODE_KEY) || ''; } catch (_) { return ''; }
}

function setStorageMode(mode) {
  const safeMode = mode === 'dropbox' ? 'dropbox' : 'local';
  try { localStorage.setItem(STORAGE_MODE_KEY, safeMode); } catch (_) {}
  updateCloudUi();
}

function getDropboxConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(DROPBOX_CONFIG_KEY) || '{}');
    return {
      appKey: String(saved.appKey || '').trim(),
      path: String(saved.path || '/Apps/Bilans/bilans_dane.json').trim() || '/Apps/Bilans/bilans_dane.json'
    };
  } catch (_) {
    return { appKey: '', path: '/Apps/Bilans/bilans_dane.json' };
  }
}

function saveDropboxConfig() {
  const config = {
    appKey: String(el.dropboxAppKeyInput?.value || '').trim(),
    path: String(el.dropboxFilePathInput?.value || '/Apps/Bilans/bilans_dane.json').trim() || '/Apps/Bilans/bilans_dane.json'
  };
  if (!config.path.startsWith('/')) config.path = `/${config.path}`;
  try { localStorage.setItem(DROPBOX_CONFIG_KEY, JSON.stringify(config)); } catch (_) {}
  return config;
}

function getDropboxTokenData() {
  try { return JSON.parse(localStorage.getItem(DROPBOX_TOKEN_KEY) || 'null'); } catch (_) { return null; }
}

function saveDropboxTokenData(data) {
  const expiresIn = Number(data.expires_in || 14400);
  const normalized = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || getDropboxTokenData()?.refresh_token || '',
    expires_at: Date.now() + Math.max(60, expiresIn - 60) * 1000
  };
  try { localStorage.setItem(DROPBOX_TOKEN_KEY, JSON.stringify(normalized)); } catch (_) {}
  return normalized;
}

function hasDropboxConnection() {
  const token = getDropboxTokenData();
  return Boolean(token?.access_token || token?.refresh_token);
}

function updateCloudUi(statusText = '') {
  const mode = getStorageMode() || 'local';
  const config = getDropboxConfig();
  if (el.storageModeSelect) el.storageModeSelect.value = mode;
  if (el.dropboxAppKeyInput && !el.dropboxAppKeyInput.value) el.dropboxAppKeyInput.value = config.appKey;
  if (el.dropboxFilePathInput && !el.dropboxFilePathInput.value) el.dropboxFilePathInput.value = config.path;
  if (el.cloudStatus) {
    if (statusText) el.cloudStatus.textContent = statusText;
    else if (mode === 'dropbox') {
      el.cloudStatus.textContent = hasDropboxConnection()
        ? `Dropbox połączony. Plik danych: ${config.path}`
        : 'Tryb Dropbox wybrany, ale konto nie jest jeszcze połączone.';
    } else {
      el.cloudStatus.textContent = 'Tryb lokalny. Dane są zapisane tylko w tej przeglądarce.';
    }
  }
}

function makeDropboxRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function randomVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function startDropboxAuth() {
  setStorageMode('dropbox');
  const config = saveDropboxConfig();
  if (!config.appKey) {
    showMessage('Najpierw wklej Dropbox App key w zakładce Synchronizacja.', 'error');
    return;
  }
  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    showMessage('Dropbox wymaga uruchomienia przez HTTPS albo localhost.', 'error');
    return;
  }
  const codeVerifier = randomVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomVerifier();
  const pending = { codeVerifier, state, appKey: config.appKey, redirectUri: makeDropboxRedirectUri() };
  localStorage.setItem(DROPBOX_OAUTH_KEY, JSON.stringify(pending));
  const url = new URL('https://www.dropbox.com/oauth2/authorize');
  url.searchParams.set('client_id', config.appKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('token_access_type', 'offline');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('redirect_uri', pending.redirectUri);
  url.searchParams.set('state', state);
  window.location.href = url.toString();
}

async function handleDropboxOAuthReturn() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return;

  let pending = null;
  try { pending = JSON.parse(localStorage.getItem(DROPBOX_OAUTH_KEY) || 'null'); } catch (_) {}
  if (!pending?.codeVerifier || pending.state !== state) {
    showMessage('Nie udało się potwierdzić logowania Dropbox. Spróbuj ponownie.', 'error');
    return;
  }

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: pending.appKey,
    redirect_uri: pending.redirectUri,
    code_verifier: pending.codeVerifier
  });

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) throw new Error(`Dropbox nie zwrócił tokenu. Kod HTTP: ${response.status}.`);
  const tokenData = await response.json();
  saveDropboxTokenData(tokenData);
  localStorage.removeItem(DROPBOX_OAUTH_KEY);
  setStorageMode('dropbox');
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  updateCloudUi('Dropbox połączony. Pobieram dane z chmury...');
  await syncDropboxNow();
}

async function getDropboxAccessToken() {
  const token = getDropboxTokenData();
  if (!token) throw new Error('Dropbox nie jest połączony.');
  if (token.access_token && Number(token.expires_at || 0) > Date.now() + 60000) return token.access_token;
  if (!token.refresh_token) throw new Error('Brak refresh tokenu Dropbox. Połącz konto jeszcze raz.');

  const config = getDropboxConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: config.appKey
  });
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) throw new Error(`Dropbox nie odświeżył tokenu. Kod HTTP: ${response.status}.`);
  const tokenData = await response.json();
  return saveDropboxTokenData({ ...tokenData, refresh_token: token.refresh_token }).access_token;
}

function makeExportPayload() {
  return {
    app: 'Bilans PWA',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    syncMode: 'dropbox-merge-safe',
    tagRules,
    entries: allEntries.map(entry => ({
      ...entry,
      syncId: entry.syncId || makeSyncId('entry'),
      sourceDeviceId: entry.sourceDeviceId || getDeviceId()
    }))
  };
}

async function dropboxDownloadPayload() {
  const accessToken = await getDropboxAccessToken();
  const { path } = getDropboxConfig();
  const response = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path })
    }
  });
  if (response.status === 409) return null;
  if (!response.ok) throw new Error(`Nie udało się pobrać pliku z Dropbox. Kod HTTP: ${response.status}.`);
  return response.json();
}

async function dropboxUploadPayload(payload) {
  const accessToken = await getDropboxAccessToken();
  const { path } = getDropboxConfig();
  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path, mode: { '.tag': 'overwrite' }, autorename: false, mute: true, strict_conflict: false })
    },
    body: JSON.stringify(payload, null, 2)
  });
  if (!response.ok) throw new Error(`Nie udało się zapisać pliku w Dropbox. Kod HTTP: ${response.status}.`);
  return response.json();
}

async function importPayload(payload, options = {}) {
  const { replace = false, silent = false } = options;
  const imported = collectImportedEntries(payload);

  if (!Array.isArray(imported)) {
    throw new Error('Plik JSON nie zawiera listy wpisów. Obsługiwane pola: entries, items, data, records, rows, transactions, wpisy, lista.');
  }

  const now = new Date().toISOString();
  const cleaned = imported
    .map(item => normalizeImportedEntry(item, now))
    .filter(item => item.amount > 0 && ['przychód', 'wydatek'].includes(item.entryType));

  if (!cleaned.length) return { added: 0, updated: 0, skipped: 0 };

  if (replace) {
    const confirmReplace = window.confirm('Zastąpić wszystkie lokalne wpisy danymi z importowanego pliku?');
    if (!confirmReplace) return { added: 0, updated: 0, skipped: 0 };
    await clearEntries();
  }

  if (Array.isArray(payload?.tagRules)) {
    for (const rule of payload.tagRules) await saveTagRule(normalizeRule(rule));
    await reloadTagRules();
  }

  const existingBySyncId = new Map(allEntries.filter(entry => entry.syncId).map(entry => [entry.syncId, entry]));
  const existingSignatures = new Set(allEntries.map(entrySignature));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of cleaned) {
    const current = incoming.syncId ? existingBySyncId.get(incoming.syncId) : null;

    if (current && !replace) {
      const incomingTime = Date.parse(incoming.updatedAt || incoming.createdAt || '') || 0;
      const currentTime = Date.parse(current.updatedAt || current.createdAt || '') || 0;
      if (incomingTime > currentTime) {
        await saveEntry({ ...incoming, id: current.id });
        updated += 1;
      } else skipped += 1;
      continue;
    }

    if (!replace && existingSignatures.has(entrySignature(incoming))) {
      skipped += 1;
      continue;
    }

    await saveEntry(replace ? sanitizeEntryKey(incoming) : stripLocalId(incoming));
    added += 1;
  }

  await reloadEntries();
  if (!silent) showMessage(`Import zakończony. Dodano: ${added}, zaktualizowano: ${updated}, pominięto: ${skipped}.`);
  return { added, updated, skipped };
}

let dropboxSyncBusy = false;
let dropboxSyncTimer = null;

function scheduleDropboxAutoSync() {
  if (getStorageMode() !== 'dropbox' || !hasDropboxConnection()) return;
  window.clearTimeout(dropboxSyncTimer);
  dropboxSyncTimer = window.setTimeout(() => syncDropboxNow().catch(error => updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`)), 1200);
}

async function syncDropboxNow() {
  if (getStorageMode() !== 'dropbox') {
    updateCloudUi('Tryb lokalny. Dropbox nie jest używany.');
    return;
  }
  if (!hasDropboxConnection()) {
    updateCloudUi('Tryb Dropbox wybrany, ale konto nie jest jeszcze połączone.');
    return;
  }
  if (dropboxSyncBusy) return;
  dropboxSyncBusy = true;
  try {
    updateCloudUi('Synchronizuję z Dropbox...');
    const remotePayload = await dropboxDownloadPayload();
    if (remotePayload) await importPayload(remotePayload, { replace: false, silent: true });
    await dropboxUploadPayload(makeExportPayload());
    updateCloudUi(`Dropbox zsynchronizowany: ${new Date().toLocaleString('pl-PL')}.`);
  } finally {
    dropboxSyncBusy = false;
  }
}

function disconnectDropbox() {
  if (!window.confirm('Odłączyć Dropbox od tej przeglądarki? Dane lokalne zostaną w programie.')) return;
  localStorage.removeItem(DROPBOX_TOKEN_KEY);
  localStorage.removeItem(DROPBOX_OAUTH_KEY);
  setStorageMode('local');
  updateCloudUi('Dropbox odłączony. Program pracuje lokalnie.');
}

function setupFirstRunMode() {
  const mode = getStorageMode();
  if (!mode && el.startupModePanel) el.startupModePanel.classList.remove('hidden');
}

function exportJson() {
  const payload = makeExportPayload();

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bilans-pwa-backup-${todayISO()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importJson(file, options = {}) {
  const text = await file.text();
  const payload = JSON.parse(text);
  await importPayload(payload, options);
  scheduleDropboxAutoSync();
}

async function handleClearAll() {
  if (!allEntries.length) {
    showMessage('Nie ma danych do usunięcia.');
    return;
  }

  const first = window.confirm('Usunąć wszystkie wpisy z lokalnej bazy tej przeglądarki?');
  if (!first) return;

  const second = window.confirm('To jest operacja nieodwracalna, jeśli nie masz eksportu JSON. Na pewno usunąć?');
  if (!second) return;

  await clearEntries();
  resetForm();
  await reloadEntries();
  showMessage('Wszystkie dane zostały usunięte.');
  scheduleDropboxAutoSync();
}

function isFileProtocol() {
  return window.location.protocol === 'file:';
}

function registerServiceWorker() {
  if (isFileProtocol() || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`, { scope: './' })
    .then(registration => registration.update?.())
    .catch(() => {
      // Aplikacja ma działać także bez service workera, np. przy zwykłym otwarciu pliku lokalnego.
    });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el.installButton.classList.remove('hidden');
  });

  el.installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    el.installButton.classList.add('hidden');
  });
}


function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawText(ctx, text, x, y, options = {}) {
  const { size = 24, weight = 400, color = '#1f2933', align = 'left', baseline = 'top' } = options;
  ctx.font = `${weight} ${size}px system-ui, Segoe UI, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(String(text ?? ''), x, y);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      drawText(ctx, line, x, currentY, options);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) drawText(ctx, line, x, currentY, options);
  return currentY + lineHeight;
}

function makeCalendarCanvas(mode = 'month') {
  const width = mode === 'year' ? 1800 : 1400;
  const height = mode === 'year' ? 2200 : 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fbf8ef';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 32, 32, width - 64, height - 64, 28);
  ctx.fill();

  if (mode === 'year') drawYearCalendarCanvas(ctx, width, height);
  else drawMonthCalendarCanvas(ctx, width, height);
  return canvas;
}

function drawMonthCalendarCanvas(ctx, width, height) {
  const { year, monthIndex } = splitMonthKey(calendarMonth);
  const monthPrefix = buildMonthKey(year, monthIndex);
  const monthEntries = allEntries.filter(entry => entry.entryDate?.startsWith(monthPrefix));
  const monthSummary = summarize(monthEntries);
  const title = `${CALENDAR_MONTHS_PL[monthIndex]} ${year}`;

  drawText(ctx, 'Bilans PWA — kalendarz miesięczny', 70, 70, { size: 30, weight: 800, color: '#7c4d00' });
  drawText(ctx, title, 70, 115, { size: 42, weight: 900 });
  drawText(ctx, `Wpisy: ${monthEntries.length} · Przychody ${formatMoney(monthSummary.income)} · Wydatki ${formatMoney(monthSummary.expense)} · Bilans ${formatMoney(monthSummary.balance)}`, 70, 175, { size: 24, color: '#667085' });

  const weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  const gridX = 70;
  const gridY = 245;
  const gap = 12;
  const cellW = (width - 140 - gap * 6) / 7;
  const cellH = 112;

  weekdays.forEach((day, index) => drawText(ctx, day, gridX + index * (cellW + gap) + cellW / 2, gridY - 38, { size: 22, weight: 800, align: 'center', color: '#667085' }));

  const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();
  const today = todayISO();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const index = leadingBlanks + day - 1;
    const col = index % 7;
    const row = Math.floor(index / 7);
    const x = gridX + col * (cellW + gap);
    const y = gridY + row * (cellH + gap);
    const dateISO = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const dayEntries = entriesForDate(dateISO);
    const daySummary = summarize(dayEntries);
    const hasEntries = dayEntries.length > 0;

    ctx.fillStyle = dateISO === today ? '#fff1c2' : hasEntries ? '#fff8e6' : '#ffffff';
    ctx.strokeStyle = dateISO === selectedCalendarDate ? '#7c4d00' : '#e6ddcc';
    ctx.lineWidth = dateISO === selectedCalendarDate ? 4 : 2;
    drawRoundedRect(ctx, x, y, cellW, cellH, 16);
    ctx.fill();
    ctx.stroke();

    drawText(ctx, day, x + 16, y + 14, { size: 28, weight: 900 });
    if (hasEntries) {
      drawText(ctx, `${dayEntries.length} wpis${dayEntries.length === 1 ? '' : 'y'}`, x + 16, y + 50, { size: 18, color: '#667085' });
      drawText(ctx, formatMoney(daySummary.balance), x + 16, y + 76, { size: 18, weight: 800, color: daySummary.balance >= 0 ? '#067647' : '#b42318' });
    } else {
      drawText(ctx, '—', x + 16, y + 58, { size: 22, color: '#98a2b3' });
    }
  }

  const generated = `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`;
  drawText(ctx, generated, 70, height - 88, { size: 18, color: '#667085' });
}

function drawYearCalendarCanvas(ctx, width, height) {
  const year = Number(calendarYear) || Number(todayISO().slice(0, 4));
  const yearEntries = entriesForYear(year);
  const yearSummary = summarize(yearEntries);
  const entriesByDate = new Map();

  yearEntries.forEach(entry => {
    if (!entriesByDate.has(entry.entryDate)) entriesByDate.set(entry.entryDate, []);
    entriesByDate.get(entry.entryDate).push(entry);
  });

  let maxActivity = 0;
  const activityByDate = new Map();
  entriesByDate.forEach((items, dateKey) => {
    const data = summarizeDayActivity(items);
    activityByDate.set(dateKey, data);
    if (data.activity > maxActivity) maxActivity = data.activity;
  });

  drawText(ctx, 'Bilans PWA — kalendarz roczny', 70, 70, { size: 30, weight: 800, color: '#7c4d00' });
  drawText(ctx, `Rok ${year}`, 70, 115, { size: 42, weight: 900 });
  drawText(ctx, `Wpisy: ${yearEntries.length} · Przychody ${formatMoney(yearSummary.income)} · Wydatki ${formatMoney(yearSummary.expense)} · Bilans ${formatMoney(yearSummary.balance)}`, 70, 175, { size: 24, color: '#667085' });

  const startX = 70;
  const startY = 255;
  const cardW = (width - 140 - 2 * 28) / 3;
  const cardH = 430;
  const gapX = 28;
  const gapY = 36;
  const heatColors = ['#ffffff', '#fff4cf', '#fedf89', '#fdb022', '#dc6803', '#93370d'];

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const col = monthIndex % 3;
    const row = Math.floor(monthIndex / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);
    const monthPrefix = buildMonthKey(year, monthIndex);
    const monthEntries = yearEntries.filter(entry => entry.entryDate?.startsWith(monthPrefix));
    const monthSummary = summarize(monthEntries);

    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#e6ddcc';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x, y, cardW, cardH, 18);
    ctx.fill();
    ctx.stroke();

    drawText(ctx, CALENDAR_MONTHS_PL[monthIndex], x + 20, y + 18, { size: 26, weight: 900 });
    drawText(ctx, `Wpisy: ${monthEntries.length} · ${formatMoney(monthSummary.balance)}`, x + 20, y + 55, { size: 16, color: monthSummary.balance >= 0 ? '#067647' : '#b42318' });

    const daySize = 38;
    const dayGap = 6;
    const daysStartX = x + 20;
    const daysStartY = y + 100;
    ['P','W','Ś','C','P','S','N'].forEach((label, i) => drawText(ctx, label, daysStartX + i * (daySize + dayGap) + daySize / 2, daysStartY - 28, { size: 14, weight: 800, align: 'center', color: '#667085' }));

    const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const index = leadingBlanks + day - 1;
      const dCol = index % 7;
      const dRow = Math.floor(index / 7);
      const dx = daysStartX + dCol * (daySize + dayGap);
      const dy = daysStartY + dRow * (daySize + dayGap);
      const dateISO = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const data = activityByDate.get(dateISO) || { activity: 0, count: 0 };
      const level = getHeatLevel(data.activity, maxActivity);

      ctx.fillStyle = heatColors[level] || heatColors[0];
      ctx.strokeStyle = dateISO === todayISO() ? '#7c4d00' : '#e6ddcc';
      ctx.lineWidth = dateISO === todayISO() ? 3 : 1;
      drawRoundedRect(ctx, dx, dy, daySize, daySize, 9);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, day, dx + daySize / 2, dy + daySize / 2, { size: 15, weight: data.count ? 900 : 500, align: 'center', baseline: 'middle', color: '#1f2933' });
    }
  }

  drawText(ctx, `Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 70, height - 80, { size: 18, color: '#667085' });
}

async function exportCalendarPng(mode) {
  const canvas = makeCalendarCanvas(mode);
  const blob = await canvasToBlob(canvas);
  if (!blob) throw new Error('Nie udało się utworzyć pliku PNG.');
  const namePart = mode === 'year' ? `rok-${calendarYear}` : `miesiac-${calendarMonth}`;
  downloadBlob(blob, `bilans-kalendarz-${namePart}.png`);
  showMessage(`Wyeksportowano kalendarz do PNG: ${namePart}.`);
}

function buildPrintableCalendarHtml(mode = 'month') {
  const isYear = mode === 'year';
  const title = isYear ? `Kalendarz roczny ${calendarYear}` : `Kalendarz miesięczny ${calendarMonth}`;
  const summary = isYear ? summarize(entriesForYear(calendarYear)) : summarize(allEntries.filter(entry => entry.entryDate?.startsWith(calendarMonth)));
  const body = isYear ? el.yearCalendarGrid.innerHTML : el.calendarGrid.innerHTML;
  const extra = isYear ? el.yearTopDays.innerHTML : el.calendarDayDetails.innerHTML;
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{font-family:Arial,sans-serif;color:#1f2933;margin:24px;background:#fff} h1{margin:0 0 8px;font-size:28px} .meta{color:#667085;margin-bottom:18px} .calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.calendar-day,.year-day{border:1px solid #ddd;border-radius:8px;background:#fff;padding:8px;min-height:82px;text-align:left}.calendar-day-number{font-weight:700}.calendar-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;font-weight:700;color:#667085;margin-bottom:8px}.year-calendar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.year-month-card{border:1px solid #ddd;border-radius:12px;padding:10px;break-inside:avoid}.year-month-days,.mini-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.year-day{min-height:26px;padding:4px;text-align:center}.heat-level-0{background:#fff}.heat-level-1{background:#fff4cf}.heat-level-2{background:#fedf89}.heat-level-3{background:#fdb022}.heat-level-4{background:#dc6803}.heat-level-5{background:#93370d;color:#fff}.amount-income{color:#067647}.amount-expense{color:#b42318}button{font:inherit;color:inherit}.is-empty{visibility:hidden}@page{size:${isYear ? 'A4 landscape' : 'A4 portrait'};margin:12mm}@media print{body{margin:0}.no-print{display:none!important}}
  </style></head><body><h1>${escapeHtml(title)}</h1><div class="meta">Wpisy: ${isYear ? entriesForYear(calendarYear).length : allEntries.filter(entry => entry.entryDate?.startsWith(calendarMonth)).length} · Przychody ${formatMoney(summary.income)} · Wydatki ${formatMoney(summary.expense)} · Bilans ${formatMoney(summary.balance)} · wygenerowano ${new Date().toLocaleString('pl-PL')}</div>${isYear ? '' : '<div class="calendar-weekdays"><span>Pon</span><span>Wt</span><span>Śr</span><span>Czw</span><span>Pt</span><span>Sob</span><span>Nd</span></div>'}<main class="${isYear ? 'year-calendar-grid' : 'calendar-grid'}">${body}</main><section>${extra}</section><button class="no-print" onclick="window.print()">Drukuj / Zapisz jako PDF</button><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script></body></html>`;
}

function printCalendarPdf(mode) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
  if (!printWindow) {
    showMessage('Przeglądarka zablokowała okno wydruku. Zezwól na wyskakujące okna dla tej aplikacji.', 'error');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableCalendarHtml(mode));
  printWindow.document.close();
  showMessage('Otworzono widok PDF/drukowania. Wybierz „Zapisz jako PDF”.');
}


async function clearAppCacheAndReload() {
  const accepted = window.confirm('Wyczyścić cache tej aplikacji i uruchomić ponownie? Dane wpisów w IndexedDB nie zostaną usunięte.');
  if (!accepted) return;

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('bilans-pwa')).map(key => caches.delete(key)));
    }

    if ('serviceWorker' in navigator && !isFileProtocol()) {
      const registration = await navigator.serviceWorker.getRegistration('./');
      if (registration) await registration.unregister();
    }

    showMessage('Cache aplikacji wyczyszczony. Uruchamiam najnowszą wersję.');
    const reloadUrl = new URL(window.location.href);
    reloadUrl.searchParams.set('v', `${APP_VERSION}-${Date.now()}`);
    window.setTimeout(() => window.location.replace(reloadUrl.toString()), 500);
  } catch (error) {
    showMessage(error.message || 'Nie udało się wyczyścić cache aplikacji.', 'error');
  }
}


function getSpeechRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isVoiceActionRequested() {
  const params = new URL(window.location.href).searchParams;
  return params.get('action') === 'voice';
}

function setVoiceButtonsState(recording = false) {
  voiceIsRecording = recording;
  if (el.voiceRecordButton) {
    el.voiceRecordButton.disabled = recording;
    el.voiceRecordButton.setAttribute('aria-pressed', recording ? 'true' : 'false');
    el.voiceRecordButton.classList.toggle('recording', recording);
  }
  if (el.voiceStopButton) el.voiceStopButton.disabled = !recording;
  const hasText = Boolean((el.voiceText?.value || '').trim());
  if (el.voiceParseButton) el.voiceParseButton.disabled = recording || !hasText;
  if (el.voiceSaveButton) el.voiceSaveButton.disabled = recording || !parsedDrafts.length;
}

function setVoiceStatus(text, type = '') {
  if (!el.voiceStatus) return;
  el.voiceStatus.textContent = text;
  el.voiceStatus.classList.toggle('error', type === 'error');
}

function updateVoiceTranscript() {
  if (!el.voiceText) return;
  const text = `${voiceFinalText}${voiceInterimText ? ' ' + voiceInterimText : ''}`.trim();
  el.voiceText.value = text;
  setVoiceButtonsState(voiceIsRecording);
}

function openVoiceMode() {
  if (!el.voiceQuickPanel) return;
  document.body.classList.add('voice-mode');
  el.voiceQuickPanel.classList.remove('hidden');
  setVoiceStatus('Kliknij mikrofon i mów');
  setVoiceButtonsState(false);
  window.setTimeout(() => el.voiceRecordButton?.focus(), 50);
}

function closeVoiceMode() {
  stopVoiceRecording();
  document.body.classList.remove('voice-mode');
  if (el.voiceQuickPanel) el.voiceQuickPanel.classList.add('hidden');
}

function renderVoicePreview() {
  if (!el.voicePreview) return;
  if (!parsedDrafts.length) {
    el.voicePreview.innerHTML = '';
    return;
  }
  const rows = parsedDrafts.map(entry => `
    <div class="voice-preview-row">
      <strong>${escapeHtml(formatMoney(entry.amount))}</strong>
      <span>${escapeHtml(entry.entryType)} · ${escapeHtml(formatScope(entry.scope))} · ${escapeHtml(entry.category)}</span>
      <small>${escapeHtml(entry.description || '')}</small>
    </div>`).join('');
  el.voicePreview.innerHTML = `<div class="voice-preview-title">Podgląd rozpoznania</div>${rows}`;
}

function copyVoiceTextToParser() {
  const text = (el.voiceText?.value || '').trim();
  if (!text) throw new Error('Brak tekstu z mikrofonu do rozpoznania.');
  el.quickText.value = text;
  handleParseText();
  renderVoicePreview();
  setVoiceButtonsState(false);
}

function startVoiceRecording() {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  if (!SpeechRecognition) {
    setVoiceStatus('Ta przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome/Edge na Androidzie albo wpisz tekst ręcznie.', 'error');
    showMessage('Brak obsługi rozpoznawania mowy w tej przeglądarce.', 'error');
    return;
  }

  if (!window.isSecureContext && !isFileProtocol()) {
    setVoiceStatus('Mikrofon wymaga HTTPS albo uruchomienia lokalnego.', 'error');
    showMessage('Mikrofon w PWA wymaga HTTPS albo lokalnego uruchomienia.', 'error');
    return;
  }

  stopVoiceRecording();
  voiceFinalText = '';
  voiceInterimText = '';
  parsedDrafts = [];
  renderParsePreview();
  renderVoicePreview();
  if (el.voiceText) el.voiceText.value = '';

  const recognition = new SpeechRecognition();
  voiceRecognition = recognition;
  recognition.lang = 'pl-PL';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setVoiceStatus('Nagrywanie... mów wyraźnie');
    setVoiceButtonsState(true);
  };

  recognition.onresult = event => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const part = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) finalText += part;
      else interim += part;
    }
    if (finalText) voiceFinalText = `${voiceFinalText} ${finalText}`.trim();
    voiceInterimText = interim.trim();
    updateVoiceTranscript();
  };

  recognition.onerror = event => {
    const message = event.error === 'not-allowed'
      ? 'Brak zgody na mikrofon. Nadaj uprawnienie w przeglądarce.'
      : `Błąd mikrofonu: ${event.error || 'nieznany'}.`;
    setVoiceStatus(message, 'error');
    showMessage(message, 'error');
    setVoiceButtonsState(false);
  };

  recognition.onend = () => {
    voiceRecognition = null;
    voiceInterimText = '';
    updateVoiceTranscript();
    const text = (el.voiceText?.value || '').trim();
    if (text) {
      setVoiceStatus('Nagranie zakończone. Sprawdź tekst i zapisz wpisy.');
      try {
        copyVoiceTextToParser();
        if (parsedDrafts.length) setVoiceStatus(`Rozpoznano ${parsedDrafts.length} wpis. Sprawdź i zapisz.`);
      } catch (error) {
        setVoiceStatus(error.message || 'Nie udało się rozpoznać tekstu.', 'error');
      }
    } else {
      setVoiceStatus('Nie rozpoznano tekstu. Spróbuj ponownie.', 'error');
    }
    setVoiceButtonsState(false);
  };

  try {
    recognition.start();
  } catch (error) {
    setVoiceStatus(error.message || 'Nie udało się uruchomić mikrofonu.', 'error');
    setVoiceButtonsState(false);
  }
}

function stopVoiceRecording() {
  if (!voiceRecognition) {
    setVoiceButtonsState(false);
    return;
  }
  try { voiceRecognition.stop(); } catch (_) {}
  voiceRecognition = null;
  setVoiceButtonsState(false);
}

async function saveVoiceParsedEntries() {
  if (!parsedDrafts.length) copyVoiceTextToParser();
  await handleAddParsedEntries();
  if (el.voiceText) el.voiceText.value = '';
  parsedDrafts = [];
  renderParsePreview();
  renderVoicePreview();
  setVoiceStatus('Wpisy zapisane. Możesz dodać następny głosem.');
  setVoiceButtonsState(false);
}

function setupVoiceMode() {
  if (!el.voiceQuickPanel) return;
  if (isVoiceActionRequested()) openVoiceMode();
}

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll('[data-tab]'));
  const pages = Array.from(document.querySelectorAll('[data-tab-page]'));
  if (!buttons.length || !pages.length) return;

  const activate = tabName => {
    buttons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabName));
    pages.forEach(page => page.classList.toggle('active', page.dataset.tabPage === tabName));
    try { localStorage.setItem('bilans-pwa-active-tab', tabName); } catch (_) {}
  };

  buttons.forEach(button => {
    button.addEventListener('click', () => activate(button.dataset.tab));
  });

  let saved = 'start';
  try { saved = localStorage.getItem('bilans-pwa-active-tab') || 'start'; } catch (_) {}
  if (!pages.some(page => page.dataset.tabPage === saved)) saved = 'start';
  activate(saved);
}

function bindEvents() {
  el.entryForm.addEventListener('submit', handleFormSubmit);
  el.tagRuleForm.addEventListener('submit', event => handleTagRuleSubmit(event).catch(error => showMessage(error.message, 'error')));
  el.tagRulesList.addEventListener('click', handleTagRulesClick);
  el.parseButton.addEventListener('click', handleParseText);
  el.addParsedButton.addEventListener('click', () => handleAddParsedEntries().catch(error => showMessage(error.message, 'error')));
  el.parsePreview.addEventListener('input', event => updateParsedDraftFromElement(event.target));
  el.parsePreview.addEventListener('change', event => updateParsedDraftFromElement(event.target));
  if (el.cacheResetButton) el.cacheResetButton.addEventListener('click', clearAppCacheAndReload);
  el.quickText.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleParseText();
    }
  });


  if (el.voiceShortcutButton) el.voiceShortcutButton.addEventListener('click', openVoiceMode);
  if (el.voiceCloseButton) el.voiceCloseButton.addEventListener('click', closeVoiceMode);
  if (el.voiceRecordButton) el.voiceRecordButton.addEventListener('click', startVoiceRecording);
  if (el.voiceStopButton) el.voiceStopButton.addEventListener('click', stopVoiceRecording);
  if (el.voiceParseButton) el.voiceParseButton.addEventListener('click', () => {
    try {
      copyVoiceTextToParser();
      setVoiceStatus(`Rozpoznano ${parsedDrafts.length} wpis. Sprawdź i zapisz.`);
    } catch (error) {
      setVoiceStatus(error.message || 'Nie udało się rozpoznać tekstu.', 'error');
      showMessage(error.message || 'Nie udało się rozpoznać tekstu.', 'error');
    }
  });
  if (el.voiceSaveButton) el.voiceSaveButton.addEventListener('click', () => saveVoiceParsedEntries().catch(error => {
    setVoiceStatus(error.message || 'Nie udało się zapisać wpisów.', 'error');
    showMessage(error.message || 'Nie udało się zapisać wpisów.', 'error');
  }));
  if (el.voiceText) el.voiceText.addEventListener('input', () => setVoiceButtonsState(false));

  el.calendarPrevButton.addEventListener('click', () => shiftCalendarMonth(-1));
  el.calendarNextButton.addEventListener('click', () => shiftCalendarMonth(1));
  el.calendarTodayButton.addEventListener('click', () => {
    const today = todayISO();
    calendarMonth = today.slice(0, 7);
    selectedCalendarDate = today;
    renderCalendar();
  });
  el.calendarClearDayButton.addEventListener('click', () => {
    selectedCalendarDate = '';
    el.filterFrom.value = '';
    el.filterTo.value = '';
    applyFilters();
    showMessage('Filtr dnia został wyczyszczony.');
  });
  el.calendarGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-date]');
    if (!button) return;
    selectCalendarDate(button.dataset.date);
  });
  el.calendarGrid.addEventListener('dragover', handleCalendarDragOver);
  el.calendarGrid.addEventListener('dragleave', event => {
    if (!el.calendarGrid.contains(event.relatedTarget)) clearDropTargets();
  });
  el.calendarGrid.addEventListener('drop', handleCalendarDrop);
  el.calendarDayDetails.addEventListener('click', handleEntriesClick);
  el.calendarDayDetails.addEventListener('dragstart', handleEntryDragStart);
  el.calendarDayDetails.addEventListener('dragend', handleEntryDragEnd);
  el.yearPrevButton.addEventListener('click', () => shiftCalendarYear(-1));
  el.yearNextButton.addEventListener('click', () => shiftCalendarYear(1));
  el.yearTodayButton.addEventListener('click', () => {
    const today = todayISO();
    calendarYear = Number(today.slice(0, 4));
    selectedCalendarDate = today;
    calendarMonth = today.slice(0, 7);
    renderYearCalendar();
    renderCalendar();
  });
  el.yearCalendarGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-date]');
    if (!button) return;
    selectCalendarDate(button.dataset.date);
  });
  el.yearCalendarGrid.addEventListener('dragover', handleCalendarDragOver);
  el.yearCalendarGrid.addEventListener('dragleave', event => {
    if (!el.yearCalendarGrid.contains(event.relatedTarget)) clearDropTargets();
  });
  el.yearCalendarGrid.addEventListener('drop', handleCalendarDrop);
  el.yearTopDays.addEventListener('click', event => {
    const button = event.target.closest('button[data-date]');
    if (!button) return;
    selectCalendarDate(button.dataset.date);
  });
  el.cancelEditButton.addEventListener('click', resetForm);
  el.filterForm.addEventListener('submit', event => {
    event.preventDefault();
    applyFilters();
  });

  for (const input of [el.searchQuery, el.filterFrom, el.filterTo, el.filterType, el.filterScope, el.filterCategory, el.filterPayment]) {
    input.addEventListener('input', applyFilters);
    input.addEventListener('change', applyFilters);
  }

  el.clearFiltersButton.addEventListener('click', () => {
    selectedCalendarDate = '';
    el.filterForm.reset();
    applyFilters();
  });

  el.entriesTableBody.addEventListener('click', handleEntriesClick);
  el.entriesTableBody.addEventListener('dragstart', handleEntryDragStart);
  el.entriesTableBody.addEventListener('dragend', handleEntryDragEnd);
  el.mobileEntries.addEventListener('click', handleEntriesClick);
  el.mobileEntries.addEventListener('dragstart', handleEntryDragStart);
  el.mobileEntries.addEventListener('dragend', handleEntryDragEnd);
  el.exportButton.addEventListener('click', exportJson);
  el.syncExportButton.addEventListener('click', exportJson);
  el.exportMonthPngButton.addEventListener('click', () => exportCalendarPng('month').catch(error => showMessage(error.message, 'error')));
  el.exportYearPngButton.addEventListener('click', () => exportCalendarPng('year').catch(error => showMessage(error.message, 'error')));
  el.printMonthPdfButton.addEventListener('click', () => printCalendarPdf('month'));
  el.printYearPdfButton.addEventListener('click', () => printCalendarPdf('year'));
  el.clearAllButton.addEventListener('click', () => handleClearAll().catch(error => showMessage(error.message, 'error')));
  const handleImportChange = (event, options = {}) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importJson(file, options)
      .catch(error => showMessage(error.message || 'Nie udało się zaimportować pliku.', 'error'))
      .finally(() => { event.target.value = ''; });
  };

  el.importInput.addEventListener('change', event => handleImportChange(event, { replace: false }));
  el.syncImportInput.addEventListener('change', event => handleImportChange(event, { replace: false }));
  el.replaceImportInput.addEventListener('change', event => handleImportChange(event, { replace: true }));

  if (el.chooseLocalModeButton) el.chooseLocalModeButton.addEventListener('click', () => {
    setStorageMode('local');
    el.startupModePanel?.classList.add('hidden');
    showMessage('Wybrano pracę lokalną. Dane będą zapisane w tej przeglądarce.');
  });
  if (el.chooseDropboxModeButton) el.chooseDropboxModeButton.addEventListener('click', () => {
    setStorageMode('dropbox');
    el.startupModePanel?.classList.add('hidden');
    document.querySelector('[data-tab="sync"]')?.click();
    updateCloudUi('Wklej Dropbox App key i kliknij „Połącz z Dropbox”.');
  });
  if (el.storageModeSelect) el.storageModeSelect.addEventListener('change', event => {
    setStorageMode(event.target.value);
    if (event.target.value === 'dropbox') updateCloudUi('Tryb Dropbox wybrany. Połącz konto albo synchronizuj, jeśli jest już połączone.');
  });
  if (el.dropboxAppKeyInput) el.dropboxAppKeyInput.addEventListener('change', saveDropboxConfig);
  if (el.dropboxFilePathInput) el.dropboxFilePathInput.addEventListener('change', saveDropboxConfig);
  if (el.dropboxConnectButton) el.dropboxConnectButton.addEventListener('click', () => startDropboxAuth().catch(error => showMessage(error.message, 'error')));
  if (el.dropboxDisconnectButton) el.dropboxDisconnectButton.addEventListener('click', disconnectDropbox);
  if (el.dropboxSyncNowButton) el.dropboxSyncNowButton.addEventListener('click', () => syncDropboxNow().catch(error => {
    updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`);
    showMessage(error.message, 'error');
  }));

}

async function init() {
  const today = todayISO();
  document.title = `Bilans PWA — Etap ${APP_VERSION}`;
  if (el.appVersionBadge) el.appVersionBadge.textContent = `Etap ${APP_VERSION}`;
  el.todayLabel.textContent = `Dzisiaj: ${today} · dane lokalne w przeglądarce · Etap ${APP_VERSION}`;
  if (isFileProtocol()) {
    showMessage('Program został otwarty bezpośrednio z index.html. Do importu JSON, PWA i cache użyj serwera lokalnego albo GitHub Pages.', 'error');
  }
  if (el.syncInfo) el.syncInfo.textContent = `Tryb „Połącz” dopisuje nowe wpisy i aktualizuje starsze wersje tych samych wpisów. ID urządzenia: ${getDeviceId()}.`;
  fillSelect(el.category, CATEGORIES);
  fillSelect(el.filterCategory, CATEGORIES, true);
  fillSelect(el.tagRuleCategory, CATEGORIES);
  if (el.tagRuleCategory.options.length === 0) fillSelect(el.tagRuleCategory, CATEGORIES);
  resetForm();
  renderParsePreview();
  setupInstallPrompt();
  registerServiceWorker();

  if (!('indexedDB' in window)) {
    showMessage('Ta przeglądarka nie obsługuje IndexedDB. Program nie zapisze danych lokalnie.', 'error');
    return;
  }

  db = await openDatabase();
  await seedDefaultTagRules();
  await ensureEntrySyncIds();
  renderTagRules();
  el.tagRuleCategory.value = 'Inne';
  await reloadEntries();
  bindEvents();
  setupTabs();
  setupThemes();
  setupVoiceMode();
  updateCloudUi();
  setupFirstRunMode();
  try {
    await handleDropboxOAuthReturn();
  } catch (error) {
    showMessage(error.message || 'Nie udało się zakończyć logowania Dropbox.', 'error');
  }
  if (getStorageMode() === 'dropbox' && hasDropboxConnection() && !new URL(window.location.href).searchParams.get('code')) {
    syncDropboxNow().catch(error => updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`));
  }
}

init().catch(error => {
  showMessage(error.message || 'Błąd uruchamiania aplikacji.', 'error');
});
