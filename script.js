// --- ESTADO (DADOS) ---
let clocks = JSON.parse(localStorage.getItem('myClocks')) || [];
let allCountriesList = []; 

// --- INICIALIZAÇÃO ---
window.onload = async function() {
    const btnAdd = document.getElementById('btnAdd');
    const input = document.getElementById('countryInput');
    const datalist = document.getElementById('sugestoes');

    // Estado inicial visual
    btnAdd.textContent = "Carregando lista de países...";
    
    try {
        // Busca a lista de países
        const res = await fetch('https://restcountries.com/v3.1/all');
        if (!res.ok) throw new Error('Erro ao baixar lista de países');
        
        const data = await res.json();

        // Mapeia e organiza os dados
        allCountriesList = data.map(country => ({
            namePT: country.translations.por ? country.translations.por.common : country.name.common,
            // Tenta pegar a lat/lng da capital, se falhar pega do país
            latlng: (country.capitalInfo && country.capitalInfo.latlng) ? country.capitalInfo.latlng : country.latlng,
            capital: country.capital ? country.capital[0] : 'Desconhecida'
        }));

        // Ordena alfabeticamente (A-Z)
        allCountriesList.sort((a, b) => a.namePT.localeCompare(b.namePT));

        // Preenche as opções de busca
        datalist.innerHTML = '';
        allCountriesList.forEach(c => {
            const option = document.createElement('option');
            option.value = c.namePT;
            datalist.appendChild(option);
        });

        // Libera a interface
        input.disabled = false;
        btnAdd.disabled = false;
        btnAdd.textContent = "Adicionar Relógio";
        input.placeholder = "Digite: Brasil, Japão, França...";

    } catch (error) {
        console.error("Erro no load:", error);
        btnAdd.textContent = "Erro ao carregar (Recarregue a página)";
        alert("Não foi possível carregar a lista de países. Verifique sua internet.");
    }

    renderClocks(); 
};

// --- FUNÇÕES CRUD ---

// 1. CREATE (Criar com nova API Open-Meteo)
async function handleAdd() {
    const input = document.getElementById('countryInput');
    const loading = document.getElementById('loading');
    const selectedName = input.value.trim();

    if (!selectedName) return alert('Digite um nome de país!');

    // Busca na nossa lista local
    const countryData = allCountriesList.find(c => c.namePT.toLowerCase() === selectedName.toLowerCase());

    if (!countryData) {
        return alert('País não encontrado. Selecione uma opção da lista que aparece ao digitar.');
    }

    loading.style.display = 'block';
    loading.innerText = `Buscando horário em ${countryData.capital}...`;

    try {
        const [lat, lng] = countryData.latlng;

        // --- MUDANÇA AQUI: Usando Open-Meteo (Mais estável) ---
        // Solicitamos apenas o timezone baseado na latitude/longitude
        const resTime = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`);
        
        if (!resTime.ok) throw new Error('Erro na API de Tempo');
        
        const dataTime = await resTime.json();
        
        // O Open-Meteo devolve o fuso exato no campo "timezone" (ex: "America/Sao_Paulo")
        const timeZoneIANA = dataTime.timezone; 

        const newClock = {
            id: Date.now(),
            name: countryData.namePT,
            capital: countryData.capital,
            timezoneId: timeZoneIANA 
        };

        clocks.push(newClock);
        saveAndRender();
        input.value = ''; 

    } catch (error) {