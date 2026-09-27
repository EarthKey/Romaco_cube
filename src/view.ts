import {Euler,Quaternion,Vector3,Matrix4} from 'three';
import {faces,cross} from './model';
// Tilt the top toward the viewer by another 10 degrees from the previous -0.30 rad.
export const VIEW_TILT=-.30+Math.PI/18;
export const VIEW_ROLL=-Math.PI/12;
export const DEFAULT_YAW=.48;
export const wrapYaw=(yaw:number)=>Math.atan2(Math.sin(yaw),Math.cos(yaw));
// Rebuild from fixed pitch and yaw, never accumulate arbitrary-axis rotations.
export const horizontalView=(yaw:number,pitch=VIEW_TILT)=>new Quaternion().setFromAxisAngle(new Vector3(0,0,1),VIEW_ROLL).multiply(new Quaternion().setFromEuler(new Euler(wrapYaw(pitch),wrapYaw(yaw),0,'XYZ')));
// Bring the chosen world face forward, keeping its up direction and the fixed display tilt.
export function faceView(face:number,yaw:number,pitch=VIEW_TILT){
 const f=faces[face];
 const basis=new Matrix4().makeBasis(new Vector3(...cross(f.up,f.normal)),new Vector3(...f.up),new Vector3(...f.normal));
 return horizontalView(yaw,pitch).multiply(new Quaternion().setFromRotationMatrix(basis).invert());
}
