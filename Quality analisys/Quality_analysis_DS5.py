import pandas as pd

df =pd.read_csv("C:/Users/annan/Università/OPEN ACCESS/DS5.csv", sep=";")

# Converte la colonna in datetime (se non lo è già)
df['data'] = pd.to_datetime(df['data'])

# Estrai anno e mese di interesse (es. maggio 2025)
anno = 2024

# Crea l'intervallo completo di date del mese
tutti_i_giorni = pd.date_range(start=f'{anno}-01-01', end=f'{anno}-12-31', freq='D')

# Filtra le date del dataframe per lo stesso  anno
date_presenti = df[df['data'].dt.year == anno]['data'].dt.normalize()

# Trova i giorni mancanti
giorni_mancanti = set(tutti_i_giorni) - set(date_presenti)

print(f"Totale giorni mancanti: {len(giorni_mancanti)}")
print(100*len(giorni_mancanti)/366)
