const DB_NAME = 'bilans-pwa-etap1';
const DB_VERSION = 4;
const APP_VERSION = '1.1-118';
const RAW_DROPBOX_DEFAULT_APP_KEY = String(window.PORTFEL_PRO_CONFIG?.dropboxAppKey || '').trim();
const DROPBOX_DEFAULT_APP_KEY = /^WSTAW_TUTAJ/i.test(RAW_DROPBOX_DEFAULT_APP_KEY) ? '' : RAW_DROPBOX_DEFAULT_APP_KEY; // Ustaw w src/config.js, wtedy użytkownik klika tylko Połącz z Dropbox.
const MAIN_INSTALL_KEY = 'portfel-pro-main-installed';
const VOICE_INSTALL_KEY = 'portfel-pro-voice-installed';
let activeInstallTarget = null;

const STORE = 'entries';
const TAG_RULE_STORE = 'tagRules';
const LEARNING_RULE_STORE = 'learningRules';
const DEVICE_ID_KEY = 'bilans-pwa-device-id';
const THEME_KEY = 'bilans-pwa-theme';
const STORAGE_MODE_KEY = 'bilans-pwa-storage-mode';
const DROPBOX_CONFIG_KEY = 'bilans-pwa-dropbox-config';
const DROPBOX_TOKEN_KEY = 'bilans-pwa-dropbox-token';
const DROPBOX_OAUTH_KEY = 'bilans-pwa-dropbox-oauth';
const DELETED_ENTRIES_KEY = 'bilans-pwa-deleted-entries';
const DELETE_TOMBSTONE_RETENTION_DAYS = 365;
const MAIN_REPORT_SETTINGS_KEY = 'portfel-pro-main-report-settings-v1';
const CUSTOM_CATEGORIES_KEY = 'portfel-pro-custom-categories-v1';
const WALLET_MONTHS_KEY = 'portfel-pro-wallet-months-v1';
const LEARNING_AUTO_CONFIRMATIONS = 2;
const LEARNING_MAX_EXAMPLES = 8;

const THEMES = {
  classic: { name: 'Jasny klasyczny', color: '#f6f3ea' },
  blue: { name: 'Błękitny firmowy', color: '#edf5ff' },
  green: { name: 'Zielony bilans', color: '#eef8f1' },
  gold: { name: 'Złoty', color: '#fff6d7' },
  ruby: { name: 'Rubinowy', color: '#fff1f5' },
  amber: { name: 'Bursztynowy', color: '#fff7ed' },
  diamond: { name: 'Diamentowy', color: '#f5fbff' },
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

const NAME_DAY_API_URLS = [
  'https://nameday.abalin.net/api/V1/today?country=pl',
  'https://nameday.abalin.net/api/V1/today?country=pl&timezone=Europe/Warsaw',
  'https://nameday.abalin.net/api/V2/today/Europe%2FWarsaw'
];

function formatPolishDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function cleanNamedayText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/^[-,\s]+|[-,\s]+$/g, '')
    .trim();
}

function extractPolishNamedays(payload) {
  const seen = new Set();
  const results = [];

  const pushValue = value => {
    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }
    if (typeof value !== 'string') return;
    const cleaned = cleanNamedayText(value);
    if (!cleaned) return;
    for (const part of cleaned.split(',').map(item => cleanNamedayText(item)).filter(Boolean)) {
      const key = part.toLocaleLowerCase('pl-PL');
      if (!seen.has(key)) {
        seen.add(key);
        results.push(part);
      }
    }
  };

  const scan = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(scan);
      return;
    }

    const country = String(value.country || value.country_code || value.countryCode || '').toLocaleLowerCase('pl-PL');
    if (['pl', 'poland', 'polska'].includes(country)) {
      pushValue(value.name || value.names || value.nameday || value.namedays);
    }

    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.toLocaleLowerCase('pl-PL');
      if (['name_pl', 'names_pl', 'nameday_pl', 'pl'].includes(normalizedKey)) {
        pushValue(child);
      } else {
        scan(child);
      }
    }
  };

  scan(payload);
  return results.join(', ');
}

const LOCAL_NAME_DAYS = {
  '05-10': 'Antonina, Beatrycze, Izydor, Jan, Job, Sylwester',
  '05-11': 'Iga, Ignacy, Mamert, Mirand, Franciszek',
  '05-12': 'Dominik, Imelda, Pankracy, German',
  '05-13': 'Robert, Serwacy, Maria, Andrzej',
  '05-14': 'Bonifacy, Maciej, Dobiesław',
  '05-15': 'Zofia, Izydor, Nadzieja, Dionizy'
};

function getLocalNamedays(date = new Date()) {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return LOCAL_NAME_DAYS[key] || '';
}

function setTodayHeader(namedays = '') {
  if (!el.todayLabel) return;
  const dateText = formatPolishDate();
  const names = cleanNamedayText(namedays) || getLocalNamedays();
  el.todayLabel.textContent = names
    ? `${dateText} · imieniny: ${names}`
    : `${dateText} · imieniny: niedostępne`;
}

async function updateTodayNamedays() {
  setTodayHeader(getLocalNamedays() || 'wczytywanie...');
  for (const url of NAME_DAY_API_URLS) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const namedays = extractPolishNamedays(payload);
      if (namedays) {
        setTodayHeader(namedays);
        return;
      }
    } catch (_) {}
  }
  setTodayHeader(getLocalNamedays());
}


let db;
let allEntries = [];
let filteredEntries = [];
let editingId = null;
let deferredInstallPrompt = null;
let parsedDrafts = [];
let tagRules = [];
let learningRules = [];
let customCategories = loadCustomCategories();
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
  installVoiceButton: document.querySelector('#installVoiceButton'),
  voiceShortcutButton: document.querySelector('#voiceShortcutButton'),
  voiceQuickPanel: document.querySelector('#voiceQuickPanel'),
  voiceCloseButton: document.querySelector('#voiceCloseButton'),
  voiceInstallNowButton: document.querySelector('#voiceInstallNowButton'),
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
  importButton: document.querySelector('#importButton'),
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
  syncImportButton: document.querySelector('#syncImportButton'),
  syncImportInput: document.querySelector('#syncImportInput'),
  replaceImportButton: document.querySelector('#replaceImportButton'),
  replaceImportInput: document.querySelector('#replaceImportInput'),
  syncInfo: document.querySelector('#syncInfo'),
  startupModePanel: document.querySelector('#startupModePanel'),
  chooseLocalModeButton: document.querySelector('#chooseLocalModeButton'),
  chooseDropboxModeButton: document.querySelector('#chooseDropboxModeButton'),
  storageModeSelect: document.querySelector('#storageModeSelect'),
  dropboxAppKeyInput: document.querySelector('#dropboxAppKeyInput'),
  dropboxAppKeyLabel: document.querySelector('#dropboxAppKeyLabel'),
  dropboxFilePathInput: document.querySelector('#dropboxFilePathInput'),
  dropboxConnectButton: document.querySelector('#dropboxConnectButton'),
  dropboxSyncNowButton: document.querySelector('#dropboxSyncNowButton'),
  dropboxDisconnectButton: document.querySelector('#dropboxDisconnectButton'),
  dropboxAdvancedToggle: document.querySelector('#dropboxAdvancedToggle'),
  dropboxAdvancedPanel: document.querySelector('#dropboxAdvancedPanel'),
  cloudStatus: document.querySelector('#cloudStatus'),
  tagRuleForm: document.querySelector('#tagRuleForm'),
  tagGroupName: document.querySelector('#tagGroupName'),
  tagAliases: document.querySelector('#tagAliases'),
  tagRuleCategory: document.querySelector('#tagRuleCategory'),
  tagRuleType: document.querySelector('#tagRuleType'),
  tagRulesList: document.querySelector('#tagRulesList'),
  learningRulesList: document.querySelector('#learningRulesList'),
  learningSummary: document.querySelector('#learningSummary'),
  learningClearButton: document.querySelector('#learningClearButton'),
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
  mainReportSettings: document.querySelector('#mainReportSettings'),
  mainReportResetButton: document.querySelector('#mainReportResetButton'),
  categoryForm: document.querySelector('#categoryForm'),
  newCategoryName: document.querySelector('#newCategoryName'),
  customCategoriesList: document.querySelector('#customCategoriesList'),
  categoryReport: document.querySelector('#categoryReport'),
  itemReport: document.querySelector('#itemReport'),
  smartReport: document.querySelector('#smartReport'),
  recurringReport: document.querySelector('#recurringReport'),
  walletReport: document.querySelector('#walletReport'),
  walletMonth: document.querySelector('#walletMonth'),
  walletInitialBalance: document.querySelector('#walletInitialBalance'),
  walletAdjustment: document.querySelector('#walletAdjustment'),
  walletSaveButton: document.querySelector('#walletSaveButton'),
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
  factoryResetButton: document.querySelector('#factoryResetButton'),
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

function parseDateTimeMs(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function normalizeDeletedEntry(item) {
  const syncId = String(item?.syncId || item?.sync_id || item?.id || '').trim();
  const deletedAt = String(item?.deletedAt || item?.deleted_at || item?.time || '').trim();
  if (!syncId || !parseDateTimeMs(deletedAt)) return null;
  return {
    syncId,
    deletedAt,
    sourceDeviceId: item?.sourceDeviceId || item?.source_device_id || getDeviceId()
  };
}

function getDeletedEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DELETED_ENTRIES_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeDeletedEntry).filter(Boolean);
  } catch (_) {
    return [];
  }
}

function saveDeletedEntries(items) {
  const latestBySyncId = new Map();
  const minTime = Date.now() - DELETE_TOMBSTONE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const raw of items || []) {
    const item = normalizeDeletedEntry(raw);
    if (!item) continue;
    const deletedTime = parseDateTimeMs(item.deletedAt);
    if (deletedTime < minTime) continue;
    const previous = latestBySyncId.get(item.syncId);
    if (!previous || deletedTime > parseDateTimeMs(previous.deletedAt)) {
      latestBySyncId.set(item.syncId, item);
    }
  }

  const cleaned = Array.from(latestBySyncId.values())
    .sort((a, b) => parseDateTimeMs(b.deletedAt) - parseDateTimeMs(a.deletedAt));

  localStorage.setItem(DELETED_ENTRIES_KEY, JSON.stringify(cleaned));
  return cleaned;
}

function rememberDeletedEntry(entry, deletedAt = new Date().toISOString()) {
  if (!entry?.syncId) return;
  saveDeletedEntries([
    ...getDeletedEntries(),
    {
      syncId: entry.syncId,
      deletedAt,
      sourceDeviceId: getDeviceId()
    }
  ]);
}

function rememberDeletedEntries(entries, deletedAt = new Date().toISOString()) {
  const tombstones = (entries || [])
    .filter(entry => entry?.syncId)
    .map(entry => ({ syncId: entry.syncId, deletedAt, sourceDeviceId: getDeviceId() }));
  if (!tombstones.length) return;
  saveDeletedEntries([...getDeletedEntries(), ...tombstones]);
}

function collectDeletedEntries(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [
    payload.deletedEntries,
    payload.deleted_entries,
    payload.deletions,
    payload.deleted,
    payload.tombstones
  ];
  const firstArray = candidates.find(Array.isArray);
  return (firstArray || []).map(normalizeDeletedEntry).filter(Boolean);
}

function deletedEntriesMap() {
  return new Map(getDeletedEntries().map(item => [item.syncId, item]));
}

function isEntryBlockedByDeletion(entry, deletions = deletedEntriesMap()) {
  if (!entry?.syncId) return false;
  const tombstone = deletions.get(entry.syncId);
  if (!tombstone) return false;
  const deletedTime = parseDateTimeMs(tombstone.deletedAt);
  const entryTime = parseDateTimeMs(entry.updatedAt || entry.createdAt);
  return deletedTime >= entryTime;
}

async function applyImportedDeletions(payload) {
  const incomingDeleted = collectDeletedEntries(payload);
  if (!incomingDeleted.length) return { deleted: 0 };

  const mergedDeleted = saveDeletedEntries([...getDeletedEntries(), ...incomingDeleted]);
  const deletedBySyncId = new Map(mergedDeleted.map(item => [item.syncId, item]));
  const entries = await getAllEntries();
  let deleted = 0;

  for (const entry of entries) {
    if (!isEntryBlockedByDeletion(entry, deletedBySyncId)) continue;
    await deleteEntry(entry.id);
    deleted += 1;
  }

  return { deleted };
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
  delete cleaned.learningOriginalCategory;
  delete cleaned.learningSourceText;
  delete cleaned.learningAppliedRuleId;
  delete cleaned.learningConfidence;
  delete cleaned.learningSuggestionNote;
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
  return String(dateISO || '').slice(0, 7);
}

function formatMoney(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' zł';
}

function parseAmount(raw) {
  const value = parseLooseAmount(raw);

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

function categoryKey(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function sanitizeCategoryName(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 40);
}

function uniqueCategoryList(values) {
  const result = [];
  const seen = new Set();
  for (const value of values || []) {
    const name = sanitizeCategoryName(value);
    const key = categoryKey(name);
    if (!name || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

function loadCustomCategories() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_CATEGORIES_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const defaults = new Set(CATEGORIES.map(categoryKey));
    return uniqueCategoryList(parsed)
      .filter(name => !defaults.has(categoryKey(name)))
      .sort((a, b) => a.localeCompare(b, 'pl'));
  } catch (_) {
    return [];
  }
}

function saveCustomCategories(categories = customCategories) {
  const defaults = new Set(CATEGORIES.map(categoryKey));
  customCategories = uniqueCategoryList(categories)
    .filter(name => !defaults.has(categoryKey(name)))
    .sort((a, b) => a.localeCompare(b, 'pl'));
  try { localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories)); } catch (_) {}
}

function getAllCategories() {
  const defaults = [...CATEGORIES];
  const dynamic = [
    ...customCategories,
    ...(allEntries || []).map(entry => entry.category),
    ...(tagRules || []).map(rule => rule.category),
    ...(learningRules || []).map(rule => rule.category)
  ];
  const defaultKeys = new Set(defaults.map(categoryKey));
  const custom = uniqueCategoryList(dynamic)
    .filter(name => !defaultKeys.has(categoryKey(name)))
    .sort((a, b) => a.localeCompare(b, 'pl'));
  return [...defaults, ...custom];
}

