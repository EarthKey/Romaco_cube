import {describe,it,expect} from 'vitest';
import {fresh,stickersFor,turn,inverse,solvedFaces,scramble,type Move} from './model';
import {prepareRound,firstVictory} from './round';
import {useGame} from './store';

describe('2x2 cube',()=>{
 it('has 8 pieces and 24 tiles, four per face, indexed 0..1',()=>{
  expect(fresh(2)).toHaveLength(8);
  const tiles=stickersFor(2);
  expect(tiles).toHaveLength(24);
  for(let face=0;face<6;face++)expect(tiles.filter(t=>t.face===face)).toHaveLength(4);
  expect(new Set(tiles.map(t=>`${t.col},${t.row}`))).toEqual(new Set(['0,0','1,0','0,1','1,1']));
 });

 it('keeps the 3x3 tile grid untouched',()=>{
  expect(fresh()).toHaveLength(26);
  expect(stickersFor(3)).toHaveLength(54);
  expect(new Set(stickersFor(3).map(t=>t.col))).toEqual(new Set([0,1,2]));
 });

 it('counts every face as complete when untouched, although it has no centre piece',()=>{
  const pieces=fresh(2);
  expect(pieces.some(p=>p.home.filter(n=>n===0).length===2)).toBe(false); // no centre exists
  expect(solvedFaces(pieces)).toEqual([0,1,2,3,4,5]);
 });

 it('breaks and restores a face through a move and its inverse',()=>{
  const move:Move={axis:2,layer:1,dir:1};
  const turned=turn(fresh(2),move);
  expect(solvedFaces(turned)).not.toEqual([0,1,2,3,4,5]);
  expect(solvedFaces(turn(turned,inverse(move)))).toEqual([0,1,2,3,4,5]);
 });

 it('scrambles to a state with no finished face, then rewinds to a win',()=>{
  for(const count of [3,6,12]){
   const moves=prepareRound(count,Math.random,fresh(2));
   expect(moves).toHaveLength(count);
   const mixed=moves.reduce(turn,fresh(2));
   expect(solvedFaces(mixed)).toHaveLength(0);
   const back=[...moves].reverse().map(inverse).reduce(turn,mixed);
   expect(solvedFaces(back)).toEqual([0,1,2,3,4,5]);
  }
 });

 it('reports a victory made of four tiles',()=>{
  const move:Move={axis:2,layer:1,dir:1};
  const mixed=turn(fresh(2),move);
  const victory=firstVictory(turn(mixed,inverse(move)));
  expect(victory).not.toBeNull();
  expect(victory!.pieceIds).toHaveLength(4);
 });

 it('stays solvable when the whole cube is rotated, having no fixed centre',()=>{
  // Turning both layers of one axis rotates the entire 2x2; every face must stay complete.
  const both=[{axis:0,layer:1,dir:1},{axis:0,layer:-1,dir:1}] as Move[];
  expect(solvedFaces(both.reduce(turn,fresh(2)))).toEqual([0,1,2,3,4,5]);
 });

 it('never produces a same-axis pair in a scramble',()=>{
  const moves=scramble(12);
  for(let i=1;i<moves.length;i++)expect(moves[i].axis).not.toBe(moves[i-1].axis);
 });

 it('starts a child-sized game from a single tap',()=>{
  useGame.getState().setSize(3);
  expect(useGame.getState().startForChildren()).toBe(true);
  const s=useGame.getState();
  expect(s.size).toBe(2);
  expect(s.clan).toBe('ロマ子');        // the internal 2x2 route uses the Romaco theme
  expect(s.difficulty).toBe('easy');   // still pictures
  expect(s.mode).toBe('one');          // finishing any one face ends it
  expect(s.lastMix).toBe(3);
  expect(s.pieces).toHaveLength(8);
  expect(s.phase).toBe('playing');
  expect(solvedFaces(s.pieces)).toHaveLength(0); // it really starts scrambled
 });

 it('returns to the 3x3 when the grown-up route is used afterwards',()=>{
  useGame.getState().startForChildren();
  expect(useGame.getState().size).toBe(2);
  useGame.getState().setSize(3);
  expect(useGame.getState().start(3)).toBe(true);
  expect(useGame.getState().pieces).toHaveLength(26);
 });
});
