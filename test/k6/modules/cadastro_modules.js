import http from 'k6/http';
import { check, group } from 'k6';

const PASSWORD = '123456';
const paramsJson = { headers: { 'Content-Type': 'application/json' } };

/**
 * @param {string} baseUrl - URL base da API.
 * @param {string} username - Nome de usuário a ser cadastrado.
 * @param {string} favored - Nome do favorecido (também cadastrado).
 */
export function fluxoDeCadastro(baseUrl, username, favored) {
    // 0. Preparação (Criar Favorecido)
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
        
        const res = http.post(`${baseUrl}/users/register`, payload, paramsJson);

        check(res, {
            'Cadastro - Status 201': (r) => r.status === 201
        });
    });
}