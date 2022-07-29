const puppeteer = require("puppeteer");
const config = require("./config.json");
const utils = require("./utils/utils");

const urlSescBertioga = "https://centrodeferias.sescsp.org.br/reserva.html";
const urlReserva = "https://reservabertioga.sescsp.org.br/bertioga-web/";
const emailLogin = config.user;
const passwordLogin = config.password;

// utils.sendBotMessage("Iniciando Bot Bertioga");

(async () => {
  const browser = await puppeteer.launch({
    // executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    slowMo: 50, // slow down by ms
    // devtools: true,
  });
  const page = await browser.newPage();

  await page.exposeFunction("existemEsgotados", utils.existemEsgotados);
  await page.exposeFunction("existemDisponiveis", utils.existemDisponiveis);
  await page.exposeFunction("getEsgotados", utils.getEsgotados);
  await page.exposeFunction("getDisponiveis", utils.getDisponiveis);
  await page.exposeFunction("getFlagDisponiveis", utils.getFlagDisponiveis);
  await page.exposeFunction("getFlagEsgotados", utils.getFlagEsgotados);
  await page.exposeFunction("setFlagDisponiveis", utils.setFlagDisponiveis);
  await page.exposeFunction("setFlagEsgotados", utils.setFlagEsgotados);
  await page.exposeFunction("sendBotMessage", utils.sendBotMessage);
  await page.exposeFunction("ehDisponiveis", utils.ehDisponiveis);
  await page.exposeFunction("ehEsgotados", utils.ehEsgotados);
  await page.exposeFunction("sleep", utils.sleep);
  await page.exposeFunction("log", utils.log);

  // Mostra console para o evaluate
  page.on("console", (consoleObj) => {
    if (consoleObj.type() === "log") {
      utils.log(consoleObj.text());
    }
  });

  try {
    await Promise.all([
      page.goto(urlReserva),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    const inputLogEmail = await page.waitForSelector("#logEmail");
    await inputLogEmail.type(emailLogin);
    const inputLogPassword = await page.waitForSelector("#logPassword");
    await inputLogPassword.type(passwordLogin);
    const btnLogin = await page.waitForSelector("#btnLogin");
    await btnLogin.click();

    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    await Promise.all([
      page.goto(urlReserva),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    utils.log("waitForNavigation - urlReserva");

    const matriculaOutroEstadoDiv = await page.waitForSelector(
      "div[heading='Sou matriculado em outro Estado']"
    );

    const matriculaOutroEstado = await matriculaOutroEstadoDiv.$("a");
    await matriculaOutroEstado.click({ delay: 250 });

    const btnMatriculaOutroEstado = await matriculaOutroEstadoDiv.$("button");
    await btnMatriculaOutroEstado.focus();
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    utils.log("waitForNavigation - Matrícula outro estado");

    const mesesDisponiveisDiv = await page.waitForSelector("div[ui-view='periodos@hospedagem']");
    const mesesDisponiveis = await mesesDisponiveisDiv.$$("button");
    /*
    if (mesesDisponiveis && mesesDisponiveis.length > 1) {
      utils.sendBotMessage(`Existem ${mesesDisponiveis.length} meses disponíveis no site. Verificar manualmente se há vagas nos meses diferentes de ${await (await mesesDisponiveis[0].getProperty("innerText")).jsonValue()}`);
    }*/
	
    let i = 0;
    for (const mesDisponivel of mesesDisponiveis) {
      const mesDisponivelStr = await (await mesDisponivel.getProperty("innerText")).jsonValue();

      // utils.log(mesDisponivel);
      utils.log(`Mês disponível: ${mesDisponivelStr}`);

      // const primeiroMesDisponivel = await mesesDisponiveisDiv.$("button");
      await mesDisponivel.focus();
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      utils.log("waitForNavigation - Mes disponível");

      await page.waitForSelector("a[href='#/hospedagem/compra-direta/1']");
      utils.log("Link de COMPRE AGORA carregado");

      const compreAgoraLink = await page.$("a[href='#/hospedagem/compra-direta/1']");
      compreAgoraLink.click();
      utils.log("click");

      await utils.sleep(5000);
      const btnDisponiveis = await page.waitForSelector("button[ng-model='tipoPeriodo']");
      if (btnDisponiveis) {
        utils.log("Botão Disponíveis encontrado");
      } else {
        const mensagemTmp = "Erro ao carregar COMPRE AGORA"
        utils.log(mensagemTmp);

        throw new Error(mensagemTmp)
      }

      /* const compreAgoraLink = await page.$('li[data-original-title="A distribuição.*"]');

      utils.log(compreAgoraLink);
      if (i > 0) {
        await compreAgoraLink.click();
        utils.log("click");
        await page.keyboard.press("Enter");
        utils.log("enter");
        await page.waitForNavigation({ waitUntil: "networkidle0" });
      } */
      i++;

      // const compreAgoraLink = await page.waitForSelector("a[href='#/hospedagem/compra-direta/1']");
      // utils.log(compreAgoraLink);
      // await compreAgoraLink.click({ delay: 250 });
      // compreAgoraLink.focus();
      // await page.keyboard.press("Enter");
      // await page.waitForNavigation({ waitUntil: "networkidle0" });

      utils.log("waitForNavigation - Compre Agora");
      // await page.waitForNavigation({ waitUntil: "networkidle0" });

      const disponiveisDiv = await page.waitForSelector("#container-sorteio");
      const disponiveisEsgotados = await disponiveisDiv.$$("button");

      await page.evaluate((p, mesStr) => {
        const btnList = p.querySelectorAll("button");
        log(btnList);

        if (!btnList || btnList.length === 0) {
          log("Erro: Botões não encontrados");
        } else {
          for (let j = 0; j < btnList.length; ++j) {
            const btn = btnList[j];
            const btnStr = btn.innerText;
  
            if (ehDisponiveis(btnStr)) {
              btn.addEventListener(
                "DOMCharacterDataModified",
                async () => {
                  log('Disponíveis - Evento DOMCharacterDataModified');
                  log(btnStr);
    
                  const flag = await getFlagDisponiveis();
                  if (await existemDisponiveis(btnStr)) {
                    if (!flag) {
                      await setFlagDisponiveis(true);
  
                      const mensagemTmp = `Existem vagas DISPONÍVEIS no SESC Bertioga em ${mesStr}: ${btnStr}`;
    
                      await sendBotMessage(mensagemTmp);
                      log(mensagemTmp);
                    }
                  }
                },
                false
              );
            } else if (ehEsgotados(btnStr)) {
              btn.addEventListener(
                "DOMCharacterDataModified",
                async () => {
                  log('Esgotados - Evento DOMCharacterDataModified');
                  log(btnStr);
    
                  const flag = await getFlagEsgotados();
                  if (await existemEsgotados(btnStr)) {
                    if (!flag) {
                      await setFlagEsgotados(true);
    
                      /*
                      const mensagemTmp = `Existem vagas ESGOTADAS no SESC Bertioga em ${mesStr}: ${btnStr}`;
                      await sendBotMessage(mensagemTmp);
    
                      log(mensagemTmp);
                       */
                    }
                  }
                },
                false
              );
            }
          }
        }
      }, disponiveisDiv, mesDisponivelStr);

      if (!disponiveisEsgotados || disponiveisEsgotados.length === 0) {
        utils.log("Erro ao buscar disponíveis e esgotados");
      } else {
        utils.log("Verificando botões DISPONÍVEIS e ESGOTADOS");
        for (let k = 0; k < disponiveisEsgotados.length; ++k) {
          const btn = disponiveisEsgotados[k];
          const btnStr = await btn.evaluate((e) => e.innerText);

          utils.log(btnStr);

          await btn.focus();

          if (utils.ehDisponiveis(btnStr)) {
            if (utils.existemDisponiveis(btnStr)) {
              utils.setFlagDisponiveis(true);

              const mensagemTmp = `Existem vagas DISPONÍVEIS no SESC Bertioga em ${mesDisponivelStr}: ${btnStr}`
              utils.sendBotMessage(mensagemTmp);
              utils.log(mensagemTmp);
            }
          } else if (utils.ehEsgotados(btnStr)) {
            if (utils.existemEsgotados(btnStr)) {
              utils.setFlagEsgotados(true);

              const mensagemTmp = `Existem vagas ESGOTADAS no SESC Bertioga em ${mesDisponivelStr}: ${btnStr}`
              utils.sendBotMessage(mensagemTmp);
              utils.log(mensagemTmp);
            }
          }
        }
      }
    }

    setTimeout(async () => {
      await browser.close();

      utils.log("Fim");
    }, 2000);
  } catch (e) {
    utils.log(e);
    await browser.close();
  }
})();
