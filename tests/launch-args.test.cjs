const test=require('node:test');
const assert=require('node:assert/strict');
const {getOpenFileId}=require('../electron/launch-args.cjs');
test('open-file launch argument accepts UUID file ids',()=>{assert.equal(getOpenFileId(['FileHub.exe','--open-file-id=123e4567-e89b-12d3-a456-426614174000']),'123e4567-e89b-12d3-a456-426614174000')});
test('open-file launch argument rejects malformed values',()=>{assert.equal(getOpenFileId(['FileHub.exe','--open-file-id=../../secret']),null);assert.equal(getOpenFileId(['FileHub.exe']),null)});
