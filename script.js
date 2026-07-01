'use strict';

// --- CONFIGURAÇÃO / I18N ---

const STORAGE_KEY = 'myClocks';
const LANG_KEY = 'appLanguage';
const FETCH_TIMEOUT_MS = 8000;

const I18N = {
    pt: {
        locale: 'pt-BR',
        htmlLang: 'pt-br',
        pageTitle: 'Relógio Mundial - CRUD',
        title: '🌍 Relógio Mundial',
        subtitle: 'Digite o nome do país em Português para adicionar.',
        inputPlaceholder: 'Ex: Japão, França, Brasil...',
        addButton: 'Adicionar',
        addButtonLoading: 'Buscando...',
        emptyState: 'Nenhum relógio adicionado.',
        edit: 'Editar',
        delete: 'Excluir',
        langToggle: 'English',
        searching: term => `Procurando por "${term}"...`,
        found: capital => `Encontrado! Buscando horário de ${capital}...`,
        errEmpty: 'Por favor, digite o nome de um país.',
        errNotFound: 'País não encontrado. Verifique a grafia (ex: use acentos em Japão).',
        errTimeout: 'A busca demorou demais. Verifique sua conexão e tente novamente.',
        errNetwork: 'Falha na conexão. Verifique sua internet e tente novamente.',
        errTimezone: 'Não foi possível determinar o fuso horário deste país.',
        errDuplicate: term => `"${term}" já foi adicionado.`,
        errGeneric: 'Ocorreu um erro inesperado. Tente novamente.',
        promptNewName: 'Novo nome para este local:',
        confirmDelete: 'Remover este relógio?',
        loadError: 'Não foi possível carregar os relógios salvos. Os dados podem estar corrompidos.',
    },
    en: {
        locale: 'en-US',
        htmlLang: 'en',
        pageTitle: 'World Clock - CRUD',
        title: '🌍 World Clock',
        subtitle: 'Type a country name to add it.',
        inputPlaceholder: 'E.g.: Japan, France, Brazil...',
        addButton: 'Add',
        addButtonLoading: 'Searching...',
        emptyState: 'No clocks added yet.',
        edit: 'Edit',
        delete: 'Delete',
        langToggle: 'Português',
        searching: term => `Searching for "${term}"...`,
        found: capital => `Found! Fetching time for ${capital}...`,
        errEmpty: 'Please type a country name.',
        errNotFound: 'Country not found. Check the spelling and try again.',
        errTimeout: 'The search took too long. Check your connection and try again.',
        errNetwork: 'Connection failed. Check your internet and try again.',
        errTimezone: 'Could not determine the timezone for this country.',
        errDuplicate: term => `"${term}" has already been added.`,
        errGeneric: 'Something went wrong. Please try again.',
        promptNewName: 'New name for this clock:',
        confirmDelete: 'Remove this clock?',
        loadError: 'Could not load saved clocks. The stored data may be corrupted.',
    },
};

