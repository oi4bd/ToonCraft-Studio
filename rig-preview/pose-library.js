/* ToonCraft Pose Library v1: joint-space poses inspired by user-provided action references.
   Independent of the live studio. All coordinates are local to hip=(0,0), Y grows down.
   Neutral joints are anatomical anchors; gestures use keyframed end-effector positions. */
(function(root){
'use strict';
const P=(x,y)=>({x,y});
const names=['idle','point','wave','handsUp','handsOnHips','think','crouch','sit','jump','run','walk','bow','celebrate'];
const base={
 hip:P(0,0),neck:P(0,-135),head:P(0,-208),
 leftShoulder:P(-18,-124),rightShoulder:P(18,-124),
 leftElbow:P(-40,-84),rightElbow:P(40,-84),
 leftHand:P(-51,-40),rightHand:P(51,-40),
 leftKnee:P(-19,65),rightKnee:P(19,65),
 leftFoot:P(-22,132),rightFoot:P(22,132)
};
function clone(){return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,{...v}]))}
function withPoints(mods){return Object.assign(clone(),mods)}
const poses={
 idle:()=>clone(),
 point:()=>withPoints({rightElbow:P(65,-120),rightHand:P(120,-120),leftHand:P(-34,-10)}),
 wave:()=>withPoints({rightElbow:P(48,-167),rightHand:P(60,-210)}),
 handsUp:()=>withPoints({leftElbow:P(-56,-180),leftHand:P(-85,-230),rightElbow:P(56,-180),rightHand:P(85,-230)}),
 handsOnHips:()=>withPoints({leftElbow:P(-60,-76),leftHand:P(-22,-5),rightElbow:P(60,-76),rightHand:P(22,-5)}),
 think:()=>withPoints({rightElbow:P(54,-88),rightHand:P(19,-177),leftHand:P(-27,-12)}),
 crouch:()=>withPoints({neck:P(0,-88),head:P(0,-161),leftShoulder:P(-18,-79),rightShoulder:P(18,-79),leftElbow:P(-38,-35),rightElbow:P(38,-35),leftHand:P(-18,10),rightHand:P(18,10),leftKnee:P(-58,52),rightKnee:P(58,52),leftFoot:P(-70,105),rightFoot:P(70,105)}),
 sit:()=>withPoints({neck:P(0,-129),head:P(0,-202),leftKnee:P(-62,8),rightKnee:P(62,8),leftFoot:P(-62,85),rightFoot:P(62,85),leftHand:P(-62,-45),rightHand:P(62,-45)}),
 jump:()=>withPoints({leftElbow:P(-70,-176),leftHand:P(-96,-220),rightElbow:P(70,-176),rightHand:P(96,-220),leftKnee:P(-55,42),rightKnee:P(55,42),leftFoot:P(-83,93),rightFoot:P(83,93)}),
 run:()=>withPoints({neck:P(26,-128),head:P(42,-198),leftShoulder:P(12,-121),rightShoulder:P(40,-121),leftElbow:P(-20,-91),leftHand:P(-50,-127),rightElbow:P(78,-90),rightHand:P(99,-51),leftKnee:P(-51,60),rightKnee:P(63,55),leftFoot:P(-92,90),rightFoot:P(90,110)}),
 walk:()=>withPoints({leftElbow:P(-42,-95),leftHand:P(-65,-47),rightElbow:P(40,-76),rightHand:P(67,-27),leftKnee:P(-44,60),rightKnee:P(44,61),leftFoot:P(-66,130),rightFoot:P(72,125)}),
 bow:()=>withPoints({neck:P(55,-102),head:P(109,-141),leftShoulder:P(45,-97),rightShoulder:P(63,-97),leftElbow:P(60,-46),rightElbow:P(80,-44),leftHand:P(66,5),rightHand:P(89,5)}),
 celebrate:()=>withPoints({leftElbow:P(-68,-165),leftHand:P(-100,-212),rightElbow:P(68,-165),rightHand:P(100,-212),leftKnee:P(-28,68),rightKnee:P(28,68),leftFoot:P(-55,120),rightFoot:P(55,120)})
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sample(name,progress=0){
 const n=poses[name]?name:'idle',t=clamp(Number(progress)||0,0,1);
 const a=poses.idle(),b=poses[n](),smooth=t*t*(3-2*t);
 return Object.fromEntries(Object.keys(base).map(k=>[k,P(a[k].x+(b[k].x-a[k].x)*smooth,a[k].y+(b[k].y-a[k].y)*smooth)]));
}
function render(ctx,name,progress=1,opts={}){
 const joints=sample(name,progress),scale=Number(opts.scale)||1;
 const face=opts.facing==='left'?-1:1;
 const line=(keys,w=8)=>{ctx.beginPath();keys.forEach((key,i)=>{const p=joints[key];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.lineWidth=w;ctx.strokeStyle='#141414';ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()};
 ctx.save();ctx.translate(Number(opts.x)||150,Number(opts.y)||335);ctx.scale(scale*face,scale);
 for(const chain of [['hip','leftKnee','leftFoot'],['hip','rightKnee','rightFoot'],['hip','neck'],['leftShoulder','leftElbow','leftHand'],['rightShoulder','rightElbow','rightHand']])line(chain,9);
 ctx.beginPath();ctx.arc(joints.head.x,joints.head.y,31,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#141414';ctx.stroke();
 if(opts.facing!=='back'){
   for(const dx of [-10,10]){ctx.beginPath();ctx.arc(joints.head.x+dx,joints.head.y-5,2.8,0,Math.PI*2);ctx.fillStyle='#141414';ctx.fill()}
   ctx.beginPath();ctx.arc(joints.head.x,joints.head.y+5,12,.15,Math.PI-.15);ctx.lineWidth=2.7;ctx.stroke();
 }
 ctx.restore();return joints;
}
root.ToonCraftPoses=Object.freeze({names:Object.freeze(names),sample,render,version:'1.0.0'});
})(window);
