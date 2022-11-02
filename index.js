const fs = require("fs");
const { parse } = require("csv-parse");
const https = require('https');

pessoa();
produto();

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
    console.log(data); // JSON data parsed by `data.json()` call
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
    console.log(data); // JSON data parsed by `data.json()` call
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