// Fuso horário IANA representativo (capital) de cada país, por código ISO 3166-1 alpha-2.
// Evita uma segunda chamada de rede: a Rest Countries já devolve o código do país.
const COUNTRY_TIMEZONES = {
    AD: 'Europe/Andorra', AE: 'Asia/Dubai', AF: 'Asia/Kabul', AG: 'America/Antigua',
    AI: 'America/Anguilla', AL: 'Europe/Tirane', AM: 'Asia/Yerevan', AO: 'Africa/Luanda',
    AR: 'America/Argentina/Buenos_Aires', AS: 'Pacific/Pago_Pago', AT: 'Europe/Vienna',
    AU: 'Australia/Sydney', AW: 'America/Aruba', AX: 'Europe/Mariehamn', AZ: 'Asia/Baku',
    BA: 'Europe/Sarajevo', BB: 'America/Barbados', BD: 'Asia/Dhaka', BE: 'Europe/Brussels',
    BF: 'Africa/Ouagadougou', BG: 'Europe/Sofia', BH: 'Asia/Bahrain', BI: 'Africa/Bujumbura',
    BJ: 'Africa/Porto-Novo', BL: 'America/St_Barthelemy', BM: 'Atlantic/Bermuda',
    BN: 'Asia/Brunei', BO: 'America/La_Paz', BQ: 'America/Kralendijk', BR: 'America/Sao_Paulo',
    BS: 'America/Nassau', BT: 'Asia/Thimphu', BW: 'Africa/Gaborone', BY: 'Europe/Minsk',
    BZ: 'America/Belize', CA: 'America/Toronto', CD: 'Africa/Kinshasa', CF: 'Africa/Bangui',
    CG: 'Africa/Brazzaville', CH: 'Europe/Zurich', CI: 'Africa/Abidjan', CL: 'America/Santiago',
    CM: 'Africa/Douala', CN: 'Asia/Shanghai', CO: 'America/Bogota', CR: 'America/Costa_Rica',
    CU: 'America/Havana', CV: 'Atlantic/Cape_Verde', CW: 'America/Curacao', CY: 'Asia/Nicosia',
    CZ: 'Europe/Prague', DE: 'Europe/Berlin', DJ: 'Africa/Djibouti', DK: 'Europe/Copenhagen',
    DM: 'America/Dominica', DO: 'America/Santo_Domingo', DZ: 'Africa/Algiers',
    EC: 'America/Guayaquil', EE: 'Europe/Tallinn', EG: 'Africa/Cairo', ER: 'Africa/Asmara',
    ES: 'Europe/Madrid', ET: 'Africa/Addis_Ababa', FI: 'Europe/Helsinki', FJ: 'Pacific/Fiji',
    FK: 'Atlantic/Stanley', FM: 'Pacific/Pohnpei', FO: 'Atlantic/Faroe', FR: 'Europe/Paris',
    GA: 'Africa/Libreville', GB: 'Europe/London', GD: 'America/Grenada', GE: 'Asia/Tbilisi',
    GF: 'America/Cayenne', GH: 'Africa/Accra', GI: 'Europe/Gibraltar', GL: 'America/Nuuk',
    GM: 'Africa/Banjul', GN: 'Africa/Conakry', GP: 'America/Guadeloupe', GQ: 'Africa/Malabo',
    GR: 'Europe/Athens', GT: 'America/Guatemala', GU: 'Pacific/Guam', GW: 'Africa/Bissau',
    GY: 'America/Guyana', HK: 'Asia/Hong_Kong', HN: 'America/Tegucigalpa', HR: 'Europe/Zagreb',
    HT: 'America/Port-au-Prince', HU: 'Europe/Budapest', ID: 'Asia/Jakarta', IE: 'Europe/Dublin',
    IL: 'Asia/Jerusalem', IM: 'Europe/London', IN: 'Asia/Kolkata', IQ: 'Asia/Baghdad',
    IR: 'Asia/Tehran', IS: 'Atlantic/Reykjavik', IT: 'Europe/Rome', JE: 'Europe/London',
    JM: 'America/Jamaica', JO: 'Asia/Amman', JP: 'Asia/Tokyo', KE: 'Africa/Nairobi',
    KG: 'Asia/Bishkek', KH: 'Asia/Phnom_Penh', KI: 'Pacific/Tarawa', KM: 'Indian/Comoro',
    KN: 'America/St_Kitts', KP: 'Asia/Pyongyang', KR: 'Asia/Seoul', KW: 'Asia/Kuwait',
    KY: 'America/Cayman', KZ: 'Asia/Almaty', LA: 'Asia/Vientiane', LB: 'Asia/Beirut',
    LC: 'America/St_Lucia', LI: 'Europe/Vaduz', LK: 'Asia/Colombo', LR: 'Africa/Monrovia',
    LS: 'Africa/Maseru', LT: 'Europe/Vilnius', LU: 'Europe/Luxembourg', LV: 'Europe/Riga',
    LY: 'Africa/Tripoli', MA: 'Africa/Casablanca', MC: 'Europe/Monaco', MD: 'Europe/Chisinau',
    ME: 'Europe/Podgorica', MF: 'America/Marigot', MG: 'Indian/Antananarivo',
    MH: 'Pacific/Majuro', MK: 'Europe/Skopje', ML: 'Africa/Bamako', MM: 'Asia/Yangon',
    MN: 'Asia/Ulaanbaatar', MO: 'Asia/Macau', MQ: 'America/Martinique', MR: 'Africa/Nouakchott',
    MT: 'Europe/Malta', MU: 'Indian/Mauritius', MV: 'Indian/Maldives', MW: 'Africa/Blantyre',
    MX: 'America/Mexico_City', MY: 'Asia/Kuala_Lumpur', MZ: 'Africa/Maputo',
    NA: 'Africa/Windhoek', NC: 'Pacific/Noumea', NE: 'Africa/Niamey', NG: 'Africa/Lagos',
    NI: 'America/Managua', NL: 'Europe/Amsterdam', NO: 'Europe/Oslo', NP: 'Asia/Kathmandu',
    NR: 'Pacific/Nauru', NZ: 'Pacific/Auckland', OM: 'Asia/Muscat', PA: 'America/Panama',
    PE: 'America/Lima', PF: 'Pacific/Tahiti', PG: 'Pacific/Port_Moresby', PH: 'Asia/Manila',
    PK: 'Asia/Karachi', PL: 'Europe/Warsaw', PR: 'America/Puerto_Rico', PS: 'Asia/Hebron',
    PT: 'Europe/Lisbon', PW: 'Pacific/Palau', PY: 'America/Asuncion', QA: 'Asia/Qatar',
    RE: 'Indian/Reunion', RO: 'Europe/Bucharest', RS: 'Europe/Belgrade', RU: 'Europe/Moscow',
    RW: 'Africa/Kigali', SA: 'Asia/Riyadh', SB: 'Pacific/Guadalcanal', SC: 'Indian/Mahe',
    SD: 'Africa/Khartoum', SE: 'Europe/Stockholm', SG: 'Asia/Singapore', SI: 'Europe/Ljubljana',
    SK: 'Europe/Bratislava', SL: 'Africa/Freetown', SM: 'Europe/San_Marino',
    SN: 'Africa/Dakar', SO: 'Africa/Mogadishu', SR: 'America/Paramaribo', SS: 'Africa/Juba',
    ST: 'Africa/Sao_Tome', SV: 'America/El_Salvador', SX: 'America/Lower_Princes',
    SY: 'Asia/Damascus', SZ: 'Africa/Mbabane', TC: 'America/Grand_Turk', TD: 'Africa/Ndjamena',
    TG: 'Africa/Lome', TH: 'Asia/Bangkok', TJ: 'Asia/Dushanbe', TL: 'Asia/Dili',
    TM: 'Asia/Ashgabat', TN: 'Africa/Tunis', TO: 'Pacific/Tongatapu', TR: 'Europe/Istanbul',
    TT: 'America/Port_of_Spain', TV: 'Pacific/Funafuti', TW: 'Asia/Taipei',
    TZ: 'Africa/Dar_es_Salaam', UA: 'Europe/Kyiv', UG: 'Africa/Kampala', US: 'America/New_York',
    UY: 'America/Montevideo', UZ: 'Asia/Tashkent', VA: 'Europe/Vatican', VC: 'America/St_Vincent',
    VE: 'America/Caracas', VG: 'America/Tortola', VI: 'America/St_Thomas', VN: 'Asia/Ho_Chi_Minh',
    VU: 'Pacific/Efate', WS: 'Pacific/Apia', XK: 'Europe/Belgrade', YE: 'Asia/Aden',
    YT: 'Indian/Mayotte', ZA: 'Africa/Johannesburg', ZM: 'Africa/Lusaka', ZW: 'Africa/Harare',
};