function isKnownCategory(value) {
  const key = categoryKey(value);
  return Boolean(key && getAllCategories().some(category => categoryKey(category) === key));
}

function normalizeKnownCategory(value, fallback = 'Inne') {
  const key = categoryKey(value);
  if (!key) return fallback;
  return getAllCategories().find(category => categoryKey(category) === key) || fallback;
}

function addCustomCategory(name) {
  const category = sanitizeCategoryName(name);
  if (!category) throw new Error('Podaj nazwę kategorii.');
  if (isKnownCategory(category)) throw new Error('Taka kategoria już istnieje.');
  customCategories.push(category);
  saveCustomCategories();
  return category;
}

function canDeleteCustomCategory(category) {
  const key = categoryKey(category);
  if (!key) return false;
  if (CATEGORIES.some(item => categoryKey(item) === key)) return false;
  const usedInEntries = (allEntries || []).some(entry => categoryKey(entry.category) === key);
  const usedInTagRules = (tagRules || []).some(rule => categoryKey(rule.category) === key);
  const usedInLearningRules = (learningRules || []).some(rule => categoryKey(rule.category) === key);
  return !usedInEntries && !usedInTagRules && !usedInLearningRules;
}

function deleteCustomCategory(category) {
  if (!canDeleteCustomCategory(category)) {
    throw new Error('Nie można usunąć tej kategorii, bo jest użyta we wpisach, regułach tagów albo nauce programu.');
  }
  const key = categoryKey(category);
  saveCustomCategories(customCategories.filter(item => categoryKey(item) !== key));
  const settings = getMainReportSettings();
  settings.categoryRows = (settings.categoryRows || []).filter(item => categoryKey(item) !== key);
  saveMainReportSettings(settings);
}

function refreshCategorySelects() {
  const categories = getAllCategories();
  const oldCategory = el.category?.value || 'Inne';
  const oldFilterCategory = el.filterCategory?.value || '';
  const oldTagCategory = el.tagRuleCategory?.value || 'Inne';

  if (el.category) {
    fillSelect(el.category, categories);
    el.category.value = normalizeKnownCategory(oldCategory, 'Inne');
  }
  if (el.filterCategory) {
    fillSelect(el.filterCategory, categories, true);
    el.filterCategory.value = oldFilterCategory && isKnownCategory(oldFilterCategory) ? normalizeKnownCategory(oldFilterCategory, '') : '';
  }
  if (el.tagRuleCategory) {
    fillSelect(el.tagRuleCategory, categories);
    el.tagRuleCategory.value = normalizeKnownCategory(oldTagCategory, 'Inne');
  }
}

function renderCustomCategoriesList() {
  if (!el.customCategoriesList) return;
  const categories = getAllCategories();
  const customKeys = new Set(customCategories.map(categoryKey));
  const defaultKeys = new Set(CATEGORIES.map(categoryKey));

  el.customCategoriesList.innerHTML = categories.map(category => {
    const key = categoryKey(category);
    const custom = customKeys.has(key);
    const defaultCategory = defaultKeys.has(key);
    const canDelete = custom && canDeleteCustomCategory(category);
    return `
      <article class="tag-rule-card compact-category-card">
        <div>
          <strong>${escapeHtml(category)}</strong>
          <small>${custom ? 'Kategoria własna' : (defaultCategory ? 'Kategoria domyślna' : 'Kategoria z wpisów/importu')}</small>
        </div>
        <div class="row-actions">
          ${custom ? `<button class="danger" type="button" data-category-action="delete" data-category="${escapeHtml(category)}" ${canDelete ? '' : 'disabled'} data-help="Kategorię można usunąć tylko wtedy, gdy nie jest użyta we wpisach ani regułach.">Usuń</button>` : '<span class="muted-small">stała</span>'}
        </div>
      </article>
    `;
  }).join('');
}

async function handleCategoryFormSubmit(event) {
  event.preventDefault();
  const category = addCustomCategory(el.newCategoryName?.value || '');
  el.categoryForm?.reset();

  const settings = getMainReportSettings();
  const selected = new Set(settings.categoryRows || []);
  selected.add(category);
  settings.categoryRows = Array.from(selected).sort((a, b) => a.localeCompare(b, 'pl'));
  saveMainReportSettings(settings);

  refreshCategorySelects();
  renderCustomCategoriesList();
  renderMainReportSettings();
  renderMainReport();
  showMessage(`Dodano kategorię: ${category}.`);
}

