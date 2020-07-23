const { Builder, By, Key, until, error, promise } = require('selenium-webdriver');
let chrome = require('selenium-webdriver/chrome');
const imagesToPdf = require("images-to-pdf");
const dbc = require("./deathbycaptcha/deathbycaptcha.js");
const username = 'govfacil';
const password = 'Govfacil1010';
const loginApi = 'roboriograndedosul';
const passwordApi = 'Govfacilrs2020'

const unhandledRejections = new Map();



var fs = require('fs');
var FormData = require('form-data');
const querystring = require('querystring');
const axios = require('axios');
const rimraf = require('rimraf');
var form = new FormData();
const cron = require('node-cron');




promise.USE_PROMISE_MANAGER = false;



//cron.schedule("*/5 * * * *", () => example() );


example();
var cnpj, driver, data, token;

async function example() {

    await axios.post('http://localhost:3333/session', { login: loginApi, password: passwordApi })
        .then(function (response) {
            token = 'Bearer ' + response.data.token;
            console.log(token);
        })
        .catch(err => {
            return console.log(err)
        })

    await sleep(getRandomInt(1000, 7999))
    await axios.get('http://localhost:3333/certidao24horas/rs', { headers: { Authorization: token } })
        .then(async function (response) {
            //console.log(response.data.cnpj)
            console.log(response.data)
            cnpj = response.data.cnpj;
            id_ibge = response.data.id_ibge;
            autenticacao = response.data.autenticacao;
            await (getRandomInt(1000, 7999))
            await robot(cnpj,autenticacao, id_ibge);
            console.log("Cidade a ser consultada " + cnpj)
        }).catch(err => {
            return console.log('Não existe tarefa na fila ou API com problema');
        }) 
}

//robot("01611339000197");

async function robot(cnpj,autenticacao, id_ibge) {
    await alteraStatus(cnpj);


    driver = new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().setUserPreferences({ "download.default_directory": __dirname + '/download/' + cnpj, "plugins.always_open_pdf_externally": true }))
        .build()

    await driver.get('https://www.sefaz.rs.gov.br/SAT/CertidaoSitFiscalConsulta.aspx');
    await driver.findElement(By.xpath('//*[@id="fieldSetResult"]/table/tbody/tr[1]/td/input[2]')).sendKeys(cnpj);
    await driver.findElement(By.xpath('//*[@id="fieldSetResult"]/table/tbody/tr[2]/td/input')).sendKeys(autenticacao);

    await sleep(5000);

    const token_params = JSON.stringify({
        'proxy': '',
        'proxytype': '',
        'googlekey': '6LeQHh8TAAAAAIy0vAtOHLm62yhbmWxT9_HUoAnh',
        'pageurl': 'https://www.sefaz.rs.gov.br/SAT/CertidaoSitFiscalConsulta.aspx'
    });

    const client = new dbc.HttpClient(username, password);

    client.get_balance((balance) => {
        console.log(balance);
    });

    client.decode({ extra: { type: 4, token_params: token_params } }, async (captcha) => {

        if (captcha) {
            console.log(captcha['text']);

            var captchaenviar = captcha['text'];
            var formulario = `document.getElementById('g-recaptcha-response').innerHTML = '${captchaenviar}'`

            await driver.executeScript(formulario)
                .then(async formulario => {
                    //console.log(formulario);
                    await driver.findElement(By.xpath('//*[@id="arealistaRefResultado"]/fieldset[3]/input')).click();

                    try {
                        let alerta = await driver.switchTo().alert().getText();
                        await sleep(10000);
                        await driver.switchTo().alert().accept();
                        //console.log(alerta);

                        if (alerta.includes('Captcha inválido. Informe novamente.')) {
                            console.log('Captcha Inválido');
                            client.report(captcha['captcha'], (result) => {
                                console.log('Report status: ' + result);
                            });
                            await voltarParaFila(cnpj);
                        } else if (alerta.includes('Certidão em processamento.Consulte novamente em até 24 horas.')) {
                            console.log('Certidão em Processamento, consultar em 24 horas');
                            await alteraStatusSeduInexistente(id_ibge);
                            await atualizaNoApp(id_ibge);
                            await deletaTarefa(cnpj);

                        } else if (alerta.includes('Certidão disponível na área com senha ou na repartição da Receita Estadual mais próxima, mediante identificação.')) {
                            await alteraStatusSeduInexistente(id_ibge, token);
                            await deletaTarefa(cnpj);
                            await atualizaNoApp(id_ibge);
                            console.log('Cidade esta bem complicada')
                        } else if (alerta.includes('Certidão não encontrada')) {
                            await alteraStatusSeduInexistente(id_ibge, token);
                            await deletaTarefa(cnpj);
                            await atualizaNoApp(id_ibge);
                            console.log('Certidao não encontrada');
                        } else {
                            console.log('Outro Alerta');
                            await voltarParaFila(cnpj);
                        }

                        return true;
                    }   // try 
                    catch (err) {
                        //console.log(err);
                        return false;   // 93235968000188   89971758000180
                    }


                })
                .catch(err => {
                    console.log(err + 'ERRO')
                })

            await sleep(2000);
            if (await fs.existsSync('./download/' + cnpj + '/certidao.pdf')) {
                await finalizaNavegador();
                await enviaCertidaoSedu(cnpj);
                await deletaTarefa(cnpj);

                console.log('Certidão Baixada');
            } else {

                const pagina = await driver.getPageSource();


                const mensagemAguarde = await pagina.includes('AGUARDE 24 HORAS E REALIZE CONSULTA COM OS SEGUINTES DADOS:')
                console.log(mensagemAguarde);
                if (mensagemAguarde == true) {
                    console.log("MENSAGEM AGUARDE EXISTENTE")
                    //*[@id="aba_nft_0"]/fieldset/div/fieldset/div/table[1]/tbody/tr[2]/td[3]/b

                    const autenticacao = await driver.findElement(By.xpath("//*[@id=\"aba_nft_0\"]/fieldset/div/fieldset/div/table[1]/tbody/tr[2]/td[3]/b")).getText();

                    console.log("Código de autenticação: " + autenticacao);
                    await finalizaNavegador();
                    await alteraStatusSeduInexistente(id_ibge, token);
                    await insereNaFila24horas(id_ibge, cnpj, autenticacao);
                    await deletaTarefa(cnpj);
                    await atualizaNoApp(id_ibge);

                }
                await finalizaNavegador();
                
                console.log('Não baixou certidão por outro motivo')

            }


        }

    });

}

