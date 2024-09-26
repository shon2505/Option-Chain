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

    // Helper function to format numbers to 0.00 format
    function formatToTwoDecimal(value) {
        return (parseFloat(value) || 0).toFixed(2);
    }

    // Call (CE) columns
    tr.appendChild(createCell(ce.Theta)); // Call Theta
    tr.appendChild(createCell(ce.Delta)); // Call Delta
    tr.appendChild(createCell(ce.openInterest)); // Call OI

    // "Chng in OI" without decimals
    tr.appendChild(createCell(
        Math.round(ce.changeinOpenInterest), // Round the Change in OI to nearest integer
        String(ce.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(ce.totalTradedVolume)); // Call Volume

    // IV with 0.00 decimal format
    tr.appendChild(createCell(formatToTwoDecimal(ce.impliedVolatility))); // Call IV in 0.00 format
    tr.appendChild(createCell(formatToTwoDecimal(ce.lastPrice))); // Call LTP in 0.00 format

    // Call Change in 0.00 format
    tr.appendChild(createCell(
        formatToTwoDecimal(ce.change),
        String(ce.change || '').startsWith('-') ? 'negative' : 'positive'
    ));

    // Strike Price (common)
    tr.appendChild(createCell(ce.strikePrice)); // Strike Price

    // Put (PE) columns in reversed order

    // Put Change in 0.00 format
    tr.appendChild(createCell(
        formatToTwoDecimal(pe.change),
        String(pe.change || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(formatToTwoDecimal(pe.lastPrice))); // Put LTP in 0.00 format

    // Put IV with 0.00 format
    tr.appendChild(createCell(formatToTwoDecimal(pe.impliedVolatility))); // Put IV in 0.00 format

    tr.appendChild(createCell(pe.totalTradedVolume)); // Put Volume

    // Put "Chng in OI" without decimals
    tr.appendChild(createCell(
        Math.round(pe.changeinOpenInterest), // Round Change in OI to nearest integer
        String(pe.changeinOpenInterest || '').startsWith('-') ? 'negative' : 'positive'
    ));

    tr.appendChild(createCell(pe.openInterest)); // Put OI
    tr.appendChild(createCell(pe.Delta)); // Put Delta
    tr.appendChild(createCell(pe.Theta)); // Put Theta

    return tr;
}


function populateTable(data) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = ''; // Clear the existing table rows

    // Sort the data by strike price in descending order
    data.sort((a, b) => {
        if (a.CE && b.CE) {
            return b.CE.strikePrice - a.CE.strikePrice;
        }
        return 0;  // Default if there's no CE data
    });

    let highestCallOI = 0, secondHighestCallOI = 0;
    let highestCallOIChange = 0, secondHighestCallOIChange = 0;
    let highestCallVolume = 0, secondHighestCallVolume = 0;
    let highestPutOI = 0, secondHighestPutOI = 0;
    let highestPutOIChange = 0, secondHighestPutOIChange = 0;
    let highestPutVolume = 0, secondHighestPutVolume = 0;
    let spotPrice = ''; // Store the spot price

    // First pass: Find the highest and second-highest values for Call (CE) and Put (PE)
    data.forEach(entry => {
        if (entry.CE) {
            // Track highest and second-highest Call OI
            if (entry.CE.openInterest > highestCallOI) {
                secondHighestCallOI = highestCallOI;
                highestCallOI = entry.CE.openInterest;
            } else if (entry.CE.openInterest > secondHighestCallOI) {
                secondHighestCallOI = entry.CE.openInterest;
            }

            // Track highest and second-highest Call OI Change
            if (entry.CE.changeinOpenInterest > highestCallOIChange) {
                secondHighestCallOIChange = highestCallOIChange;
                highestCallOIChange = entry.CE.changeinOpenInterest;
            } else if (entry.CE.changeinOpenInterest > secondHighestCallOIChange) {
                secondHighestCallOIChange = entry.CE.changeinOpenInterest;
            }

            // Track highest and second-highest Call Volume
            if (entry.CE.totalTradedVolume > highestCallVolume) {
                secondHighestCallVolume = highestCallVolume;
                highestCallVolume = entry.CE.totalTradedVolume;
            } else if (entry.CE.totalTradedVolume > secondHighestCallVolume) {
                secondHighestCallVolume = entry.CE.totalTradedVolume;
            }

            spotPrice = entry.CE.underlyingValue;  // Spot price from CE
        }

        if (entry.PE) {
            // Track highest and second-highest Put OI
            if (entry.PE.openInterest > highestPutOI) {
                secondHighestPutOI = highestPutOI;
                highestPutOI = entry.PE.openInterest;
            } else if (entry.PE.openInterest > secondHighestPutOI) {
                secondHighestPutOI = entry.PE.openInterest;
            }

            // Track highest and second-highest Put OI Change
            if (entry.PE.changeinOpenInterest > highestPutOIChange) {
                secondHighestPutOIChange = highestPutOIChange;
                highestPutOIChange = entry.PE.changeinOpenInterest;
            } else if (entry.PE.changeinOpenInterest > secondHighestPutOIChange) {
                secondHighestPutOIChange = entry.PE.changeinOpenInterest;
            }

            // Track highest and second-highest Put Volume
            if (entry.PE.totalTradedVolume > highestPutVolume) {
                secondHighestPutVolume = highestPutVolume;
                highestPutVolume = entry.PE.totalTradedVolume;
            } else if (entry.PE.totalTradedVolume > secondHighestPutVolume) {
                secondHighestPutVolume = entry.PE.totalTradedVolume;
            }
        }
    });

    // Helper function to create styled cells with two values
    function createStyledCell(mainValue, secondaryValue, isHighlighted, isSecondHighest, bgColor = '', fontColor = 'black', isNegative = false) {
        const td = document.createElement('td');
        td.style.fontSize = '12px'; // Adjust font size globally

        const valueDiv = document.createElement('div');
        valueDiv.textContent = mainValue || '-';
        valueDiv.style.fontWeight = 'bold'; 
        td.appendChild(valueDiv);

        if (secondaryValue !== null) {
            const secondaryDiv = document.createElement('div');
            secondaryDiv.textContent = `(${secondaryValue})`;
            secondaryDiv.style.fontSize = 'smaller';
            secondaryDiv.style.marginTop = '4px'; 
            td.appendChild(secondaryDiv);
        }

        if (isNegative) {
            td.style.color = 'brown';
            td.style.fontWeight = 'bold';
        } else if (isHighlighted) {
            td.style.backgroundColor = bgColor;
            td.style.color = fontColor;
            td.style.fontWeight = 'bold';
        } else if (isSecondHighest) {
            td.style.backgroundColor = '#ffff80';
            td.style.color = '#ff0066';
            td.style.fontWeight = 'bold';
        }

        return td;
    }

    // Second pass: Create rows and insert the Spot Price header after the 10th row
    data.forEach((entry, i) => {
        const tr = document.createElement('tr');

        function calculatePercentage(value, maxValue) {
            return ((value / maxValue) * 100).toFixed(2);
        }

        // Call Theta
        tr.appendChild(createCell(formatToTwoDecimal(entry.CE?.theta))); 

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.CE?.impliedVolatility), 
            formatToTwoDecimal(entry.CE?.delta),
            false, 
            false 
        ));

        tr.appendChild(createStyledCell(
            Math.round(entry.CE?.changeinOpenInterest),
            `${calculatePercentage(entry.CE?.changeinOpenInterest, highestCallOIChange)}%`,
            entry.CE?.changeinOpenInterest === highestCallOIChange,
            entry.CE?.changeinOpenInterest === secondHighestCallOIChange,
            '#ff0066', 
            entry.CE?.changeinOpenInterest < 0 ? 'brown' : 'yellow',
            entry.CE?.changeinOpenInterest < 0  // Check if the value is negative
        ));

        tr.appendChild(createStyledCell(
            entry.CE?.openInterest,
            `${calculatePercentage(entry.CE?.openInterest, highestCallOI)}%`,
            entry.CE?.openInterest === highestCallOI,
            entry.CE?.openInterest === secondHighestCallOI,
            '#ff0066', 
            'yellow' 
        ));

        tr.appendChild(createStyledCell(
            entry.CE?.totalTradedVolume,
            `${calculatePercentage(entry.CE?.totalTradedVolume, highestCallVolume)}%`,
            entry.CE?.totalTradedVolume === highestCallVolume,
            entry.CE?.totalTradedVolume === secondHighestCallVolume,
            '#ff0066', 
            'yellow' 
        ));

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.CE?.lastPrice), 
            formatToTwoDecimal(entry.CE?.change),
            false, 
            false 
        ));

        tr.appendChild(createCell(0)); 
        tr.appendChild(createCell(entry.CE?.strikePrice)); 

        tr.appendChild(createCell(0)); 

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.PE?.lastPrice), 
            formatToTwoDecimal(entry.PE?.change),
            false, 
            false 
        ));

        tr.appendChild(createStyledCell(
            entry.PE?.totalTradedVolume,
            `${calculatePercentage(entry.PE?.totalTradedVolume, highestPutVolume)}%`,
            entry.PE?.totalTradedVolume === highestPutVolume,
            entry.PE?.totalTradedVolume === secondHighestPutVolume,
            '#00cc00', 
            'yellow' 
        ));

        tr.appendChild(createStyledCell(
            entry.PE?.openInterest,
            `${calculatePercentage(entry.PE?.openInterest, highestPutOI)}%`,
            entry.PE?.openInterest === highestPutOI,
            entry.PE?.openInterest === secondHighestPutOI,
            '#00cc00', 
            'yellow' 
        ));

        tr.appendChild(createStyledCell(
            Math.round(entry.PE?.changeinOpenInterest),
            `${calculatePercentage(entry.PE?.changeinOpenInterest, highestPutOIChange)}%`,
            entry.PE?.changeinOpenInterest === highestPutOIChange,
            entry.PE?.changeinOpenInterest === secondHighestPutOIChange,
            '#00cc00', 
            entry.PE?.changeinOpenInterest < 0 ? 'brown' : 'yellow',
            entry.PE?.changeinOpenInterest < 0  // Check if the value is negative
        ));

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.PE?.impliedVolatility), 
            formatToTwoDecimal(entry.PE?.delta),
            false, 
            false 
        ));

        tr.appendChild(createCell(formatToTwoDecimal(entry.PE?.theta))); 

        tbody.appendChild(tr); 

        // Insert the Spot Price header row after the 10th entry
        if (i === 9) {
            const headerRow = document.createElement('tr');
            const ceHeader = document.createElement('th');
            ceHeader.colSpan = 7;
            ceHeader.textContent = 'CE';

            const spotPriceHeader = document.createElement('th');
            spotPriceHeader.textContent = `${spotPrice || 'N/A'}`;

            const peHeader = document.createElement('th');
            peHeader.colSpan = 7;
            peHeader.textContent = 'PE';

            headerRow.appendChild(ceHeader);
            headerRow.appendChild(spotPriceHeader); 
            headerRow.appendChild(peHeader);

            tbody.appendChild(headerRow);
        }
    });
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


document.getElementById('logout-button').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/login';
});

window.onload = fetchData;

// front end page will be refrshing every 10 second for now 
setInterval(fetchData, 10000);  
