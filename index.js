const https = require('https');
const express = require('express');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { Client, LocalAuth, MessageTypes, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const compression = require('compression');


const app = express();
const PORT = 4000;

const cache = {
    msg: null,
    lastUpdate: { msg: 0 }
};

const CACHE_TTL = 300000;


let qrBase64 = '';
let isConnected = false;

// client criado com LocalAuth (reconecta automaticamente, por isso o cuidado extra)
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "serasa" }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--memory-pressure-off',
      '--max-old-space-size=512', // Limitar memória
      '--disable-features=TranslateUI,BlinkGenPropertyTrees'
    ],
    executablePath: null, // Deixar Puppeteer escolher
    slowMo: 100, // Adicionar delay entre ações
    defaultViewport: { width: 800, height: 600 }, // Viewport menor
    devtools: false
  }
});

// requisições do cors
app.use(cors({
  origin: 'https://atentus.com.br',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

app.use(compression());

//credenciais ssl
const credentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/atentus.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/atentus.com.br/fullchain.pem')
};

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/index', (req, res) => {
  console.log('🔍 Acessaram a página do QR code');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qr: qrBase64
  });
});

// Força como desconectado até o evento 'ready' acontecer
client.on('qr', async qr => {
  qrBase64 = await qrcode.toDataURL(qr);
  isConnected = false; // ainda não conectado
  console.log('📲 Novo QR Code gerado.');
});

client.on('ready', () => {
  isConnected = true;
  qrBase64 = '';
  chatbot();
  limpezaProgramada();
  console.log('✅ Chatbot conectado com sucesso!');
});

client.on('auth_failure', msg => {
  isConnected = false;
  console.error('❌ Falha de autenticação:', msg);
});

client.on('disconnected', reason => {
  isConnected = false;
  qrBase64 = '';
  console.log('🔌 Desconectado do WhatsApp:', reason);
});


const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(PORT, () => {
    console.log(`🌐 Servidor iniciado em http://localhost:${PORT}`);
  });


client.initialize();

//Funções de limpeza

function limparCache(tipo) {
  if (tipo === 'msg') {
    cache.msg = null;
    cache.lastUpdate.msg = 0;
    console.log('🧹 Cache de mensagens limpo');
  }else if (tipo === 'tudo') {
    cache.msg = null;
    cache.lastUpdate = { msg: 0 };
    console.log('🧹 Todo cache limpo');
  }
}

function limpezaEstado() {
    const agora = Date.now();
    const TIMEOUT_USUARIO = 1800000; // 30 minutos
    
    Object.keys(state).forEach(userId => {
        if (!state[userId].lastActivity) {
            state[userId].lastActivity = agora;
        }
        
        if (agora - state[userId].lastActivity > TIMEOUT_USUARIO) {
            delete state[userId];
        }
    });
}

setInterval(limpezaEstado, 600000); // A cada 10 minutos

function limpezaProgramada() {
  const data = new Date();
  const hora = data.getHours();
  if (hora === 3) {
      limparCache('tudo');
      console.log('🧹 Limpeza programada executada.');
  }
}

const state = {};

//Função para chatbot otimizado

