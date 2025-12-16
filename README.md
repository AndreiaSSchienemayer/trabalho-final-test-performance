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
cd trabalho-final-test-performance # 
Ajuste o nome da pasta conforme a clonagem

### Instale as Dependências

npm install

### Como Rodar a API Para iniciar o servidor
API Disponível em: http://localhost:3000 

Documentação Swagger: http://localhost:3000/api-docs

### Testes de Performance com k6
Como parte da avaliação final da Pós-Graduação em Automação de Testes, foi implementada uma suíte de testes de performance utilizando k6.

### Arquitetura dos Testes
Os arquivos dos testes de performance estão organizados no diretório test/k6/ 

```text
trabalho-final-test-performance/
└── test/
    └── k6/
        ├── performance.test.js 
        │   # O ORQUESTRADOR do teste k6 run (k6 run test/k6/performance.test.js)
        │   
        ├── data/
        │   ├── login.test.data.json
        │   └── valores.json
        │
        ├── helpers/
        │   ├── getBaseUrl.js
        │   └── utils.js
        │
        └── modules/
            ├── cadastro.modules.js
            ├── login.modules.js
            └── transferencia.modules.js
```

## Aplicação dos Conceitos (Evidências)
Demonstração de como os conceitos de testes de performance foram aplicados no código.


### 1. Stages (Carga Variável)
Define as fases de carga do teste (aquecimento, estabilidade e rampa descendente) para simular o comportamento de usuários ao longo do tempo.

Localização: test/k6/performance.test.js

```text
export const options = {    
    stages: [
        // RAMP UP: Sobe de 0 VUs para 30 VUs em 5 segundos 
        { duration: '5s', target: 30 }, 
        // STEADY STATE: Mantém 30 VUs por 10 segundos
        { duration: '10s', target: 30 },
        // RAMP DOWN: Desce de 30 VUs para 0 VUs em 5 segundos 
        { duration: '5s', target: 0 },
    ],
    // ...
};
```


### 2. Thresholds (Critérios de Aceite)Definição de limites de qualidade. 
Define critérios de aprovação (SLA) para as métricas de performance. Se a execução não satisfizer estas condições, o teste falhará.

Localização: test/k6/performance.test.js

```text
export const options = {
    // ...
    thresholds: {
        // Taxa de falha HTTP deve ser menor que 0.1% (Idealmente 0%)
        'http_req_failed': ['rate<0.001'], 
        
        // 95% das requisições de Login devem responder em menos de 1500ms (1.5 segundos)
        'taxa_login_duration': ['p(95)<1500'], 
    },
};

```

### 3. Checks 
Verificações funcionais que validam a resposta de uma requisição HTTP. No fluxo de Login, garantimos que a API responde com sucesso (200 OK) e inclui o token JWT.

Localização: test/k6/modules/login.modules.js

```text
const loginSucceeded = check(responseLogin, {
    // Checa se o status HTTP é 200
    'Login - Status 200 OK': (r) => r.status === 200, 
    // Checa se o corpo da resposta possui o campo 'token'
    'Login - Token presente': (r) => r.json('token') !== undefined 
});
```


### 4. Groups (Grupos)
Organiza o fluxo de teste em blocos lógicos, permitindo medir a duração de cada etapa (ex: tempo gasto apenas no Cadastro) e tornando o relatório mais claro.

Localização: test/k6/modules/cadastro.modules.js
```text
    group('0. Preparação (Criar Favorecido)', function() {
            const payloadFavorecido = JSON.stringify({
                username: favored,
                password: PASSWORD
            });
            http.post(`${baseUrl}/users/register`, payloadFavorecido, paramsJson);
        });

        // 1. Fluxo de Cadastro (POST /users/register)
        group('1. Fluxo de Cadastro (POST /users/register)', function() {
            const payload = JSON.stringify({
                username: username,
                password: PASSWORD,
                favorecidos: [favored]
            });

```



### 5. Helpers (Funções Auxiliares)
Implementado através de módulos separados (helpers/) para promover o reuso de lógica, como a geração de URLs e dados.

Localização: test/k6/performance.test.js e helpers/getBaseUrl.js e helpers/utils.js

```text
import { nameFaker, randomNameFavorecido } from './helpers/utils.js'; 
// O Helper para obter a URL base
import { BASE_URL } from './helpers/getBaseUrl.js';
```