// Dataset local dos países mais comuns (nome PT/EN + capital). Resolve o país
// instantaneamente, sem rede — a Rest Countries só é usada como reserva para
// países fora desta lista, já que a API externa pode ficar indisponível.
const LOCAL_COUNTRIES = [
    { cca2: 'AR', namePt: 'Argentina', nameEn: 'Argentina', capital: 'Buenos Aires' },
    { cca2: 'AT', namePt: 'Áustria', nameEn: 'Austria', capital: 'Vienna' },
    { cca2: 'AU', namePt: 'Austrália', nameEn: 'Australia', capital: 'Canberra' },
    { cca2: 'BE', namePt: 'Bélgica', nameEn: 'Belgium', capital: 'Brussels' },
    { cca2: 'BO', namePt: 'Bolívia', nameEn: 'Bolivia', capital: 'La Paz' },
    { cca2: 'BR', namePt: 'Brasil', nameEn: 'Brazil', capital: 'Brasília' },
    { cca2: 'CA', namePt: 'Canadá', nameEn: 'Canada', capital: 'Ottawa' },
    { cca2: 'CH', namePt: 'Suíça', nameEn: 'Switzerland', capital: 'Bern' },
    { cca2: 'CL', namePt: 'Chile', nameEn: 'Chile', capital: 'Santiago' },
    { cca2: 'CN', namePt: 'China', nameEn: 'China', capital: 'Beijing' },
    { cca2: 'CO', namePt: 'Colômbia', nameEn: 'Colombia', capital: 'Bogotá' },
    { cca2: 'CR', namePt: 'Costa Rica', nameEn: 'Costa Rica', capital: 'San José' },
    { cca2: 'CU', namePt: 'Cuba', nameEn: 'Cuba', capital: 'Havana' },
    { cca2: 'CZ', namePt: 'República Tcheca', nameEn: 'Czechia', capital: 'Prague' },
    { cca2: 'DE', namePt: 'Alemanha', nameEn: 'Germany', capital: 'Berlin' },
    { cca2: 'DK', namePt: 'Dinamarca', nameEn: 'Denmark', capital: 'Copenhagen' },
    { cca2: 'DO', namePt: 'República Dominicana', nameEn: 'Dominican Republic', capital: 'Santo Domingo' },
    { cca2: 'EC', namePt: 'Equador', nameEn: 'Ecuador', capital: 'Quito' },
    { cca2: 'EG', namePt: 'Egito', nameEn: 'Egypt', capital: 'Cairo' },
    { cca2: 'ES', namePt: 'Espanha', nameEn: 'Spain', capital: 'Madrid' },
    { cca2: 'FI', namePt: 'Finlândia', nameEn: 'Finland', capital: 'Helsinki' },
    { cca2: 'FR', namePt: 'França', nameEn: 'France', capital: 'Paris' },
    { cca2: 'GB', namePt: 'Reino Unido', nameEn: 'United Kingdom', capital: 'London' },
    { cca2: 'GR', namePt: 'Grécia', nameEn: 'Greece', capital: 'Athens' },
    { cca2: 'GT', namePt: 'Guatemala', nameEn: 'Guatemala', capital: 'Guatemala City' },
    { cca2: 'HN', namePt: 'Honduras', nameEn: 'Honduras', capital: 'Tegucigalpa' },
    { cca2: 'HT', namePt: 'Haiti', nameEn: 'Haiti', capital: 'Port-au-Prince' },
    { cca2: 'HU', namePt: 'Hungria', nameEn: 'Hungary', capital: 'Budapest' },
    { cca2: 'ID', namePt: 'Indonésia', nameEn: 'Indonesia', capital: 'Jakarta' },
    { cca2: 'IE', namePt: 'Irlanda', nameEn: 'Ireland', capital: 'Dublin' },
    { cca2: 'IL', namePt: 'Israel', nameEn: 'Israel', capital: 'Jerusalem' },
    { cca2: 'IN', namePt: 'Índia', nameEn: 'India', capital: 'New Delhi' },
    { cca2: 'IQ', namePt: 'Iraque', nameEn: 'Iraq', capital: 'Baghdad' },
    { cca2: 'IR', namePt: 'Irã', nameEn: 'Iran', capital: 'Tehran' },
    { cca2: 'IS', namePt: 'Islândia', nameEn: 'Iceland', capital: 'Reykjavik' },
    { cca2: 'IT', namePt: 'Itália', nameEn: 'Italy', capital: 'Rome' },
    { cca2: 'JM', namePt: 'Jamaica', nameEn: 'Jamaica', capital: 'Kingston' },
    { cca2: 'JO', namePt: 'Jordânia', nameEn: 'Jordan', capital: 'Amman' },
    { cca2: 'JP', namePt: 'Japão', nameEn: 'Japan', capital: 'Tokyo' },
    { cca2: 'KE', namePt: 'Quênia', nameEn: 'Kenya', capital: 'Nairobi' },
    { cca2: 'KH', namePt: 'Camboja', nameEn: 'Cambodia', capital: 'Phnom Penh' },
    { cca2: 'KR', namePt: 'Coreia do Sul', nameEn: 'South Korea', capital: 'Seoul' },
    { cca2: 'KP', namePt: 'Coreia do Norte', nameEn: 'North Korea', capital: 'Pyongyang' },
    { cca2: 'KW', namePt: 'Kuwait', nameEn: 'Kuwait', capital: 'Kuwait City' },
    { cca2: 'KZ', namePt: 'Cazaquistão', nameEn: 'Kazakhstan', capital: 'Astana' },
    { cca2: 'LA', namePt: 'Laos', nameEn: 'Laos', capital: 'Vientiane' },
    { cca2: 'LB', namePt: 'Líbano', nameEn: 'Lebanon', capital: 'Beirut' },
    { cca2: 'LK', namePt: 'Sri Lanka', nameEn: 'Sri Lanka', capital: 'Colombo' },
    { cca2: 'MA', namePt: 'Marrocos', nameEn: 'Morocco', capital: 'Rabat' },
    { cca2: 'MG', namePt: 'Madagascar', nameEn: 'Madagascar', capital: 'Antananarivo' },
    { cca2: 'MM', namePt: 'Myanmar', nameEn: 'Myanmar', capital: 'Naypyidaw' },
    { cca2: 'MN', namePt: 'Mongólia', nameEn: 'Mongolia', capital: 'Ulaanbaatar' },
    { cca2: 'MX', namePt: 'México', nameEn: 'Mexico', capital: 'Mexico City' },
    { cca2: 'MY', namePt: 'Malásia', nameEn: 'Malaysia', capital: 'Kuala Lumpur' },
    { cca2: 'NG', namePt: 'Nigéria', nameEn: 'Nigeria', capital: 'Abuja' },
    { cca2: 'NI', namePt: 'Nicarágua', nameEn: 'Nicaragua', capital: 'Managua' },
    { cca2: 'NL', namePt: 'Holanda', nameEn: 'Netherlands', capital: 'Amsterdam' },
    { cca2: 'NO', namePt: 'Noruega', nameEn: 'Norway', capital: 'Oslo' },
    { cca2: 'NP', namePt: 'Nepal', nameEn: 'Nepal', capital: 'Kathmandu' },
    { cca2: 'NZ', namePt: 'Nova Zelândia', nameEn: 'New Zealand', capital: 'Wellington' },
    { cca2: 'PA', namePt: 'Panamá', nameEn: 'Panama', capital: 'Panama City' },
    { cca2: 'PE', namePt: 'Peru', nameEn: 'Peru', capital: 'Lima' },
    { cca2: 'PH', namePt: 'Filipinas', nameEn: 'Philippines', capital: 'Manila' },
    { cca2: 'PK', namePt: 'Paquistão', nameEn: 'Pakistan', capital: 'Islamabad' },
    { cca2: 'PL', namePt: 'Polônia', nameEn: 'Poland', capital: 'Warsaw' },
    { cca2: 'PT', namePt: 'Portugal', nameEn: 'Portugal', capital: 'Lisbon' },
    { cca2: 'PY', namePt: 'Paraguai', nameEn: 'Paraguay', capital: 'Asunción' },
    { cca2: 'QA', namePt: 'Catar', nameEn: 'Qatar', capital: 'Doha' },
    { cca2: 'RO', namePt: 'Romênia', nameEn: 'Romania', capital: 'Bucharest' },
    { cca2: 'RS', namePt: 'Sérvia', nameEn: 'Serbia', capital: 'Belgrade' },
    { cca2: 'RU', namePt: 'Rússia', nameEn: 'Russia', capital: 'Moscow' },
    { cca2: 'SA', namePt: 'Arábia Saudita', nameEn: 'Saudi Arabia', capital: 'Riyadh' },
    { cca2: 'SE', namePt: 'Suécia', nameEn: 'Sweden', capital: 'Stockholm' },
    { cca2: 'SG', namePt: 'Singapura', nameEn: 'Singapore', capital: 'Singapore' },
    { cca2: 'SV', namePt: 'El Salvador', nameEn: 'El Salvador', capital: 'San Salvador' },
    { cca2: 'SY', namePt: 'Síria', nameEn: 'Syria', capital: 'Damascus' },
    { cca2: 'TH', namePt: 'Tailândia', nameEn: 'Thailand', capital: 'Bangkok' },
    { cca2: 'TN', namePt: 'Tunísia', nameEn: 'Tunisia', capital: 'Tunis' },
    { cca2: 'TR', namePt: 'Turquia', nameEn: 'Turkey', capital: 'Ankara' },
    { cca2: 'TW', namePt: 'Taiwan', nameEn: 'Taiwan', capital: 'Taipei' },
    { cca2: 'UA', namePt: 'Ucrânia', nameEn: 'Ukraine', capital: 'Kyiv' },
    { cca2: 'US', namePt: 'Estados Unidos', nameEn: 'United States', capital: 'Washington, D.C.' },
    { cca2: 'UY', namePt: 'Uruguai', nameEn: 'Uruguay', capital: 'Montevideo' },
    { cca2: 'VE', namePt: 'Venezuela', nameEn: 'Venezuela', capital: 'Caracas' },
    { cca2: 'VN', namePt: 'Vietnã', nameEn: 'Vietnam', capital: 'Hanoi' },
    { cca2: 'ZA', namePt: 'África do Sul', nameEn: 'South Africa', capital: 'Pretoria' },
    { cca2: 'AO', namePt: 'Angola', nameEn: 'Angola', capital: 'Luanda' },
    { cca2: 'MZ', namePt: 'Moçambique', nameEn: 'Mozambique', capital: 'Maputo' },
    { cca2: 'CV', namePt: 'Cabo Verde', nameEn: 'Cabo Verde', capital: 'Praia' },
    { cca2: 'GH', namePt: 'Gana', nameEn: 'Ghana', capital: 'Accra' },
    { cca2: 'ET', namePt: 'Etiópia', nameEn: 'Ethiopia', capital: 'Addis Ababa' },
    { cca2: 'DZ', namePt: 'Argélia', nameEn: 'Algeria', capital: 'Algiers' },
    { cca2: 'NA', namePt: 'Namíbia', nameEn: 'Namibia', capital: 'Windhoek' },
    { cca2: 'ZW', namePt: 'Zimbábue', nameEn: 'Zimbabwe', capital: 'Harare' },
    { cca2: 'AE', namePt: 'Emirados Árabes Unidos', nameEn: 'United Arab Emirates', capital: 'Abu Dhabi' },
    { cca2: 'BD', namePt: 'Bangladesh', nameEn: 'Bangladesh', capital: 'Dhaka' },
    { cca2: 'BG', namePt: 'Bulgária', nameEn: 'Bulgaria', capital: 'Sofia' },
    { cca2: 'HR', namePt: 'Croácia', nameEn: 'Croatia', capital: 'Zagreb' },
    { cca2: 'GE', namePt: 'Geórgia', nameEn: 'Georgia', capital: 'Tbilisi' },
    { cca2: 'AM', namePt: 'Armênia', nameEn: 'Armenia', capital: 'Yerevan' },
    { cca2: 'AZ', namePt: 'Azerbaijão', nameEn: 'Azerbaijan', capital: 'Baku' },
    { cca2: 'CY', namePt: 'Chipre', nameEn: 'Cyprus', capital: 'Nicosia' },
    { cca2: 'LT', namePt: 'Lituânia', nameEn: 'Lithuania', capital: 'Vilnius' },
    { cca2: 'LV', namePt: 'Letônia', nameEn: 'Latvia', capital: 'Riga' },
    { cca2: 'EE', namePt: 'Estônia', nameEn: 'Estonia', capital: 'Tallinn' },
    { cca2: 'SK', namePt: 'Eslováquia', nameEn: 'Slovakia', capital: 'Bratislava' },
    { cca2: 'SI', namePt: 'Eslovênia', nameEn: 'Slovenia', capital: 'Ljubljana' },
    { cca2: 'LU', namePt: 'Luxemburgo', nameEn: 'Luxembourg', capital: 'Luxembourg' },
    { cca2: 'MT', namePt: 'Malta', nameEn: 'Malta', capital: 'Valletta' },
    { cca2: 'BY', namePt: 'Belarus', nameEn: 'Belarus', capital: 'Minsk' },
    { cca2: 'MD', namePt: 'Moldávia', nameEn: 'Moldova', capital: 'Chisinau' },
    { cca2: 'AL', namePt: 'Albânia', nameEn: 'Albania', capital: 'Tirana' },
    { cca2: 'MK', namePt: 'Macedônia do Norte', nameEn: 'North Macedonia', capital: 'Skopje' },
    { cca2: 'BA', namePt: 'Bósnia e Herzegovina', nameEn: 'Bosnia and Herzegovina', capital: 'Sarajevo' },
    { cca2: 'ME', namePt: 'Montenegro', nameEn: 'Montenegro', capital: 'Podgorica' },
    { cca2: 'XK', namePt: 'Kosovo', nameEn: 'Kosovo', capital: 'Pristina' },
];