function handleCustomCategoryClick(event) {
  const button = event.target.closest('button[data-category-action="delete"]');
  if (!button) return;
  const category = button.dataset.category;
  if (!window.confirm(`Usunąć kategorię: ${category}?`)) return;
  try {
    deleteCustomCategory(category);
    refreshCategorySelects();
    renderCustomCategoriesList();
    renderMainReportSettings();
    renderMainReport();
    showMessage('Kategoria usunięta.');
  } catch (error) {
    showMessage(error.message, 'error');
  }
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
    category: isKnownCategory(rule?.category) ? normalizeKnownCategory(rule.category, 'Inne') : 'Inne',
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

const LEARNING_STOP_WORDS = new Set([
  'kupilem', 'kupilam', 'kupione', 'kupiony', 'kupiona', 'kupic', 'zakup', 'zakupy', 'zaplacilem', 'zaplacilam',
  'wydalem', 'wydalam', 'koszt', 'kosztowalo', 'paragon', 'faktura', 'rachunek', 'rachunki', 'dostalem', 'otrzymalem',
  'zarobilem', 'zarobek', 'przychod', 'wplata', 'wplyw', 'gotowka', 'karta', 'bank', 'blik', 'inne',
  'domowe', 'firmowe', 'domowy', 'firmowy', 'domowa', 'firmowa', 'nieokreslone', 'dzieci', 'dziecko', 'dzieciom',
  'oraz', 'albo', 'czyli', 'jest', 'bylo', 'byla', 'byly', 'ten', 'ta', 'to', 'tego', 'tej', 'tych', 'dla', 'przez',
  'przy', 'nad', 'pod', 'bez', 'oraz', 'wraz', 'jako', 'szt', 'sztuk', 'sztuki', 'zlotych', 'zlote', 'zloty', 'pln'
]);

function learningStem(token) {
  let value = normalizeText(token).replace(/[^a-z0-9]/g, '');
  if (value.length <= 3) return value;
  const suffixes = ['ciom', 'ami', 'ach', 'ego', 'emu', 'owa', 'owe', 'owy', 'ych', 'ymi', 'ami', 'owi', 'owe', 'owa', 'om', 'ow', 'em', 'ie', 'ia', 'iu', 'go', 'ej', 'y', 'a', 'e', 'i', 'u'];
  for (const suffix of suffixes) {
    if (value.endsWith(suffix) && value.length - suffix.length >= 3) {
      value = value.slice(0, -suffix.length);
      break;
    }
  }
  return value;
}

function learningTokens(value) {
  return normalizeText(value)
    .replace(new RegExp(`\\b${MONEY_NUMBER_PATTERN}\\s*(?:${ZLOTY_WORDS}|${GROSZ_WORDS})?\\b`, 'gi'), ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map(learningStem)
    .filter(token => token.length >= 3 && !LEARNING_STOP_WORDS.has(token))
    .filter((token, index, array) => array.indexOf(token) === index);
}

function normalizeLearningPhrase(value) {
  return learningTokens(value).join(' ');
}

function makeLearningPhrase(entryOrText) {
  const text = typeof entryOrText === 'string'
    ? entryOrText
    : [entryOrText?.description, entryOrText?.originalText].filter(Boolean).join(' ');
  const tokens = learningTokens(text);
  if (tokens.length) return tokens.slice(0, 5).join(' ');
  return normalizeAlias(text).split(/\s+/).slice(0, 5).join(' ');
}

function learningConfidence(rule) {
  const confirmations = Number(rule?.confirmations || 0);
  const misses = Number(rule?.misses || 0);
  return Math.max(35, Math.min(99, 45 + confirmations * 18 - misses * 12));
}

function normalizeLearningRule(rule) {
  const phrase = String(rule?.phrase || rule?.text || '').trim();
  const now = new Date().toISOString();
  const normalizedPhrase = normalizeLearningPhrase(phrase || rule?.normalizedPhrase || '');
  const idBase = normalizedPhrase || normalizeAlias(phrase) || String(Date.now());
  return {
    id: rule?.id || `learn-${idBase.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    phrase: phrase || normalizedPhrase,
    normalizedPhrase,
    category: isKnownCategory(rule?.category) ? normalizeKnownCategory(rule.category, 'Inne') : 'Inne',
    entryType: ['przychód', 'wydatek', ''].includes(rule?.entryType) ? rule.entryType : '',
    confirmations: Math.max(1, Number(rule?.confirmations || 1)),
    misses: Math.max(0, Number(rule?.misses || 0)),
    examples: Array.isArray(rule?.examples) ? rule.examples.slice(-LEARNING_MAX_EXAMPLES).map(String) : [],
    source: rule?.source || 'correction',
    createdAt: rule?.createdAt || rule?.created_at || now,
    updatedAt: rule?.updatedAt || rule?.updated_at || now
  };
}

function tokenMatchesLearning(ruleToken, sourceTokens) {
  if (sourceTokens.includes(ruleToken)) return true;
  if (ruleToken.length < 4) return false;
  return sourceTokens.some(token => {
    if (token === ruleToken) return true;
    if (token.length >= 4 && (token.startsWith(ruleToken) || ruleToken.startsWith(token))) return true;
    return Math.abs(token.length - ruleToken.length) <= 1 && levenshteinDistance(token, ruleToken) <= 1;
  });
}

function levenshteinDistance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let old = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        old + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      old = temp;
    }
  }
  return prev[b.length];
}

function scoreLearningRule(rule, text) {
  if (!rule || !isKnownCategory(rule.category)) return 0;
  if (Number(rule.confirmations || 0) < LEARNING_AUTO_CONFIRMATIONS) return 0;

  const sourceTokens = learningTokens(text);
  const ruleTokens = learningTokens(rule.normalizedPhrase || rule.phrase);
  if (!sourceTokens.length || !ruleTokens.length) return 0;

  const sourcePhrase = ` ${sourceTokens.join(' ')} `;
  const rulePhrase = ` ${ruleTokens.join(' ')} `;
  let baseScore = sourcePhrase.includes(rulePhrase.trim()) ? 1 : 0;

  if (!baseScore) {
    const matched = ruleTokens.filter(token => tokenMatchesLearning(token, sourceTokens)).length;
    const required = Math.max(1, Math.ceil(ruleTokens.length * 0.6));
    if (matched >= required) baseScore = matched / ruleTokens.length;
  }

  if (baseScore < 0.6) return 0;
  return Math.round(baseScore * learningConfidence(rule));
}

function findBestLearningRule(text) {
  const candidates = learningRules
    .map(rule => ({ rule, score: scoreLearningRule(rule, text) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.rule.confirmations || 0) - Number(a.rule.confirmations || 0));
  return candidates[0] || null;
}

function trainingSimilarity(rule, phrase) {
  const ruleTokens = learningTokens(rule?.normalizedPhrase || rule?.phrase || '');
  const phraseTokens = learningTokens(phrase);
  if (!ruleTokens.length || !phraseTokens.length) return 0;
  const matched = ruleTokens.filter(token => tokenMatchesLearning(token, phraseTokens)).length;
  return matched / Math.max(ruleTokens.length, phraseTokens.length);
}

function findSimilarLearningRuleForTraining(phrase, category) {
  return learningRules
    .filter(rule => rule.category === category)
    .map(rule => ({ rule, score: trainingSimilarity(rule, phrase) }))
    .filter(item => item.score >= 0.5)
    .sort((a, b) => b.score - a.score || Number(b.rule.confirmations || 0) - Number(a.rule.confirmations || 0))[0]?.rule || null;
}

function applyLearningToEntry(entry, options = {}) {
  const sourceText = options.sourceText || [entry.description, entry.originalText].filter(Boolean).join(' ');
  const originalCategory = options.originalCategory || entry.category || 'Inne';
  const match = findBestLearningRule(sourceText);
  const updated = {
    ...entry,
    learningOriginalCategory: originalCategory,
    learningSourceText: makeLearningPhrase(sourceText)
  };

  if (match?.rule?.category && match.rule.category !== updated.category) {
    updated.category = match.rule.category;
    updated.tags = normalizeTags([...(updated.tags ?? []), match.rule.category, 'nauczone'].join(','));
    updated.reportGroup = updated.reportGroup || inferReportGroup(updated.description || updated.originalText || updated.category);
    updated.learningAppliedRuleId = match.rule.id;
    updated.learningConfidence = match.score;
    updated.learningSuggestionNote = `Nauczona reguła: ${match.rule.phrase}`;
  }

  return updated;
}

async function saveLearningRule(rule) {
  const normalized = normalizeLearningRule(rule);
  if (!normalized.normalizedPhrase || normalized.category === 'Inne') return null;
  return new Promise((resolve, reject) => {
    const request = txNamedStore(LEARNING_RULE_STORE, 'readwrite').put(normalized);
    request.onsuccess = () => resolve(normalized);
    request.onerror = event => reject(event.target.error);
  });
}

function getAllLearningRules() {
  return new Promise((resolve, reject) => {
    const request = txNamedStore(LEARNING_RULE_STORE).getAll();
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = event => reject(event.target.error);
  });
}

function deleteLearningRule(id) {
  return new Promise((resolve, reject) => {
    const request = txNamedStore(LEARNING_RULE_STORE, 'readwrite').delete(id);
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
  });
}

function clearLearningRulesStore() {
  return new Promise((resolve, reject) => {
    const request = txNamedStore(LEARNING_RULE_STORE, 'readwrite').clear();
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error);
  });
}

async function reloadLearningRules() {
  learningRules = (await getAllLearningRules())
    .map(normalizeLearningRule)
    .filter(rule => rule.normalizedPhrase && isKnownCategory(rule.category))
    .sort((a, b) => learningConfidence(b) - learningConfidence(a) || b.updatedAt.localeCompare(a.updatedAt));
  renderLearningRules();
}

async function importLearningRulesFromPayload(payload, replace = false) {
  if (!Array.isArray(payload?.learningRules)) return;
  if (replace) await clearLearningRulesStore();
  const existing = new Map((await getAllLearningRules()).map(rule => [rule.id, normalizeLearningRule(rule)]));
  for (const incoming of payload.learningRules) {
    const normalized = normalizeLearningRule(incoming);
    const current = existing.get(normalized.id);
    if (!current || Date.parse(normalized.updatedAt || '') >= Date.parse(current.updatedAt || '')) {
      await saveLearningRule(normalized);
    }
  }
  await reloadLearningRules();
}

async function learnFromCorrection(entry, previousCategory) {
  const nextCategory = entry?.category || 'Inne';
  const oldCategory = previousCategory || entry?.learningOriginalCategory || 'Inne';
  if (!entry || !isKnownCategory(nextCategory) || nextCategory === 'Inne' || nextCategory === oldCategory) return null;

  const phrase = makeLearningPhrase(entry.learningSourceText || entry.description || entry.originalText || '');
  if (!phrase) return null;

  const normalizedPhrase = normalizeLearningPhrase(phrase);
  if (!normalizedPhrase) return null;

  const id = `learn-${normalizedPhrase.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${normalizeAlias(nextCategory)}`;
  const similar = findSimilarLearningRuleForTraining(normalizedPhrase, nextCategory);
  const existing = similar || learningRules.find(rule => rule.id === id) || null;
  const now = new Date().toISOString();
  const examples = [...(existing?.examples ?? []), entry.description || entry.originalText || phrase]
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex(x => normalizeText(x) === normalizeText(item)) === index)
    .slice(-LEARNING_MAX_EXAMPLES);

  const saved = await saveLearningRule({
    ...(existing ?? {}),
    id: existing?.id || id,
    phrase: existing?.phrase || phrase,
    normalizedPhrase: existing?.normalizedPhrase || normalizedPhrase,
    category: nextCategory,
    entryType: entry.entryType || existing?.entryType || '',
    confirmations: Number(existing?.confirmations || 0) + 1,
    examples,
    source: 'correction',
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });

  await reloadLearningRules();
  scheduleDropboxAutoSync();
  return saved;
}

async function learnFromParsedEntries(entries) {
  let learned = 0;
  for (const entry of entries) {
    const saved = await learnFromCorrection(entry, entry.learningOriginalCategory);
    if (saved) learned += 1;
  }
  return learned;
}

function renderLearningRules() {
  if (el.learningSummary) {
    const active = learningRules.filter(rule => Number(rule.confirmations || 0) >= LEARNING_AUTO_CONFIRMATIONS).length;
    el.learningSummary.textContent = `Reguły: ${learningRules.length} · aktywne automatycznie: ${active} · próg: ${LEARNING_AUTO_CONFIRMATIONS} potwierdzenia.`;
  }

  if (!el.learningRulesList) return;
  if (!learningRules.length) {
    el.learningRulesList.innerHTML = '<div class="empty-state">Brak nauczonych reguł. Popraw kategorię w podglądzie rozpoznania, zapisz wpis i program zacznie się uczyć.</div>';
    return;
  }

  el.learningRulesList.innerHTML = learningRules.map(rule => {
    const confidence = learningConfidence(rule);
    const active = Number(rule.confirmations || 0) >= LEARNING_AUTO_CONFIRMATIONS;
    const examples = (rule.examples || []).slice(-2).map(example => `<span class="tag">${escapeHtml(example)}</span>`).join('');
    return `
      <article class="tag-rule-card learning-rule-card">
        <div>
          <strong>${escapeHtml(rule.phrase)}</strong>
          <small>${escapeHtml(rule.category)} · potwierdzenia: ${Number(rule.confirmations || 0)} · pewność: ${confidence}% · ${active ? 'aktywna' : 'uczy się'}</small>
          <div class="tag-list"><span class="tag learning-tag">${escapeHtml(rule.normalizedPhrase)}</span>${examples}</div>
        </div>
        <div class="row-actions">
          <button class="danger" type="button" data-learning-action="delete" data-id="${escapeHtml(rule.id)}" data-help="Usuwa tę nauczoną regułę. Wpisy finansowe zostają bez zmian.">Usuń</button>
        </div>
      </article>
    `;
  }).join('');
}

async function handleLearningRuleDelete(id) {
  const rule = learningRules.find(item => item.id === id);
  if (!rule) return;
  if (!window.confirm(`Usunąć nauczoną regułę: ${rule.phrase} → ${rule.category}?`)) return;
  await deleteLearningRule(id);
  await reloadLearningRules();
  showMessage('Nauczona reguła usunięta.');
  scheduleDropboxAutoSync();
}

function handleLearningRulesClick(event) {
  const button = event.target.closest('button[data-learning-action]');
  if (!button) return;
  const { learningAction, id } = button.dataset;
  if (learningAction === 'delete') handleLearningRuleDelete(id).catch(error => showMessage(error.message, 'error'));
}

async function clearAllLearningRules() {
  if (!learningRules.length) {
    showMessage('Nie ma nauczonych reguł do usunięcia.');
    return;
  }
  if (!window.confirm('Usunąć wszystkie nauczone reguły kategorii? Wpisy finansowe zostaną bez zmian.')) return;
  await clearLearningRulesStore();
  await reloadLearningRules();
  showMessage('Wyczyszczono nauczone reguły.');
  scheduleDropboxAutoSync();
}

const ZLOTY_WORDS = 'złotych|zlotych|złoty|zloty|złote|zlote|zł|zl|pln';
const GROSZ_WORDS = 'groszy|grosze|grosz|gr';
const MONEY_NUMBER_PATTERN = "\\d+(?:[\\s.']\\d{3})*(?:[,.]\\d{1,2})?|\\d+(?:[,.]\\d{1,2})?";

function normalizeMoneyNumber(raw) {
  let value = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/'/g, '');

  if (!value) return null;

  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  const decimalSeparator = Math.max(lastComma, lastDot);

  if (decimalSeparator >= 0) {
    const fraction = value.slice(decimalSeparator + 1);
    const integer = value.slice(0, decimalSeparator);
    const isDecimal = fraction.length > 0 && fraction.length <= 2;

    if (isDecimal) {
      value = integer.replace(/[,.]/g, '') + '.' + fraction;
    } else {
      value = value.replace(/[,.]/g, '');
    }
  }

  value = value.replace(/[^0-9.]/g, '');
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number * 100) / 100;
}

function parseMoneyByUnit(numberRaw, unitRaw = '') {
  const number = normalizeMoneyNumber(numberRaw);
  if (!number) return null;

  const normalizedUnit = normalizeText(unitRaw);
  const rawText = String(numberRaw ?? '');
  const hasDecimalPart = /[,.]\d{1,2}\b/.test(rawText);

  if (new RegExp(`^(?:${GROSZ_WORDS})$`, 'i').test(normalizedUnit)) {
    if (hasDecimalPart) return number;
    if (number > 0 && number < 100) return Math.round(number) / 100;
  }

  return number;
}

function parseLooseAmount(raw) {
  const source = String(raw ?? '').trim();
  if (!source) return null;

  const compoundPattern = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:${ZLOTY_WORDS})\\s*(\\d{1,2})\\s*(?:${GROSZ_WORDS})\\b`, 'iu');
  const compound = source.match(compoundPattern);
  if (compound) {
    const zloty = normalizeMoneyNumber(compound[1]);
    const grosze = Number(compound[2]);
    if (zloty && Number.isFinite(grosze)) return Math.round((zloty + grosze / 100) * 100) / 100;
  }

  const unitPattern = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:(${ZLOTY_WORDS})|(${GROSZ_WORDS}))(?=$|\\s|[.,;:!?])`, 'iu');
  const unitMatch = source.match(unitPattern);
  if (unitMatch) {
    const unit = unitMatch[2] || unitMatch[3] || '';
    return parseMoneyByUnit(unitMatch[1], unit);
  }

  return normalizeMoneyNumber(source);
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

function parseExplicitDateFromText(text) {
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
    if (month) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

function parseDateFromText(text) {
  return parseExplicitDateFromText(text) || el.entryDate.value || todayISO();
}

function parseDateForAmount(source, amountIndex) {
  const text = String(source ?? '');
  const index = Math.max(0, Number(amountIndex) || 0);
  const lineStart = Math.max(text.lastIndexOf('\n', index), text.lastIndexOf(';', index));
  const nextLineBreak = text.indexOf('\n', index);
  const nextSemicolon = text.indexOf(';', index);
  const lineEndCandidates = [nextLineBreak, nextSemicolon].filter(pos => pos >= 0);
  const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : text.length;
  const sameLine = text.slice(lineStart + 1, lineEnd);
  const sameLineDate = parseExplicitDateFromText(sameLine);
  if (sameLineDate) return sameLineDate;

  const previousParts = text.slice(0, index).split(/[;\n]/).reverse();
  for (const part of previousParts) {
    const date = parseExplicitDateFromText(part);
    if (date) return date;
  }

  return parseDateFromText(sameLine || text);
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

function detectCategoryFromRules(text) {
  const normalized = normalizeText(text);
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some(word => normalized.includes(word))) return rule.category;
  }
  return '';
}

function detectCategory(text) {
  return detectCategoryFromRules(text) || el.category.value || 'Inne';
}

function detectCategoryForParsedEntry(text, scope = 'nieokreślone') {
  const detected = detectCategoryFromRules(text);
  if (detected) return detected;
  if (normalizeScope(scope) === 'domowe') return 'Dom';
  return 'Inne';
}

function detectEntryType(text) {
  const normalized = normalizeText(text);
  const incomeWords = ['zarobek', 'zarobilem', 'przychod', 'wplyw', 'wplata', 'dostalem', 'otrzymalem', 'wyplata', 'faktura sprzedaz', 'usluga dla'];
  const expenseWords = ['wydatek', 'wydatki', 'wydatkowe', 'kupilem', 'kupilam', 'zakup', 'zaplacilem', 'zaplacilam', 'wydalem', 'wydalam', 'koszt', 'kosztowalo', 'paragon'];

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
    .replace(/\b(kupiłem|kupilem|kupiłam|kupilam|zakup|zakupy|wydatek|wydatki|wydatkowe|zapłaciłem|zaplacilem|zapłaciłam|zaplacilam|wydałem|wydalem|wydałam|wydalam|koszt|kosztowało|kosztowalo|zarobek|zarobiłem|zarobilem|przychód|przychod|wpływ|wplyw|dostałem|dostalem|otrzymałem|otrzymalem|wpłata|wplata|paragon)\b/gi, ' ')
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

function rangesOverlap(a, b) {
  return a.index < b.end && b.index < a.end;
}

function findAmountMatches(text) {
  const source = String(text ?? '');
  const matches = [];

  const addMatch = (match, value) => {
    const item = {
      index: match.index,
      end: match.index + match[0].length,
      raw: match[0],
      value
    };
    if (item.value && item.value > 0 && !matches.some(existing => rangesOverlap(existing, item))) {
      matches.push(item);
    }
  };

  const compoundRegex = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:${ZLOTY_WORDS})\\s*(\\d{1,2})\\s*(?:${GROSZ_WORDS})\\b`, 'giu');
  for (const match of source.matchAll(compoundRegex)) {
    const zloty = normalizeMoneyNumber(match[1]);
    const grosze = Number(match[2]);
    if (zloty && Number.isFinite(grosze)) addMatch(match, Math.round((zloty + grosze / 100) * 100) / 100);
  }

  const numberUnitRegex = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:(${ZLOTY_WORDS})|(${GROSZ_WORDS}))(?=$|\\s|[.,;:!?])`, 'giu');
  for (const match of source.matchAll(numberUnitRegex)) {
    const unit = match[2] || match[3] || '';
    addMatch(match, parseMoneyByUnit(match[1], unit));
  }

  const unitNumberRegex = new RegExp(`(?:${ZLOTY_WORDS})\\s*(${MONEY_NUMBER_PATTERN})`, 'giu');
  for (const match of source.matchAll(unitNumberRegex)) {
    addMatch(match, parseMoneyByUnit(match[1], 'zł'));
  }

  return matches.sort((a, b) => a.index - b.index);
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

function takeBeforeContext(text, from, to) {
  let part = text.slice(from, to);
  const lastSeparator = Math.max(part.lastIndexOf('\n'), part.lastIndexOf(';'), part.lastIndexOf(','));
  if (lastSeparator >= 0) part = part.slice(lastSeparator + 1);
  return part.replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, '').trim();
}

function takeAfterContext(text, from, to) {
  let part = text.slice(from, to);
  const firstSeparator = part.search(/[;\n,]/);
  if (firstSeparator >= 0) part = part.slice(0, firstSeparator);

  // Jeżeli po kwocie jest tylko znacznik następnej pozycji, np. „wydatek domowy”,
  // nie dopinamy go do bieżącej pozycji, bo psuje rodzaj i kategorię.
  if (!cleanDescription(part)) return '';

  return part.replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, '').trim();
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

  const drafts = matches.map((match, index) => {
    const prevEnd = index === 0 ? 0 : matches[index - 1].end;
    const nextIndex = index + 1 < matches.length ? matches[index + 1].index : source.length;
    const before = takeBeforeDescription(source, prevEnd, match.index);
    const after = takeAfterDescription(source, match.end, nextIndex);
    const beforeContext = takeBeforeContext(source, prevEnd, match.index);
    const afterContext = takeAfterContext(source, match.end, nextIndex);
    const amountBeforeDescription = !before || before.length < 3 || /^(za|po)$/i.test(before);
    const description = amountBeforeDescription && after ? after : before || after || 'Wpis z tekstu';
    const context = [beforeContext, match.raw, afterContext].filter(Boolean).join(' ');
    const entryDate = parseDateForAmount(source, match.index);
    const entryType = detectEntryType(context || description);
    const paymentMethod = detectPaymentMethod(context || description);
    const quantity = extractQuantity(description || context);
    const multiplier = shouldMultiplyByQuantity(context, amountBeforeDescription) ? quantity : 1;
    const amount = Math.round(match.value * multiplier * 100) / 100;
    const preliminaryCategory = detectCategoryFromRules(`${description} ${context}`) || 'Inne';
    const scope = detectScope(`${context} ${description}`, entryType, preliminaryCategory);
    const category = detectCategoryForParsedEntry(`${description} ${context}`, scope);

    const baseEntry = enrichEntryWithTagRules({
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
      originalText: context || description,
      tags: makeTagsFromDescription(description, category),
      syncId: makeSyncId('entry'),
      sourceDeviceId: getDeviceId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { overrideCategory: true });

    return applyLearningToEntry(baseEntry, {
      originalCategory: baseEntry.category,
      sourceText: `${description} ${context}`
    });
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
      const learningInfo = entry.learningAppliedRuleId
        ? ` · nauczona reguła: ${escapeHtml(entry.learningSuggestionNote || '')} (${escapeHtml(entry.learningConfidence || '')}%)`
        : '';
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
              <select data-field="category">${optionsHtml(getAllCategories(), entry.category || 'Inne')}</select>
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
          <small>${escapeHtml(entry.weekday || '')} · grupa: ${escapeHtml(resolveReportGroup(entry))}${entry.quantity > 1 ? ` · ilość ${escapeHtml(entry.quantity)} · cena ${escapeHtml(formatMoney(entry.unitAmount))}` : ''}${learningInfo}</small>
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
  const learnedCount = await learnFromParsedEntries(parsedDrafts);
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
  showMessage(`Dodano wpisy z parsera: ${entries.length}${learnedCount ? ` · nauka: ${learnedCount}` : ''}.`);
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


function getHelpText(target) {
  const node = target?.closest?.('[data-help], [title], button, input, select, textarea, summary, .summary-card, .theme-card');
  if (!node) return { node: null, text: '' };

  const explicit = node.dataset?.help || node.getAttribute('title') || '';
  if (explicit.trim()) return { node, text: explicit.trim() };

  const label = node.closest?.('label')?.firstChild?.textContent?.trim();
  if (label) return { node, text: `Pole „${label}”. Dotknij i wpisz albo wybierz wartość.` };

  const text = node.textContent?.replace(/\s+/g, ' ').trim();
  if (!text) return { node: null, text: '' };

  const lower = text.toLowerCase();
  if (lower.includes('edytuj')) return { node, text: 'Otwiera element do edycji.' };
  if (lower.includes('usuń')) return { node, text: 'Usuwa wybrany element po potwierdzeniu.' };
  if (lower.includes('zapisz')) return { node, text: 'Zapisuje dane albo tworzy kopię, zależnie od miejsca użycia.' };
  if (lower.includes('wyczyść')) return { node, text: 'Czyści pole, filtr albo wybrany zakres danych.' };
  return { node: null, text: '' };
}

function setupSmartTooltips() {
  const tooltip = document.createElement('div');
  tooltip.className = 'smart-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  document.body.appendChild(tooltip);

  let activeNode = null;
  let pendingNode = null;
  let hideTimer = null;
  let showTimer = null;
  let longPressTimer = null;
  let longPressFired = false;
  let suppressClickNode = null;
  let lastPointerType = '';

  function isTouchTooltipMode() {
    return window.matchMedia?.('(pointer: coarse)')?.matches || window.matchMedia?.('(hover: none)')?.matches;
  }

  const staticHelp = [
    ['#entryDate', 'Data wpisu. W raportach i kalendarzu wpis trafi właśnie na ten dzień.'],
    ['#entryType', 'Przychód zwiększa wynik, wydatek go pomniejsza.'],
    ['#entryScope', 'Firmowe wpływa na wynik firmy. Domowe jest pokazywane osobno i nie obniża wypłaty firmy.'],
    ['#category', 'Kategoria używana w raportach.'],
    ['#amount', 'Kwota wpisu. Rozpoznaje zapis 3 zł 46 gr, 3,46 zł, 3.46 zł oraz kwoty z groszami.'],
    ['#paymentMethod', 'Sposób płatności, pomocny przy późniejszym filtrowaniu.'],
    ['#tags', 'Tagi pomagają grupować podobne wydatki, np. paliwo, klient, antena.'],
    ['#description', 'Krótki opis pozycji, widoczny w historii i raportach.'],
    ['#originalText', 'Oryginalna notatka albo dyktowany tekst, z którego powstał wpis.'],
    ['#filterFrom', 'Początek zakresu dat w historii.'],
    ['#filterTo', 'Koniec zakresu dat w historii.'],
    ['#filterType', 'Filtruje przychody albo wydatki.'],
    ['#filterScope', 'Filtruje wpisy domowe, firmowe albo nieokreślone.'],
    ['#filterCategory', 'Filtruje historię po kategorii.'],
    ['#filterPayment', 'Filtruje historię po sposobie płatności.'],
    ['#clearFiltersButton', 'Usuwa wszystkie aktywne filtry historii.'],
    ['#calendarPrevButton', 'Pokazuje poprzedni miesiąc.'],
    ['#calendarTodayButton', 'Wraca do bieżącego miesiąca i dzisiejszej daty.'],
    ['#calendarNextButton', 'Pokazuje następny miesiąc.'],
    ['#calendarClearDayButton', 'Usuwa filtr wybranego dnia.'],
    ['#yearPrevButton', 'Pokazuje poprzedni rok.'],
    ['#yearTodayButton', 'Wraca do bieżącego roku.'],
    ['#yearNextButton', 'Pokazuje następny rok.'],
    ['#exportMonthPngButton', 'Zapisuje miesięczny kalendarz jako obraz PNG.'],
    ['#printMonthPdfButton', 'Otwiera miesięczny kalendarz do wydruku lub zapisu jako PDF.'],
    ['#exportYearPngButton', 'Zapisuje roczny kalendarz jako obraz PNG.'],
    ['#printYearPdfButton', 'Otwiera roczny kalendarz do wydruku lub zapisu jako PDF.'],
    ['#tagGroupName', 'Nazwa grupy raportowej, np. Hotdog.'],
    ['#tagAliases', 'Różne wersje nazwy po przecinku, np. hotdog, hot-dog, hot doga.'],
    ['#tagRuleCategory', 'Kategoria, którą program ma przypisywać tej grupie.'],
    ['#tagRuleType', 'Opcjonalny domyślny typ wpisu dla tej reguły.'],
    ['#voiceRecordButton', 'Uruchamia rozpoznawanie mowy w szybkim panelu.'],
    ['#voiceStopButton', 'Zatrzymuje nagrywanie głosu.'],
    ['#voiceParseButton', 'Zamienia rozpoznany tekst na propozycje wpisów.'],
    ['#voiceSaveButton', 'Zapisuje rozpoznane wpisy z panelu głosowego.'],
    ['#voiceText', 'Tu możesz poprawić rozpoznany tekst przed analizą.'],
    ['#voiceCloseButton', 'Zamyka szybki panel głosowy i wraca do programu.']
  ];

  for (const [selector, text] of staticHelp) {
    const node = document.querySelector(selector);
    if (node && !node.dataset.help) node.dataset.help = text;
  }

  document.querySelectorAll('[data-help], button[title], input[title], select[title], textarea[title]').forEach(node => {
    node.classList.add('has-help');
    if (node.hasAttribute('title')) {
      node.dataset.help = node.dataset.help || node.getAttribute('title');
      node.removeAttribute('title');
    }
  });

  function positionTooltip(node) {
    const rect = node.getBoundingClientRect();
    const margin = 10;
    const topPreferred = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltip.offsetWidth - margin));
    let top = topPreferred;
    if (top + tooltip.offsetHeight + margin > window.innerHeight) {
      top = Math.max(margin, rect.top - tooltip.offsetHeight - 8);
    }
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function showTooltipFor(node, text, autoHide = false) {
    if (!node || !text) return;
    window.clearTimeout(hideTimer);
    activeNode = node;
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    positionTooltip(node);
    if (autoHide) hideTimer = window.setTimeout(hideTooltip, 4200);
  }

  function hideTooltip() {
    window.clearTimeout(hideTimer);
    window.clearTimeout(showTimer);
    pendingNode = null;
    tooltip.classList.remove('visible');
    activeNode = null;
  }

  function scheduleTooltipFor(node, text, delay = 650) {
    if (!node || !text) return;
    window.clearTimeout(showTimer);
    pendingNode = node;
    showTimer = window.setTimeout(() => {
      if (pendingNode !== node) return;
      showTooltipFor(node, text);
    }, delay);
  }

  document.addEventListener('pointerdown', event => {
    lastPointerType = event.pointerType || '';
  }, { passive: true });

  document.addEventListener('mouseover', event => {
    if (isTouchTooltipMode() || lastPointerType === 'touch') return;
    const { node, text } = getHelpText(event.target);
    if (node && text) scheduleTooltipFor(node, text, 700);
  });

  document.addEventListener('mouseout', event => {
    const related = event.relatedTarget;
    if (pendingNode && !pendingNode.contains(related)) {
      window.clearTimeout(showTimer);
      pendingNode = null;
    }
    if (!activeNode) return;
    if (!activeNode.contains(related)) hideTooltip();
  });

  document.addEventListener('focusin', event => {
    if (isTouchTooltipMode() || lastPointerType === 'touch') return;
    const { node, text } = getHelpText(event.target);
    if (node && text) scheduleTooltipFor(node, text, 700);
  });

  document.addEventListener('focusout', hideTooltip);

  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    const { node, text } = getHelpText(event.target);
    if (!node || !text) return;
    longPressFired = false;
    window.clearTimeout(longPressTimer);
    longPressTimer = window.setTimeout(() => {
      longPressFired = true;
      suppressClickNode = node;
      showTooltipFor(node, text, true);
    }, 560);
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    window.clearTimeout(longPressTimer);
    if (longPressFired) window.setTimeout(() => { longPressFired = false; }, 80);
  });

  document.addEventListener('pointercancel', () => {
    window.clearTimeout(longPressTimer);
    longPressFired = false;
  });

  document.addEventListener('click', event => {
    if (suppressClickNode && suppressClickNode.contains(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickNode = null;
    }
  }, true);

  window.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', () => activeNode ? positionTooltip(activeNode) : undefined);
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

      if (!database.objectStoreNames.contains(LEARNING_RULE_STORE)) {
        const learningStore = database.createObjectStore(LEARNING_RULE_STORE, { keyPath: 'id' });
        learningStore.createIndex('normalizedPhrase', 'normalizedPhrase', { unique: false });
        learningStore.createIndex('category', 'category', { unique: false });
        learningStore.createIndex('updatedAt', 'updatedAt', { unique: false });
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

const DEFAULT_MAIN_REPORT_SETTINGS = {
  rows: {
    computers: true,
    installations: true,
    homeExpense: true,
    companyResult: true
  },
  categoryRows: [],
  customGroups: []
};

function getMainReportSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MAIN_REPORT_SETTINGS_KEY) || '{}');
    return {
      rows: {
        ...DEFAULT_MAIN_REPORT_SETTINGS.rows,
        ...(parsed.rows && typeof parsed.rows === 'object' ? parsed.rows : {})
      },
      categoryRows: Array.isArray(parsed.categoryRows)
        ? parsed.categoryRows.map(item => normalizeKnownCategory(item, String(item))).filter(Boolean)
        : [],
      customGroups: Array.isArray(parsed.customGroups)
        ? parsed.customGroups.map(item => String(item)).filter(Boolean)
        : []
    };
  } catch (_) {
    return structuredClone(DEFAULT_MAIN_REPORT_SETTINGS);
  }
}

function saveMainReportSettings(settings) {
  try {
    localStorage.setItem(MAIN_REPORT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {}
}

function resetMainReportSettings() {
  saveMainReportSettings(DEFAULT_MAIN_REPORT_SETTINGS);
  renderMainReportSettings();
  renderMainReport();
  showMessage('Przywrócono domyślny raport główny.');
}

function availableCustomReportGroups() {
  const ignored = new Set(['Komputerowe', 'Montaże', 'Antenowe', 'Monitoring', 'Usługi', 'Dom', 'Jedzenie']);
  const groups = new Map();

  for (const rule of tagRules || []) {
    const name = String(rule.name || '').trim();
    if (name && !ignored.has(name)) groups.set(name, rule.category || 'Reguła tagu');
  }

  for (const entry of allEntries || []) {
    const group = String(resolveReportGroup(entry) || '').trim();
    if (group && !ignored.has(group) && group !== (entry.category || '')) {
      groups.set(group, entry.category || 'Wpis');
    }
  }

  return Array.from(groups.entries())
    .map(([name, source]) => ({ name, source }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

function summarizeGroup(entries, groupName) {
  return summarize(entries.filter(entry => resolveReportGroup(entry) === groupName));
}

function renderMainReportSettings() {
  if (!el.mainReportSettings) return;
  const settings = getMainReportSettings();
  const groups = availableCustomReportGroups();
  const selected = new Set(settings.customGroups);
  const selectedCategories = new Set(settings.categoryRows || []);
  const categories = getAllCategories();

  const fixedRows = [
    ['computers', 'Komputerowe', 'Pokazuje bilans kategorii Komputerowe.'],
    ['installations', 'Montaże', 'Pokazuje bilans montażowy: Montaże, Antenowe, Monitoring i Usługi.'],
    ['homeExpense', 'Wydatki domowe', 'Pokazuje wydatki domowe oddzielnie od wyniku firmy.'],
    ['companyResult', 'Wynik firmy / wypłata', 'Pokazuje przychody firmowe minus koszty firmowe, bez wydatków domowych.']
  ];

  const fixedHtml = fixedRows.map(([key, label, help]) => `
    <label class="report-option">
      <input type="checkbox" data-report-row="${escapeHtml(key)}" ${settings.rows[key] ? 'checked' : ''}>
      <span><b>${escapeHtml(label)}</b><small>${escapeHtml(help)}</small></span>
    </label>
  `).join('');

  const categoryHtml = categories.map(category => `
    <label class="report-option compact-report-option">
      <input type="checkbox" data-report-category="${escapeHtml(category)}" ${selectedCategories.has(category) ? 'checked' : ''}>
      <span><b>${escapeHtml(category)}</b><small>Dokładna kategoria na stronie startowej</small></span>
    </label>
  `).join('');

  const groupsHtml = groups.length ? groups.map(group => `
    <label class="report-option compact-report-option">
      <input type="checkbox" data-report-group="${escapeHtml(group.name)}" ${selected.has(group.name) ? 'checked' : ''}>
      <span><b>${escapeHtml(group.name)}</b><small>${escapeHtml(group.source)}</small></span>
    </label>
  `).join('') : '<div class="empty-state small-empty">Brak własnych grup. Dodaj regułę w bazie tagów albo dodaj wpis pasujący do reguły.</div>';

  el.mainReportSettings.innerHTML = `
    <div class="report-settings-block">
      <h3>Stałe podsumowania</h3>
      <div class="report-option-grid">${fixedHtml}</div>
    </div>
    <div class="report-settings-block">
      <h3>Kategorie widoczne na stronie startowej</h3>
      <p class="muted-small">Tu wybierasz pełnoprawne kategorie, które mają mieć osobny kafelek w raporcie głównym.</p>
      <div class="report-option-grid">${categoryHtml}</div>
    </div>
    <div class="report-settings-block">
      <h3>Własne grupy/tagi w raporcie głównym</h3>
      <p class="muted-small">Grupy/tagi są podgrupami opisów, np. Hotdog, Kia, Orlen. Kategoria dalej zostaje kategorią nadrzędną.</p>
      <div class="report-option-grid">${groupsHtml}</div>
    </div>
  `;
}

function handleMainReportSettingsChange(event) {
  const input = event.target.closest('input[type="checkbox"]');
  if (!input) return;
  const settings = getMainReportSettings();

  if (input.dataset.reportRow) {
    settings.rows[input.dataset.reportRow] = input.checked;
  }

  if (input.dataset.reportCategory) {
    const category = input.dataset.reportCategory;
    const selectedCategories = new Set(settings.categoryRows || []);
    if (input.checked) selectedCategories.add(category);
    else selectedCategories.delete(category);
    settings.categoryRows = Array.from(selectedCategories).sort((a, b) => a.localeCompare(b, 'pl'));
  }

  if (input.dataset.reportGroup) {
    const group = input.dataset.reportGroup;
    const selected = new Set(settings.customGroups);
    if (input.checked) selected.add(group);
    else selected.delete(group);
    settings.customGroups = Array.from(selected).sort((a, b) => a.localeCompare(b, 'pl'));
  }

  saveMainReportSettings(settings);
  renderMainReport();
}


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


function parseMoneyInputValue(raw) {
  const source = String(raw ?? '').trim();
  const sign = /^\s*-/.test(source) ? -1 : 1;
  const value = parseLooseAmount(source);
  return Number.isFinite(value) ? Math.round(value * sign * 100) / 100 : 0;
}

function normalizeWalletMonthRecord(record = {}) {
  return {
    initialBalance: Number(record.initialBalance ?? record.initial_balance ?? 0) || 0,
    adjustment: Number(record.adjustment ?? record.korekta ?? 0) || 0,
    updatedAt: record.updatedAt || record.updated_at || new Date().toISOString()
  };
}

function getWalletMonths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WALLET_MONTHS_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (/^20\d{2}-\d{2}$/.test(key)) result[key] = normalizeWalletMonthRecord(value);
    }
    return result;
  } catch (_) {
    return {};
  }
}

function saveWalletMonths(months) {
  try { localStorage.setItem(WALLET_MONTHS_KEY, JSON.stringify(months || {})); } catch (_) {}
}

function getWalletMonthRecord(month) {
  const months = getWalletMonths();
  return normalizeWalletMonthRecord(months[month] || {});
}

function saveWalletMonthRecord(month, changes = {}) {
  if (!/^20\d{2}-\d{2}$/.test(month || '')) return;
  const months = getWalletMonths();
  months[month] = normalizeWalletMonthRecord({
    ...(months[month] || {}),
    ...changes,
    updatedAt: new Date().toISOString()
  });
  saveWalletMonths(months);
}

function importWalletMonthsFromPayload(payload, replace = false) {
  const incoming = payload?.walletMonths || payload?.wallet_months || null;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return;
  const current = replace ? {} : getWalletMonths();

  for (const [month, rawRecord] of Object.entries(incoming)) {
    if (!/^20\d{2}-\d{2}$/.test(month)) continue;
    const normalized = normalizeWalletMonthRecord(rawRecord);
    const oldRecord = current[month];
    const incomingTime = Date.parse(normalized.updatedAt || '') || 0;
    const oldTime = Date.parse(oldRecord?.updatedAt || '') || 0;
    if (replace || !oldRecord || incomingTime >= oldTime) current[month] = normalized;
  }

  saveWalletMonths(current);
}

function importCustomCategoriesFromPayload(payload, replace = false) {
  const incoming = payload?.customCategories || payload?.custom_categories || [];
  if (!Array.isArray(incoming)) return;
  const next = replace ? [] : [...customCategories];
  const defaultKeys = new Set(CATEGORIES.map(categoryKey));
  const seen = new Set(next.map(categoryKey));
  for (const item of incoming) {
    const name = sanitizeCategoryName(item);
    const key = categoryKey(name);
    if (name && key && !defaultKeys.has(key) && !seen.has(key)) {
      next.push(name);
      seen.add(key);
    }
  }
  saveCustomCategories(next);

  const importedSettings = payload?.mainReportSettings || payload?.main_report_settings || null;
  if (importedSettings && typeof importedSettings === 'object') {
    const currentSettings = replace ? structuredClone(DEFAULT_MAIN_REPORT_SETTINGS) : getMainReportSettings();
    const categoryRows = Array.isArray(importedSettings.categoryRows) ? importedSettings.categoryRows : [];
    currentSettings.categoryRows = uniqueCategoryList([...(currentSettings.categoryRows || []), ...categoryRows])
      .filter(category => isKnownCategory(category));
    saveMainReportSettings(currentSettings);
  }

  refreshCategorySelects();
  renderCustomCategoriesList();
  renderMainReportSettings();
}

function isCashPayment(entry) {
  return normalizeText(entry?.paymentMethod || '') === 'gotowka';
}

function walletMonthsFromEntries() {
  const months = new Set([monthKey(todayISO())]);
  for (const entry of allEntries || []) {
    if (entry.entryDate && /^20\d{2}-\d{2}/.test(entry.entryDate)) months.add(monthKey(entry.entryDate));
  }
  for (const month of Object.keys(getWalletMonths())) months.add(month);
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

function summarizeWalletMonth(month) {
  const record = getWalletMonthRecord(month);
  const monthEntries = (allEntries || []).filter(entry => entry.entryDate?.startsWith(month) && isCashPayment(entry));
  let cashIncome = 0;
  let cashExpense = 0;

  for (const entry of monthEntries) {
    const amount = Number(entry.amount) || 0;
    if (entry.entryType === 'przychód') cashIncome += amount;
    else cashExpense += amount;
  }

  const balance = record.initialBalance + cashIncome - cashExpense + record.adjustment;
  return { ...record, cashIncome, cashExpense, balance, entries: monthEntries };
}

function renderWalletReport() {
  if (!el.walletReport) return;
  const months = walletMonthsFromEntries();
  const currentMonth = monthKey(todayISO());
  const selectedMonth = el.walletMonth?.value || currentMonth;
  const safeMonth = months.includes(selectedMonth) ? selectedMonth : currentMonth;

  if (el.walletMonth) {
    const previous = el.walletMonth.value || safeMonth;
    el.walletMonth.innerHTML = months.map(month => `<option value="${escapeHtml(month)}">${escapeHtml(month)}</option>`).join('');
    el.walletMonth.value = months.includes(previous) ? previous : safeMonth;
  }

  const month = el.walletMonth?.value || safeMonth;
  const summary = summarizeWalletMonth(month);
  if (el.walletInitialBalance && document.activeElement !== el.walletInitialBalance) el.walletInitialBalance.value = String(summary.initialBalance).replace('.', ',');
  if (el.walletAdjustment && document.activeElement !== el.walletAdjustment) el.walletAdjustment.value = String(summary.adjustment).replace('.', ',');

  const lastCashEntries = summary.entries
    .slice()
    .sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 6);

  const entriesHtml = lastCashEntries.length ? `
    <div class="wallet-entry-list">
      ${lastCashEntries.map(entry => `
        <div class="wallet-entry">
          <span>${escapeHtml(entry.entryDate)} · ${escapeHtml(entry.description || entry.category || 'Wpis')}</span>
          <strong class="${entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense'}">${entry.entryType === 'przychód' ? '+' : '-'}${formatMoney(entry.amount)}</strong>
        </div>
      `).join('')}
    </div>
  ` : '<div class="empty-state small-empty">Brak gotówkowych wpisów w tym miesiącu.</div>';

  el.walletReport.innerHTML = `
    <div class="category-row wallet-result-row">
      <div><strong>Stan portfela</strong><br><small>${escapeHtml(month)} · tylko wpisy z płatnością „Gotówka”</small></div>
      <b class="${summary.balance >= 0 ? 'amount-income' : 'amount-expense'}">${formatMoney(summary.balance)}</b>
    </div>
    <div class="wallet-mini-grid">
      <div><span>Stan początkowy</span><strong>${formatMoney(summary.initialBalance)}</strong></div>
      <div><span>Przychody gotówką</span><strong class="amount-income">+${formatMoney(summary.cashIncome)}</strong></div>
      <div><span>Wydatki gotówką</span><strong class="amount-expense">-${formatMoney(summary.cashExpense)}</strong></div>
      <div><span>Korekta ręczna</span><strong>${summary.adjustment >= 0 ? '+' : ''}${formatMoney(summary.adjustment)}</strong></div>
    </div>
    ${entriesHtml}
  `;
}

function saveWalletFormValues() {
  const month = el.walletMonth?.value || monthKey(todayISO());
  saveWalletMonthRecord(month, {
    initialBalance: parseMoneyInputValue(el.walletInitialBalance?.value || '0'),
    adjustment: parseMoneyInputValue(el.walletAdjustment?.value || '0')
  });
  renderWalletReport();
  scheduleDropboxAutoSync();
  showMessage('Zapisano ustawienia portfela gotówkowego.');
}

function topGroupBy(entries, keyGetter) {
  const map = new Map();
  for (const entry of entries || []) {
    const key = keyGetter(entry) || 'Inne';
    const row = map.get(key) || { name: key, count: 0, total: 0 };
    row.count += 1;
    row.total += Number(entry.amount) || 0;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)[0] || null;
}

function renderSmartReports() {
  if (!el.smartReport) return;
  const entries = filteredEntries || [];
  if (!entries.length) {
    el.smartReport.innerHTML = '<div class="empty-state">Brak danych do inteligentnych wniosków.</div>';
    return;
  }

  const summary = summarize(entries);
  const company = summarizeMainReport(entries).company;
  const expenses = entries.filter(entry => entry.entryType === 'wydatek');
  const incomes = entries.filter(entry => entry.entryType === 'przychód');
  const topExpenseGroup = topGroupBy(expenses, entry => resolveReportGroup(entry) || entry.category);
  const topIncomeGroup = topGroupBy(incomes, entry => resolveReportGroup(entry) || entry.category);
  const biggestExpense = expenses.slice().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0];
  const biggestIncome = incomes.slice().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0];
  const uniqueExpenseDays = new Set(expenses.map(entry => entry.entryDate).filter(Boolean)).size || 1;
  const avgDailyExpense = expenses.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) / uniqueExpenseDays;
  const companyExpenseShare = company.income > 0 ? Math.round((company.expense / company.income) * 100) : 0;

  const rows = [
    ['Wynik z widocznych wpisów', `Przychody ${formatMoney(summary.income)} · wydatki ${formatMoney(summary.expense)}`, summary.balance],
    ['Wynik firmy / wypłata', `Bez wydatków domowych · udział kosztów firmowych: ${companyExpenseShare}%`, company.balance],
    ['Średni wydatek dzienny', `Liczony z dni, w których były wydatki: ${uniqueExpenseDays}`, -avgDailyExpense]
  ];

  if (topExpenseGroup) rows.push(['Największa grupa wydatków', `${topExpenseGroup.name} · wpisy: ${topExpenseGroup.count}`, -topExpenseGroup.total]);
  if (topIncomeGroup) rows.push(['Największa grupa przychodów', `${topIncomeGroup.name} · wpisy: ${topIncomeGroup.count}`, topIncomeGroup.total]);
  if (biggestExpense) rows.push(['Największy pojedynczy wydatek', `${biggestExpense.entryDate} · ${biggestExpense.description || biggestExpense.category}`, -Number(biggestExpense.amount || 0)]);
  if (biggestIncome) rows.push(['Największy pojedynczy przychód', `${biggestIncome.entryDate} · ${biggestIncome.description || biggestIncome.category}`, Number(biggestIncome.amount || 0)]);

  el.smartReport.innerHTML = rows.map(([title, note, value]) => mainReportRow(title, note, value, 'smart-report-row')).join('');
}

function recurringTextKey(entry) {
  const source = [entry.reportGroup, entry.description, entry.originalText, entry.category]
    .filter(Boolean)
    .join(' ');
  const normalized = normalizeText(source)
    .replace(/\b\d+[,.]?\d*\b/g, ' ')
    .replace(/\b(zl|pln|za|dla|u|w|na|do|od|i|oraz|kupilem|kupilam|zaplacilem|zaplacilam|wydatek|platnosc|gotowka|karta|blik|bank)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = normalized.split(' ').filter(token => token.length > 2).slice(0, 5);
  return tokens.join(' ') || normalizeText(entry.category || 'inne');
}

function daysBetweenISO(a, b) {
  const first = Date.parse(`${a}T12:00:00`);
  const second = Date.parse(`${b}T12:00:00`);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return 0;
  return Math.round((second - first) / 86400000);
}

function detectRecurringExpenses(entries) {
  const groups = new Map();
  for (const entry of entries || []) {
    if (entry.entryType !== 'wydatek' || !entry.entryDate) continue;
    const key = recurringTextKey(entry);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  const result = [];
  for (const [key, items] of groups.entries()) {
    if (items.length < 2) continue;
    const sorted = items.slice().sort((a, b) => String(a.entryDate).localeCompare(String(b.entryDate)));
    const diffs = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const diff = daysBetweenISO(sorted[i - 1].entryDate, sorted[i].entryDate);
      if (diff > 0) diffs.push(diff);
    }
    if (!diffs.length) continue;

    const avgDiff = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
    const candidates = [
      { label: 'co tydzień', days: 7 },
      { label: 'co 2 tygodnie', days: 14 },
      { label: 'co miesiąc', days: 30 }
    ];
    const best = candidates
      .map(candidate => ({ ...candidate, error: Math.abs(avgDiff - candidate.days) }))
      .sort((a, b) => a.error - b.error)[0];

    let label = '';
    let cycleDays = Math.round(avgDiff);
    if (best && best.error <= 7) {
      label = best.label;
      cycleDays = best.days;
    } else if (items.length >= 3) {
      label = 'często wraca';
    } else {
      continue;
    }

    const avgAmount = sorted.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) / sorted.length;
    const last = sorted[sorted.length - 1];
    const nextDate = label === 'często wraca' ? '—' : addDaysISO(last.entryDate, cycleDays);
    const variance = diffs.reduce((sum, diff) => sum + Math.abs(diff - avgDiff), 0) / diffs.length;
    const confidence = Math.max(45, Math.min(98, Math.round(100 - best.error * 4 - variance + Math.min(sorted.length, 8) * 3)));

    result.push({
      key,
      label,
      count: sorted.length,
      avgAmount,
      lastDate: last.entryDate,
      nextDate,
      confidence,
      category: last.category || 'Inne'
    });
  }

  return result.sort((a, b) => b.confidence - a.confidence || b.count - a.count).slice(0, 12);
}

function renderRecurringReport() {
  if (!el.recurringReport) return;
  const rows = detectRecurringExpenses(filteredEntries || []);
  if (!rows.length) {
    el.recurringReport.innerHTML = '<div class="empty-state">Brak wykrytych wydatków cyklicznych w aktualnym filtrze.</div>';
    return;
  }

  el.recurringReport.innerHTML = rows.map(row => `
    <div class="category-row recurring-row">
      <div>
        <strong>${escapeHtml(row.key)}</strong><br>
        <small>${escapeHtml(row.category)} · ${escapeHtml(row.label)} · wpisy: ${row.count} · ostatnio: ${escapeHtml(row.lastDate)} · następny: ${escapeHtml(row.nextDate)}</small>
      </div>
      <b>${formatMoney(row.avgAmount)}<br><small>${row.confidence}%</small></b>
    </div>
  `).join('');
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

function hasActiveMainReportFilters() {
  return Boolean(
    el.searchQuery?.value ||
    el.filterFrom?.value ||
    el.filterTo?.value ||
    el.filterType?.value ||
    el.filterScope?.value ||
    el.filterCategory?.value ||
    el.filterPayment?.value
  );
}

function getMainReportEntries() {
  if (hasActiveMainReportFilters()) return filteredEntries;
  const currentMonth = monthKey(todayISO());
  return allEntries.filter(entry => monthKey(entry.entryDate) === currentMonth);
}

function summarizePayout(entries) {
  return summarize(entries.filter(isFirmEntry));
}

function renderMainReport() {
  if (!el.mainReport) return;

  const reportEntries = getMainReportEntries();

  if (!reportEntries.length) {
    el.mainReport.innerHTML = '<div class="empty-state">Brak danych do raportu głównego.</div>';
    return;
  }

  const settings = getMainReportSettings();
  const report = summarizeMainReport(reportEntries);
  const rows = [];

  if (settings.rows.computers) {
    rows.push(mainReportRow(
      'Komputerowe',
      `Przychody ${formatMoney(report.computers.income)} · koszty ${formatMoney(report.computers.expense)}`,
      report.computers.balance
    ));
  }

  if (settings.rows.installations) {
    rows.push(mainReportRow(
      'Montaże',
      `Przychody ${formatMoney(report.installations.income)} · koszty ${formatMoney(report.installations.expense)} · obejmuje: Montaże, Antenowe, Monitoring, Usługi`,
      report.installations.balance
    ));
  }

  if (settings.rows.homeExpense) {
    rows.push(mainReportRow(
      'Wydatki domowe',
      'Nie są odejmowane od wyniku firmy.',
      -report.homeExpense,
      'home-report-row'
    ));
  }

  if (settings.rows.companyResult) {
    rows.push(mainReportRow(
      'Wynik firmy / wypłata',
      `Przychody firmowe ${formatMoney(report.company.income)} - koszty firmowe ${formatMoney(report.company.expense)}. Wydatki domowe pominięte.`,
      report.company.balance,
      'company-result-row'
    ));
  }

  for (const categoryName of settings.categoryRows || []) {
    const categorySummary = summarize(reportEntries.filter(entry => entry.category === categoryName));
    if (!categorySummary.income && !categorySummary.expense) continue;
    rows.push(mainReportRow(
      categoryName,
      `Kategoria · przychody ${formatMoney(categorySummary.income)} · koszty ${formatMoney(categorySummary.expense)}`,
      categorySummary.balance,
      'category-report-row'
    ));
  }

  for (const groupName of settings.customGroups || []) {
    const groupSummary = summarizeGroup(reportEntries, groupName);
    if (!groupSummary.income && !groupSummary.expense) continue;
    rows.push(mainReportRow(
      groupName,
      `Własna grupa/tag · przychody ${formatMoney(groupSummary.income)} · koszty ${formatMoney(groupSummary.expense)}`,
      groupSummary.balance,
      'custom-report-row'
    ));
  }

  el.mainReport.innerHTML = rows.length
    ? rows.join('')
    : '<div class="empty-state">Wszystkie kafelki raportu głównego są ukryte. Zmień to w Ustawieniach.</div>';
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

function getHeatTone(dayData) {
  const income = Number(dayData?.income || 0);
  const expense = Number(dayData?.expense || 0);
  if (!dayData?.count || (!income && !expense)) return 'neutral';
  if (income > 0 && expense <= 0) return 'income';
  if (expense > 0 && income <= 0) return 'expense';
  return income >= expense ? 'income' : 'expense';
}

function getHeatValueForTone(dayData, tone) {
  if (tone === 'income') return Number(dayData?.income || 0);
  if (tone === 'expense') return Number(dayData?.expense || 0);
  return Number(dayData?.activity || 0);
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
  const payout = summarizePayout(dayEntries);
  el.calendarDayDetails.innerHTML = `
    <div class="calendar-day-summary">
      <strong>${escapeHtml(selectedCalendarDate)}</strong>
      <span>Wpisy: ${dayEntries.length} · Przychody ${formatMoney(summary.income)} · Wydatki ${formatMoney(summary.expense)} · Bilans ${formatMoney(summary.balance)} · Wypłata ${formatMoney(payout.balance)}</span>
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
              <button class="secondary" type="button" data-action="edit" data-id="${entry.id}" data-help="Otwiera ten wpis w formularzu edycji.">Edytuj</button>
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
  const monthPayout = summarizePayout(monthEntries);

  el.calendarMonthLabel.textContent = `${CALENDAR_MONTHS_PL[monthIndex]} ${year}`;
  el.calendarMonthSummary.textContent = `Wpisy: ${monthEntries.length} · Przychody ${formatMoney(monthSummary.income)} · Wydatki ${formatMoney(monthSummary.expense)} · Bilans ${formatMoney(monthSummary.balance)} · Wypłata ${formatMoney(monthPayout.balance)}`;

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
  const yearPayout = summarizePayout(yearEntries);
  const entriesByDate = new Map();
  const activityByDate = new Map();

  yearEntries.forEach(entry => {
    const dateKey = entry.entryDate;
    if (!dateKey) return;
    if (!entriesByDate.has(dateKey)) entriesByDate.set(dateKey, []);
    entriesByDate.get(dateKey).push(entry);
  });

  let maxActivity = 0;
  let maxIncome = 0;
  let maxExpense = 0;
  entriesByDate.forEach((items, dateKey) => {
    const dayActivity = summarizeDayActivity(items);
    activityByDate.set(dateKey, dayActivity);
    if (dayActivity.activity > maxActivity) maxActivity = dayActivity.activity;
    if (dayActivity.income > maxIncome) maxIncome = dayActivity.income;
    if (dayActivity.expense > maxExpense) maxExpense = dayActivity.expense;
  });

  el.yearCalendarLabel.textContent = `Rok ${year}`;
  el.yearCalendarSummary.textContent = `Wpisy: ${yearEntries.length} · Przychody ${formatMoney(yearSummary.income)} · Wydatki ${formatMoney(yearSummary.expense)} · Bilans ${formatMoney(yearSummary.balance)} · Wypłata ${formatMoney(yearPayout.balance)}`;

  const monthsHtml = CALENDAR_MONTHS_PL.map((monthName, monthIndex) => {
    const monthPrefix = buildMonthKey(year, monthIndex);
    const daysInMonth = new Date(year, monthIndex + 1, 0, 12, 0, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const monthEntries = yearEntries.filter(entry => entry.entryDate?.startsWith(monthPrefix));
    const monthSummary = summarize(monthEntries);
    const monthPayout = summarizePayout(monthEntries);
    const monthBalanceClass = monthSummary.balance >= 0 ? 'amount-income' : 'amount-expense';

    const dayCells = [];
    for (let i = 0; i < leadingBlanks; i += 1) {
      dayCells.push('<span class="year-day is-empty" aria-hidden="true"></span>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateISO = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const dayData = activityByDate.get(dateISO) || { income: 0, expense: 0, balance: 0, count: 0, activity: 0 };
      const heatTone = getHeatTone(dayData);
      const heatValue = getHeatValueForTone(dayData, heatTone);
      const heatMax = heatTone === 'income' ? maxIncome : heatTone === 'expense' ? maxExpense : maxActivity;
      const heatLevel = getHeatLevel(heatValue, heatMax);
      const isToday = dateISO === today;
      const isSelected = dateISO === selectedCalendarDate;
      const title = `${dateISO}\nWpisy: ${dayData.count}\nPrzychody: ${formatMoney(dayData.income)}\nWydatki: ${formatMoney(dayData.expense)}\nBilans: ${formatMoney(dayData.balance)}`;
      const classes = [
        'year-day',
        `heat-level-${heatLevel}`,
        `heat-tone-${heatTone}`,
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
        <small>Wpisy: ${monthEntries.length} · Obrót ${formatMoney(monthSummary.income + monthSummary.expense)} · Wypłata ${formatMoney(monthPayout.balance)}</small>
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
  renderSmartReports();
  renderRecurringReport();
  renderWalletReport();
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
        <button class="secondary" type="button" data-rule-action="edit" data-id="${escapeHtml(rule.id)}" data-help="Edytuje regułę tagów i wariantów nazw.">Edytuj</button>
        <button class="danger" type="button" data-rule-action="delete" data-id="${escapeHtml(rule.id)}" data-help="Usuwa tę regułę tagów. Nie usuwa wpisów finansowych.">Usuń</button>
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
  renderMainReportSettings();
  applyFilters();
  showMessage('Reguła tagów zapisana.');
}

async function handleTagRuleDelete(id) {
  const rule = tagRules.find(item => item.id === id);
  if (!rule) return;
  if (!window.confirm(`Usunąć regułę: ${rule.name}? Wpisy nie zostaną usunięte.`)) return;
  await deleteTagRule(id);
  await reloadTagRules();
  renderMainReportSettings();
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
            <button class="secondary" type="button" data-action="edit" data-id="${entry.id}" data-help="Otwiera ten wpis w formularzu edycji.">Edytuj</button>
            <button class="ghost" type="button" data-action="move" data-id="${entry.id}">Przenieś</button>
            <button class="danger" type="button" data-action="delete" data-id="${entry.id}" data-help="Usuwa tylko ten jeden wpis po potwierdzeniu.">Usuń</button>
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
          <button class="secondary" type="button" data-action="edit" data-id="${entry.id}" data-help="Otwiera ten wpis w formularzu edycji.">Edytuj</button>
          <button class="ghost" type="button" data-action="move" data-id="${entry.id}">Przenieś</button>
          <button class="danger" type="button" data-action="delete" data-id="${entry.id}" data-help="Usuwa tylko ten jeden wpis po potwierdzeniu.">Usuń</button>
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

  rememberDeletedEntry(entry);
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
    const previousEntry = editingId ? getEntryById(editingId) : null;
    const entry = makeEntryFromForm();
    const learned = previousEntry && previousEntry.category !== entry.category
      ? await learnFromCorrection(entry, previousEntry.category)
      : null;
    await saveEntry(entry);
    showMessage(editingId ? `Zmiany zapisane${learned ? ' i dodano naukę kategorii' : ''}.` : 'Wpis dodany.');
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
  if (isKnownCategory(raw)) return normalizeKnownCategory(raw, raw);

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
  const detected = detectCategory(`${raw} ${fallbackText}`);
  if (detected && detected !== 'Inne') return detected;
  return raw && raw.length <= 40 ? raw : 'Inne';
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

function hasBuiltInDropboxAppKey() {
  return Boolean(DROPBOX_DEFAULT_APP_KEY);
}

function getDropboxConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(DROPBOX_CONFIG_KEY) || '{}');
    return {
      appKey: String(saved.appKey || DROPBOX_DEFAULT_APP_KEY || '').trim(),
      path: String(saved.path || '/bilans_dane.json').trim() || '/bilans_dane.json'
    };
  } catch (_) {
    return { appKey: String(DROPBOX_DEFAULT_APP_KEY || '').trim(), path: '/bilans_dane.json' };
  }
}

function saveDropboxConfig() {
  const config = {
    appKey: String(el.dropboxAppKeyInput?.value || DROPBOX_DEFAULT_APP_KEY || '').trim(),
    path: String(el.dropboxFilePathInput?.value || '/bilans_dane.json').trim() || '/bilans_dane.json'
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
  if (el.dropboxAppKeyLabel) {
    el.dropboxAppKeyLabel.classList.toggle('hidden', hasBuiltInDropboxAppKey());
  }
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
    showMessage('Dropbox nie jest jeszcze skonfigurowany w tej kopii programu. Wpisz swój publiczny App Key jeden raz w pliku src/config.js. Potem zwykły użytkownik będzie tylko klikał „Połącz z Dropbox” i logował się na swoje konto.', 'error');
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
    app: 'Portfel PRO',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    syncMode: 'dropbox-merge-safe-v2',
    tagRules,
    learningRules,
    deletedEntries: getDeletedEntries(),
    walletMonths: getWalletMonths(),
    customCategories,
    mainReportSettings: getMainReportSettings(),
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
  const deletionResult = await applyImportedDeletions(payload);
  importCustomCategoriesFromPayload(payload, replace);
  await importLearningRulesFromPayload(payload, replace);
  importWalletMonthsFromPayload(payload, replace);
  const imported = collectImportedEntries(payload);

  if (!Array.isArray(imported) || !imported.length) {
    await reloadEntries();
    if (deletionResult.deleted) {
      if (!silent) showMessage(`Import zakończony. Usunięto: ${deletionResult.deleted}.`);
      return { added: 0, updated: 0, skipped: 0, deleted: deletionResult.deleted };
    }
    throw new Error('Plik JSON nie zawiera listy wpisów. Obsługiwane pola: entries, items, data, records, rows, transactions, wpisy, lista.');
  }

  const now = new Date().toISOString();
  const cleaned = imported
    .map(item => normalizeImportedEntry(item, now))
    .filter(item => item.amount > 0 && ['przychód', 'wydatek'].includes(item.entryType));

  if (!cleaned.length) throw new Error('Nie znaleziono poprawnych wpisów do importu.');

  if (replace) {
    const confirmReplace = window.confirm('Zastąpić wszystkie lokalne wpisy danymi z importowanego pliku?');
    if (!confirmReplace) return { added: 0, updated: 0, skipped: 0, deleted: deletionResult.deleted };
    await clearEntries();
    saveDeletedEntries(collectDeletedEntries(payload));
  }

  allEntries = await getAllEntries();

  if (Array.isArray(payload?.tagRules)) {
    for (const rule of payload.tagRules) await saveTagRule(normalizeRule(rule));
    await reloadTagRules();
  }

  const existingBySyncId = new Map(allEntries.filter(entry => entry.syncId).map(entry => [entry.syncId, entry]));
  const existingSignatures = new Set(allEntries.map(entrySignature));
  const localDeletedBySyncId = deletedEntriesMap();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of cleaned) {
    if (!replace && isEntryBlockedByDeletion(incoming, localDeletedBySyncId)) {
      skipped += 1;
      continue;
    }

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
  if (!silent) showMessage(`Import zakończony. Dodano: ${added}, zaktualizowano: ${updated}, pominięto: ${skipped}, usunięto: ${deletionResult.deleted}.`);
  return { added, updated, skipped, deleted: deletionResult.deleted };
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
  link.download = `portfel-pro-backup-${todayISO()}.json`;
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
  const entriesToDelete = allEntries.length ? [...allEntries] : await getAllEntries();

  if (!entriesToDelete.length) {
    showMessage('Nie ma danych do usunięcia.');
    return;
  }

  const first = window.confirm('Usunąć wszystkie wpisy z lokalnej bazy tej przeglądarki?');
  if (!first) return;

  const second = window.confirm('To jest operacja nieodwracalna, jeśli nie masz eksportu JSON. Na pewno usunąć?');
  if (!second) return;

  rememberDeletedEntries(entriesToDelete);
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

function isStandaloneDisplay() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMainInstallRemembered() {
  try { return localStorage.getItem(MAIN_INSTALL_KEY) === '1'; } catch (_) { return false; }
}

function isVoiceInstallRemembered() {
  try { return localStorage.getItem(VOICE_INSTALL_KEY) === '1'; } catch (_) { return false; }
}

function rememberInstallState(target = null) {
  const resolvedTarget = target || activeInstallTarget || (isVoiceActionRequested() ? 'voice' : 'main');
  try {
    if (resolvedTarget === 'voice') localStorage.setItem(VOICE_INSTALL_KEY, '1');
    else localStorage.setItem(MAIN_INSTALL_KEY, '1');
  } catch (_) {}
}

function hideInstallButtons() {
  el.installButton?.classList.add('hidden');
  el.installVoiceButton?.classList.add('hidden');
  el.voiceInstallNowButton?.classList.add('hidden');
}

function hideInstalledTargetButton(target = null) {
  const resolvedTarget = target || activeInstallTarget || (isVoiceActionRequested() ? 'voice' : 'main');
  if (resolvedTarget === 'voice') {
    el.installVoiceButton?.classList.add('hidden');
    el.voiceInstallNowButton?.classList.add('hidden');
  } else {
    el.installButton?.classList.add('hidden');
  }
}

function refreshInstallButtons() {
  hideInstallButtons();
  if (isFileProtocol()) return;

  if (isVoiceActionRequested()) {
    if (!isVoiceInstallRemembered()) {
      el.voiceInstallNowButton?.classList.remove('hidden');
    }
    return;
  }

  // Przycisk instalacji aplikacji ma być widoczny także wtedy, gdy Chrome jeszcze nie wysłał
  // beforeinstallprompt. Wtedy kliknięcie pokaże jasną instrukcję ręcznej instalacji z menu Chrome.
  if (!isMainInstallRemembered()) {
    el.installButton?.classList.remove('hidden');
  }

  // Osobny skrót mikrofonu wymaga wejścia w tryb ?action=voice, bo wtedy ładowany jest osobny manifest PWA.
  if (!isVoiceInstallRemembered()) {
    el.installVoiceButton?.classList.remove('hidden');
  }
}

function showInstallUnavailableMessage() {
  if (isVoiceActionRequested()) {
    showMessage('Chrome nie udostępnił automatycznego okna instalacji mikrofonu. Użyj menu Chrome → Dodaj do ekranu głównego / Zainstaluj aplikację, będąc na tym ekranie mikrofonu.', 'error');
    return;
  }
  showMessage('Chrome nie udostępnił teraz automatycznego okna instalacji. Użyj menu Chrome → Dodaj do ekranu głównego / Zainstaluj aplikację. Jeśli widzisz „Otwórz aplikację”, program jest już zainstalowany.', 'error');
}

async function runInstallPrompt(target = null) {
  activeInstallTarget = target || (isVoiceActionRequested() ? 'voice' : 'main');

  if (!deferredInstallPrompt) {
    showInstallUnavailableMessage();
    refreshInstallButtons();
    return;
  }

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  promptEvent.prompt();
  const choice = await promptEvent.userChoice;

  if (choice?.outcome === 'accepted') {
    rememberInstallState(activeInstallTarget);
    hideInstalledTargetButton(activeInstallTarget);
    showMessage(activeInstallTarget === 'voice' ? 'Skrót mikrofonu został zainstalowany.' : 'Program został zainstalowany.');
    activeInstallTarget = null;
    setTimeout(refreshInstallButtons, 300);
  } else {
    activeInstallTarget = null;
    refreshInstallButtons();
  }
}

function openVoiceInstallPage() {
  const url = new URL('./voice/index.html', window.location.href);
  url.searchParams.set('install', 'voice');
  url.searchParams.set('v', `${APP_VERSION}-${Date.now()}`);
  window.location.href = url.toString();
}

function setupInstallPrompt() {
  hideInstallButtons();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    refreshInstallButtons();
  });

  window.addEventListener('appinstalled', () => {
    const installedTarget = activeInstallTarget || (isVoiceActionRequested() ? 'voice' : 'main');
    rememberInstallState(installedTarget);
    deferredInstallPrompt = null;
    hideInstalledTargetButton(installedTarget);
    showMessage(installedTarget === 'voice' ? 'Skrót mikrofonu został zainstalowany.' : 'Program został zainstalowany.');
    activeInstallTarget = null;
    setTimeout(refreshInstallButtons, 300);
  });

  window.matchMedia?.('(display-mode: standalone)')?.addEventListener?.('change', refreshInstallButtons);
  refreshInstallButtons();

  el.installButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    runInstallPrompt('main').catch(error => showMessage(error.message || 'Nie udało się uruchomić instalacji.', 'error'));
  });

  el.installVoiceButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openVoiceInstallPage();
  });

  el.voiceInstallNowButton?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    runInstallPrompt('voice').catch(error => showMessage(error.message || 'Nie udało się uruchomić instalacji mikrofonu.', 'error'));
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

  drawText(ctx, 'Portfel PRO — kalendarz miesięczny', 70, 70, { size: 30, weight: 800, color: '#7c4d00' });
  drawText(ctx, title, 70, 115, { size: 42, weight: 900 });
  drawText(ctx, `Wpisy: ${monthEntries.length} · Przychody ${formatMoney(monthSummary.income)} · Wydatki ${formatMoney(monthSummary.expense)} · Bilans ${formatMoney(monthSummary.balance)} · Wypłata ${formatMoney(summarizePayout(monthEntries).balance)}`, 70, 175, { size: 24, color: '#667085' });

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
  const yearPayout = summarizePayout(yearEntries);
  const entriesByDate = new Map();

  yearEntries.forEach(entry => {
    if (!entriesByDate.has(entry.entryDate)) entriesByDate.set(entry.entryDate, []);
    entriesByDate.get(entry.entryDate).push(entry);
  });

  let maxActivity = 0;
  let maxIncome = 0;
  let maxExpense = 0;
  const activityByDate = new Map();
  entriesByDate.forEach((items, dateKey) => {
    const data = summarizeDayActivity(items);
    activityByDate.set(dateKey, data);
    if (data.activity > maxActivity) maxActivity = data.activity;
    if (data.income > maxIncome) maxIncome = data.income;
    if (data.expense > maxExpense) maxExpense = data.expense;
  });

  drawText(ctx, 'Portfel PRO — kalendarz roczny', 70, 70, { size: 30, weight: 800, color: '#7c4d00' });
  drawText(ctx, `Rok ${year}`, 70, 115, { size: 42, weight: 900 });
  drawText(ctx, `Wpisy: ${yearEntries.length} · Przychody ${formatMoney(yearSummary.income)} · Wydatki ${formatMoney(yearSummary.expense)} · Bilans ${formatMoney(yearSummary.balance)} · Wypłata ${formatMoney(summarizePayout(yearEntries).balance)}`, 70, 175, { size: 24, color: '#667085' });

  const startX = 70;
  const startY = 255;
  const cardW = (width - 140 - 2 * 28) / 3;
  const cardH = 430;
  const gapX = 28;
  const gapY = 36;
  const heatColorsIncome = ['#ffffff', '#edf7ef', '#cfe9d4', '#9fd0ab', '#69ad7b', '#34794a'];
  const heatColorsExpense = ['#ffffff', '#fff1f0', '#ffd8d2', '#fda29b', '#f97066', '#b42318'];

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
      const data = activityByDate.get(dateISO) || { income: 0, expense: 0, balance: 0, activity: 0, count: 0 };
      const tone = getHeatTone(data);
      const value = getHeatValueForTone(data, tone);
      const maxValue = tone === 'income' ? maxIncome : tone === 'expense' ? maxExpense : maxActivity;
      const level = getHeatLevel(value, maxValue);
      const palette = tone === 'expense' ? heatColorsExpense : heatColorsIncome;

      ctx.fillStyle = palette[level] || palette[0];
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

function getCalendarPrintEntries(mode = 'month') {
  const isYear = mode === 'year';
  const entries = isYear
    ? entriesForYear(calendarYear)
    : allEntries.filter(entry => entry.entryDate?.startsWith(calendarMonth));
  return [...entries].sort((a, b) => {
    const dateCompare = String(a.entryDate || '').localeCompare(String(b.entryDate || ''));
    if (dateCompare) return dateCompare;
    const typeCompare = String(b.entryType || '').localeCompare(String(a.entryType || ''));
    if (typeCompare) return typeCompare;
    return String(a.description || '').localeCompare(String(b.description || ''), 'pl');
  });
}

function buildPrintableEntriesTable(entries) {
  if (!entries.length) return '<section class="print-details"><h2>Szczegółowe wpisy</h2><p>Brak wpisów w wybranym zakresie.</p></section>';

  const rows = entries.map(entry => {
    const amountClass = entry.entryType === 'przychód' ? 'amount-income' : 'amount-expense';
    const sign = entry.entryType === 'przychód' ? '+' : '-';
    const amount = `${sign}${formatMoney(Math.abs(Number(entry.amount || 0)))}`;
    return `
      <tr>
        <td>${escapeHtml(entry.entryDate || '')}</td>
        <td>${escapeHtml(getWeekday(entry.entryDate || '') || '')}</td>
        <td>${escapeHtml(entry.entryType || '')}</td>
        <td>${escapeHtml(formatScope(entry.scope || ''))}</td>
        <td>${escapeHtml(entry.category || '')}</td>
        <td>${escapeHtml(entry.description || '')}</td>
        <td class="${amountClass}">${escapeHtml(amount)}</td>
        <td>${escapeHtml(entry.paymentMethod || '')}</td>
        <td>${escapeHtml(Array.isArray(entry.tags) ? entry.tags.join(', ') : String(entry.tags || ''))}</td>
      </tr>`;
  }).join('');

  return `
    <section class="print-details">
      <h2>Szczegółowe wpisy</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th><th>Dzień</th><th>Typ</th><th>Rodzaj</th><th>Kategoria</th><th>Opis</th><th>Kwota</th><th>Płatność</th><th>Tagi</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function buildPrintableCalendarHtml(mode = 'month') {
  const isYear = mode === 'year';
  const title = isYear ? `Kalendarz roczny ${calendarYear}` : `Kalendarz miesięczny ${calendarMonth}`;
  const printEntries = getCalendarPrintEntries(mode);
  const summary = summarize(printEntries);
  const payout = summarizePayout(printEntries);
  const body = isYear ? el.yearCalendarGrid.innerHTML : el.calendarGrid.innerHTML;
  const extra = isYear ? el.yearTopDays.innerHTML : el.calendarDayDetails.innerHTML;
  const detailsTable = buildPrintableEntriesTable(printEntries);

  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{font-family:Arial,sans-serif;color:#1f2933;margin:24px;background:#fff;font-size:12px} h1{margin:0 0 8px;font-size:28px} h2{margin:22px 0 10px;font-size:20px}.meta{color:#667085;margin-bottom:18px}.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}.calendar-day,.year-day{border:1px solid #ddd;border-radius:8px;background:#fff;padding:8px;min-height:82px;text-align:left}.calendar-day-number{font-weight:700}.calendar-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;font-weight:700;color:#667085;margin-bottom:8px}.year-calendar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.year-month-card{border:1px solid #ddd;border-radius:12px;padding:10px;break-inside:avoid}.year-month-days,.mini-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.year-day{min-height:26px;padding:4px;text-align:center}.heat-level-0{background:#fff}.heat-tone-income.heat-level-1{background:#edf7ef}.heat-tone-income.heat-level-2{background:#cfe9d4}.heat-tone-income.heat-level-3{background:#9fd0ab}.heat-tone-income.heat-level-4{background:#69ad7b}.heat-tone-income.heat-level-5{background:#34794a;color:#fff}.heat-tone-expense.heat-level-1{background:#fff1f0}.heat-tone-expense.heat-level-2{background:#ffd8d2}.heat-tone-expense.heat-level-3{background:#fda29b}.heat-tone-expense.heat-level-4{background:#f97066}.heat-tone-expense.heat-level-5{background:#b42318;color:#fff}.amount-income{color:#067647;font-weight:700}.amount-expense{color:#b42318;font-weight:700}button{font:inherit;color:inherit}.is-empty{visibility:hidden}.print-details{margin-top:20px;break-before:auto}.print-details table{width:100%;border-collapse:collapse}.print-details th,.print-details td{border:1px solid #ddd;padding:5px 6px;vertical-align:top}.print-details th{background:#f8fafc;text-align:left}.print-details td:nth-child(6){min-width:160px}.no-print{margin-top:18px;padding:10px 14px;border:1px solid #999;border-radius:8px;background:#fff;cursor:pointer}@page{size:${isYear ? 'A4 landscape' : 'A4 portrait'};margin:10mm}@media print{body{margin:0}.no-print{display:none!important}.print-details{break-before:page}.year-month-card,.calendar-day,tr{break-inside:avoid}}
  </style></head><body><h1>${escapeHtml(title)}</h1><div class="meta">Wpisy: ${printEntries.length} · Przychody ${formatMoney(summary.income)} · Wydatki ${formatMoney(summary.expense)} · Bilans ${formatMoney(summary.balance)} · Wypłata ${formatMoney(payout.balance)} · wygenerowano ${new Date().toLocaleString('pl-PL')}</div>${isYear ? '' : '<div class="calendar-weekdays"><span>Pon</span><span>Wt</span><span>Śr</span><span>Czw</span><span>Pt</span><span>Sob</span><span>Nd</span></div>'}<main class="${isYear ? 'year-calendar-grid' : 'calendar-grid'}">${body}</main><section>${extra}</section>${detailsTable}<button class="no-print" onclick="window.print()">Drukuj / Zapisz jako PDF</button><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),500));<\/script></body></html>`;
}

function printCalendarHtmlInIframe(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) throw new Error('Nie udało się utworzyć awaryjnego widoku PDF.');
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  window.setTimeout(() => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1500);
    }
  }, 500);
}

