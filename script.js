// --- ESTADO (DADOS) ---
let clocks = JSON.parse(localStorage.getItem('myClocks')) || [];

// --- FUNÇÕES CRUD ---

// 1. CREATE (Criar)
async function handleAdd() {
    const input = document.getElementById('countryInput');
    const statusMsg = document.getElementById('statusMsg');
    const term = input.value.trim();

    if (!term) return alert('Por favor, digite o nome de um país.');

    // Feedback visual
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#007bff';
    statusMsg.innerText = `Procurando por "${term}"...`;

    try {
        let countryData = null;

        // TENTATIVA 1: Busca pelo nome traduzido (ex: "Alemanha", "Japão")
        // A API RestCountries tem um endpoint específico para isso (/translation/)
        let res = await fetch(`https://restcountries.com/v3.1/translation/${term}`);
        
        // TENTATIVA 2: Se falhar (404), tenta pelo nome em inglês direto (caso o usuário digite "USA" ou "Japan")
        if (!res.ok) {
            res = await fetch(`https://restcountries.com/v3.1/name/${term}`);
        }

        if (!res.ok) throw new Error('País não encontrado');

        const data = await res.json();
        const country = data[0]; // Pega o primeiro resultado

        // Define a Capital (ou usa o nome do país se não tiver capital, ex: Antártica)
        const capitalName = country.capital ? country.capital[0] : 'Principal';
        
        // Pega coordenadas (Prioridade: CapitalInfo -> Latlng geral)
        let lat, lng;
        if (country.capitalInfo && country.capitalInfo.latlng) {
            [lat, lng] = country.capitalInfo.latlng;
        } else {
            [lat, lng] = country.latlng;
        }

        // Feedback visual
        statusMsg.innerText = `Encontrado! Buscando horário de ${capitalName}...`;

        // BUSCA O FUSO HORÁRIO (Usando Open-Meteo que é estável e não precisa de chave)
        const resTime = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`);
        
        if (!resTime.ok) throw new Error('Erro ao obter horário');
        
        const dataTime = await resTime.json();
        const timeZoneIANA = dataTime.timezone; // Ex: "Europe/Berlin"

        // Nome para exibir: Tenta pegar a tradução em PT, se não der, usa o nome comum
        const displayName = country.translations.por ? country.translations.por.common : country.name.common;

        // Cria o objeto
        const newClock = {
            id: Date.now(),
            name: displayName,
            capital: capitalName,
            timezoneId: timeZoneIANA
        };

        // Salva e Limpa
        clocks.push(newClock);
        saveAndRender();
        
        input.value = '';
        statusMsg.style.display = 'none';

    } catch (error) {
        console.error(error);
        statusMsg.style.color = 'red';
        statusMsg.innerText = 'Erro: País não encontrado ou falha na conexão. Tente verificar a grafia (ex: use acentos em Japão).';
    }
}

// 2. READ (Ler/Renderizar)
function renderClocks() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (clocks.length === 0) {
        app.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #777;">Nenhum relógio adicionado.</p>';
        return;
    }

    clocks.forEach(clock => {
        // A MÁGICA: Converte para o fuso horário salvo
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

// 3. UPDATE (Atualizar)
function handleUpdate(id) {
    const newName = prompt("Novo nome para este local:");
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
    if (confirm('Remover este relógio?')) {
        clocks = clocks.filter(c => c.id !== id);
        saveAndRender();
    }
}

// --- AUXILIARES ---
function saveAndRender() {
    localStorage.setItem('myClocks', JSON.stringify(clocks));
    renderClocks();
}

// Atualiza a cada segundo
setInterval(renderClocks, 1000);

// Carregamento inicial
renderClocks();