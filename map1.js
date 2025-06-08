const pollutionData = {
    "Porta San Felice": {
        coordinates: [44.5025, 11.3284],
        pollutants: {
            C6H6: [1.118, 0.906, 0.942, 0.916, 0.946, 0.987],
            CO: [663.849, 582.742, 651.191, 580.956, 490.897, 505.863],
            NO: [20.273, 17.288, 17.949, 18.659, 16.317, 20.895],
            NO2: [46.473, 38.454, 43.389, 38.931, 42.747, 28.433],
            NOX: [77.483, 64.904, 70.821, 67.371, 67.606, 60.445],
            PM10: [25.443, 25.821, 25.875, 27.175, 22.342, 25.489],
            PM2_5: [16.234, 16.486, 15.898, 17.233, 13.555, 14.372]
        }
    },
    "Giardini Margherita": {
        coordinates: [44.48210, 11.35114],
        pollutants: {
            NO2: [20.584, 17.079, 16.537, 18.425, 15.603, 14.774],
            PM10: [22.105, 23.722, 22.755, 23.189, 19.801, 22.074],
            PM2_5: [13.728, 15.42, 13.983, 14.188, 13.046, 14.488]
        }
    },
    "Via Chiarini": {
        coordinates: [44.49967, 11.28730],
        pollutants: {
            NO2: [20.712, 20.434, 18.525, 15.885, 16.287, 15.678],
            PM10: [24.62, 21.938, 21.49, 24.565, 20.669, 20.396]
        }
    }
};

const years = [2019, 2020, 2021, 2022, 2023, 2024];


const map1 = L.map('map1').setView([44.4949, 11.3426], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map1);


function createPopupContent(id) {
    return `<div class="chart-container"><canvas id="${id}" width="300" height="250"></canvas></div>`;
}

function renderChart(canvasId, location, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const datasets = Object.entries(data.pollutants).map(([pollutant, values], idx) => ({
        label: pollutant,
        data: values,
        borderColor: `hsl(${(idx * 70) % 360}, 70%, 50%)`,
        fill: false,
        tension: 0.2
    }));

    new Chart(ctx, {
        type: "line",
        data: {
            labels: years,
            datasets: datasets
        },
        options: {
            responsive: false,
            plugins: {
                legend: { position: "bottom" },
                title: {
                    display: true,
                    text: location
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Concentration"
                    }
                }
            }
        }
    });
}

function getTotalPollutant(data, yearIndex = 5) {
    return Object.values(data.pollutants).reduce((sum, values) => {
        return sum + (values[yearIndex] || 0);
    }, 0);
}

function getColor(value) {
    return value > 200 ? "#d73027" :
        value > 100 ? "#fc8d59" :
            value > 50 ? "#fee08b" :
                value > 25 ? "#d9ef8b" :
                    "#91cf60";
}

for (const [location, data] of Object.entries(pollutionData)) {
    const id = `chart-${location.replace(/\s+/g, "-")}`;
    const total2024 = getTotalPollutant(data);
    const radius = Math.max(10, total2024 / 10);
    const color = getColor(total2024);

    const circle = L.circleMarker(data.coordinates, {
        radius: radius,
        color: "#333",
        fillColor: color,
        fillOpacity: 0.7,
        weight: 1
    }).addTo(map1);

    circle.bindPopup(createPopupContent(id));

    circle.on("popupopen", () => {
        setTimeout(() => renderChart(id, location, data), 100);
    });
}
// Average values from CSV
const capAverages = {
    "40121": 4135.67,
    "40122": 6267.83,
    "40123": 3955.83,
    "40124": 4259.0,
    "40125": 5134.83,
    "40126": 5425.33,
    "40127": 15904.33,
    "40128": 18407.83,
    "40129": 9925.83,
    "40131": 14960.17,
    "40132": 14960.67,
    "40133": 20823.67,
    "40134": 8134.83,
    "40135": 5062.67,
    "40136": 5345.83,
    "40137": 12587.0,
    "40138": 19614.0,
    "40139": 21543.83,
    "40141": 11158.67
};

// Approximate coordinates per CAP in Bologna
const capCoordinates = {
    "40121": [44.5044, 11.3426],
    "40122": [44.5022, 11.3417],
    "40123": [44.4965, 11.3380],
    "40124": [44.4902, 11.3420],
    "40125": [44.4885, 11.3498],
    "40126": [44.5029, 11.3500],
    "40127": [44.5055, 11.3723],
    "40128": [44.5190, 11.3660],
    "40129": [44.5311, 11.3434],
    "40131": [44.5087, 11.3132],
    "40132": [44.5331, 11.3024],
    "40133": [44.4960, 11.2600],
    "40134": [44.4750, 11.3080],
    "40135": [44.4670, 11.2885],
    "40136": [44.4780, 11.3502],
    "40137": [44.4863, 11.3690],
    "40138": [44.5060, 11.3717],
    "40139": [44.5140, 11.3820],
    "40141": [44.4700, 11.4175]
};

// Build heatmap data
const heatData = Object.entries(capAverages).map(([cap, value]) => {
    const coords = capCoordinates[cap];
    if (coords) {
        return [...coords, value / 25000]; // normalize
    }
    return null;
}).filter(Boolean);

// Add heat layer to map
L.heatLayer(heatData, {
    radius: 25,
    blur: 20,
    maxZoom: 16
}).addTo(map1);