// Apelidos extras (siglas, nomes populares) além do nome PT/EN/código do país.
const EXTRA_ALIASES = {
    US: ['eua', 'usa', 'america', 'united states of america'],
    GB: ['uk', 'inglaterra', 'england', 'britain', 'great britain'],
    NL: ['paises baixos', 'países baixos'],
    AE: ['uae', 'emirados'],
    CZ: ['tcheca', 'czech republic'],
    KR: ['korea'],
    KP: ['north korea'],
};

function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function buildLocalCountryIndex() {
    const index = new Map();
    LOCAL_COUNTRIES.forEach(country => {
        const keys = [country.namePt, country.nameEn, country.cca2, ...(EXTRA_ALIASES[country.cca2] || [])];
        keys.forEach(key => index.set(normalize(key), country));
    });
    return index;
}

const LOCAL_COUNTRY_INDEX = buildLocalCountryIndex();

function findLocalCountry(term) {
    return LOCAL_COUNTRY_INDEX.get(normalize(term)) || null;
}

// --- ESTADO ---

const state = {
    clocks: loadClocks(),
    language: loadLanguage(),
};

// --- ELEMENTOS ---

let elements = {};

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', init);

function init() {
    elements = {
        form: document.getElementById('addForm'),
        input: document.getElementById('countryInput'),
        addBtn: document.getElementById('addBtn'),
        statusMsg: document.getElementById('statusMsg'),
        app: document.getElementById('app'),
        langToggle: document.getElementById('langToggle'),
        title: document.getElementById('appTitle'),
        subtitle: document.getElementById('appSubtitle'),
    };

    elements.form.addEventListener('submit', onAddSubmit);
    elements.langToggle.addEventListener('click', toggleLanguage);
    elements.app.addEventListener('click', onClockActionClick);

    applyTranslations();
    renderClocks();
    setInterval(renderClocks, 1000);
}

