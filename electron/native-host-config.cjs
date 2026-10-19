'use strict';
// The extension ID is derived from extension/manifest.json's public key (SHA256, first 16 bytes as a-p nibbles).
const EXTENSION_ID='ifofkigafdeojcgajpdpdheimllpkjml';
const EXTENSION_ORIGIN='chrome-extension://'+EXTENSION_ID+'/';
function isNativeInvocation(argv=[]){return argv.includes('--native-host')||argv.includes(EXTENSION_ORIGIN)}
module.exports={EXTENSION_ID,EXTENSION_ORIGIN,isNativeInvocation};
