const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {PNG}=require('pngjs');
const {createIco}=require('../scripts/generate-icons.cjs');
test('Windows icon generator produces a 256x256 PNG-backed ICO',()=>{
  const input=fs.readFileSync(path.join(__dirname,'../assets/icon.png'));
  const data=createIco(input);
  assert.equal(data.readUInt16LE(2),1);
  assert.equal(data.readUInt16LE(4),1);
  assert.equal(data[6],0);
  assert.equal(data[7],0);
  assert.equal(data.readUInt32LE(14),data.length-22);
  assert.equal(data.readUInt32LE(18),22);
  const image=PNG.sync.read(data.subarray(22));
  assert.equal(image.width,256);
  assert.equal(image.height,256);
});
