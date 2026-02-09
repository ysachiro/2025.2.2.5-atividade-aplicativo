// --- ESTADO (DADOS) ---
let clocks = JSON.parse(localStorage.getItem('myClocks')) || [];

// --- FUNÇÕES CRUD ---

// 1. CREATE (Criar)
async function handleAdd() {
    const input = document.getElementById('countryInput');
    const loading = document.getElementById('loading');
    const countryName = input.value.trim();

    if (!countryName) return alert('Digite um nome de país!');

    loading.style.display = 'block'; // Mostra "Buscando..."

    try {
        // PASSO 1: Buscar dados do país (Capital e Coordenadas)
        const resCountry = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
        if (!resCountry.ok) throw new Error('País não encontrado');
        
        const dataCountry = await resCountry.json();
        const country = dataCountry[0]; // Pega o primeiro resultado

        // Preferência: Usar coordenadas da capital. Se não tiver, usa do país.
        // A capital é mais precisa para o "horário oficial" que as pessoas esperam.
        let lat, lng;
        if (country.capitalInfo && country.capitalInfo.latlng) {
            [lat, lng] = country.capitalInfo.latlng;
        } else {
            [lat, lng] = country.latlng;
        }

        const capitalName = country.capital ? country.capital[0] : 'Desconhecida';

        // PASSO 2: Buscar o fuso horário exato (IANA Timezone) baseado na latitude/longitude
        // Usamos a API gratuita TimeAPI.io
        const resTime = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`);
        if (!resTime.ok) throw new Error('Erro ao buscar fuso horário');
        
        const dataTime = await resTime.json();
        const timeZoneIANA = dataTime.timeZone; // Ex: "America/Sao_Paulo"

        // Cria o objeto do novo relógio
        const newClock = {
            id: Date.now(),
            name: country.name.common,
            capital: capitalName,
            timezoneId: timeZoneIANA // Salvamos o ID oficial (ex: America/Sao_Paulo)
        };

        clocks.push(newClock);
        saveAndRender();
        input.value = ''; 

    } catch (error) {
        console.error(error);
        alert('Erro: País não encontrado ou falha na conexão. Tente digitar o nome em inglês (ex: Brazil).');
    } finally {
        loading.style.display = 'none'; // Esconde "Buscando..."
    }
}

// 2. READ (Ler/Renderizar)
function renderClocks() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    clocks.forEach(clock => {
        // A MÁGICA: O JavaScript converte a data atual para o fuso salvo
        const timeString = new Date().toLocaleTimeString('pt-BR', {
            timeZone: clock.timezoneId,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${clock.name}</h2>
            <p class="capital">Capital: ${clock.capital}</p>
            <div class="time">${timeString}</div>
            <p class="timezone-info">Zona: ${clock.timezoneId}</p>
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
    const newName = prompt("Mudar nome de exibição para:");
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

// Atualiza os segundos a cada 1000ms (1 segundo)
setInterval(renderClocks, 1000);

// Carregamento inicial
renderClocks();