async function insereNaFila24horas(id_ibge, cnpj, autenticacao) {
    console.log(`Insere na fila 24 horas ID_IBGE: ${id_ibge}, CNPJ: ${cnpj}, AUTENTICAÇÃO: ${autenticacao}`)

    const data = { prioridade: "1", id_ibge, cnpj, autenticacao, item: '3', processando: null };
    await axios.post('http://localhost:3333/certidao24horas', data, { headers: { Authorization: token } })
        .then(async function (response) {
            console.log('A cidade: ' + id_ibge + ' foi inseriida na fila de 24 horas');
        })
        .catch(err => {
            return console.log('Não foi possivel inserir a cidade na fila ' + err)
        })

}


async function atualizaNoApp(id_ibge) {
    console.log("ATUALIZA NO APP: " + id_ibge);
    await axios.get('http://localhost:3333/atualizaapp/' + id_ibge, { headers: { Authorization: token } })
        .then(function (response) {
            console.log("Atualizado no App")
        })
        .catch(err => {
            return console.log('Fudeu por algum motivo')
        })
}

/** alterar o status das certidões inexistentes */

async function alteraStatusSeduInexistente(id_ibge) {
    var data = { id_ibge, id_item: '3' };
    await axios.post('http://localhost:3333/sedu/', data, { headers: { Authorization: token } })
        .then(async function (response) {
            console.log('O Status da certidão da cidade ' + id_ibge + ' foi alterado');
            //await  atualizaNoApp(id_ibge);
        })
        .catch(err => {
            return console.log('Não foi possivel alterar o status da certidão ' + err)
        })

}

/**fim  */

/*coloca o CNPJ em processamento */

async function alteraStatus(cnpj) {
    data = { cnpj }
    await axios.put('http://localhost:3333/certidao24horas/', data, { headers: { Authorization: token } })
        .then(function (response) {
            console.log("Status Alterado");
            return console.log("resposta" + response.data.processando)
        }).catch(err => {
            return console.log('Não existe tarefa na fila');
        })
}
/* fim da funcao alteraStatus*/


/* função para esperar */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/* fim função para esperar */

/* função para pegar valor randomico dinamica passanod min e max */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
/* fim da funcao randomInt */


async function voltarParaFila(cnpj) {
    data = { cnpj }
    await axios.put('http://localhost:3333/certidaofalha', data, { headers: { Authorization: token } })
        .then(function (response) {
            console.log("resposta" + response.data.processando)
        }).catch(err => {
            return console.log('Não existe tarefa na fila ou api com problema');
        })
}

//funcao para finalizar Browser

async function finalizaNavegador() {
    try {
        await driver.quit();
        return "ok";
    } catch {
        return "erro";
    }
}

//fim da funcao finalizaNavegador


// função para enviar certidão

async function enviaCertidaoSedu(cnpj) {
    form.append('tipo', '3');
    form.append('arquivo[]', fs.createReadStream('./download/' + cnpj + '/certidao.pdf'));
    formHeaders = form.getHeaders();
    axios.post('https://robot.govfacilbrasil.com.br/webservice/dados/sedu/recebe_upload_automatico.php', form, {
        headers: {
            ...formHeaders,
        },
    }).then(function (response) {
        console.log('PDF ENVIADO');
        rimraf("./download/" + cnpj, function () {
            console.log("Certidão enviada")
        })
    })
        .catch(function (error) {
            console.log("erro ao enviar certidao " + error)
            robot(cnpj);
        })

}

async function deletaTarefa(cnpj) {
    data = { cnpj }
    await axios.delete('http://localhost:3333/certidao', { headers: { Authorization: token }, data })
        .then(function (response) {
            console.log("Tarefa Deletetada")
        })
}

//fim da função de enviar

process.on('unhandledRejection', (reason, promise) => {
    console.log("Entrou aqui");
    unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
    console.log("Entrou aqui2")
    unhandledRejections.delete(promise);
});
