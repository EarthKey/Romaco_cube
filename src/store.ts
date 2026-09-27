import {create} from 'zustand';
import {fresh,turn,inverse,solvedFaces,faces,type Move,type Piece,type Sticker,type Size} from './model';
import {prepareRound,firstVictory,type Victory} from './round';
export type Difficulty='easy'|'medium'|'hard';
export const difficultyLabel:Record<Difficulty,string>={easy:'易・静止画',medium:'中・アニメ',hard:'難・全身アニメ'};
export type Clan='ロマ子';
export const clanFaceNames:Record<Clan,string[]>={
 'ロマ子':['アニメスクリーンキャップ','3D','トラディショナル＋ラインアート','1999年スタイル','ピクセルアート','カートゥーン'],
};
export const clanRoman:Record<Clan,string>={ロマ子:'ROMACO'};
export type Active={move:Move;started:number;undo:boolean};
type State={
 start:(n:number)=>boolean;
 // One tap for children: smallest cube, still pictures, three shuffles, finish any single face.
 startForChildren:()=>boolean;
 size:Size;setSize:(size:Size)=>void;
 clan:Clan;setClan:(clan:Clan)=>void;
 difficulty:Difficulty;setDifficulty:(difficulty:Difficulty)=>void;
 viewFace:number;setViewFace:(face:number)=>void;
 mode:'one'|'six';phase:'ready'|'mixing'|'playing'|'won';victory:Victory|null;playMoves:number;lastMix:number;
 displaySize:'small'|'medium'|'large';pieces:Piece[];active:Active|null;pending:Move[];history:Move[];selection:Sticker|null;
 moved:boolean;gap:number;reduced:boolean;resetView:number;preview:string|null;notice:string;
 move:(m:Move)=>void;finish:()=>void;undo:()=>void;reset:()=>void;mix:(n:number)=>void;select:(s:Sticker|null)=>void;setMode:(mode:'one'|'six')=>void;
};
export const useGame=create<State>((set,get)=>({
 start:n=>{try{const size=get().size;const moves=prepareRound(n,Math.random,fresh(size));set(s=>({pieces:moves.reduce(turn,fresh(size)),phase:'playing',victory:null,playMoves:0,lastMix:n,active:null,pending:[],history:[],selection:null,preview:null,moved:true,viewFace:0,resetView:s.resetView+1,notice:s.mode==='one'?'どの面でも、位置と向きを揃えればクリアです。':'6面の位置と向きを揃えましょう。'}));return true;}catch(error){set({notice:(error as Error).message});return false;}},
 startForChildren:()=>{set({clan:'ロマ子',size:2,difficulty:'easy',mode:'one'});return get().start(3);},
 size:3,setSize:size=>{set({size});get().reset();},
 clan:'ロマ子',setClan:clan=>{set({clan});get().reset();},
 difficulty:'easy',setDifficulty:difficulty=>set({difficulty}),
 viewFace:0,setViewFace:face=>{const s=get();if(s.active||s.phase==='won'||!Number.isInteger(face)||face<0||face>5)return;set({viewFace:face,selection:null,preview:null,resetView:s.resetView+1});},
 mode:'one',phase:'ready',victory:null,playMoves:0,lastMix:3,displaySize:'medium',
 pieces:fresh(),active:null,pending:[],history:[],selection:null,moved:false,gap:.12,
 reduced:typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches,
 resetView:0,preview:null,notice:'まず「3手だけ混ぜる」で始めましょう。',
 move:m=>{const s=get();if(s.active||s.pending.length||s.phase==='won'||s.mode==='one'&&s.phase!=='playing')return;set({active:{move:m,started:performance.now(),undo:false},preview:null});},
 finish:()=>{const s=get();if(!s.active)return;
 const pieces=turn(s.pieces,s.active.move),history=s.active.undo?s.history.slice(0,-1):[...s.history,s.active.move];
 const [next,...pending]=s.pending;const mixing=s.phase==='mixing';
 const victory=s.mode==='one'&&!mixing?firstVictory(pieces):null;
 const phase=next?'mixing':mixing?'playing':victory?'won':s.phase;
 set({pieces,history,moved:true,pending,active:next?{move:next,started:performance.now(),undo:false}:null,phase,victory,
 playMoves:mixing?0:s.playMoves+1,selection:victory?null:s.selection,
 notice:next?'キューブを混ぜています…':mixing?'どの面でも、位置と向きを揃えればクリアです。':victory?clanFaceNames[s.clan][victory.face]+'の面が完成しました。':solvedFaces(pieces).length===6?'すべての絵が、ひとつになりました。':'マスを選んで、次の一手。'});
 },
 undo:()=>{const s=get();if(s.active||!s.history.length||s.phase==='won'||s.mode==='one'&&s.phase!=='playing')return;set({active:{move:inverse(s.history.at(-1)!),started:performance.now(),undo:true},preview:null});},
 reset:()=>set(s=>({pieces:fresh(s.size),phase:'ready',victory:null,playMoves:0,active:null,pending:[],history:[],selection:null,moved:false,preview:null,resetView:s.resetView+1,notice:s.mode==='one'?'まず「3手だけ混ぜる」で始めましょう。':'最初の並びに戻しました。'})),
 setMode:mode=>{set({mode});get().reset();},
 mix:n=>{const s=get();if(s.active)return;let moves:Move[];
 try{moves=prepareRound(n,Math.random,s.mode==='one'?fresh(s.size):s.pieces);}catch(error){set({notice:(error as Error).message});return;}
 const [first,...pending]=moves;
 set({...(s.mode==='one'?{pieces:fresh(s.size),history:[],moved:false}:{}),phase:'mixing',victory:null,playMoves:0,lastMix:n,active:{move:first,started:performance.now(),undo:false},pending,selection:null,preview:null,notice:'キューブを混ぜています…'});
 },
 select:selection=>{const s=get();if(s.phase==='won'||s.mode==='one'&&s.phase!=='playing')return;set({selection,preview:null,notice:selection?'選んだマスから、W A S D で回せます。':'背景をドラッグすると全体が回ります。'});},
}));
