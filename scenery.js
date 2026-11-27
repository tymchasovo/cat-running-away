'use strict';
// All heights are measured above the same perspective plane as the runner.
function streetPoint(z,lane,height=0){
  const p=project(z,lane);
  return [p.x,p.y-height*p.s];
}
function streetStrip(far,near,left,right,color,height=0){
  poly([streetPoint(far,left,height),streetPoint(far,right,height),
    streetPoint(near,right,height),streetPoint(near,left,height)],color);
}
function ridge(y,rise,color,phase){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-W*.3,H);
  for(let i=-1;i<6;i++){
    const x=i*W*.26,base=y+rise*.45*Math.sin(i*2+phase);
    if(i===-1)ctx.lineTo(x,base);
    ctx.quadraticCurveTo(x+W*.13,base-rise,x+W*.26,y+rise*.45*Math.sin((i+1)*2+phase));
  }
  ctx.lineTo(W*1.4,H);ctx.fill();
}
function pierDistance(time){
  const y=H*.27;
  ridge(y,H*.044,'#797c94',1);
  const water=ctx.createLinearGradient(0,y,0,H);
  water.addColorStop(0,'#8d94a3');water.addColorStop(.4,'#638396');water.addColorStop(1,'#476e82');
  rect(0,y,W,H,water);
  for(let i=0;i<65;i++){
    const t=(i*.139)%1,x=W*((i*.379)%1);
    oval(x+Math.sin(time*.7+i)*2,y+H*.74*t*t,2+13*t,.5+t,i%4?'#95a8ae':'#d1b3a1');
  }
  ctx.save();ctx.translate(W*.5,project(155,0).y);const u=Math.min(W/410,H/660);ctx.scale(u,u);
  poly([[-50,0],[-27,-4],[-10,-6],[18,-5],[42,0]],'#726c77');
  poly([[-6,-4],[-4,-38],[3,-38],[6,-4]],'#f0d5bb');
  rect(-4,-25,8,7,'#b97565');rect(-5,-43,10,6,'#ffe1a0');
  poly([[-7,-43],[0,-49],[7,-43]],'#55546c');ctx.restore();
  for(const [x,depth] of [[.19,.025],[.78,.044]]){
    const by=y+H*depth,sz=W*.048;
    poly([[W*x,by-1],[W*x,by-sz],[W*x-sz*.65,by-1]],'#ecceba');
    poly([[W*x-sz*.8,by],[W*x+sz*.4,by],[W*x+sz*.1,by+3],[W*x-sz*.55,by+3]],'#595c6b');
  }
}
// A puddle repeats every 13 m, alternating between the three lanes.
function puddleLane(index){return (index%3+3)%3-1;}
function drawPawSplash(time){
  const index=Math.round(distance/13);
  if(Math.abs(distance-index*13)>1.2 || Math.abs(x-puddleLane(index))>.45)return;
  for(let i=0;i<6;i++){
    const t=(time*5+i*.29)%1,side=i%2?1:-1;
    oval(side*(12+18*t),-2-30*t*(1-t),2.4-t,1.8,'#b8e1e4');
  }
}
function courtyard(){
  const palette=routes.yard, horizon=H*.27;
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,palette.sky);sky.addColorStop(1,palette.light);
  rect(0,0,W,H,sky);
  for(let i=0;i<11;i++){
    const w=W/10,top=H*(.14+.05*Math.sin(i*3));
    rect(i*w,top,w+1,H*.32-top,i%2?'#505267':'#575d73');
    for(let j=0;j<8;j++)rect(i*w+(j%2+.45)*w*.45,top+(4+Math.floor(j/2)*8)*W/410,w*.14,w*.12,(i+j)%3?'#717b88':'#f2cf91');
  }
  const pavement=ctx.createLinearGradient(0,horizon,0,H);
  pavement.addColorStop(0,'#596a79');pavement.addColorStop(.58,palette.ground);pavement.addColorStop(1,'#344957');
  rect(0,H*.32,W,H,pavement);
  for(const side of [-1,1]){
    streetStrip(165,-9,side*1.63,side*5.8,'#62717b');
    streetStrip(165,-9,side*1.63,side*1.67,'#a4afb0');
  }
  for(let z=156-distance%13;z>-9;z-=13){
    const index=Math.round((z+distance)/13),side=index%2?1:-1;
    const p=project(z,puddleLane(index));
    // Broken edges and streaks of window light on the wet asphalt.
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    poly([[-52,0],[-39,-5],[-18,-6],[-6,-9],[20,-7],[26,-4],[49,-2],[37,2],[45,4],[16,6],[-4,8],[-31,5],[-26,3]],'#698797');
    for(let j=0;j<4;j++)rect(9+Math.sin(index+j)*5,-5+j*2.5,15-j*2,1.1,'#c1afb0');
    ctx.restore();
    oval(p.x-8*p.s,p.y,28*p.s,2*p.s,'#a9bcc2');
    for(const wall of [-1,1]){
      const lane=wall*2.65;
      const face=(near,far,low,high,color)=>poly([streetPoint(near,lane,low),streetPoint(far,lane,low),streetPoint(far,lane,high),streetPoint(near,lane,high)],color);
      face(z,z+13,0,148+(index%3)*12,wall<0?'#52536a':'#645c70');
      for(const floor of [35,80,122])for(const offset of [2,8]){
        face(z+offset,z+offset+2.6,floor,floor+17,(index+offset+floor)%4?'#edc991':'#738697');
      }
      face(z+5,z+7,0,27,'#393e51');
    }
    const glint=project(z,side*1.37);
    for(let j=0;j<5;j++){
      const width=(3+Math.abs(Math.sin(index+j))*8)*glint.s;
      rect(glint.x-width/2,glint.y+j*3*glint.s,width,1.3*glint.s,'#ad9e90');
    }
  }
}
function parkDistance(){
  ridge(H*.25,H*.09,'#abb59a',1);ridge(H*.28,H*.055,'#b4af78',4);
  const y=project(158,0).y;
  rect(0,y,W,H,'#a4a572');
  ctx.save();ctx.translate(W*.5,y);const u=Math.min(W/420,H/620);ctx.scale(u,u);
  for(const x of [-14,-6,6,14])rect(x,-18,2,18,'#917558');
  poly([[-20,-17],[0,-31],[20,-17]],'#748b76');rect(-18,-18,36,3,'#526e62');ctx.restore();
}
function squareDistance(time){
  ridge(H*.235,H*.06,'#676f91',3);
  for(let i=-1;i<10;i++){
    const w=W*.12,x=i*w,y=H*(.23+.023*Math.sin(i*1.7));
    rect(x,y,w+1,H*.16,i%2?'#83859e':'#777f9a');
    poly([[x-2,y],[x+w*.4,y-w*.42],[x+w+2,y]],'#d1ced7');
    for(let j=0;j<2;j++)rect(x+w*(.2+j*.4),y+5,w*.14,w*.22,'#f4d398');
  }
  const y=project(155,0).y;
  rect(0,y,W,H,'#c4d4dd');
  ctx.save();ctx.translate(W*.5,y);const u=Math.min(W/470,H/690);ctx.scale(u,u);drawRouteObject(ctx,'square','side',1,time);ctx.restore();
}
function winterFacade(z,side,index){
  const near=streetPoint(z,side*2.62),far=streetPoint(z+12,side*2.62);
  const colors=['#9d8994','#8992a2','#a196a0'];
  const height=100+12*(index%3);
  poly([near,far,streetPoint(z+12,side*2.62,height),streetPoint(z,side*2.62,height)],colors[index%3]);
  poly([streetPoint(z,side*2.55,height),streetPoint(z+12,side*2.55,height),
    streetPoint(z+12,side*3.9,height+30),streetPoint(z,side*3.9,height+30)],'#edf1ef');
  for(let j=1;j<11;j+=3){
    poly([streetPoint(z+j,side*2.61,35),streetPoint(z+j+1.6,side*2.61,35),
      streetPoint(z+j+1.6,side*2.61,65),streetPoint(z+j,side*2.61,65)],'#ffda9b');
  }
}
function winterWires(time){
  for(let z=126-distance%32;z>-14;z-=32){
    const a=passingPoint(z,-2.62),b=passingPoint(z,2.62),y=a.y-96*a.s;
    ctx.strokeStyle='#536676';ctx.lineWidth=Math.max(.6,a.s*1.3);ctx.beginPath();ctx.moveTo(a.x,y);
    ctx.quadraticCurveTo(W*.5,y+24*a.s,b.x,y);ctx.stroke();
    for(let i=1;i<14;i++){
      const t=i/14;
      festiveLight(ctx,a.x+(b.x-a.x)*t,y+48*a.s*t*(1-t),3.5*a.s,['#ffe18a','#ff6659','#68adff'][i%3],time*Math.PI+i*Math.PI);
    }
  }
}
function routeStreet(place,time){
  if(place==='yard'){courtyard();return;}
  const pier=place==='pier',park=place==='park';
  const palette=routes[place];
  const sky=ctx.createLinearGradient(0,0,0,H*.32);
  sky.addColorStop(0,pier?'#505780':palette.sky);sky.addColorStop(1,pier?'#efb599':palette.light);
  rect(0,0,W,H,sky);oval(W*.7,H*.13,W*.05,W*.05,'#ffe8b9');
  if(pier)pierDistance(time);
  else if(park)parkDistance();
  else squareDistance(time);
  const end=165,front=-8;
  streetStrip(end,front,-1.66,1.66,pier?'#b69484':park?'#d5af7f':'#e6ebed');
  for(let z=end-distance%3;z>front;z-=3){
    const n=Math.max(front,z-3),row=Math.round((z+distance-end)/3);
    if(pier){
      streetStrip(z,n,-1.65,1.65,row%2?'#bb9985':'#c0a18b');
      streetStrip(z,Math.max(n,z-.09),-1.65,1.65,'#977e72');
    }else{
      for(const side of [-1,1]){
        const edge=side*(1.62+.085*Math.sin(row*.46));
        poly([streetPoint(z,edge),streetPoint(z,side*2.8),streetPoint(n,side*2.8),
          streetPoint(n,side*(1.62+.085*Math.sin((row-1)*.46)))],park?'#b0a56e':'#d1dde2');
        const p=project(z,side*(1.28+.24*Math.sin(row*2.1)));
        oval(p.x,p.y,Math.max(.15,p.s*(park?4:7)),Math.max(.1,p.s*1.5),park?(row%2?'#b68050':'#df9c53'):'#d7e1e6');
      }
    }
  }
  for(const l of [-1.64,-.5,.5,1.64])streetStrip(end,front,l-.009,l+.009,pier?'#a38575':park?'#c9a677':'#d6e0e4');
  for(let z=156-distance%12;z>-8;z-=12){
    const n=Math.max(front,z-12),index=Math.abs(Math.round((z+distance)/12));
    for(const side of [-1,1]){
      if(pier){
        const a=project(z,side*1.61),b=project(n,side*1.61);
        ctx.strokeStyle='#837570';ctx.lineWidth=Math.max(.7,b.s*2);ctx.beginPath();ctx.moveTo(a.x,a.y-23*a.s);
        ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-8*a.s,b.x,b.y-23*b.s);ctx.stroke();
        rect(a.x-3*a.s,a.y-29*a.s,6*a.s,29*a.s,'#726660');
      }else if(park){
        const p=project(z,side*(3.3+(index%3)*.55));
        const crown=(105+15*Math.sin(index*4+side))*p.s;
        oval(p.x,p.y,48*p.s,7*p.s,'#92956a');
        rect(p.x-4*p.s,p.y-crown,8*p.s,crown,'#806750');
        const tint=['#c79853','#ae985b','#ba8050'][(index+(side>0?1:0))%3];
        oval(p.x-16*p.s,p.y-crown+7*p.s,34*p.s,32*p.s,tint);
        oval(p.x+11*p.s,p.y-crown-8*p.s,33*p.s,41*p.s,tint);
        const bush=project(z,side*(2.35+.21*Math.sin(index)));
        oval(bush.x,bush.y-6*bush.s,27*bush.s,10*bush.s,'#a49b63');
      }else winterFacade(z,side,index);
    }
  }
  if(!pier&&!park)winterWires(time);
}
