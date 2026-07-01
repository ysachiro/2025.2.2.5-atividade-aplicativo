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
        errTimezone: 'Não foi possível obter o horário deste país.',
        errNoCoords: 'Não foi possível localizar as coordenadas deste país.',
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
        errTimezone: 'Could not fetch the time for this country.',
        errNoCoords: 'Could not find coordinates for this country.',
        errDuplicate: term => `"${term}" has already been added.`,
        errGeneric: 'Something went wrong. Please try again.',
        promptNewName: 'New name for this clock:',
        confirmDelete: 'Remove this clock?',
        loadError: 'Could not load saved clocks. The stored data may be corrupted.',
    },
};

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

async function fetchCountry(term) {
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

    return data[0];
}

async function fetchTimezone(lat, lng) {
    const res = await fetchJSON(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
    );

    if (!res.ok) {
        throw new AppError(t().errTimezone);
    }

    const data = await res.json();
    if (!data.timezone) {
        throw new AppError(t().errTimezone);
    }

    return data.timezone;
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
        const country = await fetchCountry(term);

        if (isDuplicate(country.cca2)) {
            throw new AppError(t().errDuplicate(term));
        }

        const capitalName = country.capital ? country.capital[0] : (country.translations?.por?.common || country.name.common);

        let lat, lng;
        if (country.capitalInfo && Array.isArray(country.capitalInfo.latlng)) {
            [lat, lng] = country.capitalInfo.latlng;
        } else if (Array.isArray(country.latlng)) {
            [lat, lng] = country.latlng;
        }

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new AppError(t().errNoCoords);
        }

        showStatus(t().found(capitalName), false);

        const timezoneId = await fetchTimezone(lat, lng);

        const newClock = {
            id: Date.now(),
            countryCode: country.cca2,
            namePt: country.translations?.por?.common || country.name.common,
            nameEn: country.name.common,
            capital: capitalName,
            timezoneId,
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
        const timeString = formatTime(clock.timezoneId, dict.locale);
        const displayName = state.language === 'en' ? (clock.nameEn || clock.namePt) : (clock.namePt || clock.nameEn);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${escapeHtml(displayName)}</h2>
            <p class="capital">${escapeHtml(clock.capital)}</p>
            <div class="time">${timeString}</div>
            <p class="timezone-info">${escapeHtml(clock.timezoneId)}</p>
            <div class="actions">
                <button class="btn-edit" data-action="edit" data-id="${clock.id}">${dict.edit}</button>
                <button class="btn-delete" data-action="delete" data-id="${clock.id}">${dict.delete}</button>
            </div>
        `;
        fragment.appendChild(card);
    });

    elements.app.appendChild(fragment);
}

function formatTime(timezoneId, locale) {
    try {
        return new Date().toLocaleTimeString(locale, {
            timeZone: timezoneId,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch (error) {
        console.error('Invalid timezone:', timezoneId, error);
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
