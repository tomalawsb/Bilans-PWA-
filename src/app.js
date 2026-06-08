const DB_NAME = 'bilans-pwa-etap1';
const DB_VERSION = 4;
const APP_VERSION = '1.1-137';
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
const DROPBOX_FORCE_LOCAL_UPLOAD_KEY = 'portfel-pro-dropbox-force-local-upload-v1';
const DELETE_TOMBSTONE_RETENTION_DAYS = 365;
const MAIN_REPORT_SETTINGS_KEY = 'portfel-pro-main-report-settings-v1';
const CUSTOM_CATEGORIES_KEY = 'portfel-pro-custom-categories-v1';
const WALLET_MONTHS_KEY = 'portfel-pro-wallet-months-v1';
const LEARNING_AUTO_CONFIRMATIONS = 2;
const LEARNING_MAX_EXAMPLES = 8;
const AI_SETTINGS_KEY = 'portfel-pro-ai-settings-v1';
const INVENTORY_ITEMS_KEY = 'portfel-pro-inventory-items-v1';
const INVENTORY_MOVEMENTS_KEY = 'portfel-pro-inventory-movements-v1';
const INVENTORY_ANALYSIS_KEY = 'portfel-pro-inventory-analysis-v1';
const INVENTORY_PENDING_KEY = 'portfel-pro-inventory-pending-v1';

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
  'https://nameday.abalin.net/api/V2/today?timezone=Europe/Warsaw',
  'https://nameday.abalin.net/api/V1/today?country=pl&timezone=Europe/Warsaw',
  'https://nameday.abalin.net/api/V1/today?country=pl'
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
  "01-01": "Mieszko, Fulgenty, Miecisław, Walenty, Mojsław, Odys, Maria, Odylon, Fulgencjusz, Walentyn, Odyseusz, Józef, Mieczysława, Wilhelm, Miesław, Wincenty, Eufrozyna, Masław, Mieczysław, Konkordiusz",
  "01-02": "Makary, Argea, Grzegorz, Narcyz, Achacjusz, Abel, Strzeżysław, Marcelin, Telesfora, Adelard, Aspazja, Stefania, Bazyliusz, Sylwester, Martynian, Izydor, Achacy, Telesfor, Teodor, Dobiemir, Sylwestra, Bazyla, Aspazy, Aspazjusz, Argeus, Bazyli, Jakubina",
  "01-03": "Prymus, Arleta, Teogenes, Danuta, Anter, Cyryna, Zdzisława, Pryma, Daniel, Piotr, Enoch, Włościsława, Teonas, Gordiusz, Teona, Cyryn, Cyriak, Genowefa",
  "01-04": "Aniela, Grzegorz, Doroteusz, Angelika, Dobromir, Benedykta, Tytus, Eugeniusz, Rygobert, Elżbieta, Fereol, Dafroza, Krystiana, Suligost",
  "01-05": "Jan Nepomucen, Amelia, Edward, Szymon, Emiliana, Roger, Piotr, Marcelina, Edwarda, Włościbor, Amata",
  "01-06": "Fotyna, Kasper, Bolemir, Rafaela, Melaniusz, Jędrzej, Miłowit, Melchior, Andrzej, Epifania, Kacper, Karol, Manomir, Norman, Fotyn, Baltazar",
  "01-07": "Walenty, Kanut, Lucjan, Walentyn, Izydor, Wirginia, Chociesław, Teodor, Mateusz, Kryspin, Julian, Rajnold, Nicetas, Rajmund, Rajmunda, Łucjan",
  "01-08": "Mścisław, Heladia, Heladiusz, Mroczysław, Laurencjusz, Laurenty, Seweryn, Teofil, Maksym, Albert, Wawrzyniec, Apolinary, Erhard",
  "01-09": "Marcjanna, Przemir, Marcelin, Adrian, Bracsław, Piotr, Mścisława, Marcelina, Adrianna, Julian, Alicja, Antoni",
  "01-10": "Nikanora, Grzegorz, Marcjan, Anna, Mojmir, Nikanor, Paweł, Leonia, Idzi, Jan, Piotr, Kolumba, Wilhelm, Egidia, Dobrosław, Agaton",
  "01-11": "Paulin, Hygin, Odon, Hortensjusz, Palemona, Tezeusz, Hortensja, Tomasz, Małomir, Anastazy, Honorata, Melchiades, Teodozy, Mechtylda, Matylda, Hilary, Feliks, Teodozjusz, Palemon, Salwiusz, Krzesimir",
  "01-12": "Czesława, Greta, Ernest, Tacjana, Czasława, Eutropiusz, Wiktorian, Bernard, Jan, Aelred, Benedykt, Małgorzata, Bonitus, Tygriusz, Tatiana, Arkadiusz, Cezaria, Arkady, Arkadia, Bonita, Wiktoriana, Bonet, Antoni, Stomir",
  "01-13": "Remigiusz, Judyta, Bogusława, Remigia, Bogusąd, Kinga, Godfryd, Gotfryd, Bogumiła, Bogumił, Falisław, Bogusław, Beata, Hilary, Melania, Weronika, Glafira, Leoncjusz",
  "01-14": "Radogost, Odoryk, Helga, Piotr, Nina, Dacjusz, Makryna, Mściwuj, Rajner, Saba, Amadea, Hilary, Krystiana, Feliks, Malachiasz",
  "01-15": "Maur, Makary, Eligia, Domosław, Aleksander, Dobrawa, Paweł, Maksym, Jan, Ida, Izydor, Domasław, Micheasz, Dąbrówka, Franciszek, Arnold, Dalemir, Eligiusz",
  "01-16": "Treweriusz, Otto, Waleriusz, Piotr, Furzeusz, Włodzimir, Gonsalwy, Otton, Trzebowit, Marceli, Włodzimira, Tycjan, Hilary, Tycjana, Włodzimierz, Honorat",
  "01-17": "Sulpicja, Roselina, Rosława, Rozalinda, Rosław, Jan, Merul, Przemił, Alba, Rościsław, Teodor, Julian, Sulpicjusz, Antoni",
  "01-18": "Liberata, Sędziwoj, Pryska, Beatrycze, Ammoniusz, Ammonia, Wenerand, Małgorzata, Piotr, Krystyna, Bogumił, Zuzanna, Monika, Woluzjan, Lubart, Regina, Atenogenes",
  "01-19": "Eufemia, Marta, Germana, Sara, Wulstan, Kanut, Poncjan, Paweł, Januariusz, Bernard, Jan, January, Kaliksta, Mariusz, Juliusz, Andrzej, Geroncjusz, Germanik, Józef, Basjan, Henryk, Racimir, Marceli, Erwina, Erwin, Matylda, Basjana, Alderyk, Saturnin, Pia, Kalista, Adalryk",
  "01-20": "Maur, Dobiegniew, Dobrzegniew, Sebastian, Eutymiusz, Fabiana, Dobroniega, Dobrożyźń, Fabian, Euzebiusz",
  "01-21": "Jarosław, Jarosława, Epifaniusz, Eulogia, Publiusz, Awit, Patrokles, Inez, Epifani, Jan Chrzciciel, Meinrad, Józef, Sobiesława, Eulogiusz, Jerosława, Długomił, Józefa, Krystiana, Agnieszka, Awita",
  "01-22": "Gaudenty, Dominik, Dobromysł, Gaudencjusz, Laura, Sulisław, Dorian, Uriel, Anastazy, Kasandra, Mateusz, Wincenty, Jutrogost",
  "01-23": "Uniemir, Michał, Sewerian, Łukasz, Akwila, Maria, Bernard, Klemens, Maksym, Anicet, Jan, Daniel, Onufry, Aniceta, Henryk, Bartłomiej, Agatangel, Wincenty, Wrocsława, Ildefons, Filip, Rajmund, Konstanty, Emerencja, Rajmunda",
  "01-24": "Mirogniew, Chwalibog, Ksenia, Rafał, Franciszek Salezy, Tymoteusz, Milena, Teodor, Babilas, Wera, Felicjan, Urban",
  "01-25": "Pęcisława, Miłowan, Tacjana, Ananiasz, Paweł, Miłosz, Artemia, Maksym, Barcław, Apollon, Tatiana, Emanuel, Miłobor, Juwentyn, Emanuela",
  "01-26": "Ksenofont, Teogenes, Żeligniew, Tymoteusz, Leon, Andrzej, Leona, Tytus, Paula, Skarbimir",
  "01-27": "Jerzy, Teodoryk, Przybyrad, Przybysław, Witalian, Rozalia, Leander, Natalis, Lotar, Angelika, Chryzostom, Jan, Datyw, Alruna, Henryk, Dacjusz, Adalruna, Przemysław, Elwira, Ninomysł, Julian",
  "01-28": "Leonid, Jakub, Walery, Olimpia, Tyrs, Maria, Tomasz, Roger, Blizbor, Waleriusz, Piotr, Świedarg, Flawian, Manfred, Karol, Manfreda, Radomir, Krzesąd, Julian, Boguwola, Agnieszka, Kalinik, Augustyn",
  "01-29": "Maur, Ewangelina, Aniela, Gildas, Sulpicja, Żelisław, Konstancjusz, Waleriusz, Sabrina, Józef, Papiasz, Bona, Wielisława, Zdziesław, Franciszek, Zdzisław, Sulpicjusz, Ismena, Bolesława",
  "01-30": "Dobrogniewa, Dobiegniew, Sebastian, Maciej, Aleksander, Gerarda, Teofil, Adelajda, Marcin, Bronisław, Syntia, Hiacynta, Martyna, Cyntia, Batylda, Aldegunda, Gerard, Adalgunda, Feliks",
  "01-31": "Geminian, Ludwika, Emma, Smysława, Ksawery, Spycigniew, Marcela, Melaniusz, Jan, Cyrus, Franciszek Ksawery, Piotr, Rościgniew, Euzebiusz",
  "02-01": "Siemirad, Zygbert, Wirydiana, Brygida, Emil, Zybracht, Żegota, Paweł, Winand, Zybart, Weridiana, Andrzej, Prosimir, Dziadumiła, Pioniusz, Cecyliusz, Sewer, Winanda, Zybert",
  "02-02": "Markwart, Stefan, Teodoryk, Katarzyna, Mikołaj, Korneli, Teofan, Laurencjusz, Laurenty, Maria, Kornel, Miłosława, Jan, Wawrzyniec, Marcin, Andrzej, Piotr, Gonsalwy, Mirosław, Joanna, Ermentruda, Filip, Korneliusz, Franciszek, Werner, Miłosław",
  "02-03": "Ansgar, Stefan, Celeryn, Ignacy, Maksym, Jan, Celeryna, Wawrzyniec, Ofelia, Uniemysł, Błażej, Telimena, Hipolit, Błażeja, Hipolita, Ansgary, Uniesława, Klaudyna, Oskar",
  "02-04": "Gilbert, Witosława, Eustachiusz, Jan, Izydor, Eustachy, Mariusz, Andrzej, Józef, Żanna, Jarmila, Eustachia, Joanna, Nataniel, Izyda, Jarmiła, Awentyn, Weronika, Częstogoj",
  "02-05": "Strzeżysława, Jakub, Modest, Awit, Adelajda, Izydor, Albwin, Rodomił, Agata, Lubodrog, Dobiemir, Indracht, Elpin, Przybygniew, Saba, Awita",
  "02-06": "Bohdana, Dorota, Szymon, Paweł, Bogdana, Leon, Wedast, Leona, Tytus, Amanda, Bogdan, Amand, Bohdan, Joachim, Gaston, Antoni",
  "02-07": "Alfons, Jakub, Rozalia, Partenia, Idzi, Sulisław, Jan, Ryszard, Sulimir, Romeusz, Wilhelm, Egidia, Teodor, Parteniusz, Mojżesz, Eugenia, Egidiusz, Antoni, Romuald",
  "02-08": "Stefan, Gniewosądka, Polikarp, Sebastian, Salomon, Mirogniew, Łucjusz, Juwencja, Paweł, Jan, Hieronim, Józefina, Irena, Lucjusz, Izajasz, Ampeliusz, Piotr, Gniewomir, Gabriela, Juwencjusz, Honorat",
  "02-09": "Prymus, Jakub, Ansbert, Sabin, Pelagia, Gorzysław, Nikifor, Pryma, Reginald, Bernard, Pola, Mariusz, Cyryl, Apolonia, Marian, Felicjan, Donat, Sulisława",
  "02-10": "Tomisława, Michał, Tomił, Sotera, Jacenty, Apollon, Scholastyka, Gabriel, Wilhelm, Elwira, Jacek, Trojan",
  "02-11": "Dezydery, Grzegorz, Łucjusz, Olgierd, Paschalis, Cedmon, Bernadeta, Seweryn, Maria, Świętomira, Lucjusz, Teodora, Benedykt, Heloiza, Adolfa, Dezyderia, Adolf, Jonasz, Łazarz, Bertrada, Dezyderiusz, Sekundyn, Wiktoria",
  "02-12": "Humbelina, Hilariona, Grzegorz, Gaudenty, Mikołaj, Jakub, Modest, Bonfiliusz, Ewa, Etelwold, Ammoniusz, Laurenty, Paweł, Ammonia, Jan, Tomasz, Datyw, Melecjusz, Benedykt, Ampeliusz, Hilarion, Damian, Bonfilia, Trzebiesława, Saturnina, Bartłomiej, Norma, Maryna, Ampelia, Aleksy, Julian, Eulalia, Gerard, Ludan, Feliks, Ludwik, Saturnin, Juwencjusz, Antoni",
  "02-13": "Gilbert, Humbelina, Stefan, Benigny, Grzegorz, Katarzyna, Jordan, Jakub, Licyniusz, Beatrycze, Paweł, Jan, Martynian, Krystyna, Benignus, Eulogiusz, Kastor, Maura, Emnilda, Polieukt, Julian, Toligniew, Jordana",
  "02-14": "Witalis, Jerzy, Jordan, Mikołaj, Modest, Walenty, Konrada, Nostrian, Dionizy, Niedomira, Eleukadiusz, Auksencjusz, Walentyn, Antonin, Niedamir, Liliana, Maron, Abraham, Cyryl, Jan Chrzciciel, Auksenty, Dobiesława, Krystyna, Józef, Auksencja, Eleukadia, Adolfa, Flawian, Teodozy, Maro, Florentyn, Teodozja, Metody, Zenon, Wincenty, Adolf, Dionizja, Konrad, Niemir, Teodozjusz",
  "02-15": "Glicery, Faustyn, Gliceriusz, Teogenes, Pakosław, Przybyrad, Jordan, Zygfryda, Dalmacjusz, Galfryd, Pakosława, Onezym, Wirginia, Jowita, Faust, Andrzej, Józef, Dalmacy, Żywila, Zygfryd, Jordana, Joachim, Klaudiusz, Sewer, Saturnin, Julia",
  "02-16": "Gilbert, Dominik, Pamfil, Mikołaj, Danuta, Marcjan, Wirydiana, Szymon, Maria, Bernard, Julianna, Juliana, Marut, Symeon, Onezym, Eliasz, Teobald, Daniel, Filipa, Izajasz, Samuel, Piotr, Józef, Jarema, Flawian, Porfiriusz, Marian, Pamela, Czcisław, Porfiry, Maruta, Julian, Przedsława, Ludan, Jeremiasz, Marutas, Jeremi",
  "02-17": "Michał, Faustyn, Sylwin, Romulus, Łukasz, Bonfiliusz, Polichroniusz, Aleksja, Hugo, Reginald, Niegowoj, Klemens, Jan, Teodulf, Izydor, Sylwina, Anastazy, Benedykt, Hermogenes, Piotr, Marianna, Bonfilia, Flawian, Wilhelm, Bartłomiej, Sylwan, Aleksy, Donat, Zbigniew, Julian, Gerard, Fintan, Franciszek, Konstanty",
  "02-18": "Konstantyna, Heladia, Heladiusz, Aleksander, Haralampiusz, Łucjusz, Bernadeta, Flawiusz, Maksym, Albert, Jan, Symeon, Lucjusz, Marcin, Flawia, Andrzej, Agapit, Gertruda, Flawian, Wilhelm, Sylwan, Wespazjan, Mojżesz, Klaudiusz, Franciszek, Kosma, Więcesława, Konstancja, Agnieszka, Antoni",
  "02-19": "Tuliusz, Jerzy, Alwar, Walery, Konrada, Łucja, Publiusz, Manswet, Bonifacy, Józef, Gawin, Henryk, Barbacy, Czcisław, Biecsława, Marceli, Julian, Beat, Konrad, Arnold, Leoncjusz",
  "02-20": "Eustachiusz, Ludomił, Nilus, Walery, Euchariusz, Zenobiusz, Ludomiła, Euchary, Lubomir, Jan, Nila, Aulus, Eustachy, Leon, Leona, Sylwan, Peleusz, Hiacynta, Elżbieta, Eleuteriusz, Falkon, Ludomir, Ulryk, Eleuteria, Franciszek, Amata, Siestrzewit, Eleutery, Julia, Serapion",
  "02-21": "Lena, Eleonora, Sewerian, Natalis, Henryka, Piotr, Wyszeniega, Gumbert, Robert, Wyszetrop, Kiejstut, Feliks, Fortunat",
  "02-22": "Marta, Jakub, Nikifor, Wiktor, Marwald, Małgorzata, Piotr, Papiasz, Chociebąd, Wrocisław, Marold, Paschazy, Maksymian, Konkordia",
  "02-23": "Stefan, Milburga, Marta, Polikarp, Romana, Prymian, Piotr, Damian, Florentyn, Izabela, Będzimir, Feliks, Damiana, Łazarz",
  "02-24": "Ermegarda, Modest, Maciej, Łucjusz, Wieledrog, Jan, Sergiusz, Bogurad, Lucjusz, Piotr, Jaśmina, Marek, Flawian, Montan, Julian, Irmegarda, Bogusz, Józefa, Borzygniew",
  "02-25": "Tarazjusz, Tolisław, Modest, Adam, Tolisława, Walburga, Dioskur, Wiktoryn, Wiktor, Konstancjusz, Just, Romeusz, Antonina, Gromisław, Papiasz, Cezary, Donat, Zygfryd, Herena, Lubart, Cezariusz, Nicefor, Bolebor, Serapion",
  "02-26": "Nikolina, Lutmiar, Aleksander, Otokar, Gerlinda, Dionizy, Porfiriusz, Bogumił, Klaudian, Mirosław, Nestor, Mirosława, Porfiry, Faustynian, Lutosława",
  "02-27": "Prokop, Achacjusz, Leander, Aleksander, Anna, Sirosława, Auksencjusz, Wiktor, Gabriel, Auksenty, Sierosława, Auksencja, Achacy, Orfeusz, Honoryna, Leandra, Julian, Bazyli, Baldomer, Baldomera",
  "02-28": "Makary, Antonia, August, Roman, Tymoteusz, Bogurad, Nadbor, Gajusz, Józef, Sylwana, Oswald, Gaja, Ludomir, Kaja, Hilary, Lech, Falibog",
  "02-29": "Dobrosiodł, Antonia, August, Roman, Oswald",
  "03-01": "Eudoksja, Antonia, Dawid, Albin, Switbert, Herkulan, Leon, Józef, Herakles, Aldona, Leona, Herkules, Budzisław, Joanna, Eudokia, Feliks, Radosław, Antoni",
  "03-02": "Michał, Januaria, Krzysztof, Łukasz, Paweł, Prosper, Piotr, Henryk, Absalon, Karol, Franciszek, Helena, Radosław, Halszka",
  "03-03": "Teresa, Kleonika, Maryniusz, Jakub, Wirzchosława, Eutropiusz, Maryn, Gerwina, Innocenty, Hieronim, Samuel, Kolumba, Kleonik, Teodor, Asteriusz, Agrypin, Tycjan, Gerwin, Marcjusz, Kunegunda, Tycjana",
  "03-04": "Łucjusz, Gerarda, Adrian, Kazimierz, Leonard, Witosław, Lucjusz, Placyda, Nestor, Arkadiusz, Adrianna, Humbert, Arkady, Arkadia, Gerard, Jakubina",
  "03-05": "Pakosław, Wergilia, Wergiliusz, Krzysztof, Adrian, Wolimir, Gerazym, Teofil, Wirgilia, Jan, Fokas, Wacław, Marek, Oliwia, Adrianna, Wirgiliusz, Konon, Fryderyk, Jeremiasz",
  "03-06": "Cymbarka, Jordan, Wiktor, Cyryl, Koleta, Będzimysł, Róża, Frydolin, Konon, Eugenia, Jordana, Agnieszka",
  "03-07": "Teresa, Efrem, German, Nadmir, Teofilakt, Eubul, Elpidiusz, Paweł, Tomasz, Felicyta, Elpidia, Eugeniusz, Perpetua, Morzysław, Bazyli",
  "03-08": "Poncjusz, Filemon, Stefan, Arian, Szymon, Miłogost, Apoloniusz, Jan, Filemona, Teotyk, Herenia, Beata, Elwira, Wincenty, Julian, Franciszek, Feliks, Antoni",
  "03-09": "Grzegorz, Dominik, Katarzyna, Franciszka, Kandyd, Samanta, Mścisława, Przemyślibor",
  "03-10": "Makary, Aleksander, Cyprian, Porfirion, Symplicjusz, Piotr, Symplicy, Gajusz, Gaja, Zwnisława, Eugenia",
  "03-11": "Teresa, Talus, Dominik, Świetlana, Sylwia, Angelika, Eutymiusz, Balbina, Jan, Nawoj, Benedykt, Kandyd, Eulogiusz, Drogosława, Konstantyn, Sofroniusz, Konstanty, Trofim, Tala",
  "03-12": "Grzegorz, Teofan, Maksymilian, Bernard, Alojzy, Innocenty, Blizbor, Józefina, Piotr, Justyna",
  "03-13": "Rodryg, Cieszymysł, Ernest, Salomon, Bożena, Sabin, Trzebiesław, Trzebisław, Anioł, Krystyna, Marek, Rodryk, Roderyk, Kasjan, Bratomir, Letycja, Patrycja, Ernestyn",
  "03-14": "Jakub, Eutychiusz, Ewa, Fawila, Afrodyzy, Afrodyzjusz, Bożeciecha, Leon, Piotr, Leona, Pamela, Afrodyzja, Matylda, Łazarz",
  "03-15": "Placyd, Ludwika, Nikander, Zachary, Krzysztof, Leokrycja, Matrona, Probus, Klemens, Zachariasz, Longina, Heloiza, Longin, Nikandra, Gościmir, Luiza",
  "03-16": "Dzirżyterg, Budzimir, Haralampia, Natalis, Walenty, Herybert, Artemia, Walentyn, Gabriel, Hiacynt, Abraham, Patrycy, Agapit, Longin, Miłostryj, Patryk, Karol, Izabela, Herbert, Patrycjusz, Julian, Hilary, Przybymir, Cyriak, Antoni",
  "03-17": "Cieszysław, Zbygniew, Paweł, Agrykola, Patrycy, Józef, Gertruda, Patryk, Zbygniewa, Zbigniew, Patrycjusz, Witburga, Ambroży, Regina",
  "03-18": "Marta, Celestyna, Narcyz, Edward, Aleksander, Krystian, Salwator, Cyryl, Edwarda, Boguchwał, Anzelm, Feliks, Trofim, Boguchwała",
  "03-19": "Jan, Józef, Marek, Bogdan, Marceli, Leoncjusz",
  "03-20": "Eufemia, Fotyna, Klaudia, Ermegarda, Aleksandra, Matrona, Rafał, Aleksander, Wulfram, Klemens, Cyriaka, Hipolit, Ruprecht, Bogusław, Wincenty, Irmegarda, Maurycy, Kutbert, Józefa, Nicetas, Anatol, Ambroży, Patrycja",
  "03-21": "Filemon, Klemencja, Mikołaj, Pafnucy, Lubomir, Filemona, Benedykta, Ludomira, Marzanna, Ludomir, Serapion",
  "03-22": "Godzisław, Katarzyna, Zachary, Bogusława, August, Lea, Kazimierz, Paweł, Baldwin, Benwenut, Baldwina, Zachariasz, Oktawian, Bogusław, Boguchwał, Bazyli",
  "03-23": "Pelagia, Eberhard, Wiktorian, Benedykt, Zbysław, Oktawian, Józef, Turybiusz, Adrianna, Rebeka, Nikon, Wiktorianna, Piotra, Wiktoriana, Feliks",
  "03-24": "Oldmir, Katarzyna, Romulus, Aleksander, Szymon, Agapiusz, Ademar, Dionizy, Jan, Dzierżysław, Gabriel, Józef, Marek, Aldmir, Dydak, Dzirżysława, Sofroniusz, Sewer, Dziesława, Bertrada, Dzierżysława",
  "03-25": "Dezydery, Jozafata, Prokop, Łucja, Wolimir, Maria, Lucja, Dula, Pelagiusz, Lutomysł, Małgorzata, Lutogniew, Wieńczysław, Baroncjusz, Kwiryn, Wieńczysława, Anuncjata, Sławobora, Ireneusz, Dyzma, Nikodema, Dezyderiusz, Mariola",
  "03-26": "Eutychiusz, Tworzymir, Olga, Ludger, Teodozy, Teodor, Larysa, Emanuel, Feliks, Nicefor, Dyzma, Teodozjusz, Bazyli, Emanuela, Manuela",
  "03-27": "Narzes, Gelazja, Ernest, Marotas, Aleksander, Lidia, Jan, Benedykt, Augusta, Robert, Gelazy, Rupert, Marot, Rzędzimir, Archibald, Macedoniusz, Franciszek, Łazarz",
  "03-28": "Aniela, Malkolm, Aleksander, Doroteusz, Jan, Renata, Krzesisław, Krzysław, Kastor, Rogat, Pryskus, Gedeon, Joanna, Rogacjusz, Guntram, Malachiasz, Ingbert",
  "03-29": "Stefan, Eustacjusz, Eustazy, Eustazja, Wiktoryn, Eustachy, Bertold, Cyryl, Marek, Ludolfina, Teodor, Ludolf, Satur, Satura, Eustazjusz",
  "03-30": "Litobor, Aniela, Kwiryna, Amelia, Mamertyna, Mamertyn, Leonard, Zozym, Jan, Piotr, Dobromier, Amadeusz, Kwiryn, Częstobor, Amadea, Joachim",
  "03-31": "Achacjusz, Amos, Nela, Dobromira, Gwido, Balbina, Gwidon, Myślidar, Achacy, Joanna, Bonawentura, Dobromiera, Beniamin, Kornelia",
  "04-01": "Makary, Katarzyna, Celzjusz, Hugo, Miłość, Tomasz, Grażyna, Irena, Tomisław, Chionia, Florentyn, Zbigniew, Wenancjusz, Wenanty, Jakubina, Hugon",
  "04-02": "Aaron, Laurencja, Leopold, Maria, Samosąd, Wiktor, Miłobąd, Leopolda, Teodozja, Franciszek, Urban",
  "04-03": "Eutychia, Cieszygor, Jakub, Jan, Gandolf, Ryszard, Benedykt, Józef, Winicjusz, Izbygniew, Izbygniewa, Gandulf, Nicetas, Sykstus, Pankracy, Antoni",
  "04-04": "Zdziemir, Adelajda, Teodulf, Izydor, Benedykt, Wacław, Wyszeniega, Józef, Platon, Zdzimir, Ambroży",
  "04-05": "Katarzyna, Borzywoj, Maria, Julianna, Tristan, Izbor, Irena, Krescencja, Wincenty, Jeremiasz, Jeremi",
  "04-06": "Filaret, Michał, Notger, Celestyna, Katarzyna, Notker, Prudencjusz, Zachary, Marcelin, Adam, Platonida, Zefiryn, Tymoteusz, Zachariasz, Ada, Piotr, Diogenes, Wilhelm, Izolda, Świętobor, Piotra, Ireneusz, Sieciesława",
  "04-07": "Asumpta, Epifaniusz, Krystian, Maria, Jan Chrzciciel, Józef, Przecław, Herman, Hegezyp, Donat, Przedsław",
  "04-08": "Perpet, Emma, Makaria, Walter, August, Dionizy, Asynkryt, January, Perpetuus, Apolinary, Amancjusz, Maksyma, Cezary, Ema, Julian, Cezaryna, Radosław, Julia",
  "04-09": "Notger, Kasylda, Katarzyna, Achacjusz, Eupsychia, Walter, Hugo, Reginald, Maria, Tomasz, Innocenty, Maja, Heliodor, Dominika, Ubald, Wadim, Piotr, Demetriusz, Tankred, Achacy, Waldetruda, Matron, Prochor, Marceli, Hilaria, Dobrosława, Eupsychiusz, Demetria, Hilary, Franciszek, Konrad, Antoni",
  "04-10": "Fulbert, Makary, Grodzisław, Michał, Notger, Pompejusz, Paladiusz, Apoloniusz, Afrykan, Daniel, Małgorzata, Marek, Terencjusz, Henryk, Michalina, Ezechiel, Magdalena, Antoni",
  "04-11": "Arleta, Jaromir, Anioł, Antypater, Leon, Gemma, Antypas, Leona, Herman, Hildebrand, Rajner, Izaak, Filip, Helena, Hildebranda",
  "04-12": "Teresa, Siemidrog, Wiktor, Juliusz, Andrzej, Damian, Józef, Zenon, Zenona, Konstantyn, Saba, Konstanty",
  "04-13": "Przemysława, Hermenegild, Karp, Agatonika, Maksym, Jan, Ida, Marcin, Małgorzata, Ursus, Przemysł, Przemysław, Hermenegilda, Długomił, Marcjusz, Kunegunda, Kwintylian, Justyn",
  "04-14": "Lambert, Jadwiga, Krzysztof, Myślimir, Tyburcy, Tomaida, Tyburcja, Maria, Ernestyna, Julianna, Maksym, Lawiniusz, Wszegniew, Ardalion, Symplicja, Izabela, Tyburcjusz, Walerian, Lamberta, Berenika, Justyna, Lawinia, Trofim",
  "04-15": "Abel, Modest, Olimpia, Bazylisa, Wiktoryn, Maksym, Sylwester, Maron, Wszegniew, Piotr, Tytus, Eutyches, Teodor, Maro, Anastazja, Cezary, Sylwestra, Potencjana, Potencjanna, Cezariusz",
  "04-16": "Cecylian, Lambert, Leonid, Ksenia, Marcjalis, Bernadeta, Publiusz, Benedykt, Kalikst, Turybiusz, Erwina, Erwin, Optat, Lamberta, Joachim, Kwintylian, Charyzjusz, Feliks, Urban, Saturnin, Julia",
  "04-17": "Stefan, Katarzyna, Jakub, Izydora, Paweł, Roberta, Anicet, Innocenty, Eliasz, Izydor, Teodora, Salwator, Józef, Radociech, Aniceta, Robert, Klara",
  "04-18": "Bogusława, Gosław, Sabina, Flawiusz, Maria, Apoloniusz, Ryszard, Bogumiła, Bogusław, Gościsław, Amedeusz, Gosława, Eleuteriusz, Eleuteria, Alicja, Eleutery",
  "04-19": "Jerzy, Emma, Elfeg, Wigilia, Ekspedyta, Dionizjusz, Krescencjusz, Sokrates, Dionizy, Pafnucy, Leon, Włodzimir, Czesław, Leona, Irydion, Leontyna, Wincenty, Ema, Krescenty, Ekspedyt, Konrad, Wierzyn, Krescens, Cieszyrad, Tymon",
  "04-20": "Jerzy, Emma, Elfeg, Wigilia, Ekspedyta, Dionizjusz, Krescencjusz, Sokrates, Dionizy, Pafnucy, Leon, Włodzimir, Czesław, Leona, Irydion, Leontyna, Wincenty, Ema, Krescenty, Ekspedyt, Konrad, Wierzyn, Krescens, Cieszyrad, Agnieszka, Tymon",
  "04-21": "Apollina, Aleksandra, Żelisław, Bartosz, Konrada, Apoloniusz, Apollon, Anastazy, Bartłomiej, Dobrosułka, Drogomił, Anzelm, Konrad, Feliks",
  "04-22": "Leonida, Leonid, Łukasz, Łucjusz, Lucjusz, Leon, Agapit, Gajusz, Leona, Soter, Wanesa, Teodor, Gaja, Kaja, Wirginiusz, Strzeżymir",
  "04-23": "Wojciech, Wojciecha, Jerzy, Gerarda, Maria, Idzi, Nastazja, Adalbert, Egidia, Marol, Gerard, Achilles, Feliks, Helena, Fortunat, Gabriela, Ilona",
  "04-24": "Jerzy, Grzegorz, Aleksander, Maria, Longina, Horacjusz, Zbywoj, Longin, Tyberiusz, Horacy, Bona, Aleksy, Honoriusz, Egbert, Fidelis, Erwina, Erwin, Saba, Euzebiusz, Leoncjusz, Gaston",
  "04-25": "Stefan, Jarosław, Ewodia, Kaliksta, Franciszka, Ewodiusz, Hermogenes, Filona, Markusław, Marek, Radociech, Rustyk, Filon, Anian, Włodzimira, Kalista, Rustyka",
  "04-26": "Grzegorz, Dominik, Marcelin, Klarencjusz, Klet, Lucydiusz, Ryszard, Spycimir, Mariusz, Piotr, Artemon, Erwina, Aureliusz, Marzena, Paschazy",
  "04-27": "Zyta, Antym, Kanizjusz, Felicja, Ożanna, Jakub, Żelimysł, Tertuliana, Teofil, Jan, Marcin, Tertulian, Anastazy, Andrzej, Piotr, Józef, Teodor, Bożebor",
  "04-28": "Witalis, Achacjusz, Pamfil, Afrodyzy, Arystarch, Paweł, Maria, Menander, Dydymus, Teodora, Afrodyzjusz, Piotr, Patrycy, Marek, Waleria, Achacy, Patryk, Joanna, Przybycześć, Patrycjusz, Afrodyzja, Ludwik, Dydym",
  "04-29": "Paulin, Katarzyna, Tychik, Jakub, Antonia, Myślimir, Emilian, Hugo, Agapiusz, Roberta, Rita, Piotr, Tertulia, Krystyn, Robert, Angelina, Bogusław, Ermentruda, Sewer, Augustyn, Hugon",
  "04-30": "Katarzyna, Rozamunda, Jakub, Afrodyzy, Chwalisława, Eutropiusz, Pius, Maria, Lilla, Maksym, Wawrzyniec, Afrodyzjusz, Benedykt, Piotr, Józef, Bartłomiej, Kwiryn, Marian, Donat, Andrea, Afrodyzja, Ludwik, Pomponiusz",
  "05-01": "Briok, Aniela, Peregryn, Jakub, Izydora, Wiwald, Tamara, Berta, Lubomir, Maja, Petronela, Józef, Asaf, Floryna, Julian, Jeremiasz, Orencjusz, Jeremi",
  "05-02": "Walter, Zygmunta, Walenty, Atanazy, Witomir, Zygmunt, Teodulf, Walentyn, Zoe, Eksuperiusz, Walbert, Waldebert, Częstowoj, Gwalbert, Borys, Anatol, Cyriak",
  "05-03": "Diodora, Aleksander, Wirzchosława, Maria, Leonia, Tymoteusz, Teodulf, Piotr, Antonina, Anika, Maura, Wiola, Świętosława, Alodia, Juwenalis, Mariola, Diodor",
  "05-04": "Florian, Tekla, Michał, Paulin, Leonida, Grzegorz, Strzedziwoj, Antonia, Pelagia, Gotard, January, Teodora, Damian, Antonina, Lucyla, Sylwan, Wespazjan, Monika, Kasjan, Gościwit, Damiana",
  "05-05": "Penelopa, Peregryn, Zdziebor, Iryda, Gotard, Chociemir, Eulogia, Pius, Jowinian, Waldemar, Anioł, Maksym, Stanisława, Benwenut, Eutymiusz, Irena, Geroncjusz, Eulogiusz, Teodor, Stanisław, Ireneusz, Nicetas, Hilary, Zdzibor",
  "05-06": "Placyd, Judyta, Jakub, Ewodia, Jurand, Jan, Domagniew, Ewodiusz, Benedykta, Teodot, Bartłomiej, Miłodrog, Filip, Franciszek",
  "05-07": "Florian, Ludmiła, August, Ludomiła, Jan, Wirginia, Flawia, Bogdała, Piotr, Ludomira, Domicela, Wincenty, Róża, Gizela, Domicjana, Stanimir, Domicjan",
  "05-08": "Michał, Heladia, Heladiusz, Achacjusz, Wiron, Dionizy, Stanisława, Wiktor, Ida, Benedykt, Ulryka, Arseniusz, Piotr, Bonifacy, Achacy, Amat, Stanisław, Dezyderia",
  "05-09": "Stefan, Grzegorz, Katarzyna, Mikołaj, Otokar, Karolina, Maria, Pachomiusz, Geroncjusz, Bożydar, Przebor, Hiob, Hiacynta, Beat",
  "05-10": "Nazary, Sofronia, Cyryna, Epimach, Celzjusz, Beatrycze, Symplicjusz, Jan, Sylwester, Innocenty, Gordian, Filadelfia, Blanda, Antonin, Samuel, Nazariusz, Symplicy, Antonina, Chociesław, Filadelf, Gordiana, Wiktoryna, Sylwestra, Chocsław, Feliks, Cyryn, Łazarz, Częstomir",
  "05-11": "Antym, Majol, Stella, Tadea, Ignacy, Berta, Maksym, Albert, Alojzy, Benedykt, Syzyniusz, Adalbert, Walbert, Tadeusz, Iga, Waldebert, Mamerta, Lutogniew, Miranda, Zuzanna, Gwalbert, Mamert, Fabiusz, Filip, Majola, Franciszek",
  "05-12": "Dominik, German, Imelda, Plautylla, Epifaniusz, Jan, Teodora, Nereusz, Flawia, Wszemił, Domicela, Joanna, Domicjana, Jazon, Achilles, Pankracy, Domicjan, Nawoja",
  "05-13": "Cieszmir, Mucjusz, Aaron, Natalis, Serwacy, Gerarda, Maria, Gliceria, Roberta, Jan, Andrzej, Piotr, Dobiesława, Robert, Magdalena, Gerard, Ciechosław",
  "05-14": "Michał, Koryna, Maciej, Maria, Idzi, Wiktor, Dominika, Fenenna, Ampeliusz, Bonifacy, Dobiesław, Egidia, Ampelia, Jeremiasz, Jeremi, Tina",
  "05-15": "Zofia, Strzeżysław, Nadzieja, Atanazy, Stanibor, Miłość, Paweł, Symplicjusz, Retyk, Wiktoryn, Kasjusz, Maksym, Jan, Czcibora, Izydor, Andrzej, Piotr, Retycja, Symplicja, Florencjusz, Cecyliusz, Florenty, Dionizja, Retycjusz",
  "05-16": "Jan Nepomucen, Peregryn, Adamina, Trzebiemysł, Brendan, Adam, Szymon, Jędrzej, Wiktorian, Fidol, Ubald, Andrzej, Germeriusz, Wiktorianna, Wiktoriana, Honorat",
  "05-17": "Antonia, Paschalis, Sławomir, Wiktor, Herakliusz, Andrzej, Bruno, Falimir, Wilhelm, Brunon, Chwalimir, Wrocsława, Weronika",
  "05-18": "Faina, Myślibor, Eryk, Julita, Klaudia, Aleksandra, Matrona, Eufrazja, Jan, Teodot, Eryka, Feliks, Liberiusz, Sandra",
  "05-19": "Mikołaj, Pękosław, Iwon, Pudencjanna, Pękosława, Iwo, Pudencjana, Teofil, Jan, Cyriaka, Bernarda, Celestyn, Piotr, Dunstan, Kryspin, Iwona, Potencjana, Potencjanna, Urban, Augustyn",
  "05-20": "Bronisąd, Rymwid, Aleksander, Dawid, Elfryda, Anastazy, Bronimir, Saturnina, Kolumba, Teodor, Karol, Asteriusz, Bromir, Józefa, Taleleusz, Bernardyn, Wiktoria",
  "05-21": "Lena, Jan Nepomucen, Krzysztof, Tymoteusz, Antioch, Wiktor, Teobald, Rycheza, Przecława, Synezjusz, Wszemir, Polieukt, Donat, Ryksa, Serapion",
  "05-22": "Fulko, Wiesław, Ryta, Marcjan, Emil, Krzesisława, Roman, Dorian, Jan, Piotr, Wiesława, Helena, Julia, Wisława",
  "05-23": "Michał, Dezydery, Budziwoj, Eutychiusz, Łucjusz, Emilia, Wibert, Jan, Symeon, Lucjusz, Bolelut, Iwona, Dezyderia, Julian, Eufrozyna, Gwibert, Dezyderiusz",
  "05-24": "Donacjan, Tomira, Dawid, Maria, Jan, Orion, Amalia, Dagmara, Milena, Wanesa, Wincenty, Joanna, Zuzanna, Ubysława, Franciszek, Ludwik",
  "05-25": "Grzegorz, Heladia, Marcjanna, Borzysław, Heladiusz, Aldhelm, Beda, Zenobiusz, Dionizy, Mariusz, Wenerand, Leon, Magda, Leona, Imisława",
  "05-26": "Alwina, Adalwin, Lambert, Zachary, Karp, Alwin, Paulina, Emil, Angelika, Zachariasz, Kwadrat, Teodor, Filip Neriusz, Eleuteriusz, Więcemił, Filip, Lamberta, Adalwina, Eleuteria, Eleutery, Ewelina",
  "05-27": "Oliwier, Eutropiusz, Lucjan, Radowit, Jan, Izydor, Małgorzata, Oliwer, Fryderyka, Świętobor, Magdalena, Julian, Fryderyk, Augustyn",
  "05-28": "Heladia, Heladiusz, Jaromir, German, Łucjusz, Emil, Wolrad, Ignacy, Wiktor, Bogurad, Lucjusz, Herkulan, Just, Wilhelm, Balladyna, Justyna, Augustyn",
  "05-29": "Stefan, Izbylut, Urszula, Maksymin, Aleksander, Maksymina, Maria, Syzyniusz, Andrzej, Wilhelm, Bogusław, Ermentruda, Magdalena, Rajmund, Rajmunda",
  "05-30": "Mirogniew, Ferdynand, Zyndram, Jan, Sulimir, Anastazy, Eksuperancjusz, Andrzej, Gawin, Żanna, Brodzisław, Joanna, Bolemysł, Andronik, Sulirad, Feliks, Bazyli, Suligniewa",
  "05-31": "Witalis, Aniela, Kamila, Petronela, Kancjusz, Kancjanela, Sylwiusz, Noe, Marietta, Paschazy, Kancjan, Feliks",
  "06-01": "Tespezjusz, Teodul, Alfons, Pamfil, Jakub, Firmus, Juwencja, Konrada, Paweł, Felina, Bernard, Eunika, Felin, Nikodem, Tespezy, Porfiriusz, Pamela, Świętopełk, Prokul, Magdalena, Julian, Seleukos, Konrad, Ischyrion, Fortunat, Juwencjusz, Justyn",
  "06-02": "Efrem, Mikołaj, Marcelin, Jarmil, Blandyna, Erazm, Maria, Sadok, Domna, Florianna, Piotr, Jaczemir, Materna, Marianna, Trofima, Marzanna, Eugeniusz, Fotyn, Mszczuja, Nicefor, Racisław",
  "06-03": "Klotylda, Maciej, Kewin, Laurencjusz, Tamara, Ferdynand, Owidiusz, Jan, Wawrzyniec, Andrzej, Piotr, Bratumiła, Karol, Paula, Cecyliusz, Owidia, Izaak, Laurentyn, Joachim, Leszek, Franciszek",
  "06-04": "Pacyfik, Kwiryna, Gostmił, Niepełka, Karp, Skarbisław, Saturnina, Braturad, Kwiryn, Karol, Dacjan, Optat, Franciszek, Metrofan",
  "06-05": "Nikanora, Jakub, Walter, Nikanor, Doroteusz, Ferdynand, Genadiusz, Zenaida, Bonifacy, Dobrociech, Waleria, Igor, Hildebrand, Hildebranda",
  "06-06": "Artemiusz, Norberta, Sydonia, Aleksander, Paulina, Gerarda, Laurenty, Maria, Norbert, Wawrzyniec, Dominika, Więcerad, Benignus, Marceli, Gerard, Filip, Klaudiusz, Kandyda",
  "06-07": "Teresa, Meriadok, Jarosław, Wiesław, Anna, Wisław, Paweł, Roberta, Piotr, Lukrecja, Meriadek, Robert, Wiesława, Jeremiasz, Sabinian, Antoni, Jeremi",
  "06-08": "Maksymin, Jakub, Maksymina, Seweryn, Maria, Medarda, Herakliusz, Dobrociech, Wilhelm, Medard, Wyszesław",
  "06-09": "Efrem, Anna, Pelagia, Sylwester, Ryszard, Józef, Prosimir, Felicjan, Sylwestra, Kolumb, Bertrand, Maksymian, Kanimir",
  "06-10": "Cecylia, Apollo, Edgar, Wiktorian, Mauryn, Tymoteusz, Maksym, Jan, Małgorzata, Onufry, Amancjusz, Bogumiła, Bogumił, Henryk, Asteriusz, Ingolf, Diana, Wiktorianna, Aureliusz, Wiktoriana, Amata",
  "06-11": "Radomiła, Paryzjusz, Witomysł, Radomił, Flora, Jan, Anastazy, Teodozja, Barnaba, Paula, Feliks, Fortunat",
  "06-12": "Placyd, Czesława, Stefan, Nazary, Celestyna, Przybyrad, Olimpiusz, Narcyz, Nabor, Kasper, Cyryna, Tadea, Kazimierz, Bernard, Zygmunt, Gwido, Jan, Gwidon, Nazariusz, Onufry, Leon, Janina, Jarogniewa, Antonina, Mieczysława, Bazylides, Czesław, Leona, Bolesław, Kacper, Władysław, Władysława, Nabur, Wyszemir, Cyryn, Włodzimierz, Jarogniew, Antoni, Mieczysław",
  "06-13": "Grzegorz, Peregryn, Chociemir, Gerarda, Lucjan, Lubowid, Olga, Herman, Gracja, Tobiasz, Gerard, Akwilina, Antoni, Tryfiliusz",
  "06-14": "Eliza, Michał, Myślibor, Marcjan, Walery, Alojzy, Ryszard, Anastazy, Elizeusz, Metody, Digna, Ninogniew, Rufin, Feliks, Konstancja, Justyn",
  "06-15": "Leonida, Germana, Lotar, Wisław, Bernard, Albertyna, Adelajda, Witosław, Wit, Dula, Jolanta, Abraham, Edburga, Placyda, Eutropia, Oliwia, Witold, Izolda, Hezychiusz, Angelina, Benilda, Witolda, Liba, Wisława",
  "06-16": "Aureusz, Judyta, Aurelian, Tychon, Jan, Alina, Aneta, Ludgarda, Benon, Benona, Justyna, Aubert, Cyryk",
  "06-17": "Nikander, Gundolf, Marcjan, Laura, Radomił, Awit, Herweusz, Albert, Drogomysł, Izaura, Nikandra, Adolfa, Adolf, Hipacy, Waleriana, Franciszek, Agnieszka, Awita, Izaur",
  "06-18": "Teodul, Efrem, Drogoradz, Ożanna, Emil, Drogomysł, Przeborka, Marek, Maryna, Eufemiusz, Elżbieta, Amanda, Dzirżysława, Paula, Hipacy, Amand, Miłobor, Leoncjusz, Drohobysz",
  "06-19": "Gaudenty, Borzysław, Gaudencjusz, Odon, Julianna, Otto, Bonifacy, Michalina, Romualda, Gerwazy, Protazy, Romuald",
  "06-20": "Makary, Michał, Bogna, Bożena, Rafał, Sylweriusz, Rafaela, Dina, Jan, Tomasz, Florentyna, Gemma, Edburga, Jan Chrzciciel, Adalbert, Bogumiła, Benigna, Baltazar, Hektor, Franciszek, Bratomir",
  "06-21": "Alban, Rudolfa, Marta, Rudolfina, Albana, Alojzy, Terencja, Lutfryd, Terencjusz, Domamir, Alojza, Demetria, Alicja, Rajmund, Marcja, Euzebiusz, Chloe, Rudolf",
  "06-22": "Alban, Paulin, Achacjusz, Paulina, Flawiusz, Będzieciech, Eberhard, Albana, Jan, Tomasz, Innocenty, Achacy, Agenor",
  "06-23": "Agrypina, Sydonia, Anna, Atanazy, Arystokles, Maria, Albin, Jan, Piotr, Józef, Zenon, Zenona, Wanda, Edeltruda",
  "06-24": "Janusz, Danuta, Emilia, Symplicjusz, Jan, Teodulf, Longina, Janisław, Janina, Jan Chrzciciel, Symplicy, Longin, Wilhelm, Romualda, Romuald",
  "06-25": "Kineburga, Dorota, Tolisława, Febronia, Łucja, Febron, Prospera, Maksym, Prosper, Eulogiusz, Wilhelm, Adelbert, Fiebrosław, Antyd, Sozypater",
  "06-26": "Maksanty, Pelagia, Dawid, Paweł, Jan, Zdziwoj, Pelagiusz, Andrzej, Edburga, Maksencjusz, Wigiliusz, Mirogod, Jeremiasz, Salwia, Salwiusz, Jeremi",
  "06-27": "Teresa, Włodzisława, Bogodar, Samson, Maryla, Maria, Benwenut, Jan, Bożdar, Bogudar, Bożydar, Cyryl, Włodzisław, Joanna, Władysław",
  "06-28": "Wincentam, Seren, Argymir, Marcela, Paweł, Lubomir, Plutarch, Leon, Józef, Heraklides, Leona, Wincencja, Heron, Zbrosław, Ireneusz, Ekhard, Serena, Wincentyna",
  "06-29": "Emma, Dalebor, Paweł, Maria, Kasjusz, Benedykta, Piotr, Beata, Kasja, Ema, Iweta",
  "06-30": "Marcjalis, Emilia, Teobalda, Jan, Teobald, Leon, Lucyna, Bazylides, Ciechosława, Milena, Leona, Ermentruda, Władysław, Władysława, Bazyli, Trofim",
  "07-01": "Teodoryk, Estera, Aaron, Szymon, Karolina, Otto, Teobald, Marcin, Otton, Gaweł, Bogusław, Namir, Marian, Klarysa, Julian, Domicjana, Halina, Ekhard, Domicjan",
  "07-02": "Niegosława, Bogodar, Eutychiusz, Maria, Switun, Bożdar, Martynian, Bogudar, Piotr, Bożydar, Jagoda, Eutyches, Bernardyn, Urban, Juwenalis",
  "07-03": "Haralampia, Racigniew, Tomasz, Longina, Heliodor, Leon, Józef, Longin, Teodot, Leona, Mirosław, Jacek, Radomir, Kamelia, Tryfon, Anatol, Miłosław",
  "07-04": "Aurelian, Atanazy, Berta, Odo, Jacenty, Alfred, Ozeasz, Innocenty, Hiacynt, Andrzej, Piotr, Patrycy, Józef, Malwina, Wielisław, Teodor, Elżbieta, Jacek, Aggeusz, Patrycjusz, Julian, Udalryk",
  "07-05": "Michał, Marta, Cyryla, Jakub, Atanazy, Karolina, Maria, Eliasz, Zoe, Telimena, Trofima, Wilhelm, Przybywoj, Bartłomiej, Filomena, Antoni",
  "07-06": "Chociebor, Teresa, Dominik, Gotard, Łucja, Maria, Lucja, Ignacja, Dominika, Piotr, Niegosław, Nazaria, Zuzanna",
  "07-07": "German, Ilidia, Peregryn, Wilibald, Pompejusz, Lucjan, Odo, Sędzisław, Antonin, Benedykt, Metoda, Piotr, Józef, Papiasz, Hezychiusz, Metody, Ilidiusz, Sędzisława, Gościwit, Saturnin, Edelburga",
  "07-08": "Odeta, Edgar, Prokop, Akwila, Adrian, Teobalda, Kiliana, Jan, Teobald, Hadrian, Falibor, Piotr, Adolfa, Eugeniusz, Chwalimir, Adrianna, Elżbieta, Adolf, Kilian, Adriana, Hadriana",
  "07-09": "Wszebąd, Anatola, Brykcjusz, Teodoryk, Mikołaj, Ifigenia, Korneli, Aleksander, Sylwia, Adrian, Łucja, Kornel, Lucja, Florianna, Jan, Hadrian, Cyryl, Heloiza, Adrianna, Zenon, Joanna, Róża, Zenona, Korneliusz, Adolfina, Weronika, Antoni, Hadriana, Augustyn, Anatolia",
  "07-10": "Witalis, Aniela, Maurycja, Nasława, Samson, Engelbert, Sekunda, Amelia, Zacheusz, Aleksander, Rufina, January, Amalberga, Daniel, Alma, Sylwan, Racimir, Emanuel, Askaniusz, Maurycy, Filip, Leoncjusz, Rzędziwoj, Antoni, Bianor",
  "07-11": "Placyd, Zygbert, Kalina, Sabin, Pelagia, Pius, Zybracht, Zybart, Jan, Pelagiusz, Benedykt, Wyszesława, Olga, Siepraw, Zybert",
  "07-12": "Paulin, Jan Gwalbert, Hilariona, Marcjanna, Himisław, Świętożyźń, Natan, Leon, Andrzej, Hilarion, Piotr, Bruno, Janina, Bonifacy, Leona, Brunon, Epifania, Wera, Tatomir, Prokul, Imisława, Jazon, Weronika, Feliks, Prokles, Euzebiusz",
  "07-13": "Radomiła, Ernest, Sara, Sylas, Joel, Benedykt, Małgorzata, Andrzej, Trofima, Henryk, Eugeniusz, Mildreda, Świerad, Justyna, Ezdrasz, Serapion",
  "07-14": "Jakub, Marcelin, Stella, Dawid, Kamila, Dobrogost, Angelika, Fokas, Damian, Iga, Herakles, Marcel, Henryk, Kamil, Brunon, Angelina, Donald, Marcelina, Izabela, Bonawentura, Ulryk, Bohdan, Franciszek, Feliks, Kosma, Włodzimierz, Tuskana",
  "07-15": "Roksana, Anna, Atanazy, Dawid, Ignacy, Antioch, Cyriaka, Lubomysł, Daniel, Włodzimir, Henryk, Dawida, Bonawentura, Pompiliusz, Włodzimierz, Egon, Cyriak",
  "07-16": "Kanmił, Stefan, Ryta, Ermegarda, Eustacjusz, Walenty, Eustazy, Maria, Eustazja, Carmen, Walentyn, Dzierżysław, Benedykt, Faust, Andrzej, Bartłomiej, Marika, Dzirżysława, Irmegarda, Atenogenes, Eustazjusz",
  "07-17": "Januaria, Jadwiga, Sekunda, Aleksja, Sperat, Akwilin, Aneta, Leon, Andrzej, Leona, Teodozy, Donata, Marcelina, Teodota, Aleksy, Westyna, Bogdan, Dzierżykraj, Feliks, Teodozjusz, Konstancja",
  "07-18": "Szymona, Drogoradz, Szymon, Nemezjusz, Krescencjusz, Symforoza, Emilian, Arnolf, Karolina, Drogomir, Roberta, Bruno, Fryderyka, Kamil, Prymityw, Brunon, Robert, Nemezy, Maryna, Eugeniusz, Teodozja, Dziwigor, Arnulf, Drogomił, Krescenty, Julian, Uniesław, Erwin, Matern, Fryderyk, Arnold, Krescens, Justyn",
  "07-19": "Radomiła, Justa, Zdziesuł, Rufina, Lutobor, Marcin, Arseniusz, Epafras, Włodzisław, Teodor, Makryna, Symmach, Ambroży, Aurea",
  "07-20": "Czesława, Ludwika, Remigiusz, Ansegiz, Heliasz, Stosław, Modest, Remigia, Paweł, Hieronim, Eliasz, Flawiana, Małgorzata, Leon, Flawian, Czesław, Leona, Hieronima, Aureliusz, Sewera",
  "07-21": "Laurencjusz, Laurenty, Ignacy, Jan, Wiktor, Wawrzyniec, Daniel, Benedykt, Andrzej, Just, Prakseda, Zotyk, Arbogast, Klaudiusz, Julia",
  "07-22": "Lena, Marisa, Stojsław, Albin, Teofil, Stojsława, Cyryl, Józef, Milena, Naczęsława, Magdalena, Platon, Benon, Benona, Menelaus, Nicefor",
  "07-23": "Jan Kasjan, Romula, Liboriusz, Olimpiusz, Bogna, Sławosz, Żelisław, Brygida, Jan, Apolinary, Bolesław, Krystyn, Joanna, Apolinaria, Kasjan",
  "07-24": "Wojciecha, Segolena, Kinga, Wiktor, Krystyna, Olga, Gleb, Kunegunda, Augustyn, Krzesimir",
  "07-25": "Rudolfa, Alfons, Jakub, Krzysztof, Rudolfina, Nieznamir, Olimpia, Krzysztofa, Paweł, Walentyna, Sławosław, Piotr, Dariusz, Franciszek, Antoni, Rudolf",
  "07-26": "Erast, Anna, Walenty, Hanna, Jacenty, Symeon, Grażyna, Walentyn, Hiacynt, Wilhelm, Sancja, Tytus, Teodor, Mirosława, Jacek, Bartłomieja, Joachim, Krystiana",
  "07-27": "Tomisława, Maur, Wszebor, Celiusz, Jerzy, Stojsław, Celia, Lilla, Innocenty, Sergiusz, Nowellon, Bertold, Antuza, Celestyn, Lilioza, Teodor, Pantaleon, Magdalena, Aureliusz, Laurentyn, Feliks, Julia, Natalia",
  "07-28": "Nazary, Samson, Tymona, Achacjusz, Macieja, Celzjusz, Świętomir, Wiktor, Nazariusz, Melchior, Alfonsa, Achacja, Achacy, Urban, Antoni, Tymon, Tina",
  "07-29": "Faustyn, Marta, Serapia, Cirzpibog, Beatrycze, Flora, Maria, Serafina, Symplicjusz, Prospera, Olaf, Antonin, Prosper, Symplicy, Wilhelm, Lucyla, Eugeniusz, Teodor, Lucyliusz, Konstantyn, Cirzpisława, Rufin, Feliks",
  "07-30": "Ubysław, Julita, Sekunda, Ingeborga, Leopold, Swojsław, Ursus, Piotr, Rościsław, Zdobysław, Maksyma, Abdon",
  "07-31": "German, Adam, Emilian, Ignacy, Lubomir, Jan, Ernesta, Fabia, Iga, Alfonsa, Fabiusz, Demokryt, Beat, Helena, Justyn",
  "08-01": "Eleazar, Rudolfa, Alfons, Rudolfina, Wiara, Aleksander, Nemezjusz, Nadzieja, Etelwold, Konrada, Antonin, Akcjusz, Nemezy, Brodzisław, Marceli, Salomea, Konrad, Leoncjusz, Wiercisław, Rudolf, Justyn",
  "08-02": "Alfreda, Stefan, Rutyliusz, Karina, Gustaw, Świętosław, Maria, Maksym, Eliasz, Piotr, Teodota, Euzebiusz",
  "08-03": "Marana, Dalmacjusz, Szczepan, Lidia, Symeon, Nikodem, Piotr, Dalmacy, Eufroniusz, Cyra, Kamelia, Nikodema, Miłosław, Augustyn",
  "08-04": "Pęcisława, Dominik, Prokop, Pękosław, Krescencjusz, Arystarch, Maria, Tertuliana, Jan, Tertulian, Andrzej, Pęcisław, Krescenty, Perpetua, Rajner, Mironieg, Fryderyk, Protazy, Franciszek, Krescens, Justyn",
  "08-05": "Kasjana, Parys, Abel, Oswalda, Nonna, Maria, Wirginia, Afra, Memiusz, Oswald, Wenancja, Kasjan, Wenancjusz, Wenanty, Cyriak",
  "08-06": "Stefan, Jakub, Walburga, Maria, January, Felicysym, Sława, Oktawian, Just, Piotr, Namir, Wincenty, Nasław",
  "08-07": "Klaudia, Dorota, Licyniusz, Jagna, Konrada, Albert, Andromeda, Edmunda, Kajetan, Licynia, Agatangel, Wincenty, Donat, Dobiemiar, Konrad, Sykstus, Doryda, Edmund",
  "08-08": "Smaragd, Maryniusz, Esmeralda, Largus, Bonifacja, Dominik, Miron, Emilian, Maryn, Szmaragd, Jan, Wiktor, Cyryl, Sylwiusz, Niegosław, Niezamysł, Joanna, Mirona, Sewer, Cyriak",
  "08-09": "Teresa, Roland, Marcjan, Marcelin, Doroteusz, Roman, Miłorad, Jan, Ryszard, Irena, Klarysa, Edyta, Julian, Domicjana, Falkon, Domicjan, Romuald",
  "08-10": "Bohdana, Bogodar, Hugona, Laurencjusz, Hugo, Laurenty, Bernard, Bogdana, Bożdar, Wawrzyniec, Bogudar, Bożydar, Wirzchosław, Amadeusz, Prochor, Bogdan, Asteria, Bohdan, Amadea, Borys, Hugon",
  "08-11": "Aleksander, Lilia, Tyburcy, Tyburcja, Telimena, Piotr, Włodzimir, Włościwoj, Herman, Zuzanna, Filomena, Tyburcjusz, Rufin, Ligia, Włodzimierz, Klara",
  "08-12": "Makary, Leonida, Largus, Eunomia, Łukasz, Julianna, Anicet, Innocenty, Bądzsław, Herkulan, Aniceta, Joanna, Digna, Hilaria, Fotyn, Julian, Euzebiusz, Cyriak, Lech, Klara, Wiktoria",
  "08-13": "Radomiła, Kasjana, Radegunda, Wolebor, Poncjan, Maksym, Jan, Hipolit, Hipolita, Benild, Diana, Kasjan, Wigbert, Helena, Konkordia, Sekundyn",
  "08-14": "Machabeusz, Dobrowoj, Ursycyn, Majnard, Maksymilian, Alfred, Dobrowoja, Kalikst, Elżbieta, Marceli, Atanazja, Euzebiusz",
  "08-15": "Napoleon, Stefan, Alipiusz, Miriam, Arnolf, Maria, Armida, Julianna, Trzebiemir, Arnulf, Tarsycjusz",
  "08-16": "Stefan, Domasuł, Arsacjusz, Roch, Domarad, Laurencjusz, Emil, Laurenty, Anioł, Symplicjusz, Wawrzyniec, Symplicy, Tytus, Diomedes, Eleuteriusz, Piotra, Ciechosław, Saba, Eleuteria, Ambroży, Eleutery",
  "08-17": "Eliza, Straton, Zawisza, Anita, Septymiusz, Miron, Liberat, Angelika, Maria, Julianna, Maksym, Jacenty, Septym, Nastazja, Anastazy, Hiacynt, Bonifacy, Rustyk, Rogat, Żanna, Serwiusz, Jacek, Joanna, Bertram, Magdalena, Jaczewoj, Mirona, Euzebiusz, Klara, Rustyka",
  "08-18": "Firmin, Lena, Eryk, Laura, Agapita, Nela, Jan, Bronisław, Piotr, Agapit, Włodzimir, Żyrosława, Sancja, Tworzysława, Bogusław, Paula, Eryka, Helena, Ludwik, Klara, Ilona",
  "08-19": "Emilia, Agapiusz, Alfred, Jan, Sebald, Wiktor, Juliusz, Andrzej, Bolesław, Ezechiel, Marian, Donat, Julian, Luiza, Magnus, Ludwik",
  "08-20": "Świelub, Stosław, Krzysztof, Sabin, Łucjusz, Filibert, Paweł, Samuela, Maria, Bernard, Filiberta, Sobiesław, Leowigild, Maksym, Hieronim, Eliasz, Lucjusz, Samuel, Małgorzata, Sieciech, Sewer",
  "08-21": "Maksymilian, Paulina, Agapiusz, Pius, Baldwin, Bernard, Baldwina, Fidelisa, Cyriaka, Apolinary, Daniel, Anastazy, Andrzej, Męcimir, Joanna, Apolinaria, Fidelis, Franciszek, Wiktoria",
  "08-22": "Symforiana, Sieciesław, Lambert, Zygfryda, Oswalda, Laurencjusz, Dalegor, Maria, Bernard, Albin, Tymoteusz, Jan, Wawrzyniec, Benicjusz, Symforian, Namysław, Hipolit, Bolesław, Teonas, Cezary, Fabrycjan, Oswald, Hipolita, Zygfryd, Teona, Magdalena, Filip, Lamberta, Joachim, Pankracy, Agatonik",
  "08-23": "Archelaus, Jakub, Teonilla, Sydonia, Zacheusz, Żelisław, Brygida, Leoncja, Maksym, Wiktor, Apolinary, Filipa, Flawia, Lubomira, Feliksa, Flawian, Róża, Sulirad, Walerian, Piotra, Ireneusz, Klaudiusz, Cyriak, Kalinik",
  "08-24": "Jerzy, Malina, Anita, Eutychiusz, Bartosz, Emilia, Natanael, Cieszymir, Patrycy, Patryk, Bartłomiej, Eutyches, Michalina, Joanna, Patrycjusz, Audoen, Halina",
  "08-25": "Michał, Grzegorz, Teodoryk, Gaudenty, Peregryn, Hermina, Gaudencjusz, Poncjan, Tomasz, Józef, Elwira, Wincenty, Kalasanty, Julian, Luiza, Arediusz, Ludwik, Euzebiusz, Patrycja, Genezjusz",
  "08-26": "Teresa, Aleksander, Maksymilian, Wirzchosława, Maria, Wiktorian, Symplicjusz, Konstancjusz, Hadrian, Symplicy, Wirzchosław, Dobroniega, Adrianna, Joanna, Wiktorianna, Wiktoriana, Ireneusz, Fortunat, Hadriana, Natalia, Sandra",
  "08-27": "Dominik, Stosław, Marcelin, Jan, Liceriusz, Małgorzata, Piotr, Gebhard, Manea, Józef, Liceria, Amadeusz, Rufus, Cezary, Monika, Amadea, Sabinian, Cezariusz, Przybymir, Fortunat, Agnieszka, Serapion, Honorat",
  "08-28": "Alfons, Wyszymir, Joachima, Aleksander, Wyszomir, Sobiesław, January, Pelagiusz, Adelinda, Hermes, Bonifacy, Aleksy, Mojżesz, Julian, Stronisław, Feliks, Fortunat, Patrycja, Augustyn, Bibian",
  "08-29": "Michał, Mederyka, Krescencjusz, Sabina, Beatrycze, Świętosław, Flora, Eutymiusz, Jan, Andrzej, Piotr, Jan Chrzciciel, Mederyk, Racibor, Krescenty, Hipacy, Krescens, Sebbus",
  "08-30": "Tekla, Miron, Ingeborga, Świetlana, Damroka, Jan, Swojsław, Małgorzata, Piotr, Rebeka, Częstowoj, Gaudencja, Latika, Adaukt, Feliks, Częstowojna",
  "08-31": "Paulin, Aidan, Świętosław, Albertyna, Jan, Prymian, Nikodem, Arystydes, Józef, Teodot, Amat, Izabela, Arystyda, Optat, Bohdan, Solidariusz, Rajmund, Rajmunda",
  "09-01": "Witalis, Michał, Ruta, Sator, August, Anna, Beatrycze, Idzi, Amon, Dzierżysław, Melecjusz, Bronisław, Egidia, Satora, Gedeon, Donat, Bronisława, Feliks, Sykstus, Miłodziad, Werena",
  "09-02": "Eliza, Zofia, Stefan, Oliwier, Adelina, Salomon, Jakub, Aleksander, Walenty, Elpidiusz, Seweryn, Stefania, Dionizy, Jan, Ingryda, Walentyn, Apolinary, Antonin, Oktawian, Piotr, Wilhelm, Czesław, Elpidia, Sobiemysł, Teodor, Absalon, Dziesław, Zenon, Julian, Bohdan, Franciszek",
  "09-03": "Maryniusz, Grzegorz, Feba, Serapia, Szymon, Natalis, Mojmir, Bartosz, Bazylisa, Erazma, Gerarda, Maryn, Jan, Bronisław, Przecław, Bartłomiej, Izabela, Przedsław, Gerard, Antoni",
  "09-04": "Katarzyna, Imelda, Ermegarda, Rozalia, Stella, Heliodora, Boromea, Maria, Iwo, Ida, Hermiona, Liliana, Przemysł, Bonifacy, Felicyta, Teodor, Przemysław, Daniela, Iwona, Scypion, Kanuta, Mojżesz, Marceli, Julian, Irmegarda, Sergia, Rościgniew, Kanizja, Rajmunda, Gwidona, Kandyda",
  "09-05": "Peregryn, Budziboj, Dorota, Wiktoryn, Wawrzyniec, Przyboj, Herkulan, Racława, Herakles, Teodor, Herkules, Wiktoryna, Fereol, Racław, Justyna, Rozwita, Urban, Stronisława, Racisław, Bertyn",
  "09-06": "Michał, Donacjan, German, Gundolf, Zachary, Bolemir, Liberat, Aleksja, Onezyfor, Albin, Manswet, Bogdana, Tomasz, Zachariasz, Faust, Uniewit, Eugeniusz, Beata, Eugenia, Eleuteriusz, Eleuteria, Bertrand, Magnus, Eleutery",
  "09-07": "Domasuł, Teodoryk, Pamfil, Eupsychia, Sozont, Ryszard, Domasława, Melchior, Gratus, Eupsychiusz, Dobrobąd, Regina",
  "09-08": "Bratumił, Adam, Adrian, Radosława, Maria, Serafina, Teofil, Amon, Sergiusz, Marianna, Nestor, Adrianna, Zenon, Wiola, Alan, Euzebiusz, Radosław, Adriana",
  "09-09": "Audomar, Aniela, Straton, Ożanna, Bolemira, Sewerian, Jakub, Bolemir, Otmar, Radosława, Doroteusz, Dionizy, Drogomir, Jan, Sergiusz, Sobiebor, Piotr, Świecław, Sobiesąd, Jacek, Gorgoniusz, Ścibora, Aureliusz, Franciszek, Augustyn",
  "09-10": "Pulcheria, Sebastian, Mikołaj, Łukasz, Łucjusz, Agapiusz, Anioł, Bernard, Sobiesław, Klemens, Wiktor, Nimfodora, Lucjusz, Datyw, Leon, Piotr, Aldona, Leona, Teodor, Karol, Izabela, Poliana, Monika, Polianna, Franciszek, Feliks, Polian, Kandyda, Salwiusz, Antoni, Dydym, Mścibor",
  "09-11": "Diodora, Naczęsław, Emilian, Ademar, Pafnucy, Dydymus, Jacenty, Jan, Teodora, Hiacynt, Krzesisław, Dagna, Diomedes, Jacek, Aisza, Wincenty, Bonawentura, Krzesława, Prot, Feliks, Dydym, Diodor",
  "09-12": "Marlena, Sylwin, Maria, Gwido, Teodulf, Maja, Gwidon, Sylwina, Cyrus, Piotr, Amadeusz, Tacjan, Macedoniusz, Franciszek, Juwencjusz",
  "09-13": "Genadia, Haralampia, Aleksander, Eulogia, Maria, Litoriusz, Apolinary, Jan Chryzostom, Makrobiusz, Eulogiusz, Mauryliusz, Amat, Dobielut, Julian, Aureliusz, Morzysław, Filip",
  "09-14": "Salustia, Roksana, Szymon, Racigniew, Bernard, Albert, Jan, Wiktor, Siemomysł, Matern, Radomira",
  "09-15": "Roland, Nikomedes, Katarzyna, Jakert, Filoteusz, Maria, Albin, Nikodem, Eutropia, Dolores, Kamil, Teodor, Filotea, Walerian, Nicetas, Lolita, Jeremiasz, Ekhard, Jeremi",
  "09-16": "Geminian, Innocentyna, Antym, Innocencja, Eufemia, Edda, Korneli, Ludmiła, Abundancjusz, Cyprian, Kamila, Ariadna, Łucja, Ninian, Kornel, Sędzisław, Jan, Wiktor, Sebastiana, Abundancja, Edyta, Innocenta, Eugenia, Korneliusz, Franciszek",
  "09-17": "Lambert, Narcyz, Dargosław, Dziebor, Zygmunta, Sokrates, Szczęsny, Zygmunt, Szczęsna, Gordian, Cherubin, Teodora, Piotr, Kolumba, Hildegarda, Drogosław, Robert, Makryn, Walerian, Lamberta, Franciszek, Justyna, Dezyderiusz, Justyn",
  "09-18": "Zofia, Ariadna, Stefania, Zachariasz, Irena, Castiel, Ryszarda, Józef, Dobrowit, Tytus, Metody, Sobierad, Stanisław, Fereol, Baltazar, Aretas",
  "09-19": "Paloma, Festus, Dezydery, Marta, Nilus, Alfons, Eutychiusz, Arnolf, Januariusz, Maria, January, Nila, Eliasz, Więcemir, Teodor, Peleusz, Arnulf, Zuzanna, Prokul, Wilhelmina, Prokles, Konstancja, Trofim, Dezyderiusz",
  "09-20": "Glicery, Gliceriusz, Eustachiusz, Matea, Agapiusz, Sokrates, Paweł, Dionizy, Helmut, Miłowuj, Klemens, Jan, Teopista, Filipa, Eustachy, Andrzej, Fausta, Teodor, Perpetua, Euzebia, Franciszek, Teopist",
  "09-21": "Pacyfik, Daria, Pamfil, Ifigenia, Bożeciech, Melisa, Aleksander, Melecjusz, Marek, Kastor, Hipolit, Maura, Mateusz, Hipolita, Bernardyna, Konon, Jonasz, Euzebiusz, Mira",
  "09-22": "Witalis, Daria, Imbram, Emmeran, Tacjusz, Ignacy, Tomasz, Innocenty, Wiktor, Eksuperiusz, Kandyd, Emmeram, Prosimir, Bazyla, Digna, Emeryta, Jonasz, Maurycy, Józefa, Joachim, Feliks",
  "09-23": "Tekla, Zofia, Adamnan, Krzysztof, Pius, Pola, Jan, Konstancjusz, Poliksena, Andrzej, Piotr, Bogufała, Bogusław, Liwiusz, Lina, Bernardyna, Linus, Wiercisław, Boguchwała, Antoni",
  "09-24": "Pacyfik, Jaromir, Tomir, Gerarda, Seweryn, Twardomir, Maria, Uniegost, Pafnucy, Kolumba, Herman, Morzysława, Gerard, Amata",
  "09-25": "Firmin, Ermenfryda, Gaspar, Kleofas, Ermenfryd, Galfryd, Wawrzyniec, Herkulan, Piotr, Włodzimir, Irmfryda, Kamil, Włodzisław, Rufus, Minigniew, Aurelia, Wincenty, Irmfryd, Świętopełk, Włodzimira, Władysław, Władysława, Franciszek",
  "09-26": "Lena, Teresa, Nilus, Budziwoj, Kasper, Dalmacjusz, Kalistrat, Majnard, Cyprian, Łucja, Lucja, Nila, Damian, Amancjusz, Dalmacy, Łękomir, Justyna, Kosma, Nil, Euzebiusz",
  "09-27": "Eleazar, Zygbert, Hiltruda, Zybracht, Mirela, Jan, Wawrzyniec, Przedbor, Gajusz, Adolfa, Mirabella, Amadeusz, Wincenty, Gaja, Adolf, Urban, Zybert",
  "09-28": "Lena, Myślibor, Salomon, Sylwin, Laurencjusz, Wacława, Jan, Wawrzyniec, Amalia, Eksuperiusz, Sylwina, Wacław, Myślibora, Marek, Więcesław, Alodiusz, Bernardyn, Więcesława, Tymon",
  "09-29": "Michał, Mikołaj, Rafał, Grimbald, Fraternus, Dadzbog, Ludwin, Gabriel, Gajana, Lutwin, Michalina, Dadzboga, Teodota, Dariusz, Franciszek, Cyriak, Rypsyma",
  "09-30": "Zofia, Grzegorz, Felicja, Nadzieja, Znamir, Hieronim, Wiktor, Ursus, Imisław, Honoriusz, Hieronima, Franciszek",
  "10-01": "Teresa, Remigiusz, Cieszysław, Danuta, Krescencjusz, Roman, Małobąd, Jan, Bawon, Maksyma, Krescenty, Krescens, Ariel, Julia",
  "10-02": "Berengar, Aleksandra, Ursycyn, Teofil, Nasiębor, Berengaria, Leodegar, Eleuteriusz, Eleuteria, Stanimir, Eleutery, Antoni",
  "10-03": "Teresa, Ewald, Ermegarda, Sirosław, Częstobrona, Cyprian, Gerarda, Romana, Eustachy, Sulibor, Ewalda, Augustyna, Irmegarda, Gerard, Maksymian, Kandyda",
  "10-04": "Dobromiła, Konrada, Lucjan, Faust, Piotr, Dalwin, Petroniusz, Dalewin, Edwina, Franciszek, Konrad, Euzebiusz, Aurea, Łucjan",
  "10-05": "Placyd, Maur, Eutychiusz, Wiktoryn, Apolinary, Konstancjusz, Flawia, Flawiana, Tulia, Faustyna, Bartłomiej, Igor, Donat, Galla, Charytyna, Rajmund, Justyn",
  "10-06": "Wiara, Renat, Roman, Baldwin, Baldwina, Bronisław, Bruno, Fryderyka, Brunon, Askaniusz, Monika, Magnus, Artur, Alberta",
  "10-07": "Bachus, Tekla, Stefan, Bakchus, Amelia, August, Rosława, Maria, Mirela, Blanka, Sergiusz, Amalia, Rościsława, Marek, Mateusz, Marceli, Rodsław, Apulejusz, Justyna",
  "10-08": "Taida, Pelagia, Laurencja, Brygida, Ewodia, Symeon, Ewodiusz, Marcin, Gunter, Demetriusz, Waleria, Guncerz, Artemon, Gratus, Ginter, Marcjusz, Ludwik",
  "10-09": "Bogodar, Aaron, Dionizjusz, Sara, Dionizy, Jan, Bożdar, Bogudar, Sybilla, Abraham, Bożydar, Gunter, Guncerz, Wincenty, Ginter, Atanazja, Arnold, Ludwik, Przedpełk",
  "10-10": "Gereon, Tomił, German, Dionizjusz, Kalistrat, Twardostoj, Paulina, Maria, Dionizy, Kasjusz, Jan, Tomiła, Daniel, Samuel, Leon, Rustyk, Leona, Lutomir, Przemysław, Eleuteriusz, Eleuteria, Franciszek, Alderyk, Eleutery, Rustyka, Adalryk",
  "10-11": "Firmin, Placyd, Dobromiła, Aleksander, Emilian, Emil, Probus, Maria, Zenaida, Domaczaja, Gromisław, Aldona, Brunon, Burchard, Marian, Emanuel, Andronik, Gardomir",
  "10-12": "Grodzisław, Eustachiusz, Maksymilian, Maksymiliana, Marcin, Eustachy, Witold, Witolda, Wilfryd, Edwin, Grzymisław, Edwina, Feliks, Cyriak, Serafin",
  "10-13": "Gerald, Mikołaj, Reginbald, Edward, Gerbert, Karp, Marcjalis, Wacława, Teofil, January, Daniel, Faust, Wacław, Geraldyna, Florencjusz, Magdalena, Siemisław, Maurycy, Florenty, Wenancjusz, Wenanty, Honorat",
  "10-14": "Gwendalina, Donacjan, Gaudenty, Dominik, Paraskewa, Fortunata, Gaudencjusz, Bernard, Witalia, Małgorzata, Just, Kalikst, Gajusz, Rustyk, Burchard, Gaja, Alan, Fortunat, Rustyka",
  "10-15": "Teresa, Tekla, Teodoryk, Jadwiga, Leonard, Eutymiusz, Antioch, Roger, Filipa, Gościsława, Bruno, Drogosław, Brunon, Drogosława, Sewer",
  "10-16": "Elifiusz, Aurelian, Grzegorz, Jadwiga, Walenty, Emil, Gerarda, Dionizy, Martynian, Florentyna, Walentyn, Nereusz, Małgorzata, Iga, Maksyma, Gaweł, Florentyn, Gerard, Ambroży, Elifia, Lubgost",
  "10-17": "Rudolfa, Laurentyna, Mamelta, Rudolfina, Ignacy, Wiktor, Małgorzata, Andrzej, Milawia, Lucyna, Heron, Florentyn, Marian, Sulisława, Seweryna, Zuzanna, Augustyna, Niceta, Rudolf",
  "10-18": "Remigiusz, Siemowit, Łukasz, Remigia, Asklepiades, Just, Piotr, Julian, Miłobrat, Bratomił, Tryfonia",
  "10-19": "Ptolemeusz, Fredeswinda, Laura, Pelagia, Łucjusz, Akwilin, Paweł, Ferdynand, Jan, Pelagiusz, Lucjusz, Piotr, Fryda, Skarbimir, Izaak, Kleopatra, Ziemowit",
  "10-20": "Witalis, Jerzy, Artemiusz, Jan Kanty, Budzisława, Aurora, Maria, Apollon, Żywia, Irena, Andrzej, Felicjan, Aureliusz",
  "10-21": "Wendelin, Urszula, Jakub, Celina, Pelagia, Malchus, Bernard, Pelagiusz, Samuel, Hilarion, Piotr, Dacjusz, Karol, Elżbieta, Dobromił, Klementyna, Zotyk, Hilary, Wszebora, Letycja",
  "10-22": "Nunilona, Kordula, Melaniusz, Gliceria, Józefina, Marek, Donat, Salomea, Kordian, Filip, Sewer, Alodia, Euzebiusz, Abercjusz, Ingbert",
  "10-23": "Klotylda, German, Małogost, Marlena, Seweryn, Ignacy, Roman, Giedymin, Jan, Domicjusz, Gracjana, Gracjanna, Bartłomiej, Honorat",
  "10-24": "Boleczest, Areta, Rafał, Walentyna, Jan, January, Alojzy, Septym, Marcin, Aneta, Józef, Marek, Prokul, Filip, Timur, Aretas, Feliks, Prokles, Antoni, Pamfilia",
  "10-25": "Maur, Gaudenty, Daria, Cyryna, Tadea, Kryspinian, January, Chryzant, Antonin, Chryzanta, Tadeusz, Inga, Wojmir, Sambor, Kryspin, Prot, Hilary, Cyryn, Teodozjusz",
  "10-26": "Fulko, Lutosław, Ewaryst, Marcjan, Ludomiła, Lucjan, Dymitr, Bernard, Felicysym, Damian, Demetriusz, Lucyna, Rustyk, Amanda, Bonawentura, Amand, Łucjana, Leonarda, Łucjan, Rustyka",
  "10-27": "Wielebor, Sabina, Kapitolina, Józef, Manfred, Siestrzemił, Iwona, Manfreda, Barnim, Frumencjusz",
  "10-28": "Wielimir, Domabor, Cyryla, Szymon, Faro, Juda Tadeusz, Cyryl, Tadeusz, Anastazja, Wszeciech, Wincenty, Fidelis, Ksymena, Honorat",
  "10-29": "Narcyz, Zenobiusz, Walenty, Maksymilian, Żelibor, Ida, Dalimir, Walentyn, Teodor, Felicjan, Donat, Wioletta, Euzebia, Dalia, Franciszek, Serafin, Ermelinda, Lubgost",
  "10-30": "Makary, German, Amparo, Sęczygniew, Liberat, Zenobia, Anioł, Maksym, Sulimir, Eutropia, Przemysław, Marceli, Julian, Benwenuta, Gerard, Klaudiusz, Saturnin, Edmund, Serapion",
  "10-31": "Kwintyn, Alfons, Narcyz, Krzysztof, Łukasz, Krzysztofa, Tomasz, Antonin, Saturnina, Augusta, Lucyla, Lucyliusz, Bega, Urban, Godzimir, Saturnin, Wolfgang",
  "11-01": "Benigny, Konradyn, Jakub, Licyniusz, Seweryn, Maria, Konradyna, Julianna, Jan, Warcisław, Nikola, Andrzej, Cyrenia, Benignus, Robert, Teodor, Wiktoryna, Marceli, Rajner",
  "11-02": "Bohdana, Jerzy, Marcjan, Agapiusz, Wiktoryn, Wojsława, Małgorzata, Teodot, Eudoksjusz, Tobiasz, Wojsław, Bohdan, Ambroży, Malachiasz, Stomir",
  "11-03": "Witalis, German, Szymon, Walenty, Sylwia, Hubert, Teofil, Walentyn, Marcin, Piotr, Bogumił, Huberta, Ginewra, Cezary, Chwalisław, Wenefryda",
  "11-04": "Witalis, Karol Boromeusz, Olgierd, Modesta, Emeryka, Emeryk, Franciszka, Sędomir, Agrykola, Amancjusz, Dżesika, Mścisława, Karol, Sędzimir, Mojżesz, Perpetua, Mszczujwoj, Helena, Mściwoj",
  "11-05": "Florian, Dominik, Gerald, Blandyna, Filoteusz, Teotym, Sławomir, Blandyn, Trofima, Marek, Sylwan, Elżbieta, Dalmir, Filotea, Dalimiar, Magnus",
  "11-06": "Anita, Wincenta, Walenty, Melaniusz, Leonard, Bogdana, Hieronim, Teobald, Walentyn, Krystyna, Nonnus, Daniela, Trzebowit, Feliks, Ziemowit, Gabriela, Kalinik",
  "11-07": "Nikander, Engelbert, Karina, Wilibrord, Żelibrat, Amaranta, Longina, Herkulan, Melchior, Przemił, Longin, Nikandra, Florencjusz, Hezychiusz, Rufus, Wincenty, Ingarda, Gizbert, Florenty, Achilles, Antoni",
  "11-08": "Maur, Symforiana, Sędziwoj, Bogodar, Sewerian, Wilehad, Paweł, Symplicjusz, Wiktoryn, Jan, Bożdar, Bogudar, Godfryd, Marcin, Gotfryd, Symforian, Bożydar, Symplicy, Józef, Klarus, Bogdan, Bohdan, Klaudiusz, Sewer",
  "11-09": "Benigny, Aleksander, Ścibor, Gorzysław, Lilla, Ursyn, Benignus, Orestes, Świecław, Teodor, Nestor, Elżbieta, Dziwigor, Joanna, Agrypin, Bogdan, Ludwik, Genowefa",
  "11-10": "Monitor, Lena, Stefan, Nela, Florencja, Probus, Nimfa, Leon, Andrzej, Just, Demetriusz, Tryfena, Leona, Anian, Ludomir, Uniebog",
  "11-11": "Sobieżyr, Maciej, Menas, Pafnucy, Jan, Marcin, Spycisław, Bartłomiej, Maryna, Teodor, Anastazja, Prot, Jozafat, Alicja",
  "11-12": "Arsacjusz, Nilus, Emilian, Renat, Czcibor, Publiusz, Jan, Nila, Renata, Gabriel, Witold, Kunibert, Witolda, Cibor, Aureliusz, Jonasz, Jozafat",
  "11-13": "Brykcjusz, Liwia, Eutychian, German, Mikołaj, Walenty, Probus, Stanisława, Jan, Alojzy, Wiktor, Walentyn, Antonin, Benedykt, Kalikst, Krystyn, Włodzisław, Eugeniusz, Arkadiusz, Mateusz, Dydak, Stanisław, Arkady, Augustyna, Arkadia, Izaak, Paschazy, Nicefor",
  "11-14": "Stefan, Lewin, Mikołaj, Ścibor, Laurenty, Agryppa, Jan, Wawrzyniec, Agata, Damian, Wszerad, Józef, Teodot, Świecław, Klementyn, Elżbieta, Ścibora, Jukund, Antyd, Agrypin, Hipacy, Filomen, Kosma, Serapion",
  "11-15": "Alfons, Leopold, Idalia, Albert, Roger, Józef, Przybygniew, Leopoldyna, Artur",
  "11-16": "Audomar, Otmar, Łucja, Dionizy, Patrokles, Niedamir, Małgorzata, Piotr, Gertruda, Marek, Aureliusz, Ariel, Eucheriusz, Edmund",
  "11-17": "Grzegorz, Drogoradz, Arabella, Roch, Zacheusz, Hugo, Floryn, Dionizy, Drogomir, Jan, Zbysław, Sulibor, Elżbieta, Alfeusz, Salomea, Jozafat, Wiktoria, Hugon",
  "11-18": "Aniela, Cieszymysł, Odon, Karolina, Leonard, Roman, Odo, Tomasz, Galezy, Hezychiusz, Noe, Józefa, Klaudyna, Gabriela, Filipina, Agnieszka",
  "11-19": "Barlaam, Dargosław, Małowid, Jakub, Seweryn, Paweł, Dionizy, Maksym, Faust, Teodor, Elżbieta, Kryspin, Salomea, Matylda",
  "11-20": "Narzes, Tespezjusz, Grzegorz, Fortunata, Rafał, Agapiusz, Maria, Symplicjusz, Lubomir, Oktawiusz, Sylwester, Eustachy, Ampeliusz, Symplicy, Tespezy, Ampelia, Sędzimir, Sylwestra, Maksencja, Feliks, Oktawia, Agnieszka, Edmund",
  "11-21": "Gelazja, Janusz, Wiesław, Maria, Albert, Heliodor, Piotr, Gelazy, Elwira, Rufus, Kolumban, Twardosław, Konrad, Regina",
  "11-22": "Maur, Filemon, Cecylia, Stefan, Ernestyna, Filemona, Salwator, Marek, Wszemił, Wszemiła",
  "11-23": "Michał, Grzegorz, Adela, Fotyna, Klemens, Syzyniusz, Amfiloch, Orestes, Lukrecja, Felicyta, Przedwoj",
  "11-24": "Chryzogon, Aleksander, Walenty, Emilia, Flora, Twardomir, Roman, Felicjanna, Jan, Walentyn, Andrzej, Piotr, Jaśmina, Dobrosław, Felicjana, Pęcisław, Biruta, Firmina, Joachim, Protazy, Franciszek, Dargorad",
  "11-25": "Merkury, Katarzyna, Erazm, Beatrycze, Maria, Józef, Elżbieta, Mojżesz, Tęgomir, Godzimir",
  "11-26": "Stylian, Delfin, Syrycjusz, Dobiemiest, Alipiusz, Ammoniusz, Konrada, Leonard, Pachomiusz, Ammonia, Jan, Sylwester, Faust, Piotr, Hezychiusz, Teodor, Sylwestra, Nikon, Marceli, Lechosław, Kajetana, Konrad, Lechosława",
  "11-27": "Dominik, Wergilia, Jarosław, Zygfryda, Wergiliusz, Achacjusz, Jakub, Gustaw, Walery, Stojgniew, Maksym, Wirgilia, Małgorzata, Oda, Żaneta, Achacy, Prymityw, Astryda, Wirgiliusz, Zygfryd, Damazy, Irenarch, Walerian, Jozafat, Bernardyn, Franciszek, Radosław, Gustawa",
  "11-28": "Stefan, Sostenes, Grzegorz, Jakub, Berta, Radowit, Manswet, Tristan, Teodora, Eustachy, Andrzej, Lesław, Piotr, Gunter, Guncerz, Lesława, Gościrad, Rufus, Kwieta, Ginter, Krescenty, Walerian, Zdziesław, Zdzisław, Feliks, Urban",
  "11-29": "Paramon, Walter, Dionizy, Pafnucy, Błażej, Syzyniusz, Przemysł, Błażeja, Klementyna, Bolemysł, Siedlewit, Fryderyk, Filomen, Franciszek, Saturnin, Radbod",
  "11-30": "Tadea, Zozym, Konstancjusz, Andrzej, Maura, Kutbert, Fryderyk, Justyna, Zbysława",
  "12-01": "Rudolfa, Eligia, Godzisław, Gosław, Rudolfina, Aleksander, Ananiasz, Florencja, Blanka, Sobiesław, Jan, Sobiesława, Długomił, Prokul, Gosława, Antoni, Edmund, Rudolf, Natalia, Eligiusz",
  "12-02": "Rafał, Walenty, Sylweriusz, Paulina, Bibiana, Budzisława, Maria, Wiktoryn, Sulisław, Balbina, Jan, Walentyn, Zbylut, Bibianna, Sylwan, Budzisław, Aurelia, Ludwina",
  "12-03": "Uniemir, Emma, Mirokles, Ksawery, Łucjusz, Gerlinda, Atalia, Biryn, Lucjusz, Franciszek Ksawery, Kryspin, Ema, Hilaria, Kasjan, Franciszek",
  "12-04": "Barbara, Cieszybor, Teofan, Osmund, Krystian, Bernard, Klemens, Jan, Marut, Hieronim, Melecjusz, Piotr, Ciechosława, Bratumiła, Bratomiła, Maruta, Benon, Ciechosław, Filip, Feliks, Marutas, Chrystian",
  "12-05": "Pęcisława, Gerald, Mikołaj, Dalmacjusz, Sabina, Kryspina, Jan, Anastazy, Juliusz, Krystyna, Pelin, Dalmacy, Geraldyna, Bartłomiej, Kryspin, Saba, Feliks, Pelina",
  "12-06": "Mikołaj, Polichroniusz, Emilian, Leoncja, Angelika, Nikola, Heliodor, Abraham, Piotr, Bonifacy, Morzysława, Dionizja, Jarogniew, Tercjusz",
  "12-07": "Eutychian, Polikarp, Siemirad, Sabin, Atenodor, Marcin, Ninomysł, Zdziemił, Józefa, Ambrozja, Ambroży, Agaton, Urban, Marcisław",
  "12-08": "Makary, Narcyza, Apollo, Hildemar, Potapiusz, Euchariusz, Euchary, Maria, Alojzy, Elfryda, Patapiusz, Świedarg, Marian, Edyta, Marika, Romaryk, Boguwola",
  "12-09": "Liboriusz, Wiesław, Delfina, Chwalimira, Naczęmir, Jan, Aneta, Piotr, Waleria, Wrocisław, Wielisława, Prokul, Wiesława, Leokadia, Gorgonia",
  "12-10": "Maur, Brajan, Judyta, Grzegorz, Bogdał, Polidor, Menas, Maria, Unirad, Switun, Tomasz, Unierad, Loreta, Daniel, Bogodał, Hermogenes, Andrzej, Melchiades, Donat, Bogdan, Eulalia, Julia",
  "12-11": "Stefan, Sabin, Walenty, Waldemar, Poncjan, Maria, Hieronim, Walentyn, Daniel, Wilburga, Wojmir, Damazy, Gościwit, Artur",
  "12-12": "Liberata, Paramon, Maksanty, Amonaria, Merkuria, Aleksander, Suliwuj, Bartosz, Epimach, Konrada, Adelajda, Franciszka, Konstancjusz, Dagmara, Przybysława, Edburga, Synezjusz, Spirydion, Maksencjusz, Gościwit, Dionizja, Konrad, Justyn",
  "12-13": "Otylia, Samboja, Walenty, Jodok, Łucja, Antioch, Auksencjusz, Walentyn, Edburga, Auksenty, Auksencja, Orestes, Eugeniusz, Róża, Aubert, Antoni",
  "12-14": "Wiator, Nikazjusz, Pompejusz, Gorzysław, Nikazy, Zozym, Jan, Izydor, Sławobor, Bertold, Arseniusz, Eutropia, Agnellus, Nahum, Teodor, Heron, Wenancjusz, Noemi, Druzus, Wenanty",
  "12-15": "Bachus, Maryniusz, Maksymin, Bakchus, Celina, Maksymina, Wolimir, Maria, Maryn, Jan, Wiktor, Mścigniewa, Drogosław, Mścigniew, Teodor, Drogosława, Walerian, Ireneusz, Weronika, Euzebiusz, Saturnin, Antoni",
  "12-16": "Wolisław, Sebastian, Walenty, Albina, Ananiasz, Maria, Adelajda, Tyter, Zdziesława, Alina, Walentyn, Agrykola, Deder, Dyter, Wolisława, Zdziesław, Euzebiusz, Konkordiusz",
  "12-17": "Florian, Modest, Żyrosław, Jan, Żerosław, Wiwina, Bega, Łazarz",
  "12-18": "Zofia, Winebald, Winibald, Nemezja, Wilibald, Zozym, Symplicjusz, Wunibald, Auksencjusz, Auksenty, Auksencja, Wszemir, Bogusław, Rufus, Gościmiar, Gracjan, Kwintus, Miłosław, Winibalda",
  "12-19": "Eleonora, Grzegorz, Nemezjusz, Tymoteusz, Anastazy, Abraham, Mścigniew, Protazja, Nemezy, Dariusz, Beniamin, Kazimiera, Urban, Gabriela",
  "12-20": "Makary, Ptolemeusz, Dominik, Ursycyn, Liberat, Krystian, Zefiryn, Teofil, Amon, Dagmara, Bogumiła, Bogumił, Dagna, Eugeniusz, Zenon, Wincenty",
  "12-21": "Glicery, Tomisława, Festus, Gliceriusz, Temistokles, Balbin, Tomasz, Anastazy, Tomisław, Piotr, Honorat",
  "12-22": "Judyta, Drogomir, Franciszka, Franciszka Ksawera, Honorata, Flawian, Luboradz, Beata, Dziwisław, Dobrosułka, Zenon, Zenona, Ischyrion, Gryzelda, Dziesława, Ksawera",
  "12-23": "Anatola, Teodul, Ewaryst, Serwul, Dagobert, Iwo, Sławomir, Jan, Ewarysta, Mardoniusz, Torlak, Sławomira, Bazylides, Gelazy, Iwona, Saturnin, Anatolia, Wiktoria",
  "12-24": "Grzegorz, Godzisław, Adela, Eryk, Delfin, Adamina, Hermina, Adam, Ewa, Zenobiusz, Hermana, Druzjan, Ada, Herminia, Grzymisława, Godzisława, Józef, Paula, Eryka, Tarsylia, Druzjanna, Ewelina, Irmina, Irma",
  "12-25": "Maria, Piotr, Mateusz, Eugenia, Siemosław",
  "12-26": "Wrociwoj, Wincenta, Szczepan, Dionizy, Zozym, Wincencja, Teodor, Zenon, Wincentyna",
  "12-27": "Przybyrad, Przybysław, Gosław, Teofan, Sara, Maksym, Jan, Żaneta, Bartłomiej, Żanna, Teodor, Cezary, Mateusz, Fabiola",
  "12-28": "Godzisław, Emma, Dobrowieść, Teofila, Domna, Troadiusz, Teonas, Cezary, Domniusz, Teona, Antoni",
  "12-29": "Domaradz, Dominik, Gosław, Krescencjusz, Tadea, Dawid, Gerarda, Radowit, Prymian, Tomasz, Wiktor, Marcin, Jonatan, Ebrulf, Marceli, Krescenty, Gerard, Ekhard, Krescens, Saturnin, Trofim, Honorat",
  "12-30": "Anizja, Uniedrog, Dionizy, Perpetuus, Egwin, Małgorzata, Eksuperancjusz, Eugeniusz, Marceli, Anizjusz, Rajner, Sewer, Łazarz, Liberiusz",
  "12-31": "Tworzysław, Katarzyna, Sebastian, Barbacjan, Paulina, Sylwester, Mariusz, Saturnina, Kolumba, Donata, Sylwestra, Zotyk, Melania"
};

