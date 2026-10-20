const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');
test('ETW agent refreshes configuration when the elevated process connects late',()=>{
 assert.match(main,/const latestPrograms=getStore\(\)\.listPrograms\(\)\.filter\(p=>p\.enabled&&p\.mode==='combined'\)/);
 assert.match(main,/etwConfigSignature=JSON\.stringify\(latestPrograms\)/);
});
test('ETW startup timeout waits for ready handshake, not merely pipe connection',()=>{
 assert.match(main,/if\(!etwReady\)\{stopEtwAgent\(\);reportEtwError/);
 assert.match(main,/if\(event\.type==='ready'\)\{etwReady=true/);
});
