'use strict';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getOpenFileId(argv=[]){const value=argv.find(arg=>typeof arg==='string'&&arg.startsWith('--open-file-id='));if(!value)return null;const id=value.slice('--open-file-id='.length);return UUID.test(id)?id:null}
module.exports={getOpenFileId};
