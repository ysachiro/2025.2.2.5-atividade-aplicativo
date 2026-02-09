// --- ESTADO (DADOS) ---
// Recupera do localStorage ao iniciar ou cria array vazio
let clocks = JSON.parse(localStorage.getItem('myClocks')) || [];

// --- FUNÇÕES CRUD ---

// 1. CREATE (Criar)
async function handleAdd() {
    const input = document.getElementById('countryInput');
    const countryName = input.value.trim();

    if (!countryName) return alert('Digite um nome de país!');

    try {
        // Busca dados na API RestCountries
        const res = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
        if (!res.ok) throw new Error('País não encontrado');
        
        const data = await res.json();
        const countryData = data[0]; // Pega o primeiro resultado

        // Cria o objeto do novo relógio
        const newClock = {
            id: Date.now(), // ID único baseado no tempo
            name: countryData.name.common, // Nome oficial
            timezone: countryData.timezones[0] // Pega o primeiro fuso horário do país
        };

        // Adiciona ao array e salva
        clocks.push(newClock);
        saveAndRender();
        input.value = ''; // Limpa o input

    } catch (error) {
        alert('Erro: País não encontrado ou nome inválido (tente em inglês).');
    }
}

// 2. READ (Ler/Renderizar)
function renderClocks() {
    const app = document.getElementById('app');
    app.innerHTML = ''; // Limpa o HTML atual

    // Gera o HTML para cada item da lista
    clocks.forEach(clock => {
        const timeString = calculateTime(clock.timezone);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${clock.name}</h2>
            <div class="time">${timeString}</div>
            <p class="timezone-info">Fuso: ${clock.timezone}</p>
            <div class="actions">
                <button class="btn-edit" onclick="handleUpdate(${clock.id})">Editar Nome</button>
                <button class="btn-delete" onclick="handleDelete(${clock.id})">Excluir</button>
            </div>
        `;
        app.appendChild(card);
    });
}

// 3. UPDATE (Atualizar)
function handleUpdate(id) {
    const newName = prompt("Como você quer chamar este local?");
    if (newName) {
        // Encontra o relógio pelo ID e atualiza o nome
        const clockIndex = clocks.findIndex(c => c.id === id);
        if (clockIndex > -1) {
            clocks[clockIndex].name = newName;
            saveAndRender();
        }
    }
}

// 4. DELETE (Excluir)
function handleDelete(id) {
    if (confirm('Tem certeza que deseja remover este relógio?')) {
        // Filtra o array removendo o item com o ID selecionado
        clocks = clocks.filter(c => c.id !== id);
        saveAndRender();
    }
}

// --- FUNÇÕES AUXILIARES ---

// Salva no LocalStorage e atualiza a tela
function saveAndRender() {
    localStorage.setItem('myClocks', JSON.stringify(clocks));
    renderClocks();
}

// Calcula a hora baseada no offset UTC (Ex: "UTC-03:00")
function calculateTime(offsetString) {
    const now = new Date();
    
    // Se for UTC puro
    if (offsetString === 'UTC') {
        return now.toLocaleTimeString('pt-BR', { timeZone: 'UTC' });
    }

    // Tratamento simples de string "UTC-03:00" para converter em horas
    // Nota: Para um app profissional, usaríamos bibliotecas, mas aqui faremos na mão para aprender
    const operator = offsetString.includes('+') ? 1 : -1;
    const parts = offsetString.replace('UTC', '').split(':');
    const hours = parseInt(parts[0]) * operator;
    const minutes = parts[1] ? parseInt(parts[1]) : 0;

    // Ajusta a hora
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (3600000 * hours) + (60000 * minutes));

    return targetTime.toLocaleTimeString('pt-BR');
}

// Atualiza os relógios a cada segundo
setInterval(renderClocks, 1000);

// Carrega inicial
renderClocks();