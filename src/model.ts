export type Vec = [number, number, number];
export type Axis = 0 | 1 | 2;
export type Basis = [Vec, Vec, Vec];
export type Move = { axis: Axis; layer: number; dir: 1 | -1 };
export type Piece = { id: number; home: Vec; pos: Vec; basis: Basis };
export type Face = { name: string; normal: Vec; up: Vec; color: string };
export const identity = (): Basis => [[1,0,0],[0,1,0],[0,0,1]];
export const faces: Face[] = [
 {name:'咲耶',normal:[0,0,1],up:[0,1,0],color:'#dfa3ad'},
 {name:'シャオラン',normal:[1,0,0],up:[0,1,0],color:'#9fab91'},
 {name:'ネム',normal:[0,1,0],up:[0,0,-1],color:'#e3c17e'},
 {name:'イズナ',normal:[-1,0,0],up:[0,1,0],color:'#94b6c6'},
 {name:'ウカ',normal:[0,0,-1],up:[0,1,0],color:'#b2a5c3'},
 {name:'オト',normal:[0,-1,0],up:[0,0,1],color:'#cf937d'},
];
export const dot=(a:Vec,b:Vec)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross=(a:Vec,b:Vec):Vec=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const eq=(a:Vec,b:Vec)=>a.every((n,i)=>n===b[i]);
export const transform=(b:Basis,v:Vec):Vec=>[0,1,2].map(i=>b[0][i]*v[0]+b[1][i]*v[1]+b[2][i]*v[2]) as Vec;
export function rotate(v:Vec,axis:Axis,dir:1|-1):Vec {
 const [x,y,z]=v;
 return (axis===0?[x,-dir*z,dir*y]:axis===1?[dir*z,y,-dir*x]:[-dir*y,dir*x,z]).map(n=>n===0?0:n) as Vec;
}
export type Size=2|3;
// A 2x2 has no middle layer: its coordinates skip 0, so no piece is ever centred.
export const sizeOf=(pieces:Piece[]):Size=>pieces.length===8?2:3;
export function fresh(size:Size=3):Piece[]{
 const range=size===2?[-1,1]:[-1,0,1];
 const result:Piece[]=[];
 for(const x of range)for(const y of range)for(const z of range){
  if(x===0&&y===0&&z===0)continue;
  const home:Vec=[x,y,z]; result.push({id:result.length,home,pos:[...home],basis:identity()});
 }
 return result;
}
export function turn(pieces:Piece[],move:Move):Piece[]{
 return pieces.map(p=>p.pos[move.axis]!==move.layer?p:{...p,pos:rotate(p.pos,move.axis,move.dir),basis:p.basis.map(v=>rotate(v,move.axis,move.dir)) as Basis});
}
export const inverse=(m:Move):Move=>({...m,dir:m.dir===1?-1:1});
export type Sticker={pieceId:number; face:number; normal:Vec; up:Vec; right:Vec; col:number; row:number};
export function stickersFor(size:Size=3):Sticker[]{
 const step=size===2?2:1; // 2x2 homes are +/-1, so the tile grid steps by 2, not 1
 return faces.flatMap((f,face)=>fresh(size).filter(p=>dot(p.home,f.normal)===1).map(p=>{
  const right=cross(f.up,f.normal);
  return {pieceId:p.id,face,normal:f.normal,up:f.up,right,col:(dot(p.home,right)+1)/step,row:(dot(p.home,f.up)+1)/step};
 }));
}
export const stickers:Sticker[]=stickersFor(3);
const stickerSets:Record<Size,Sticker[]>={2:stickersFor(2),3:stickers};
export const stickersOf=(pieces:Piece[]):Sticker[]=>stickerSets[sizeOf(pieces)];
export function solvedFaces(pieces:Piece[]):number[]{
 // A complete portrait can be rotated as a whole; tile positions AND tile orientations
 // must agree with ONE arbitrary tile of that face. View rotation never enters here.
 // Anchoring to any tile rather than the centre is what lets a 2x2 -- which has no
 // centre piece at all -- use the very same rule as the 3x3.
 const set=stickersOf(pieces),expected=set.length/6;
 return faces.flatMap((worldFace,index)=>{
  const visible=set.filter(s=>eq(transform(pieces[s.pieceId].basis,s.normal),worldFace.normal));
  if(visible.length!==expected)return [];
  const [anchor]=visible;
  const reference=pieces[anchor.pieceId].basis;
  const complete=visible.every(s=>{
   const p=pieces[s.pieceId];
   return s.face===anchor.face && eq(p.pos,transform(reference,p.home)) &&
    eq(transform(p.basis,s.up),transform(reference,s.up)) &&
    eq(transform(p.basis,s.right),transform(reference,s.right));
  });
  return complete?[index]:[];
 });
}
export function scramble(count:number,random= Math.random):Move[]{
 const moves:Move[]=[];let last=-1;
 for(let i=0;i<count;i++){
  const available=([0,1,2] as Axis[]).filter(a=>a!==last);
  const axis=available[Math.floor(random()*available.length)];
  moves.push({axis,layer:random()<.5?-1:1,dir:random()<.5?-1:1});last=axis;
 }
 return moves;
}
