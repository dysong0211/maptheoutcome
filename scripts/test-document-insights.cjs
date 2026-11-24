// Synthetic fixtures only; no external requests or API credits.
require('./test-evidence.cjs');
const assert = require('node:assert/strict');
const { useMemoryStore: store } = require('../src/stores/program-memory-store.ts');
const { useDemoStore: roles } = require('../src/stores/demo-store.ts');
const { aiSource, validateAIOutput, aiProviderOutputSchema } = require('../src/lib/ai-contract.ts');
const { initialSources } = require('../src/lib/program-memory.ts');
store.getState().reset(); roles.getState().setRole('program');
const source = initialSources[0];
const result = {
  document: { readable:true, type:'Field report', summary:'Reports prenatal outreach reach.', suggestedConnection:'Maternal care access' },
  findings:[{title:'Reported reach',kind:'Result',statement:'Reported reach was 1,240 women.',limitation:'Reach is not lasting impact.',sourceId:source.id,passageId:source.passages[0].id,quote:'Outreach activities reached 1,240 pregnant women',locator:source.passages[0].locator}],
  nextSteps:['Collect follow-up evidence.'],runId:'document-test',model:'mock',generatedAt:new Date().toISOString(),transcription:false,
};
assert.equal(aiProviderOutputSchema.safeParse(result).success,true);
assert.equal(aiProviderOutputSchema.safeParse({...result,document:undefined}).success,false);
const request = {mode:'analyze',question:'Analyze',sources:[aiSource(source)]};
assert.throws(()=>validateAIOutput({...result,document:{...result.document,readable:false}},request,false));
assert.throws(()=>validateAIOutput({...result,findings:[{...result.findings[0],quote:'invented'}]},request,false));
const before = store.getState().records.length;
const { overviewRecords } = require('../src/lib/overview-summary.ts');
const summaryCount = () => overviewRecords(store.getState().records, store.getState().sources).length;
const summaryBefore = summaryCount();
assert.equal(store.getState().addAIAnalysis(source,result),true);
assert.equal(store.getState().sources.find(s=>s.id===source.id).analysis.document.summary,result.document.summary);
const proposal = store.getState().proposals[0];
assert.equal(store.getState().prepareProposal(proposal.id,'kept','Edited reported reach.'),true);
assert.equal(store.getState().records.length,before);
assert.equal(summaryCount(),summaryBefore,'Keeping AI suggestions must not publish them to the overview');
assert.equal(store.getState().proposals[0].statement,result.findings[0].statement,'Original preserved');
assert.equal(store.getState().proposals[0].draftStatement,'Edited reported reach.');
assert.equal(store.getState().prepareProposal(proposal.id,'dismissed','Edited reported reach.'),true);
assert.equal(store.getState().proposals[0].status,'pending','Triage is not reviewer rejection');
assert.equal(store.getState().prepareProposal(proposal.id,'kept',''),false);
roles.getState().setRole('funder');
assert.equal(store.getState().prepareProposal(proposal.id,'kept','Unauthorized'),false);
roles.getState().setRole('reviewer');
assert.equal(store.getState().review(proposal.id,'approved','Edited reported reach.','Checked quote'),true);
assert.equal(store.getState().records.length,before+1);
assert.equal(summaryCount(),summaryBefore+1,'Reviewer-approved findings appear in the overview');
assert.equal(overviewRecords(store.getState().records,store.getState().sources)[0].proposalId,proposal.id,'Latest approved finding leads the summary');
assert.equal(overviewRecords(store.getState().records,[]).length,0,'Missing sources must not produce supported overview records');
roles.getState().setRole('program');
assert.equal(store.getState().prepareProposal(proposal.id,'dismissed','Too late'),false);
store.persist.rehydrate();
assert.equal(store.getState().sources.find(s=>s.id===source.id).analysis.runId,'document-test');
assert.ok(store.getState().events.some(e=>e.action==='SUGGESTION_PREPARED'));
console.log('Document insights passed: summary persistence, schema, invalid citations, role guards, triage/edit history, and approval separation.');
