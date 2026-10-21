const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');
const preload=fs.readFileSync(path.join(__dirname,'../electron/preload.cjs'),'utf8');
const types=fs.readFileSync(path.join(__dirname,'../src/types.d.ts'),'utf8');
test('file detail deep links expose a narrow read-only IPC lookup by ID',()=>{
 assert.match(main,/ipcMain\.handle\('filehub:get-file',[^;]*s\.getFile\(id\)/);
 assert.match(preload,/getFile:id=>ipcRenderer\.invoke\('filehub:get-file',id\)/);
 assert.match(types,/getFile\(id:string\):Promise<FileItem\|null>/);
});
