const campoProtocolo = document.getElementById('campo_protocolo');
const campoNome = document.getElementById('campo_nome');
const campoCnpj = document.getElementById('campo_cnpj');
const campoMensagem = document.getElementById('campo_mensagem');
const campoConsulta = document.getElementById('campo_consulta');
const campoMensagemAlterar = document.getElementById('campo_mensagem_alterar');
const resultadoConsulta = document.querySelector('.resultado_consulta');
const campoMsgPadrao = document.getElementById('msgPadrao');
const campoMsgPadraoConsulta = document.getElementById('msgPadraoEsp');
const checkConsulta = document.getElementById('campoPadraoConsulta');
const modalCobranca = document.getElementById('modalCobranca');
const checkCobranca = document.getElementById('campoCobrancaConsulta');
const campoMsgCobrancaConsulta = document.getElementById('msgCobrancaEsp');
const chavePixUm = document.getElementById('chavePixUm');
const chavePixDois = document.getElementById('chavePixDois');

// Novos elementos para Neon
const modalNeon = document.getElementById('modalNeon');
const checkNeonConsulta = document.getElementById('campoNeonConsulta');
const campoMsgNeonConsulta = document.getElementById('msgNeonEsp');
const neonProcessamento = document.getElementById('neonProcessamento');
const neonConfirmado = document.getElementById('neonConfirmado');

// Novos elementos para Cora
const modalCora = document.getElementById('modalCora');
const checkCoraConsulta = document.getElementById('campoCoraConsulta');
const campoMsgCoraConsulta = document.getElementById('msgCoraEsp');
const coraProcessamento = document.getElementById('coraProcessamento');
const coraConfirmado = document.getElementById('coraConfirmado');

//Habilitar mensagem Cobranca
function msgCobranca() {
    if (document.getElementById('campoCobranca').checked) {
        document.getElementById('msgCobranca').textContent = 'Habilitada';
        document.getElementById('modalCobranca').style.display = 'flex';
    }else if(document.getElementById('campoCobrancaConsulta').checked) { 
        document.getElementById('msgCobrancaEsp').textContent = 'Habilitada';
        document.getElementById('modalCobranca').style.display = 'flex';
    }else {
        document.getElementById('msgCobranca').textContent = 'Desabilitada';
    }
}

//Habilitar mensagem Neon
function msgNeon() {
    if (document.getElementById('campoNeon').checked) {
        document.getElementById('msgNeon').textContent = 'Habilitada';
        document.getElementById('modalNeon').style.display = 'flex';
    } else if(document.getElementById('campoNeonConsulta').checked) { 
        document.getElementById('msgNeonEsp').textContent = 'Habilitada';
        document.getElementById('modalNeon').style.display = 'flex';
    } else {
        document.getElementById('msgNeon').textContent = 'Desabilitada';
    }
}

//Habilitar mensagem Cora
function msgCora() {
    if (document.getElementById('campoCora').checked) {
        document.getElementById('msgCora').textContent = 'Habilitada';
        document.getElementById('modalCora').style.display = 'flex';
    } else if(document.getElementById('campoCoraConsulta').checked) { 
        document.getElementById('msgCoraEsp').textContent = 'Habilitada';
        document.getElementById('modalCora').style.display = 'flex';
    } else {
        document.getElementById('msgCora').textContent = 'Desabilitada';
    }
}

function fecharModalCobranca() {
    document.getElementById('modalCobranca').style.display = 'none';
}

function fecharModalNeon() {
    document.getElementById('modalNeon').style.display = 'none';
}

function fecharModalCora() {
    document.getElementById('modalCora').style.display = 'none';
}

// Fechar modais clicando fora
window.addEventListener('click', function(event){
    if (event.target === modalCobranca){
        fecharModalCobranca();
    }
    if (event.target === modalNeon){
        fecharModalNeon();
    }
    if (event.target === modalCora){
        fecharModalCora();
    }
});

// Habilitar mensagem padrão
function msgPadrao() {
    if (document.getElementById('campoPadrao').checked) {
        document.getElementById('msgPadrao').textContent = 'Habilitada';
    } else {
        document.getElementById('msgPadrao').textContent = 'Desabilitada';
    }
}

// Gerar número aleatório
document.getElementById('btn_gerar_protocolo').addEventListener('click', () => {
    const numero = Math.floor(100000 + Math.random() * 900000);
    campoProtocolo.value = numero;
});