function getLocalNamedays(date = new Date()) {
  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return LOCAL_NAME_DAYS[key] || '';
}

function formatVisibleNamedays(names, limit = 8) {
  const parts = cleanNamedayText(names)
    .split(',')
    .map(item => cleanNamedayText(item))
    .filter(Boolean);
  if (!parts.length) return '';
  const visible = parts.slice(0, limit).join(', ');
  return parts.length > limit ? `${visible} +${parts.length - limit}` : visible;
}

function setTodayHeader(namedays = '') {
  if (!el.todayLabel) return;
  const now = new Date();
  const dateText = formatPolishDate(now);
  const weekday = WEEKDAYS[now.getDay()] || '';
  const names = cleanNamedayText(namedays) || getLocalNamedays(now);

  if (names) {
    el.todayLabel.textContent = `Dzisiaj: ${dateText}${weekday ? ` (${weekday})` : ''} · Imieniny: ${formatVisibleNamedays(names)}`;
    el.todayLabel.title = `Pełna lista imienin ${dateText}: ${names}`;
    el.todayLabel.dataset.status = 'ready';
  } else {
    el.todayLabel.textContent = `Dzisiaj: ${dateText}${weekday ? ` (${weekday})` : ''} · Imieniny: brak danych`;
    el.todayLabel.title = '';
    el.todayLabel.dataset.status = 'missing';
  }
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
  startWalletBalance: document.querySelector('#startWalletBalance'),
  startWalletDetails: document.querySelector('#startWalletDetails'),
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
  aiProviderSelect: document.querySelector('#aiProviderSelect'),
  aiApiKeyInput: document.querySelector('#aiApiKeyInput'),
  aiModelSelect: document.querySelector('#aiModelSelect'),
  aiCustomModelInput: document.querySelector('#aiCustomModelInput'),
  aiTestKeyButton: document.querySelector('#aiTestKeyButton'),
  aiSaveSettingsButton: document.querySelector('#aiSaveSettingsButton'),
  aiClearKeyButton: document.querySelector('#aiClearKeyButton'),
  aiSettingsStatus: document.querySelector('#aiSettingsStatus'),
  inventoryRecognizeButton: document.querySelector('#inventoryRecognizeButton'),
  inventoryPendingButton: document.querySelector('#inventoryPendingButton'),
  inventorySearchInput: document.querySelector('#inventorySearchInput'),
  inventoryAddManualButton: document.querySelector('#inventoryAddManualButton'),
  inventoryRebuildButton: document.querySelector('#inventoryRebuildButton'),
  inventoryPeriodSelect: document.querySelector('#inventoryPeriodSelect'),
  inventoryFromDate: document.querySelector('#inventoryFromDate'),
  inventoryToDate: document.querySelector('#inventoryToDate'),
  inventoryMinConfidence: document.querySelector('#inventoryMinConfidence'),
  inventoryStatus: document.querySelector('#inventoryStatus'),
  inventorySummary: document.querySelector('#inventorySummary'),
  inventoryItemsBody: document.querySelector('#inventoryItemsBody'),
  inventoryPendingBody: document.querySelector('#inventoryPendingBody'),
  inventoryMovementsBody: document.querySelector('#inventoryMovementsBody'),
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
  return Boolean(deletedTime && (!entryTime || deletedTime >= entryTime));
}

