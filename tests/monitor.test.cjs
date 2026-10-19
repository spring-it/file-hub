const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {createStore}=require('../electron/storage.cjs');
const {createMonitor}=require('../electron/monitor.cjs');
function fixture(t){const dir=fs.mkdtempSync(path.join(process.cwd(),'.filehub-monitor-'+randomUUID()+'-'));const watched=path.join(dir,'watch');fs.mkdirSync(watched);const store=createStore(path.join(dir,'db.sqlite'));store.addDirectory({directoryPath:watched,recursive:true});t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true})});return{dir,watched,store}}
test('monitor accepts a stable file, computes SHA-256 and emits one event',async t=>{const{watched,store}=fixture(t),target=path.join(watched,'spec.pdf');fs.writeFileSync(target,'file hub test payload');const events=[],monitor=createMonitor({store,onFileDetected:f=>events.push(f)});t.after(()=>monitor.stop());const file=await monitor.processCandidate(target);assert.equal(file.status,'PENDING_TAG');assert.match(file.sha256,/^[a-f0-9]{64}$/);await monitor.processCandidate(target);assert.equal(events.length,1);assert.equal(store.listFiles().length,1)});
test('monitor filters temporary files by default',async t=>{const{watched,store}=fixture(t),target=path.join(watched,'spec.pdf.crdownload');fs.writeFileSync(target,'partial');const monitor=createMonitor({store});t.after(()=>monitor.stop());assert.equal(await monitor.processCandidate(target),null);assert.equal(store.listFiles().length,0)});
test('documents-only setting filters unsupported extensions',async t=>{const{watched,store}=fixture(t);store.setSetting('documentsOnly',true);const target=path.join(watched,'installer.exe');fs.writeFileSync(target,'binary-ish');const monitor=createMonitor({store});t.after(()=>monitor.stop());assert.equal(await monitor.processCandidate(target),null);assert.equal(store.listFiles().length,0)});
