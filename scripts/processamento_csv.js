function normalizarTexto(valor) {
    return (valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ã/g, 'a')
        .replace(/Â/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function chaveCanonicaCabecalho(campoOriginal) {
    const campo = normalizarTexto(campoOriginal);

    if (campo.includes('hora') && campo.includes('inicio')) return 'hora_inicio';
    if (campo.includes('hora') && campo.includes('fim')) return 'hora_fim';
    if (campo.includes('km') && campo.includes('inicio')) return 'km_inicio';
    if (campo.includes('km') && campo.includes('fim')) return 'km_fim';
    if (campo.includes('km') && campo.includes('rodado')) return 'km_rodado';
    if (campo.includes('origem')) return 'origem';
    if (campo.includes('destino')) return 'destino';
    if (campo.includes('motorista')) return 'motorista';
    if (campo.includes('finalidade')) return 'finalidade';

    return null;
}

function encontrarDataNaLinha(celulas) {
    for (const celula of celulas) {
        const match = celula.match(/^(\d{2}\/\d{2}\/\d{4})/);
        if (match) return match[1];
    }
    return null;
}

function isLinhaTotal(celulas) {
    return celulas.some(c => normalizarTexto(c).startsWith('total'));
}

function isLinhaResumoAnual(celulas) {
    return celulas.some(c => normalizarTexto(c).includes('km rodados no ano'));
}

function isLinhaCabecalho(celulas) {
    return celulas.some(c => {
        const n = normalizarTexto(c);
        return n.includes('hora') && n.includes('inicio');
    });
}

function processarCSVPorData(csvText) {
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
    const registros = [];

    let dataAtual = null;
    let colunasMapeadas = [];

    for (const linha of linhas) {
        const celulas = linha.split(';').map(c => c.trim());

        if (isLinhaResumoAnual(celulas)) {
            break;
        }

        const dataLinha = encontrarDataNaLinha(celulas);
        if (dataLinha) {
            dataAtual = dataLinha;
            colunasMapeadas = [];
            continue;
        }

        if (isLinhaCabecalho(celulas)) {
            colunasMapeadas = celulas
                .map((valor, indice) => ({
                    indice,
                    chave: chaveCanonicaCabecalho(valor)
                }))
                .filter(item => item.chave);
            continue;
        }

        if (isLinhaTotal(celulas)) {
            continue;
        }

        if (!dataAtual || colunasMapeadas.length === 0) {
            continue;
        }

        const registro = { data: dataAtual };

        for (const coluna of colunasMapeadas) {
            registro[coluna.chave] = (celulas[coluna.indice] || '').trim();
        }

        const temConteudo = Object.entries(registro).some(([chave, valor]) => chave !== 'data' && valor !== '');
        if (temConteudo) {
            registros.push(registro);
        }
    }

    return registros;
}

window.processarCSVPorData = processarCSVPorData;