// --- I18N HELPERS ---

function t() {
    return I18N[state.language];
}

function applyTranslations() {
    const dict = t();
    document.documentElement.lang = dict.htmlLang;
    document.title = dict.pageTitle;
    elements.title.textContent = dict.title;
    elements.subtitle.textContent = dict.subtitle;
    elements.input.placeholder = dict.inputPlaceholder;
    elements.langToggle.textContent = dict.langToggle;
    if (!elements.addBtn.disabled) {
        elements.addBtn.textContent = dict.addButton;
    }
    renderClocks();
}

function toggleLanguage() {
    state.language = state.language === 'pt' ? 'en' : 'pt';
    saveLanguage(state.language);
    applyTranslations();
}

// --- PERSISTÊNCIA ---

function loadClocks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to load clocks from storage:', error);
        return [];
    }
}

function loadLanguage() {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' ? 'en' : 'pt';
}

function saveLanguage(lang) {
    try {
        localStorage.setItem(LANG_KEY, lang);
    } catch (error) {
        console.error('Failed to save language preference:', error);
    }
}

function saveAndRender() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.clocks));
    } catch (error) {
        console.error('Failed to save clocks to storage:', error);
        showStatus(t().errGeneric, true);
    }
    renderClocks();
}

// --- REDE ---

