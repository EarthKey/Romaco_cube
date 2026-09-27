export const BGM_LOOP_GAP_MS=3000;

export function scheduleBgmReplay(replay:()=>void,schedule:(callback:()=>void,delay:number)=>number){
 return schedule(replay,BGM_LOOP_GAP_MS);
}
