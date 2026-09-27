import { describe,it,expect } from 'vitest';
import {fresh,turn,inverse,solvedFaces,stickers,scramble,rotate,type Axis} from './model';
describe('integer cube',()=>{
 it('contains 26 pieces and 54 distinct stickers',()=>{expect(fresh()).toHaveLength(26);expect(stickers).toHaveLength(54);expect(new Set(fresh().map(p=>p.pos.join(','))).size).toBe(26);});
 for(const axis of [0,1,2] as Axis[])for(const layer of [-1,0,1])for(const dir of [-1,1] as const){
  it('four quarter turns restore '+[axis,layer,dir],()=>{let p=fresh();for(let i=0;i<4;i++)p=turn(p,{axis,layer,dir});expect(p).toEqual(fresh());});
  it('inverse restores '+[axis,layer,dir],()=>{const m={axis,layer,dir};expect(turn(turn(fresh(),m),inverse(m))).toEqual(fresh());});
 }
 it('long legal sequence and exact reverse restore every orientation',()=>{
  let seed=123;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const moves=scramble(1000,random);let p=fresh();for(const m of moves)p=turn(p,m);
  expect(new Set(p.map(x=>x.pos.join(','))).size).toBe(26);
  for(const x of p)for(const row of x.basis)for(const value of row)expect([-1,0,1]).toContain(value);
  for(const m of moves.reverse())p=turn(p,inverse(m));expect(p).toEqual(fresh());
 });
 it('detects center orientation corruption even when all positions match',()=>{
  const p=fresh();const center=p.find(x=>x.home.join(',')==='0,0,1')!;
  center.basis=center.basis.map(v=>rotate(v,2,1)) as typeof center.basis;
  expect(solvedFaces(p)).not.toContain(0);
 });
 it('accepts a rigid rotation of the whole logical cube',()=>{
  let p=fresh();for(const layer of [-1,0,1])p=turn(p,{axis:1,layer,dir:1});expect(solvedFaces(p)).toHaveLength(6);
 });
 it('does not count mixed adjacent faces as solved',()=>{
  expect(solvedFaces(turn(fresh(),{axis:0,layer:1,dir:1}))).not.toContain(0);
 });
});
