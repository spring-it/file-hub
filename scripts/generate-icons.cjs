'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {PNG}=require('pngjs');
function createIco(sourceBytes,size=256){
  const original=PNG.sync.read(sourceBytes);
  if(size!==256)throw new Error('This builder requires a 256px ICO');
  const dst=new PNG({width:size,height:size});
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ox=Math.min(original.width-1,Math.floor(x*original.width/size));
    const oy=Math.min(original.height-1,Math.floor(y*original.height/size));
    const from=(oy*original.width+ox)*4,to=(y*size+x)*4;
    for(let k=0;k<4;k++)dst.data[to+k]=original.data[from+k];
  }
  const image=PNG.sync.write(dst);
  const header=Buffer.alloc(22);
  header.writeUInt16LE(0,0);
  header.writeUInt16LE(1,2);
  header.writeUInt16LE(1,4);
  header.writeUInt8(0,6);
  header.writeUInt8(0,7);
  header.writeUInt8(0,8);
  header.writeUInt8(0,9);
  header.writeUInt16LE(1,10);
  header.writeUInt16LE(32,12);
  header.writeUInt32LE(image.length,14);
  header.writeUInt32LE(22,18);
  return Buffer.concat([header,image]);
}
if(require.main===module){
  const base=path.join(__dirname,'../assets');
  const input=fs.readFileSync(path.join(base,'icon.png'));
  const output=createIco(input);
  fs.writeFileSync(path.join(base,'icon.ico'),output);
  console.log('Generated 256x256 Windows icon');
}
module.exports={createIco};
