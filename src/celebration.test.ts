import {it,expect} from 'vitest';
import {celebrationAt as at} from './celebration';
it('performs exactly two revolutions before opening and snapping',()=>{
 expect(at(0).phase).toBe('align');expect(at(.5).phase).toBe('spin');
 expect(at(1.18).angle).toBe(Math.PI*4);expect(at(1.18).join).toBe(0);
 expect(at(1.36).spread).toBeCloseTo(.38);expect(at(1.36).join).toBe(0);
 expect(at(1.5).spread).toBe(0);expect(at(1.5).join).toBe(1);expect(at(1.5).sparkle).toBe(1);
 expect(at(2.4).phase).toBe('complete');expect(at(20).sparkle).toBe(0);
});
it('reduced motion skips spin and separation and still joins',()=>{
 for(let t=0;t<3;t+=.01){expect(at(t,true).angle).toBe(0);expect(at(t,true).spread).toBe(0);}
 expect(at(1,true).join).toBe(1);expect(at(1,true).phase).toBe('complete');
});
