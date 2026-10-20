const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../src/App.tsx'),'utf8');
test('download monitoring and tagging use a single page and navigation item',()=>{
 assert.match(app,/type Page='home'\|'monitor'\|'library'\|'settings'/);
 assert.doesNotMatch(app,/page==='pending'/);
 assert.doesNotMatch(app,/\['pending','待标记'/);
 assert.match(app,/下载监听与标记/);
 assert.match(app,/monitor-workspace/);
 assert.match(app,/保存并入库/);
});
test('notification clicks route file tagging into the merged page',()=>{
 assert.match(app,/function tag\(f:FileItem\)\{setSelected\(f\.id\);setForm\(toForm\(f\)\);setPage\('monitor'\)\}/);
 assert.match(app,/onOpenTagging\(fileId=>/);
});
test('file discovery does not show a duplicate in-app toast',()=>{
 assert.match(app,/onFileDetected\(\(\)=>\{void refresh\(\)\}\)/);
 assert.doesNotMatch(app,/setNotificationFile/);
});