function forgetDeletedEntriesForSyncIds(syncIds) {
  const ids = new Set([...syncIds].map(id => String(id || '').trim()).filter(Boolean));
  if (!ids.size) return 0;
  const before = getDeletedEntries();
  const after = before.filter(item => !ids.has(item.syncId));
  if (after.length !== before.length) saveDeletedEntries(after);
  return before.length - after.length;
}

function getImportedSyncIds(payloadOrEntries) {
  const source = Array.isArray(payloadOrEntries) ? payloadOrEntries : collectImportedEntries(payloadOrEntries);
  return new Set((Array.isArray(source) ? source : [])
    .map(item => String(item?.syncId || item?.sync_id || '').trim())
    .filter(Boolean));
}

function markDropboxForceLocalUpload(reason = 'json-import') {
  const state = {
    reason,
    createdAt: new Date().toISOString()
  };
  try { localStorage.setItem(DROPBOX_FORCE_LOCAL_UPLOAD_KEY, JSON.stringify(state)); } catch (_) {}
  return state;
}

function getDropboxForceLocalUpload() {
  try {
    return JSON.parse(localStorage.getItem(DROPBOX_FORCE_LOCAL_UPLOAD_KEY) || 'null');
  } catch (_) {
    try { localStorage.removeItem(DROPBOX_FORCE_LOCAL_UPLOAD_KEY); } catch (__) {}
    return null;
  }
}