async function fetchJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new AppError(t().errTimeout);
        }
        throw new AppError(t().errNetwork);
    } finally {
        clearTimeout(timer);
    }
}

class AppError extends Error {}

// Resolve o país digitado: tenta o dataset local primeiro (instantâneo, sem
// rede) e só usa a Rest Countries como reserva para o que não estiver nele.
async function resolveCountry(term) {
    const local = findLocalCountry(term);
    if (local) {
        const timezoneId = COUNTRY_TIMEZONES[local.cca2];
        return {
            cca2: local.cca2,
            namePt: local.namePt,
            nameEn: local.nameEn,
            capital: local.capital,
            tzType: 'iana',
            timezoneId,
            timezoneLabel: timezoneId,
        };
    }

    return fetchRemoteCountry(term);
}

async function fetchRemoteCountry(term) {
    let res = await fetchJSON(`https://restcountries.com/v3.1/translation/${encodeURIComponent(term)}`);

    if (!res.ok) {
        res = await fetchJSON(`https://restcountries.com/v3.1/name/${encodeURIComponent(term)}`);
    }

    if (!res.ok) {
        throw new AppError(t().errNotFound);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
        throw new AppError(t().errNotFound);
    }

    const country = data[0];
    const capitalName = country.capital ? country.capital[0] : (country.translations?.por?.common || country.name.common);
    const timezone = resolveTimezone(country);

    return {
        cca2: country.cca2,
        namePt: country.translations?.por?.common || country.name.common,
        nameEn: country.name.common,
        capital: capitalName,
        tzType: timezone.type,
        timezoneId: timezone.timezoneId,
        offsetMinutes: timezone.offsetMinutes,
        timezoneLabel: timezone.label,
    };
}

