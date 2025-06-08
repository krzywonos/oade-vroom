// Initialize map
const map = L.map('map').setView([44.4949, 11.3426], 11.4);

// Use a minimal basemap (CartoDB Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

// Color scale function based on value
function getColor(value) {
    if (value === null || value === undefined || isNaN(value)) return '#ccc'; // no data gray

    return value > 20000 ? '#800026' :
        value > 15000 ? '#BD0026' :
            value > 10000 ? '#E31A1C' :
                value > 5000 ? '#FC4E2A' :
                    value > 1000 ? '#FD8D3C' :
                        value > 500 ? '#FEB24C' :
                            value > 100 ? '#FED976' :
                                '#FFEDA0';
}

// Global variables to store data
let pollutantDataGlobal;
let geojsonDataGlobal;
let geoJsonLayer; // To hold the GeoJSON layer for easy removal/update
let maskLayer; // To hold the mask layer

// Load CSV pollutant data
async function loadPollutantCSV(csvUrl) {
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                const data = results.data;
                const capColumns = results.meta.fields.filter(f => /^\d{5}$/.test(f)); // Assuming CAPs are 5 digits

                const dataByCap = {};
                capColumns.forEach(cap => { dataByCap[cap] = {}; });

                data.forEach(row => {
                    const dateField = row.DATE; // Assuming 'DATE' column holds the year for the values
                    // Extract year from 'DATE' column. Adjust this if 'DATE' is not just the year.
                    const year = dateField; // If 'DATE' is already 'YYYY'
                    // If 'DATE' is 'YYYY-MM-DD', you might do: const year = new Date(dateField).getFullYear().toString();

                    capColumns.forEach(cap => {
                        const value = parseFloat(row[cap]);
                        if (!dataByCap[cap]) {
                            dataByCap[cap] = {};
                        }
                        dataByCap[cap][year] = isNaN(value) ? null : value;
                    });
                });

                // Get all unique years from the data
                const allYears = new Set();
                Object.values(dataByCap).forEach(capData => {
                    Object.keys(capData).forEach(year => allYears.add(parseInt(year)));
                });
                const sortedYears = Array.from(allYears).sort((a, b) => a - b);

                resolve({ dataByCap: dataByCap, years: sortedYears });
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

// Add mask outside polygons with Turf.js
function addMask(geojson) {
    if (maskLayer) {
        map.removeLayer(maskLayer);
    }

    const polygonFeatures = geojson.features.filter(
        feature => feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
    );

    if (polygonFeatures.length === 0) {
        console.warn("No Polygon or MultiPolygon features found in GeoJSON for masking. Skipping mask creation.");
        return;
    }

    const bounds = map.getBounds();
    const bboxPolygon = turf.bboxPolygon([
        bounds.getWest() - 1,
        bounds.getSouth() - 1,
        bounds.getEast() + 1,
        bounds.getNorth() + 1
    ]);

    // Combine all features into a single (multi)polygon
    const combined = turf.combine({
        type: "FeatureCollection",
        features: polygonFeatures
    });

    try {
        const masked = turf.difference(bboxPolygon, combined);

        if (masked) {
            maskLayer = L.geoJSON(masked, {
                style: {
                    fillColor: 'white',
                    fillOpacity: 0.8,
                    stroke: false
                }
            }).addTo(map);
        }
    } catch (e) {
        console.error("Error creating mask with turf.difference:", e);
    }
}


// Function to update the map based on the selected year
function updateMap(year) {
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer); // Remove existing layer
    }

    if (!pollutantDataGlobal || !geojsonDataGlobal) {
        console.error("Data not loaded yet for map update.");
        return;
    }

    geoJsonLayer = L.geoJSON(geojsonDataGlobal, {
        style: function (feature) {
            const cap = feature.properties.CAP || feature.properties.cap || "N/A";
            const values = pollutantDataGlobal[cap] || {};
            const valueForYear = values[year] !== undefined ? values[year] : null;

            return {
                color: getColor(valueForYear),
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7
            };
        },
        onEachFeature: function (feature, layer) {
            const cap = feature.properties.CAP || feature.properties.cap || "N/A";
            const values = pollutantDataGlobal[cap] || {};
            const valueForYear = values[year] !== undefined ? values[year] : "N/A";

            const popupContent = `
                <b>CAP:</b> ${cap}<br>
                <b>Year:</b> ${year}<br>
                <b>Total Vehicles:</b> ${valueForYear}
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    // Update the mask based on the current GeoJSON
    addMask(geojsonDataGlobal);

    // Update the display for the current year
    $('#currentYearDisplay').text(year);
}

// Main function to load everything
async function loadMapData() {
    try {
        const { dataByCap, years } = await loadPollutantCSV('MDS1_2.csv');
        pollutantDataGlobal = dataByCap;

        const response = await fetch('bologna_cap.geojson');
        geojsonDataGlobal = await response.json();

        // Initialize the slider
        if (years.length > 0) {
            const minYear = years[0];
            const maxYear = years[years.length - 1];

            $("#yearSlider").slider({
                range: "min",
                min: minYear,
                max: maxYear,
                value: maxYear, // Start with the latest year
                slide: function (event, ui) {
                    updateMap(ui.value.toString()); // Update map with the selected year
                },
                // Add tick marks if desired (requires custom CSS/JS for full ticks)
                // You can add `step: 1` if your years are consecutive
                // create: function(event, ui) { /* Optional: code to draw ticks/labels */ }
            });

            // Initial map load with the latest year
            updateMap(maxYear.toString());
        } else {
            console.warn("No years found in the CSV data. Slider will not be initialized.");
            updateMap(null); // Load map without year-specific data
        }

    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// Call the main function to start loading data and initializing the map
loadMapData();