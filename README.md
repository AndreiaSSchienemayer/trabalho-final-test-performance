# API de Transferências e Usuários

Este projeto é uma API simples de **Transferências e Usuários** desenvolvida para servir como **base de estudo e prática em testes de API**, especialmente focada em testes de performance e automação.

A API permite:
* Registro e Login de usuários.
* Consulta de dados de usuários.
* Transferência de valores entre contas cadastradas.

## Tecnologias Utilizadas

A API foi construída com foco na simplicidade para facilitar os estudos:

* **Backend:** Node.js
* **Framework Web:** Express
* **Documentação:** Swagger (OpenAPI)
* **Banco de Dados:** Variáveis em memória (dados não persistem após o reinício).
* **Testes de Performance:** k6

## Instalação e Configuração

Siga os passos abaixo para ter a API rodando em sua máquina local.

### Clone o Repositório

git clone https://github.com/AndreiaSSchienemayer/trabalho-final-test-performance
cd trabalho-final-test-performance # Ajuste o nome da pasta conforme a clonagem

### Instale as Dependências

npm install

Configuração de AmbienteCrie um arquivo chamado .env na pasta raiz do projeto. Ele será usado para configurar a URL base da API (e de um eventual GraphQL, se aplicável). 

Conteúdo do arquivo .env:BASE_URL_REST=http://localhost:3000
BASE_URL_GRAPHQL=http://localhost:3000/graphql 

### Como Rodar a API Para iniciar o servidor
API Disponível em: http://localhost:3000 

Documentação Swagger (OpenAPI): http://localhost:3000/api-docs

Testes de Performance com k6Como parte da avaliação final da Pós-Graduação em Automação de Testes, foi implementada uma suíte robusta de testes de performance utilizando k6.

Arquitetura dos TestesOs arquivos dos testes de performance estão organizados no diretório test/k6/ para fácil manutenção e leitura.test/k6/

├── performance.test.js # Script principal com o fluxo de teste.
├── helpers/
│   ├── utils.js        # Funções auxiliares (Faker para dados, etc.).
│   └── getBaseUrl.js   # Lógica para carregar a URL base do ambiente.
└── data/
    └── valores.json    # Massa de dados para o Data-Driven Testing.

## Aplicação dos Conceitos (Evidências)Demonstração de como os conceitos de testes de performance foram aplicados no código.


1. Stages (Carga Variável)Simulamos um comportamento de tráfego real (Ramp-up, Carga Sustentada, Ramp-down) usando a configuração de stages:DuraçãoAlvo (VUs)Descrição5s50Ramp-up: Subida gradual de 0 a 50 usuários em 5 segundos.10s100Carga Sustentada: Mantém 100 usuários por 10 segundos.5s0Ramp-down: Desconexão de todos os usuários em 5 segundos.JavaScript// Arquivo: .../test/k6/performance.test.js
stages: [
    { duration: '5s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '5s', target: 0 }
]

2. Thresholds (Critérios de Aceite)Definição de limites de qualidade. O teste falhará se qualquer um destes critérios for violado:Tempo de Resposta: 95% das requisições devem demorar no máximo 2 segundos (2000ms).Taxa de Erro: A taxa de requisições falhas deve ser inferior a 1%.JavaScript// Arquivo: .../test/k6/performance.test.js
thresholds: {
    'http_req_duration': ['p(95)<=2000'], // p(95) é o 95º percentil
    'http_req_failed': ['rate<0.01'],    // taxa de falha < 1%
}

3. Helpers e 


4. FakerUtilizamos funções auxiliares (helpers/utils.js) e a biblioteca Faker para gerar dados de usuário dinâmicos (nomes, emails, etc.) de forma eficiente, garantindo que cada iteração de teste use dados únicos.JavaScript// test/k6/helpers/utils.js - Exemplo de uso do Faker
import faker from '[https://unpkg.com/faker@5.5.3/dist/faker.js](https://unpkg.com/faker@5.5.3/dist/faker.js)';

export function nameFaker() {
    const firstName = faker.name.firstName();
    // ... lógica de randomização
    return `${firstName}${uniqueId}_${random}`;
}


5. Data-Driven Testing (DDT)O valor das transferências é variado lendo uma massa de dados externa do arquivo data/valores.json usando SharedArray para otimizar o carregamento.JavaScript// Arquivo: .../test/k6/performance.test.js
const listaDeValores = new SharedArray('valores do arquivo', function () {
    return JSON.parse(open('./data/valores.json'));
});
// Uso no teste: const valorDoArquivo = listaDeValores[indice].valor;


6. GroupsO fluxo lógico do usuário é organizado em blocos nomeados (Groups) para facilitar a leitura dos relatórios e a análise do tempo gasto em cada etapa.JavaScript// Arquivo: .../test/k6/performance.test.js
group('1. Fluxo de Cadastro', function() { ... });
group('2. Fluxo de Login', function() { ... });
group('3. Fluxo de Transferência', function() { ... });


7. Uso de Token de Autenticação e 


8. Reaproveitamento de RespostaO Token JWT retornado na resposta da requisição de Login é capturado e injetado no cabeçalho (Authorization) da requisição subsequente de Transferência.JavaScript// Arquivo: .../test/k6/performance.test.js
// Captura
if (loginSucceeded) { 
    authToken = responseLogin.json('token'); 
}

// Reutilização no Header
const transferParams = { 
    headers: { 
        'Authorization': `Bearer ${authToken}` 
    } 
};


9. ChecksUtilizamos Checks para validar a corretude das respostas além do status code HTTP, garantindo que o corpo da resposta contenha dados esperados (ex: a presença do token no login).JavaScript// Arquivo: .../test/k6/performance.test.js
check(responseLogin, {
    'Login - Status 200 OK': (r) => r.status === 200,
    'Login - Token presente': (r) => r.json('token') !== undefined 
});


10. Trends (Métricas Customizadas)Criamos uma métrica customizada chamada taxa_login_duration utilizando new Trend() para monitorar o tempo de resposta exclusivo da transação de Login, separando-a das métricas padrão.JavaScript// Arquivo: .../test/k6/performance.test.js
const loginTrend = new Trend('taxa_login_duration'); 
// ...
loginTrend.add(responseLogin.timings.duration);


11. Variável de AmbienteA URL base da API é configurada de forma dinâmica usando a variável de ambiente __ENV.BASE_URL, permitindo rodar o mesmo teste em diferentes ambientes (local, staging, pipeline CI/CD).JavaScript// test/k6/helpers/getBaseUrl.js
return __ENV.BASE_URL || 'http://localhost:3000';


### Como Rodar o Teste de Performance Localmente
Inicie a API em um terminal (é necessário para que o teste se conecte):Bashnpm start
Rode o Teste de Performance em um segundo terminal:Bashk6 run test/k6/performance.test.js


### Relatório e Pipeline CI/CDO projeto possui recursos de relatório e integração contínua:
Relatório HTML: Ao final de cada execução, um relatório detalhado em HTML (relatorio_teste.html) é gerado automaticamente, utilizando o k6-reporter.
GitHub Actions: O teste está integrado ao CI/CD. Ele roda automaticamente a cada Push/Pull Request na branch principal, gerando o relatório HTML como um artefato de build para revisão.