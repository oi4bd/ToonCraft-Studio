/* ToonCraft skeletal renderer v3 — pose-keyed gait, two-bone IK, directional projection.
   Pure deterministic canvas renderer: same frames for preview and video export. */
(function(root){
'use strict';
const PI=Math.PI,TAU=2*PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const poses=[
 {phase:0,hip:0,front:43,rear:-43,frontLift:0,rearLift:0,arm:1},
 {phase:.125,hip:13,front:24,rear:-35,frontLift:0,rearLift:13,arm:.7},
 {phase:.25,hip:0,front:0,rear:-20,frontLift:0,rearLift:35,arm:0},
 {phase:.375,hip:-12,front:-26,rear:24,frontLift:0,rearLift:24,arm:-.7},
 {phase:.5,hip:0,front:-43,rear:43,frontLift:0,rearLift:0,arm:-1},
 {phase:.625,hip:13,front:-35,rear:24,frontLift:13,rearLift:0,arm:-.7},
 {phase:.75,hip:0,front:-20,rear:0,frontLift:35,rearLift:0,arm:0},
 {phase:.875,hip:-12,front:24,rear:-26,frontLift:24,rearLift:0,arm:.7},
 {phase:1,hip:0,front:43,rear:-43,frontLift:0,rearLift:0,arm:1}
];
function sample(phase){const q=((phase%1)+1)%1;let i=0;while(i<poses.length-2&&q>poses[i+1].phase)i++;const a=poses[i],b=poses[i+1],u=smooth((q-a.phase)/(b.phase-a.phase));const o={};for(const k of ['hip','front','rear','frontLift','rearLift','arm'])o[k]=mix(a[k],b[k],u);return o}
function ik(hip,foot,upper=78,lower=76,forward=1){
 // Project unreachable ankle targets onto the valid two-bone reach circle.
 // Using the original distance for direction but a clamped distance for
 // intersection previously produced inconsistent knee-to-ankle bone lengths.
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy);
 const ux=d>1e-8?dx/d:0,uy=d>1e-8?dy/d:1;
 const reach=clamp(d,Math.abs(upper-lower)+.001,upper+lower-.001);
 const ankle=[hip[0]+ux*reach,hip[1]+uy*reach];
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 const perp=Math.sqrt(Math.max(0,upper*upper-along*along));
 const knee=[hip[0]+ux*along-uy*perp*forward,hip[1]+uy*along+ux*perp*forward];
 return knee;
}
function render(c,s,t,opt={}){
 const dur=Math.max(.1,Number(s.seconds)||4),p=clamp(t/dur,0,1),action=s.action||'idle',movement=s.movement||'still';
 const auto={ltr:'right',rtl:'left',toward:'front',away:'back',still:'front'}[movement]||'front';
 const facing=s.facing&&s.facing!=='auto'?s.facing:auto;
 const side=facing==='left'||facing==='right',back=facing==='back'||facing.startsWith('back'),quarter=/^(front|back)[-_](left|right)$/.test(facing);
 const sign=facing==='left'||facing.endsWith('left')?-1:1;
 const locomotion=action==='walk'||action==='run',running=action==='run';
 const intensity=clamp(Number(s.intensity)||1,.1,2);
 const cycle=t*(running?2.2:1.45),g=sample(cycle);
 const strideFactor=running?1.35:1;
 const jump=action==='jump'?Math.sin(p*PI)**2*105*intensity:0;
 let x=270,y=745,scale=Number(s.scale)||1;
 if(movement==='ltr')x=mix(90,450,p);
 if(movement==='rtl')x=mix(450,90,p);
 if(movement==='toward'){y=mix(570,745,p);scale*=mix(.65,1.2,p)}
 if(movement==='away'){y=mix(745,570,p);scale*=mix(1.2,.65,p)}
 if(s.camera==='follow'&&movement!=='still')x=270;
 if(s.camera==='medium'){scale*=1.24;y=785}
 if(s.camera==='close'){scale*=1.33;x=270;y=780}
 const style=opt.style||'comic',stick=style==='stick';
 const col=opt.colors||{},skin=col.skin||'#fff4e5',shirt=col.shirt||'#f1a94e',hair=col.hair||'#20283a',ink='#263246';
 const line=(points,w=9,color=ink)=>{c.beginPath();points.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.lineWidth=w;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';c.stroke()};
 const oval=(x,y,rx,ry,color,stroke=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=ink;c.lineWidth=stroke;c.stroke()}};
 const bodyWidth=side?12:quarter?25:40;
 const pose=locomotion?g:{hip:0,front:0,rear:0,frontLift:0,rearLift:0,arm:0};
 const bodyBob=locomotion?pose.hip*(running?1.3:1):action==='laugh'?Math.sin(t*12)*5:action==='surprise'?Math.sin(t*9)*2:0;
 const lean=locomotion?(running?30:8):action==='surprise'?-10:action==='laugh'?Math.sin(t*8)*9:0;
 c.save();c.translate(x,y-jump);c.scale(scale*sign,scale);
 c.globalAlpha=.15;oval(0,10,75,10,'#263246');c.globalAlpha=1;
 // Foot anchors are independently derived from a full keyed cycle; IK fixes bone lengths.
 const hipY=-148+bodyBob,hipLeft=[-bodyWidth*.5,hipY],hipRight=[bodyWidth*.5,hipY];
 const spread=side?9:quarter?18:29;
 const f1=locomotion?[spread+pose.front*strideFactor,-pose.frontLift*intensity]:[-spread-(action==='surprise'?8:0),0];
 const f2=locomotion?[-spread+pose.rear*strideFactor,-pose.rearLift*intensity]:[spread+(action==='surprise'?8:0),0];
 // A side-view walk bends both knees forward in screen space; frontal knees remain on their own side.
 // Canonical side rig faces RIGHT. Canvas mirror handles LEFT: never invert knee bend twice.
 // With a downward-pointing hip-to-ankle vector, IK bend=-1 places the knee forward (+X).
 // Keep both legs on the same anatomical bend side; front/back view uses lateral bends.
 const knee1=locomotion?ik(hipLeft,f1,80,80,side?-1:-1):[mix(hipLeft[0],f1[0],.5),mix(hipLeft[1],f1[1],.5)];
 const knee2=locomotion?ik(hipRight,f2,80,80,side?-1:1):[mix(hipRight[0],f2[0],.5),mix(hipRight[1],f2[1],.5)];
 if(!side&&!quarter){knee1[0]=Math.min(knee1[0],-5);knee2[0]=Math.max(knee2[0],5)}

 // Draw far leg first and near leg last to preserve overlap.
 const legWidth=stick?8:14;
 line([hipRight,knee2,f2],legWidth,side||quarter?'#657185':ink);
 line([hipLeft,knee1,f1],legWidth);
 if(!stick){oval(f2[0]+10,f2[1]+2,19,8,'#f7f7f8',3);oval(f1[0]+10,f1[1]+2,19,8,'#f7f7f8',3)}
 const shoulderY=-266+bodyBob,shoulderX=lean;
 const armSwing=locomotion?pose.arm*(running?38:26)*intensity:action==='laugh'?Math.sin(t*12)*17:0;
 const wave=action==='wave',raised=action==='jump'||action==='surprise';
 // In profile both shoulder pivots share the torso silhouette. The far arm
 // must be painted BEFORE the torso; the near arm must be painted AFTER it.
 const leftShoulder=[shoulderX-(side?4:bodyWidth),shoulderY+3];
 const rightShoulder=[shoulderX+(side?4:bodyWidth),shoulderY+3];
 let leftElbow,rightElbow,leftHand,rightHand;
 if(side&&locomotion){
  // Canonical RIGHT-facing coordinates. c.scale(scale*sign,scale) mirrors LEFT.
  // Leading near leg -> near arm swings backward; far arm swings forward.
  const phase=clamp(pose.front/43,-1,1)*intensity;
  const armPose=(shoulder,swing)=>{
   const reach=running?59:79,travel=running?58:46;
   const dx=swing*travel;
   // Elbows flex more for running; walking forearms remain almost straight.
   const elbow=[shoulder[0]+dx*.55,shoulder[1]+(running?27:43)];
   const hand=[shoulder[0]+dx,shoulder[1]+reach-(running?Math.abs(swing)*8:0)];
   if(running){elbow[0]=shoulder[0]+dx*.85;hand[0]=shoulder[0]+dx*.93;}
   return {elbow,hand};
  };
  const near=armPose(leftShoulder,-phase),far=armPose(rightShoulder,phase);
  leftElbow=near.elbow;leftHand=near.hand;
  rightElbow=far.elbow;rightHand=far.hand;
 }else{
  leftElbow=raised?[-78,shoulderY-42]:action==='laugh'?[shoulderX-bodyWidth-32,shoulderY+26]:[shoulderX-bodyWidth-22-armSwing*.45,shoulderY+(running?20:45)];
  rightElbow=wave||raised?[bodyWidth+23,shoulderY-47]:action==='laugh'?[shoulderX+bodyWidth+32,shoulderY+26]:[shoulderX+bodyWidth+22+armSwing*.45,shoulderY+(running?20:45)];
  leftHand=raised?[-87,shoulderY-100]:action==='laugh'?[shoulderX-bodyWidth-12,shoulderY+65+Math.sin(t*12)*9]:[leftElbow[0]-15-armSwing*.55,leftElbow[1]+(running?10:38)];
  rightHand=wave?[bodyWidth+45+Math.sin(t*11)*9,shoulderY-110]:raised?[83,shoulderY-99]:action==='laugh'?[shoulderX+bodyWidth+12,shoulderY+65-Math.sin(t*12)*9]:[rightElbow[0]+15+armSwing*.55,rightElbow[1]+(running?10:38)];
 }
 // Layer 1: far arm and hand (behind torso).
 line([rightShoulder,rightElbow,rightHand],stick?8:12,side?'#657185':ink);
 if(!stick)oval(...rightHand,10,10,skin,3);
 // Layer 2: torso occludes the far arm where the two overlap.
 if(stick)line([[0,hipY],[shoulderX,shoulderY]],11);
 else{
  c.beginPath();c.moveTo(shoulderX-bodyWidth,shoulderY);
  c.lineTo(shoulderX+bodyWidth,shoulderY);
  c.lineTo(bodyWidth*.7,hipY);c.lineTo(-bodyWidth*.7,hipY);
  c.closePath();c.fillStyle=shirt;c.fill();c.strokeStyle=ink;c.lineWidth=6;c.stroke();
 }
 // Layer 3: near arm in front of torso, but offset from its center.
 line([leftShoulder,leftElbow,leftHand],stick?8:12);
 if(!stick)oval(...leftHand,10,10,skin,3);
 const headX=shoulderX+(side?10:quarter?6:0),headY=shoulderY-103;
 line([[shoulderX,shoulderY],[headX,headY+76]],stick?9:15);
 oval(headX,headY,side?64:quarter?73:81,85,skin,6);
 if(!stick){c.beginPath();c.ellipse(headX,headY-44,side?60:70,41,0,PI,TAU);c.fillStyle=hair;c.fill()}
 const headFacing=s.head&&s.head!=='auto'?s.head:facing;
 const headBack=headFacing==='back'||headFacing.startsWith('back');
 const emotion=s.emotion||'happy';
 // Deterministic blink every ~3.7s, with a short eyelid closure. No random state:
 // scrubbing, preview and export produce the same expression at the same time.
 const blinkPhase=((t+.42)%3.7+3.7)%3.7;
 const blinking=blinkPhase<.13&&action!=='surprise'&&emotion!=='surprised';
 const talking=action==='talk',surprised=action==='surprise'||emotion==='surprised'||emotion==='scared';
 const sad=emotion==='sad',angry=emotion==='angry',laughing=action==='laugh';
 const eye=(cx,cy,rx=16,ry=21)=>{
  if(blinking){line([[cx-rx,cy],[cx+rx,cy]],3);return}
  oval(cx,cy,rx,ry,'white',2);oval(cx+3,cy+3,6,9,ink);
 };
 const mouth=(mx,my)=>{
  if(surprised){oval(mx,my,15,19,'#683f52',2);return}
  if(talking){oval(mx,my,13,5+Math.abs(Math.sin(t*11))*12,'#683f52',2);return}
  if(sad){c.beginPath();c.arc(mx,my+20,22,PI*1.15,PI*1.85);c.lineWidth=4;c.strokeStyle=ink;c.stroke();return}
  if(laughing){oval(mx,my,23,12+Math.abs(Math.sin(t*12))*11,'#683f52',3);return}
  if(angry){line([[mx-19,my+4],[mx+19,my-3]],4);return}
  c.beginPath();c.arc(mx,my-15,25,0,PI);c.strokeStyle=ink;c.lineWidth=4;c.stroke();
 };
 if(headBack){line([[headX-25,headY-43],[headX,headY-56],[headX+25,headY-43]],4,'#687488')}
 else if(side||headFacing==='left'||headFacing==='right'){
  eye(headX+23,headY-11,12,surprised?22:17);
  if(angry)line([[headX+9,headY-37],[headX+39,headY-30]],4);
  else if(sad)line([[headX+9,headY-30],[headX+39,headY-38]],3);
  line([[headX+59,headY+5],[headX+74,headY+17],[headX+58,headY+27]],3);
  mouth(headX+33,headY+45);
 }else{
  for(const dx of (quarter?[-23,23]:[-30,30])){
   eye(headX+dx,headY-10,16,surprised?27:21);
   if(angry)line([[headX+dx-14,headY-41],[headX+dx+14,headY-32]],4);
   else if(sad)line([[headX+dx-14,headY-32],[headX+dx+14,headY-41]],3);
   else if(surprised)line([[headX+dx-12,headY-48],[headX+dx+12,headY-48]],3);
  }
  mouth(headX,headY+45);
 }
 c.restore();
 return {x,y,facing,action,phase:cycle%1,pose};
}
root.ToonCraftCharacterV2=Object.freeze({render,version:'3.1.1',sample,ik});
})(window);
