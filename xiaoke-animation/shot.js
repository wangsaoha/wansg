const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve(process.argv[2]));await p.waitForTimeout(300);
await p.locator('canvas').screenshot({path:process.argv[3]});await b.close();})();
