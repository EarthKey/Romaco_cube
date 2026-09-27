import {it,expect} from 'vitest';
import {useGame} from './store';
import {solvedFaces} from './model';
it('starts scrambled immediately with no queued animation or undoable shuffle',()=>{
 for(const mode of ['one','six'] as const){useGame.getState().setMode(mode);expect(useGame.getState().start(12)).toBe(true);const s=useGame.getState();expect(s.phase).toBe('playing');expect(s.active).toBeNull();expect(s.pending).toEqual([]);expect(s.history).toEqual([]);expect(s.playMoves).toBe(0);expect(solvedFaces(s.pieces)).toEqual([]);expect(s.lastMix).toBe(12);}
});
it('rejects invalid counts without replacing the board',()=>{const before=useGame.getState().pieces;expect(useGame.getState().start(2)).toBe(false);expect(useGame.getState().pieces).toBe(before);});
it('keeps the selected medium difficulty when a round starts',()=>{useGame.getState().setDifficulty('medium');expect(useGame.getState().start(3)).toBe(true);expect(useGame.getState().difficulty).toBe('medium');useGame.getState().setDifficulty('easy');});
it('keeps the selected hard difficulty when a round starts',()=>{useGame.getState().setDifficulty('hard');expect(useGame.getState().start(3)).toBe(true);expect(useGame.getState().difficulty).toBe('hard');useGame.getState().setDifficulty('easy');});
it('keeps the Romaco theme when a round starts',()=>{useGame.getState().setClan('ロマ子');useGame.getState().setDifficulty('easy');expect(useGame.getState().start(3)).toBe(true);expect(useGame.getState().clan).toBe('ロマ子');});