function printCalendarPdf(mode) {
  const html = buildPrintableCalendarHtml(mode);
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if (!printWindow) {
    try {
      printCalendarHtmlInIframe(html);
      showMessage('Otworzono awaryjny widok PDF. Wybierz „Zapisz jako PDF”.');
    } catch (error) {
      showMessage(error.message || 'Przeglądarka zablokowała eksport PDF. Zezwól na wyskakujące okna dla tej aplikacji.', 'error');
    }
    return;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    showMessage('Otworzono szczegółowy widok PDF/drukowania. Wybierz „Zapisz jako PDF”.');
  } catch (error) {
    try {
      printWindow.close();
    } catch (_) {}
    try {
      printCalendarHtmlInIframe(html);
      showMessage('Otworzono awaryjny widok PDF. Wybierz „Zapisz jako PDF”.');
    } catch (fallbackError) {
      showMessage(fallbackError.message || error.message || 'Nie udało się otworzyć eksportu PDF.', 'error');
    }
  }
}

function deleteIndexedDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      resolve();
      return;
    }
    try { db?.close?.(); } catch (_) {}
    db = null;
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = event => reject(event.target.error || new Error('Nie udało się usunąć bazy IndexedDB.'));
    request.onblocked = () => reject(new Error('Baza danych jest zablokowana przez inną kartę. Zamknij inne karty z programem i spróbuj ponownie.'));
  });
}

