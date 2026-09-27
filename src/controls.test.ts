import {describe,it,expect} from 'vitest';
import {Euler,Quaternion} from 'three';
import {captureControls} from './controls';
import {fresh,stickers,turn,inverse} from './model';
describe('fixed selection keyboard commands',()=>{
 for(const angle of [[-.30,.48,0],[.7,-1.1,.4],[1.2,2,.8]]){
  it('all tiles: opposite keys and four repetitions restore '+angle,()=>{
   const pieces=fresh(),view=new Quaternion().setFromEuler(new Euler(...angle as [number,number,number]));
   for(const s of stickers){
    const c=captureControls(pieces[s.pieceId],s,view);
    expect(c.s).toEqual(inverse(c.w));expect(c.d).toEqual(inverse(c.a));
    for(const [a,b] of [['w','s'],['a','d']] as const){
     expect(turn(turn(pieces,c[a]),c[b])).toEqual(pieces);
     let next=pieces;for(let i=0;i<4;i++)next=turn(next,c[a]);expect(next).toEqual(pieces);
    }
   }
  });
 }
 it('initial front W goes up, A goes left',()=>{
  const p=fresh(),s=stickers.find(s=>s.face===0)!;
  const c=captureControls(p[s.pieceId],s,new Quaternion().setFromEuler(new Euler(-.3,.48,0)));
  expect(c.w).toEqual({axis:0,layer:p[s.pieceId].pos[0],dir:-1});
  expect(c.a).toEqual({axis:1,layer:p[s.pieceId].pos[1],dir:-1});
 });
});
