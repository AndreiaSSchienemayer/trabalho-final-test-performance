*API de Transferências e Usuários*
Esta API permite o registro, login, consulta de usuários e transferências de valores entre usuários. O objetivo é servir de base para estudos de testes e automação de APIs.

*Tecnologias*
Node.js
Express
Swagger (documentação)
Banco de dados em memória (variáveis)

*Instalação*
Clone o repositório:

git clone <https://github.com/AndreiaSSchienemayer/trabalho-final-test-performance>
cd trabalho-testes-performance

*Instale as dependências:*

npm install

*Configuração*
Antes de seguir, crie um arquivo .env na pasta raiz contendo as propriedades BASE_URL_REST e BASE_URL_GRAPHQL.

*Como rodar*
Para iniciar o servidor:
npm start

A API estará disponível em http://localhost:3000
A documentação Swagger estará em http://localhost:3000/api-docs

*Testes de Performance com K6*
Como parte da avaliação final da Pós-Graduação em Automação de Testes, foi implementada uma suíte de testes de performance utilizando K6. Abaixo detalhamos a arquitetura e a aplicação dos conceitos exigidos.

*Arquitetura dos Testes*
Os arquivos estão organizados no diretório test/k6:

test/k6/
├── performance.test.js      # Script principal do teste
├── helpers/
│   ├── utils.js             # Helpers (Faker e geradores de dados)
│   └── getBaseUrl.js        # Configuração de ambiente
└── data/
    └── valores.json         # Massa de dados para Data-Driven Testing

*Aplicação dos Conceitos (Evidências)*
Abaixo demonstramos como cada um dos 11 conceitos obrigatórios foi aplicado no código:

1. Stages (Carga Variável)
Utilizamos Stages para simular um comportamento real de tráfego: Rampa de subida (Ramp-up), carga sustentada e descida (Ramp-down).

// Arquivo: .../test/k6/performance.test.js
stages: [
    { duration: '5s', target: 50 },   // Sobem 50 usuários em 5s
    { duration: '10s', target: 100 }, // Mantém 100 usuários por 10s
    { duration: '5s', target: 0 }     // Desconecta todos em 5s
]

2. Thresholds (Critérios de Aceite)
Definimos limites de qualidade. O teste falha se 95% das requisições demorarem mais de 2s ou se houver mais de 1% de erro.

// Arquivo: .../test/k6/performance.test.js
thresholds: {
    'http_req_duration': ['p(95)<=2000'], 
    'http_req_failed': ['rate<0.01'], 
}

3. Helpers e 4. Faker
Para manter o código limpo e gerar dados dinâmicos (evitando duplicidade de usuários), criamos funções auxiliares em helpers/utils.js utilizando a lib externa Faker.

// test/k6/helpers/utils.js
import faker from 'https://unpkg.com/faker@5.5.3/dist/faker.js';

export function nameFaker() {    
    const firstName = faker.name.firstName();
    // ... lógica de randomização
    return `${firstName}${uniqueId}_${random}`;
}

5. Data-Driven Testing (DDT)
Carregamos uma massa de dados externa (valores de transferência) a partir de um arquivo JSON para variar o payload dos testes.

// Arquivo: .../test/k6/performance.test.js
const listaDeValores = new SharedArray('valores do arquivo', function () {
    return JSON.parse(open('./data/valores.json'));
});
// Uso no teste:
const valorDoArquivo = listaDeValores[indice].valor;

6. Groups
Organizamos o fluxo lógico do usuário em passos nomeados para facilitar a leitura do relatório.

// Arquivo: .../test/k6/performance.test.js
group('1. Fluxo de Cadastro', function() { ... });
group('2. Fluxo de Login', function() { ... });
group('3. Fluxo de Transferência', function() { ... });

7. Uso de Token de Autenticação e 8. Reaproveitamento de Resposta
Capturamos o Token JWT gerado no login e o injetamos no Header da requisição seguinte (Transferência).

// Arquivo: .../test/k6/performance.test.js
// Captura do token na resposta do login
if (loginSucceeded) {
    authToken = responseLogin.json('token');
}

// Reutilização no Header da próxima requisição
const transferParams = {
    headers: {
        'Authorization': `Bearer ${authToken}`
    }
};

9. Checks
Validamos não apenas o status code, mas também o conteúdo do corpo da resposta (ex: presença do token).

// Arquivo: .../test/k6/performance.test.js
check(responseLogin, {
    'Login - Status 200 OK': (r) => r.status === 200,
    'Login - Token presente': (r) => r.json('token') !== undefined
});

10. Trends (Métricas Customizadas)
Criamos uma métrica específica para monitorar o tempo de resposta exclusivo da transação de Login.

// Arquivo: .../test/k6/performance.test.js
const loginTrend = new Trend('taxa_login_duration');
// ...
loginTrend.add(responseLogin.timings.duration);

11. Variável de Ambiente
Permitimos a execução dinâmica em diferentes ambientes (Local vs Pipeline) injetando a URL base.

// test/k6/helpers/getBaseUrl.js
return __ENV.BASE_URL || 'http://localhost:3000';

12. Relatório e Pipeline CI/CD
O projeto gera automaticamente um relatório em HTML (relatorio_teste.html) ao final da execução, utilizando o k6-reporter via função handleSummary.

O teste está integrado ao GitHub Actions, rodando automaticamente a cada Push/PR na branch principal, gerando o relatório como artefato de build.

*Como rodar o teste de performance localmente:*

# Inicie a API em um terminal
npm run start-rest
# Em outro terminal, rode o teste
k6 run test/k6/performance.test.js