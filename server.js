const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3030;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir protocolo.html manualmente
app.get('/protocolo', (req, res) => {
    console.log('Rota /protocolo acessada');
    res.sendFile(path.join(__dirname, 'public', 'protocolo.html'));
});

// Rota para salvar dados no arquivo
app.post('/salvar', (req, res) => {
    const { protocolo, nome, cnpj, mensagem } = req.body;
    const linha = `${protocolo};${nome};${cnpj};${mensagem}\n`;

    fs.appendFile('data.txt', linha, (err) => {
        if (err) {
            console.error('Erro ao salvar:', err);
            return res.status(500).send('Erro ao salvar dados');
        }
        res.status(200).send('Dados salvos com sucesso');
    });
});

// Rota para consultar por CNPJ
app.post('/consultar', (req, res) => {
    const { cnpj } = req.body;

    fs.readFile('data.txt', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Erro ao ler dados');

        const linhas = data.split('\n');
        const cliente = linhas.find(l => l.includes(cnpj));

        if (!cliente) return res.status(404).send('Cliente não encontrado');

        const [protocolo, nome, cnpjEncontrado, mensagem] = cliente.split(';');
        res.json({ protocolo, nome, cnpj: cnpjEncontrado, mensagem });
    });
});

// Rota para apagar cliente
app.post('/apagar', (req, res) => {
    const { cnpj } = req.body;

    fs.readFile('data.txt', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Erro ao ler dados');

        const linhas = data.split('\n');
        const novasLinhas = linhas.filter(l => !l.includes(cnpj));
        const atualizado = novasLinhas.join('\n');

        fs.writeFile('data.txt', atualizado, err => {
            if (err) return res.status(500).send('Erro ao apagar cliente');
            res.send('Cliente apagado com sucesso');
        });
    });
});

// Rota para alterar a mensagem do cliente
app.post('/alterar', (req, res) => {
    const { cnpj, novaMensagem } = req.body;

    fs.readFile('data.txt', 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Erro ao ler dados');

        let linhas = data.trim().split('\n');
        let encontrado = false;

        linhas = linhas.map(linha => {
            const partes = linha.split(';');
            if (partes[2] === cnpj) {
                encontrado = true;
                partes[3] = novaMensagem; // atualiza a mensagem
                return partes.join(';');
            }
            return linha;
        });

        if (!encontrado) return res.status(404).send('Cliente não encontrado');

        fs.writeFile('data.txt', linhas.join('\n') + '\n', err => {
            if (err) return res.status(500).send('Erro ao salvar mensagem alterada');
            res.send('Mensagem alterada com sucesso');
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});