function chatbot(){

    const now = Date.now();
  if (cache.msg && (now - cache.lastUpdate.msg) < CACHE_TTL) {
    console.log('📋 Usando msg do cache');
    return cache.msg;
  }
function saudacao() {
    const data = new Date();
    let hora = data.getHours();
    let str = '';
    if (hora >= 9 && hora < 15) {
        str = '*Bom dia,*';
    } else if (hora >= 15 && hora < 21) {
        str = '*Boa tarde,*';
    } else {
        str = '*Boa noite,*';
    }
    return str;
};

function atendente(){
    const data = new Date();
    const hora = data.getHours();
    const dia = data.getDay();
    let str = '';

    if (dia > 0 && dia < 6 && hora > 10 && hora < 22){
        str = '⏳ *Aguarde um momento, por favor!*\n\n😃 Um de nossos atendentes irá atendê-lo(a) de forma exclusiva em instantes.';
    
    }else if (dia === 6 && hora > 11 && hora < 15){
        str = '⏳ *Aguarde um momento, por favor!*\n\n😃 Um de nossos atendentes irá atendê-lo(a) de forma exclusiva em instantes.';

    }else if(dia === 0){
        str = '🏖️ *Aproveite o Domingo!*\n\n🕗 *Nosso horário de atendimento:*\n*Seg à Sex:* _07:00 às 19:00hs_\n*Sáb:* _08:00hs às 12:00hs_';

    }else{
        str = '😕 *Ops! Nosso expediente já foi encerrado por hoje!*\n\n😃 Mas não se preocupe, assim que retornarmos iremos falar com você!\n\n🕗 *Nosso horário de atendimento:*\n*Seg à Sex:* _07:00 às 19:00hs_\n*Sáb:* _08:00hs às 12:00hs_';
    }
    return str;

};

const delay = ms => new Promise (res => setTimeout(res, ms));


async function processarMensagens(msg) {

    if (msg.isGroup || msg.from.endsWith('@g.us')) {
        return;
    };

    // Funções auxiliares para envio de mensagens
    async function enviarMensagemTexto(texto) {
        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);
        await client.sendMessage(msg.from, texto);
    };

    async function enviarMensagemInicial(img, texto) {
        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);
        await client.sendMessage(msg.from, img, { caption: texto });
    };

    const from = msg.from;
    const mensagem = msg.body || msg.from.endsWith('@c.us');
    const chat = await msg.getChat();
    const contato = await msg.getContact();
    const nome = contato.pushname;
    const saudacoes = ['oi', 'bom dia', 'boa tarde', 'olá', 'Olá', 'Oi', 'Boa noite', 'Bom Dia', 'Bom dia', 'Boa Tarde', 'Boa tarde', 'Boa Noite', 'boa noite'];
    const logo = MessageMedia.fromFilePath('./assets/capa.jpg');
    const sauda = saudacao();
    const atendimento = atendente();
    const mensagemInicial = `😃 ${sauda} ${nome}!\n\n*📌 Seja bem vindo ao atendimento Serasa Experian!*\n_Canal exclusivo para regularização de débitos com rede de máquinas de cartão._\n\n💁‍♀️ *Como posso ajudar?*\n\n➡️ Por favor, digite o *NÚMERO* de uma das opções abaixo:\n\n1️⃣ *- Operadora*\n2️⃣ *- Acordo de Débitos*\n3️⃣ *- Maquininha/Débitos e Créditos*\n4️⃣ *- Baixa de Débitos*\n5️⃣ *- Certificado Digital*\n6️⃣ *- Carteira Digital Serasa*\n7️⃣ *- Tudo Sobre Score*\n8️⃣ *- Negocie e Limpe seu Nome*\n9️⃣ *- Ação Judicial Serasa*\n1️⃣0️⃣ *-Consulta protocolo*\n1️⃣1️⃣ *-Acompanhamento de processos TJ*\n\n*Tribunal de Justiça*\nhttps://www.tjsp.jus.br`;
    const imgCartDigital = MessageMedia.fromFilePath('./assets/carteira_digital.jpg');
    const cielo = MessageMedia.fromFilePath('./assets/cielo.jpg');
    const sumup = MessageMedia.fromFilePath('./assets/sumup.jpg');
    const mercadopago = MessageMedia.fromFilePath('./assets/mercadopago.jpg');
    const ceopag = MessageMedia.fromFilePath('./assets/ceopag.jpg');
    const ton = MessageMedia.fromFilePath('./assets/ton.jpg');
    const zettle = MessageMedia.fromFilePath('./assets/zettle.jpg');
    const safrapay = MessageMedia.fromFilePath('./assets/safrapay.jpg');
    const rede = MessageMedia.fromFilePath('./assets/rede.jpg');
    const infinitepay = MessageMedia.fromFilePath('./assets/infinitepay.jpg');
    const pagueseguro = MessageMedia.fromFilePath('./assets/pagueseguro.jpg');
    const turbopan = MessageMedia.fromFilePath('./assets/turbopan.jpg');
    const crediamigo = MessageMedia.fromFilePath('./assets/crediamigo.jpg');
    const nubank = MessageMedia.fromFilePath('./assets/nubank.jpg');
    const bancodobrasil = MessageMedia.fromFilePath('./assets/bb.jpg');
    const getnet = MessageMedia.fromFilePath('./assets/getnet_card.jpg');
    const score = MessageMedia.fromFilePath('./assets/score.jpg');
    const capa_site = MessageMedia.fromFilePath('./assets/capa_site.jpg');
    const pericles = MessageMedia.fromFilePath('./assets/pericles.jpg');
    const alegria = MessageMedia.fromFilePath('./assets/alegria.jpg');
    const megafone = MessageMedia.fromFilePath('./assets/nome.jpg');
    const opFive = MessageMedia.fromFilePath('./assets/opfive.jpg');
    const linksUteis = MessageMedia.fromFilePath('./assets/links_uteis.jpg');
    const carteiraDigital = MessageMedia.fromFilePath('./assets/carteiraDigital.jpg');
    const logoTjsp = MessageMedia.fromFilePath('./assets/img_tjsp.jpg');
    const msgPadraoTjsp = '⚖️ *Processo em andamento:* _Credor_\n\n🏦 *Banco:* _Itaú_\n*Agência:* _1370_\n*Endereço:* _Av. Barão de Itapura, 1003 - Vila Itapura, Campinas - SP, 13020-432_\n\n💬 *Mensagem:* _O credor avaliará a proposta podendo ser aceita ou recusada._\n\n💡 _O Devedor deverá cumprir rigorosamente os termos do acordo para evitar nova ação judicial._';
    const msgErroTjsp = '⚠️ *Processo não localizado na base pública!*\n\n_Entre em contato com o consultor e solicite uma chave válida!_';
    const tjspKey = '129300000BLT14';
    const mensagemCartao = '⚠️ *Sua empresa está NEGATIVADA!*\n\n➡️ A credora reivindica valores pendentes referentes aos serviços disponibilizados no aparelho, realizados por meio de crédito e débito.\n O valor fixado pela credora reclamante é de *R$798,00*, referente a cobrança anual pelo uso.\n\n💡 Está sendo liberado uma *ordem de pagamento pelo Feirão!*\nLiquide já a sua pendência pelo valor de *R$398,00* com *QUITAÇÃO IMEDIATA!*\n\n➡️ *129300000BLT14* é o número do protocolo de anuências, com este código eletrônico, sua empresa  está assegurada de apontamento no Score, Cadin Federal, CNPJ, Bacem e Spc.';
    const MAX_ATTEMPTS = 3;
    
    if (!state[from]) state[from] = { attempts: 0, step: 0 };
    const userState = state[from];

    if (userState.step === 0) {
        if (saudacoes.some(palavra => msg.body.includes(palavra))) {
            state[from].step = 1;
            await enviarMensagemInicial(logo, mensagemInicial);
            return;
        }
    } else if (userState.step === 1) {
        switch (mensagem) {
            case "1":
                await enviarMensagemInicial (capa_site, '💁‍♀️ Para falar de *operadoras* será necessário direcionar o seu atendimento a um de nossos especialistas para um atendimento exclusivo!');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "2":
                await enviarMensagemInicial(megafone, '💡 *Evite restrições comprometendo o seu score!*\n\nNegocie sua dívida agora mesmo!')
                await enviarMensagemTexto('Você pode negociar a sua dívida agora mesmo falando com um de nossos especialistas em um atendimento exclusivo!');
                await enviarMensagemInicial(linksUteis, '💡 Clientes dos bancos *Bradesco, Santander, Getnet, Caixa Econômica Federal* e *Itaú* podem solicitar a baixa diretamente por meio do aplicativo oficial.\n\nCaso a negativação esteja registrada em *cartório*, também é possível realizar a baixa pelo app correspondente.\n\n📲 Caso deseje, posso encaminhar o *link para download.*\n\n*Por favor, selecione uma das opções abaixo:* 👇\n\n1️⃣ - *Getnet*\n2️⃣ - *Santander*\n3️⃣ - *Caixa Econômica Federal*\n4️⃣ - *Itaú*\n5️⃣ - *Bradesco*\n6️⃣ - *Cartório*\n7️⃣ - *Continuar com o atendimento*');           
                state[from] = { step: 4 };
                return;

            case "3":
                await enviarMensagemInicial(carteiraDigital, '💁‍♀️ *Maravilha!*\nVou pedir para que selecione a operadora de sua máquina a seguir!');
                await enviarMensagemTexto('➡️ Por favor digite o *NÚMERO* de uma das opções baixo!\n\n1️⃣ *- Cielo*\n2️⃣ *- SumUp*\n3️⃣ *- Mercado Pago*\n4️⃣ *- Ceopag*\n5️⃣ *- Ton*\n6️⃣ *- Zettle*\n7️⃣ *- SafraPay*\n8️⃣ *- Rede*\n9️⃣ *- InfinitePay*\n1️⃣0️⃣ *- PagueSeguro*\n1️⃣1️⃣ *- Turbo Pan*\n1️⃣2️⃣ *- Crediamigo*\n1️⃣3️⃣ *- Nu Tap - Nubank*\n1️⃣4️⃣ *- Banco do Brasil*\n1️⃣5️⃣ *- Getnet*\n\n🎯 _Estamos prontos para ajudar com a sua escolha!_');
                state[from] = { step: 2 };
                return;

            case "4":
                await enviarMensagemInicial(alegria, '*Negocie e limpe o seu nome!*\n\n💬 Regularize sua situação financeira com agilidade e segurança.');
                await enviarMensagemTexto('Você pode regularizar o seu nome agora mesmo falando com um de nossos especialistas em um atendimento exclusivo!');
                await enviarMensagemInicial(linksUteis, '💡 Clientes dos bancos *Bradesco, Santander, Getnet, Caixa Econômica Federal* e *Itaú* podem solicitar a baixa diretamente por meio do aplicativo oficial.\n\nCaso a negativação esteja registrada em *cartório*, também é possível realizar a baixa pelo app correspondente.\n\n📲 Caso deseje, posso encaminhar o link para download.\nPor favor, selecione uma das opções abaixo: 👇\n\n1️⃣ - *Getnet*\n2️⃣ - *Santander*\n3️⃣ - *Caixa Econômica Federal*\n4️⃣ - *Itaú*\n5️⃣ - *Bradesco*\n6️⃣ - *Cartório*\n7️⃣ - *Continuar com o atendimento*');           
                state[from] = { step: 4 };
                return;

            case "5":
                await enviarMensagemInicial(opFive, '💡 O *Certificado Digital* é a forma mais segura de assinar seus documentos digitalmente e acessar sistemas online através de uma identidade eletrônica.');
                await enviarMensagemTexto('ℹ️ *Principais tipos de certificados digitais emitidos pela Serasa Experian!*\n\n*e-CPF* - Identidade digital para pessoas físicas, que permite assinar documentos digitalmente, consultar informações do Imposto de Renda e acessar sites do Governo.\n\n*e-Jurídico* - Identidade digital para advogados, que permite assinar documentos, acessar contratos do escritório, comunicar-se com a Receita Federal e enviar demonstrativos.\n\n*A3* - Certificado digital que pode ser armazenado em um cartão ou token, e que pode ser utilizado por pessoas físicas e jurídicas.');
                await enviarMensagemTexto('ℹ️ *Principais usos do Certificado Digital!*\n\n➡️ - Acessar e utilizar sistemas da administração pública na internet, como o eSocial e os serviços da Receita Federal;\n\n➡️ - Assinar documentos com o mesmo valor jurídico da assinatura de próprio punho;\n\n➡️ - Diminuir a burocracia do dia a dia.');
                await enviarMensagemTexto('⚠️ *AVISO IMPORTANTE*\nMudança na comercialização dos produtos de *Certificado Digital Serasa Experian!*\n\n➡️ - Os clientes que possuem certificado e-CNPJ, e-CPF e NF-e ativos seu certificado *permanecerá vigente até o vencimento.*\n\n➡️ - Clientes em renovação. *Não emitiremos novos certificados.*\nConsulte a lista de certificadoras para emitir um novo certificado.\n\n🔗 *LINK* para lista de certificadoras abaixo.👇\nhttps://listaars.iti.gov.br/index');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "6":
                await enviarMensagemInicial(carteiraDigital, 'Cuidar da sua vida financeira ficou ainda mais fácil com a *Carteira Digital Serasa!*');
                await enviarMensagemTexto('ℹ️ *Como funciona?*\n\n➡️ - A *Carteira Digital Serasa* chegou para facilitar ainda mais a vida de quem já utiliza os serviços da Serasa.\n\n➡️ - Além de poder utilizar em seu celular, smartwatch ou outro dispositivo móvel, você também pode acessá-la pela Internet, na sua área logada da Serasa.');
                await enviarMensagemTexto('😃 Além de prática e simples de usar, a *Carteira Digital Serasa* é econômica, pois você não paga taxas de manutenção.\n\n🔒 E, para quem tem dúvidas sobre a segurança da plataforma, *não precisa se preocupar:* _por ser integrada aos demais serviços da Serasa, a Carteira Digital é *100% confiável* e seus dados e recursos estarão completamente seguros nela._');
                await enviarMensagemInicial(imgCartDigital, '💡 *Como utilizar a Carteira Digital Serasa?*\n\n1️⃣ - Baixe o aplicativo da Serasa no *Google Play* ou *App Store.*\n\n2️⃣ - Faça login com seu CPF e senha.\nSe ainda não tiver um cadastro, pode criar o seu na hora, em poucos minutos e sem pagar nada.\n\n3️⃣ - Clique em Serviços e em Soluções, selecione Carteira Serasa.\n\n4️⃣ - Pronto agora você já pode usufruir dos serviços da carteira digital.\nCaso ainda não possua uma conta, ative sua conta digital de forma gratuita.');
                await enviarMensagemTexto('😃 Viu como é fácil?\n\n🔗 *Link para baixar no Google Play*👇\nhttps://play.google.com/store/apps/details?id=br.com.serasaexperian.consumidor&hl=pt_BR\n\n🔗 *Link para baixar na App Store*👇\nhttps://apps.apple.com/br/app/serasa-consulta-cpf-e-score/id1102452668');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "7":
                await enviarMensagemInicial(score, 'ℹ️ *O que é a Serasa Score?*\n\n➡️ - O *Serasa Score* é a pontuação que vai de 0 a 1000 e indica as chances do consumidor pagar as contas em dia nos próximos seis meses\n\n➡️ - É um modelo estatístico voltado para a análise de risco de crédito a partir de informações como consulta ao CPF, históricos de pagamentos de crédito, dívidas e outras.\n\n➡️ - Você pode consultar o seu score atualizado no site oficial do Serasa ou app.');
                await enviarMensagemTexto('🔗 *LINK do site oficial abaixo* 👇\nhttps://www.serasa.com.br/score/');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "8":
                await enviarMensagemInicial(pericles, '*Negocie e limpe o seu nome!*\n\n💬 Regularize sua situação financeira com agilidade e segurança.');
                await enviarMensagemTexto('Você pode regularizar o seu nome agora mesmo falando com um de nossos especialistas em um atendimento exclusivo!');
                await enviarMensagemInicial(linksUteis, '💡 Clientes dos bancos *Bradesco, Santander, Getnet, Caixa Econômica Federal* e *Itaú* podem solicitar a baixa diretamente por meio do aplicativo oficial.\n\nCaso a negativação esteja registrada em *cartório*, também é possível realizar a baixa pelo app correspondente.\n\n📲 Caso deseje, posso encaminhar o link para download.\nPor favor, selecione uma das opções abaixo: 👇\n\n1️⃣ - *Getnet*\n2️⃣ - *Santander*\n3️⃣ - *Caixa Econômica Federal*\n4️⃣ - *Itaú*\n5️⃣ - *Bradesco*\n6️⃣ - *Cartório*\n7️⃣ - *Continuar com o atendimento*');           
                state[from] = { step: 4 };
                return;

            case "9":
                await enviarMensagemInicial(capa_site, '⚖️ *Acão Judicial Serasa*\n\nPara tratar sobre ações judiciais do serasa, será necessário direcionar o seu atendimento para um de nossos especialistas.');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "10":
                await enviarMensagemInicial(capa_site, '*Perfeito*\n\nDigite o número do seu protocolo abaixo por favor:');
                state[from] = { step: 6 };
                return;

            case "11":
                await enviarMensagemInicial(logoTjsp, '*⚖️ Consulta processual TJSP*\n\nDigite o número do processo informado pelo atendente por favor:');
                state[from] = { step: 7 };
                return; 

            default:
                if (userState.attempts === undefined) userState.attempts = 0;
                userState.attempts++;
                const tentativasRestantes = MAX_ATTEMPTS - userState.attempts;
                if (userState.attempts >= MAX_ATTEMPTS) {
                    await client.sendMessage(
                        msg.from,
                        '❌ *Número de tentativas excedido!*\nAtendimento finalizado!\n\nDigite *Oi* para iniciar.'
                    );
                    state[from] = { step: 0, attempts: 0 };
                    delete state[from]; 
                } else {
                    await client.sendMessage(
                        msg.from,
                        `❌ *Opção inválida!*\nVocê tem mais ${tentativasRestantes} tentativa(s).`
                    );
                }
                return;
        }
    } else if (userState.step === 2) {
        switch (mensagem) {
            case "1":
                await enviarMensagemInicial(cielo, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "2":
                await enviarMensagemInicial(sumup, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 }; 
                return;

            case "3":
                await enviarMensagemInicial(mercadopago, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "4":
                await enviarMensagemInicial(ceopag, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "5":
                await enviarMensagemInicial(ton, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "6":
                await enviarMensagemInicial(zettle, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "7":
                await enviarMensagemInicial(safrapay, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "8":
                await enviarMensagemInicial(rede, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "9":
                await enviarMensagemInicial(infinitepay, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "10":
                await enviarMensagemInicial(pagueseguro, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "11":
                await enviarMensagemInicial(turbopan, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "12":
                await enviarMensagemInicial(crediamigo, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "13":
                await enviarMensagemInicial(nubank, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "14":
                await enviarMensagemInicial(bancodobrasil, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "15":
                await enviarMensagemInicial(getnet, mensagemCartao);
                await enviarMensagemTexto('🎯 *Nossa equipe de especialistas está pronta para te ajudar com este processo.*\n\n_Caso queira um atendimento para a regularização imediata é só digitar a opção *1* após o menu abaixo._');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
                

            default:
                if (userState.attempts === undefined) userState.attempts = 0;
                userState.attempts++;
                const tentativasRestantes = MAX_ATTEMPTS - userState.attempts;
                if (userState.attempts >= MAX_ATTEMPTS) {
                    await client.sendMessage(
                        msg.from,
                        '❌ *Número de tentativas excedido!*\nAtendimento finalizado!\n\nDigite *Oi* para iniciar.'
                    );
                    state[from] = { step: 0, attempts: 0 };
                    delete state[from]; 
                } else {
                    await client.sendMessage(
                        msg.from,
                        `❌ *Opção inválida!*\nVocê tem mais ${tentativasRestantes} tentativa(s).`
                    );
                }
                return;
        }
    }else if (userState.step === 3) {
        switch(mensagem) {
            case "1":
                await enviarMensagemTexto(`${atendimento}`);
                state[from] = { step: 5 };
                return;

            case "2":
                await enviarMensagemTexto('😉 *Tudo bem!*\nVamos começar de novo...');
                await enviarMensagemInicial(logo, mensagemInicial);
                state[from] = { step: 1 };
                return;

            case "3":
                await enviarMensagemInicial(capa_site, '*Obrigado por utilizar nosso atendimento!*\n\n_Até a próxima!_ 👋');
                delete state[from];
                return;

              
            default:
                if (userState.attempts === undefined) userState.attempts = 0;
                userState.attempts++;
                const tentativasRestantes = MAX_ATTEMPTS - userState.attempts;
                if (userState.attempts >= MAX_ATTEMPTS) {
                    await client.sendMessage(
                        msg.from,
                        '❌ *Número de tentativas excedido!*\nAtendimento finalizado!\n\nDigite *Oi* para iniciar.'
                    );
                    state[from] = { step: 0, attempts: 0 };
                    delete state[from]; 
                } else {
                    await client.sendMessage(
                        msg.from,
                        `❌ *Opção inválida!*\nVocê tem mais ${tentativasRestantes} tentativa(s).`
                    );
                }
                return;
        }
    }else if (userState.step === 4) {
        switch(mensagem) {
            case "1":
                await enviarMensagemTexto('💡 - Você que é cliente *Getnet* pode solicitar sua baixa através do aplicativo.\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=br.com.getnet.supergetmobile&hl=pt_BR\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://apps.apple.com/br/app/getnet-brasil/id1461510055');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "2":
                await enviarMensagemTexto('💡 - Você que é cliente *Santander* pode solicitar sua baixa através do aplicativo.\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=com.santander.app&hl=pt_BR\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://apps.apple.com/br/app/banco-santander-brasil/id613365711');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "3":
                await enviarMensagemTexto('💡 - Você que é cliente *Caixa Econômica Federal* pode solicitar sua baixa através do aplicativo.\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=br.com.gabba.Caixa&hl=pt_BR\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://apps.apple.com/br/app/caixa/id490813624');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;

            case "4":
                await enviarMensagemTexto('💡 - Você que é cliente *Itaú* pode solicitar sua baixa através do aplicativo.\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=com.itau&hl=pt_BR\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://apps.apple.com/br/app/banco-ita%C3%BA-conta-cart%C3%A3o-e/id474505665');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
    
            case "5":
                await enviarMensagemTexto('💡 - Você que é cliente *Bradesco* pode solicitar sua baixa através do aplicativo.\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=com.bradesco&hl=pt_BR\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://apps.apple.com/br/app/banco-bradesco/id336954985');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
    
            case "6":
                await enviarMensagemTexto('💡 - Para negativações registradas em *Cartório* você pode solicitar sua baixa através do aplicativo *CENPROT - Consulta de Protestos.*\n\n➡️ - *Link para baixar no Google Play.* 👇\nhttps://play.google.com/store/apps/details?id=br.com.timepix.cenprot\n\n➡️ - *Link para baixar na App Store.* 👇\nhttps://play.google.com/store/apps/details?id=br.com.timepix.cenprot');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
    
            case "7":
                await enviarMensagemTexto('💬 *Tudo Bem!*\nVamos dar continuidade ao seu atendimento.');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
    
            default:
                if (userState.attempts === undefined) userState.attempts = 0;
                userState.attempts++;
                const tentativasRestantes = MAX_ATTEMPTS - userState.attempts;
                if (userState.attempts >= MAX_ATTEMPTS) {
                    await client.sendMessage(
                        msg.from,
                        '❌ *Número de tentativas excedido!*\nAtendimento finalizado!\n\nDigite *Oi* para iniciar.'
                    );
                    state[from] = { step: 0, attempts: 0 };
                    delete state[from]; 
                } else {
                    await client.sendMessage(
                        msg.from,
                        `❌ *Opção inválida!*\nVocê tem mais ${tentativasRestantes} tentativa(s).`
                    );
                }
                return;
        }
    }else if (userState.step === 5){
        if (saudacoes.some(ignorar => msg.body.includes(ignorar))){
            await delay(2700000);
            delete state[from];
            return;
       
        }else if(!saudacoes.some(ignorando => msg.body.includes(ignorando))){
            await delay(2700000);
            delete state[from];
            return;

        }
    }else if (userState.step === 6) {
        const protocoloBuscado = msg.body.trim();
    
        fs.readFile('data.txt', 'utf-8', async (err, data) => {
            if (err) {
                await enviarMensagemTexto('❌ Erro ao ler os dados. Tente novamente mais tarde.');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
            }
    
            const linhas = data.split('\n').filter(l => l.trim() !== '');
            const resultado = linhas.find(linha => linha.startsWith(protocoloBuscado + ';'));
    
            if (!resultado) {
                await enviarMensagemTexto('🔍 Protocolo não encontrado. Verifique o número e tente novamente.');
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
                return;
            }
    
            const [protocolo, nome, cnpj, mensagemCliente, msgPadrao] = resultado.split(';');
            const imagemBaixado = MessageMedia.fromFilePath('./assets/img_baixado.jpg');

            if (msgPadrao === 'true') {
                await enviarMensagemInicial(imagemBaixado, `📄 *Dados encontrados:*\n\n📌 *Protocolo:* ${protocolo}\n👤 *Nome:* ${nome}\n📇 *CNPJ:* ${cnpj}\n💬 *Mensagem:* Seu título foi baixado com sucesso.`);
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };

            }else{
                await enviarMensagemTexto(`📄 *Dados encontrados:*\n\n📌 *Protocolo:* ${protocolo}\n👤 *Nome:* ${nome}\n📇 *CNPJ:* ${cnpj}\n💬 *Mensagem:* ${mensagemCliente}`);
                await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
                state[from] = { step: 3 };
        } 
    
          });
        return;
    }else if(userState.step === 7){
        if (msg.body === tjspKey){
            await enviarMensagemTexto(msgPadraoTjsp);
            await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
            state[from] = { step: 3 };
            return;
        }else{
            await enviarMensagemTexto(msgErroTjsp);
            await enviarMensagemTexto('💁‍♀️ - *O que deseja fazer agora?*\n\n1️⃣ *- Falar com um atendente*\n2️⃣ *- Retornar ao menu principal*\n3️⃣ *- Sair*');
            state[from] = { step: 3 };
            return;
        }
    }
    
cache.msg = true; // Indicar que sistema está ativo
            cache.lastUpdate.msg = now;
        } 
        client.on('message', async msg => {
    await processarMensagens(msg);
});


};
