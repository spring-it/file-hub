const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('Electron entrypoint imports launch and native host helpers',()=>{
 const entry=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');
 assert.match(entry,/getOpenFileId\}=require\('\.\/launch-args\.cjs'\)/);
 assert.match(entry,/isNativeInvocation\}=require\('\.\/native-host-config\.cjs'\)/);
 assert.match(entry,/const native=isNativeInvocation\(process\.argv\)/);
});
test('Electron uses PNG instead of SVG for tray icon',()=>{
 const entry=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');
 assert.match(entry,/nativeImage\.createFromPath\(path\.join\(app\.getAppPath\(\),'assets\/icon\.png'\)\)/);
});
