console.log('[SEV] main.js carregado');

const telaUpload = document.getElementById('telaUpload');
const telaResultados = document.getElementById('telaResultados');
const telaMotoristas = document.getElementById('telaMotoristas');
const fileInput = document.getElementById('fileInput');
const btnProcessar = document.getElementById('btnProcessar');
const btnVoltar = document.getElementById('btnVoltar');
const btnAbrirMotoristas = document.getElementById('btnAbrirMotoristas');
const btnGerenciarMotoristas = document.getElementById('btnGerenciarMotoristas');
const btnVoltarMotoristas = document.getElementById('btnVoltarMotoristas');
const feedback = document.getElementById('feedback');
const resumoGeral = document.getElementById('resumoGeral');
const corpoTabelaUsoViaturas = document.querySelector('#tabelaUsoViaturas tbody');
const listaPendencias = document.getElementById('listaPendencias');
const corpoTabelaItens = document.querySelector('#tabelaItens tbody');
const formMotorista = document.getElementById('formMotorista');
const codigoMotoristaInput = document.getElementById('codigoMotorista');
const nomeMotoristaInput = document.getElementById('nomeMotorista');
const corpoTabelaMotoristas = document.querySelector('#tabelaMotoristas tbody');
const CHAVE_LOCALSTORAGE_MOTORISTAS = 'sev_mapeamento_motoristas';
let origemTelaMotoristas = 'upload';

if (!btnProcessar || !fileInput || !telaUpload || !telaResultados) {
    console.error('[SEV] Elementos principais não encontrados no DOM.');
}

if (typeof window.processarCSVPorData !== 'function') {
    console.error('[SEV] processarCSVPorData não carregado.');
}

function carregarMapeamentoMotoristas() {
    try {
        const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE_MOTORISTAS);
        const dados = bruto ? JSON.parse(bruto) : {};
        if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {};
        return dados;
    } catch (erro) {
        console.error('[SEV] Erro ao carregar motoristas do localStorage', erro);
        return {};
    }
}

function salvarMapeamentoMotoristas(mapeamento) {
    localStorage.setItem(CHAVE_LOCALSTORAGE_MOTORISTAS, JSON.stringify(mapeamento));
}

function normalizarCodigoMotorista(codigo) {
    return (codigo || '').trim();
}

function resolverNomeMotorista(valorMotorista) {
    const codigo = normalizarCodigoMotorista(valorMotorista);
    if (!codigo) return '';
    const mapeamento = carregarMapeamentoMotoristas();
    return mapeamento[codigo] || codigo;
}

function normalizarTextoNumerico(valor) {
    const texto = String(valor || '').trim();
    if (!texto) return null;

    const limpo = texto.replace(/[^\d,.-]/g, '');
    if (!limpo || limpo === '-' || limpo === '.' || limpo === ',') return null;

    let normalizado = limpo;
    const temVirgula = normalizado.includes(',');
    const temPonto = normalizado.includes('.');

    if (temVirgula && temPonto) {
        if (normalizado.lastIndexOf(',') > normalizado.lastIndexOf('.')) {
            normalizado = normalizado.replace(/\./g, '').replace(',', '.');
        } else {
            normalizado = normalizado.replace(/,/g, '');
        }
    } else if (temVirgula) {
        normalizado = normalizado.replace(',', '.');
    }

    return normalizado;
}

function converterKmParaNumero(valor) {
    const normalizado = normalizarTextoNumerico(valor);
    if (normalizado === null) return 0;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function converterKmParaNumeroOuNulo(valor) {
    const normalizado = normalizarTextoNumerico(valor);
    if (normalizado === null) return null;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : null;
}

function converterHoraParaMinutos(valor) {
    const texto = String(valor || '').trim();
    const match = texto.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;

    const horas = Number(match[1]);
    const minutos = Number(match[2]);
    const segundos = Number(match[3] || 0);

    if (!Number.isInteger(horas) || !Number.isInteger(minutos) || !Number.isInteger(segundos)) {
        return null;
    }
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59 || segundos < 0 || segundos > 59) {
        return null;
    }

    return (horas * 60) + minutos + (segundos / 60);
}

