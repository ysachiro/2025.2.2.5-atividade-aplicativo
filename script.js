// --- ESTADO (DADOS) ---
let clocks = JSON.parse(localStorage.getItem('myClocks')) || [];
let allCountriesList = []; // Vai guardar a lista de países para o autocomplete

// --- INICIALIZAÇÃO ---
// Assim que a página abre, busca todos os países para preencher o autocomplete
window.onload = async function() {
    const btnAdd = document.getElementById('btnAdd');
    const input = document.getElementById('countryInput');
    
    try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        const data = await res.json();

        // Mapeia apenas o necessário: Nome em PT-BR e Coordenadas
        allCountriesList = data.map(country => {
            return {
                namePT: country.translations.por ? country.translations.por.common : country.name.common,
                latlng: country.capitalInfo.latlng ? country.capitalInfo.latlng : country.latlng,
                capital: country.capital ? country.capital[0] : 'Desconhecida'
            };
        });

        // Ordena alfabeticamente
        allCountriesList.sort((a, b) => a.namePT.localeCompare(b.namePT));

        // Preenche o <datalist> no HTML
        const datalist = document.getElementById('sugestoes');
        allCountriesList.forEach(c => {
            const option = document.createElement('option');
            option.value = c.namePT;
            datalist.appendChild(option);
        });

        // Libera o uso
        input.disabled = false;
        btnAdd.disabled = false;
        btnAdd.textContent = "Adicionar Relógio";
        input.placeholder = "Digite: Brasil, Japão, França...";

    } catch (error) {
        console.error("Erro ao carregar países:", error);
        btnAdd.textContent = "Erro de conexão";
    }

    renderClocks(); // Renderiza os relógios salvos
};

// --- FUNÇÕES CRUD ---

// 1. CREATE (Criar)
async function handleAdd() {
    const input = document.getElementById('countryInput');
    const loading = document.getElementById('loading');
    const selectedName = input.value.trim(); // O nome em Português que o usuário digitou

    if (!selectedName) return alert('Digite um nome de país!');

    // Busca o país na nossa lista local (pelo nome em Português)
    const countryData = allCountriesList.find(c => c.namePT.toLowerCase() === selectedName.toLowerCase());

    if (!countryData) {
        return alert('País não encontrado na lista. Selecione uma das sugestões.');
    }

    loading.style.display = 'block';

    try {
        // Já temos as coordenadas salvas na lista, só precisamos do TimeZone ID
        const [lat, lng] = countryData.latlng;

        // API para pegar o ID do fuso horário (ex: "Asia/Tokyo")
        const resTime = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`);
        
        if (!resTime.ok) throw new Error('Erro ao buscar fuso horário');
        
        const dataTime = await resTime.json();
        const timeZoneIANA = dataTime.timeZone; 

        const newClock = {
            id: Date.now(),
            name: countryData.namePT, // Salva o nome em Português
            capital: countryData.capital,
            timezoneId: timeZoneIANA 
        };

        clocks.push(newClock);
        saveAndRender();
        input.value = ''; 

    } catch (error) {
        console.error(error);
        alert('Erro ao conectar com servidor de hora.');
    } finally {
        loading.style.display = 'none';
    }
}

// 2. READ (Ler/Renderizar)
function renderClocks() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    clocks.forEach(clock => {
        // Cria a data baseada no fuso horário salvo
        const timeString = new Date().toLocaleTimeString('pt-BR', {
            timeZone: clock.timezoneId,
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${clock.name}</h2>
            <p class="capital">${clock.capital}</p>
            <div class="time">${timeString}</div>
            <p class="timezone-info">${clock.timezoneId}</p>
            <div class="actions">
                <button class="btn-edit" onclick="handleUpdate(${clock.id})">Editar</button>
                <button class="btn-delete" onclick="handleDelete(${clock.id})">Excluir</button>
            </div>
        `;
        app.appendChild(card);
    });
}

// 3. UPDATE (Atualizar Nome)
function handleUpdate(id) {
    const newName = prompt("Novo nome para este relógio:");
    if (newName) {
        const clock = clocks.find(c => c.id === id);
        if (clock) {
            clock.name = newName;
            saveAndRender();
        }
    }
}

// 4. DELETE (Excluir)
function handleDelete(id) {
    if (confirm('Tem certeza?')) {
        clocks = clocks.filter(c => c.id !== id);
        saveAndRender();
    }
}

// --- AUXILIARES ---
function saveAndRender() {
    localStorage.setItem('myClocks', JSON.stringify(clocks));
    renderClocks();
}

// Atualiza o relógio a cada segundo
setInterval(renderClocks, 1000);