function hasDropboxForceLocalUpload() {
  return Boolean(getDropboxForceLocalUpload());
}

function clearDropboxForceLocalUpload() {
  try { localStorage.removeItem(DROPBOX_FORCE_LOCAL_UPLOAD_KEY); } catch (_) {}
}

async function applyImportedDeletions(payload) {
  const importedEntries = collectImportedEntries(payload);
  const presentSyncIds = new Set((Array.isArray(importedEntries) ? importedEntries : [])
    .map(item => String(item?.syncId || item?.sync_id || '').trim())
    .filter(Boolean));

  const incomingDeleted = collectDeletedEntries(payload)
    .filter(item => !presentSyncIds.has(item.syncId));
  if (!incomingDeleted.length) return { deleted: 0 };

  const localDeleted = getDeletedEntries()
    .filter(item => !presentSyncIds.has(item.syncId));
  const mergedDeleted = saveDeletedEntries([...localDeleted, ...incomingDeleted]);
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

function combineVoiceSplitAmount(majorRaw, minorRaw) {
  const major = normalizeMoneyNumber(majorRaw);
  const minor = normalizeMoneyNumber(minorRaw);
  if (!major || !minor) return null;

  const grosze = Math.round(minor);
  if (grosze < 0 || grosze > 99) return null;

  return Math.round((Math.trunc(major) + grosze / 100) * 100) / 100;
}

function parseLooseAmount(raw) {
  const source = String(raw ?? '').trim();
  if (!source) return null;

  const splitZlotyPattern = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:${ZLOTY_WORDS})\\s+(\\d{1,2})\\s*(?:${ZLOTY_WORDS})(?=$|\\s|[.,;:!?])`, 'iu');
  const splitZloty = source.match(splitZlotyPattern);
  if (splitZloty) {
    const combined = combineVoiceSplitAmount(splitZloty[1], splitZloty[2]);
    if (combined) return combined;
  }

  const splitGroszPattern = new RegExp(`\\b(\\d{1,5})\\s*(?:${GROSZ_WORDS})\\s+(\\d{1,2})\\s*(?:${GROSZ_WORDS})(?=$|\\s|[.,;:!?])`, 'iu');
  const splitGrosz = source.match(splitGroszPattern);
  if (splitGrosz) {
    const combined = combineVoiceSplitAmount(splitGrosz[1], splitGrosz[2]);
    if (combined) return combined;
  }

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

function parseDateForAmount(source, amountIndex, segmentStart = 0) {
  const text = String(source ?? '');
  const index = Math.max(0, Number(amountIndex) || 0);
  const segmentStartIndex = Math.max(0, Number(segmentStart) || 0);
  const lineStart = Math.max(text.lastIndexOf('\n', index), text.lastIndexOf(';', index));
  const nextLineBreak = text.indexOf('\n', index);
  const nextSemicolon = text.indexOf(';', index);
  const lineEndCandidates = [nextLineBreak, nextSemicolon].filter(pos => pos >= 0);
  const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : text.length;
  const localStart = Math.max(lineStart + 1, segmentStartIndex);
  const sameLine = text.slice(localStart, lineEnd);
  const sameLineDate = parseExplicitDateFromText(sameLine);
  if (sameLineDate) return sameLineDate;

  const previousParts = text.slice(0, index).split(/[;,\n]/).reverse();
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
  { category: 'Dom', words: ['dom', 'czynsz', 'rachunek domowy', 'prad', 'gaz', 'woda', 'internet domowy', 'mieszkanie'] },
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
    'dom', 'domowe', 'domowy', 'domowa', 'do domu', 'dla domu', 'prywatne', 'prywatny', 'prywatna',
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

function replacePolishWords(value, words) {
  const escaped = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return String(value ?? '').replace(new RegExp(`(^|[^\\p{L}\\p{N}_])(?:${escaped.join('|')})(?=$|[^\\p{L}\\p{N}_])`, 'giu'), '$1 ');
}

function cleanDescription(raw) {
  const dateWords = [
    'dzisiaj', 'dziś', 'dzis', 'wczoraj', 'jutro', 'przedwczoraj'
  ];
  const actionWords = [
    'kupiłem', 'kupilem', 'kupiłam', 'kupilam', 'zakup', 'zakupy', 'wydatek', 'wydatki',
    'wydatkowe', 'zapłaciłem', 'zaplacilem', 'zapłaciłam', 'zaplacilam', 'wydałem',
    'wydalem', 'wydałam', 'wydalam', 'koszt', 'kosztowało', 'kosztowalo', 'zarobek',
    'zarobiłem', 'zarobilem', 'przychód', 'przychod', 'wpływ', 'wplyw', 'dostałem',
    'dostalem', 'otrzymałem', 'otrzymalem', 'wpłata', 'wplata', 'paragon'
  ];
  const metaWords = [
    'gotówka', 'gotowka', 'kartą', 'karta', 'blik', 'bank', 'przelew', 'konto', 'firmowe',
    'firmowy', 'firmowa', 'firma', 'na firmę', 'na firme', 'domowe', 'domowy', 'domowa',
    'prywatne', 'prywatny', 'prywatna'
  ];

  let value = String(raw ?? '')
    .replace(/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[-/.]\d{1,2}(?:[-/.]\d{2,4})?\b/g, ' ')
    .replace(/(?:^|[^\p{L}\p{N}_])\d{1,2}\s+(stycznia|styczen|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|wrzesnia|października|pazdziernika|listopada|grudnia)(?:\s+\d{2,4})?(?=$|[^\p{L}\p{N}_])/giu, ' ');

  value = replacePolishWords(value, dateWords);
  value = replacePolishWords(value, actionWords);
  value = replacePolishWords(value, metaWords);

  value = value
    .replace(/[=:+;|]/g, ' ')
    .replace(/(^|\s)(za|po|na|i|oraz|plus)\s*$/giu, ' ')
    .replace(/^\s*(za|po|na|i|oraz|plus)(?=\s|$)/giu, ' ')
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

  const splitZlotyRegex = new RegExp(`\\b(${MONEY_NUMBER_PATTERN})\\s*(?:${ZLOTY_WORDS})\\s+(\\d{1,2})\\s*(?:${ZLOTY_WORDS})(?=$|\\s|[.,;:!?])`, 'giu');
  for (const match of source.matchAll(splitZlotyRegex)) {
    addMatch(match, combineVoiceSplitAmount(match[1], match[2]));
  }

  const splitGroszRegex = new RegExp(`\\b(\\d{1,5})\\s*(?:${GROSZ_WORDS})\\s+(\\d{1,2})\\s*(?:${GROSZ_WORDS})(?=$|\\s|[.,;:!?])`, 'giu');
  for (const match of source.matchAll(splitGroszRegex)) {
    addMatch(match, combineVoiceSplitAmount(match[1], match[2]));
  }

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
  const separatorMatches = [...part.matchAll(/(?:[;\n,]|\s+(?:i|oraz|plus)\s+)/giu)];
  const lastSeparator = separatorMatches.at(-1);
  if (lastSeparator) part = part.slice(lastSeparator.index + lastSeparator[0].length);
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
  const separatorMatches = [...part.matchAll(/(?:[;\n,]|\s+(?:i|oraz|plus)\s+)/giu)];
  const lastSeparator = separatorMatches.at(-1);
  if (lastSeparator) part = part.slice(lastSeparator.index + lastSeparator[0].length);
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
    const entryDate = parseDateForAmount(source, match.index, prevEnd);
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


function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatInventoryAction(action) {
  const value = String(action || '').trim();
  const labels = {
    dodaj_do_magazynu: 'Dodanie do magazynu',
    zdejmij_z_magazynu: 'Zdjęcie z magazynu',
    zwrot_do_magazynu: 'Zwrot do magazynu',
    zwrot_do_sklepu: 'Zwrot do sklepu',
    korekta_reczna: 'Korekta ręczna',
    brak_ruchu: 'Bez ruchu',
    wymaga_sprawdzenia: 'Do ręcznego sprawdzenia',
    zakup: 'Zakup',
    sprzedaz: 'Sprzedaż',
    sprzedaż: 'Sprzedaż'
  };
  return labels[value] || value.replace(/_/g, ' ');
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

  if (el.startWalletBalance) {
    const currentSummary = summarizeWalletMonth(currentMonth);
    el.startWalletBalance.textContent = formatMoney(currentSummary.balance);
    el.startWalletBalance.classList.toggle('amount-income', currentSummary.balance >= 0);
    el.startWalletBalance.classList.toggle('amount-expense', currentSummary.balance < 0);
  }
  if (el.startWalletDetails) {
    const currentSummary = summarizeWalletMonth(currentMonth);
    el.startWalletDetails.textContent = `${currentMonth} · gotówka: +${formatMoney(currentSummary.cashIncome)} / -${formatMoney(currentSummary.cashExpense)}`;
  }

  if (!el.walletReport) return;
  if (el.walletInitialBalance && document.activeElement !== el.walletInitialBalance) el.walletInitialBalance.value = String(summary.initialBalance).replace('.', ',');

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
  const current = getWalletMonthRecord(month);
  const correction = parseMoneyInputValue(el.walletAdjustment?.value || '0');
  saveWalletMonthRecord(month, {
    initialBalance: parseMoneyInputValue(el.walletInitialBalance?.value || '0'),
    adjustment: Math.round((current.adjustment + correction) * 100) / 100
  });
  if (el.walletAdjustment) el.walletAdjustment.value = '';
  renderWalletReport();
  scheduleDropboxAutoSync();
  showMessage(correction ? `Zapisano portfel. Korekta: ${correction >= 0 ? '+' : ''}${formatMoney(correction)}.` : 'Zapisano ustawienia portfela gotówkowego.');
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
  const currentMonth = monthKey(todayISO());
  const entries = (allEntries || []).filter(entry => String(entry.entryDate || '').startsWith(currentMonth));
  if (!entries.length) {
    el.smartReport.innerHTML = `<div class="empty-state">Brak danych z bieżącego miesiąca (${escapeHtml(currentMonth)}).</div>`;
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
    ['Inteligentne wnioski — bieżący miesiąc', `${currentMonth} · przychody ${formatMoney(summary.income)} · wydatki ${formatMoney(summary.expense)}`, summary.balance],
    ['Wynik firmy / wypłata', `Bez wydatków domowych · udział kosztów firmowych: ${companyExpenseShare}%`, company.balance],
    ['Średni wydatek dzienny', `Liczony z dni, w których były wydatki: ${uniqueExpenseDays}`, -avgDailyExpense]
  ];

  if (topExpenseGroup) rows.push(['Największa grupa wydatków', `${topExpenseGroup.name} · wpisy: ${topExpenseGroup.count}`, -topExpenseGroup.total]);
  if (topIncomeGroup) rows.push(['Największa grupa przychodów', `${topIncomeGroup.name} · wpisy: ${topIncomeGroup.count}`, topIncomeGroup.total]);
  if (biggestExpense) rows.push(['Największy pojedynczy wydatek', `${biggestExpense.entryDate} · ${biggestExpense.description || biggestExpense.category}`, -Number(biggestExpense.amount || 0)]);
  if (biggestIncome) rows.push(['Największy pojedynczy przychód', `${biggestIncome.entryDate} · ${biggestIncome.description || biggestIncome.category}`, Number(biggestIncome.amount || 0)]);

  el.smartReport.innerHTML = rows.map(([title, note, value]) => mainReportRow(title, note, value, 'smart-report-row')).join('');
}

const RECURRING_STOP_WORDS = new Set([
  ...LEARNING_STOP_WORDS,
  'styczen', 'stycznia', 'luty', 'lutego', 'marzec', 'marca', 'kwiecien', 'kwietnia',
  'maj', 'maja', 'czerwiec', 'czerwca', 'lipiec', 'lipca', 'sierpien', 'sierpnia',
  'wrzesien', 'wrzesnia', 'pazdziernik', 'pazdziernika', 'listopad', 'listopada', 'grudzien', 'grudnia',
  'miesiac', 'miesieczny', 'miesieczna', 'miesieczne', 'tydzien', 'tygodniowy', 'tygodniowa',
  'dom', 'jedzenie', 'inne', 'uslugi', 'usluga',
  ...CATEGORIES.map(name => normalizeText(name))
].map(learningStem));

function recurringCleanWords(entry) {
  const source = [entry.description, entry.originalText, resolveReportGroup(entry)]
    .filter(Boolean)
    .join(' ');

  const words = normalizeText(cleanDescription(source))
    .replace(/\b\d+[,.]?\d*\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  for (const word of words) {
    const stem = learningStem(word);
    if (stem.length < 3) continue;
    if (RECURRING_STOP_WORDS.has(stem)) continue;
    if (seen.has(stem)) continue;
    seen.add(stem);
    unique.push({ word, stem });
  }
  return unique;
}

function capitalizeFirst(value) {
  const text = String(value || '').trim();
  return text ? text.charAt(0).toLocaleUpperCase('pl-PL') + text.slice(1) : '';
}

function recurringExpenseInfo(entry) {
  const category = normalizeKnownCategory(entry.category, entry.category || 'Inne');
  const scope = normalizeScope(entry.scope);
  const words = recurringCleanWords(entry);
  const tokenKey = words.map(item => item.stem).slice(0, 4).join(' ') || 'ogolne';
  const phrase = words.map(item => item.word).slice(0, 3).join(' ');
  const title = phrase
    ? `${capitalizeFirst(phrase)} · ${formatScope(scope)} · ${category}`
    : `${category} · ${formatScope(scope)}`;

  return {
    key: [categoryKey(category), scope, tokenKey].join('|'),
    title
  };
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
    const info = recurringExpenseInfo(entry);
    if (!groups.has(info.key)) groups.set(info.key, { title: info.title, items: [] });
    groups.get(info.key).items.push(entry);
  }

  const result = [];
  for (const [key, group] of groups.entries()) {
    const items = group.items;
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
      title: group.title,
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
        <strong>${escapeHtml(row.title)}</strong><br>
        <small>Cykl: ${escapeHtml(row.label)} · wpisy: ${row.count} · ostatnio: ${escapeHtml(row.lastDate)} · następny: ${escapeHtml(row.nextDate)}</small>
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
    normalizeKnownCategory(entry.category || 'Inne'),
    Number(entry.amount || 0).toFixed(2),
    normalizeText(entry.paymentMethod || ''),
    normalizeText(entry.description || ''),
    normalizeText(entry.originalText || '')
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

function looksLikeImportedEntry(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const keys = Object.keys(item);
  const hasAmount = keys.some(key => ['amount', 'kwota', 'value', 'wartosc', 'suma', 'total', 'price', 'cena'].includes(key));
  const hasDate = keys.some(key => ['entryDate', 'entry_date', 'date', 'data', 'createdDate', 'created_date'].includes(key));
  const hasText = keys.some(key => ['description', 'opis', 'name', 'nazwa', 'title', 'tytul', 'text', 'tekst', 'originalText', 'original_text'].includes(key));
  const hasType = keys.some(key => ['entryType', 'entry_type', 'type', 'typ', 'rodzajWpisu', 'rodzaj_wpisu'].includes(key));
  return hasAmount && (hasDate || hasText || hasType);
}

function collectImportedEntries(payload) {
  if (Array.isArray(payload)) return payload.filter(looksLikeImportedEntry);
  if (!payload || typeof payload !== 'object') return [];

  const directKeys = ['entries', 'items', 'data', 'records', 'rows', 'transactions', 'wpisy', 'lista'];
  for (const key of directKeys) {
    if (Array.isArray(payload[key])) {
      const entries = payload[key].filter(looksLikeImportedEntry);
      if (entries.length) return entries;
    }
  }

  for (const key of directKeys) {
    if (payload[key] && typeof payload[key] === 'object') {
      const nested = collectImportedEntries(payload[key]);
      if (nested.length) return nested;
    }
  }

  const ignoredKeys = new Set(['tagRules', 'learningRules', 'deletedEntries', 'walletMonths', 'customCategories', 'mainReportSettings', 'inventoryItems', 'inventoryMovements', 'inventoryAnalysis']);
  for (const [key, value] of Object.entries(payload)) {
    if (ignoredKeys.has(key)) continue;
    if (Array.isArray(value)) {
      const entries = value.filter(looksLikeImportedEntry);
      if (entries.length) return entries;
    }
  }

  for (const [key, value] of Object.entries(payload)) {
    if (ignoredKeys.has(key)) continue;
    if (value && typeof value === 'object') {
      const nested = collectImportedEntries(value);
      if (nested.length) return nested;
    }
  }

  return [];
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
  const connected = hasDropboxConnection();
  const forceUpload = getDropboxForceLocalUpload();
  if (el.storageModeSelect) el.storageModeSelect.value = mode;
  if (el.dropboxAppKeyInput && !el.dropboxAppKeyInput.value) el.dropboxAppKeyInput.value = config.appKey;
  if (el.dropboxAppKeyLabel) {
    el.dropboxAppKeyLabel.classList.toggle('hidden', hasBuiltInDropboxAppKey());
  }
  if (el.dropboxFilePathInput && !el.dropboxFilePathInput.value) el.dropboxFilePathInput.value = config.path;

  if (el.dropboxConnectButton) el.dropboxConnectButton.disabled = connected || dropboxSyncBusy;
  if (el.dropboxDisconnectButton) el.dropboxDisconnectButton.disabled = !connected || dropboxSyncBusy;
  if (el.dropboxSyncNowButton) el.dropboxSyncNowButton.disabled = mode !== 'dropbox' || !connected || dropboxSyncBusy;

  if (el.cloudStatus) {
    if (statusText) el.cloudStatus.textContent = statusText;
    else if (mode === 'dropbox') {
      el.cloudStatus.textContent = connected
        ? `Dropbox połączony. Plik danych: ${config.path}${forceUpload ? ' · oczekuje jednorazowy zapis lokalnej bazy do chmury.' : ''}`
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
  if (!code) return false;

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
  await handleDropboxInitialSync();
  updateCloudUi();
  return true;
}

function chooseDropboxInitialSyncAction() {
  const answer = window.prompt([
    'Dropbox jest połączony. Wykryto lokalne wpisy oraz istniejący plik danych w Dropbox.',
    '',
    'Wpisz numer operacji:',
    '1 — Scal dane lokalne z Dropbox (zalecane)',
    '2 — Zastąp Dropbox danymi lokalnymi',
    '3 — Pobierz dane z Dropbox i zastąp lokalne',
    '',
    'Domyślnie zostanie wykonane scalenie.'
  ].join('\n'), '1');

  const choice = String(answer ?? '1').trim();
  if (choice === '2') return 'upload-local';
  if (choice === '3') return 'download-remote';
  return 'merge';
}

async function handleDropboxInitialSync() {
  const localEntries = await getAllEntries();
  updateCloudUi('Dropbox połączony. Sprawdzam dane w chmurze...');
  const remotePayload = await dropboxDownloadPayload();

  if (localEntries.length && remotePayload) {
    const action = chooseDropboxInitialSyncAction();

    if (action === 'upload-local') {
      updateCloudUi('Zastępuję plik w Dropbox aktualną lokalną bazą...');
      await uploadLocalStateToDropbox('Dropbox połączony. Plik w chmurze został zastąpiony lokalną bazą.');
      return;
    }

    if (action === 'download-remote') {
      updateCloudUi('Zastępuję lokalną bazę danymi z Dropbox...');
      await importPayload(remotePayload, { replace: true, silent: true, confirmReplace: false });
      await dropboxUploadPayload(makeExportPayload());
      const message = 'Dropbox połączony. Lokalna baza została zastąpiona danymi z chmury.';
      updateCloudUi(message);
      showMessage(message);
      return;
    }

    updateCloudUi('Scalam lokalne dane z plikiem w Dropbox...');
    await importPayload(remotePayload, { replace: false, silent: true });
    await dropboxUploadPayload(makeExportPayload());
    const message = 'Dropbox połączony. Dane lokalne i dane z chmury zostały scalone.';
    updateCloudUi(message);
    showMessage(message);
    return;
  }

  if (localEntries.length) {
    updateCloudUi('Dropbox połączony. Nie znaleziono pliku w chmurze, więc zapisuję lokalną bazę jako pierwszy plik Dropbox...');
    await uploadLocalStateToDropbox('Dropbox połączony. Lokalna baza została zapisana jako pierwszy plik w Dropbox.');
    return;
  }

  if (remotePayload) {
    updateCloudUi('Dropbox połączony. Pobieram dane z chmury...');
    await importPayload(remotePayload, { replace: true, silent: true, confirmReplace: false });
    await dropboxUploadPayload(makeExportPayload());
    const message = 'Dropbox połączony. Pobrano dane z chmury.';
    updateCloudUi(message);
    showMessage(message);
    return;
  }

  await dropboxUploadPayload(makeExportPayload());
  const message = 'Dropbox połączony. Utworzono pusty plik danych w chmurze.';
  updateCloudUi(message);
  showMessage(message);
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
    inventoryItems: getInventoryItems(),
    inventoryMovements: getInventoryMovements(),
    inventoryAnalysis: getInventoryAnalysis(),
    inventoryPending: getInventoryPending(),
    aiSettings: getAiSettingsForExport(),
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

async function uploadLocalStateToDropbox(successMessage = '') {
  if (getStorageMode() !== 'dropbox' || !hasDropboxConnection()) return;
  if (dropboxSyncBusy) {
    dropboxForceUploadPending = true;
    updateCloudUi('Dropbox kończy poprzednią operację. Po jej zakończeniu program automatycznie zapisze lokalną bazę do chmury.');
    showMessage('Dropbox jest zajęty. Zapis lokalnej bazy do chmury został dodany do kolejki.');
    return;
  }
  dropboxSyncBusy = true;
  let finalMessage = '';
  updateCloudUi('Zapisuję aktualną lokalną bazę do Dropbox...');
  try {
    await reloadEntries();
    await dropboxUploadPayload(makeExportPayload());
    clearDropboxForceLocalUpload();
    finalMessage = successMessage || `Dropbox zapisany lokalnymi danymi: ${new Date().toLocaleString('pl-PL')}.`;
    updateCloudUi(finalMessage);
    showMessage(finalMessage);
  } finally {
    dropboxSyncBusy = false;
    updateCloudUi(finalMessage);
  }
}

async function importPayload(payload, options = {}) {
  const { replace = false, silent = false, applyDeletions = true, confirmReplace = true } = options;
  const deletionResult = applyDeletions ? await applyImportedDeletions(payload) : { deleted: 0 };
  importCustomCategoriesFromPayload(payload, replace);
  await importLearningRulesFromPayload(payload, replace);
  importWalletMonthsFromPayload(payload, replace);
  importInventoryFromPayload(payload, replace);
  const imported = collectImportedEntries(payload);

  if (replace) {
    const importedSyncIds = new Set((Array.isArray(imported) ? imported : [])
      .map(item => item?.syncId || item?.sync_id)
      .filter(Boolean));
    const importedDeleted = collectDeletedEntries(payload)
      .filter(item => !importedSyncIds.has(item.syncId));
    saveDeletedEntries(importedDeleted);
  }

  if (!Array.isArray(imported) || !imported.length) {
    if (replace) {
      const shouldReplace = !confirmReplace || window.confirm('Zastąpić wszystkie lokalne wpisy danymi z importowanego pliku?');
      if (!shouldReplace) return { added: 0, updated: 0, skipped: 0, deleted: deletionResult.deleted };
      await clearEntries();
    }

    await reloadEntries();
    const importedSettingsOnly = Boolean(
      payload?.walletMonths || payload?.wallet_months ||
      payload?.customCategories || payload?.custom_categories ||
      payload?.mainReportSettings || payload?.main_report_settings ||
      payload?.tagRules || payload?.learningRules || payload?.inventoryItems || payload?.inventoryMovements || payload?.inventoryAnalysis || payload?.inventoryPending
    );
    if (replace || deletionResult.deleted || importedSettingsOnly) {
      if (!silent) showMessage(`Import zakończony. Dodano wpisy: 0, zaktualizowano: 0, usunięto: ${deletionResult.deleted}.`);
      return { added: 0, updated: 0, skipped: 0, deleted: deletionResult.deleted };
    }
    throw new Error('Plik JSON nie zawiera listy wpisów. Obsługiwane pola: entries, items, data, records, rows, transactions, wpisy, lista.');
  }

  const now = new Date().toISOString();
  const cleaned = imported
    .map(item => normalizeImportedEntry(item, now))
    .filter(item => item.amount > 0 && ['przychód', 'wydatek'].includes(item.entryType));

  if (!cleaned.length) throw new Error('Nie znaleziono poprawnych wpisów do importu. Sprawdź, czy rekordy mają kwotę oraz datę/opis.');

  if (!applyDeletions) {
    forgetDeletedEntriesForSyncIds(getImportedSyncIds(cleaned));
  }

  if (replace) {
    const shouldReplace = !confirmReplace || window.confirm('Zastąpić wszystkie lokalne wpisy danymi z importowanego pliku?');
    if (!shouldReplace) return { added: 0, updated: 0, skipped: 0, deleted: deletionResult.deleted };
    await clearEntries();
  }

  allEntries = await getAllEntries();

  if (Array.isArray(payload?.tagRules)) {
    for (const rule of payload.tagRules) await saveTagRule(normalizeRule(rule));
    await reloadTagRules();
  }

  const existingBySyncId = new Map(allEntries.filter(entry => entry.syncId).map(entry => [entry.syncId, entry]));
  const existingBySignature = new Map(allEntries.map(entry => [entrySignature(entry), entry]));
  const localDeletedBySyncId = deletedEntriesMap();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incoming of cleaned) {
    if (!replace && applyDeletions && isEntryBlockedByDeletion(incoming, localDeletedBySyncId)) {
      skipped += 1;
      continue;
    }

    const currentBySyncId = incoming.syncId ? existingBySyncId.get(incoming.syncId) : null;
    const currentBySignature = existingBySignature.get(entrySignature(incoming));
    const current = currentBySyncId || currentBySignature || null;

    if (current && !replace) {
      const incomingTime = Date.parse(incoming.updatedAt || incoming.createdAt || '') || 0;
      const currentTime = Date.parse(current.updatedAt || current.createdAt || '') || 0;
      if (currentBySyncId && incomingTime > currentTime) {
        const saved = { ...incoming, id: current.id, syncId: current.syncId || incoming.syncId };
        await saveEntry(saved);
        existingBySignature.set(entrySignature(saved), saved);
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await saveEntry(replace ? sanitizeEntryKey(incoming) : stripLocalId(incoming));
    existingBySignature.set(entrySignature(incoming), incoming);
    added += 1;
  }

  await reloadEntries();
  if (!silent) showMessage(`Import zakończony. Dodano: ${added}, zaktualizowano: ${updated}, pominięto: ${skipped}, usunięto: ${deletionResult.deleted}.`);
  return { added, updated, skipped, deleted: deletionResult.deleted };
}

let dropboxSyncBusy = false;
let dropboxForceUploadPending = false;
let dropboxSyncTimer = null;

function scheduleDropboxAutoSync() {
  if (getStorageMode() !== 'dropbox' || !hasDropboxConnection()) return;
  window.clearTimeout(dropboxSyncTimer);
  dropboxSyncTimer = window.setTimeout(() => syncDropboxNow().catch(error => updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`)), 1200);
}

