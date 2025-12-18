// Bibliotecas
const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');

// Aplicação
const app = require('../../../app');

// Mock
const transferService = require('../../../service/transferService');

// Testes
describe('Transfer Controller', () => {
    describe('POST /transfers', () => {
        
        let token;

        beforeEach(async () => {
            // 1. Cadastrar a Andreia (Para garantir que ela existe no banco de dados)
            await request(app)
                .post('/users') 
                .send({
                    username: 'Andreia',
                    password: '123456'
                });

            // 2. Fazer o Login da Andreia para pegar o Token
            const respostaLogin = await request(app)
                .post('/users/login')
                .send({
                    username: 'Andreia',
                    password: '123456'
                });

            token = respostaLogin.body.token;
        });

        it('Quando informo remetente e destinatario inexistentes recebo 400', async () => {
            // Andreia existe, mas Arthur não foi cadastrado, então deve dar erro 400
            const resposta = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    from: "Andreia",
                    to: "Arthur_1",
                    value: 100
                });
            
            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property('error', 'Usuário remetente ou destinatário não encontrado')
        });

        it('Usando Mocks: Quando informo remetente e destinatario inexistentes recebo 400', async () => {
            // Forçamos o erro no serviço (simulando que não achou o Arthur)
            const transferServiceMock = sinon.stub(transferService, 'transfer');
            transferServiceMock.throws(new Error('Usuário remetente ou destinatário não encontrado'));

            const resposta = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    from: "Andreia",
                    to: "Arthur",
                    value: 100
                });
            
            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property('error', 'Usuário remetente ou destinatário não encontrado');
        });

        it('Usando Mocks: Quando informo valores válidos eu tenho sucesso com 201 CREATED', async () => {
            // Simulamos que a transferência de Andreia para Arthur funcionou
            const transferServiceMock = sinon.stub(transferService, 'transfer');
            transferServiceMock.returns({ 
                from: "Andreia", 
                to: "Arthur", 
                value: 100, 
                date: new Date().toISOString() 
            });

            const resposta = await request(app)
                .post('/transfers')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    from: "Andreia",
                    to: "Arthur",
                    value: 100
                });
            
            expect(resposta.status).to.equal(201);
            
            // Validação com o Fixture
            const respostaEsperada = require('../fixture/respostas/quandoInformoValoresValidosEuTenhoSucessoCom201Created.json')
            
            // Ajuste dinâmico para garantir que bate com os nomes novos sem precisar editar o arquivo JSON agora
            respostaEsperada.from = "Andreia";
            respostaEsperada.to = "Arthur";

            delete resposta.body.date;
            delete respostaEsperada.date; 
            
            expect(resposta.body).to.deep.equal(respostaEsperada);
        });

        afterEach(() => {
            // Reseto o Mock para não atrapalhar outros testes
            sinon.restore();
        })
    });

    describe('GET /transfers', () => {
        // Its ficam aqui
    });
});