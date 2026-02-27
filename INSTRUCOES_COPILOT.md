# Instruções para GitHub Copilot

Este projeto é um visualizador de pendências para relatórios de veículos, rodando totalmente localmente no navegador do usuário. Não há backend, nem envio de dados.

## Organização do Projeto

- **index.html**: Arquivo principal na raiz, para facilitar publicação no GitHub Pages.
- **estilos/**: Pasta para arquivos CSS.
- **scripts/**: Pasta para arquivos JavaScript.
- **telas/**: Pasta para futuras telas ou componentes HTML, se necessário.

## Regras para Copilot

- Use apenas HTML, CSS e JavaScript puro.
- Separe cada tela, script e estilo em arquivos distintos.
- Não utilize frameworks ou bibliotecas externas.
- O programa deve funcionar localmente, sem dependências de servidor.
- O index.html deve estar na raiz do projeto.
- Os caminhos para scripts e estilos devem ser relativos à raiz.
- Não exiba nem envie informações dos arquivos selecionados; apenas processe localmente.

## Fluxo Inicial

1. Mostre instruções para o usuário acessar o SDA, baixar os relatórios.
2. Permita selecionar múltiplos arquivos.
3. Exiba os nomes e quantidade dos arquivos no console.

## Observação

Este projeto é não oficial, apenas para facilitar a visualização das inconsistências. Nenhuma informação é enviada ou armazenada fora do computador do usuário.

---

Se precisar de mais telas ou funcionalidades, siga a mesma estrutura de separação de arquivos.
