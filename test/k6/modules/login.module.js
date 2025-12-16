import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// Reutiliza a métrica customizada de Login, que é declarada globalmente no performance.test.js
const loginTrend = new Trend('taxa_login_duration');
const PASSWORD = '123456';
const paramsJson = { headers: { 'Content-Type': 'application/json' } };

/**
 * @param {string} baseUrl - URL base da API.
 * @param {string} username - Nome de usuário para login.
 * @returns {string} O token JWT (authToken) ou string vazia em caso de falha.
 */
export function fluxoDeLogin(baseUrl, username) {
    let authToken = '';

    group('2. Fluxo de Login (POST /users/login)', function() {
        const loginUrl = `${baseUrl}/users/login`;
        
        const loginPayload = JSON.stringify({ 
            username: username, 
            password: PASSWORD
        });
        
        const responseLogin = http.post(loginUrl, loginPayload, paramsJson);

        loginTrend.add(responseLogin.timings.duration); // Adiciona a métrica

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

    return authToken;
}