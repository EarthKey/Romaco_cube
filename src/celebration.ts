const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
// Seconds: face forward, two revolutions, open, snap, then a single fading sparkle burst.
export function celebrationAt(seconds:number,reduced=false){
 const t=Math.max(0,seconds);
 if(reduced)return {phase:t<.25?'snap':t<.9?'sparkle':'complete',align:smooth(t/.25),angle:0,spread:0,join:smooth(t/.25),sparkle:t<.25?0:Math.max(0,1-(t-.25)/.65)};
 const phase=t<.18?'align':t<1.18?'spin':t<1.36?'open':t<1.5?'snap':t<2.4?'sparkle':'complete';
 return {phase,align:smooth(t/.18),angle:Math.PI*4*smooth((t-.18)/1),
  spread:t<1.36?.38*smooth((t-1.18)/.18):.38*(1-smooth((t-1.36)/.14)),
  join:smooth((t-1.36)/.14),sparkle:t<1.5?0:Math.max(0,1-(t-1.5)/.9)};
}
