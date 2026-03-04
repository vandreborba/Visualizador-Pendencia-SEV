/**
 * processamento_xls.js
 * Converte arquivos XLS/XLSX para o mesmo formato que processarCSVPorData espera,
 * usando a biblioteca SheetJS (incluída localmente em libs/xlsx.full.min.js).
 */

function lerArquivoComoArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
        reader.readAsArrayBuffer(file);
    });
}

async function extrairRegistrosXLS(file) {
    if (typeof XLSX === 'undefined') {
        throw new Error('Biblioteca SheetJS não carregada. Verifique se libs/xlsx.full.min.js está acessível.');
    }

    const buffer = await lerArquivoComoArrayBuffer(file);
    const data = new Uint8Array(buffer);

    let workbook;
    try {
        workbook = XLSX.read(data, {
            type: 'array',
            raw: false,
            // Garante que datas sejam exibidas como DD/MM/YYYY no texto
            dateNF: 'DD/MM/YYYY'
        });
    } catch (err) {
        throw new Error(`Não foi possível abrir o arquivo "${file.name}" como XLS/XLSX: ${err.message}`);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error(`O arquivo "${file.name}" não contém planilhas.`);
    }

    const nomePlanilha = workbook.SheetNames[0];
    const planilha = workbook.Sheets[nomePlanilha];

    // Converte planilha para CSV com separador ";" (mesmo padrão do CSV atual)
    const csvTexto = XLSX.utils.sheet_to_csv(planilha, {
        FS: ';',
        blankrows: false
    });

    // Reutiliza o processamento já existente
    return window.processarCSVPorData(csvTexto);
}

window.extrairRegistrosXLS = extrairRegistrosXLS;
