/* Multi-view silhouette prototype. Distinct front, left, right, back and 3/4.
 * Local body coordinates: origin at ground, positive Y downward. */
(function(root){
'use strict';
const views=['front','left','right','back','threeQuarterLeft','threeQuarterRight'];
const poseNames=['idle','walk','run','wave','point','crouch','jump','handsUp'];
const mix=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function state(view,action,t){
  const v=views.includes(view)?view:'front',a=poseNames.includes(action)?action:'idle';
  const side=v==='left'||v==='right',quarter=v.startsWith('threeQuarter');
  const direction=v==='left'||v==='threeQuarterLeft'?-1:1;
  const speed=a==='run'?13:8;
  const locomotion=a==='walk'||a==='run';
  const gait=locomotion?Math.sin(t*speed):0;
  const bob=locomotion?Math.abs(Math.sin(t*speed))*5:0;
  const jump=a==='jump'?Math.max(0,Math.sin(t*2.4))*58:0;
  return {view:v,action:a,side,quarter,direction,gait,bob,jump,t};
}
function draw(ctx,view,action,t,opts={}){
 const s=state(view,action,t),d=s.direction,side=s.side,quarter=s.quarter,back=view==='back';
 const c=ctx,stroke=opts.stroke||'#151515',skin=opts.skin||'#fff',scale=opts.scale||1;
 const line=(pts,w=9)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.strokeStyle=stroke;c.stroke()};
 const oval=(x,y,rx,ry,fill=skin,w=5)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();c.lineWidth=w;c.strokeStyle=stroke;c.stroke()};
 const gait=s.gait,move=s.action==='walk'||s.action==='run';
 const hipY=-126,shoulderY=-248,headY=-335;
 const crouch=s.action==='crouch'?65:0;
 c.save();c.translate(opts.x||150,(opts.y||405)-s.bob-s.jump);c.scale(scale,scale);
 // Local direction always defined toward screen-right, then reflected for left.
 c.scale(d,1);
 const torsoLean=move?(s.action==='run'?18:7):0;
 const shoulderX=torsoLean,hipX=0;
 // Behind limbs are rendered first to preserve occlusion in profile.
 const stride=move?gait*(s.action==='run'?58:36):0;
 if(side||quarter){
   const depth=side?1:.73;
   const farX=-depth*8;
   line([[hipX+farX,hipY+crouch],[farX-stride*.4,-66+crouch],[farX-stride,-2]],8);
   line([[shoulderX-9,shoulderY+crouch],[shoulderX-20-stride*.45,-190+crouch],[shoulderX-31-stride*.6,-147+crouch]],8);
 }
 if(s.action==='crouch'){
   line([[hipX,-85],[d*0,-55],[-48,-36],[-60,-3]],10);
   line([[hipX,-85],[38,-43],[56,-3]],10);
 }else if(side){
   line([[0,hipY],[stride*.43,-69],[stride,-3]],10);
   line([[0,hipY],[-stride*.43,-69],[-stride,-3]],10);
 }else{
   const spread=quarter?14:23;
   line([[0,hipY],[-spread-stride*.25,-66],[-spread-stride*.7,-3]],10);
   line([[0,hipY],[spread+stride*.25,-66],[spread+stride*.7,-3]],10);
 }
 const topY=shoulderY+crouch;
 const lowY=hipY+crouch;
 line([[hipX,lowY],[shoulderX,topY]],side?17:14);
 // arms: side view has distinct near/far arm origins, front has symmetric pair.
 const wave=s.action==='wave',point=s.action==='point',handsUp=s.action==='handsUp';
 const armSwing=move?stride*.6:0;
 const leftRoot=side?[shoulderX-8,topY]:[shoulderX-23,topY];
 const rightRoot=side?[shoulderX+8,topY]:[shoulderX+23,topY];
 const farHand=handsUp?[-65,topY-92]:[side?-26:-76,topY+91+armSwing*.25];
 const nearHand=wave?[50,topY-107+Math.sin(t*8)*11]:handsUp?[65,topY-92]:point?[105,topY-8]:[side?38:76,topY+91-armSwing*.25];
 line([leftRoot,[leftRoot[0]-23,topY+44],farHand],8);
 line([rightRoot,[rightRoot[0]+23,topY+43],nearHand],9);
 // Neck and head: true profile has protruding nose and one eye, front two eyes, back no face.
 const headX=shoulderX+(side?12:quarter?7:0);
 const hy=headY+crouch;
 line([[shoulderX,topY],[headX,hy+56]],11);
 oval(headX,hy,side?46:quarter?50:54,58);
 if(back){
   line([[headX-20,hy-33],[headX,hy-42],[headX+20,hy-33]],4);
 }else if(side){
   // Face features are not a mirrored front face.
   c.beginPath();c.moveTo(headX+43,hy-12);c.lineTo(headX+66,hy+9);c.lineTo(headX+43,hy+24);c.fillStyle=skin;c.fill();c.lineWidth=5;c.strokeStyle=stroke;c.stroke();
   oval(headX+20,hy-9,6,10,stroke,0);
   line([[headX+29,hy+30],[headX+43,hy+36]],3);
   oval(headX-42,hy+12,8,15,skin,3);
 }else if(quarter){
   oval(headX-12,hy-8,5,8,stroke,0);oval(headX+23,hy-8,5,8,stroke,0);
   c.beginPath();c.moveTo(headX+44,hy-4);c.lineTo(headX+55,hy+13);c.lineTo(headX+44,hy+19);c.lineWidth=3;c.stroke();
   line([[headX-4,hy+28],[headX+20,hy+34]],3);
 }else{
   oval(headX-18,hy-8,5,8,stroke,0);oval(headX+18,hy-8,5,8,stroke,0);
   c.beginPath();c.arc(headX,hy+19,18,.12,Math.PI-.12);c.lineWidth=3;c.stroke();
 }
 c.restore();return s;
}
root.ToonCraftMultiView=Object.freeze({views,actions:poseNames,state,draw,version:'0.1.0'});
})(window);
