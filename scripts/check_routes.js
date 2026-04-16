const http = require('http');

function check(path){
  return new Promise((res)=>{
    http.get({host:'localhost',port:3001,path,timeout:5000},(r)=>{
      console.log(`${path} -> ${r.statusCode} ${r.headers.location || ''}`);
      res();
    }).on('error',(e)=>{console.log(`${path} -> ERR ${e.message}`); res();});
  })
}

(async()=>{
  await check('/');
  await check('/dashboard');
})();
