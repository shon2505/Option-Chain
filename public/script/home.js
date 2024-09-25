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

    // Variables to store the highest and second-highest values
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
            // Find highest and second-highest for Call OI
            if (entry.CE.openInterest > highestCallOI) {
                secondHighestCallOI = highestCallOI;
                highestCallOI = entry.CE.openInterest;
            } else if (entry.CE.openInterest > secondHighestCallOI) {
                secondHighestCallOI = entry.CE.openInterest;
            }

            // Find highest and second-highest for Call OI Change
            if (entry.CE.changeinOpenInterest > highestCallOIChange) {
                secondHighestCallOIChange = highestCallOIChange;
                highestCallOIChange = entry.CE.changeinOpenInterest;
            } else if (entry.CE.changeinOpenInterest > secondHighestCallOIChange) {
                secondHighestCallOIChange = entry.CE.changeinOpenInterest;
            }

            // Find highest and second-highest for Call Volume
            if (entry.CE.totalTradedVolume > highestCallVolume) {
                secondHighestCallVolume = highestCallVolume;
                highestCallVolume = entry.CE.totalTradedVolume;
            } else if (entry.CE.totalTradedVolume > secondHighestCallVolume) {
                secondHighestCallVolume = entry.CE.totalTradedVolume;
            }

            spotPrice = entry.CE.underlyingValue;  // Spot price from CE
        }

        if (entry.PE) {
            // Find highest and second-highest for Put OI
            if (entry.PE.openInterest > highestPutOI) {
                secondHighestPutOI = highestPutOI;
                highestPutOI = entry.PE.openInterest;
            } else if (entry.PE.openInterest > secondHighestPutOI) {
                secondHighestPutOI = entry.PE.openInterest;
            }

            // Find highest and second-highest for Put OI Change
            if (entry.PE.changeinOpenInterest > highestPutOIChange) {
                secondHighestPutOIChange = highestPutOIChange;
                highestPutOIChange = entry.PE.changeinOpenInterest;
            } else if (entry.PE.changeinOpenInterest > secondHighestPutOIChange) {
                secondHighestPutOIChange = entry.PE.changeinOpenInterest;
            }

            // Find highest and second-highest for Put Volume
            if (entry.PE.totalTradedVolume > highestPutVolume) {
                secondHighestPutVolume = highestPutVolume;
                highestPutVolume = entry.PE.totalTradedVolume;
            } else if (entry.PE.totalTradedVolume > secondHighestPutVolume) {
                secondHighestPutVolume = entry.PE.totalTradedVolume;
            }
        }
    });

    // Helper function to create styled cells with value and percentage, text color, and highlighting
    function createStyledCell(mainValue, isHighlighted, isSecondHighest, bgColor = '', fontColor = 'black', percentage = null) {
        const td = document.createElement('td');
        td.style.fontSize = '12px'; // Reduce font size to fit on the screen

        // Create a div for the value
        const valueDiv = document.createElement('div');
        valueDiv.textContent = mainValue || '-';

        // Create a div for the percentage below the value
        if (percentage !== null) {
            const percentageDiv = document.createElement('div');
            percentageDiv.textContent = `(${percentage.toFixed(2)}%)`;
            percentageDiv.style.fontSize = 'smaller';
            td.appendChild(percentageDiv); // Append the percentage below the main value
        }

        td.appendChild(valueDiv); // Append value first

        // Apply styling for the highest and second-highest values
        if (isHighlighted) {
            td.style.backgroundColor = bgColor;
            td.style.color = fontColor;
            td.style.fontWeight = 'bold';
        } else if (isSecondHighest) {
            td.style.backgroundColor = '#ffff80'; // Light yellow for second highest
            td.style.color = '#ff0066'; // Red text for second highest
            td.style.fontWeight = 'bold';
        }

        return td;
    }

    // Second pass: Create rows and apply styles based on the highest and second-highest values
    let i = 0;
    data.forEach(entry => {
        i++;
        const tr = document.createElement('tr');

        // Call (CE) Theta and Delta
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.CE?.theta), false, false)); // Call Theta
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.CE?.delta), false, false)); // Call Delta

        // Call (CE) Change in Open Interest
        tr.appendChild(createStyledCell(
            Math.round(entry.CE?.changeinOpenInterest),
            entry.CE?.changeinOpenInterest === highestCallOIChange,
            entry.CE?.changeinOpenInterest === secondHighestCallOIChange,
            '#ff0066', // Red background for highest
            entry.CE?.changeinOpenInterest < 0 ? 'brown' : 'yellow', // Brown text for negative values
            (entry.CE?.changeinOpenInterest / highestCallOIChange) * 100 // Percentage for OI change
        ));

        // Call (CE) Open Interest
        tr.appendChild(createStyledCell(
            entry.CE?.openInterest,
            entry.CE?.openInterest === highestCallOI,
            entry.CE?.openInterest === secondHighestCallOI,
            '#ff0066', // Red background for highest
            'yellow', // Yellow text for highest
            (entry.CE?.openInterest / highestCallOI) * 100 // Percentage for OI
        ));

        // Call (CE) Volume
        tr.appendChild(createStyledCell(
            entry.CE?.totalTradedVolume,
            entry.CE?.totalTradedVolume === highestCallVolume,
            entry.CE?.totalTradedVolume === secondHighestCallVolume,
            '#ff0066', // Red background for highest
            'yellow', // Yellow text for highest
            (entry.CE?.totalTradedVolume / highestCallVolume) * 100 // Percentage for volume
        ));

        // Call (CE) IV, Last Price, and Price Change with color coding for price change
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.CE?.impliedVolatility), false, false)); // Call IV
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.CE?.lastPrice), false, false)); // Call Last Price
        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.CE?.change),
            false, false,
            '',
            entry.CE?.change > 0 ? 'green' : 'brown' // Green for positive, brown for negative price change
        )); // Call Price Change

        // Strike Price (shared between CE and PE)
        tr.appendChild(createStyledCell(entry.CE?.strikePrice, false, false)); // Strike Price

        // Put (PE) Price Change, Last Price, IV
        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.PE?.change),
            false, false,
            '',
            entry.PE?.change > 0 ? 'green' : 'brown' // Green for positive, brown for negative price change
        )); // Put Price Change
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.PE?.lastPrice), false, false)); // Put Last Price
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.PE?.impliedVolatility), false, false)); // Put IV

        // Put (PE) Volume
        tr.appendChild(createStyledCell(
            entry.PE?.totalTradedVolume,
            entry.PE?.totalTradedVolume === highestPutVolume,
            entry.PE?.totalTradedVolume === secondHighestPutVolume,
            '#00cc00', // Green background for highest
            'yellow', // Yellow text for highest
            (entry.PE?.totalTradedVolume / highestPutVolume) * 100 // Percentage for volume
        ));

        // Put (PE) Open Interest
        tr.appendChild(createStyledCell(
            entry.PE?.openInterest,
            entry.PE?.openInterest === highestPutOI,
            entry.PE?.openInterest === secondHighestPutOI,
            '#00cc00', // Green background for highest
            'yellow', // Yellow text for highest
            (entry.PE?.openInterest / highestPutOI) * 100 // Percentage for OI
        ));

        // Put (PE) Change in Open Interest
        tr.appendChild(createStyledCell(
            Math.round(entry.PE?.changeinOpenInterest),
            entry.PE?.changeinOpenInterest === highestPutOIChange,
            entry.PE?.changeinOpenInterest === secondHighestPutOIChange,
            '#00cc00', // Green background for highest
            entry.PE?.changeinOpenInterest < 0 ? 'brown' : 'yellow', // Brown text for negative values
            (entry.PE?.changeinOpenInterest / highestPutOIChange) * 100 // Percentage for OI change
        ));

        // Put (PE) Delta and Theta
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.PE?.delta), false, false)); // Put Delta
        tr.appendChild(createStyledCell(formatToTwoDecimal(entry.PE?.theta), false, false)); // Put Theta

        // Append the row to the table
        tbody.appendChild(tr);

        // Insert the Spot Price header row after the 10th entry
        if (i === 10) {
            const headerRow = document.createElement('tr');
            const ceHeader = document.createElement('th');
            ceHeader.colSpan = 8;
            ceHeader.textContent = 'CE';

            const spotPriceHeader = document.createElement('th');
            spotPriceHeader.textContent = `${spotPrice || 'N/A'}`;

            const peHeader = document.createElement('th');
            peHeader.colSpan = 8;
            peHeader.textContent = 'PE';

            headerRow.appendChild(ceHeader);
            headerRow.appendChild(spotPriceHeader); // Display the Spot Price in the center
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
