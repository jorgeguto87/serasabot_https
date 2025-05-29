const campoProtocolo = document.getElementById('campo_protocolo');
const campoNome = document.getElementById('campo_nome');
const campoCnpj = document.getElementById('campo_cnpj');
const campoMensagem = document.getElementById('campo_mensagem');
const campoConsulta = document.getElementById('campo_consulta');
const campoMensagemAlterar = document.getElementById('campo_mensagem_alterar');
const resultadoConsulta = document.querySelector('.resultado_consulta');

// Gerar número aleatório
document.getElementById('btn_gerar_protocolo').addEventListener('click', () => {
    const numero = Math.floor(100000 + Math.random() * 900000);
    campoProtocolo.value = numero;
});

// Inserir dados
document.getElementById('btn_inserir_dados').addEventListener('click', () => {
    const dados = {
        protocolo: campoProtocolo.value,
        nome: campoNome.value,
        cnpj: campoCnpj.value,
        mensagem: campoMensagem.value
    };

    fetch('https://atentus.com.br:3030/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(res => res.text())
    .then(alert)
    .catch(err => console.error('Erro:', err));
});

// Consultar cliente
document.getElementById('btn_consultar').addEventListener('click', () => {
    const cnpj = campoConsulta.value;

    fetch('https://atentus.com.br:3030/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj })
    })
    .then(res => {
        if (!res.ok) throw new Error('Cliente não encontrado');
        return res.json();
    })
    .then(data => {
        resultadoConsulta.innerText = `Nome: ${data.nome} | CNPJ: ${data.cnpj} | Protocolo: ${data.protocolo} | Mensagem: ${data.mensagem}`;
        campoMensagemAlterar.value = data.mensagem; // preencher o campo de alteração
    })
    .catch(err => {
        resultadoConsulta.innerText = err.message;
        campoMensagemAlterar.value = ''; // limpa o campo se falhar
    });
});

// Apagar cliente
document.getElementById('btn_apagar').addEventListener('click', () => {
    const cnpj = campoConsulta.value;

    fetch('https://atentus.com.br:3030/apagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj })
    })
    .then(res => res.text())
    .then(msg => {
        resultadoConsulta.innerText = msg;
        campoMensagemAlterar.value = '';
    })
    .catch(err => {
        resultadoConsulta.innerText = 'Erro ao apagar';
    });
});

// Alterar mensagem do cliente
document.getElementById('btn_alterar').addEventListener('click', () => {
    const cnpj = campoConsulta.value;
    const novaMensagem = campoMensagemAlterar.value;

    fetch('https://atentus.com.br:3030/alterar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj, novaMensagem })
    })
    .then(res => res.text())
    .then(msg => {
        resultadoConsulta.innerText = msg;
    })
    .catch(err => {
        resultadoConsulta.innerText = 'Erro ao alterar mensagem';
    });
});