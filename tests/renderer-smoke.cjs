/* Run with: node tests/renderer-smoke.cjs
   No npm packages needed. Tests renderer calls and directional mirror deterministically. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../character-v2.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'character-v2.js'});
const engine=sandbox.window.ToonCraftCharacterV2;
assert(engine&&typeof engine.render==='function','renderer exposed');
function mock(){
 const calls=[];
 const ctx={calls,beginPath(){},moveTo(x,y){calls.push(['moveTo',x,y])},lineTo(x,y){calls.push(['lineTo',x,y])},
  stroke(){calls.push(['stroke'])},fill(){calls.push(['fill'])},closePath(){},
  ellipse(x,y,rx,ry){calls.push(['ellipse',x,y,rx,ry])},arc(){},
  save(){calls.push(['save'])},restore(){calls.push(['restore'])},
  translate(x,y){calls.push(['translate',x,y])},scale(x,y){calls.push(['scale',x,y])}};
 return ctx;
}
const actions=['idle','walk','run','laugh','surprise','talk','wave','jump'];
const facings=['left','right','front','back','front-left','front-right'];
for(const action of actions)for(const facing of facings)for(const t of [0,.12,.35,.8,1.6,2.9]){
 const ctx=mock(),scene={seconds:4,action,movement:'still',facing,emotion:'happy',intensity:1,scale:1};
 const result=engine.render(ctx,scene,t,{style:'comic'});
 assert.equal(result.facing,facing);
 assert(ctx.calls.some(c=>c[0]==='restore'),'canvas restored');
 assert(ctx.calls.every(c=>c.slice(1).every(n=>typeof n!=='number'||Number.isFinite(n))),'finite geometry');
}
for(const movement of ['ltr','rtl']){
 const ctx=mock(),result=engine.render(ctx,{seconds:4,action:'walk',movement,facing:'auto'},1,{});
 const scale=ctx.calls.find(c=>c[0]==='scale');
 assert.equal(scale[1]>0,movement==='ltr','left and right are mirrored');
 assert.equal(result.facing,movement==='ltr'?'right':'left');
}
const a=engine.sample(.25),b=engine.sample(1.25);
for(const k of Object.keys(a))assert(Math.abs(a[k]-b[k])<1e-8,'pose loop periodic');
console.log('PASS: 288 pose/time combinations, mirror direction and periodic gait');
