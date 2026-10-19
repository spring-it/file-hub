const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
test('all packaged JavaScript entrypoints pass Node syntax checks',()=>{
 const output=execFileSync(process.execPath,[path.join(__dirname,'../scripts/check-runtime.cjs')],{encoding:'utf8'});
 assert.match(output,/Syntax checked \d+ runtime JavaScript files/);
});
