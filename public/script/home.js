async function fetchData() {
    try {
        const response = await fetch('/api/v1/optionChain');
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        try {
            populateTable(data);
        } catch (err) {
            console.error("Error populating table:", err);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function createCell(content, className = '') {
    const td = document.createElement('td');
    td.textContent = content || '-';
    if (className) td.className = className;
    return td;
}

function formatCell(content) {
    return content ? String(content) : '-';
}

function createRow(ce = {}, pe = {}) {
    const tr = document.createElement('tr');
    // Call (CE) columns
    tr.appendChild(createCell(ce.openInterest)); // Call OI
    tr.appendChild(createCell(formatCell(ce.changeinOpenInterest), String(ce.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive'));
    tr.appendChild(createCell(ce.totalTradedVolume)); // Call Volume
    tr.appendChild(createCell(ce.impliedVolatility)); // Call IV
    tr.appendChild(createCell(ce.lastPrice)); // Call LTP
    tr.appendChild(createCell(formatCell(ce.change), String(ce.change || '').startsWith('-') ? 'negative' : 'positive')); // Call Change

    // Strike Price (common)
    tr.appendChild(createCell(ce.strikePrice)); // Strike Price

    // Put (PE) columns in reversed order
    tr.appendChild(createCell(formatCell(pe.change), String(pe.change || '').startsWith('-') ? 'negative' : 'positive')); // Put Change
    tr.appendChild(createCell(pe.lastPrice)); // Put LTP
    tr.appendChild(createCell(pe.impliedVolatility)); // Put IV
    tr.appendChild(createCell(pe.totalTradedVolume)); // Put Volume
    tr.appendChild(createCell(formatCell(pe.changeinOpenInterest), String(pe.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive')); // Put Change in OI
    tr.appendChild(createCell(pe.openInterest)); // Put OI

    return tr;
}

function populateTable(data) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = ''; // Clear the existing table rows

    let i = 0;
    data.forEach(e => {
        i++;
        const row = createRow(e.CE, e.PE);
        tbody.appendChild(row);

        // Insert a new header row between the 10th and 11th rows
        if (i === 10) {
            const headerRow = document.createElement('tr');
            const ceHeader = document.createElement('th');
            ceHeader.colSpan = 6;
            ceHeader.textContent = 'CE';

            const spotPriceHeader = document.createElement('th');
            spotPriceHeader.textContent = 'Spot Price';

            const peHeader = document.createElement('th');
            peHeader.colSpan = 6;
            peHeader.textContent = 'PE';

            headerRow.appendChild(ceHeader);
            headerRow.appendChild(spotPriceHeader);
            headerRow.appendChild(peHeader);

            tbody.appendChild(headerRow); // Insert the new row
        }
    });
}

document.getElementById('logout-button').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/login';
});

window.onload = fetchData;
setInterval(fetchData, 1000);  // Fetch data every 5 seconds
