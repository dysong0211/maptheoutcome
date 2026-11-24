require('./test-evidence.cjs');
const assert=require('node:assert/strict');
const {emptyAssurance,transition,allEvidence,controlInputs,fingerprint}=require('../src/lib/assurance.ts');
const {anchorFor,configuredControl,configureWorkspace,validateProgram,minorUnits}=require('../src/lib/program-assurance.ts');
const {caseFresh}=require('../src/lib/clarifications.ts');
const {initialSources}=require('../src/lib/program-memory.ts');
const {createProgramExample}=require('../src/lib/program-assurance-examples.ts');
const themes=['Maternal health','School nutrition','Community water','Climate adaptation','Civic advocacy','Refugee livelihoods','Child protection','Mine action','Disability inclusion','Rural roads','Social cash transfers','Food security','Renewable energy','Women’s rights','Youth organising','Local governance','Emergency sanitation','Community forestry','Disaster recovery','Agricultural livelihoods'];
const methods=['budget-approval','required-document','reported-result','ledger-reconciliation','deadline'];
let assertions=0,total=0,failures=[];
const ok=(v,message)=>{assertions++;assert.ok(v,message);};
const format=(cents,decimals=2)=>{const scale=BigInt(10**decimals);return `${cents/scale}${decimals?'.'+String(cents%scale).padStart(decimals,'0'):''}`;};
for(let t=0;t<20;t++)for(let v=0;v<50;v++){
 const id=`program-${t}-${v}`,method=methods[v%5],fault=Math.floor(v/5),year=2012+t%14,start=`${year}-07-01`,end=`${year+1}-06-30`,from=`${year}-08-01`,to=`${year}-08-31`,currency=t%5===2?'XOF':t%5===1?'EUR':'USD',decimals=currency==='XOF'?0:2,scale=BigInt(10**decimals),base=BigInt([2500,25000,250000,2500000,25000000][t%5])*scale,threshold=String([0,5,10,15,20][t%5]);
 const sources=[];
 const doc=(suffix,text)=>{const source={id:`${id}-${suffix}`,programId:id,title:`${themes[t]} ${suffix}`,version:1,sourceDate:to,passages:[{id:suffix+'-p',locator:'Original synthetic passage',text}]};sources.push(source);return source;};
 const clause=doc('requirement',`${themes[t]} donor requirements: review ${threshold}% budget increases; retain delivery sources; reconcile the same-period ledger; report by ${year}-10-01.`);
 const datum=(key,value)=>{const d={id:key,label:key,value,currency,line:`${themes[t]} activity`,periodStart:from,periodEnd:to,reviewedBy:'Test reviewer',anchor:anchorFor(doc(key,`${currency} ${value} units for ${from} to ${to}; ${themes[t]}.`))};return d;};
 const data=[datum('allocation',format(base,decimals)),datum('spend',format(base+base/2n,decimals)),datum('approval',format(base+base/2n,decimals)),datum('result',String(50+t)),datum('ledger-one',format(base,decimals)),datum('ledger-two',format(base/2n,decimals)),datum('submitted','1')];
 data[2].approvalStatus='approved';data[2].authorizedBy='Synthetic donor officer';data[2].eventDate=`${year}-08-01`;data[1].eventDate=`${year}-08-15`;data[3].unit='households';data[6].eventDate=`${year}-09-30`;
 const submissionSource=sources.find(s=>s.id===data[6].anchor.sourceId);submissionSource.passages[0].text=`Final report submitted on ${data[6].eventDate}.`;data[6].anchor=anchorFor(submissionSource);
 const rule={id:'check',title:`Review ${themes[t].toLowerCase()}`,method,requirement:clause.passages[0].text,clause:anchorFor(clause),why:'Apply the configured donor requirement to this program.',owner:'Assurance reviewer',line:`${themes[t]} activity`,inputIds:method==='budget-approval'?['allocation','spend','approval']:method==='reported-result'?['result']:method==='ledger-reconciliation'?['spend','ledger-one','ledger-two']:method==='deadline'?['submitted']:[],sourceIds:method==='required-document'?[data[3].anchor.sourceId]:[],thresholdPercent:threshold,approvalMode:'ceiling',due:`${year}-10-01`};
 const p={id,name:`Synthetic ${themes[t]}`,country:`Location ${t+1}`,theme:themes[t],donor:`Donor ${t+1}`,objective:'Track delivery and evidence.',start,end,periodStart:from,periodEnd:to,currency,decimals,rules:[rule],data,followups:[],activities:[],sample:false};
 const changeValue=(d,value)=>{d.value=value;const source=sources.find(s=>s.id===d.anchor.sourceId);source.passages[0].text=`${currency} ${value} units for ${from} to ${to}; ${themes[t]}.`;d.anchor=anchorFor(source);};
 let expected='Passed';
 try{
 if(method==='budget-approval'){
   if(fault===0)changeValue(data[1],format(base,decimals));
   if(fault===1){data[2].anchor=undefined;expected='Potential exception';}
   if(fault===3){data[2].authorizedBy='';expected='Potential exception';}
   if(fault===4){data[1].periodEnd=`${year}-09-30`;expected='Unable to test';}
   if(fault===5){data[1].line='Other donor line';expected='Unable to test';}
   if(fault===6){changeValue(data[2],format(base+base/2n-1n,decimals));expected='Potential exception';}
   if(fault===7){rule.priorApproval=true;data[2].eventDate=`${year}-08-30`;expected='Potential exception';}
   if(fault===8){changeValue(data[0],'0');expected='Unable to test';}
   if(fault===9)expected='Unable to test';
 }else if(method==='required-document'){
   if(fault===1){sources.splice(sources.findIndex(s=>s.id===rule.sourceIds[0]),1);expected='Unable to test';}
   if(fault===2){sources.find(s=>s.id===rule.sourceIds[0]).passages=[];expected='Unable to test';}
   if(fault===3){sources.find(s=>s.id===rule.sourceIds[0]).programId='another-program';expected='Unable to test';}
   if(fault===4){rule.clause=undefined;expected='Unable to test';}
   if(fault===5){clause.version++;expected='Unable to test';}
   if(fault===6){rule.sourceIds=['finance-v1'];expected='Unable to test';}
   if(fault===7){rule.clause.quote='Not present';expected='Unable to test';}
   if(fault===8){rule.sourceIds.push('not-uploaded');expected='Unable to test';}
   if(fault===9){rule.sourceIds=[];expected='Unable to test';}
 }else if(method==='reported-result'){
   if(fault===1){rule.target='999';expected='Potential exception';}
   if(fault===2){data[3].reviewedBy='';expected='Unable to test';}
   if(fault===3){data[3].anchor.quote='Missing passage';expected='Unable to test';}
   if(fault===4){data[3].periodStart=`${year}-07-01`;expected='Unable to test';}
   if(fault===5){data[3].value='99999';expected='Unable to test';}
   if(fault===6){data[3].line='Other activity';expected='Unable to test';}
   if(fault===7){rule.method='unknown-adapter';expected='Unable to test';}
   if(fault===8){changeValue(data[3],'0');rule.target='1';expected='Potential exception';}
 }else if(method==='ledger-reconciliation'){
   if(fault===1){rule.inputIds=['spend','ledger-one'];expected='Potential exception';}
   if(fault===2){data.splice(data.findIndex(d=>d.id==='ledger-two'),1);expected='Unable to test';}
   if(fault===3){data[4].periodEnd=`${year}-09-30`;expected='Unable to test';}
   if(fault===4&&decimals>0){changeValue(data[1],format(base+base/2n+1n,decimals));changeValue(data[5],format(base/2n+1n,decimals));}
   if(fault===5){sources.find(s=>s.id===data[4].anchor.sourceId).version++;expected='Unable to test';}
   if(fault===6){data[4].reviewedBy='';expected='Unable to test';}
   if(fault===7){data[4].value='-1';expected='Unable to test';}
   if(fault===8){data[4].line='Other allocation';expected='Unable to test';}
   if(fault===9){rule.clause.quote='Changed requirement';expected='Unable to test';}
 }else{
   if(fault===1){data[6].eventDate=`${year}-10-02`;submissionSource.passages[0].text=`Final report submitted on ${data[6].eventDate}.`;data[6].anchor=anchorFor(submissionSource);expected='Potential exception';}
   if(fault===2){data[6].eventDate=undefined;expected='Unable to test';}
   if(fault===3){rule.due=undefined;expected='Unable to test';}
   if(fault===4){sources.find(s=>s.id===data[6].anchor.sourceId).programId='other';expected='Unable to test';}
   if(fault===5){data[6].reviewedBy='';expected='Unable to test';}
   if(fault===6){data[6].periodEnd=`${year}-09-30`;expected='Unable to test';}
   if(fault===7)expected='Unable to test';
   if(fault===8){sources.find(s=>s.id===data[6].anchor.sourceId).sourceDate=`${year}-09-01`;expected='Unable to test';}
   if(fault===9){data[6].eventDate=`${year}-02-30`;expected='Unable to test';}
 }
 if(method==='deadline'&&fault===9){assert.throws(()=>validateProgram(p),/valid evidence event date/);assertions++;total++;continue;}
 validateProgram(p);
 let s={...emptyAssurance(),program:p,addedSources:sources,controls:[configuredControl(rule,id)]};
 if(!(fault===9&&method==='budget-approval')&&!(fault===7&&method==='deadline'))s=transition(s,{type:'confirm',id:'check'},'reviewer',initialSources,to,`${id}-confirm`);
 if(s.controls[0].status==='confirmed')s=transition(s,{type:'test',id:'check'},'reviewer',initialSources,to,`${id}-test`);
 const actual=s.runs.at(-1)?.outcome||'Unable to test';ok(actual===expected,`${id} ${method}/${fault}: expected ${expected}, got ${actual}: ${s.runs.at(-1)?.explanation}`);
 ok(allEvidence(s,initialSources).every(source=>source.programId===id),'No evidence leakage from the Cambodia program');
 if(actual==='Passed')ok(/impact|authenticity/i.test(s.runs.at(-1).limitation),'Bound the conclusion of a passed documentary check');
 total++;
 }catch(e){total++;failures.push({id,method,fault,error:e.message});}
}
// Real store: independent programs, role guards, persistence and rule invalidation.
const {useAssurance}=require('../src/stores/assurance-store.ts'),{useDemoStore}=require('../src/stores/demo-store.ts');
useDemoStore.getState().setRole('program');useAssurance.getState().reset();useAssurance.getState().sync();const original=useAssurance.getState().workspace.program.id;
useAssurance.getState().addProgram('education');const second=useAssurance.getState().workspace.program.id;ok(second!==original,'Separate program identifiers');useAssurance.getState().dispatch({type:'case-owner',id:'delivery-upload',owner:'Education field lead'});useAssurance.getState().selectProgram(original);ok(!useAssurance.getState().workspace.findings.some(f=>f.owner==='Education field lead'),'No case leakage');useAssurance.getState().selectProgram(second);ok(useAssurance.getState().workspace.findings.find(f=>f.id==='delivery-upload').owner==='Education field lead','Assignment survives program switching');
const snapshot=JSON.parse(global.localStorage.getItem('maptoc-v1-assurance-v1'));ok(snapshot.state.savedPrograms[original].program.id===original,'Prior program persisted');
useDemoStore.getState().setRole('funder');assert.throws(()=>useAssurance.getState().configure(useAssurance.getState().workspace.program),/read-only/);assertions++;
const example=createProgramExample('education','rule-revision'),p=example.program;let state={...emptyAssurance(),program:p,addedSources:example.sources,controls:p.rules.map(r=>configuredControl(r,p.id))};state=transition(state,{type:'confirm',id:p.rules[0].id},'reviewer',[],p.periodEnd,'confirm');state=transition(state,{type:'test',id:p.rules[0].id},'reviewer',[],p.periodEnd,'run');const oldRun=JSON.stringify(state.runs[0]);let edit=JSON.parse(JSON.stringify(p));edit.rules[0].thresholdPercent='1';state=configureWorkspace(state,edit,'program','2026-09-01');ok(state.controls[0].status==='proposed','Changed donor rule requires new confirmation');ok(JSON.stringify(state.runs[0])===oldRun,'Original run preserved');edit=JSON.parse(JSON.stringify(state.program));edit.data[0].value='999';state=configureWorkspace(state,edit,'program','2026-09-02');ok(!state.program.data[0].reviewedBy,'Staff edits clear source review');
const invalidTarget=JSON.parse(JSON.stringify(p));invalidTarget.rules.find(r=>r.method==='reported-result').target='not-a-number';assert.throws(()=>validateProgram(invalidTarget),/valid non-negative delivery target/);assertions++;
const duplicateFigure=JSON.parse(JSON.stringify(p));duplicateFigure.rules.find(r=>r.method==='ledger-reconciliation').inputIds=['spend','spend'];assert.throws(()=>validateProgram(duplicateFigure),/only once/);assertions++;
console.log(JSON.stringify({scenarios:total,passed:total-failures.length,failed:failures.length,assertions,failures:failures.slice(0,20)},null,2));process.exitCode=failures.length?1:0;