function clearAppLocalStorage() {
  const prefixes = ['bilans-pwa-', 'portfel-pro'];
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (prefixes.some(prefix => key.startsWith(prefix))) localStorage.removeItem(key);
  }
  try { sessionStorage.clear(); } catch (_) {}
}

async function clearAppCachesAndWorkers() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bilans-pwa') || key.startsWith('portfel-pro')).map(key => caches.delete(key)));
  }

  if ('serviceWorker' in navigator && !isFileProtocol()) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
}

async function factoryResetApp() {
  const first = window.confirm('Przywrócić ustawienia fabryczne programu? Znikną wpisy, ustawienia, tagi, połączenie Dropbox i lokalna baza tej przeglądarki.');
  if (!first) return;

  const code = window.prompt('Dla bezpieczeństwa wpisz RESET, żeby potwierdzić przywrócenie ustawień fabrycznych.');
  if (code !== 'RESET') {
    showMessage('Reset fabryczny anulowany. Nie wpisano RESET.', 'error');
    return;
  }

  const shouldClearDropbox = getStorageMode() === 'dropbox' && hasDropboxConnection() && window.confirm('Wyczyścić także plik danych w Dropboxie? Jeśli wybierzesz NIE, reset dotyczy tylko tej przeglądarki.');

  try {
    if (shouldClearDropbox) {
      const entriesToDelete = allEntries.length ? [...allEntries] : await getAllEntries();
      if (entriesToDelete.length) rememberDeletedEntries(entriesToDelete);
      await clearEntries();
      await dropboxUploadPayload(makeExportPayload());
    }
  } catch (error) {
    const continueReset = window.confirm(`Nie udało się wyczyścić Dropboxa: ${error.message}. Kontynuować reset lokalny?`);
    if (!continueReset) return;
  }

  await deleteIndexedDatabase();
  clearAppLocalStorage();
  await clearAppCachesAndWorkers();

  const reloadUrl = new URL(window.location.href);
  reloadUrl.search = '';
  reloadUrl.searchParams.set('v', `${APP_VERSION}-${Date.now()}`);
  window.location.replace(reloadUrl.toString());
}