// Resolve o fuso horário do país sem precisar de uma segunda chamada de rede:
// 1) mapa local (preciso, com horário de verão) ou 2) o campo "timezones" que a
// própria Rest Countries já devolve (offset fixo, sem horário de verão).
function resolveTimezone(country) {
    const ianaZone = COUNTRY_TIMEZONES[country.cca2];
    if (ianaZone) {
        return { type: 'iana', timezoneId: ianaZone, label: ianaZone };
    }

    const offsetLabel = Array.isArray(country.timezones) ? country.timezones[0] : null;
    const offsetMinutes = parseUtcOffset(offsetLabel);
    if (offsetMinutes !== null) {
        return { type: 'offset', offsetMinutes, label: offsetLabel };
    }

    throw new AppError(t().errTimezone);
}

function parseUtcOffset(label) {
    if (typeof label !== 'string') return null;
    if (label.trim().toUpperCase() === 'UTC') return 0;

    const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(label.trim());
    if (!match) return null;

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);
    return sign * (hours * 60 + minutes);
}

// --- CRUD: CREATE ---

async function onAddSubmit(event) {
    event.preventDefault();

    const term = elements.input.value.trim();

    if (!term) {
        showStatus(t().errEmpty, true);
        return;
    }

    setLoading(true);
    showStatus(t().searching(term), false);

    try {
        const country = await resolveCountry(term);

        if (isDuplicate(country.cca2)) {
            throw new AppError(t().errDuplicate(term));
        }

        showStatus(t().found(country.capital), false);

        const newClock = {
            id: Date.now(),
            countryCode: country.cca2,
            namePt: country.namePt,
            nameEn: country.nameEn,
            capital: country.capital,
            tzType: country.tzType,
            timezoneId: country.timezoneId,
            offsetMinutes: country.offsetMinutes,
            timezoneLabel: country.timezoneLabel,
        };

        state.clocks.push(newClock);
        saveAndRender();

        elements.input.value = '';
        hideStatus();
    } catch (error) {
        const message = error instanceof AppError ? error.message : t().errGeneric;
        if (!(error instanceof AppError)) {
            console.error(error);
        }
        showStatus(message, true);
    } finally {
        setLoading(false);
    }
}

