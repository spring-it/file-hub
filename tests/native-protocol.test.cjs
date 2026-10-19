const test=require('node:test');
const assert=require('node:assert/strict');
const {encodeFrame,decodeFrames}=require('../electron/native-protocol.cjs');
test('native protocol supports partial chunks',()=>{const frame=encodeFrame({text:'文件'}),first=decodeFrames(frame.subarray(0,3));assert.equal(first.messages.length,0);assert.deepEqual(decodeFrames(Buffer.concat([first.remaining,frame.subarray(3)])).messages,[{text:'文件'}])});
test('native protocol decodes multiple frames in one chunk',()=>{const a=encodeFrame({id:1}),b=encodeFrame({id:2});assert.deepEqual(decodeFrames(Buffer.concat([a,b])).messages,[{id:1},{id:2}])});
test('native protocol rejects oversized frames',()=>{const h=Buffer.alloc(4);h.writeUInt32LE(1024*1024+1);assert.throws(()=>decodeFrames(h),/too large/i)});
