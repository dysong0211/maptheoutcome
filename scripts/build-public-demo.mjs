import {cp,mkdtemp,symlink,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const scratch=await mkdtemp(join(tmpdir(),'maptoc-public-demo-'));
try {
  for(const name of ['src','package.json','next.config.ts','postcss.config.mjs','tsconfig.json','next-env.d.ts']) {
    await cp(join(root,name),join(scratch,name),{recursive:true,filter:source=>source!==join(root,'src','app','api')});
  }
  await symlink(join(root,'node_modules'),join(scratch,'node_modules'),'dir');
  const result=spawnSync(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:scratch,env:{...process.env,MAPTOC_STATIC_EXPORT:'1',MAPTOC_DEMO_BASE_PATH:'',NEXT_PUBLIC_LIGHT_DEMO:'0',NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error('Public demo build failed.');
  const destination=join(root,'public-demo','out');
  await mkdir(destination,{recursive:true});
  await cp(join(scratch,'out'),destination,{recursive:true});
  console.log('Public demo exported without API routes or local environment files.');
} finally { await rm(scratch,{recursive:true,force:true}); }