async function clearAppCacheAndReload() {
  const accepted = window.confirm('Wyczyścić cache tej aplikacji i uruchomić ponownie? Dane wpisów w IndexedDB nie zostaną usunięte.');
  if (!accepted) return;

  try {
    await clearAppCachesAndWorkers();

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
  const url = new URL(window.location.href);
  const path = url.pathname.replace(/\/+$/, '');
  return url.searchParams.get('action') === 'voice' || path.endsWith('/voice') || path.endsWith('/voice/index.html');
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
  if (isVoiceActionRequested()) {
    openVoiceMode();
    const params = new URLSearchParams(window.location.search);
    if (params.get('install') === 'voice') {
      setVoiceStatus('Kliknij „Zainstaluj mikrofon”, żeby dodać osobną ikonę szybkiego dodawania.');
    }
  }
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

  document.querySelectorAll('[data-jump-tab]').forEach(button => {
    button.addEventListener('click', () => activate(button.dataset.jumpTab));
  });

  let saved = 'start';
  try { saved = localStorage.getItem('bilans-pwa-active-tab') || 'start'; } catch (_) {}
  if (!pages.some(page => page.dataset.tabPage === saved)) saved = 'start';
  activate(saved);
}

function openFilePicker(input) {
  if (!input) return;
  input.value = '';
  input.click();
}

function bindEvents() {
  el.entryForm.addEventListener('submit', handleFormSubmit);
  el.tagRuleForm.addEventListener('submit', event => handleTagRuleSubmit(event).catch(error => showMessage(error.message, 'error')));
  if (el.tagRulesList) el.tagRulesList.addEventListener('click', handleTagRulesClick);
  if (el.learningRulesList) el.learningRulesList.addEventListener('click', handleLearningRulesClick);
  if (el.learningClearButton) el.learningClearButton.addEventListener('click', () => clearAllLearningRules().catch(error => showMessage(error.message, 'error')));
  if (el.mainReportSettings) el.mainReportSettings.addEventListener('change', handleMainReportSettingsChange);
  if (el.categoryForm) el.categoryForm.addEventListener('submit', event => handleCategoryFormSubmit(event).catch(error => showMessage(error.message, 'error')));
  if (el.customCategoriesList) el.customCategoriesList.addEventListener('click', handleCustomCategoryClick);
  if (el.mainReportResetButton) el.mainReportResetButton.addEventListener('click', resetMainReportSettings);
  if (el.walletMonth) el.walletMonth.addEventListener('change', renderWalletReport);
  if (el.walletSaveButton) el.walletSaveButton.addEventListener('click', saveWalletFormValues);
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
  if (el.clearAllButton) {
    el.clearAllButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      handleClearAll().catch(error => showMessage(error.message, 'error'));
    });
  }
  if (el.factoryResetButton) {
    el.factoryResetButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      factoryResetApp().catch(error => showMessage(error.message || 'Nie udało się przywrócić ustawień fabrycznych.', 'error'));
    });
  }
  const handleImportChange = (event, options = {}) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importJson(file, options)
      .catch(error => showMessage(error.message || 'Nie udało się zaimportować pliku.', 'error'))
      .finally(() => { event.target.value = ''; });
  };

  if (el.importButton && el.importInput) {
    el.importButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(el.importInput);
    });
    el.importInput.addEventListener('change', event => handleImportChange(event, { replace: false }));
  }

  if (el.syncImportButton && el.syncImportInput) {
    el.syncImportButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(el.syncImportInput);
    });
    el.syncImportInput.addEventListener('change', event => handleImportChange(event, { replace: false }));
  }

  if (el.replaceImportButton && el.replaceImportInput) {
    el.replaceImportButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(el.replaceImportInput);
    });
    el.replaceImportInput.addEventListener('change', event => handleImportChange(event, { replace: true }));
  }

  if (el.chooseLocalModeButton) el.chooseLocalModeButton.addEventListener('click', () => {
    setStorageMode('local');
    el.startupModePanel?.classList.add('hidden');
    showMessage('Wybrano pracę lokalną. Dane będą zapisane w tej przeglądarce.');
  });
  if (el.chooseDropboxModeButton) el.chooseDropboxModeButton.addEventListener('click', () => {
    setStorageMode('dropbox');
    el.startupModePanel?.classList.add('hidden');
    document.querySelector('[data-tab="sync"]')?.click();
    updateCloudUi('Kliknij „Połącz z Dropbox”, zaloguj się i zatwierdź dostęp.');
  });
  if (el.storageModeSelect) el.storageModeSelect.addEventListener('change', event => {
    setStorageMode(event.target.value);
    if (event.target.value === 'dropbox') updateCloudUi('Kliknij „Połącz z Dropbox”, zaloguj się i zatwierdź dostęp.');
  });
  if (el.dropboxAppKeyInput) el.dropboxAppKeyInput.addEventListener('change', saveDropboxConfig);
  if (el.dropboxFilePathInput) el.dropboxFilePathInput.addEventListener('change', saveDropboxConfig);
  if (el.dropboxAdvancedToggle) el.dropboxAdvancedToggle.addEventListener('click', () => {
    el.dropboxAdvancedPanel?.classList.toggle('hidden');
  });
  if (el.dropboxConnectButton) el.dropboxConnectButton.addEventListener('click', () => startDropboxAuth().catch(error => showMessage(error.message, 'error')));
  if (el.dropboxDisconnectButton) el.dropboxDisconnectButton.addEventListener('click', disconnectDropbox);
  if (el.dropboxSyncNowButton) el.dropboxSyncNowButton.addEventListener('click', () => syncDropboxNow().catch(error => {
    updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`);
    showMessage(error.message, 'error');
  }));

}

async function init() {
  const today = todayISO();
  document.title = 'Portfel PRO';
  if (el.appVersionBadge) el.appVersionBadge.textContent = 'v. 1.1 / 118';
  setTodayHeader('wczytywanie...');
  if (isFileProtocol()) {
    showMessage('Program został otwarty bezpośrednio z index.html. Do importu JSON, PWA i cache użyj serwera lokalnego albo GitHub Pages.', 'error');
  }
  if (el.syncInfo) el.syncInfo.textContent = `Tryb „Połącz” dopisuje nowe wpisy i aktualizuje starsze wersje tych samych wpisów. ID urządzenia: ${getDeviceId()}.`;
  refreshCategorySelects();
  if (el.tagRuleCategory.options.length === 0) fillSelect(el.tagRuleCategory, getAllCategories());
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
  await reloadLearningRules();
  await ensureEntrySyncIds();
  renderTagRules();
  renderCustomCategoriesList();
  renderMainReportSettings();
  el.tagRuleCategory.value = 'Inne';
  await reloadEntries();
  refreshCategorySelects();
  renderCustomCategoriesList();
  renderMainReportSettings();
  bindEvents();
  setupTabs();
  setupThemes();
  setupSmartTooltips();
  setupVoiceMode();
  updateTodayNamedays();
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