// Inserir dados
document.getElementById('btn_inserir_dados').addEventListener('click', () => {
    // Limpeza do CNPJ/CPF
    let cnpj = campoCnpj.value.replace(/[^\d]/g, ''); // remove tudo que não for número

    // Verifica se contém apenas dígitos
    if (!/^\d+$/.test(cnpj)) {
        alert('Erro: No campo CNPJ, insira apenas números (CPF ou CNPJ válido). Não são permitidas letras ou símbolos.');
        return; // impede o envio
    }

    const dados = {
        protocolo: campoProtocolo.value,
        nome: campoNome.value,
        cnpj: campoCnpj.value,
        mensagem: campoMensagem.value,
        mensPadrao: document.getElementById('campoPadrao').checked,
        pixUm: document.getElementById('chavePixUm').checked,
        pixDois: document.getElementById('chavePixDois').checked,
        neonProcessamento: document.getElementById('neonProcessamento').checked,
        neonConfirmado: document.getElementById('neonConfirmado').checked,
        coraProcessamento: document.getElementById('coraProcessamento').checked,
        coraConfirmado: document.getElementById('coraConfirmado').checked
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
    let cnpj = campoConsulta.value.replace(/[^\d]/g, '');
    const modalCobranca = document.getElementById('modalCobranca');
    const modalNeon = document.getElementById('modalNeon');
    const modalCora = document.getElementById('modalCora');

    if (!/^\d+$/.test(cnpj)) {
        alert('Erro: Para consultar, insira apenas números (CPF ou CNPJ válido). Não são permitidas letras ou símbolos.');
        return; // impede o envio
    }

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
        resultadoConsulta.innerText = `Protocolo: ${data.protocolo} | Nome: ${data.nome} | CNPJ: ${data.cnpj} |  Mensagem: ${data.mensagem}`;
        
        // Mensagem padrão
        if (data.msgPadrao === true) {
           checkConsulta.checked = true;
           campoMsgPadraoConsulta.textContent = 'Habilitada'; 
        } else {
            checkConsulta.checked = false;
            campoMsgPadraoConsulta.textContent = 'Desabilitada';
        }

        // PIX/Cobrança
        const hasPix = data.pixUm === true || data.pixUm === 'true' || data.pixDois === true || data.pixDois === 'true';
        checkCobranca.checked = hasPix;
        campoMsgCobrancaConsulta.textContent = hasPix ? 'Habilitada' : 'Desabilitada';

        if (hasPix) {
            modalCobranca.style.display = 'flex';
            chavePixUm.checked = data.pixUm === true || data.pixUm === 'true';
            chavePixDois.checked = data.pixDois === true || data.pixDois === 'true';
        } else {
            modalCobranca.style.display = 'none';
            chavePixUm.checked = false;
            chavePixDois.checked = false;
        }

        // Neon
        const hasNeon = data.neonProcessamento === true || data.neonProcessamento === 'true' || 
                       data.neonConfirmado === true || data.neonConfirmado === 'true';
        checkNeonConsulta.checked = hasNeon;
        campoMsgNeonConsulta.textContent = hasNeon ? 'Habilitada' : 'Desabilitada';

        if (hasNeon) {
            modalNeon.style.display = 'flex';
            neonProcessamento.checked = data.neonProcessamento === true || data.neonProcessamento === 'true';
            neonConfirmado.checked = data.neonConfirmado === true || data.neonConfirmado === 'true';
        } else {
            modalNeon.style.display = 'none';
            neonProcessamento.checked = false;
            neonConfirmado.checked = false;
        }

        // Cora
        const hasCora = data.coraProcessamento === true || data.coraProcessamento === 'true' || 
                       data.coraConfirmado === true || data.coraConfirmado === 'true';
        checkCoraConsulta.checked = hasCora;
        campoMsgCoraConsulta.textContent = hasCora ? 'Habilitada' : 'Desabilitada';

        if (hasCora) {
            modalCora.style.display = 'flex';
            coraProcessamento.checked = data.coraProcessamento === true || data.coraProcessamento === 'true';
            coraConfirmado.checked = data.coraConfirmado === true || data.coraConfirmado === 'true';
        } else {
            modalCora.style.display = 'none';
            coraProcessamento.checked = false;
            coraConfirmado.checked = false;
        }

        campoMensagemAlterar.value = data.mensagem;
        
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
        checkConsulta.checked = false;
        checkCobranca.checked = false;
        checkNeonConsulta.checked = false;
        checkCoraConsulta.checked = false;
    })
    .catch(err => {
        resultadoConsulta.innerText = 'Erro ao apagar';
    });
});

// Alterar mensagem do cliente
document.getElementById('btn_alterar').addEventListener('click', () => {
    const cnpj = campoConsulta.value;
    const novaMensagem = campoMensagemAlterar.value;
    const msgPadrao = checkConsulta.checked;
    const pixUm = chavePixUm.checked;
    const pixDois = chavePixDois.checked;
    const neonProc = neonProcessamento.checked;
    const neonConf = neonConfirmado.checked;
    const coraProc = coraProcessamento.checked;
    const coraConf = coraConfirmado.checked;

    fetch('https://atentus.com.br:3030/alterar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            cnpj, 
            novaMensagem, 
            msgPadrao, 
            pixUm, 
            pixDois, 
            neonProcessamento: neonProc, 
            neonConfirmado: neonConf, 
            coraProcessamento: coraProc, 
            coraConfirmado: coraConf 
        })
    })
    .then(res => res.text())
    .then(msg => {
        resultadoConsulta.innerText = msg;
    })
    .catch(err => {
        resultadoConsulta.innerText = 'Erro ao alterar mensagem';
    });
});