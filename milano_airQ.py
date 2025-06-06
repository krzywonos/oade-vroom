import pandas as pd
from plotly import graph_objects as go

# Load CSV
df = pd.read_csv("mashup-datasets/MD2.csv", parse_dates=["DATE"])

df["CO (MONOSSIDO DI CARBONIO)"] *= 1000  # Convert from mg/m³ to μg/m³

# Extract year and month
df["Year"] = df["DATE"].dt.year
df["Month"] = df["DATE"].dt.to_period("M").dt.to_timestamp()

# List of gases
gases = ["C6H6 (BENZENE)", "CO (MONOSSIDO DI CARBONIO)", "NO2 (DIOSSIDO DI AZOTO)",
         "O3 (OZONO)", "PM10", "PM25", "SO2 (DIOSSIDO DI SULFURIO)"]


# Prepare figure
fig = go.Figure()

# Add traces for each year and gas
years = range(2017, 2025)
buttons = []

for year in years:
    visible = []
    for gas in gases:
        monthly = df[df["Year"] == year].groupby("Month")[gas].mean()
        fig.add_trace(go.Scatter(x=monthly.index, 
                                 y=monthly.values,
                                 name=gas, 
                                 visible=(year == 2017)))
        visible.extend([True if year == 2017 else False])

    buttons.append(dict(
        label=str(year),
        method="update",
        args=[
            {"visible": [i // len(gases) == (year - 2017) for i in range(len(gases) * len(years))]},
            {"title": {"text": f"Air Pollutants in {year}"}}
        ]
    ))

# Layout
fig.update_layout(
    title="Air Pollutants in 2017",
    yaxis_title="Concentration (μg/m³)",
    updatemenus=[dict(
        active=0,
        buttons=buttons,
        direction="down",
        showactive=True,
    )],
    legend_title="Type of Gas",
)


fig.write_html("milano_airQ.html", include_plotlyjs="cdn")

