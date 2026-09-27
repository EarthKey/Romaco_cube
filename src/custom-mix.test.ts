import {it,expect} from 'vitest';
import {prepareRound} from './round';
import {fresh,turn,solvedFaces} from './model';
import {useGame} from './store';
it('supports every count, avoids adjacent axes and leaves no completed face',()=>{
 for(let n=3;n<=30;n++)for(const random of [()=>0,Math.random]){
  const moves=prepareRound(n,random);expect(moves).toHaveLength(n);
  expect(solvedFaces(moves.reduce(turn,fresh()))).toHaveLength(0);
  for(let i=1;i<n;i++)expect(moves[i].axis).not.toBe(moves[i-1].axis);
 }
});
it('rejects invalid counts before changing either game mode',()=>{
 for(const mode of ['one','six'] as const)for(const n of [0,2,31,3.5,NaN,Infinity]){
  useGame.getState().setMode(mode);const before=useGame.getState().pieces;
  useGame.getState().mix(n);expect(useGame.getState().active).toBeNull();expect(useGame.getState().pieces).toBe(before);
  expect(()=>prepareRound(n)).toThrow();
 }
});
it('custom mix executes exactly the requested moves and supports current six-face state',()=>{
 for(const mode of ['one','six'] as const){
  useGame.getState().setMode(mode);
  for(const n of [5,30]){
   const start=mode==='one'?0:useGame.getState().history.length;
   useGame.getState().mix(n);let count=0;while(useGame.getState().active){useGame.getState().finish();count++;}
   expect(count).toBe(n);expect(useGame.getState().history).toHaveLength(start+n);
   expect(useGame.getState().lastMix).toBe(n);expect(solvedFaces(useGame.getState().pieces)).toHaveLength(0);
   expect(useGame.getState().playMoves).toBe(0);
  }
 }
});
