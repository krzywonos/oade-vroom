import pandas as pd
import missingno as msno  


df =pd.read_csv("C:/Users/annan/Università/OPEN ACCESS/DS1.csv")  


print("=== Dataset Info ===")
print(df.info())


print("=== Missing Values (per column) ===")
print(df.isnull().sum())


print("=== Missing Percentage (per column) ===")
missing_percent = df.isnull().mean() * 100
print(missing_percent)

print("=== Number of Incomplete Rows ===")
print(df.isnull().any(axis=1).sum())


msno.matrix(df)         # Matrix view
msno.heatmap(df)        # Correlation of missing data

