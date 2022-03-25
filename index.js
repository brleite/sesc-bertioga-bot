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

  // Mostra console para o evaluate
  page.on("console", (consoleObj) => {
    if (consoleObj.type() === "log") {
      console.log(consoleObj.text());
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

    console.log("waitForNavigation - urlReserva");

    const matriculaOutroEstadoDiv = await page.waitForSelector(
      "div[heading='Sou matriculado em outro Estado']"
    );

    const matriculaOutroEstado = await matriculaOutroEstadoDiv.$("a");
    await matriculaOutroEstado.click({ delay: 250 });

    const btnMatriculaOutroEstado = await matriculaOutroEstadoDiv.$("button");
    await btnMatriculaOutroEstado.focus();
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    console.log("waitForNavigation - Matrícula outro estado");

    const mesesDisponiveisDiv = await page.waitForSelector("div[ui-view='periodos@hospedagem']");
    const mesesDisponiveis = await mesesDisponiveisDiv.$$("button");
    /*
    if (mesesDisponiveis && mesesDisponiveis.length > 1) {
      utils.sendBotMessage(`Existem ${mesesDisponiveis.length} meses disponíveis no site. Verificar manualmente se há vagas nos meses diferentes de ${await (await mesesDisponiveis[0].getProperty("innerText")).jsonValue()}`);
    }*/
	
    let i = 0;
    for (const mesDisponivel of mesesDisponiveis) {
      // console.log(mesDisponivel);
      console.log(
        `Mês disponível: ${await (await mesDisponivel.getProperty("innerText")).jsonValue()}`
      );

      // const primeiroMesDisponivel = await mesesDisponiveisDiv.$("button");
      await mesDisponivel.focus();
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      console.log("waitForNavigation - Mes disponível");


      // const compreAgoraLink = await page.$("a[href='#/hospedagem/compra-direta/1']");
      /* const compreAgoraLink = await page.$('li[data-original-title="A distribuição.*"]');

      console.log(compreAgoraLink);
      if (i > 0) {
        await compreAgoraLink.click();
        console.log("click");
        await page.keyboard.press("Enter");
        console.log("enter");
        await page.waitForNavigation({ waitUntil: "networkidle0" });
      } */
      i++;

      // const compreAgoraLink = await page.waitForSelector("a[href='#/hospedagem/compra-direta/1']");
      // console.log(compreAgoraLink);
      // await compreAgoraLink.click({ delay: 250 });
      // compreAgoraLink.focus();
      // await page.keyboard.press("Enter");
      // await page.waitForNavigation({ waitUntil: "networkidle0" });

      console.log("waitForNavigation - Compre Agora");
      // await page.waitForNavigation({ waitUntil: "networkidle0" });

      const disponiveisDiv = await page.waitForSelector("#container-sorteio");
      const disponiveisEsgotados = await disponiveisDiv.$$("button");

      await page.evaluate((p) => {
        const btnList = p.querySelectorAll("button");

        if (btnList.length !== 2) {
          console.log("Erro: Botões não encontrados");
        } else {
          btnList[0].addEventListener(
            "DOMCharacterDataModified",
            async () => {
              console.log(btnList[0].innerText);

              const flag = await getFlagDisponiveis();
              if (await existemDisponiveis(btnList[0].innerText)) {
                if (!flag) {
                  await setFlagDisponiveis(true);

                  await sendBotMessage(
                    `Existem vagas DISPONÍVEIS no SESC Bertioga: ${btnList[0].innerText}`
                  );

                  console.log(
                    `Existem vagas DISPONÍVEIS no SESC Bertioga: ${btnList[0].innerText}`
                  );
                }
              }
            },
            false
          );

          btnList[1].addEventListener(
            "DOMCharacterDataModified",
            async () => {
              console.log(btnList[1].innerText);

              const flag = await getFlagEsgotados();
              if (await existemEsgotados(btnList[1].innerText)) {
                if (!flag) {
                  await setFlagEsgotados(true);

                  /*
                  await sendBotMessage(
                    `Existem vagas ESGOTADAS no SESC Bertioga: ${btnList[1].innerText}`
                  );

                  console.log(`Existem vagas ESGOTADAS no SESC Bertioga: ${btnList[1].innerText}`);
                   */
                }
              }
            },
            false
          );
        }
      }, disponiveisDiv);

      if (disponiveisEsgotados.length !== 2) {
        console.log("Erro ao buscar disponíveis e esgotados");
      } else {
        // Disponíveis
        const disponiveis = disponiveisEsgotados[0];
        disponiveis.focus();

        // console.log(await disponiveis.evaluate((e) => e));

        // const disponiveisStr = await (await disponiveis.getProperty("innerText")).jsonValue();
        const disponiveisStr = await disponiveis.evaluate((e) => e.innerText);

        console.log(disponiveisStr);

        if (utils.existemDisponiveis(disponiveisStr)) {
          utils.setFlagDisponiveis(true);
          utils.sendBotMessage(`Existem vagas DISPONÍVEIS no SESC Bertioga: ${disponiveisStr}`);
        }

        // Esgotados
        const esgotados = disponiveisEsgotados[1];
        esgotados.focus();
        // const esgotadosStr = await (await esgotados.getProperty("innerText")).jsonValue();
        const esgotadosStr = await esgotados.evaluate((e) => e.innerText);

        console.log(esgotadosStr);

        /*
        if (utils.existemEsgotados(esgotadosStr)) {
          utils.setFlagEsgotados(true);
          utils.sendBotMessage(`Existem vagas ESGOTADAS no SESC Bertioga: ${esgotadosStr}`);
        }
        */
      }
    }

    setTimeout(async () => {
      await browser.close();

      console.log("Fim");
    }, 2000);
  } catch (e) {
    console.log(e);
    await browser.close();
  }
})();
