const fs = require("fs");
const { parse } = require("csv-parse");
const https = require("https");
const usuario = require("./usuario.json");
let pedidoCompraItems = [];
const moment = require("moment");

const Queue = require("queue-promise");

const queue = new Queue({
  concurrent: 1,
  interval: 100,
  start: true,
});

queue.on("resolve", (data) => console.log(data));
queue.on("reject", (error) => console.error(error));

const auth = postData(
  { toString: () => "http://localhost:2486/login" },
  { email: "linkiez@gmail.com", senha: "!Fabio12" }
);

auth.then((data) => {
  console.log(data);
  const token = data.accessToken;

  produto();
  fornecedor();
  pedidoCompra();
  pessoa();
});

function pedidoCompra(token) {
  fs.createReadStream("./pedidoCompraItem.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", function (row) {
      let item = {
        pedido: row[0],
        produto: row[1],
        dimensao: row[2],
        quantidade: row[3].replace(",", "."),
        peso: row[4].replace(",", "."),
        preco: row[5].replace(",", ".").replace("R$", "").replace(" ", ""),
        ipi: row[6].replace(",", "."),
        prazo: moment(row[7], "DD/MM/YYYY").toDate(),
      };
      pedidoCompraItems.push(item);
    });

  fs.createReadStream("./pedidoCompra.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", async (row) => {
      let pedido = {
        pedido: row[0],
        Fornecedor: row[1],
        data_emissao: moment(row[2], "DD/MM/YYYY").toDate(),
        cond_pagamento: row[3],
        frete: Number(row[4].replace(/\D/g, "")),
        transporte: row[5],
      };
      pedido.itens = pedidoCompraItems.filter(
        (item) => item.pedido === pedido.pedido
      );
      pedido.status = "Aprovado";
      pedido.total = 0;
      pedido.itens.forEach((item) => {
        pedido.total +=
          Number(item.peso) * Number(item.preco) * (Number(item.ipi) + 1) +
          Number(pedido.frete);
      });

      queue.enqueue(() =>
        postData(
          { toString: () => "http://localhost:3000/pedidocompra/import" },
          pedido,
          token
        )
      );
    });
}



function fornecedor(token) {
  fs.createReadStream("./fornecedor.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", function (row) {
      let pessoa = {
        nome: row[0],
        pessoa_juridica: row[8].replace(/\D/g, "").length == 14 ? true : false,
        cnpj_cpf:
          row[8].replace(/\D/g, "") == "" ? null : row[8].replace(/\D/g, ""),
        endereco: row[2],
        cep: row[6].replace(/\D/g, "") == "" ? null : row[6].replace(/\D/g, ""),
        municipio: row[4],
        telefone:
          row[3].replace(/\D/g, "") == "" ? null : row[3].replace(/\D/g, ""),
        fornecedor: {
          data_aprov: new Date(row[9]),
          data_venc: new Date(row[12]),
          observacao: `${row[11]},
          ${row[10]}`,
        },
      };
      queue.enqueue(() =>
        postData({ toString: () => "http://localhost:3000/pessoa" }, pessoa, token)
      );
    });
}

function pessoa(token) {
  fs.createReadStream("./pessoa.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", function (row) {
      let pessoa = {
        nome: row[3] == "" ? row[2] : row[3],
        razao_social: row[3],
        pessoa_juridica: row[4] == "J" ? true : false,
        cnpj_cpf:
          row[5].replace(/\D/g, "") == "" ? null : row[5].replace(/\D/g, ""),
        endereco: `${row[6]}, ${row[7]}, ${row[8]}, ${row[9]}`,
        cep:
          row[10].replace(/\D/g, "") == "" ? null : row[10].replace(/\D/g, ""),
        municipio: row[11],
        uf: row[12],
        email: row[13] == "" ? null : row[13],
        telefone:
          row[14].replace(/\D/g, "") == "" ? null : row[14].replace(/\D/g, ""),
      };
      queue.enqueue(() =>
        postData({ toString: () => "http://localhost:3000/pessoa" }, token)
      );
    });
}

function produto(token) {
  fs.createReadStream("./produto.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", function (row) {
      let produto = {
        nome: row[0],
        categoria: row[2],
        espessura: Number(row[3].replace(",", ".")),
        peso: Number(row[4].replace(",", ".")),
      };
      queue.enqueue(() =>
        postData({ toString: () => "http://localhost:3000/produto" }, produto, token)
      );
    });
}

async function postData(url = "", data = {}, token = null) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  // Default options are marked with *
  const response = await fetch(url, {
    agent: httpsAgent,
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "same-origin", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}
