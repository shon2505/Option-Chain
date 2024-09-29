function populateTable(data) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = '';


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
    function createStyledCell(mainValue, secondaryValue, isHighlighted, isSecondHighest, percentage, bgColor = '', fontColor = 'black', isNegative = false) {
        const td = document.createElement('td');
        td.style.fontSize = '13px'; // Adjust font size globally

        const valueDiv = document.createElement('div');
        valueDiv.textContent = mainValue || '-';
        valueDiv.style.fontWeight = 'bold';
        td.appendChild(valueDiv);

        if (secondaryValue !== null) {
            const secondaryDiv = document.createElement('div');
            secondaryDiv.textContent = `(${secondaryValue})`;
            secondaryDiv.style.fontSize = '13px';
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
        } else if (isSecondHighest && percentage > 75) {
            // Apply formatting only if the percentage is > 75%
            td.style.backgroundColor = '#ffff80';
            td.style.color = '#ff0066';
            td.style.fontWeight = 'bold';
        }

        return td;
    }

    // Helper function to calculate percentage
    function calculatePercentage(value, maxValue) {
        return ((value / maxValue) * 100).toFixed(2);
    }

    // Second pass: Create rows and insert the Spot Price header after the 10th row


    let rightColor = "light-green";
    let leftColor = "light-red";
    data.forEach((entry, i) => {
        const tr = document.createElement('tr');

        // Call Theta
        tr.appendChild(createCell(formatToTwoDecimal(entry.CE?.thetaCE)));

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
            calculatePercentage(entry.CE?.changeinOpenInterest, highestCallOIChange), // Pass percentage here
            '#ff0066',
            entry.CE?.changeinOpenInterest < 0 ? 'brown' : 'White',
            entry.CE?.changeinOpenInterest < 0
        ));

        tr.appendChild(createStyledCell(
            entry.CE?.openInterest,
            `${calculatePercentage(entry.CE?.openInterest, highestCallOI)}%`,
            entry.CE?.openInterest === highestCallOI,
            entry.CE?.openInterest === secondHighestCallOI,
            calculatePercentage(entry.CE?.openInterest, highestCallOI), // Pass percentage here
            '#ff0066',
            'White'
        ));

        tr.appendChild(createStyledCell(
            entry.CE?.totalTradedVolume,
            `${calculatePercentage(entry.CE?.totalTradedVolume, highestCallVolume)}%`,
            entry.CE?.totalTradedVolume === highestCallVolume,
            entry.CE?.totalTradedVolume === secondHighestCallVolume,
            calculatePercentage(entry.CE?.totalTradedVolume, highestCallVolume), // Pass percentage here
            '#ff0066',
            'White'
        ));

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.CE?.lastPrice),
            formatToTwoDecimal(entry.CE?.change),
            false,
            false
        ));
        // Calculate Reversal Values (Call and Put)


        tr.appendChild(createCell(entry.CE.ReversalCE));
        console.log(entry.CE.ReversalCE);
        // Placeholder for Reversal (Call)
        tr.appendChild(createCell(entry.CE?.strikePrice)); // Strike Price
        tr.appendChild(createCell(entry.PE.ReversalPE)); // Placeholder for Reversal (Put)

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
            calculatePercentage(entry.PE?.totalTradedVolume, highestPutVolume), // Pass percentage here
            '#00cc00',
            'White'
        ));

        tr.appendChild(createStyledCell(
            entry.PE?.openInterest,
            `${calculatePercentage(entry.PE?.openInterest, highestPutOI)}%`,
            entry.PE?.openInterest === highestPutOI,
            entry.PE?.openInterest === secondHighestPutOI,
            calculatePercentage(entry.PE?.openInterest, highestPutOI), // Pass percentage here
            '#00cc00',
            'White'
        ));

        tr.appendChild(createStyledCell(
            Math.round(entry.PE?.changeinOpenInterest),
            `${calculatePercentage(entry.PE?.changeinOpenInterest, highestPutOIChange)}%`,
            entry.PE?.changeinOpenInterest === highestPutOIChange,
            entry.PE?.changeinOpenInterest === secondHighestPutOIChange,
            calculatePercentage(entry.PE?.changeinOpenInterest, highestPutOIChange), // Pass percentage here
            '#00cc00',
            entry.PE?.changeinOpenInterest < 0 ? 'brown' : 'White',
            entry.PE?.changeinOpenInterest < 0
        ));

        tr.appendChild(createStyledCell(
            formatToTwoDecimal(entry.PE?.impliedVolatility),
            formatToTwoDecimal(entry.PE?.delta),
            false,
            false
        ));

        tr.appendChild(createCell(formatToTwoDecimal(entry.PE?.thetaPE)));

        tbody.appendChild(tr);

        // Insert the Spot Price header row after the 10th entry
        if (i === 10) {
            const headerRow = document.createElement('tr');

            // Initialize variables for highest and second-highest volumes and OI
            let highestCallVolumeStrike = null;
            let secondHighestCallVolumeStrike = null;
            let highestCallVolume = 0;
            let secondHighestCallVolume = 0;

            let highestCallOIStrike = null;
            let secondHighestCallOIStrike = null;
            let highestCallOI = 0;
            let secondHighestCallOI = 0;

            let highestPutVolumeStrike = null;
            let secondHighestPutVolumeStrike = null;
            let highestPutVolume = 0;
            let secondHighestPutVolume = 0;

            let highestPutOIStrike = null;
            let secondHighestPutOIStrike = null;
            let highestPutOI = 0;
            let secondHighestPutOI = 0;

            // First pass: Find highest and second-highest values for Call Volume, Call OI, Put Volume, and Put OI
            data.forEach(entry => {
                if (entry.CE) {
                    // Call Volume
                    if (entry.CE.totalTradedVolume > highestCallVolume) {
                        secondHighestCallVolume = highestCallVolume;
                        secondHighestCallVolumeStrike = highestCallVolumeStrike;

                        highestCallVolume = entry.CE.totalTradedVolume;
                        highestCallVolumeStrike = entry.CE.strikePrice;
                    } else if (entry.CE.totalTradedVolume > secondHighestCallVolume) {
                        secondHighestCallVolume = entry.CE.totalTradedVolume;
                        secondHighestCallVolumeStrike = entry.CE.strikePrice;
                    }

                    // Call OI
                    if (entry.CE.openInterest > highestCallOI) {
                        secondHighestCallOI = highestCallOI;
                        secondHighestCallOIStrike = highestCallOIStrike;

                        highestCallOI = entry.CE.openInterest;
                        highestCallOIStrike = entry.CE.strikePrice;
                    } else if (entry.CE.openInterest > secondHighestCallOI) {
                        secondHighestCallOI = entry.CE.openInterest;
                        secondHighestCallOIStrike = entry.CE.strikePrice;
                    }
                }

                if (entry.PE) {
                    // Put Volume
                    if (entry.PE.totalTradedVolume > highestPutVolume) {
                        secondHighestPutVolume = highestPutVolume;
                        secondHighestPutVolumeStrike = highestPutVolumeStrike;

                        highestPutVolume = entry.PE.totalTradedVolume;
                        highestPutVolumeStrike = entry.PE.strikePrice;
                    } else if (entry.PE.totalTradedVolume > secondHighestPutVolume) {
                        secondHighestPutVolume = entry.PE.totalTradedVolume;
                        secondHighestPutVolumeStrike = entry.PE.strikePrice;
                    }

                    // Put OI
                    if (entry.PE.openInterest > highestPutOI) {
                        secondHighestPutOI = highestPutOI;
                        secondHighestPutOIStrike = highestPutOIStrike;

                        highestPutOI = entry.PE.openInterest;
                        highestPutOIStrike = entry.PE.strikePrice;
                    } else if (entry.PE.openInterest > secondHighestPutOI) {
                        secondHighestPutOI = entry.PE.openInterest;
                        secondHighestPutOIStrike = entry.PE.strikePrice;
                    }
                }
            });

            // Logic for decision-making based on trends
            const callTrend = secondHighestCallOI > 0.75 * highestCallOI ? (secondHighestCallOIStrike > highestCallOIStrike ? 'Bullish' : 'Bearish') : 'Strong';
            const putTrend = secondHighestPutOI > 0.75 * highestPutOI ? (secondHighestPutOIStrike > highestPutOIStrike ? 'Bullish' : 'Bearish') : 'Strong';

            let decision = '';
            let callDecision = '';
            let putDecision = '';

            // Apply decision-making logic
            if (callTrend === 'Strong' && putTrend === 'Strong') {
                decision = "Buy CE from EOS and buy PE from EOR";
                callDecision = "CE (Call) Buying Trade Preferred";
                putDecision = "PE (Put) Buying Trade Preferred";
            } else if (callTrend === 'Strong' && putTrend === 'Bearish') {
                decision = "Buy PE from EOR/ Diversion";
                putDecision = "PE (Put) Buying Trade Preferred";
                callDecision = "No Call Buying Trade";
            } else if (callTrend === 'Strong' && putTrend === 'Bullish') {
                decision = "Buy CE from EOS/ Diversion";
                callDecision = "CE (Call) Buying Trade Preferred";
                putDecision = "No Put Buying Trade";
            } else if (callTrend === 'Bearish' && putTrend === 'Strong') {
                decision = "Buy PE from EOR/ Diversion";
                putDecision = "PE (Put) Buying Trade Preferred";
                callDecision = "No Call Buying Trade";
            } else if (callTrend === 'Bullish' && putTrend === 'Strong') {
                decision = "Buy CE from EOS/ Diversion";
                callDecision = "CE (Call) Buying Trade Preferred";
                putDecision = "No Put Buying Trade";
            } else if (callTrend === 'Bearish' && putTrend === 'Bearish') {
                decision = "Buy PE from EOR/ Diversion";
                putDecision = "PE (Put) Buying Trade Preferred";
                callDecision = "No Call Buying Trade";
            } else if (callTrend === 'Bullish' && putTrend === 'Bullish') {
                decision = "Buy CE from EOS/ Diversion";
                callDecision = "CE (Call) Buying Trade Preferred";
                putDecision = "No Put Buying Trade";
            } else if (callTrend === 'Bullish' && putTrend === 'Bearish') {
                decision = "No Trade";
                callDecision = "No Call Buying Trade";
                putDecision = "No Put Buying Trade";
            } else if (callTrend === 'Bearish' && putTrend === 'Bullish') {
                decision = "No Trade";
                callDecision = "No Call Buying Trade";
                putDecision = "No Put Buying Trade";
            } else {
                decision = "Wait for Preferred Trade";
                callDecision = "Wait for Preferred Trade";
                putDecision = "Wait for Preferred Trade";
            }

            // Merge CE Dummy 1, 2, and 3
            const ceCell1_3 = document.createElement('td');
            ceCell1_3.colSpan = 3;
            ceCell1_3.textContent = callDecision;
            ceCell1_3.style.fontWeight = 'bold';

            // Apply styles based on the signal for Call decision
            if (callDecision.includes("CE (Call) Buying Trade Preferred")) {
                ceCell1_3.style.backgroundColor = 'green'; // Green BG
                ceCell1_3.style.color = 'white'; // White text
            } else if (callDecision.includes("No Call Buying Trade")) {
                ceCell1_3.style.backgroundColor = 'gray'; // Gray BG
                ceCell1_3.style.color = 'black'; // Black text
            } else if (callDecision.includes("Wait for Preferred Trade")) {
                ceCell1_3.style.backgroundColor = '#A05544'; // Deep Amber BG
                ceCell1_3.style.color = 'white'; // White text
            }

            headerRow.appendChild(ceCell1_3);

            // CE Dummy 4 (Call OI logic with wide-headed arrows)
            const ceCell4 = document.createElement('td');
            if (secondHighestCallOI > 0.75 * highestCallOI) {
                if (secondHighestCallOIStrike > highestCallOIStrike) {
                    ceCell4.innerHTML = "Call OI - Bullish 🡅";  // Wide-Headed Upwards Arrow
                    ceCell4.style.color = 'green';
                    ceCell4.style.fontWeight = 'bold';
                } else if (secondHighestCallOIStrike < highestCallOIStrike) {
                    ceCell4.innerHTML = "OI - Bearish 🡇";  // Wide-Headed Downwards Arrow
                    ceCell4.style.color = 'red';
                    ceCell4.style.fontWeight = 'bold';
                }
            } else {
                ceCell4.innerHTML = "OI - Strong";
                ceCell4.style.color = 'brown';
                ceCell4.style.fontWeight = 'bold';
            }
            headerRow.appendChild(ceCell4);

            // CE Dummy 5 (Call Volume logic with wide-headed arrows)
            const ceCell5 = document.createElement('td');
            if (secondHighestCallVolume > 0.75 * highestCallVolume) {
                if (secondHighestCallVolumeStrike > highestCallVolumeStrike) {
                    ceCell5.innerHTML = "Vol - Bullish 🡅";  // Wide-Headed Upwards Arrow
                    ceCell5.style.color = 'green';
                    ceCell5.style.fontWeight = 'bold';
                } else if (secondHighestCallVolumeStrike < highestCallVolumeStrike) {
                    ceCell5.innerHTML = "Vol - Bearish 🡇";  // Wide-Headed Downwards Arrow
                    ceCell5.style.color = 'red';
                    ceCell5.style.fontWeight = 'bold';
                }
            } else {
                ceCell5.innerHTML = "Vol - Strong ";
                ceCell5.style.color = 'brown';
                ceCell5.style.fontWeight = 'bold';
            }
            headerRow.appendChild(ceCell5);

            // CE Dummy 6 & 7 (No Logic)
            const ceCell6_7 = document.createElement('td');
            ceCell6_7.textContent = '-';
            ceCell6_7.colSpan = 2;  // Keeping the combined columns
            headerRow.appendChild(ceCell6_7);

            // Spot price cell
            const spotPriceCell = document.createElement('td');
            spotPriceCell.textContent = `${spotPrice || 'N/A'}`;
            spotPriceCell.style.backgroundColor = '#003366'; // ajinkya
            spotPriceCell.style.color = 'white';
            spotPriceCell.style.textAlign = 'center';
            spotPriceCell.style.fontWeight = 'bold';
            headerRow.appendChild(spotPriceCell);


            // PE Dummy 1 & 2 (No Logic)
            const peCell1_2 = document.createElement('td');
            peCell1_2.textContent = '-';
            peCell1_2.colSpan = 2;  // Keeping the combined columns
            headerRow.appendChild(peCell1_2);

            // PE Dummy 3 (Put Volume logic with wide-headed arrows)
            const peCell3 = document.createElement('td');
            if (secondHighestPutVolume > 0.75 * highestPutVolume) {
                if (secondHighestPutVolumeStrike > highestPutVolumeStrike) {
                    peCell3.innerHTML = "Vol - Bullish 🡅";  // Wide-Headed Upwards Arrow
                    peCell3.style.color = 'green';
                    peCell3.style.fontWeight = 'bold';
                } else if (secondHighestPutVolumeStrike < highestPutVolumeStrike) {
                    peCell3.innerHTML = "Vol - Bearish 🡇";  // Wide-Headed Downwards Arrow
                    peCell3.style.color = 'red';
                    peCell3.style.fontWeight = 'bold';
                }
            } else {
                peCell3.innerHTML = "Vol - Strong";
                peCell3.style.color = 'green';
                peCell3.style.fontWeight = 'bold';
            }
            headerRow.appendChild(peCell3);

            // PE Dummy 4 (Put OI logic with wide-headed arrows)
            const peCell4 = document.createElement('td');
            if (secondHighestPutOI > 0.75 * highestPutOI) {
                if (secondHighestPutOIStrike > highestPutOIStrike) {
                    peCell4.innerHTML = "OI - Bullish 🡅";  // Wide-Headed Upwards Arrow
                    peCell4.style.color = 'green';
                    peCell4.style.fontWeight = 'bold';
                } else if (secondHighestPutOIStrike < highestPutOIStrike) {
                    peCell4.innerHTML = "OI - Bearish 🡇";  // Wide-Headed Downwards Arrow
                    peCell4.style.color = 'red';
                    peCell4.style.fontWeight = 'bold';
                }
            } else {
                peCell4.innerHTML = "OI - Strong ";
                peCell4.style.color = 'green';
                peCell4.style.fontWeight = 'bold';
            }
            headerRow.appendChild(peCell4);



            // Merge PE Dummy 6, 7, and 8
            const peCell6_8 = document.createElement('td');
            peCell6_8.colSpan = 4;
            peCell6_8.textContent = putDecision;
            peCell6_8.style.fontWeight = 'bold';

            // Apply styles based on the signal for Put decision
            if (putDecision.includes("PE (Put) Buying Trade Preferred")) {
                peCell6_8.style.backgroundColor = 'green'; // Green BG
                peCell6_8.style.color = 'white'; // White text
            } else if (putDecision.includes("No Put Buying Trade")) {
                peCell6_8.style.backgroundColor = 'gray'; // Gray BG
                peCell6_8.style.color = 'black'; // Black text
            } else if (putDecision.includes("Wait for Preferred Trade")) {
                peCell6_8.style.backgroundColor = '#A05544'; // Deep Amber BG
                peCell6_8.style.color = 'white'; // White text
            }

            headerRow.appendChild(peCell6_8);

            // Append the row to the table body
            tbody.appendChild(headerRow);
        }





        const rows = tbody.querySelectorAll('tr');

        rows.forEach((row, rowIndex) => {
            for (let colIndex = 0; colIndex < 7; colIndex++) {
                const cell = row.cells[colIndex];

                if (rowIndex > 11 && colIndex < 7) {
                    cell.classList.add('light-red');
                }
            }

        });
        rows.forEach((row, rowIndex) => {
            for (let colIndex = 8; colIndex < 15; colIndex++) {
                const cell = row.cells[colIndex];

                if (rowIndex >= 0 && rowIndex < 11 && colIndex > 7) {
                    cell.classList.add('light-green');
                }
            }
        });
        

    });
}



