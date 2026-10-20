'use strict';
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {randomUUID}=require('node:crypto');
async function run(){
 if(process.platform!=='win32'){console.log('ETW integration skipped: Windows only.');return}
 const exe=path.join(__dirname,'..','agent','publish','FileHub.EtwAgent.exe');
 if(!fs.existsSync(exe))throw new Error('ETW agent not found; run npm run build:agent first.');
 const pipeName='FileHubEtwSmoke-'+process.pid+'-'+randomUUID().replace(/-/g,'');
 const pipePath='\\\\.\\pipe\\'+pipeName;
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'filehub-etw-smoke-'));
 const target=path.join(temp,'etw-smoke.pdf');
 let server=null,socket=null,agent=null,buffer='',ready=false,found=false;
 let readyResolve,readyReject,eventResolve,eventReject;
 const readyPromise=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
 const eventPromise=new Promise((resolve,reject)=>{eventResolve=resolve;eventReject=reject});
 const timer=setTimeout(()=>{if(!ready)readyReject(new Error('ETW agent did not become ready within 20 seconds'));else if(!found)eventReject(new Error('ETW agent did not report a file write within 12 seconds'))},32000);
 try{
  server=net.createServer(client=>{
   socket=client;client.setEncoding('utf8');
   client.on('data',chunk=>{buffer+=chunk;let newline;while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline).trim();buffer=buffer.slice(newline+1);if(!line)continue;let message;try{message=JSON.parse(line)}catch{continue}if(message.type==='ready'){ready=true;readyResolve();continue}if(message.type==='error'){const error=new Error(message.message||'ETW agent returned an error');if(!ready)readyReject(error);else if(!found)eventReject(error);continue}if(message.type==='file-io'&&message.fileName&&message.sourceApp==='File Hub ETW Smoke'){const actual=String(message.fileName).replace(/\\/g,'/').toLowerCase();if(actual.endsWith('/etw-smoke.pdf')||actual.endsWith('/etw-smoke.pdf.tmp')){found=true;eventResolve(message)}}}});
   client.on('error',error=>{if(!ready)readyReject(error);else if(!found)eventReject(error)});
   client.write(JSON.stringify({type:'configure',programs:[{name:'File Hub ETW Smoke',exePath:process.execPath}]})+'\n');
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(pipePath,resolve)});
  agent=spawn(exe,['--pipe-name',pipeName],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let stderr='';agent.stderr.on('data',chunk=>{stderr+=chunk.toString().slice(-2000)});
  agent.on('exit',code=>{if(!ready)readyReject(new Error('ETW agent exited before ready ('+code+'): '+stderr));else if(!found)eventReject(new Error('ETW agent exited before detecting file I/O ('+code+'): '+stderr))});
  try{await readyPromise}catch(error){if(/access is denied|error_access_denied|not have sufficient privileges|requires elevation|another kernel trace session is active|already exists/i.test(error.message)){console.log('ETW integration skipped: hosted runner cannot start a kernel trace session.');return}throw error}
  fs.writeFileSync(target+'.tmp','partial download');fs.renameSync(target+'.tmp',target);fs.appendFileSync(target,' final bytes');
  await eventPromise;
  console.log('ETW integration passed: configured process file I/O reached File Hub over the local pipe.');
 }finally{clearTimeout(timer);try{socket?.end()}catch{}try{agent?.kill()}catch{}if(server?.listening)await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true})}
}
run().catch(error=>{console.error(error);process.exitCode=1});
