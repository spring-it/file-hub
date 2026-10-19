const test=require('node:test');
const assert=require('node:assert/strict');
const d=require('../shared/domain.cjs');

test('valid and invalid state transitions are explicit',()=>{
 assert.equal(d.nextStatus('PENDING_TAG','SAVE_TAG'),'TAGGED_PENDING_ARCHIVE');
 assert.equal(d.nextStatus('TAGGED_PENDING_ARCHIVE','ARCHIVE_SUCCESS'),'IN_LIBRARY');
 assert.equal(d.nextStatus('IGNORED','RESTORE'),'PENDING_TAG');
 assert.throws(()=>d.nextStatus('IN_LIBRARY','IGNORE'),/Invalid transition/);
 assert.throws(()=>d.nextStatus('UNKNOWN','IGNORE'),/Unknown status/);
});
test('annotation validation requires project, version, recipients, and valid send time',()=>{
 const invalid=d.validateAnnotation({});assert.equal(invalid.valid,false);
 assert.deepEqual(invalid.errors,['projectName','version','recipients','plannedSendAt']);
 const valid=d.validateAnnotation({projectName:' Project A ',version:'v1.2',recipients:'Alice, Bob;Carol',plannedSendAt:'2026-10-20T10:00'});
 assert.equal(valid.valid,true);assert.equal(valid.normalized.projectName,'Project A');assert.deepEqual(valid.normalized.recipients,['Alice','Bob','Carol']);
});
test('temporary file filtering is case insensitive',()=>{
 for(const p of ['C:/Downloads/a.CRDOWNLOAD','C:/Downloads/a.part','C:/Downloads/a.tmp','C:/Downloads/~$draft.docx'])assert.equal(d.isTemporaryFile(p),true,p);
 assert.equal(d.isTemporaryFile('C:/Downloads/report.pdf'),false);
});
test('excluded directories match only the directory and its descendants',()=>{
 assert.equal(d.isExcludedPath('C:/Users/a/AppData/Local/Temp/a.pdf',[]),true);
 assert.equal(d.isExcludedPath('D:/Project/cache/a.pdf',['D:/Project/cache']),true);
 assert.equal(d.isExcludedPath('D:/Project/cache-old/a.pdf',['D:/Project/cache']),false);
});
test('paths normalize separators and case for comparisons',()=>{
 assert.equal(d.normalizePath('C:\\\\Users\\\\A\\\\Downloads\\\\'),'c:/users/a/downloads');
});