function calcularDuracaoViagemEmMinutos(horaInicio, horaFim) {
    const inicio = converterHoraParaMinutos(horaInicio);
    const fim = converterHoraParaMinutos(horaFim);
    if (inicio === null || fim === null) return 0;

    let duracao = fim - inicio;
    if (duracao < 0) duracao += 24 * 60;
    return duracao;
}

function formatarPercentual(valor) {
    return `${valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}%`;
}

function formatarKm(valor) {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '-';
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatarTempo(minutos) {
    if (minutos === null || minutos === undefined || Number.isNaN(minutos)) return '-';
    const h = Math.floor(minutos / 60);
    const m = Math.floor(minutos % 60);
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
}

function converterDataHoraParaTimestamp(data, hora, indiceOriginal) {
    const dataTexto = String(data || '').trim();
    const matchData = dataTexto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const minutosHora = converterHoraParaMinutos(hora) ?? 0;

    if (!matchData) return Number.MAX_SAFE_INTEGER - (100000 - indiceOriginal);

    const dia = Number(matchData[1]);
    const mes = Number(matchData[2]);
    const ano = Number(matchData[3]);
    const horaInteira = Math.floor(minutosHora / 60);
    const minuto = Math.floor(minutosHora % 60);
    return new Date(ano, mes - 1, dia, horaInteira, minuto, 0, 0).getTime();
}

function formatarResumoRegistro(item) {
    const data = item.data || '-';
    const inicio = item.hora_inicio || '-';
    const fim = item.hora_fim || '-';
    const origem = item.origem || '-';
    const destino = item.destino || '-';
    const motorista = resolverNomeMotorista(item.motorista) || '-';
    const finalidade = item.finalidade || '-';
    return `${data} | ${inicio} -> ${fim} | ${origem} -> ${destino} | Motorista: ${motorista} | Finalidade: ${finalidade}`;
}

function calcularUsoPorViatura(itens) {
    const agregados = new Map();
    let totalTempoMinutos = 0;
    let totalKmRodado = 0;

    itens.forEach((item) => {
        const placa = (item.placa || '').trim() || 'Não identificada';
        const kmRodado = converterKmParaNumero(item.km_rodado);
        const tempoMinutos = calcularDuracaoViagemEmMinutos(item.hora_inicio, item.hora_fim);
        const atual = agregados.get(placa) || { placa, tempoMinutos: 0, kmRodado: 0, numViagens: 0 };

        atual.tempoMinutos += tempoMinutos;
        atual.kmRodado += kmRodado;
        atual.numViagens += 1;
        totalTempoMinutos += tempoMinutos;
        totalKmRodado += kmRodado;
        agregados.set(placa, atual);
    });

    const totalViagens = itens.length;

    return Array.from(agregados.values())
        .map((viatura) => ({
            placa: viatura.placa,
            numViagens: viatura.numViagens,
            percentualViagens: totalViagens > 0 ? (viatura.numViagens / totalViagens) * 100 : 0,
            totalKm: viatura.kmRodado,
            percentualUsoKm: totalKmRodado > 0 ? (viatura.kmRodado / totalKmRodado) * 100 : 0,
            totalTempoMinutos: viatura.tempoMinutos,
            percentualUsoTempo: totalTempoMinutos > 0 ? (viatura.tempoMinutos / totalTempoMinutos) * 100 : 0
        }))
        .sort((a, b) => {
            if (b.percentualUsoTempo !== a.percentualUsoTempo) {
                return b.percentualUsoTempo - a.percentualUsoTempo;
            }
            return b.percentualUsoKm - a.percentualUsoKm;
        });
}

function renderizarUsoPorViatura(itens) {
    if (!corpoTabelaUsoViaturas) return;
    corpoTabelaUsoViaturas.innerHTML = '';

    if (itens.length === 0) {
        const linha = document.createElement('tr');
        linha.innerHTML = '<td colspan="7">Sem dados para calcular o uso por viatura.</td>';
        corpoTabelaUsoViaturas.appendChild(linha);
        return;
    }

    const resumo = calcularUsoPorViatura(itens);
    resumo.forEach((item) => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${item.placa}</td>
            <td>${item.numViagens}</td>
            <td>${formatarPercentual(item.percentualViagens)}</td>
            <td>${formatarKm(item.totalKm)} km</td>
            <td>${formatarPercentual(item.percentualUsoKm)}</td>
            <td>${formatarTempo(item.totalTempoMinutos)}</td>
            <td>${formatarPercentual(item.percentualUsoTempo)}</td>
        `;
        corpoTabelaUsoViaturas.appendChild(linha);
    });
}

function identificarPendenciasPorViatura(itens) {
    const itensComIndice = itens.map((item, indiceOriginal) => ({
        ...item,
        __indiceOriginal: indiceOriginal
    }));

    const agrupadosPorPlaca = new Map();
    itensComIndice.forEach((item) => {
        const placa = (item.placa || '').trim() || 'Não identificada';
        const lista = agrupadosPorPlaca.get(placa) || [];
        lista.push(item);
        agrupadosPorPlaca.set(placa, lista);
    });

    const resultado = [];
    agrupadosPorPlaca.forEach((registros, placa) => {
        const ordenados = [...registros].sort((a, b) => {
            const ordemA = converterDataHoraParaTimestamp(a.data, a.hora_inicio, a.__indiceOriginal);
            const ordemB = converterDataHoraParaTimestamp(b.data, b.hora_inicio, b.__indiceOriginal);
            if (ordemA !== ordemB) return ordemA - ordemB;
            return a.__indiceOriginal - b.__indiceOriginal;
        });

        const pendencias = [];
        for (let i = 1; i < ordenados.length; i += 1) {
            const anterior = ordenados[i - 1];
            const posterior = ordenados[i];
            const kmFimAnterior = converterKmParaNumeroOuNulo(anterior.km_fim);
            const kmInicioPosterior = converterKmParaNumeroOuNulo(posterior.km_inicio);

            let descricao = '';
            if (kmFimAnterior === null && kmInicioPosterior === null) {
                descricao = 'Km fim anterior e km início posterior ausentes.';
            } else if (kmFimAnterior === null) {
                descricao = 'Km fim do registro anterior ausente.';
            } else if (kmInicioPosterior === null) {
                descricao = 'Km início do registro posterior ausente.';
            } else {
                const diferenca = Math.abs(kmInicioPosterior - kmFimAnterior);
                if (diferenca > 0.0001) {
                    descricao = `Diferença de ${formatarKm(diferenca)} km.`;
                }
            }

            if (descricao) {
                pendencias.push({
                    anterior,
                    posterior,
                    kmFimAnterior,
                    kmInicioPosterior,
                    descricao
                });
            }
        }

        if (pendencias.length > 0) {
            resultado.push({ placa, pendencias });
        }
    });

    return resultado.sort((a, b) => a.placa.localeCompare(b.placa));
}

function renderizarPendencias(itens) {
    if (!listaPendencias) return;
    listaPendencias.innerHTML = '';

    const grupos = identificarPendenciasPorViatura(itens);
    if (grupos.length === 0) {
        const semPendencia = document.createElement('div');
        semPendencia.className = 'sem-pendencias';
        semPendencia.textContent = 'Nenhuma pendência de quilometragem encontrada.';
        listaPendencias.appendChild(semPendencia);
        return;
    }

    grupos.forEach((grupo) => {
        const card = document.createElement('article');
        card.className = 'pendencia-card';

        const linhas = grupo.pendencias.map((pendencia) => `
            <tr>
                <td>${formatarResumoRegistro(pendencia.anterior)}</td>
                <td>${pendencia.anterior.km_fim || '-'}</td>
                <td>${formatarResumoRegistro(pendencia.posterior)}</td>
                <td>${pendencia.posterior.km_inicio || '-'}</td>
                <td class="diferenca-km">${pendencia.descricao}</td>
            </tr>
        `).join('');

        card.innerHTML = `
            <div class="pendencia-cabecalho">
                <h3>Viatura ${grupo.placa}</h3>
                <span class="pendencia-total">${grupo.pendencias.length} pendência(s)</span>
            </div>
            <div class="tabela-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Registro anterior</th>
                            <th>Km fim (anterior)</th>
                            <th>Registro posterior</th>
                            <th>Km início (posterior)</th>
                            <th>Detalhe</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>
        `;

        listaPendencias.appendChild(card);
    });
}

function renderizarTabelaMotoristas() {
    if (!corpoTabelaMotoristas) return;
    const mapeamento = carregarMapeamentoMotoristas();
    const entradas = Object.entries(mapeamento).sort((a, b) => a[0].localeCompare(b[0]));
    corpoTabelaMotoristas.innerHTML = '';

    if (entradas.length === 0) {
        const linha = document.createElement('tr');
        linha.innerHTML = '<td colspan="3">Nenhum motorista cadastrado.</td>';
        corpoTabelaMotoristas.appendChild(linha);
        return;
    }

    entradas.forEach(([codigo, nome]) => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${codigo}</td>
            <td>${nome}</td>
            <td><button type="button" class="btn-remover" data-codigo="${codigo}">Remover</button></td>
        `;
        corpoTabelaMotoristas.appendChild(linha);
    });
}