async function syncDropboxNow() {
  if (getStorageMode() !== 'dropbox') {
    updateCloudUi('Tryb lokalny. Dropbox nie jest używany.');
    showMessage('Tryb lokalny. Dropbox nie jest używany.', 'error');
    return;
  }
  if (!hasDropboxConnection()) {
    updateCloudUi('Tryb Dropbox wybrany, ale konto nie jest jeszcze połączone.');
    showMessage('Dropbox nie jest połączony.', 'error');
    return;
  }
  if (hasDropboxForceLocalUpload()) {
    window.clearTimeout(dropboxSyncTimer);
    await uploadLocalStateToDropbox('Po imporcie JSON wykonano jednorazowy zapis lokalnej bazy do Dropbox. Następne synchronizacje działają normalnie.');
    return;
  }
  if (dropboxSyncBusy) return;
  dropboxSyncBusy = true;
  updateCloudUi('Synchronizuję z Dropbox...');
  let finalMessage = '';
  try {
    const remotePayload = await dropboxDownloadPayload();
    if (remotePayload) await importPayload(remotePayload, { replace: false, silent: true });
    await dropboxUploadPayload(makeExportPayload());
    finalMessage = `Dropbox zsynchronizowany: ${new Date().toLocaleString('pl-PL')}.`;
    updateCloudUi(finalMessage);
    showMessage(finalMessage);
  } finally {
    dropboxSyncBusy = false;
    updateCloudUi(finalMessage);
  }
  if (dropboxForceUploadPending || hasDropboxForceLocalUpload()) {
    dropboxForceUploadPending = false;
    await uploadLocalStateToDropbox('Po zakończeniu poprzedniej synchronizacji zapisano lokalną bazę do Dropbox.');
  }
}

