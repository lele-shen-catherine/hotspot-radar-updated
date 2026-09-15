const https = require('https');
function get(url, cb){
  https.get(url, res=>{
    let d='';
    res.on('data',c=>d+=c);
    res.on('end',()=>cb(d));
  }).on('error',e=>cb('ERR:'+e.message));
}
const base = 'https://lele-shen-catherine.github.io/hotspot-radar-updated/';
get(base + 'data/business-advice.json', raw=>{
  console.log('PAGES_STATUS:', raw.slice(0,1)==='{' ? 'OK-JSON' : 'NOT-JSON');
  try{
    const d=JSON.parse(raw);
    const b=d.businesses['京东外卖'];
    console.log('PAGES 京东外卖:', Array.isArray(b) ? 'ARRAY len='+b.length : 'OBJ keys='+Object.keys(b).join(','));
    if(!Array.isArray(b)){
      console.log('action_head:', JSON.stringify(b.action).slice(0,70));
      console.log('comms_head:', JSON.stringify(b.comms).slice(0,70));
    }
    console.log('total businesses:', Object.keys(d.businesses).length);
  }catch(e){ console.log('PARSE_ERR:', e.message); }
});