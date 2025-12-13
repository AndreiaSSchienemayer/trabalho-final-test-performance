// Obtém a BASE_URL da variável de ambiente
export function BASE_URL () {
    return __ENV.BASE_URL || 'http://localhost:3000';
}
