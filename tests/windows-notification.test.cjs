const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8');
test('Windows app identity is set before startup for native toast notifications',()=>{
 assert.match(main,/if\(process\.platform==='win32'\)app\.setAppUserModelId\('com\.springit\.filehub'\)/);
 assert.ok(main.indexOf("app.setAppUserModelId('com.springit.filehub')")<main.indexOf("app.whenReady()"));
});
test('download events use native Windows notifications with an icon and click action',()=>{
 assert.match(main,/new Notification\(\{title:'文件中转站发现新文件'/);
 assert.match(main,/icon:path\.join\(app\.getAppPath\(\),'assets\/icon\.png'\)/);
 assert.match(main,/n\.on\('click'/);
 assert.match(main,/点击打开并填写标记/);
});
