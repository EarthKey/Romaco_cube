import {useEffect,useRef,useState} from 'react';
import {Scene} from './Scene';
import {clanFaceNames,useGame,difficultyLabel} from './store';
import './entry.css';

export function Entry({onStart}:{onStart:()=>void}){
 const [step,setStep]=useState(0),[count,setCount]=useState(String(useGame.getState().lastMix));
 const heading=useRef<HTMLHeadingElement>(null),game=useGame();
 useEffect(()=>{game.reset();},[]);
 useEffect(()=>{heading.current?.focus();},[step]);
 const valid=Number.isInteger(Number(count))&&Number(count)>=3&&Number(count)<=30;
 return <section className="entry" aria-label="ゲームの準備">
 <nav className="entry-progress" aria-label="開始までの手順">{['難易度','混ぜる回数'].map((label,i)=><span key={label} aria-current={step===i?'step':undefined}>{i+1} / {label}</span>)}</nav>
 {step>0&&<button className="entry-back" onClick={()=>setStep(step-1)}>← 戻る</button>}
 <h2 tabIndex={-1} ref={heading}>{step===0?'どれに挑戦する？':'何手混ぜる？'}</h2>
 {step===0?<div className="romaco-layout"><div><div className="entry-preview" aria-label="ロマ子の6画風キューブ"><Scene preview/></div><p className="entry-caption">一人のロマ子を、6つの画風で。やさしい難易度は採用済みの静止画で遊べます。</p><ol className="style-list">{clanFaceNames['ロマ子'].map(name=><li key={name}>{name}</li>)}</ol></div><div><div className="difficulty-list">{([['易','静止画で揃える','easy'],['中','短いアニメで揃える','medium'],['難','全身アニメで揃える','hard']] as const).map(([label,description,tone])=><button className={tone} key={label} onClick={()=>{game.setDifficulty(tone);setStep(1);}}><b>{label}</b><span>{description}<small>{tone==='easy'?'6枚の静止画で挑戦 →':'アニメ素材は準備中 →'}</small></span></button>)}</div><p className="entry-note">6面ともロマ子。画風を見分けながら揃える、大人向けのパズルです。</p></div></div>:null}
 {step===1?<form className="entry-count" onSubmit={e=>{e.preventDefault();if(!valid)return;game.setSize(3);if(game.start(Number(count)))onStart();}}><p className="entry-caption">ロマ子 / {difficultyLabel[game.difficulty]}</p><div className="count-presets">{[3,6,12,24].map(n=><button type="button" aria-pressed={Number(count)===n} key={n} onClick={()=>setCount(String(n))}>{n}手</button>)}</div><label htmlFor="entry-count">混ぜる回数 <input id="entry-count" type="number" min="3" max="30" required step="1" value={count} onChange={e=>setCount(e.target.value)} aria-describedby="count-note"/> 手</label><p id="count-note" className="entry-note">3〜30手。混ぜる回数です。クリアまでの手数ではありません。</p><fieldset><legend>クリア条件</legend>{(['one','six'] as const).map(mode=><label key={mode}><input type="radio" name="goal" checked={game.mode===mode} onChange={()=>game.setMode(mode)}/>{mode==='one'?'どれか1面':'6面すべて'}</label>)}</fieldset><button className="entry-primary" disabled={!valid}>挑戦する →</button><p className="entry-note">{game.difficulty==='easy'?'6つの画風のロマ子を揃えましょう。':'現在は仮タイルでゲームの仕組みを確認できます。'}</p><p role="status">{game.notice.includes('指定')||game.notice.includes('作れません')?game.notice:''}</p></form>:null}
 </section>;
}
