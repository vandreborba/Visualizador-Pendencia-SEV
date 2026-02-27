import os
import glob
import pandas as pd
from datetime import datetime

# Diretórios

# Pasta Downloads padrão do usuário
DOWNLOAD_DIR = os.path.join(os.path.expanduser('~'), 'Downloads')
CSV_DIR = os.path.join(DOWNLOAD_DIR, 'csv')

# Cria pasta CSV se não existir
os.makedirs(CSV_DIR, exist_ok=True)

# Data de hoje para nome do arquivo
hoje = datetime.now().strftime('%Y-%m-%d')

# Busca arquivos MACUV*.xls
arquivos_xls = glob.glob(os.path.join(DOWNLOAD_DIR, 'MACUV*.xls'))

for arquivo in arquivos_xls:
    try:
        df = pd.read_excel(arquivo)
        nome_base = os.path.splitext(os.path.basename(arquivo))[0]
        nome_csv = f'{nome_base}_{hoje}.csv'
        caminho_csv = os.path.join(CSV_DIR, nome_csv)
        df.to_csv(caminho_csv, index=False, sep=';', encoding='utf-8')
        print(f'Convertido: {arquivo} -> {caminho_csv}')
    except Exception as e:
        print(f'Erro ao converter {arquivo}: {e}')
