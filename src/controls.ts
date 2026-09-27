import {Quaternion,Vector2,Vector3} from 'three';
import {inverse,transform,type Piece,type Sticker,type Move,type Axis} from './model';
export type Controls=Record<'w'|'s'|'a'|'d',Move>;
// Capture on selection, not after every turn: a moved sticker must not redefine keys.
export function captureControls(p:Piece,s:Sticker,view:Quaternion):Controls {
 const normal=new Vector3(...transform(p.basis,s.normal));
 const choose=(desired:Vector2):Move=>{
  let best=-Infinity,result:Move|undefined;
  for(const axis of [0,1,2] as Axis[]){
   const a=new Vector3().setComponent(axis,1);if(Math.abs(a.dot(normal))>.5)continue;
   for(const dir of [-1,1] as const){
    const tangent=a.clone().cross(normal).multiplyScalar(dir).applyQuaternion(view);
    const score=new Vector2(tangent.x,tangent.y).normalize().dot(desired);
    if(score>best){best=score;result={axis,layer:p.pos[axis],dir};}
   }
  }
  return result!;
 };
 const w=choose(new Vector2(0,1)),a=choose(new Vector2(-1,0));
 return {w,s:inverse(w),a,d:inverse(a)};
}
