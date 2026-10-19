const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createStore}=require('../electron/storage.cjs');
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fh-test-'));const s=createStore(path.join(dir,'db.sqlite'));t.after(()=>{s.close();fs.rmSync(dir,{recursive:true,force:true})});return s}
const valid={projectName:'Project A',version:'v1.0',recipients:['Customer A','Customer B'],plannedSendAt:'2026-10-20T10:00',tags:['external'],notes:'Review before sending'};
test('file discovery deduplicates unchanged path, size, and mtime',t=>{const s=fixture(t),e={path:'C:/a.pdf',size:5,mtimeMs:7};assert.equal(s.recordDetection(e).created,true);assert.equal(s.recordDetection(e).created,false);assert.equal(s.getBootstrap().stats.pendingTag,1)});
test('invalid annotations are rejected without changing file state',t=>{const s=fixture(t),f=s.recordDetection({path:'C:/a.pdf',size:5,mtimeMs:7}).file;assert.throws(()=>s.saveAnnotation(f.id,{}),/填写|标记/);assert.equal(s.getFile(f.id).status,'PENDING_TAG')});
test('a file can enter the library only after valid annotation and archive path',t=>{const s=fixture(t),f=s.recordDetection({path:'C:/a.pdf',size:5,mtimeMs:7}).file;assert.throws(()=>s.setArchivedPath(f.id,'C:/copy.pdf','hash'),/必须先完成标记/);s.saveAnnotation(f.id,valid);assert.equal(s.getFile(f.id).status,'TAGGED_PENDING_ARCHIVE');const archived=s.setArchivedPath(f.id,'C:/copy.pdf','hash');assert.equal(archived.status,'IN_LIBRARY');assert.equal(archived.archivedPath,'C:/copy.pdf')});
test('ignore and restore are explicit and visible in stats',t=>{const s=fixture(t),f=s.recordDetection({path:'C:/a.pdf',size:5,mtimeMs:7}).file;s.ignoreFile(f.id);assert.equal(s.getFile(f.id).status,'IGNORED');assert.equal(s.getBootstrap().stats.ignored,1);s.restoreFile(f.id);assert.equal(s.getFile(f.id).status,'PENDING_TAG')});
test('program and directory settings persist',t=>{const s=fixture(t),id=s.addProgram({name:'Client',exePath:'C:/client.exe',mode:'directory'});s.addDirectory({directoryPath:'C:/downloads',programId:id,recursive:true});assert.equal(s.getBootstrap().directories.length,1);s.setSetting('popupOnNewFile',false);assert.equal(s.getBootstrap().settings.popupOnNewFile,false)});
test('browser mode accepts only Edge and Chrome executables',t=>{const s=fixture(t);assert.throws(()=>s.addProgram({name:'Bad Browser',exePath:'C:/client.exe',mode:'browser'}),/仅支持 Edge\/Chrome/);assert.doesNotThrow(()=>s.addProgram({name:'Chrome',exePath:'C:/Apps/chrome.exe',mode:'browser'}))});

test('deleting a program disables its associated directories instead of silently watching them as generic',t=>{const s=fixture(t),id=s.addProgram({name:'Client',exePath:'C:/client.exe',mode:'directory'});s.addDirectory({directoryPath:'C:/downloads',programId:id,recursive:true});s.deleteProgram(id);const dir=s.getBootstrap().directories[0];assert.equal(dir.enabled,false);assert.equal(dir.programId,null)});

test('browser event refines a generic directory source for the same file instance',t=>{const s=fixture(t);const discovered=s.recordDetection({path:'C:/Downloads/a.pdf',size:5,mtimeMs:7,sourceApp:'目录监听',sourceType:'client'}).file;const refined=s.refineDetectionSource('C:/Downloads/a.pdf',5,7,'Edge','browser');assert.equal(refined.id,discovered.id);assert.equal(refined.sourceApp,'Edge');assert.equal(refined.sourceType,'browser');assert.equal(refined.sourceRefined,true);const duplicate=s.refineDetectionSource('C:/Downloads/a.pdf',5,7,'Edge','browser');assert.equal(duplicate.sourceRefined,undefined)});

test('default directory is seeded only once and user removal persists',t=>{const s=fixture(t),dir=fs.mkdtempSync(path.join(os.tmpdir(),'fh-default-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));s.ensureDefaultDirectory(dir);assert.equal(s.getBootstrap().directories.length,1);s.deleteDirectory(s.getBootstrap().directories[0].id);s.ensureDefaultDirectory(dir);assert.equal(s.getBootstrap().directories.length,0)});

test('directory rules can be edited without losing enabled state',t=>{const s=fixture(t),id=s.addProgram({name:'Client',exePath:'C:/client.exe',mode:'directory'});s.addDirectory({directoryPath:'C:/downloads',programId:id,recursive:true});const directory=s.getBootstrap().directories[0];s.setDirectoryEnabled(directory.id,false);s.updateDirectory(directory.id,{directoryPath:'C:/downloads-v2',programId:id,recursive:false});const updated=s.getBootstrap().directories[0];assert.equal(updated.path,'C:/downloads-v2');assert.equal(updated.recursive,false);assert.equal(updated.enabled,false)});


test('statistics remain accurate when more files exist than the 2000-row display window',t=>{
  const s=fixture(t);
  for(let i=0;i<2005;i++)s.recordDetection({path:'C:/bulk/doc-'+i+'.pdf',size:10,mtimeMs:i+1});
  const bootstrap=s.getBootstrap();
  assert.equal(bootstrap.stats.pendingTag,2005);
  assert.equal(bootstrap.files.length,2000);
});
test('a browser monitor rule must name the actual browser executable',t=>{
  const s=fixture(t);
  assert.throws(()=>s.addProgram({name:'Impostor',exePath:'C:/tools/notchrome.exe',mode:'browser'}),/仅支持 Edge\/Chrome/);
  assert.throws(()=>s.addProgram({name:'Unsupported',exePath:'C:/tools/program.exe',mode:'combined'}),/尚未支持|不支持/);
});