function mostrarTelaResultados() {
    telaUpload.classList.remove('ativa');
    telaUpload.setAttribute('aria-hidden', 'true');
    telaMotoristas.classList.remove('ativa');
    telaMotoristas.setAttribute('aria-hidden', 'true');
    telaResultados.classList.add('ativa');
    telaResultados.setAttribute('aria-hidden', 'false');
}

function mostrarTelaUpload() {
    telaResultados.classList.remove('ativa');
    telaResultados.setAttribute('aria-hidden', 'true');
    telaMotoristas.classList.remove('ativa');
    telaMotoristas.setAttribute('aria-hidden', 'true');
    telaUpload.classList.add('ativa');
    telaUpload.setAttribute('aria-hidden', 'false');
}

function mostrarTelaMotoristas(origem) {
    origemTelaMotoristas = origem || 'upload';
    telaUpload.classList.remove('ativa');
    telaUpload.setAttribute('aria-hidden', 'true');
    telaResultados.classList.remove('ativa');
    telaResultados.setAttribute('aria-hidden', 'true');
    telaMotoristas.classList.add('ativa');
    telaMotoristas.setAttribute('aria-hidden', 'false');
    renderizarTabelaMotoristas();
}

function extrairPlacaDoNomeArquivo(nomeArquivo) {
    const match = (nomeArquivo || '').toUpperCase().match(/([A-Z0-9]{3}-[A-Z0-9]{4})/);
    return match ? match[1] : '';
}

