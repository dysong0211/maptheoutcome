// Offline adapter tests. Never call the network or spend credit.
require('./test-evidence.cjs');
const assert=require('node:assert/strict');
const {generateAI,aiConfiguration}=require('../src/lib/ai-server.ts');
const {aiSource}=require('../src/lib/ai-contract.ts');
const {initialSources}=require('../src/lib/program-memory.ts');
const source=aiSource(initialSources[0]);const passage=source.passages[0];
const request={mode:'ask',question:'What is supported?',sources:[source]};
const output={findings:[{title:'Supported text',kind:'Result',statement:'A reported signal, not causal proof.',limitation:'Synthetic fixture only.',sourceId:source.id,passageId:passage.id,locator:passage.locator,quote:passage.text.slice(0,60)}],nextSteps:[]};
const old={...process.env};const fetchBefore=global.fetch;
(async()=>{try{
process.env.AI_PROVIDER='gemini';process.env.MAPTOC_AI_ENABLED='true';process.env.GEMINI_API_KEY='test-placeholder';process.env.GEMINI_MODEL='gemini-test-model';assert.equal(aiConfiguration().provider,'gemini');assert.equal(aiConfiguration().ready,true);
let body;global.fetch=async(url,init)=>{assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent');assert.equal(init.headers['x-goog-api-key'],'test-placeholder');body=JSON.parse(init.body);return Response.json({candidates:[{content:{parts:[{text:JSON.stringify(output)}]}}]})};
const result=await generateAI(request);assert.equal(result.findings.length,1);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.ok(body.generationConfig.responseSchema);assert.ok(body.system_instruction);assert.ok(!JSON.stringify(result).includes('test-placeholder'));
for(const [status,message] of [[429,/quota or rate/],[503,/temporarily busy/],[403,/rejected/]]){global.fetch=async()=>new Response('',{status});await assert.rejects(generateAI(request),message)}
global.fetch=async()=>Response.json({candidates:[]});await assert.rejects(generateAI(request),/incomplete/);
global.fetch=async()=>Response.json({candidates:[{content:{parts:[{text:JSON.stringify({...output,findings:[{...output.findings[0],quote:'Fabricated quotation'}]})}]}}]});await assert.rejects(generateAI(request),/validated/);
global.fetch=async()=>{throw Error('offline')};await assert.rejects(generateAI(request),/timed out or could not connect/);
console.log('Gemini offline tests passed: provider selection, request schema, response validation, missing/bad citations, 429/503/403, incomplete response, connection failure.');
}finally{global.fetch=fetchBefore;for(const k of Object.keys(process.env))if(!(k in old))delete process.env[k];Object.assign(process.env,old)}})().catch(e=>{console.error(e);process.exitCode=1});