function isDuplicate(countryCode) {
    return state.clocks.some(clock => clock.countryCode === countryCode);
}

// --- CRUD: READ ---

function renderClocks() {
    const dict = t();
    elements.app.innerHTML = '';

    if (state.clocks.length === 0) {
        elements.app.innerHTML = `<p class="empty-state">${dict.emptyState}</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    state.clocks.forEach(clock => {
        const timeString = formatTime(clock, dict.locale);
        const displayName = state.language === 'en' ? (clock.nameEn || clock.namePt) : (clock.namePt || clock.nameEn);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${escapeHtml(displayName)}</h2>
            <p class="capital">${escapeHtml(clock.capital)}</p>
            <div class="time">${timeString}</div>
            <p class="timezone-info">${escapeHtml(clock.timezoneLabel || clock.timezoneId)}</p>
            <div class="actions">
                <button class="btn-edit" data-action="edit" data-id="${clock.id}">${dict.edit}</button>
                <button class="btn-delete" data-action="delete" data-id="${clock.id}">${dict.delete}</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    elements.app.appendChild(fragment);
}

function formatTime(clock, locale) {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    try {
        if (clock.tzType === 'offset') {
            const now = new Date();
            const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
            const target = new Date(utcMillis + clock.offsetMinutes * 60000);
            return target.toLocaleTimeString(locale, { ...options, timeZone: 'UTC' });
        }

        return new Date().toLocaleTimeString(locale, { ...options, timeZone: clock.timezoneId });
    } catch (error) {
        console.error('Invalid timezone:', clock, error);
        return '--:--:--';
    }
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

// --- CRUD: UPDATE / DELETE ---

function onClockActionClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') {
        handleUpdate(id);
    } else if (button.dataset.action === 'delete') {
        handleDelete(id);
    }
}

function handleUpdate(id) {
    const clock = state.clocks.find(c => c.id === id);
    if (!clock) return;

    const currentName = state.language === 'en' ? (clock.nameEn || clock.namePt) : (clock.namePt || clock.nameEn);
    const newName = prompt(t().promptNewName, currentName);
    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    if (state.language === 'en') {
        clock.nameEn = trimmed;
    } else {
        clock.namePt = trimmed;
    }
    saveAndRender();
}

function handleDelete(id) {
    if (!confirm(t().confirmDelete)) return;
    state.clocks = state.clocks.filter(c => c.id !== id);
    saveAndRender();
}

// --- UI HELPERS ---

function setLoading(isLoading) {
    const dict = t();
    elements.input.disabled = isLoading;
    elements.addBtn.disabled = isLoading;
    elements.addBtn.textContent = isLoading ? dict.addButtonLoading : dict.addButton;
}

function showStatus(message, isError) {
    elements.statusMsg.hidden = false;
    elements.statusMsg.textContent = message;
    elements.statusMsg.classList.toggle('status-error', isError);
    elements.statusMsg.classList.toggle('status-info', !isError);
}

function hideStatus() {
    elements.statusMsg.hidden = true;
    elements.statusMsg.textContent = '';
}
