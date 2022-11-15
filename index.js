const fs = require("fs");
const { parse } = require("csv-parse");
const https = require('https');
const usuario = require('./usuario.json')

usuarios();
produto();
fornecedor();
pessoa();

function usuarios(){
  postData({ toString: () => 'http://localhost:3000/usuario' }, usuario)
  .then((data) => {
    console.log(data);
  });
}

function fornecedor(){
  fs.createReadStream("./fornecedor.csv")
  .pipe(parse({ delimiter: ",", from_line: 1 }))
  .on("data", function (row) {
    let pessoa = {
        nome: row[0],
        pessoa_juridica: row[8].replace(/\D/g, '').length==14?true:false,
        cnpj_cpf: row[8].replace(/\D/g, '')==''?null:row[8].replace(/\D/g, ''),
        endereco: row[2],
        cep: row[6].replace(/\D/g, '')==''?null:row[6].replace(/\D/g, ''),
        municipio: row[4],
        telefone: row[3].replace(/\D/g, '')==''?null:row[3].replace(/\D/g, ''),
        fornecedor: {
          data_aprov: new Date(row[9]),
          data_venc: new Date(row[12]),
          observacao: `${row[11]},
          ${row[10]}`,
        }
  }
  postData({ toString: () => 'http://localhost:3000/pessoa' }, pessoa)
  .then((data) => {
    console.log(data);
  });
})
}

function pessoa(){
  fs.createReadStream("./pessoa.csv")
  .pipe(parse({ delimiter: ",", from_line: 1 }))
  .on("data", function (row) {
    let pessoa = {
        nome: row[3]==""?row[2]:row[3],
        razao_social: row[3],
        pessoa_juridica: row[4]=="J"?true:false,
        cnpj_cpf: row[5].replace(/\D/g, '')==''?null:row[5].replace(/\D/g, ''),
        endereco: `${row[6]}, ${row[7]}, ${row[8]}, ${row[9]}`,
        cep: row[10].replace(/\D/g, '')==''?null:row[10].replace(/\D/g, ''),
        municipio: row[11],
        uf: row[12],
        email: row[13]==''?null:row[13],
        telefone: row[14].replace(/\D/g, '')==''?null:row[14].replace(/\D/g, ''),
  }
  postData({ toString: () => 'http://localhost:3000/pessoa' }, pessoa)
  .then((data) => {
    console.log(data);
  });
})
}

function produto(){
  fs.createReadStream("./produto.csv")
  .pipe(parse({ delimiter: ",", from_line: 1 }))
  .on("data", function (row) {
    let produto = {
      nome: row[0],
      categoria: row[2],
      espessura: Number(row[3].replace(',', '.')),
      peso: Number(row[4].replace(',', '.'))
  }
  postData({ toString: () => 'http://localhost:3000/produto' }, produto)
  .then((data) => {
    console.log(data); 
  });
})
}

async function postData(url = '', data = {}) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  // Default options are marked with *
  const response = await fetch(url, {
    agent: httpsAgent,
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'same-origin', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}