Arquivo utils.js: 
```text
import faker from 'https://unpkg.com/faker@5.5.3/dist/faker.js';

export function nameFaker() {    
    const firstName = faker.name.firstName();
    const uniqueId = Date.now(); 
    const random = Math.floor(Math.random() * 1000);
    
    return `${firstName}${uniqueId}_${random}`;
}


```text
export function randomNameFavorecido() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `Arthur${timestamp}_${random}`;
}
```

Arquivo getBaseUrl.js: 
```text
// Obtém a BASE_URL da variável de ambiente
export function BASE_URL () {
    return __ENV.BASE_URL || 'http://localhost:3000';
}
```

### 6. Variável de Ambiente
A URL base da API é configurada para ser lida da variável de ambiente (__ENV.BASE_URL), permitindo que o ambiente de teste seja alternado sem modificar o código.

Localização: test/k6/helpers/getBaseUrl.js

```text
export const BASE_URL = () => {
    return __ENV.BASE_URL || 'http://localhost:3000';
};
```


### 7. Data-Driven Testing (DDT)
Utiliza um arquivo JSON externo (data/valores.json) para fornecer dados de teste (valores de transferência) aos VUs de forma iterativa e balanceada (SharedArray).

Localização: test/k6/performance.test.js

```text
const listaDeValores = new SharedArray('valores do arquivo', function () {
    // Leitura do arquivo JSON. O caminho é relativo ao k6 run (test/k6/data/valores.json)
    return JSON.parse(open('./data/valores.json')); 
});
// ...
export default function() {
    // Seleciona o valor com base no VU ID, garantindo distribuição.
    const indice = (__VU - 1) % listaDeValores.length; 
    const valorDoArquivo = listaDeValores[indice].valor; 

    const TRANSFER_DATA = {
        // ...
        value: valorDoArquivo // Uso do dado externo
    };
    // ...
}
```

### 8. Faker (Geração de Dados Falsos)
A geração de dados únicos para username e favorecido é realizada no Helper utils.js usando funções nativas para simular a unicidade (Timestamp + Random ID).

Localização: test/k6/helpers/utils.js

```text
// ...
export function nameFaker() {    
    // Cria um ID único, garantindo que cada VU se cadastre com um nome diferente
    const timestamp = Date.now().toString(36); 
    const random = Math.random().toString(36).substring(2, 8);
    return `User_${timestamp}_${random}`;
}

export function randomNameFavorecido() {
    // Cria um nome único para o Favorecido
    // ...
}
```

### 9. Reaproveitamento de Resposta e 10. Uso de Token de Autenticação
O token JWT retornado pelo Login é capturado (Reaproveitamento de Resposta) e, em seguida, inserido no header Authorization do fluxo de Transferência (Uso de Token de Autenticação).

Localização: test/k6/performance.test.js

```text
// Captura o token retornado pelo módulo de Login
let authToken = fluxoDeLogin(baseUrl, USERNAME); 

// Passa o token capturado para a Transferência
fluxoDeTransferencia(baseUrl, authToken, TRANSFER_DATA);

```



Localização: test/k6/modules/transferencia.module.js (Uso do Token)
```text
// ...
const transferParams = {
    headers: {
        'Content-Type': 'application/json', 
        // O token é usado no formato Bearer
        'Authorization': `Bearer ${authToken}` 
    }
};
// ...
```

### 11. Trends (Métricas Customizadas)
Uma métrica Trend foi declarada e utilizada para isolar e rastrear especificamente o tempo de resposta do fluxo de Login, permitindo uma análise mais focada desta etapa crítica.

Localização: test/k6/modules/login.modules.js

```text
import { Trend } from 'k6/metrics';

// Declara a métrica customizada que será usada nos Thresholds
const loginTrend = new Trend('taxa_login_duration'); 
// ...
export function fluxoDeLogin(baseUrl, username) {
    // ...
    const responseLogin = http.post(loginUrl, loginPayload, paramsJson);

    // Adiciona a duração da requisição (responseLogin.timings.duration) à Trend
    loginTrend.add(responseLogin.timings.duration); 
    // 
}
```

### Relatórios 
Dentro de ...\Automacao_de_Testes_de_Performance\trabalho-final-test-performance tem o arquivo "relatorio_teste_final.html"