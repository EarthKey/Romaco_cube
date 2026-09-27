import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {faces} from './model';
import {faceView,horizontalView,DEFAULT_YAW} from './view';
import {useGame} from './store';
it('brings each face forward with the same display tilt and upright image',()=>{
 for(let i=0;i<6;i++)for(const yaw of [DEFAULT_YAW,0,1,-2,Math.PI*2]){
  const q=faceView(i,yaw),base=horizontalView(yaw);
  expect(new Vector3(...faces[i].normal).applyQuaternion(q).distanceTo(new Vector3(0,0,1).applyQuaternion(base))).toBeLessThan(1e-12);
  expect(new Vector3(...faces[i].up).applyQuaternion(q).distanceTo(new Vector3(0,1,0).applyQuaternion(base))).toBeLessThan(1e-12);
 }
});
it('switching faces only changes view and clears selection, including repeated selection',()=>{
 useGame.getState().setMode('six');
 for(const face of [0,4,3,1,2,5,5]){
  const before=useGame.getState();
  useGame.getState().setViewFace(face);
  const after=useGame.getState();
  expect(after.viewFace).toBe(face);expect(after.selection).toBeNull();
  expect(after.pieces).toBe(before.pieces);expect(after.history).toBe(before.history);expect(after.playMoves).toBe(before.playMoves);
  expect(after.resetView).toBe(before.resetView+1);
 }
});
