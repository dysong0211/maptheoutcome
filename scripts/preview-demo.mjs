import {readFile,stat} from 'node:fs/promises';
import http from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../public-demo/out/',import.meta.url));
const port=Number(process.env.PORT || 3015);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname);
    if(pathname.split('/').some(part=>part.startsWith('.'))) throw Error('Hidden path');
    let file=resolve(root,`.${pathname}`);
    if(file!==resolve(root) && !file.startsWith(resolve(root)+sep))throw Error('Outside preview');
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`MapToc demo preview: http://127.0.0.1:${port}/dashboard/`));
