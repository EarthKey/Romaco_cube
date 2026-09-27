import {describe,expect,it,vi} from 'vitest';
import {BGM_LOOP_GAP_MS,scheduleBgmReplay} from './bgm-loop';

describe('BGM loop gap',()=>{
 it('replays after exactly three seconds',()=>{
  const replay=vi.fn();
  let queued:(()=>void)|undefined;
  const id=scheduleBgmReplay(replay,(callback,delay)=>{
   expect(delay).toBe(3000);
   queued=callback;
   return 7;
  });
  expect(BGM_LOOP_GAP_MS).toBe(3000);
  expect(id).toBe(7);
  expect(replay).not.toHaveBeenCalled();
  queued?.();
  expect(replay).toHaveBeenCalledOnce();
 });
});
