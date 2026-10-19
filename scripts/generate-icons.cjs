'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

function createLogoPng(size=256) {
  if (!Number.isInteger(size) || size < 32 || size > 1024) throw new Error('Invalid icon size');
  const png = new PNG({ width:size, height:size });
  function paint(x,y,color,alpha=1) {
    x=Math.floor(x); y=Math.floor(y);
    if (x<0 || x>=size || y<0 || y>=size) return;
    const i=(y*size+x)*4;
    const a=Math.max(0,Math.min(1,alpha));
    const old=png.data[i+3]/255;
    const result=a+old*(1-a);
    for(let k=0;k<3;k++) png.data[i+k]=result ? Math.round((color[k]*a+png.data[i+k]*old*(1-a))/result) : 0;
    png.data[i+3]=Math.round(result*255);
  }
  function insideRoundRect(x,y,left,top,right,bottom,radius) {
    if (x<left || x>right || y<top || y>bottom) return false;
    const cx=Math.max(left+radius,Math.min(x,right-radius));
    const cy=Math.max(top+radius,Math.min(y,bottom-radius));
    const dx=x-cx,dy=y-cy;
    return dx*dx+dy*dy<=radius*radius;
  }
  function polygon(x,y,points) {
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const a=points[i], b=points[j];
      if (((a[1]>y)!==(b[1]>y)) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
    }
    return inside;
  }
  // Render 4x supersampled coverage at each pixel for smooth edges.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const unit=size/256;
    const px=(x+.5)/unit,py=(y+.5)/unit;
    let count=0;
    for(let sy=0;sy<2;sy++)for(let sx=0;sx<2;sx++){
      const fx=(x+(sx+.5)/2)/unit,fy=(y+(sy+.5)/2)/unit;
      if(insideRoundRect(fx,fy,8,8,248,248,48)) count++;
    }
    if(count) {
      const t=Math.min(1,Math.max(0,(px+py)/512));
      paint(x,y,[Math.round(12+17*t),Math.round(73+37*t),Math.round(151+60*t)],count/4);
    }
  }
  const rect=(x,y,a,b,r=0)=>insideRoundRect(x,y,a[0],a[1],b[0],b[1],r);
  const shapes=[
    {test:(x,y)=>insideRoundRect(x,y,48,82,211,194,20),color:[239,246,255]},
    {test:(x,y)=>polygon(x,y,[[48,83],[48,72],[104,72],[122,86],[202,86],[202,105],[48,105]]),color:[218,235,255]},
    {test:(x,y)=>insideRoundRect(x,y,48,108,211,194,20),color:[245,250,255]},
    {test:(x,y)=>polygon(x,y,[[138,118],[138,150],[120,150],[160,190],[199,150],[181,150],[181,118]]),color:[29,112,218]}
  ];
  for(const shape of shapes)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let count=0;
    for(let sy=0;sy<2;sy++)for(let sx=0;sx<2;sx++) {
      if(shape.test((x+(sx+.5)/2)*256/size,(y+(sy+.5)/2)*256/size)) count++;
    }
    if(count)paint(x,y,shape.color,count/4);
  }
  return PNG.sync.write(png);
}

function createIco(sourceBytes,size=256) {
  if(size!==256)throw new Error('This builder requires a 256px ICO');
  const original=PNG.sync.read(sourceBytes);
  const dst=new PNG({width:size,height:size});
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ox=Math.min(original.width-1,Math.floor(x*original.width/size));
    const oy=Math.min(original.height-1,Math.floor(y*original.height/size));
    const from=(oy*original.width+ox)*4,to=(y*size+x)*4;
    for(let k=0;k<4;k++)dst.data[to+k]=original.data[from+k];
  }
  const image=PNG.sync.write(dst);
  const header=Buffer.alloc(22);
  header.writeUInt16LE(0,0);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);
  header.writeUInt8(0,6);header.writeUInt8(0,7);
  header.writeUInt8(0,8);header.writeUInt8(0,9);
  header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);
  header.writeUInt32LE(image.length,14);header.writeUInt32LE(22,18);
  return Buffer.concat([header,image]);
}

function generateIcons(outputDir=path.join(__dirname,'../assets')) {
  fs.mkdirSync(outputDir,{recursive:true});
  const png=createLogoPng(256);
  const ico=createIco(png);
  fs.writeFileSync(path.join(outputDir,'icon.png'),png);
  fs.writeFileSync(path.join(outputDir,'icon.ico'),ico);
  return { pngBytes:png.length, icoBytes:ico.length };
}
if(require.main===module) {
  const sizes=generateIcons();
  console.log('Generated PNG and ICO logo:',sizes);
}
module.exports={createLogoPng,createIco,generateIcons};
