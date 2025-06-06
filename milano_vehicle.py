import pandas as pd
import plotly.graph_objects as go

# Caricamento dati
df = pd.read_csv("mashup-datasets/MD2.csv")
df["ANNO"] = df["DATE"].str[:4].astype(int)
df = df[df["DATE"].str.endswith("-01")]  # Prendi solo un mese per anno

# Prepara i dati per ogni anno
anni = sorted(df["ANNO"].unique())
figure = go.Figure()

# Aggiungi una "trace" per ogni anno, inizialmente nascosta
for anno in anni:
    riga = df[df["ANNO"] == anno]
    valori = {
        "AUTOBUS": riga["AUTOBUS"].values[0],
        "MERCI": riga.filter(like="MERCI", axis=1).sum(axis=1).values[0],
        "SPECIALI": riga.filter(like="SPECIALI", axis=1).sum(axis=1).values[0],
        "AUTOVETTURE": riga["AUTOVETTURE"].values[0],
        "MOTOCICLI": riga["MOTOCICLI"].values[0],
        "TRATTORI STRADALI": riga["TRATTORI STRADALI O MOTRICI"].values[0]
    }
    
    figure.add_trace(go.Pie(
    labels=list(valori.keys()),
    values=list(valori.values()),
    name=str(anno),
    visible=(anno == anni[0]),
    textinfo="percent",  # mostra etichetta, %, valore
    insidetextorientation='radial',
    marker=dict(colors=["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]),  # colori personalizzati
    showlegend=True  # mostra legenda
))


# Aggiungi dropdown per selezione anno
buttons = [
    dict(label=str(anno),
         method="update",
         args=[
             {"visible": [i == j for j in range(len(anni))]},
             {"title": {"text": f"Veicoli per categoria - Anno {anno}"}}
         ])
    for i, anno in enumerate(anni)
]

figure.update_layout(
    updatemenus=[dict(active=0, buttons=buttons)],
    title=f"Veicoli per categoria - Anno {anni[0]}",
    yaxis_title="Quantità"
)

# Salva in HTML
figure.write_html("milano_vehicle.html")

