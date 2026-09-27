import {useEffect,useRef} from 'react';
import * as T from 'three';
import {clanFaceNames,useGame,type Clan} from './store';
import {captureControls,type Controls} from './controls';
import {faceView,DEFAULT_YAW,VIEW_TILT,wrapYaw} from './view';
import {celebrationAt} from './celebration';
import {stickersFor,faces,transform,solvedFaces,type Move,type Axis,type Vec} from './model';

type FaceMedia={image:string;video?:string;flipX?:boolean;once?:boolean};
// Approved still images for the easy level and entry preview.
// Stage 1 uses a still image, stage 2 may add a video, and stage 3 may replace both.
const romacoFaceMedia:Partial<Record<number,FaceMedia&{hard?:FaceMedia}>>={
 0:{image:'/romaco/easy/face-1.png'},
 1:{image:'/romaco/easy/face-2.png'},
 2:{image:'/romaco/easy/face-3.png'},
 3:{image:'/romaco/easy/face-4.png'},
 4:{image:'/romaco/easy/face-5.png'},
 5:{image:'/romaco/easy/face-6.png'},
};

export function Scene({preview=false}:{preview?:boolean}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
 const el=host.current!; let renderer:T.WebGLRenderer;
 try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{el.textContent='WebGLを利用できません。ChromeまたはEdgeでお試しください。';return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=T.SRGBColorSpace;
 el.appendChild(renderer.domElement);const canvas=renderer.domElement;
 const surface:HTMLElement=preview?canvas:document.createElement('div');if(!preview){surface.className='rotation-surface';el.parentElement!.appendChild(surface);}
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,100); camera.position.z=9;
 const root=new T.Group();scene.add(root);
 const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=64;
 const starCtx=starCanvas.getContext('2d')!;
 const glow=starCtx.createRadialGradient(32,32,0,32,32,30);glow.addColorStop(0,'#ffffff');glow.addColorStop(.18,'#fff3b8');glow.addColorStop(1,'#ffd35a00');
 starCtx.fillStyle=glow;starCtx.fillRect(0,0,64,64);starCtx.fillStyle='#fff5ce';starCtx.beginPath();
 for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?5:27;const x=32+Math.cos(a)*r,y=32+Math.sin(a)*r;i?starCtx.lineTo(x,y):starCtx.moveTo(x,y);}starCtx.closePath();starCtx.fill();
 const starTexture=new T.CanvasTexture(starCanvas);
 const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(28*3),3));
 const starMat=new T.PointsMaterial({map:starTexture,color:'#fff0ad',size:.24,transparent:true,opacity:0,depthWrite:false,depthTest:false,blending:T.AdditiveBlending});
 const stars=new T.Points(starGeo,starMat);stars.frustumCulled=false;stars.renderOrder=10;scene.add(stars);
 let yaw=DEFAULT_YAW,pitch=VIEW_TILT;
 const initial=()=>{yaw=DEFAULT_YAW;pitch=VIEW_TILT;root.quaternion.copy(faceView(useGame.getState().viewFace,yaw,pitch));};
 initial();
 scene.add(new T.HemisphereLight(0xffffff,0xb1a19a,2.5));
 const light=new T.DirectionalLight(0xffffff,3);light.position.set(3,5,7);scene.add(light);
 // The cube stays 3 units across at any size: a 2x2 uses 1.5-unit pieces spaced .75 apart,
 // so swapping the size never changes how big the puzzle looks on screen.
 const cubeSize=preview?3:useGame.getState().size,unit=cubeSize===2?1.5:1,step=cubeSize===2?.75:1;
 const tiles=stickersFor(cubeSize),perFace=tiles.length/6,pieceCount=cubeSize===2?8:26;
 const bodyGeo=new T.BoxGeometry(.985*unit,.985*unit,.985*unit);
 const bodyMat=new T.MeshStandardMaterial({color:0x514449,roughness:.75});
 const bodies=new T.InstancedMesh(bodyGeo,bodyMat,pieceCount);root.add(bodies);
 // A cube-shaped touch guide follows the actual 3D orientation. Gold is reserved
 // for dark mode; cream mode uses its cool complementary colour for contrast.
 const touchCornerGeo=new T.BufferGeometry(),touchCornerPositions:number[]=[];
 for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5])touchCornerPositions.push(x,y,z);
 touchCornerGeo.setAttribute('position',new T.Float32BufferAttribute(touchCornerPositions,3));
 const cornerCanvas=document.createElement('canvas');cornerCanvas.width=cornerCanvas.height=64;const cornerCtx=cornerCanvas.getContext('2d')!;
 const cornerGradient=cornerCtx.createRadialGradient(32,32,0,32,32,31);cornerGradient.addColorStop(0,'#fff');cornerGradient.addColorStop(.18,'#fff');cornerGradient.addColorStop(.55,'#ffffff70');cornerGradient.addColorStop(1,'#ffffff00');
 cornerCtx.fillStyle=cornerGradient;cornerCtx.fillRect(0,0,64,64);const touchCornerTexture=new T.CanvasTexture(cornerCanvas);
 const touchCornerMat=new T.PointsMaterial({map:touchCornerTexture,color:'#16845b',size:.48,transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending});
 const touchCornerCoreMat=new T.PointsMaterial({color:'#16845b',size:.11,transparent:true,opacity:.7,depthWrite:false});
 const touchCorners=new T.Points(touchCornerGeo,touchCornerMat),touchCornerCores=new T.Points(touchCornerGeo,touchCornerCoreMat);root.add(touchCorners,touchCornerCores);
 const clan=preview?'ロマ子':useGame.getState().clan;
 const faceMedia=preview||useGame.getState().difficulty==='easy'?romacoFaceMedia:{};
 const difficulty=preview?'easy':useGame.getState().difficulty;const animateFaces=difficulty!=='easy';
 const textures:T.Texture[]=[];const videos:HTMLVideoElement[]=[];
 const materials:T.MeshBasicMaterial[]=[];const meshes:T.Mesh[]=[];
 const lists=faces.map((_,i)=>tiles.filter(s=>s.face===i));
 faces.forEach((f,i)=>{
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;
 ctx.fillStyle=f.color;ctx.fillRect(0,0,512,512);
 ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold 42px sans-serif';ctx.fillText('ROMACO',256,210);ctx.font='bold 34px sans-serif';ctx.fillText(clanFaceNames[clan][i],256,268,440);ctx.font='20px sans-serif';ctx.fillText('ART PLACEHOLDER',256,315);
 ctx.font='24px sans-serif';
 const cell=512/cubeSize;
 for(let y=0;y<cubeSize;y++)for(let x=0;x<cubeSize;x++){ctx.fillText('↑',x*cell+cell/2,y*cell+cell*.22);ctx.fillText(String(y*cubeSize+x+1),x*cell+cell/2,y*cell+cell*.88);}
 const fallback=new T.CanvasTexture(c);fallback.colorSpace=T.SRGBColorSpace;textures.push(fallback);
 const mat=new T.MeshBasicMaterial({map:fallback});materials.push(mat);
 const base=faceMedia[i],media=base&&difficulty==='hard'&&base.hard?base.hard:base;let videoReady=false;
 if(media)new T.TextureLoader().load(media.image,tex=>{if(disposed){tex.dispose();return;}tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(tex);if(!videoReady){mat.map=tex;mat.needsUpdate=true;}},undefined,()=>useGame.setState({notice:`${clanFaceNames[clan][i]}の画像を読み込めません。${media.image} を確認してください。`}));
 if(media?.video&&animateFaces){
  const video=document.createElement('video');videos.push(video);video.className='face-video-source';video.hidden=true;video.setAttribute('aria-hidden','true');video.src=media.video;video.muted=true;video.loop=!media.once;video.playsInline=true;video.preload='auto';video.disablePictureInPicture=true;el.appendChild(video);
  video.onloadeddata=()=>{if(disposed)return;videoReady=true;const tex=new T.VideoTexture(video);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=T.LinearFilter;tex.magFilter=T.LinearFilter;textures.push(tex);mat.map=tex;mat.needsUpdate=true;if(!useGame.getState().reduced)void video.play().catch(()=>{});};
  video.onerror=()=>useGame.setState({notice:`${clanFaceNames[clan][i]}のアニメを読み込めません。静止画で表示します。${media.video} を確認してください。`});video.load();
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(perFace*12),3));
 const uv:number[]=[],ix:number[]=[];
 lists[i].forEach((s,j)=>{for(const [x,y] of [[0,0],[1,0],[1,1],[0,1]]){const u=(s.col+x)/cubeSize;uv.push(media?.flipX?1-u:u,(s.row+y)/cubeSize);}const n=j*4;ix.push(n,n+1,n+2,n,n+2,n+3);});
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ix);
 // Tiles migrate to other faces; a fixed whole-cube bound prevents stale raycast bounds.
 geo.boundingSphere=new T.Sphere(new T.Vector3(),4);
 const mesh=new T.Mesh(geo,mat);mesh.frustumCulled=false;root.add(mesh);meshes.push(mesh);
 });
 const outlineGeo=new T.EdgesGeometry(new T.PlaneGeometry(1,1));
 const outlineMat=new T.LineBasicMaterial({color:'#fff4a3'});
 const outline=new T.LineSegments(outlineGeo,outlineMat);outline.scale.setScalar(unit);root.add(outline);
 const border=(outer:number,inner:number)=>{
 const shape=new T.Shape();shape.moveTo(-outer,-outer);shape.lineTo(outer,-outer);shape.lineTo(outer,outer);shape.lineTo(-outer,outer);shape.closePath();
 const hole=new T.Path();hole.moveTo(-inner,-inner);hole.lineTo(-inner,inner);hole.lineTo(inner,inner);hole.lineTo(inner,-inner);hole.closePath();shape.holes.push(hole);return new T.ShapeGeometry(shape);
 };
 const rimGeo=border(.505,.471),haloGeo=border(.54,.456);
 const rimMat=new T.MeshBasicMaterial({color:'#ffd44a',transparent:true,opacity:.95,depthWrite:false,side:T.DoubleSide});
 const haloMat=new T.MeshBasicMaterial({color:'#ffd44a',transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 const rim=new T.Mesh(rimGeo,rimMat),halo=new T.Mesh(haloGeo,haloMat);outline.add(halo,rim);
 const ray=new T.Raycaster(),pointer=new T.Vector2(),matrix=new T.Matrix4(),dummy=new T.Object3D();
 let disposed=false,frame=0,previous=performance.now(),spacing=1.12,lastReset=0;
 let drag:null|{id:number;x:number;y:number;lastX:number;lastY:number;start:number;tile:boolean;cancel:boolean}=null;
 let vx=0,vy=0,join=0;
 let winning:ReturnType<typeof useGame.getState>['victory']=null,winStart=0;
 let celebration=celebrationAt(0);
 const winFrom=new T.Quaternion();
 const v=(a:Vec)=>new T.Vector3(...a);
 const axisVector=(axis:Axis)=>new T.Vector3(axis===0?1:0,axis===1?1:0,axis===2?1:0);
 let controls:Controls|null=null;
 const direction=(key:string):Move|null=>useGame.getState().selection&&controls&&Object.hasOwn(controls,key)?controls[key as keyof Controls]:null;
 const act=(key:string)=>{const s=useGame.getState();if(s.active||s.phase==='won'||document.querySelector('[role="dialog"]'))return;const m=direction(key);if(m)s.move(m);else useGame.setState({notice:'先にキューブのマスを選んでください。'});};
 const command=(e:Event)=>act((e as CustomEvent<string>).detail);
 window.addEventListener('cube-direction',command);
 const keyboard=(e:KeyboardEvent)=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName))return;if('wasd'.includes(e.key.toLowerCase())&&e.key.length===1){e.preventDefault();act(e.key.toLowerCase());}};
 window.addEventListener('keydown',keyboard);
 const hitSticker=(clientX:number,clientY:number)=>{
  const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
  ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes)[0];
  if(!hit)return null;const fi=meshes.indexOf(hit.object as T.Mesh);return lists[fi][Math.floor((hit.faceIndex??0)/2)]??null;
 };
 const down=(e:PointerEvent)=>{
 if(drag){drag.cancel=true;return;}if(useGame.getState().active||useGame.getState().phase==='won')return;
 let s=hitSticker(e.clientX,e.clientY);
 if(!s&&e.pointerType==='touch')for(const [dx,dy] of [[18,0],[-18,0],[0,18],[0,-18],[13,13],[-13,13],[13,-13],[-13,-13]]){s=hitSticker(e.clientX+dx,e.clientY+dy);if(s)break;}
 controls=s?captureControls(useGame.getState().pieces[s.pieceId],s,root.quaternion):null;
 useGame.getState().select(s);vx=0;vy=0;surface.setPointerCapture(e.pointerId);
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,start:performance.now(),tile:!!s,cancel:false};
 };
 const move=(e:PointerEvent)=>{
 if(!drag||drag.id!==e.pointerId||drag.cancel)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(drag.tile){

 if(Math.hypot(dx,dy)<24)return;
 if(e.pointerType==='mouse'||performance.now()-drag.start<200){drag.tile=false;controls=null;useGame.getState().select(null);}else{
 act(Math.abs(dx)>Math.abs(dy)?dx>0?'d':'a':dy>0?'s':'w');drag.cancel=true;return;}
 }
 if(!drag.tile){
 vx=(e.clientX-drag.lastX)*.005;
 vy=(e.clientY-drag.lastY)*.005;
 pitch=wrapYaw(pitch+vy);
 yaw=wrapYaw(yaw+vx);root.quaternion.copy(faceView(useGame.getState().viewFace,yaw,pitch));
 drag.lastX=e.clientX;drag.lastY=e.clientY;
 }};
 const up=(e:PointerEvent)=>{if(drag?.id===e.pointerId)drag=null;};
 const cancel=()=>{drag=null;vx=0;vy=0;};
 surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move);
 surface.addEventListener('pointerup',up);surface.addEventListener('pointercancel',cancel);surface.addEventListener('lostpointercapture',up);
 window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',cancel);
 const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<.8?10.8:9;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(el);resize();
 let sample=0,frames=0,sampleStart=performance.now(),lastVideoEnabled:boolean|null=null,nextVideoRetry=0;
 const tick=(now:number)=>{
 frame=requestAnimationFrame(tick);const dt=Math.min((now-previous)/1000,.04);previous=now;
 const state=useGame.getState();
 const videoEnabled=!state.reduced&&document.visibilityState==='visible';
 if(videoEnabled!==lastVideoEnabled){lastVideoEnabled=videoEnabled;videos.forEach(video=>{if(videoEnabled&&video.readyState>=2&&!video.ended)void video.play().catch(()=>{});else video.pause();});}
 if(videoEnabled&&now>=nextVideoRetry){nextVideoRetry=now+1000;videos.forEach(video=>{if(video.paused&&video.readyState>=2&&!video.ended)void video.play().catch(()=>{});});}
 if(state.resetView!==lastReset){lastReset=state.resetView;initial();cancel();controls=null;state.select(null);}
 if(!drag&&!state.selection&&!state.reduced&&!state.active&&state.phase!=='won'){yaw=wrapYaw(yaw+vx*dt*60);pitch=wrapYaw(pitch+vy*dt*60);vx*=Math.exp(-6*dt);vy*=Math.exp(-6*dt);}
 if(state.phase!=='won')root.quaternion.copy(faceView(state.viewFace,yaw,pitch));
 const victory=state.victory;
 if(victory!==winning){winning=victory;winStart=now;winFrom.copy(root.quaternion);}
 celebration=celebrationAt((now-winStart)/1000,state.reduced);
 join=victory?celebration.join:0;
 if(victory){cancel();matrix.makeBasis(v(victory.right),v(victory.up),v(victory.normal));const target=new T.Quaternion().setFromRotationMatrix(matrix).invert();root.quaternion.copy(winFrom).slerp(target,celebration.align);root.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),celebration.angle));}
 stars.visible=!!victory&&celebration.sparkle>0;
 if(stars.visible){const attr=starGeo.getAttribute('position') as T.BufferAttribute;const travel=1-celebration.sparkle;
  for(let i=0;i<28;i++){const a=i*2.399963,r=1.65+(i%4)*.13+travel*.55;attr.setXYZ(i,Math.cos(a)*r,Math.sin(a)*r,2);}
  attr.needsUpdate=true;starMat.opacity=celebration.sparkle*.95;starMat.size=.18+.13*celebration.sparkle;
 }
 const done=state.mode==='six'&&state.moved&&!state.active&&solvedFaces(state.pieces).length===6;
 spacing+=( (done?1:1+state.gap)-spacing)*Math.min(1,dt*9);
 root.position.y=state.reduced||drag||victory?0:Math.sin(now*.0007)*.045;
 const frameColor=document.documentElement.dataset.theme==='dark'?'#ffd36b':'#16845b';
 touchCornerMat.color.set(frameColor);touchCornerCoreMat.color.set(frameColor);
 const frameSize=2*spacing*step+1.16*unit,touching=!!drag?.tile;
 touchCorners.scale.setScalar(frameSize);touchCornerCores.scale.setScalar(frameSize);
 touchCornerMat.size=touching ? .68 : .48+(state.reduced?0:Math.sin(now*.0022)*.036);
 touchCornerMat.opacity+=((touching ? .68 : .48)-touchCornerMat.opacity)*Math.min(1,dt*12);
 const animation=state.active,progress=animation?Math.min(1,(now-animation.started)/(state.reduced?70:220)):0;
 const rotation=animation?new T.Quaternion().setFromAxisAngle(axisVector(animation.move.axis),animation.move.dir*Math.PI/2*(progress*progress*(3-2*progress))):new T.Quaternion();
 const positions:T.Vector3[]=[],orientations:T.Quaternion[]=[];
 const preview=state.preview?direction(state.preview):null;
 state.pieces.forEach((p,i)=>{
 const pos=v(p.pos).multiplyScalar(spacing*step);matrix.makeBasis(v(p.basis[0]),v(p.basis[1]),v(p.basis[2]));
 if(victory&&victory.pieceIds.includes(p.id))for(const axis of [0,1,2])if(victory.normal[axis]===0)pos.setComponent(axis,p.pos[axis]*step*(spacing-(spacing-1)*join));
 if(victory)pos.addScaledVector(v(p.pos),celebration.spread*step);
 const q=new T.Quaternion().setFromRotationMatrix(matrix);
 if(animation&&p.pos[animation.move.axis]===animation.move.layer){pos.applyQuaternion(rotation);q.premultiply(rotation);}
 positions.push(pos);orientations.push(q);dummy.position.copy(pos);dummy.quaternion.copy(q);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);
 bodies.setColorAt(i,new T.Color(preview&&p.pos[preview.axis]===preview.layer?(state.preview==='w'||state.preview==='s'?'#f65765':'#24cf98'):'#514449'));
 });
 bodies.instanceMatrix.needsUpdate=true;if(bodies.instanceColor)bodies.instanceColor.needsUpdate=true;
 const size=1-Math.min(1,(spacing-1)/.12)*.04;
 lists.forEach((list,i)=>{const attr=meshes[i].geometry.getAttribute('position') as T.BufferAttribute;
 list.forEach((s,j)=>{const q=orientations[s.pieceId],pos=positions[s.pieceId];
 [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].forEach(([x,y],k)=>{
 const tileSize=victory&&s.face===victory.face?size+(1.001-size)*join:size;
 const point=v(s.normal).multiplyScalar(.5*unit).addScaledVector(v(s.right),x*tileSize*unit).addScaledVector(v(s.up),y*tileSize*unit).applyQuaternion(q).add(pos);
 attr.setXYZ(j*4+k,point.x,point.y,point.z);});});attr.needsUpdate=true;});
 outline.visible=!!state.selection;
 haloMat.opacity=state.reduced?.24:.22+Math.sin(now*.003)*.08;
 if(state.selection){const s=state.selection,q=orientations[s.pieceId];matrix.makeBasis(v(s.right),v(s.up),v(s.normal));outline.quaternion.setFromRotationMatrix(matrix).premultiply(q);
 outline.position.copy(v(s.normal).multiplyScalar(.506*unit).applyQuaternion(q).add(positions[s.pieceId]));}
 // Fit every animated cubie corner inside the dedicated canvas even at large size.
 camera.zoom=1;camera.updateProjectionMatrix();root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 let extent=0;
 for(let i=0;i<positions.length;i++)for(const x of [-.55,.55])for(const y of [-.55,.55])for(const z of [-.55,.55]){
 const point=new T.Vector3(x,y,z).applyQuaternion(orientations[i]).add(positions[i]);root.localToWorld(point);point.project(camera);extent=Math.max(extent,Math.abs(point.x),Math.abs(point.y));
 }
 // Fit size choices inside the canvas, which excludes the A/D button lanes.
 const occupancy={small:.70,medium:.84,large:.98}[state.displaySize];
 camera.zoom=occupancy/Math.max(extent,.001);camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 frames++;if(now-sampleStart>1000){sample=Math.round(frames*1000/(now-sampleStart));frames=0;sampleStart=now;
 const info=document.getElementById('render-info');if(info)info.textContent=sample+' fps · '+renderer.info.render.calls+' draw calls';}
 if(animation&&progress===1)state.finish();
 };
 frame=requestAnimationFrame(tick);
 // Read-only diagnostics: tests still operate through pointer and keyboard events.
 (window as any).__cube={snapshot:()=>{const s=useGame.getState();return {pieces:s.pieces,solved:solvedFaces(s.pieces),busy:!!s.active,history:s.history.length,selection:s.selection,spacing,fps:sample,celebration:s.victory?celebration:null,media:videos.map(video=>({file:video.src.split('/').at(-1),readyState:video.readyState,currentTime:video.currentTime,paused:video.paused,error:video.error?.code??null}))};},
 tilePoint:(face:number,index:number)=>{const s=lists[face][index],p=useGame.getState().pieces[s.pieceId];const pt=v(p.pos).multiplyScalar(spacing*step).add(v(transform(p.basis,s.normal)).multiplyScalar(.51*unit));root.localToWorld(pt);pt.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(pt.x+1)*r.width/2,y:r.top+(1-pt.y)*r.height/2};}};
 return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',keyboard);window.removeEventListener('cube-direction',command);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',cancel);videos.forEach(video=>{video.pause();video.onloadeddata=null;video.onerror=null;video.removeAttribute('src');video.load();video.remove();});renderer.dispose();starGeo.dispose();starMat.dispose();starTexture.dispose();touchCornerGeo.dispose();touchCornerMat.dispose();touchCornerCoreMat.dispose();touchCornerTexture.dispose();bodyGeo.dispose();bodyMat.dispose();outlineGeo.dispose();outlineMat.dispose();meshes.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());if(!preview)surface.remove();canvas.remove();delete (window as any).__cube;};
 },[preview]);
 return <div className="scene" ref={host} aria-label="3Dキューブ。マスを選びWASD、または長押しスワイプで回転" />;
}
