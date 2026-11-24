const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const files=fs.readdirSync(path.join(root,'scripts')).filter(f=>/^test-.*\.cjs$/.test(f)).sort();
const results=files.map(file=>{
  const start=Date.now();
  const run=cp.spawnSync(process.execPath,[path.join(root,'scripts',file)],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024});
  const result={file,passed:run.status===0,exitCode:run.status,elapsedMs:Date.now()-start,output:(run.stdout||'')+(run.stderr||'')};
  console.log(`${result.passed?'PASS':'FAIL'} ${file}`);
  return result;
});
const report={date:new Date().toISOString(),scripts:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results};
const destination=path.join(root,'reports/advanced-grants-2026-10-16/regressions.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2));
console.log(JSON.stringify({scripts:report.scripts,passed:report.passed,failed:report.failed,report:destination}));
process.exitCode=report.failed?1:0;
