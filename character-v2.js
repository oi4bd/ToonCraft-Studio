/* ToonCraft production character renderer v2: articulated four-direction animation.
   Uses the existing scene, time, style and palette; deterministic frame rendering. */
(function(root){
'use strict';
const pi=Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
function render(c,s,t,opt={}){
 const dur=Math.max(.1,Number(s.seconds)||4),p=clamp(t/dur,0,1),action=s.action||'idle',movement=s.movement||'still';
 const auto=({ltr:'right',rtl:'left',toward:'front',away:'back',still:'front'})[movement];
 const facing=s.facing==='auto'||!s.facing?auto:s.facing;
 const side=facing==='left'||facing==='right',back=facing==='back'||facing.startsWith('back'),quarter=facing.startsWith('front')||facing.startsWith('back');
 const dir=facing==='left'||facing.endsWith('left')?-1:1;
 const locomotion=action==='walk'||action==='run',speed=action==='run'?14:8.5;
 const gait=locomotion?Math.sin(t*speed):0,cycle=locomotion?Math.cos(t*speed):0;
 const intensity=clamp(Number(s.intensity)||1,.2,2);
 const stride=gait*(action==='run'?59:37)*intensity,arm=stride*.72;
 const liftA=locomotion?Math.max(0,cycle)*24:0,liftB=locomotion?Math.max(0,-cycle)*24:0;
 const bounce=locomotion?Math.abs(cycle)*5:0;
 const jump=action==='jump'?Math.sin(p*pi)**2*115:0;
 let x=270,y=745,scale=Number(s.scale)||1;
 if(movement==='ltr')x=lerp(90,450,p);
 if(movement==='rtl')x=lerp(450,90,p);
 if(movement==='toward'){y=lerp(570,745,p);scale*=lerp(.65,1.2,p)}
 if(movement==='away'){y=lerp(745,570,p);scale*=lerp(1.2,.65,p)}
 if(s.camera==='follow'&&movement!=='still')x=270;
 if(s.camera==='medium'){scale*=1.38;y=820}
 if(s.camera==='close'){scale*=1.38;x=270;y=780}
 const stick=opt.style==='stick',ink='#263246',skin=opt.colors?.skin||'#fff4e5',shirt=opt.colors?.shirt||'#f1a94e',hair=opt.colors?.hair||'#20283a';
 const line=(pts,w=9,color=ink)=>{c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke()};
 const oval=(x,y,rx,ry,fill,sw=4)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,pi*2);c.fillStyle=fill;c.fill();if(sw){c.strokeStyle=ink;c.lineWidth=sw;c.stroke()}};
 c.save();c.translate(x,y-bounce-jump);c.scale(scale*dir,scale);
 c.globalAlpha=.18;oval(0,12,75,11,'#273d4a',0);c.globalAlpha=1;
 const sideWidth=side?8:quarter?17:25,lean=locomotion?(action==='run'?17:7):0;
 // Alternating planted feet: each leg swings opposite the other.
 // The previous renderer used identical stride signs, causing legs to cross.
 const leftStride=stride,rightStride=-stride;
 const kneeY=-75;
 const leftFootX=-sideWidth+leftStride,rightFootX=sideWidth+rightStride;
 if(side||quarter){
   line([[-6,-143],[-8+rightStride*.46,kneeY],[-8+rightStride,-liftB]],stick?6:10,'#536071');
 }
 line([[-sideWidth,-143],[-sideWidth+leftStride*.45,kneeY], [leftFootX,-liftA]],stick?8:14);
 line([[sideWidth,-143],[sideWidth+rightStride*.45,kneeY],[rightFootX,-liftB]],stick?8:14);
 if(!stick){oval(leftFootX,-liftA+1,19,9,'#fff',3);oval(rightFootX,-liftB+1,19,9,'#fff',3)}
 if(stick)line([[0,-143],[lean,-274]],12);else{
 c.beginPath();c.moveTo(-37,-275);c.lineTo(37,-275);c.lineTo(29,-146);c.lineTo(-29,-146);c.closePath();c.fillStyle=shirt;c.fill();c.strokeStyle=ink;c.lineWidth=6;c.stroke();
 }
 const shoulder=side?12:quarter?27:43,handWave=action==='wave',handPoint=action==='point',handsUp=action==='jump';
 const leftHand=handsUp?[-76,-357]:[-shoulder-45+arm,-180];
 const rightHand=handWave?[shoulder+36,-354+Math.sin(t*11)*13]:handPoint?[shoulder+95,-268]:handsUp?[76,-357]:[shoulder+45-arm,-180];
 line([[-shoulder,-265],[-shoulder-28,-224],leftHand],stick?8:13);
 line([[shoulder,-265],[shoulder+28,-224],rightHand],stick?8:13);
 if(!stick){oval(leftHand[0],leftHand[1],11,11,skin,3);oval(rightHand[0],rightHand[1],11,11,skin,3)}
 line([[lean,-275],[lean,-308]],stick?10:19);
 const hx=lean+(side?12:quarter?7:0),hy=-374;
 oval(hx,hy,side?65:quarter?74:83,88,skin,7);
 if(!stick){c.beginPath();c.ellipse(hx,hy-45,side?60:73,43,0,pi,2*pi);c.fillStyle=hair;c.fill()}
 const headFacing=s.head&&s.head!=='auto'?s.head:facing;
 const faceBack=headFacing==='back'||headFacing.startsWith('back');
 const faceSide=headFacing==='left'||headFacing==='right';
 if(!faceBack){
   if(faceSide||side){ // one eye and protruding profile nose
     oval(hx+24,hy-10,11,18,'#fff',2);oval(hx+28,hy-7,5,9,ink,0);
     line([[hx+60,hy+2],[hx+77,hy+17],[hx+60,hy+28]],4);
     line([[hx+26,hy+44],[hx+50,hy+47]],3);
   }else{
     const spread=quarter?23:31;
     for(const dx of [-spread,spread]){oval(hx+dx,hy-9,16,22,'white',2);oval(hx+dx+3,hy-7,6,10,ink,0)}
     if(action==='talk'||s.emotion==='surprised'||action==='surprise')oval(hx,hy+48,16,14+Math.abs(Math.sin(t*12))*7,'#683f52',3);
     else{c.beginPath();c.arc(hx,hy+24,28,0,pi);c.strokeStyle=ink;c.lineWidth=4;c.stroke()}
   }
 }else line([[hx-30,hy-45],[hx,hy-57],[hx+30,hy-45]],4,'#59667b');
 c.restore();return {x,y,facing,action,stride};
}
root.ToonCraftCharacterV2=Object.freeze({render,version:'2.1.0'});
})(window);
