import http from 'k6/http';
import { check, group } from 'k6';

/**
 * @param {string} baseUrl - URL base da API.
 * @param {string} authToken - Token JWT de autenticação.
 * @param {object} transferData - Objeto contendo {from, to, value}.
 */
export function fluxoDeTransferencia(baseUrl, authToken, transferData) {
    group('3. Fluxo de Transferência (POST /transfers)', function() { 
        const transferUrl = `${baseUrl}/transfers`;
        const transferPayload = JSON.stringify(transferData);
        
        const transferParams = {
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${authToken}` // Uso do Token
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
}