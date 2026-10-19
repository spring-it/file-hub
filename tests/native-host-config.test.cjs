const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {EXTENSION_ID,EXTENSION_ORIGIN,isNativeInvocation}=require('../electron/native-host-config.cjs');
const root=path.join(__dirname,'..');
test('native host allowlist matches extension public key',()=>{const manifest=JSON.parse(fs.readFileSync(path.join(root,'extension/manifest.json'),'utf8'));const hash=createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest();const id=[...hash.subarray(0,16)].map(byte=>String.fromCharCode(97+(byte>>4),97+(byte&15))).join('');assert.equal(id,EXTENSION_ID);const installer=fs.readFileSync(path.join(root,'scripts/register-native-host.ps1'),'utf8');assert.ok(installer.includes(EXTENSION_ORIGIN));assert.ok(!installer.includes('args=@('),'Chrome native host manifests do not accept args')});
test('Chrome/Edge origin launches native mode without nonstandard manifest args',()=>{assert.equal(isNativeInvocation(['FileHub.exe',EXTENSION_ORIGIN,'--parent-window=123']),true);assert.equal(isNativeInvocation(['FileHub.exe','--native-host']),true);assert.equal(isNativeInvocation(['FileHub.exe','chrome-extension://some-other-id/']),false);assert.equal(isNativeInvocation(['FileHub.exe']),false)});