function disconnectDropbox() {
  if (!hasDropboxConnection()) {
    updateCloudUi('Dropbox jest już odłączony.');
    showMessage('Dropbox jest już odłączony.');
    return;
  }
  if (!window.confirm('Odłączyć Dropbox od tej przeglądarki? Dane lokalne zostaną w programie.')) return;
  window.clearTimeout(dropboxSyncTimer);
  localStorage.removeItem(DROPBOX_TOKEN_KEY);
  localStorage.removeItem(DROPBOX_OAUTH_KEY);
  clearDropboxForceLocalUpload();
  setStorageMode('local');
  updateCloudUi('Dropbox odłączony. Program pracuje lokalnie.');
  showMessage('Dropbox odłączony. Program pracuje lokalnie.');
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
  showMessage(`Wyeksportowano plik JSON: ${link.download}`);
}

async function importJson(file, options = {}) {
  const rawText = await file.text();
  const text = rawText.replace(/^\uFEFF/, '').trim();
  if (!text) throw new Error('Wybrany plik JSON jest pusty.');
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new Error(`Nie udało się odczytać JSON: ${error.message}`);
  }
  window.clearTimeout(dropboxSyncTimer);
  await importPayload(payload, options);
  markDropboxForceLocalUpload(options.replace ? 'json-replace' : 'json-merge');
  if (getStorageMode() === 'dropbox' && hasDropboxConnection()) {
    await uploadLocalStateToDropbox('Import JSON zapisany do Dropbox. Następne synchronizacje będą działały normalnie.');
  } else {
    updateCloudUi('Import JSON zakończony lokalnie. Po podłączeniu Dropboxa program jednorazowo wyśle tę bazę do chmury.');
  }
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
    const appBaseUrl = new URL('./', document.baseURI || window.location.href);
    const appWorkerUrl = new URL('service-worker.js', appBaseUrl);
    const isThisAppWorker = scriptUrl => {
      if (!scriptUrl) return false;
      try {
        const url = new URL(scriptUrl);
        return url.origin === appWorkerUrl.origin && url.pathname === appWorkerUrl.pathname;
      } catch (_) {
        return false;
      }
    };

    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter(registration => {
      const workerUrls = [
        registration.active?.scriptURL,
        registration.waiting?.scriptURL,
        registration.installing?.scriptURL
      ];
      return registration.scope === appBaseUrl.href || workerUrls.some(isThisAppWorker);
    });
    await Promise.all(appRegistrations.map(registration => registration.unregister()));
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


function safeJsonParseLocalStorage(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function setJsonLocalStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}

const AI_MODEL_OPTIONS = {
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1']
};

function getAiSettings() {
  const saved = safeJsonParseLocalStorage(AI_SETTINGS_KEY, {});
  const provider = ['gemini', 'openai'].includes(saved.provider) ? saved.provider : 'gemini';
  const models = AI_MODEL_OPTIONS[provider] || [];
  return {
    provider,
    apiKey: String(saved.apiKey || '').trim(),
    model: String(saved.model || models[0] || '').trim(),
    customModel: String(saved.customModel || '').trim()
  };
}

function getAiSettingsForExport() {
  const settings = getAiSettings();
  return { provider: settings.provider, model: settings.model, customModel: settings.customModel, apiKeySaved: Boolean(settings.apiKey) };
}

function getSelectedAiModel(settings = getAiSettings()) {
  return String(settings.customModel || settings.model || '').trim();
}

function saveAiSettingsFromForm() {
  const current = getAiSettings();
  const provider = el.aiProviderSelect?.value || current.provider;
  const settings = {
    provider,
    apiKey: String(el.aiApiKeyInput?.value || current.apiKey || '').trim(),
    model: String(el.aiModelSelect?.value || current.model || '').trim(),
    customModel: String(el.aiCustomModelInput?.value || '').trim()
  };
  setJsonLocalStorage(AI_SETTINGS_KEY, settings);
  renderAiSettings();
  showMessage('Zapisano ustawienia AI.');
  return settings;
}

function renderAiModelOptions(provider) {
  if (!el.aiModelSelect) return;
  const current = getAiSettings();
  const models = AI_MODEL_OPTIONS[provider] || [];
  el.aiModelSelect.innerHTML = models.map(model => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`).join('');
  if (models.includes(current.model)) el.aiModelSelect.value = current.model;
}

function renderAiSettings() {
  const settings = getAiSettings();
  if (el.aiProviderSelect) el.aiProviderSelect.value = settings.provider;
  renderAiModelOptions(settings.provider);
  if (el.aiModelSelect && settings.model) el.aiModelSelect.value = settings.model;
  if (el.aiApiKeyInput) el.aiApiKeyInput.value = settings.apiKey;
  if (el.aiCustomModelInput) el.aiCustomModelInput.value = settings.customModel;
  if (el.aiSettingsStatus) {
    const model = getSelectedAiModel(settings) || 'brak modelu';
    el.aiSettingsStatus.textContent = settings.apiKey ? `Klucz zapisany · ${settings.provider} · ${model}` : `Brak zapisanego klucza · ${settings.provider} · ${model}`;
  }
}

async function testAiKey() {
  const settings = saveAiSettingsFromForm();
  if (!settings.apiKey) throw new Error('Wpisz klucz API.');
  const provider = settings.provider;
  if (el.aiSettingsStatus) el.aiSettingsStatus.textContent = 'Sprawdzam klucz...';
  let response;
  if (provider === 'openai') {
    response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    });
  } else {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(settings.apiKey)}`);
  }
  if (!response.ok) throw new Error(`Klucz nie przeszedł testu. Kod HTTP: ${response.status}.`);
  if (el.aiSettingsStatus) el.aiSettingsStatus.textContent = 'Klucz API działa.';
  showMessage('Klucz API działa.');
}


function setInventoryBusy(isBusy, message = '') {
  if (el.inventoryRecognizeButton) {
    el.inventoryRecognizeButton.disabled = Boolean(isBusy);
    el.inventoryRecognizeButton.classList.toggle('is-working', Boolean(isBusy));
    el.inventoryRecognizeButton.textContent = isBusy ? 'Rozpoznaję...' : 'Rozpoznaj zakupy i sprzedaż';
  }
  if (el.inventoryRebuildButton) el.inventoryRebuildButton.disabled = Boolean(isBusy);
  if (el.inventoryPendingButton) el.inventoryPendingButton.disabled = Boolean(isBusy);
  if (el.inventoryAddManualButton) el.inventoryAddManualButton.disabled = Boolean(isBusy);
  if (isBusy || message) setInventoryStatus(message || 'Trwa analiza AI...', isBusy ? 'working' : 'ready');
}

function setInventoryStatus(message, mode = 'ready') {
  if (!el.inventoryStatus) return;
  el.inventoryStatus.textContent = message || '';
  el.inventoryStatus.dataset.mode = mode;
}

function calculateInventoryPeriodRange(mode = 'current') {
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  if (mode === 'previous') {
    const base = new Date(`${currentMonth}-01T12:00:00`);
    base.setMonth(base.getMonth() - 1);
    const month = base.toISOString().slice(0, 7);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
  }
  const last = new Date(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 0).getDate();
  return { from: `${currentMonth}-01`, to: `${currentMonth}-${String(last).padStart(2, '0')}` };
}

function updateInventoryPeriodInputs(force = false) {
  const mode = el.inventoryPeriodSelect?.value || 'current';
  if (!el.inventoryFromDate || !el.inventoryToDate) return;
  if (mode === 'custom') {
    el.inventoryFromDate.disabled = false;
    el.inventoryToDate.disabled = false;
    if (force && (!el.inventoryFromDate.value || !el.inventoryToDate.value)) {
      const range = calculateInventoryPeriodRange('current');
      el.inventoryFromDate.value = el.inventoryFromDate.value || range.from;
      el.inventoryToDate.value = el.inventoryToDate.value || range.to;
    }
    setInventoryStatus(`Zakres własny: ${el.inventoryFromDate.value || '—'} — ${el.inventoryToDate.value || '—'}.`, 'ready');
    return;
  }
  const range = calculateInventoryPeriodRange(mode);
  el.inventoryFromDate.disabled = true;
  el.inventoryToDate.disabled = true;
  el.inventoryFromDate.value = range.from;
  el.inventoryToDate.value = range.to;
  setInventoryStatus(`Gotowy. Okres analizy: ${range.from} — ${range.to}.`, 'ready');
}

function getInventoryItems() {
  const items = safeJsonParseLocalStorage(INVENTORY_ITEMS_KEY, []);
  return Array.isArray(items) ? items : [];
}

function saveInventoryItems(items, options = {}) {
  setJsonLocalStorage(INVENTORY_ITEMS_KEY, Array.isArray(items) ? items : []);
  if (!options.skipSync) scheduleDropboxAutoSync();
}

function getInventoryMovements() {
  const items = safeJsonParseLocalStorage(INVENTORY_MOVEMENTS_KEY, []);
  return Array.isArray(items) ? items : [];
}

function saveInventoryMovements(items, options = {}) {
  setJsonLocalStorage(INVENTORY_MOVEMENTS_KEY, Array.isArray(items) ? items : []);
  if (!options.skipSync) scheduleDropboxAutoSync();
}

