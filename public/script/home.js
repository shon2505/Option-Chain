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

    function formatToTwoDecimal(value) {
        return (parseFloat(value) || 0).toFixed(2);
    }

    // Call (CE) columns
    tr.appendChild(createCell(ce.tethaCE)); // Call Theta
    tr.appendChild(createCell(ce.deltaCE)); // Call Delta
    tr.appendChild(createCell(ce.openInterest)); // Call OI

    // "Chng in OI" without decimals
    tr.appendChild(createCell(
        Math.round(ce.changeinOpenInterest), // Round the Change in OI to nearest integer
        String(ce.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(ce.totalTradedVolume)); // Call Volume

    // IV with 0.00 decimal format
    tr.appendChild(createCell(formatToTwoDecimal(ce.impliedVolatilityCE))); // Call IV in 0.00 format
    tr.appendChild(createCell(formatToTwoDecimal(ce.lastPrice))); // Call LTP in 0.00 format

    // Call Change in 0.00 format
    tr.appendChild(createCell(
        formatToTwoDecimal(ce.change),
        String(ce.change || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(ce.ReversalCE));
    tr.appendChild(createCell(ce.strikePrice)); // Strike Price
    tr.appendChild(createCell(pe.ReversalPE));
    // Put (PE) columns in reversed order

    // Put Change in 0.00 format
    tr.appendChild(createCell(
        formatToTwoDecimal(pe.change),
        String(pe.change || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(formatToTwoDecimal(pe.lastPrice))); // Put LTP in 0.00 format

    // Put IV with 0.00 format
    tr.appendChild(createCell(formatToTwoDecimal(pe.impliedVolatilityPE))); // Put IV in 0.00 format

    tr.appendChild(createCell(pe.totalTradedVolume)); // Put Volume

    // Put "Chng in OI" without decimals
    tr.appendChild(createCell(
        Math.round(pe.changeinOpenInterest), // Round Change in OI to nearest integer
        String(pe.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(pe.openInterest)); // Put OI
    tr.appendChild(createCell(pe.deltaPE)); // Put Delta
    tr.appendChild(createCell(pe.tethaPE)); // Put Theta

    return tr;
}





function createCell(content) {
    const td = document.createElement('td');
    td.textContent = content || '-';
    td.style.fontSize = '12px'; // Reduce font size globally
    return td;
}

function formatToTwoDecimal(value) {
    return (parseFloat(value) || 0).toFixed(2);
}




// Helper functions
function createCell(content) {
    const td = document.createElement('td');
    td.textContent = content || '-';
    td.style.fontSize = '13px'; // Reduce font size globally
    return td;
}

function formatToTwoDecimal(value) {
    return (parseFloat(value) || 0).toFixed(2);
}




// Helper functions
function createCell(content) {
    const td = document.createElement('td');
    td.textContent = content || '-';
    td.style.fontSize = '12px'; // Reduce font size globally
    return td;
}

function formatToTwoDecimal(value) {
    return (parseFloat(value) || 0).toFixed(2);
}




// Helper functions
function createCell(content) {
    const td = document.createElement('td');
    td.textContent = content || '-';
    return td;
}

function formatToTwoDecimal(value) {
    return (parseFloat(value) || 0).toFixed(2);
}


// document.getElementById('logout-button').addEventListener('click', async () => {
//     await fetch('/logout', { method: 'POST' });
//     window.location.href = '/login';
// });

window.onload = fetchData;

// front end page will be refrshing every 10 second for now 
setInterval(fetchData, 10000);  
