const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PNG}=require('pngjs');
const {createLogoPng,createIco,generateIcons}=require('../scripts/generate-icons.cjs');
test('logo generator produces valid transparent 256px PNG',()=>{
  const bytes=createLogoPng(256);
  const parsed=PNG.sync.read(bytes);
  assert.equal(parsed.width,256);assert.equal(parsed.height,256);
  assert.equal(parsed.data[(128*256+128)*4+3],255);
  assert.equal(parsed.data[3],0);
});
test('Windows icon generator produces a valid 256x256 PNG-backed ICO',()=>{
  const data=createIco(createLogoPng(256));
  assert.equal(data.readUInt16LE(2),1);
  assert.equal(data.readUInt16LE(4),1);
  assert.equal(data[6],0);assert.equal(data[7],0);
  assert.equal(data.readUInt32LE(14),data.length-22);
  assert.equal(data.readUInt32LE(18),22);
  const image=PNG.sync.read(data.subarray(22));
  assert.equal(image.width,256);assert.equal(image.height,256);
});
test('generator writes both valid images to fresh directory',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'filehub-icons-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  generateIcons(dir);
  assert.equal(PNG.sync.read(fs.readFileSync(path.join(dir,'icon.png'))).height,256);
  assert.equal(PNG.sync.read(fs.readFileSync(path.join(dir,'icon.ico')).subarray(22)).width,256);
});
