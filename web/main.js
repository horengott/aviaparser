const calendarHeader = document.getElementById('calendarHeader');
const calendarBody = document.getElementById('calendarBody');
const destFilter = document.getElementById('destFilter');
const priceFilter = document.getElementById('priceFilter');
const companyFilter = document.getElementById('companyFilter');

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
let flightsData = [];

const iataCodes = {
    "Londres": "LON", "París": "PAR", "Roma": "ROM", "Berlín": "BER", "Ámsterdam": "AMS"
};

async function init() {
    generateDates();
    destFilter.addEventListener('change', loadFlightsFromServer);
    priceFilter.addEventListener('input', renderCalendar);
    companyFilter.addEventListener('input', renderCalendar);
    await loadFlightsFromServer();
}

async function loadFlightsFromServer() {
    const destinationName = destFilter.value;
    const iataCode = iataCodes[destinationName];

    if (!iataCode) {
        calendarBody.innerHTML = '<div style="padding: 24px;">Selecciona un destino:</div>';
        return;
    }

    try {
        calendarBody.innerHTML = '<div style="padding: 24px;">Buscando vuelos en tiempo real...</div>';
        const response = await fetch(`http://127.0.0.1:8000/api/flights?destination=${iataCode}`);
        flightsData = await response.json();
        renderCalendar();
    } catch (error) {
        calendarBody.innerHTML = '<div style="padding: 24px; color: #f87171;">no se ha podido conectarse al servidor.</div>';
    }
}

function generateDates() {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const div = document.createElement('div');
        div.className = 'day-cell-header';
        div.innerHTML = `
            <div class="day-name">${i === 0 ? 'Hoy' : days[date.getDay()]}</div>
            <div class="day-date">${date.getDate()}/${date.getMonth() + 1}</div>
        `;
        calendarHeader.appendChild(div);
    }
}

function renderCalendar() {
    calendarBody.innerHTML = '';
    const maxPrice = parseInt(priceFilter.value);
    const selectedCompany = companyFilter.value;

    for (let h = 0; h < 24; h++) {
        const row = document.createElement('div');
        row.className = 'hour-row';
        
        const timeCell = document.createElement('div');
        timeCell.className = 'time-cell';
        timeCell.textContent = `${h.toString().padStart(2, '0')}:00`;
        row.appendChild(timeCell);

        for (let d = 0; d < 7; d++) {
            const slot = document.createElement('div');
            slot.className = 'day-slot';

            const matches = flightsData.filter(f => 
                f.dayOffset === d && 
                f.hour === h &&
                (f.price <= maxPrice) &&
                (selectedCompany === 'Todas' || f.company === selectedCompany)
            );

            matches.forEach(f => {
                const el = document.createElement('div');
                let colorClass = 'price-high';
                if (f.price < 60) colorClass = 'price-low';
                else if (f.price < 120) colorClass = 'price-med';

                el.className = `flight-tag ${colorClass}`;
                el.innerHTML = `
                    <div class="flight-tag-header">
                        <span class="flight-dest">${destFilter.value}</span>
                        <span class="flight-price">${f.price}€</span>
                    </div>
                    <div class="flight-company">${f.company}</div>
                `;
                slot.appendChild(el);
            });
            row.appendChild(slot);
        }
        calendarBody.appendChild(row);
    }
}

init();