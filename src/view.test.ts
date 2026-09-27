import {it,expect} from 'vitest';
import {Vector3} from 'three';
import {horizontalView,faceView,wrapYaw,VIEW_TILT,VIEW_ROLL,DEFAULT_YAW} from './view';
it('allows full vertical and horizontal revolutions for every face without drift',()=>{
 for(let face=0;face<6;face++)for(const pitch of [-3,-1,0,1,3]){
  const q=faceView(face,.8,pitch);
  expect(Math.abs(q.dot(faceView(face,.8,pitch+Math.PI*2)))).toBeCloseTo(1,12);
  expect(Math.abs(q.dot(faceView(face,.8+Math.PI*2,pitch)))).toBeCloseTo(1,12);
  expect(q.length()).toBeCloseTo(1,12);
 }
});
it('keeps the cube vertical axis at a constant tilt through full rotations',()=>{
 const up=new Vector3(0,1,0).applyQuaternion(horizontalView(DEFAULT_YAW));
 for(let i=-100;i<=100;i++){
  const actual=new Vector3(0,1,0).applyQuaternion(horizontalView(i*.19));
  expect(actual.distanceTo(up)).toBeLessThan(1e-12);
  expect(actual.y).toBeCloseTo(Math.cos(VIEW_TILT)*Math.cos(VIEW_ROLL),12);
 }
});
it('one complete revolution returns to the same orientation',()=>{
 expect(Math.abs(horizontalView(DEFAULT_YAW).dot(horizontalView(DEFAULT_YAW+Math.PI*2)))).toBeCloseTo(1,12);
 expect(Math.abs(wrapYaw(10000))).toBeLessThanOrEqual(Math.PI);
});
it('clockwise screen roll places the right bottom front corner below the left',()=>{
 const q=horizontalView(DEFAULT_YAW);
 const right=new Vector3(1,-1,1).applyQuaternion(q);
 const left=new Vector3(-1,-1,1).applyQuaternion(q);
 expect(right.y).toBeLessThan(left.y);
});