function getInventoryAnalysis() {
  const data = safeJsonParseLocalStorage(INVENTORY_ANALYSIS_KEY, {});
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function saveInventoryAnalysis(data, options = {}) {
  setJsonLocalStorage(INVENTORY_ANALYSIS_KEY, data && typeof data === 'object' ? data : {});
  if (!options.skipSync) scheduleDropboxAutoSync();
}

function inventoryEntryKey(entry) {
  return String(entry?.syncId || entry?.id || '');
}

function inventoryEntryHash(entry) {
  const source = [entry?.entryDate, entry?.entryType, entry?.scope, entry?.amount, entry?.description, entry?.originalText, entry?.category, entry?.tags?.join?.(',') || entry?.tags || ''].join('|');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function normalizeInventoryProductName(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function inventoryProductKey(name, unit = '') {
  return `${normalizeText(name)}|${normalizeText(unit || 'szt')}`;
}

function getInventoryPeriodRange() {
  const mode = el.inventoryPeriodSelect?.value || 'current';
  if (mode !== 'custom') {
    const range = calculateInventoryPeriodRange(mode);
    if (el.inventoryFromDate) el.inventoryFromDate.value = range.from;
    if (el.inventoryToDate) el.inventoryToDate.value = range.to;
    return range;
  }
  const fallback = calculateInventoryPeriodRange('current');
  const from = el.inventoryFromDate?.value || fallback.from;
  const to = el.inventoryToDate?.value || fallback.to;
  return { from, to };
}

function getInventoryCandidates() {
  const { from, to } = getInventoryPeriodRange();
  const analysis = getInventoryAnalysis();
  const candidates = [];
  let skippedChecked = 0;
  let skippedNonCompany = 0;
  for (const entry of allEntries || []) {
    if (!['przychód', 'wydatek'].includes(entry.entryType)) continue;
    if (normalizeScope(entry.scope) !== 'firmowe') { skippedNonCompany += 1; continue; }
    if (entry.entryDate < from || entry.entryDate > to) continue;
    const key = inventoryEntryKey(entry);
    const hash = inventoryEntryHash(entry);
    if (analysis[key]?.entryHash === hash) { skippedChecked += 1; continue; }
    candidates.push(entry);
  }
  return { candidates, skippedChecked, skippedNonCompany, from, to };
}

function buildInventoryAiPrompt(entries) {
  const compactEntries = entries.map(entry => ({
    id_wpisu: inventoryEntryKey(entry),
    data: entry.entryDate,
    typ: entry.entryType,
    firmowy: normalizeScope(entry.scope) === 'firmowe',
    kategoria: entry.category || '',
    kwota: Number(entry.amount || 0),
    opis: String(entry.description || ''),
    tekst_zrodlowy: String(entry.originalText || ''),
    tagi: Array.isArray(entry.tags) ? entry.tags.join(', ') : String(entry.tags || '')
  }));
  return `Jesteś modułem magazynu w polskiej aplikacji Portfel PRO. Analizujesz wyłącznie firmowe przychody i firmowe wydatki. Zwróć tylko JSON zgodny ze schematem.\n\nZasady:\n- Wydatek firmowy dodaje towar do magazynu tylko wtedy, gdy opis oznacza zakup towaru/materiału na magazyn, do sprzedaży albo do zużycia przy montażu.\n- Przychód firmowy zdejmuje towar z magazynu tylko wtedy, gdy opis jasno mówi o sprzedaży, odsprzedaży, wydaniu z magazynu albo montażu i sprzedaży.\n- Sam montaż, instalacja, konfiguracja, serwis albo robocizna bez słowa sprzedaż nie zdejmuje towaru.\n- Paliwo, ZUS, podatki, księgowość, parking, telefon, internet i typowe koszty firmowe nie są ruchem magazynowym.\n- Liczby techniczne typu 5MP, 8 kanałów, 12V, 1TB nie są ilością.\n- Jeśli nie masz pewności, ustaw decyzja = wymaga_sprawdzenia.\n- Decyzje: dodaj_do_magazynu, zdejmij_z_magazynu, zwrot_do_magazynu, zwrot_do_sklepu, brak_ruchu, wymaga_sprawdzenia.\n- Jednostki: szt, m, rolka, komplet, opakowanie.\n\nWpisy:\n${JSON.stringify(compactEntries, null, 2)}`;
}

function getInventoryResponseSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      analiza: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id_wpisu: { type: 'string' },
            decyzja: { type: 'string', enum: ['dodaj_do_magazynu', 'zdejmij_z_magazynu', 'zwrot_do_magazynu', 'zwrot_do_sklepu', 'brak_ruchu', 'wymaga_sprawdzenia'] },
            produkt: { type: ['string', 'null'] },
            ilosc: { type: ['number', 'null'] },
            jednostka: { type: ['string', 'null'] },
            cena_jednostkowa: { type: ['number', 'null'] },
            pewnosc: { type: 'number' },
            powod: { type: 'string' }
          },
          required: ['id_wpisu', 'decyzja', 'produkt', 'ilosc', 'jednostka', 'cena_jednostkowa', 'pewnosc', 'powod']
        }
      }
    },
    required: ['analiza']
  };
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('AI zwróciła pustą odpowiedź.');
  try { return JSON.parse(raw); } catch (_) {}
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
  throw new Error('AI nie zwróciła poprawnego JSON.');
}

async function callInventoryAi(entries) {
  const settings = getAiSettings();
  const model = getSelectedAiModel(settings);
  if (!settings.apiKey) throw new Error('Brak klucza API. Wpisz go w Ustawieniach AI.');
  if (!model) throw new Error('Wybierz model AI w ustawieniach.');
  const prompt = buildInventoryAiPrompt(entries);
  if (settings.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: 'Zwracasz wyłącznie JSON. Nie dodawaj komentarzy poza JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'inventory_analysis', strict: true, schema: getInventoryResponseSchema() }
        }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `OpenAI zwróciło błąd HTTP ${response.status}.`);
    return extractJsonObject(payload?.choices?.[0]?.message?.content || '');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini zwróciło błąd HTTP ${response.status}.`);
  const text = payload?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
  return extractJsonObject(text);
}

function normalizeAiDecision(raw, entryByKey) {
  const entry = entryByKey.get(String(raw?.id_wpisu || ''));
  if (!entry) return null;
  const decision = String(raw.decyzja || 'wymaga_sprawdzenia');
  const product = normalizeInventoryProductName(raw.produkt || '');
  const quantity = Number(raw.ilosc || 0);
  const unit = String(raw.jednostka || 'szt').trim() || 'szt';
  const confidence = Math.max(0, Math.min(1, Number(raw.pewnosc || 0)));
  const unitCost = Number(raw.cena_jednostkowa || 0) || (quantity > 0 ? Number(entry.amount || 0) / quantity : 0);
  return {
    entry,
    id_wpisu: inventoryEntryKey(entry),
    entryHash: inventoryEntryHash(entry),
    decision,
    product,
    quantity,
    unit,
    unitCost,
    confidence,
    reason: String(raw.powod || '').trim()
  };
}

function decisionToMovementType(decision) {
  if (['dodaj_do_magazynu', 'zwrot_do_magazynu'].includes(decision)) return 'in';
  if (['zdejmij_z_magazynu', 'zwrot_do_sklepu'].includes(decision)) return 'out';
  return '';
}

function buildPendingInventoryAnalysis(aiPayload, candidates) {
  const minConfidence = Math.max(0, Math.min(100, Number(el.inventoryMinConfidence?.value || 85))) / 100;
  const entryByKey = new Map(candidates.map(entry => [inventoryEntryKey(entry), entry]));
  const decisions = Array.isArray(aiPayload?.analiza) ? aiPayload.analiza.map(item => normalizeAiDecision(item, entryByKey)).filter(Boolean) : [];
  const results = decisions.map(item => {
    const movementType = decisionToMovementType(item.decision);
    const canApply = Boolean(movementType && item.product && item.quantity > 0 && item.confidence >= minConfidence);
    return { ...item, movementType, canApply };
  });
  const returned = new Set(results.map(item => item.id_wpisu));
  for (const entry of candidates) {
    const key = inventoryEntryKey(entry);
    if (!returned.has(key)) {
      results.push({
        entry,
        id_wpisu: key,
        entryHash: inventoryEntryHash(entry),
        decision: 'wymaga_sprawdzenia',
        product: '',
        quantity: 0,
        unit: 'szt',
        unitCost: 0,
        confidence: 0,
        reason: 'AI nie zwróciła decyzji dla tego wpisu.',
        movementType: '',
        canApply: false
      });
    }
  }
  return { createdAt: new Date().toISOString(), minConfidence, results };
}


function getInventoryPending() {
  const data = safeJsonParseLocalStorage(INVENTORY_PENDING_KEY, { results: [] });
  if (!data || typeof data !== 'object') return { results: [] };
  if (!Array.isArray(data.results)) data.results = [];
  return data;
}

function saveInventoryPending(data, options = {}) {
  setJsonLocalStorage(INVENTORY_PENDING_KEY, data && typeof data === 'object' ? data : { results: [] });
  if (!options.skipSync) scheduleDropboxAutoSync();
}


const INVENTORY_CATEGORIES = [
  'Kamery',
  'Rejestratory i dekodery',
  'Anteny i osprzęt antenowy',
  'Sieć i routery',
  'Kable i przewody',
  'Zasilanie',
  'Pamięci i komputery',
  'Montaż i akcesoria',
  'Narzędzia',
  'Inne'
];

function normalizeInventoryCategory(category = '') {
  const value = String(category || '').trim();
  if (!value) return 'Inne';
  const found = INVENTORY_CATEGORIES.find(item => item.toLowerCase() === value.toLowerCase());
  return found || value;
}

function inferInventoryCategory(product = '') {
  const text = String(product || '').toLowerCase();
  if (/kamera|ezviz|svis|hikvision|dahua|tubow|obrotow|kopuł|kopul|wifi/.test(text)) return 'Kamery';
  if (/rejestrator|nvr|dvr|dekoder|dvbt|tuner/.test(text)) return 'Rejestratory i dekodery';
  if (/antena|konwerter|wzmacniacz anten|separator|obejma na konwerter|czasza/.test(text)) return 'Anteny i osprzęt antenowy';
  if (/router|switch|access point|tp-link|tplink|ubiquiti|mikrotik|lan|ethernet/.test(text)) return 'Sieć i routery';
  if (/kabel|przewód|przewod|utp|ftp|koncentryk|skrętka|skretka|peszel/.test(text)) return 'Kable i przewody';
  if (/zasilacz|ładowarka|ladowarka|akumulator|bateria|ups|gniazdko|listwa/.test(text)) return 'Zasilanie';
  if (/pamięć|pamiec|microsd|sd|dysk|ssd|hdd|płyta główna|plyta glowna|thinkpad|laptop|komputer|ram/.test(text)) return 'Pamięci i komputery';
  if (/kołki|kolki|uchwyt|puszka|adapter|wtyk|końcówk|koncowk|beczka|taśma|tasma|opaska|listwa maskująca|maskuj/.test(text)) return 'Montaż i akcesoria';
  if (/wiertarka|miernik|zaciskarka|tester|klucz|śrubokręt|srubokret|narzędzie|narzedzie/.test(text)) return 'Narzędzia';
  return 'Inne';
}

function renderInventoryCategoryOptions(selected = '') {
  const current = normalizeInventoryCategory(selected || 'Inne');
  const categories = INVENTORY_CATEGORIES.includes(current) ? INVENTORY_CATEGORIES : [...INVENTORY_CATEGORIES, current];
  return categories.map(category => `<option value="${escapeHtml(category)}" ${category === current ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('');
}

function createInventoryMovement({ entryKey = '', entryHash = '', entry = null, action = 'korekta_reczna', product, quantity, unit = 'szt', unitCost = 0, category = '', confidence = 1, reason = '', sourceDescription = 'Korekta ręczna magazynu' }) {
  const now = new Date().toISOString();
  const movement = {
    id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    entryKey: entryKey || '',
    entrySyncId: entry?.syncId || '',
    entryLocalId: entry?.id || '',
    entryHash: entryHash || '',
    entryDate: entry?.entryDate || todayISO(),
    entryType: entry?.entryType || '',
    action,
    product: normalizeInventoryProductName(product),
    category: normalizeInventoryCategory(category || inferInventoryCategory(product)),
    quantity: Number(quantity || 0),
    unit: unit || 'szt',
    unitCost: Number(unitCost || 0),
    confidence: Number(confidence || 1),
    reason,
    sourceDescription,
    createdAt: now
  };
  const movements = getInventoryMovements();
  movements.push(movement);
  saveInventoryMovements(movements);
  rebuildInventoryItemsFromMovements(false, { skipSync: true });
  renderInventory();
  scheduleDropboxAutoSync();
  return movement;
}

function promptInventoryNumber(label, currentValue = '') {
  const raw = window.prompt(label, String(currentValue ?? '').replace('.', ','));
  if (raw === null) return null;
  const value = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(value)) {
    showMessage('Podano nieprawidłową liczbę.', 'error');
    return null;
  }
  return value;
}

function addManualInventoryItem() {
  const product = normalizeInventoryProductName(window.prompt('Nazwa produktu / materiału:', '') || '');
  if (!product) return;
  const quantity = promptInventoryNumber('Ilość:', '1');
  if (quantity === null) return;
  const unit = (window.prompt('Jednostka:', 'szt') || 'szt').trim() || 'szt';
  const unitCost = promptInventoryNumber('Cena jednostkowa / średni koszt:', '0');
  if (unitCost === null) return;
  const category = normalizeInventoryCategory(window.prompt('Kategoria:', inferInventoryCategory(product)) || inferInventoryCategory(product));
  createInventoryMovement({
    action: quantity >= 0 ? 'korekta_reczna' : 'korekta_reczna',
    product,
    quantity,
    unit,
    unitCost,
    category,
    reason: 'Dodano ręcznie z zakładki Magazyn.',
    sourceDescription: 'Dodanie ręczne'
  });
  showMessage('Dodano ręczny ruch magazynowy.');
}

function startInlineInventoryEdit(index) {
  const row = el.inventoryItemsBody?.querySelector(`tr[data-inventory-index="${index}"]`);
  if (!row || row.classList.contains('is-editing')) return;
  renderInventory(index);
}

function cancelInlineInventoryEdit() {
  renderInventory();
}

function saveInlineInventoryItem(index) {
  const row = el.inventoryItemsBody?.querySelector(`tr[data-inventory-index="${index}"]`);
  const items = getInventoryItems();
  const item = items[index];
  if (!row || !item) return;
  const product = normalizeInventoryProductName(row.querySelector('[data-edit-field="name"]')?.value || '');
  if (!product) {
    showMessage('Nazwa produktu nie może być pusta.', 'error');
    return;
  }
  const quantity = Number(String(row.querySelector('[data-edit-field="quantity"]')?.value || '0').replace(',', '.'));
  const unit = String(row.querySelector('[data-edit-field="unit"]')?.value || 'szt').trim() || 'szt';
  const unitCost = Number(String(row.querySelector('[data-edit-field="avgCost"]')?.value || '0').replace(',', '.'));
  const category = normalizeInventoryCategory(row.querySelector('[data-edit-field="category"]')?.value || inferInventoryCategory(product));
  if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) {
    showMessage('Ilość i koszt muszą być poprawnymi liczbami.', 'error');
    return;
  }
  setInventoryItemState(item, { product, quantity, unit, unitCost, category, reason: 'Zmiana po edycji bezpośrednio w tabeli.' });
  showMessage('Zapisano zmianę magazynu.');
}

function setInventoryItemState(item, { product, quantity, unit = 'szt', unitCost = 0, category = '', reason = 'Ręczna korekta magazynu.' }) {
  if (!item) return;
  const oldQty = Number(item.quantity || 0);
  if (Math.abs(oldQty) > 0.0001) {
    createInventoryMovement({
      action: 'korekta_reczna',
      product: item.name,
      quantity: -oldQty,
      unit: item.unit || 'szt',
      unitCost: Number(item.avgCost || 0),
      category: item.category || inferInventoryCategory(item.name),
      reason: 'Wyzerowanie starego stanu przed korektą ręczną.',
      sourceDescription: reason
    });
  }
  if (Math.abs(Number(quantity || 0)) > 0.0001) {
    createInventoryMovement({
      action: 'korekta_reczna',
      product,
      quantity,
      unit,
      unitCost,
      category,
      reason: 'Ustawienie nowego stanu po korekcie ręcznej.',
      sourceDescription: reason
    });
  } else {
    rebuildInventoryItemsFromMovements(false, { skipSync: true });
    renderInventory();
    scheduleDropboxAutoSync();
  }
}

let inventoryUndoTimer = null;
let inventoryUndoSnapshot = null;

