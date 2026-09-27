import {fresh,turn,scramble,solvedFaces,stickersOf,faces,eq,transform,type Piece,type Move,type Vec} from './model';
export function prepareRound(count:number,random=Math.random,initial:Piece[]=fresh()):Move[]{
 if(!Number.isInteger(count)||count<3||count>30)throw new Error('混ぜる手数は3〜30の整数で指定してください。');
 const valid=(moves:Move[])=>solvedFaces(moves.reduce(turn,initial)).length===0;
 for(let i=0;i<128;i++){const moves=scramble(count,random);if(valid(moves))return moves;}
 // Deterministic bounded fallback also handles a degenerate random source.
 const options:Move[]=[];for(const axis of [0,1,2] as const)for(const layer of [-1,1])for(const dir of [-1,1] as const)options.push({axis,layer,dir});
 let visited=0;
 const search=(path:Move[]):Move[]|null=>{if(visited>10000)return null;if(path.length===count){visited++;return valid(path)?path:null;}
 for(const m of options){if(path.at(-1)?.axis===m.axis)continue;const found=search([...path,m]);if(found)return found;}return null;};
 const result=search([]);if(!result)throw new Error('未完成の開始配置を作れませんでした。もう一度お試しください。');return result;
}
export type Victory={worldFace:number;face:number;normal:Vec;up:Vec;right:Vec;pieceIds:number[]};
export function firstVictory(pieces:Piece[]):Victory|null{
 const worldFace=solvedFaces(pieces)[0];if(worldFace===undefined)return null;
 const normal=faces[worldFace].normal;
 // Anchor to any tile facing that way, not the centre: a 2x2 has no centre piece.
 const set=stickersOf(pieces);
 const anchor=set.find(s=>eq(transform(pieces[s.pieceId].basis,s.normal),normal))!;
 const basis=pieces[anchor.pieceId].basis;
 return {worldFace,face:anchor.face,normal,up:transform(basis,anchor.up),right:transform(basis,anchor.right),pieceIds:set.filter(s=>s.face===anchor.face).map(s=>s.pieceId)};
}
