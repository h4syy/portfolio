// Minimal DOM/canvas/observer stubs for headless smoke tests of browser glue.
export function install() {
  const grad = { addColorStop() {} };
  const ctx = new Proxy({}, { get(t, p) {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => grad;
    if (p === 'measureText') return () => ({ width: 10 });
    if (p in t) return t[p];
    return typeof p === 'string' ? () => {} : undefined;
  }, set(t, p, v) { t[p] = v; return true; } });
  const listeners = new Map();
  const makeEl = () => ({
    style: new Proxy({}, { get: (t,p)=> (p==='setProperty'||p==='removeProperty')?()=>{}:t[p], set:(t,p,v)=>(t[p]=v,true) }),
    classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
    addEventListener(type, fn) { (listeners.get(this)||listeners.set(this,{}).get(this))[type] = fn; },
    removeEventListener() {}, appendChild(c){return c;}, removeChild(c){return c;}, remove(){},
    setAttribute(){}, getAttribute(){return '';}, querySelector(){return makeEl();}, querySelectorAll(){return [];},
    getContext(){ return ctx; }, getBoundingClientRect(){ return {left:0,top:0,width:800,height:600}; },
    focus(){}, blur(){}, textContent:'', innerHTML:'', width:800, height:600, offsetWidth:0, children:[],
  });
  const doc = { getElementById: () => makeEl(), createElement: makeEl, querySelector: () => makeEl(), querySelectorAll: () => [], addEventListener(){}, body: makeEl(), hidden:false };
  let raf = null;
  const win = { innerWidth:800, innerHeight:600, devicePixelRatio:1, addEventListener(){}, matchMedia:()=>({matches:false, addEventListener(){}, addListener(){}}), IntersectionObserver: class { constructor(cb){ this.cb=cb; } observe(){ this.cb([{isIntersecting:true}]); } disconnect(){} unobserve(){} } };
  const G = { window: win, document: doc, requestAnimationFrame: cb => { raf = cb; return 1; }, cancelAnimationFrame(){}, IntersectionObserver: win.IntersectionObserver, devicePixelRatio: 1 };
  for (const k in G) Object.defineProperty(globalThis, k, { value: G[k], writable: true, configurable: true });
  return { makeEl, ctx, tick: (t=16) => raf && raf(t) };
}
