import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data'; 
import { nameFaker, randomNameFavorecido } from './helpers/utils.js';
import { BASE_URL } from './helpers/getBaseUrl.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const listaDeValores = new SharedArray('valores do arquivo', function () {
    return JSON.parse(open('./data/valores.json'));
});

const loginTrend = new Trend('taxa_login_duration');

export const options = {
    stages: [
        { duration: '5s', target: 50 },  
        { duration: '10s', target: 100 }, 
        { duration: '5s', target: 0 },   
    ],
    thresholds: {
        'http_req_duration': ['p(95)<=2000'], 
        'http_req_failed': ['rate<0.01'], 
        'checks': ['rate==1.00'],
        'taxa_login_duration': ['p(95)<2000'] 
    }
};

export default function() {
    // A. USERNAME gerado via Faker 
    const USERNAME = nameFaker(); 
    const PASSWORD = '123456'; 
    
    // B. FAVORECIDO gerado via Helper 
    const FAVORED = randomNameFavorecido(); 

    // C. VALOR vindo do Arquivo JSON (Data-Driven Testing)
    const indice = (__VU - 1) % listaDeValores.length;
    const valorDoArquivo = listaDeValores[indice].valor;

    const TRANSFER_DATA = {
        from: USERNAME, 
        to: FAVORED, 
        value: valorDoArquivo 
    };

    // Log para conferir no terminal que os valores estão mudando
    console.log(`[VU ${__VU}] User: ${USERNAME} (Faker) | Valor: ${TRANSFER_DATA.value} (DDT)`);

    let authToken = ''; 
    const baseUrl = BASE_URL(); 
    const paramsJson = { headers: { 'Content-Type': 'application/json' } };

    group('0. Preparação (Criar Favorecido)', function() {
        const payloadFavorecido = JSON.stringify({
            username: FAVORED, 
            password: PASSWORD
        });
        http.post(`${baseUrl}/users/register`, payloadFavorecido, paramsJson);
    });

    group('1. Fluxo de Cadastro (POST /users/register)', function() {
        const payload = JSON.stringify({
            username: USERNAME, 
            password: PASSWORD,
            favorecidos: [FAVORED]
        });
        
        const res = http.post(`${baseUrl}/users/register`, payload, paramsJson);

        check(res, {
            'Cadastro - Status 201': (r) => r.status === 201
        });
    });

    group('2. Fluxo de Login (POST /users/login)', function() {
        const loginUrl = `${baseUrl}/users/login`;
        
        const loginPayload = JSON.stringify({ 
            username: USERNAME, 
            password: PASSWORD
        });
        
        const responseLogin = http.post(loginUrl, loginPayload, paramsJson);

        loginTrend.add(responseLogin.timings.duration);

        const loginSucceeded = check(responseLogin, {
            'Login - Status 200 OK': (r) => r.status === 200,
            'Login - Token presente': (r) => r.json('token') !== undefined
        });
        
        if (loginSucceeded) {
            authToken = responseLogin.json('token');
        } else {
            console.log(`Erro Login: ${responseLogin.body}`);
        }
    });
    
    if (!authToken) { return; }
    
    group('3. Fluxo de Transferência (POST /transfers)', function() { 
        const transferUrl = `${baseUrl}/transfers`;
        const transferPayload = JSON.stringify(TRANSFER_DATA);
        
        const transferParams = {
            headers: {
                'Content-Type': 'application/json',                
                'Authorization': `Bearer ${authToken}`
            }
        };

        const responseTransfer = http.post(transferUrl, transferPayload, transferParams);
        
        const transferSuccess = check(responseTransfer, {
            'Transferência - Status 201': (r) => r.status === 201
        });

        if (!transferSuccess) {
            console.log(`❌ Falha: ${responseTransfer.status} - ${responseTransfer.body}`);
        }
    });

    group('Simulando o pensamento do usuário', function() {
        sleep(1); 
    });    
    
}

export function handleSummary(data) {
  return {
    "relatorio_teste.html": htmlReport(data), // Gera o arquivo HTML
    stdout: textSummary(data, { indent: " ", enableColors: true }), // Exibe no console (terminal)
  };
}