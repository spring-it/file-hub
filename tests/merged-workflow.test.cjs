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
 assert.match(app,/function tag\(f:FileItem\)\{if\(page!=='monitor'/);
 assert.match(app,/onOpenTagging\(fileId=>/);
});
test('file discovery does not show a duplicate in-app toast',()=>{
 assert.match(app,/onFileDetected\(\(\)=>\{void refresh\(\)\}\)/);
 assert.doesNotMatch(app,/setNotificationFile/);
});

test('notification deep links support records outside the first page and clear active filters',()=>{
 assert.match(app,/getFile\(fileId\)/);
 assert.match(app,/setPinnedFile\(pinned\?file:null\)/);
 assert.match(app,/setSourceFilter\('all'\);setAppFilter\('all'\)/);
 assert.match(app,/consumeOpenFileId\(\)\.then\(id=>\{if\(id\)void focusFile\(id\)\}\)/);
});

test('library actions always select the target file, including after archive',()=>{
 assert.match(app,/function showLibrary\(f:FileItem\)\{setQuery\(''\);setLibrarySelectedId\(f\.id\);setPage\('library'\)\}/);
 assert.match(app,/if\(archive&&ok\)\{setLibrarySelectedId\(current\.id\)/);
});

test('a pinned file outside the first page does not shift SQLite pagination offsets',()=>{
 assert.match(app,/listFilesPage\(baseRecords\.length,200\)/);
 assert.match(app,/data&&baseRecords\.length<data\.totalFiles/);
});
