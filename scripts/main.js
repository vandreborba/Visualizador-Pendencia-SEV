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

    if (itens.length === 0) {
        resumoGeral.textContent = 'Nenhum item extraído. Verifique o formato do arquivo CSV.';
        return;
    }

    resumoGeral.textContent = `Itens extraídos: ${itens.length}`;

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