function showInventoryUndoToast(message = 'Usunięto pozycję.', duration = 1000) {
  let toast = document.querySelector('#inventoryUndoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'inventoryUndoToast';
    toast.className = 'inventory-undo-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${escapeHtml(message)}</span><button type="button">Cofnij</button>`;
  toast.classList.add('show');
  const button = toast.querySelector('button');
  button.addEventListener('click', () => {
    if (inventoryUndoSnapshot) {
      saveInventoryMovements(inventoryUndoSnapshot.movements || []);
      saveInventoryItems(inventoryUndoSnapshot.items || []);
      inventoryUndoSnapshot = null;
      renderInventory();
      scheduleDropboxAutoSync();
      showMessage('Cofnięto usunięcie pozycji magazynowej.');
    }
    toast.classList.remove('show');
    if (inventoryUndoTimer) clearTimeout(inventoryUndoTimer);
  }, { once: true });
  if (inventoryUndoTimer) clearTimeout(inventoryUndoTimer);
  inventoryUndoTimer = setTimeout(() => {
    toast.classList.remove('show');
    inventoryUndoSnapshot = null;
  }, duration);
}

function deleteInventoryItem(index) {
  const items = getInventoryItems();
  const item = items[index];
  if (!item) return;
  inventoryUndoSnapshot = { items: getInventoryItems(), movements: getInventoryMovements() };
  const oldQty = Number(item.quantity || 0);
  if (Math.abs(oldQty) > 0.0001) {
    createInventoryMovement({
      action: 'korekta_reczna',
      product: item.name,
      quantity: -oldQty,
      unit: item.unit || 'szt',
      unitCost: Number(item.avgCost || 0),
      category: item.category || inferInventoryCategory(item.name),
      reason: 'Usunięcie pozycji magazynowej przez użytkownika.',
      sourceDescription: 'Usunięcie ręczne z magazynu'
    });
  } else {
    const filtered = getInventoryItems().filter((_, itemIndex) => itemIndex !== index);
    saveInventoryItems(filtered);
    renderInventory();
    scheduleDropboxAutoSync();
  }
  showInventoryUndoToast(`Usunięto: ${item.name}`, 1000);
}

function applyPendingInventoryItem(index) {
  const pending = getInventoryPending();
  const item = pending.results[index];
  if (!item) return;
  const direction = (window.prompt('Ruch magazynowy: wpisz + aby dodać albo - aby zdjąć:', item.movementType === 'out' ? '-' : '+') || '').trim();
  if (!['+', '-'].includes(direction)) return;
  const product = normalizeInventoryProductName(window.prompt('Produkt:', item.product || '') || '');
  if (!product) return;
  const quantityValue = promptInventoryNumber('Ilość:', item.quantity || 1);
  if (quantityValue === null) return;
  const unit = (window.prompt('Jednostka:', item.unit || 'szt') || 'szt').trim() || 'szt';
  const unitCost = promptInventoryNumber('Cena jednostkowa / koszt:', item.unitCost || 0);
  if (unitCost === null) return;
  const category = normalizeInventoryCategory(window.prompt('Kategoria:', item.category || inferInventoryCategory(product)) || item.category || inferInventoryCategory(product));
  const quantity = direction === '-' ? -Math.abs(quantityValue) : Math.abs(quantityValue);
  const movement = createInventoryMovement({
    entryKey: item.id_wpisu || '',
    entryHash: item.entryHash || '',
    entry: item.entry || null,
    action: direction === '-' ? 'zdejmij_z_magazynu' : 'dodaj_do_magazynu',
    product,
    quantity,
    unit,
    unitCost,
    category,
    confidence: item.confidence || 1,
    reason: `Ręcznie zastosowano wynik AI: ${item.reason || ''}`,
    sourceDescription: item.entry?.description || item.entry?.originalText || 'Ręczne zastosowanie wyniku AI'
  });
  const analysis = getInventoryAnalysis();
  analysis[item.id_wpisu] = {
    entryHash: item.entryHash || '',
    checkedAt: new Date().toISOString(),
    decision: direction === '-' ? 'zdejmij_z_magazynu' : 'dodaj_do_magazynu',
    movementIds: [movement.id],
    confidence: item.confidence || 1,
    reason: 'Ręcznie zastosowano po analizie AI.'
  };
  saveInventoryAnalysis(analysis);
  pending.results.splice(index, 1);
  saveInventoryPending(pending);
  renderInventory();
  showMessage('Zastosowano ręcznie wynik AI.');
}

function markPendingInventoryNoMove(index) {
  const pending = getInventoryPending();
  const item = pending.results[index];
  if (!item) return;
  const analysis = getInventoryAnalysis();
  analysis[item.id_wpisu] = {
    entryHash: item.entryHash || '',
    checkedAt: new Date().toISOString(),
    decision: 'brak_ruchu',
    movementIds: [],
    confidence: item.confidence || 0,
    reason: 'Użytkownik oznaczył ręcznie jako bez ruchu magazynowego.'
  };
  saveInventoryAnalysis(analysis);
  pending.results.splice(index, 1);
  saveInventoryPending(pending);
  renderInventory();
  scheduleDropboxAutoSync();
  showMessage('Oznaczono wpis jako bez ruchu magazynowego.');
}

function removePendingInventoryItem(index) {
  const pending = getInventoryPending();
  if (!pending.results[index]) return;
  pending.results.splice(index, 1);
  saveInventoryPending(pending);
  renderInventory();
  showMessage('Usunięto pozycję z listy ręcznego sprawdzenia.');
}

function applyInventoryMovementsFromPending(pending) {
  const now = new Date().toISOString();
  const movements = getInventoryMovements();
  const analysis = getInventoryAnalysis();
  let newMovements = movements.slice();
  let applied = 0;
  let checkedNoMove = 0;
  for (const item of pending.results || []) {
    const key = item.id_wpisu;
    const previousIds = new Set(analysis[key]?.movementIds || []);
    if (previousIds.size) newMovements = newMovements.filter(movement => !previousIds.has(movement.id));
    const movementIds = [];
    if (item.canApply) {
      const quantity = item.movementType === 'out' ? -Math.abs(Number(item.quantity || 0)) : Math.abs(Number(item.quantity || 0));
      const movement = {
        id: `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        entryKey: key,
        entrySyncId: item.entry?.syncId || '',
        entryLocalId: item.entry?.id || '',
        entryHash: item.entryHash,
        entryDate: item.entry?.entryDate || todayISO(),
        entryType: item.entry?.entryType || '',
        action: item.decision,
        product: item.product,
        category: normalizeInventoryCategory(item.category || inferInventoryCategory(item.product)),
        quantity,
        unit: item.unit || 'szt',
        unitCost: Number(item.unitCost || 0),
        confidence: Number(item.confidence || 0),
        reason: item.reason || '',
        sourceDescription: item.entry?.description || item.entry?.originalText || '',
        createdAt: now
      };
      newMovements.push(movement);
      movementIds.push(movement.id);
      applied += 1;
    } else {
      checkedNoMove += 1;
    }
    analysis[key] = {
      entryHash: item.entryHash,
      checkedAt: now,
      decision: item.decision,
      movementIds,
      confidence: item.confidence,
      reason: item.reason
    };
  }
  saveInventoryMovements(newMovements);
  saveInventoryAnalysis(analysis);
  rebuildInventoryItemsFromMovements(false, { skipSync: true });
  renderInventory();
  scheduleDropboxAutoSync();
  return { applied, checkedNoMove };
}

function rebuildInventoryItemsFromMovements(show = true, options = {}) {
  const movements = getInventoryMovements().slice().sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  const map = new Map();
  for (const movement of movements) {
    const key = inventoryProductKey(movement.product, movement.unit);
    if (!map.has(key)) {
      map.set(key, { id: `item-${key}`, name: movement.product, category: normalizeInventoryCategory(movement.category || inferInventoryCategory(movement.product)), unit: movement.unit || 'szt', quantity: 0, totalCost: 0, lastUpdated: movement.createdAt || '' });
    }
    const item = map.get(key);
    const qty = Number(movement.quantity || 0);
    item.quantity += qty;
    if (qty > 0) item.totalCost += qty * Number(movement.unitCost || 0);
    if (qty < 0 && item.quantity >= 0) item.totalCost = Math.max(0, item.totalCost + qty * (item.totalCost / Math.max(item.quantity - qty, 1)));
    item.category = normalizeInventoryCategory(movement.category || item.category || inferInventoryCategory(item.name));
    item.lastUpdated = movement.createdAt || item.lastUpdated;
  }
  const items = Array.from(map.values()).map(item => ({
    ...item,
    quantity: Number(item.quantity.toFixed(3)),
    avgCost: item.quantity > 0 ? item.totalCost / item.quantity : 0,
    value: item.quantity > 0 ? item.totalCost : 0
  })).filter(item => Math.abs(Number(item.quantity || 0)) > 0.0001).sort((a, b) => String(a.category || 'Inne').localeCompare(String(b.category || 'Inne'), 'pl') || a.name.localeCompare(b.name, 'pl'));
  saveInventoryItems(items, options);
  if (show) showMessage('Przeliczono stan magazynu z historii ruchów.');
  return items;
}


function normalizeInventorySearchText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function expandInventorySearchTerms(query = '') {
  const base = normalizeInventorySearchText(query).split(/\s+/).filter(Boolean);
  const extra = [];
  const aliases = {
    kamera: ['kamery', 'kamerka', 'ezviz', 'svis', 'hikvision', 'dahua', 'tubowa', 'obrotowa'],
    kamery: ['kamera', 'kamerka', 'ezviz', 'svis', 'hikvision', 'dahua'],
    router: ['tp link', 'tplink', 'sieci', 'wifi', 'access point', 'ap'],
    antena: ['anteny', 'konwerter', 'wzmacniacz', 'separator', 'czasza'],
    kabel: ['kable', 'przewod', 'przewody', 'utp', 'ftp', 'skretka', 'koncentryk'],
    zasilanie: ['zasilacz', 'ladowarka', 'akumulator', 'bateria', 'gniazdko', 'listwa'],
    pamiec: ['pamieci', 'microsd', 'sd', 'karta', 'dysk', 'ssd'],
    montaz: ['adapter', 'puszka', 'kolki', 'uchwyt', 'wtyk', 'koncowki']
  };
  for (const term of base) {
    if (aliases[term]) extra.push(...aliases[term].map(normalizeInventorySearchText));
  }
  return Array.from(new Set([...base, ...extra].filter(Boolean)));
}

function inventoryItemSearchText(item) {
  return normalizeInventorySearchText([
    item?.name,
    item?.category,
    item?.unit,
    inferInventoryCategory(item?.name || '')
  ].join(' '));
}

function inventoryItemMatchesSearch(item, query = '') {
  const cleanQuery = normalizeInventorySearchText(query);
  if (!cleanQuery) return true;
  const itemText = inventoryItemSearchText(item);
  const directTerms = normalizeInventorySearchText(query).split(/\s+/).filter(Boolean);
  const expandedTerms = expandInventorySearchTerms(query);
  if (!directTerms.length) return true;
  const allDirectMatch = directTerms.every(term => itemText.includes(term) || term.includes(itemText));
  if (allDirectMatch) return true;
  return expandedTerms.some(term => itemText.includes(term));
}

function renderInventory(editIndex = null) {
  const sortedItems = getInventoryItems().map(item => ({ ...item, category: normalizeInventoryCategory(item.category || inferInventoryCategory(item.name)) }))
    .sort((a, b) => String(a.category || 'Inne').localeCompare(String(b.category || 'Inne'), 'pl') || String(a.name || '').localeCompare(String(b.name || ''), 'pl'));
  saveInventoryItems(sortedItems, { skipSync: true });
  const movements = getInventoryMovements().slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const searchQuery = el.inventorySearchInput?.value || '';
  const items = sortedItems.map((item, originalIndex) => ({ ...item, _inventoryIndex: originalIndex }))
    .filter(item => inventoryItemMatchesSearch(item, searchQuery));
  if (el.inventorySummary) {
    const totalValue = sortedItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const negative = sortedItems.filter(item => Number(item.quantity || 0) < 0).length;
    const categoryCount = new Set(sortedItems.map(item => item.category || 'Inne')).size;
    const searchInfo = searchQuery ? ` · Wyniki wyszukiwania: <b>${items.length}</b> z ${sortedItems.length}` : '';
    el.inventorySummary.innerHTML = `Pozycji: <b>${sortedItems.length}</b> · Kategorii: <b>${categoryCount}</b> · Wartość: <b>${formatMoney(totalValue)}</b>${searchInfo}${negative ? ` · <b class="danger-text">Ujemne stany: ${negative}</b>` : ''}`;
  }
  if (el.inventoryItemsBody) {
    if (!items.length) {
      el.inventoryItemsBody.innerHTML = searchQuery ? '<tr><td colspan="8" class="empty-state">Brak wyników wyszukiwania w magazynie.</td></tr>' : '<tr><td colspan="8" class="empty-state">Brak pozycji magazynowych.</td></tr>';
    } else {
      let lastCategory = '';
      const rows = [];
      items.forEach((item) => {
        const index = item._inventoryIndex;
        const category = normalizeInventoryCategory(item.category || inferInventoryCategory(item.name));
        if (category !== lastCategory) {
          lastCategory = category;
          rows.push(`<tr class="inventory-category-row"><td colspan="8">${escapeHtml(category)}</td></tr>`);
        }
        rows.push(`
          <tr data-inventory-row="1" data-inventory-index="${index}">
            <td data-inventory-cell="name" data-index="${index}" title="Przytrzymaj, aby edytować nazwę.">${escapeHtml(item.name)}</td>
            <td data-inventory-cell="quantity" data-index="${index}" title="Przytrzymaj, aby edytować ilość.">${Number(item.quantity || 0).toLocaleString('pl-PL')}</td>
            <td data-inventory-cell="unit" data-index="${index}" title="Przytrzymaj, aby zmienić jednostkę.">${escapeHtml(item.unit || 'szt')}</td>
            <td data-inventory-cell="avgCost" data-index="${index}" title="Przytrzymaj, aby edytować średni koszt.">${formatMoney(Number(item.avgCost || 0))}</td>
            <td data-inventory-cell="category" data-index="${index}" title="Przytrzymaj, aby zmienić kategorię.">${escapeHtml(category)}</td>
            <td>${formatMoney(Number(item.value || 0))}</td>
            <td>${escapeHtml(formatDateTime(item.lastUpdated || ''))}</td>
            <td class="inventory-actions">
              <button class="tiny-button danger-button" type="button" data-inventory-action="delete" data-index="${index}">Usuń</button>
            </td>
          </tr>`);
      });
      el.inventoryItemsBody.innerHTML = rows.join('');
    }
  }
  if (el.inventoryPendingBody) {
    const pending = getInventoryPending();
    const rows = (pending.results || []).filter(item => !item.canApply || item.decision === 'wymaga_sprawdzenia');
    el.inventoryPendingBody.innerHTML = rows.length ? rows.slice(0, 200).map((item) => {
      const originalIndex = (pending.results || []).indexOf(item);
      const entryText = item.entry?.description || item.entry?.originalText || item.id_wpisu || '';
      return `
      <tr>
        <td>${escapeHtml(entryText)}</td>
        <td>${escapeHtml(formatInventoryAction(item.decision) || item.decision || '')}</td>
        <td>${escapeHtml(item.product || '')}</td>
        <td>${item.quantity ? `${Number(item.quantity || 0).toLocaleString('pl-PL')} ${escapeHtml(item.unit || 'szt')}` : ''}</td>
        <td>${Number(item.confidence || 0) ? `${(Number(item.confidence || 0) * 100).toFixed(0)}%` : ''}</td>
        <td>${escapeHtml(item.reason || '')}</td>
        <td class="inventory-actions">
          <button class="tiny-button" type="button" data-pending-action="apply" data-index="${originalIndex}">Zastosuj ręcznie</button>
          <button class="tiny-button" type="button" data-pending-action="nomove" data-index="${originalIndex}">Bez ruchu</button>
          <button class="tiny-button danger-button" type="button" data-pending-action="remove" data-index="${originalIndex}">Usuń</button>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" class="empty-state">Brak pozycji do ręcznego sprawdzenia.</td></tr>';
  }

  if (el.inventoryMovementsBody) {
    el.inventoryMovementsBody.innerHTML = movements.length ? movements.slice(0, 100).map(movement => `
      <tr>
        <td>${escapeHtml(formatDateTime(movement.createdAt || ''))}</td>
        <td>${escapeHtml(formatInventoryAction(movement.action))}</td>
        <td>${escapeHtml(movement.product)}</td>
        <td>${escapeHtml(normalizeInventoryCategory(movement.category || inferInventoryCategory(movement.product)))}</td>
        <td>${Number(movement.quantity || 0).toLocaleString('pl-PL')} ${escapeHtml(movement.unit || 'szt')}</td>
        <td>${escapeHtml(movement.sourceDescription || movement.entryKey || '')}</td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="empty-state">Brak ruchów magazynowych.</td></tr>';
  }
}

function saveInventoryCellValue(index, field, rawValue) {
  const items = getInventoryItems();
  const item = items[index];
  if (!item) return;
  const next = {
    product: item.name,
    quantity: Number(item.quantity || 0),
    unit: item.unit || 'szt',
    unitCost: Number(item.avgCost || 0),
    category: item.category || inferInventoryCategory(item.name)
  };

  if (field === 'name') {
    next.product = normalizeInventoryProductName(rawValue || '');
    if (!next.product) {
      showMessage('Nazwa produktu nie może być pusta.', 'error');
      renderInventory();
      return;
    }
  }
  if (field === 'quantity') {
    next.quantity = Number(String(rawValue || '0').replace(',', '.'));
    if (!Number.isFinite(next.quantity)) {
      showMessage('Ilość musi być liczbą.', 'error');
      renderInventory();
      return;
    }
  }
  if (field === 'unit') {
    next.unit = String(rawValue || 'szt').trim() || 'szt';
  }
  if (field === 'avgCost') {
    next.unitCost = Number(String(rawValue || '0').replace(',', '.'));
    if (!Number.isFinite(next.unitCost)) {
      showMessage('Średni koszt musi być liczbą.', 'error');
      renderInventory();
      return;
    }
  }
  if (field === 'category') {
    next.category = normalizeInventoryCategory(rawValue || inferInventoryCategory(next.product));
  }

  setInventoryItemState(item, { ...next, reason: `Edycja pola ${field} przez dłuższe przytrzymanie komórki.` });
  showMessage('Zapisano zmianę magazynu.');
}

function startInventoryCellEdit(cell) {
  if (!cell || cell.dataset.editing === '1') return;
  const index = Number(cell.dataset.index);
  const field = cell.dataset.inventoryCell;
  const item = getInventoryItems()[index];
  if (!item || !field) return;

  cell.dataset.editing = '1';
  cell.classList.add('inventory-cell-editing');
  const originalHtml = cell.innerHTML;
  let editor;

  if (field === 'unit') {
    editor = document.createElement('select');
    editor.className = 'inline-edit-input';
    const units = ['szt', 'm', 'kpl', 'rolka', 'opak', 'usł'];
    const current = item.unit || 'szt';
    const list = units.includes(current) ? units : [...units, current];
    editor.innerHTML = list.map(unit => `<option value="${escapeHtml(unit)}" ${unit === current ? 'selected' : ''}>${escapeHtml(unit)}</option>`).join('');
  } else if (field === 'category') {
    editor = document.createElement('select');
    editor.className = 'inline-edit-input';
    editor.innerHTML = renderInventoryCategoryOptions(item.category || inferInventoryCategory(item.name));
  } else {
    editor = document.createElement('input');
    editor.className = 'inline-edit-input';
    if (field === 'quantity' || field === 'avgCost') editor.inputMode = 'decimal';
    editor.value = field === 'name'
      ? item.name
      : field === 'quantity'
        ? String(Number(item.quantity || 0)).replace('.', ',')
        : String(Number(item.avgCost || 0).toFixed(2)).replace('.', ',');
  }

  const save = () => {
    if (!cell.dataset.editing) return;
    const value = editor.value;
    cell.dataset.editing = '';
    saveInventoryCellValue(index, field, value);
  };
  const cancel = () => {
    cell.dataset.editing = '';
    cell.classList.remove('inventory-cell-editing');
    cell.innerHTML = originalHtml;
  };

  cell.innerHTML = '';
  cell.appendChild(editor);
  editor.focus();
  if (editor.select) editor.select();
  editor.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); save(); }
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
  });
  editor.addEventListener('change', save);
  editor.addEventListener('blur', save);
}


function showInventoryPendingPopup(pending, skippedChecked = 0) {
  const applicable = pending.results.filter(item => item.canApply);
  const review = pending.results.filter(item => !item.canApply && item.decision === 'wymaga_sprawdzenia');
  const noMove = pending.results.filter(item => !item.canApply && item.decision === 'brak_ruchu');
  const lines = [];
  lines.push(`Rozpoznano wpisów: ${pending.results.length}`);
  lines.push(`Do zastosowania automatycznie: ${applicable.length}`);
  lines.push(`Bez ruchu magazynowego: ${noMove.length}`);
  lines.push(`Do ręcznego sprawdzenia: ${review.length}`);
  lines.push(`Pominięte jako już sprawdzone: ${skippedChecked}`);
  if (applicable.length) {
    lines.push('');
    lines.push('Zmiany:');
    for (const item of applicable.slice(0, 12)) {
      const sign = item.movementType === 'out' ? '-' : '+';
      lines.push(`${sign}${item.quantity} ${item.unit} · ${item.product} · ${(item.confidence * 100).toFixed(0)}%`);
    }
    if (applicable.length > 12) lines.push(`...i jeszcze ${applicable.length - 12} pozycji.`);
  }
  lines.push('');
  lines.push('Zastosować zaakceptowane zmiany magazynowe?');
  return window.confirm(lines.join('\n'));
}

async function runInventoryRecognition() {
  setInventoryBusy(true, 'Przygotowuję wpisy do analizy...');
  try {
    await reloadEntries();
    const { candidates, skippedChecked, from, to } = getInventoryCandidates();
    if (!candidates.length) {
      const message = `Brak nowych lub zmienionych firmowych wpisów do analizy za okres ${from} — ${to}. Pominięte jako już sprawdzone: ${skippedChecked}.`;
      setInventoryStatus(message, 'ready');
      showMessage(message);
      renderInventory();
      return;
    }
    setInventoryStatus(`Trwa analiza AI: wysyłam ${candidates.length} wpisów z okresu ${from} — ${to}. Nie zamykaj programu.`, 'working');
    showMessage(`Wysyłam do AI ${candidates.length} wpisów z okresu ${from} — ${to}...`);
    const aiPayload = await callInventoryAi(candidates);
    setInventoryStatus('AI zwróciła wynik. Przygotowuję podsumowanie i ruchy magazynowe...', 'working');
    const pending = buildPendingInventoryAnalysis(aiPayload, candidates);
    saveInventoryPending(pending);
    const accepted = showInventoryPendingPopup(pending, skippedChecked);
    if (!accepted) {
      setInventoryStatus('Analiza AI została wykonana, ale zmiany nie zostały zapisane.', 'error');
      showMessage('Analiza AI została przygotowana, ale nie zapisano zmian w magazynie.', 'error');
      return;
    }
    setInventoryStatus('Zapisuję zaakceptowane ruchy magazynowe...', 'working');
    const result = applyInventoryMovementsFromPending(pending);
    const finalMessage = `Magazyn zaktualizowany. Zastosowano: ${result.applied}, zapisano bez ruchu: ${result.checkedNoMove}, pominięte jako wcześniej sprawdzone: ${skippedChecked}.`;
    setInventoryStatus(finalMessage, 'ready');
    showMessage(finalMessage);
  } catch (error) {
    const message = error.message || 'Nie udało się rozpoznać magazynu.';
    setInventoryStatus(message, 'error');
    throw error;
  } finally {
    setInventoryBusy(false);
  }
}

function importInventoryFromPayload(payload, replace = false) {
  if (!payload || typeof payload !== 'object') return;
  if (replace) {
    if (Array.isArray(payload.inventoryItems)) saveInventoryItems(payload.inventoryItems, { skipSync: true });
    if (Array.isArray(payload.inventoryMovements)) saveInventoryMovements(payload.inventoryMovements, { skipSync: true });
    if (payload.inventoryAnalysis && typeof payload.inventoryAnalysis === 'object') saveInventoryAnalysis(payload.inventoryAnalysis, { skipSync: true });
    if (payload.inventoryPending && typeof payload.inventoryPending === 'object') saveInventoryPending(payload.inventoryPending, { skipSync: true });
    rebuildInventoryItemsFromMovements(false, { skipSync: true });
    return;
  }
  if (Array.isArray(payload.inventoryMovements)) {
    const current = getInventoryMovements();
    const byId = new Map(current.map(item => [item.id, item]));
    for (const movement of payload.inventoryMovements) {
      if (movement?.id && !byId.has(movement.id)) byId.set(movement.id, movement);
    }
    saveInventoryMovements(Array.from(byId.values()), { skipSync: true });
  }
  if (payload.inventoryAnalysis && typeof payload.inventoryAnalysis === 'object') {
    saveInventoryAnalysis({ ...getInventoryAnalysis(), ...payload.inventoryAnalysis }, { skipSync: true });
  }
  if (payload.inventoryPending && typeof payload.inventoryPending === 'object') {
    const localPending = getInventoryPending();
    const remotePending = payload.inventoryPending;
    const localResults = Array.isArray(localPending.results) ? localPending.results : [];
    const remoteResults = Array.isArray(remotePending.results) ? remotePending.results : [];
    const byKey = new Map(localResults.map(item => [`${item.id_wpisu || ''}|${item.entryHash || ''}|${item.decision || ''}`, item]));
    for (const item of remoteResults) {
      const key = `${item.id_wpisu || ''}|${item.entryHash || ''}|${item.decision || ''}`;
      if (!byKey.has(key)) byKey.set(key, item);
    }
    saveInventoryPending({ ...localPending, ...remotePending, results: Array.from(byKey.values()) }, { skipSync: true });
  }
  rebuildInventoryItemsFromMovements(false, { skipSync: true });
}

function setupAiAndInventory() {
  renderAiSettings();
  renderInventory();
  updateInventoryPeriodInputs(true);
  if (el.inventoryPeriodSelect) el.inventoryPeriodSelect.addEventListener('change', () => updateInventoryPeriodInputs(true));
  if (el.inventoryFromDate) el.inventoryFromDate.addEventListener('change', () => updateInventoryPeriodInputs(false));
  if (el.inventoryToDate) el.inventoryToDate.addEventListener('change', () => updateInventoryPeriodInputs(false));
  if (el.inventorySearchInput) el.inventorySearchInput.addEventListener('input', () => renderInventory());
  if (el.aiProviderSelect) el.aiProviderSelect.addEventListener('change', () => {
    const settings = getAiSettings();
    setJsonLocalStorage(AI_SETTINGS_KEY, { ...settings, provider: el.aiProviderSelect.value, model: (AI_MODEL_OPTIONS[el.aiProviderSelect.value] || [])[0] || '', customModel: '' });
    renderAiSettings();
  });
  if (el.aiSaveSettingsButton) el.aiSaveSettingsButton.addEventListener('click', event => {
    event.preventDefault();
    saveAiSettingsFromForm();
  });
  if (el.aiTestKeyButton) el.aiTestKeyButton.addEventListener('click', event => {
    event.preventDefault();
    testAiKey().catch(error => {
      if (el.aiSettingsStatus) el.aiSettingsStatus.textContent = error.message;
      showMessage(error.message, 'error');
    });
  });
  if (el.aiClearKeyButton) el.aiClearKeyButton.addEventListener('click', event => {
    event.preventDefault();
    const settings = getAiSettings();
    setJsonLocalStorage(AI_SETTINGS_KEY, { ...settings, apiKey: '' });
    renderAiSettings();
    showMessage('Usunięto zapisany klucz API.');
  });
  if (el.inventoryRecognizeButton) el.inventoryRecognizeButton.addEventListener('click', event => {
    event.preventDefault();
    runInventoryRecognition().catch(error => showMessage(error.message || 'Nie udało się rozpoznać magazynu.', 'error'));
  });
  if (el.inventoryPendingButton) el.inventoryPendingButton.addEventListener('click', event => {
    event.preventDefault();
    renderInventory();
    setInventoryStatus('Poniżej w sekcji „Ostatnie rozpoznanie AI / ręczne sprawdzenie” możesz zastosować albo odrzucić pozycje wymagające decyzji.', 'ready');
  });
  if (el.inventoryAddManualButton) el.inventoryAddManualButton.addEventListener('click', event => {
    event.preventDefault();
    addManualInventoryItem();
  });
  if (el.inventoryRebuildButton) el.inventoryRebuildButton.addEventListener('click', event => {
    event.preventDefault();
    rebuildInventoryItemsFromMovements(true);
    renderInventory();
  });
  if (el.inventoryItemsBody) el.inventoryItemsBody.addEventListener('click', event => {
    const button = event.target.closest('[data-inventory-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const index = Number(button.dataset.index);
    if (button.dataset.inventoryAction === 'delete') deleteInventoryItem(index);
  });
  if (el.inventoryItemsBody) {
    let inventoryHoldTimer = null;
    let inventoryHoldStartX = 0;
    let inventoryHoldStartY = 0;
    let inventoryHoldCell = null;

    const clearInventoryHold = () => {
      if (inventoryHoldTimer) window.clearTimeout(inventoryHoldTimer);
      inventoryHoldTimer = null;
      inventoryHoldCell = null;
    };

    el.inventoryItemsBody.addEventListener('pointerdown', event => {
      if (event.target.closest('button, input, select, textarea')) return;
      const cell = event.target.closest('[data-inventory-cell]');
      if (!cell) return;
      clearInventoryHold();
      inventoryHoldStartX = event.clientX || 0;
      inventoryHoldStartY = event.clientY || 0;
      inventoryHoldCell = cell;
      inventoryHoldTimer = window.setTimeout(() => {
        if (!inventoryHoldCell) return;
        startInventoryCellEdit(inventoryHoldCell);
        clearInventoryHold();
      }, 650);
    }, { passive: true });

    el.inventoryItemsBody.addEventListener('pointermove', event => {
      if (!inventoryHoldTimer) return;
      const dx = Math.abs((event.clientX || 0) - inventoryHoldStartX);
      const dy = Math.abs((event.clientY || 0) - inventoryHoldStartY);
      if (dx > 10 || dy > 10) clearInventoryHold();
    }, { passive: true });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
      el.inventoryItemsBody.addEventListener(type, clearInventoryHold, { passive: true });
    });

    el.inventoryItemsBody.addEventListener('contextmenu', event => {
      const cell = event.target.closest('[data-inventory-cell]');
      if (!cell || event.target.closest('button, input, select, textarea')) return;
      event.preventDefault();
      startInventoryCellEdit(cell);
    });
  }
  if (el.inventoryPendingBody) el.inventoryPendingBody.addEventListener('click', event => {
    const button = event.target.closest('[data-pending-action]');
    if (!button) return;
    event.preventDefault();
    const index = Number(button.dataset.index);
    if (button.dataset.pendingAction === 'apply') applyPendingInventoryItem(index);
    if (button.dataset.pendingAction === 'nomove') markPendingInventoryNoMove(index);
    if (button.dataset.pendingAction === 'remove') removePendingInventoryItem(index);
  });
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
  if (el.walletMonth) el.walletMonth.addEventListener('change', () => {
    if (el.walletAdjustment) el.walletAdjustment.value = '';
    renderWalletReport();
  });
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
    el.importInput.addEventListener('change', event => handleImportChange(event, { replace: false, applyDeletions: false }));
  }

  if (el.syncImportButton && el.syncImportInput) {
    el.syncImportButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(el.syncImportInput);
    });
    el.syncImportInput.addEventListener('change', event => handleImportChange(event, { replace: false, applyDeletions: false }));
  }

  if (el.replaceImportButton && el.replaceImportInput) {
    el.replaceImportButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(el.replaceImportInput);
    });
    el.replaceImportInput.addEventListener('change', event => handleImportChange(event, { replace: true, applyDeletions: false }));
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
    if (event.target.value === 'dropbox') {
      if (hasDropboxConnection() && hasDropboxForceLocalUpload()) {
        uploadLocalStateToDropbox('Lokalna baza została jednorazowo zapisana do Dropbox po zmianie trybu.').catch(error => showMessage(error.message, 'error'));
      } else if (hasDropboxConnection()) {
        updateCloudUi('Dropbox połączony. Możesz kliknąć „Synchronizuj teraz”.');
      } else {
        updateCloudUi('Kliknij „Połącz z Dropbox”, zaloguj się i zatwierdź dostęp.');
      }
    } else {
      updateCloudUi('Tryb lokalny. Dane są zapisane tylko w tej przeglądarce.');
    }
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
  if (el.appVersionBadge) el.appVersionBadge.textContent = 'v. 1.1 / 137';
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
  setupAiAndInventory();
  updateTodayNamedays();
  updateCloudUi();
  setupFirstRunMode();
  let handledDropboxReturn = false;
  try {
    handledDropboxReturn = await handleDropboxOAuthReturn();
  } catch (error) {
    showMessage(error.message || 'Nie udało się zakończyć logowania Dropbox.', 'error');
  }
  if (!handledDropboxReturn && getStorageMode() === 'dropbox' && hasDropboxConnection() && !new URL(window.location.href).searchParams.get('code')) {
    syncDropboxNow().catch(error => updateCloudUi(`Błąd synchronizacji Dropbox: ${error.message}`));
  }
}

init().catch(error => {
  showMessage(error.message || 'Błąd uruchamiania aplikacji.', 'error');
});