function lerArquivoComoTexto(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
        reader.readAsText(file, encoding);
    });
}

async function extrairRegistrosArquivo(file) {
    const [textoUtf8, textoLatin1] = await Promise.all([
        lerArquivoComoTexto(file, 'UTF-8'),
        lerArquivoComoTexto(file, 'ISO-8859-1')
    ]);

    const registrosUtf8 = window.processarCSVPorData(textoUtf8);
    const registrosLatin1 = window.processarCSVPorData(textoLatin1);

    return registrosLatin1.length > registrosUtf8.length ? registrosLatin1 : registrosUtf8;
}

function renderizarItensExtraidos(itens) {
    corpoTabelaItens.innerHTML = '';
    renderizarUsoPorViatura(itens);
    renderizarPendencias(itens);

    if (itens.length === 0) {
        resumoGeral.textContent = 'Nenhum registro processado. Verifique o formato do arquivo CSV.';
        return;
    }

    resumoGeral.textContent = `Registros processados: ${itens.length}`;

    itens.forEach(item => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${item.arquivo || '-'}</td>
            <td>${item.placa || '-'}</td>
            <td>${item.data || '-'}</td>
            <td>${item.hora_inicio || '-'}</td>
            <td>${item.hora_fim || '-'}</td>
            <td>${item.km_inicio || '-'}</td>
            <td>${item.km_fim || '-'}</td>
            <td>${item.km_rodado || '-'}</td>
            <td>${item.origem || '-'}</td>
            <td>${item.destino || '-'}</td>
            <td>${resolverNomeMotorista(item.motorista) || '-'}</td>
            <td>${item.finalidade || '-'}</td>
        `;
        corpoTabelaItens.appendChild(linha);
    });
}

async function processarArquivosSelecionados() {
    console.log('[SEV] Clique em processar');
    const arquivos = Array.from(fileInput.files || []);

    if (arquivos.length === 0) {
        feedback.textContent = 'Selecione ao menos um arquivo CSV para continuar.';
        return;
    }

    feedback.textContent = 'Processando arquivos...';

    try {
        const resultados = await Promise.all(
            arquivos.map(async (arquivo) => {
                const registros = await extrairRegistrosArquivo(arquivo);
                const placa = extrairPlacaDoNomeArquivo(arquivo.name);
                return registros.map(registro => ({
                    ...registro,
                    arquivo: arquivo.name,
                    placa
                }));
            })
        );

        const itens = resultados.flat();
        console.log(`[SEV] Itens extraídos: ${itens.length}`);
        renderizarItensExtraidos(itens);
        feedback.textContent = '';
        mostrarTelaResultados();
    } catch (erro) {
        console.error(erro);
        feedback.textContent = erro.message || 'Erro ao processar os arquivos.';
    }
}

btnProcessar.addEventListener('click', processarArquivosSelecionados);
btnVoltar.addEventListener('click', mostrarTelaUpload);
btnAbrirMotoristas.addEventListener('click', () => mostrarTelaMotoristas('upload'));
btnGerenciarMotoristas.addEventListener('click', () => mostrarTelaMotoristas('resultados'));
btnVoltarMotoristas.addEventListener('click', () => {
    if (origemTelaMotoristas === 'resultados') {
        mostrarTelaResultados();
        return;
    }
    mostrarTelaUpload();
});

formMotorista.addEventListener('submit', (event) => {
    event.preventDefault();
    const codigo = normalizarCodigoMotorista(codigoMotoristaInput.value);
    const nome = (nomeMotoristaInput.value || '').trim();

    if (!codigo || !nome) return;

    const mapeamento = carregarMapeamentoMotoristas();
    mapeamento[codigo] = nome;
    salvarMapeamentoMotoristas(mapeamento);
    formMotorista.reset();
    renderizarTabelaMotoristas();
});

corpoTabelaMotoristas.addEventListener('click', (event) => {
    const alvo = event.target;
    if (!(alvo instanceof HTMLElement)) return;
    if (!alvo.classList.contains('btn-remover')) return;

    const codigo = alvo.getAttribute('data-codigo');
    if (!codigo) return;

    const mapeamento = carregarMapeamentoMotoristas();
    delete mapeamento[codigo];
    salvarMapeamentoMotoristas(mapeamento);
    renderizarTabelaMotoristas();
});

fileInput.addEventListener('change', () => {
    if (feedback.textContent) feedback.textContent = '';
});
