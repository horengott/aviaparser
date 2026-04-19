const calendarHeader = document.getElementById('calendarHeader');
const calendarBody = document.getElementById('calendarBody');
const destFilter = document.getElementById('destFilter');
const priceFilter = document.getElementById('priceFilter');
const companyFilter = document.getElementById('companyFilter');

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const destinations = ['Londres', 'París', 'Roma', 'Berlín', 'Ámsterdam'];
const companies = ['Iberia', 'Ryanair', 'Vueling', 'Lufthansa'];

let flightsData = [];

function init() {
    generateDates();
    generateMockData();
    render();
    
    [destFilter, priceFilter, companyFilter].forEach(el => {
        el.addEventListener('input', render);
    });
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

function generateMockData() {
    for (let i = 0; i < 100; i++) {
        flightsData.push({
            dayOffset: Math.floor(Math.random() * 7),
            hour: Math.floor(Math.random() * 24),
            dest: destinations[Math.floor(Math.random() * destinations.length)],
            company: companies[Math.floor(Math.random() * companies.length)],
            price: Math.floor(Math.random() * 450) + 20
        });
    }
}

function render() {
    calendarBody.innerHTML = '';
    
    const fDest = destFilter.value;
    const fPrice = parseInt(priceFilter.value);
    const fComp = companyFilter.value;

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
                (fDest === 'Todos' || f.dest === fDest) &&
                (f.price <= fPrice) &&
                (fComp === 'Todas' || f.company === fComp)
            );

            matches.forEach(f => {
                const el = document.createElement('div');
                let colorClass = 'price-high';
                if (f.price < 100) colorClass = 'price-low';
                else if (f.price < 250) colorClass = 'price-med';

                el.className = `flight-tag ${colorClass}`;
                el.innerHTML = `
                    <div class="flight-tag-header">
                        <span class="flight-dest">${f.dest}</span>
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