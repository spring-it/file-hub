'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const entries=[
  ...fs.readdirSync(path.join(repo,'electron')).filter(name=>name.endsWith('.cjs')).map(name=>path.join(repo,'electron',name)),
  ...fs.readdirSync(path.join(repo,'shared')).filter(name=>name.endsWith('.cjs')).map(name=>path.join(repo,'shared',name)),
  path.join(repo,'extension','service-worker.js'),
  path.join(repo,'scripts','generate-icons.cjs')
];
for(const file of entries)execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('Syntax checked '+entries.length+' runtime JavaScript files');
