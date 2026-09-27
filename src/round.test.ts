import {it,expect} from 'vitest';
import {prepareRound,firstVictory} from './round';
import {useGame} from './store';
import {fresh,turn,inverse,solvedFaces} from './model';
it('3 and 12 moves start with no completed face, even constant random',()=>{
 for(const n of [3,12])for(let i=0;i<20;i++){const moves=prepareRound(n,i===0?()=>0:Math.random);expect(moves).toHaveLength(n);expect(solvedFaces(moves.reduce(turn,fresh()))).toHaveLength(0);}
});
it('one-face round waits for scramble and locks at the first early solution',()=>{
 const g=useGame;g.getState().setMode('one');g.getState().move({axis:0,layer:1,dir:1});expect(g.getState().active).toBeNull();
 g.getState().mix(3);while(g.getState().active)g.getState().finish();
 expect(g.getState().phase).toBe('playing');expect(g.getState().victory).toBeNull();expect(solvedFaces(g.getState().pieces)).toHaveLength(0);
 // Reversing two moves leaves just one outer turn: at least one face is already solved.
 g.getState().undo();g.getState().finish();if(g.getState().phase!=='won'){g.getState().undo();g.getState().finish();}
 expect(g.getState().phase).toBe('won');expect(g.getState().playMoves).toBeLessThanOrEqual(2);expect(g.getState().victory?.pieceIds).toHaveLength(9);
 const pieces=g.getState().pieces;g.getState().move({axis:0,layer:1,dir:1});g.getState().undo();expect(g.getState().active).toBeNull();expect(g.getState().pieces).toEqual(pieces);
 g.getState().mix(3);expect(g.getState().victory).toBeNull();while(g.getState().active)g.getState().finish();expect(g.getState().phase).toBe('playing');expect(g.getState().playMoves).toBe(0);
 g.getState().reset();expect(g.getState().phase).toBe('ready');
});
it('all moves can be manually inverted and firstVictory agrees with exact solved faces',()=>{
 const moves=prepareRound(3);let p=moves.reduce(turn,fresh());expect(firstVictory(p)).toBeNull();for(const m of [...moves].reverse()){p=turn(p,inverse(m));expect(!!firstVictory(p)).toBe(solvedFaces(p).length>0);}
});
it('six-face free manipulation remains available',()=>{
 useGame.getState().setMode('six');useGame.getState().move({axis:0,layer:1,dir:1});useGame.getState().finish();expect(useGame.getState().victory).toBeNull();useGame.getState().undo();useGame.getState().finish();expect(solvedFaces(useGame.getState().pieces)).toHaveLength(6);
});
