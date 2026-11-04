/* ToonCraft Expressive Rig v1 — isolated prototype, no external dependencies.
 * Deterministic: same scene + local time => same drawing (preview/export parity).
 * Coordinate convention: character feet at (x,y), forward profile faces +X.
 */
'use strict';
(function(root){
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const point=(x,y)=>({x,y});
  const stroke=(c,pts,w=8,color='#17202c')=>{
    c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();
  };
  const ellipse=(c,x,y,rx,ry,fill='#fff',border='#17202c',w=5)=>{
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    c.fillStyle=fill;c.fill();if(border){c.lineWidth=w;c.strokeStyle=border;c.stroke();}
  };
  function pose(scene,t){
    const duration=Math.max(.1,Number(scene.seconds)||4),progress=clamp(t/duration,0,1);
    const movement=scene.movement||'still',action=scene.action||'idle';
    const moving=['ltr','rtl','toward','away'].includes(movement);
    const gait=moving&&(action==='walk'||action==='run');
    const intensity=clamp(Number(scene.intensity)||1,.2,2);
    const phase=t*(action==='run'?15:9);
    const step=gait?Math.sin(phase)*intensity:0;
    const lift=gait?Math.max(0,Math.sin(phase))*16*intensity:0;
    const bounce=gait?Math.abs(Math.sin(phase))*5:0;
    const jump=action==='jump'?Math.sin(progress*Math.PI)**2*115*intensity:0;
    const face=scene.facing&&scene.facing!=='auto'?scene.facing:
      ({ltr:'right',rtl:'left',toward:'front',away:'back'})[movement]||'front';
    const head=scene.head&&scene.head!=='auto'?scene.head:face;
    const x=movement==='ltr'?mix(85,455,progress):movement==='rtl'?mix(455,85,progress):270;
    const depth=movement==='toward'?mix(.72,1.15,progress):movement==='away'?mix(1.15,.72,progress):1;
    const y=movement==='toward'?mix(650,745,progress):movement==='away'?mix(745,650,progress):745;
    return {x,y,depth,face,head,step,lift,bounce,jump,phase,progress,gait,action,intensity};
  }
  function draw(c,scene,t,options={}){
    const p=pose(scene,t),ink='#17202c',skin=options.skin||'#fff4e5';
    const shirt=options.shirt||'#f1a94e',hair=options.hair||'#20283a';
    const stick=options.style==='stick';
    let scale=clamp(Number(scene.scale)||1,.3,3)*p.depth;
    let x=p.x,y=p.y;
    if(scene.camera==='close'){scale*=1.85;x=270;y=935;}
    else if(scene.camera==='medium'){scale*=1.32;y=810;}
    else if(scene.camera==='follow'&&p.gait)x=270;
    const side=p.face==='left'||p.face==='right';
    const mirror=p.face==='left'?-1:1;
    const arm=p.step*33,leg=p.step*35;
    c.save();
    // Ground shadow is not affected by jump.
    c.globalAlpha=.13;ellipse(c,x,y+10,70*scale,10*scale,ink,null);c.globalAlpha=1;
    c.translate(x,y-p.bounce-p.jump);
    c.scale(scale*mirror,scale);
    // Side-on body has a slimmer silhouette; back view has no facial features.
    if(side)c.scale(.82,1);
    // Side profile: limbs swing in the travel axis; front view remains symmetric.
    // All profile coordinates are defined facing right, then mirrored for left.
    if(side){
      const hipY=-135, shoulderY=-270, stride=p.step*42;
      const backKnee=point(-stride*.5,-78),frontKnee=point(stride*.5,-78);
      const backFoot=point(-stride,-Math.max(0,-p.step)*19);
      const frontFoot=point(stride,-Math.max(0,p.step)*19);
      stroke(c,[point(0,hipY),backKnee,backFoot],stick?10:16,ink);
      stroke(c,[point(0,hipY),frontKnee,frontFoot],stick?10:16,ink);
      if(stick)stroke(c,[point(0,hipY),point(0,shoulderY)],16,ink);
      else{c.fillStyle=shirt;c.strokeStyle=ink;c.lineWidth=6;c.beginPath();c.roundRect(-27,-280,54,147,22);c.fill();c.stroke();}
      const swing=p.gait?stride*.72:0;
      const wave=p.action==='wave';
      stroke(c,[point(0,-260),point(-25-swing*.5,-223),point(-32-swing,-174)],stick?9:13,ink);
      stroke(c,[point(0,-260),point(23+swing*.5,-225),wave?point(43,-355+Math.sin(t*9)*12):point(34+swing,-174)],stick?9:13,ink);
      stroke(c,[point(0,shoulderY),point(0,-303)],13,ink);
    }else{
    const hip=point(0,-135),shoulder=point(0,-270),neck=point(0,-303);
    const kneeL=point(-18-leg*.4,-72),kneeR=point(18+leg*.4,-72);
    const footL=point(-25-leg, -p.lift),footR=point(25+leg, -Math.max(0,-p.step)*16);
    stroke(c,[hip,kneeL,footL],stick?9:15,ink);
    stroke(c,[hip,kneeR,footR],stick?9:15,ink);
    if(!stick){ellipse(c,footL.x,footL.y,23,9,'#fff',ink,3);ellipse(c,footR.x,footR.y,23,9,'#fff',ink,3);}
    if(stick)stroke(c,[hip,shoulder],12,ink);
    else{c.fillStyle=shirt;c.strokeStyle=ink;c.lineWidth=6;c.beginPath();c.roundRect(-44,-281,88,151,27);c.fill();c.stroke();}
    const wave=p.action==='wave',laugh=p.action==='laugh',talk=p.action==='talk';
    const leftElbow=point(-64-arm*.25,-228),rightElbow=point(64+arm*.25,-228);
    const leftHand=wave?point(-82,-355+Math.sin(t*11)*13):point(-95-arm,-177);
    const rightHand=wave?point(96,-176):point(95+arm,-177);
    if(laugh){leftHand.y=-265+Math.sin(t*12)*15;rightHand.y=-265-Math.sin(t*12)*15;}
    stroke(c,[point(-38,-260),leftElbow,leftHand],stick?9:13,ink);
    stroke(c,[point(38,-260),rightElbow,rightHand],stick?9:13,ink);
    ellipse(c,leftHand.x,leftHand.y,11,11,skin,ink,3);
    ellipse(c,rightHand.x,rightHand.y,11,11,skin,ink,3);
    stroke(c,[shoulder,neck],14,ink);
    }
    // Head direction is independent of body direction. It changes face features,
    // not the body's movement axis.
    c.save();c.translate(0,-377);
    const headSide=p.head==='left'||p.head==='right';
    const headBack=p.head==='back';
    const headMirror=p.head==='left'?-1:1;
    c.scale(headMirror*mirror,1);
    if(headSide)c.scale(.77,1);
    ellipse(c,0,0,76,87,skin,ink,6);
    if(!stick){
      c.beginPath();c.moveTo(-70,-32);c.quadraticCurveTo(-74,-110,-10,-91);
      c.quadraticCurveTo(44,-107,74,-32);c.quadraticCurveTo(5,-64,-70,-32);
      c.fillStyle=hair;c.fill();
    }
    if(headSide){
      // A protruding nose and one visible eye make left/right profile readable.
      c.beginPath();c.moveTo(66,-6);c.lineTo(90,13);c.lineTo(67,26);
      c.fillStyle=skin;c.fill();c.strokeStyle=ink;c.lineWidth=5;c.stroke();
    }
    if(headBack){
      stroke(c,[point(-28,-53),point(0,-63),point(28,-53)],hair,7);
    }else{
      const eyes=headSide?[point(24,-11)]:[point(-27,-11),point(27,-11)];
      const surprise=p.action==='surprise'||['surprised','scared'].includes(scene.emotion);
      const blink=Math.sin(t*2.4)>0.992;
      for(const eye of eyes){
        if(blink)stroke(c,[point(eye.x-12,eye.y),point(eye.x+12,eye.y)],4,ink);
        else{ellipse(c,eye.x,eye.y,headSide?15:19,surprise?29:23,'#fff',ink,3);
          ellipse(c,eye.x+3,eye.y+2,6,10,ink,null);}
        const angry=scene.emotion==='angry';
        stroke(c,[point(eye.x-14,-45+(angry?-5:0)),point(eye.x+14,-45+(angry?7:0))],4,ink);
      }
      const mouthX=headSide?27:0;
      if(surprise||talk){
        ellipse(c,mouthX,44,15,surprise?21:8+Math.abs(Math.sin(t*13))*16,'#713b50',ink,3);
      }else if(scene.emotion==='sad'){
        c.beginPath();c.arc(mouthX,78,23,Math.PI*1.2,Math.PI*1.8);
        c.strokeStyle=ink;c.lineWidth=5;c.stroke();
      }else{
        c.beginPath();c.arc(mouthX,31,laugh?32:25,0,Math.PI);
        c.strokeStyle=ink;c.lineWidth=5;c.stroke();
      }
    }
    c.restore();c.restore();
    return p;
  }
  root.ToonCraftRig=Object.freeze({pose,draw,version:'1.1.0'});
})(window);
