const pollutants = [
    "C6H6 (BENZENE)",
    "CO (MONOSSIDO DI CARBONIO)"
];
const datasetLabels = ["Bologna", "Milan"];

const csvUrls = [
    "/MD1.csv",  // First CSV (e.g., from Station 1)
    "/MD2.csv"   // Second CSV (e.g., from Station 2)
];

function parseCSV(text) {
    const rows = text.trim().split("\n").map(row => row.split(","));
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(r => r.length === headers.length);
    return { headers, dataRows };
}

function extractTrace(headers, dataRows, pollutant, datasetName, unitConversionFactor = 1) {
    const dateIndex = headers.indexOf("DATE");
    const valueIndex = headers.indexOf(pollutant);

    if (dateIndex === -1 || valueIndex === -1) return null;

    const dates = dataRows.map(r => new Date(r[dateIndex]));
    const values = dataRows.map(r => {
        const v = parseFloat(r[valueIndex]);
        return isNaN(v) ? null : v * unitConversionFactor;
    });

    const sorted = dates.map((d, i) => ({ d, v: values[i] }))
        .sort((a, b) => a.d - b.d);

    return {
        x: sorted.map(p => p.d),
        y: sorted.map(p => p.v),
        mode: 'lines+markers',
        name: `${pollutant.split(" ")[0]} - ${datasetName}`,
        type: 'scatter',
        hovertemplate: `${pollutant}: %{y}<br>Date: %{x|%Y-%m-%d}<extra></extra>`
    };
}

window.onload = () => {
    const fetches = csvUrls.map(url => fetch(url).then(r => {
        if (!r.ok) throw new Error(`Failed to load ${url}`);
        return r.text();
    }));

    Promise.all(fetches)
        .then(texts => {
            const traces = [];

            texts.forEach((text, i) => {
                const { headers, dataRows } = parseCSV(text);
                pollutants.forEach(p => {
                    const isDataset1 = i === 0;
                    const needsConversion = p === "CO (MONOSSIDO DI CARBONIO)" && isDataset1;
                    const conversionFactor = needsConversion ? 1 / 1000 : 1; // Assuming conversion is needed based on previous discussion

                    const trace = extractTrace(headers, dataRows, p, datasetLabels[i], conversionFactor);

                    if (trace) traces.push(trace);
                });
            });

            Plotly.newPlot('plot', traces, {
                title: 'C6H6 and CO Concentrations Over Time',
                xaxis: { title: 'Date', type: 'date' },
                yaxis: { title: 'Concentration (μg/m³)' },
                legend: { orientation: "h", x: 0, y: -0.3 }
            }, { responsive: true });
        })
        .catch(error => {
            document.getElementById('plot').innerText = `Error loading CSV files: ${error.message}`;
        });
};