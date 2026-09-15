const puppeteer=require('puppeteer');
(async()=>{
  const b=await puppeteer.launch({headless:true,args:['--no-sandbox']});
  const p=await b.newPage();
  await p.goto('http://127.0.0.1:8899/dashboard.html',{waitUntil:'networkidle',timeout:20000});
  const result = await p.evaluate(()=>{
    const sel=document.getElementById('business-select');
    const action=document.getElementById('business-action');
    const comms=document.getElementById('business-comms');
    const options = sel ? [...sel.options].map(o=>o.textContent) : [];
    return {
      hasSelect: !!sel,
      options,
      actionText: action ? action.textContent.slice(0,150) : null,
      commsText: comms ? comms.textContent.slice(0,150) : null,
      selectValue: sel ? sel.value : null
    };
  });
  console.log(JSON.stringify(result,null,2));
  await b.close();
})();
