function e(e,t){let n=t.replace(`#`,``);return new e.Vector3(parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255)}var t=(e,t,n,r)=>new e.Vector3().copy(t).lerp(n,r);function n(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function r(e){return{uTime:{value:0},uRes:{value:new e.Vector2(1,1)},uDpr:{value:1},uPxK:{value:800},uFocus:{value:20},uAperture:{value:8},uFogNear:{value:30},uFogFar:{value:110},uWarp:{value:0}}}var i=`
uniform float uTime, uDpr, uPxK, uFocus, uAperture, uFogNear, uFogFar, uWarp;
uniform vec2 uRes;
float fogAmt(float z) { float f = smoothstep(uFogNear, uFogFar, z); return f * (2.0 - f); }
// Circle of confusion in device px. Depth of field is this look's main depth cue:
// a sharp band at uFocus, strong blur in front of it and a softer one behind.
float cocPx(float z) {
  float c = abs(z - uFocus) / max(z, 0.05);
  return min(uAperture * uDpr * c * (z < uFocus ? 1.6 : 1.0), 60.0 * uDpr);
}
float nearFade(float z, float a, float b) { return smoothstep(a, b, z); }
`,a=`
vec4 ribbonClip(vec3 p, vec3 dir, float halfPx, float side) {
  vec4 a = modelViewMatrix * vec4(p, 1.0);
  float z = -a.z;
  vec4 ca = projectionMatrix * a;
  if (z < 0.04) return ca;
  float k = 0.02 * z;
  vec4 b = modelViewMatrix * vec4(p + dir * k, 1.0);
  float flip = 1.0;
  if (-b.z < 0.03) { b = modelViewMatrix * vec4(p - dir * k, 1.0); flip = -1.0; }
  vec4 cb = projectionMatrix * b;
  vec2 d = (cb.xy / cb.w - ca.xy / ca.w) * uRes;
  d = length(d) < 1e-6 ? vec2(1.0, 0.0) : normalize(d) * flip;
  ca.xy += vec2(-d.y, d.x) * side * halfPx * 2.0 / uRes * ca.w;
  return ca;
}
`;function o({THREE:n,tokens:r,shared:i}){let a=e(n,r.lineGround),o=e(n,r.lineInkSoft),s=new n.BufferGeometry;s.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let c=new n.ShaderMaterial({depthTest:!1,depthWrite:!1,uniforms:{...i,uGlowCol:{value:e(n,r.lineGlow)},uGlowPos:{value:new n.Vector2},uGlowR:{value:0},uGlowA:{value:0},uGround:{value:a},uShade:{value:t(n,a,o,.18)},uInvProj:{value:new n.Matrix4},uCamRot:{value:new n.Matrix4}},vertexShader:`
      varying vec2 vNdc;
      void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,fragmentShader:`
      uniform vec2 uRes, uGlowPos; uniform vec3 uGround, uShade, uGlowCol; uniform float uGlowR, uGlowA; uniform mat4 uInvProj, uCamRot;
      varying vec2 vNdc;
      float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x) {
        vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      float h2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void main() {
        vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
        vec3 dir = normalize((uCamRot * vec4(normalize(v.xyz / v.w), 0.0)).xyz);
        float m = n3(dir * 2.6);
        vec3 col = mix(uGround, uShade, smoothstep(0.55, 1.0, m) * 0.25);
        col += (h2(floor(gl_FragCoord.xy)) - 0.5) * 0.012;
        vec2 q = vNdc * vec2(uRes.x / uRes.y, 1.0) * 0.6;
        col = mix(col, uShade, smoothstep(0.55, 1.35, length(q)) * 0.55);
        // accent: warm light glowing through the destination chamber, behind every line
        float g = 1.0 - smoothstep(0.0, uGlowR, length(gl_FragCoord.xy - uGlowPos));
        col = mix(col, uGlowCol, g * g * uGlowA);
        gl_FragColor = vec4(col, 1.0);
      }`}),l=new n.Mesh(s,c);return l.frustumCulled=!1,l.renderOrder=-100,{object:l,uniforms:c.uniforms,update(e){c.uniforms.uInvProj.value.copy(e.projectionMatrixInverse),c.uniforms.uCamRot.value.extractRotation(e.matrixWorld)},dispose(){s.dispose(),c.dispose()}}}var s=4;function c(e,t){let r=e.nodes.map(e=>e.pos),i=e.nodes.map(()=>[]);e.edges.forEach(([e,t])=>{i[e].push(t),i[t].push(e)});let a=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],o=e=>Math.hypot(e[0],e[1],e[2]),s=[0,1,2].map(e=>r.reduce((t,n)=>t+n[e],0)/r.length),c=Math.max(...r.map(e=>o(a(e,s)))),l=n(3141),u=[];e.nodes.forEach((e,t)=>{let n=o(a(r[t],s))/c,d=i[t];for(let e=0;e<d.length;e++)for(let i=e+1;i<d.length;i++){let s=a(r[d[e]],r[t]),c=a(r[d[i]],r[t]),f=(s[0]*c[0]+s[1]*c[1]+s[2]*c[2])/(o(s)*o(c));f<.3||f>.97||u.push({i:t,a:d[e],b:d[i],w:n*n*(.6+l())})}}),u.sort((e,t)=>t.w-e.w);let d=u.slice(0,t===`low`?200:420),f=[],p=t===`low`?7:12;for(let e of d){let t=r[e.i],n=a(r[e.a],t),i=a(r[e.b],t),o=.55+l()*.3;for(let e=1;e<p;e++){let r=e/p*o,a=o-r;f.push([[t[0]+n[0]*r,t[1]+n[1]*r,t[2]+n[2]*r],[t[0]+i[0]*a,t[1]+i[1]*a,t[2]+i[2]*a]])}}return f}function l({THREE:t,network:r,tokens:o,shared:l,quality:u}){let d=new t.InstancedBufferGeometry,f=[],p=[];for(let e=0;e<=s;e++)f.push(e/s,-1,e/s,1);for(let e=0;e<s;e++){let t=e*2;p.push(t,t+1,t+2,t+1,t+3,t+2)}d.setAttribute(`position`,new t.BufferAttribute(new Float32Array(30),3)),d.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(f),2)),d.setIndex(p);let m=r.nodes.map(e=>e.pos),h=c(r,u.tier),g=r.edges.length+h.length,_=new Float32Array(g*3),v=new Float32Array(g*3),y=new Float32Array(g*3),b=n(2718);r.edges.forEach(([e,t],n)=>{_.set(m[e],n*3),v.set(m[t],n*3),y.set([b()<.15?1.25:.9,.72+b()*.2,0],n*3)}),h.forEach(([e,t],n)=>{let i=r.edges.length+n;_.set(e,i*3),v.set(t,i*3),y.set([.55,.34+b()*.24,1],i*3)}),d.setAttribute(`aA`,new t.InstancedBufferAttribute(_,3)),d.setAttribute(`aB`,new t.InstancedBufferAttribute(v,3)),d.setAttribute(`aW`,new t.InstancedBufferAttribute(y,3)),d.instanceCount=g;let x=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...l,uInk:{value:e(t,o.lineInk)}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aA, aB, aW;
      varying float vAlpha; varying vec3 vRib;
      void main() {
        vec3 P = mix(aA, aB, seg.x);
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        float nib = uDpr * aW.x * mix(1.5, 0.7, smoothstep(2.0, 45.0, z));
        // Near network edges (about 12 units, not the hatching) get a nib of at least
        // 2.2 px and solid ink, and keep only a little blur, so their rendered pixels
        // reach 3:1 on the paper. The heavy depth blur stays on the lens-close strokes
        // (under 2.5 units), the far field and all the hatching.
        float near = (1.0 - aW.z) * (1.0 - smoothstep(10.0, 16.0, z)) * smoothstep(1.5, 2.5, z);
        nib = max(nib, near * 2.2 * uDpr);
        float coc = cocPx(z) * 0.6 * (1.0 - 0.8 * near);
        float w = nib + coc;
        float halfPx = w * 0.5 + 1.0;
        gl_Position = ribbonClip(P, normalize(aB - aA), halfPx, seg.y);
        // blur spreads the same ink over a wider line, so it pales as it widens
        vAlpha = mix(aW.y, 1.0, near) * pow(nib / w, 1.15) * (1.0 - fogAmt(z) * 0.85) * nearFade(z, 0.3, 1.4);
        vRib = vec3(seg.y * halfPx, halfPx, 1.0) * gl_Position.w;
      }`,fragmentShader:i+`
      uniform vec3 uInk;
      varying float vAlpha; varying vec3 vRib;
      void main() {
        float hw = vRib.y / vRib.z, d = abs(vRib.x / vRib.z);
        float a = clamp(hw - 0.5 - d, 0.0, 1.0) * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),S=new t.Mesh(d,x);return S.frustumCulled=!1,S.renderOrder=1,{object:S,count:g,dispose(){d.dispose(),x.dispose()}}}var u=40;function d({THREE:t,network:r,tokens:a,shared:o,quality:s}){let c=s.tier===`low`,l={core:64,hub:46,leaf:32,soon:18},d=new t.InstancedBufferGeometry,f=[],p=[];for(let e=0;e<=u;e++)f.push(e/u,-1,e/u,1);for(let e=0;e<u;e++){let t=e*2;p.push(t,t+1,t+2,t+1,t+3,t+2)}d.setAttribute(`position`,new t.BufferAttribute(new Float32Array(246),3)),d.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(f),2)),d.setIndex(p);let m=n(1618),h=[],g=[],_=[],v=[];r.nodes.forEach((e,t)=>{if(e.kind===`junction`)return;let n=Math.round((l[e.kind]||30)*(c?.5:1)),r=e.radius*(e.kind===`core`?1.7:2.1);for(let i=0;i<n;i++)h.push(...e.pos,r),g.push(m()*6.2832,2.2+m()*4.1,m()**2.4*.95,m()*6.2832),_.push(.72+m()*.28,m()*3.1416,.6+m()*.8,t),v.push((m()-.5)*.7,(m()-.5)*.24,(m()-.5)*.24,0)}),d.setAttribute(`aC`,new t.InstancedBufferAttribute(new Float32Array(h),4)),d.setAttribute(`aS`,new t.InstancedBufferAttribute(new Float32Array(g),4)),d.setAttribute(`aT`,new t.InstancedBufferAttribute(new Float32Array(_),4)),d.setAttribute(`aU`,new t.InstancedBufferAttribute(new Float32Array(v),4)),d.instanceCount=h.length/4;let y=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...o,uInk:{value:e(t,a.lineInk)},uDest:{value:-1},uDestT:{value:0}},vertexShader:i+`
      uniform float uDest, uDestT;
      attribute vec2 seg; attribute vec4 aC, aS, aT, aU;
      varying float vAlpha, vEnd; varying vec3 vRib;
      vec2 arc(float th, float R, float u) {
        float w = (1.0 + 0.09 * sin(3.0 * th + aS.w) + 0.06 * sin(5.0 * th + 2.0 * aS.w)) * (1.0 + aU.x * (u - 0.5));
        vec2 p = vec2(cos(th), sin(th) * aT.x) * R * w;
        float c = cos(aT.y), s = sin(aT.y);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y) + aU.yz * aC.w;
      }
      void main() {
        vec4 mv = modelViewMatrix * vec4(aC.xyz, 1.0);
        float z = -mv.z;
        float R = aC.w * (1.0 + aS.z);
        float sizePx = aC.w * 2.0 * uPxK / max(z, 0.05);
        // chambers sweeping past the lens thin out and vanish before they fill the view
        float lens = smoothstep(0.3, 0.6, sizePx / min(uRes.x, uRes.y));
        float fade = nearFade(z, aC.w * 1.5, aC.w * 3.5) * (1.0 - lens);
        if (z < 0.1 || fade < 0.003) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float th = aS.x + seg.x * aS.y;
        vec2 p = arc(th, R, seg.x), p2 = arc(th + 0.01, R, seg.x + 0.01 / aS.y);
        vec2 tn = normalize(p2 - p), nrm = vec2(-tn.y, tn.x);
        bool dest = abs(aT.w - uDest) < 0.5;
        float nib = uDpr * (0.5 + 0.35 * aT.z) * (dest ? 1.0 + 0.35 * uDestT : 1.0);
        float coc = cocPx(z) * 0.6;
        float w = nib + coc, halfPx = w * 0.5 + 1.0;
        mv.xy += p + nrm * seg.y * halfPx * z / uPxK;
        gl_Position = projectionMatrix * mv;
        // threads taper in at both ends; outer threads are fainter
        vEnd = pow(sin(3.1416 * seg.x), 0.6);
        float a = (0.34 + 0.2 * aT.z) * (1.0 - aS.z * 0.55) * (dest ? 1.0 + 0.6 * uDestT : 1.0);
        vAlpha = a * pow(nib / w, 1.1) * fade * (1.0 - fogAmt(z) * 0.85);
        vRib = vec3(seg.y * halfPx, halfPx, 1.0) * gl_Position.w;
      }`,fragmentShader:i+`
      uniform vec3 uInk;
      varying float vAlpha, vEnd; varying vec3 vRib;
      void main() {
        float hw = vRib.y / vRib.z, d = abs(vRib.x / vRib.z);
        float a = clamp(hw - 0.5 - d, 0.0, 1.0) * vAlpha * vEnd;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),b=new t.Mesh(d,y);return b.frustumCulled=!1,b.renderOrder=2,{object:b,uniforms:y.uniforms,dispose(){d.dispose(),y.dispose()}}}var f=`
uniform vec2 uPulse;
float pulseAt(float s) {
  float p = 0.0;
  for (int i = 0; i < 2; i++) { float ds = s - uPulse[i]; p = max(p, ds > 0.0 ? exp(-ds * ds * 0.9) : exp(ds * 1.1) * 0.6); }
  return p;
}
`;function p({THREE:n,tokens:r,shared:o,accent:s}){let c=e(n,r.lineInk),l=e(n,r.lineGround),u=s?e(n,r.lineRoute):c,d=new n.ShaderMaterial({transparent:!0,depthWrite:!0,depthTest:!0,premultipliedAlpha:!0,side:n.DoubleSide,uniforms:{...o,uBody:{value:u},uEdge:{value:s?t(n,u,c,.45):c},uGround:{value:l},uHeat:{value:s?e(n,r.lineAccent):l},uHot:{value:s?e(n,r.lineGlow):l},uWarm:{value:e(n,r.lineGlow)},uAccent:{value:+!!s},uReveal:{value:0},uFade:{value:0},uCamS:{value:0},uPulse:{value:new n.Vector2(-99,-99)}},vertexShader:i+a+f+`
      attribute vec3 aTan; attribute float aS, aSide;
      varying float vS, vZ; varying vec4 vLin;
      void main() {
        float z = max(-(modelViewMatrix * vec4(position, 1.0)).z, 0.02);
        float pv = pulseAt(aS) * smoothstep(3.0, 9.0, z);
        float corePx = clamp(0.036 * uPxK / z, 2.6 * uDpr, 0.022 * min(uRes.x, uRes.y)) * (1.0 + 0.5 * pv);
        float haloPx = corePx + min(corePx * 1.4, 9.0 * uDpr) + 10.0 * uDpr;
        float halfPx = haloPx + 1.5;
        gl_Position = ribbonClip(position, aTan, halfPx, aSide);
        vLin = vec4(aSide * halfPx, corePx, haloPx, 1.0) * gl_Position.w;
        vS = aS; vZ = z;
      }`,fragmentShader:i+f+`
      uniform vec3 uBody, uEdge, uGround, uHeat, uHot, uWarm;
      uniform float uAccent, uReveal, uFade, uCamS;
      varying float vS, vZ; varying vec4 vLin;
      vec4 acc = vec4(0.0);
      void over(vec3 c, float a) { a = clamp(a, 0.0, 1.0); acc.rgb = c * a + acc.rgb * (1.0 - a); acc.a = a + acc.a * (1.0 - a); }
      void main() {
        vec3 lin = vLin.xyz / vLin.w;
        float corePx = lin.y, xpx = abs(lin.x), x = xpx / corePx;
        float haloPx = lin.z;
        float p = pulseAt(vS);
        // paper knockout close round the wire, then (accent) a faint warm haze
        float koPx = corePx + min(corePx * 1.4, 9.0 * uDpr);
        float ko = 1.0 - smoothstep(koPx - uDpr, haloPx, xpx);
        if (uAccent > 0.5) over(uWarm, (1.0 - smoothstep(corePx, haloPx, xpx)) * (0.16 + 0.3 * p));
        over(uGround, ko * 0.92);
        float aa = 1.1 / corePx;
        float bodyA = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, x);
        float nz = sqrt(max(1.0 - x * x, 0.0));
        vec3 c = mix(uEdge, uBody, smoothstep(0.0, 0.5, nz));
        // the signal: only the inner part changes, the outer edge stays full strength
        c = mix(c, uHeat, p * smoothstep(0.62, 0.9, nz));
        c = mix(c, uHot, p * p * smoothstep(0.88, 0.99, nz) * (uAccent > 0.5 ? 0.7 : 1.0));
        over(c, bodyA);
        float a = uFade;
        a *= 1.0 - smoothstep(uReveal - 1.5, uReveal, vS);
        // (no dimming of the ridden stretch: the route keeps full contrast everywhere)
        a *= 1.0 - fogAmt(vZ) * 0.35;
        a *= smoothstep(0.08, 0.35, vZ);
        acc *= a;
        if (acc.a < 0.003) discard;
        gl_FragDepth = bodyA > 0.5 && a > 0.3 ? gl_FragCoord.z : 1.0;
        gl_FragColor = acc;
      }`}),p=null,m=null,h=null,g=null,_=0,v=0,y=`off`,b=0,x=0,S=0,C=[-99,-99],w=new n.Group;function T(e){let t=e.length,r=new Float32Array(t*6),i=new Float32Array(t*6),a=new Float32Array(t*2),o=new Float32Array(t*2);g=new Float32Array(t);let s=0;for(let c=0;c<t;c++){c&&(s+=e[c].distanceTo(e[c-1])),g[c]=s;let l=new n.Vector3().subVectors(e[Math.min(c+1,t-1)],e[Math.max(c-1,0)]).normalize();for(let t=0;t<2;t++){let n=c*2+t;r.set([e[c].x,e[c].y,e[c].z],n*3),i.set([l.x,l.y,l.z],n*3),a[n]=s,o[n]=t?1:-1}}let c=[];for(let e=0;e<t-1;e++){let t=e*2;c.push(t,t+1,t+2,t+1,t+3,t+2)}m=new n.BufferGeometry,m.setAttribute(`position`,new n.BufferAttribute(r,3)),m.setAttribute(`aTan`,new n.BufferAttribute(i,3)),m.setAttribute(`aS`,new n.BufferAttribute(a,1)),m.setAttribute(`aSide`,new n.BufferAttribute(o,1)),m.setIndex(c),p=new n.Mesh(m,d),p.frustumCulled=!1,p.renderOrder=3,w.add(p),h=e,_=s,v=0}function E(){p&&(w.remove(p),m.dispose(),p=null,m=null,h=null)}return{object:w,get active(){return y===`on`},reset(){E(),y=`off`},set(e,t){if(!e||e.length<2){p&&(y=`fading`,x=0);return}E(),T(e),y=`on`,b=t,C[0]=C[1]=-99,d.uniforms.uFade.value=1,d.uniforms.uCamS.value=0},update(e,t,n){if(!p)return;let r=d.uniforms;if(y===`fading`&&(x+=t,r.uFade.value=Math.max(0,1-x/.35),x>=.35)){E(),y=`off`;return}if(r.uReveal.value=Math.min(_+2,(e-b)*Math.max(60,_*2.2)),n.travelling){let e=v,t=1/0;for(let r=v;r<Math.min(v+16,h.length);r++){let i=h[r].distanceToSquared(n.position);i<t&&(t=i,e=r)}v=e}let i=g[v];if(r.uCamS.value=i,y===`on`&&n.travelling){S+=(16+n.speed*.4)*t;let e=Math.max(Math.min(_-i-2.5,36),5);for(let t=0;t<2;t++)C[t]=i+2.5+(S+t*e/2)%e}else y!==`on`&&(C[0]=C[1]=-99);r.uPulse.value.set(C[0],C[1])},dispose(){E(),d.dispose()}}}var m={junction:0,leaf:1,hub:2,core:3,soon:4};function h({THREE:t,network:r,tokens:a,shared:o,accent:s}){let c=r.nodes,l=c.length,u=new t.InstancedBufferGeometry,d=new t.PlaneGeometry(2,2);u.index=d.index,u.setAttribute(`position`,d.getAttribute(`position`));let f=new Float32Array(l*3),p=new Float32Array(l*4),h=new Float32Array(l),g=n(90210);c.forEach((e,t)=>{f.set(e.pos,t*3),p.set([e.radius,m[e.kind]??0,g(),t],t*4)}),u.setAttribute(`aPos`,new t.InstancedBufferAttribute(f,3)),u.setAttribute(`aInfo`,new t.InstancedBufferAttribute(p,4));let _=new t.InstancedBufferAttribute(h,1);_.setUsage(t.DynamicDrawUsage),u.setAttribute(`aRoute`,_),u.instanceCount=l;let v=e(t,a.lineInk),y=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!0,premultipliedAlpha:!0,uniforms:{...o,uInk:{value:v},uSoft:{value:e(t,a.lineInkSoft)},uGround:{value:e(t,a.lineGround)},uRouteCol:{value:s?e(t,a.lineRoute):v},uAccentCol:{value:s?e(t,a.lineAccent):v},uGlow:{value:e(t,a.lineGlow)},uAccent:{value:+!!s},uFocusIdx:{value:-1},uFocusT:{value:0},uRouteT:{value:0}},vertexShader:i+`
      attribute vec3 aPos; attribute vec4 aInfo; attribute float aRoute;
      uniform float uFocusIdx, uAccent;
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vRoute, vFocus;
      void main() {
        float kind = aInfo.y;
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
        float z = -mv.z;
        float fade = nearFade(z, 0.6 + aInfo.x * 1.2, 1.6 + aInfo.x * 2.4);
        if (z < 0.05 || fade < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float focus = abs(aInfo.w - uFocusIdx) < 0.5 ? 1.0 : 0.0;
        float rPx = aInfo.x * uPxK / z;
        float sz = rPx / min(uRes.x, uRes.y);
        float lens = kind < 0.5 ? smoothstep(0.03, 0.075, sz) : smoothstep(0.09, 0.17, sz) * (1.0 - focus);
        if (lens > 0.995) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        rPx *= 1.0 - 0.4 * lens;
        // junction dots are drawn a little smaller than their radius: ink points, not beads
        if (kind < 0.5) rPx *= 0.55;
        rPx = max(rPx, (kind < 0.5 ? 1.1 : 2.4) * uDpr);
        float ext = kind < 0.5 ? 1.4 : kind < 2.5 ? 1.6 : kind < 3.5 ? 1.9 : 1.3;
        ext = max(ext, focus * (uAccent > 0.5 ? 2.3 : 1.7));
        float coc = z < uFocus ? min(cocPx(z), 3.0 * uDpr + 0.15 * rPx) : cocPx(z);
        if (focus > 0.5) coc = min(coc, 1.5 * uDpr);
        float quad = min(rPx * ext + coc + 2.0 * uDpr, uRes.y * 0.5);
        vec4 cc = projectionMatrix * mv; vec2 ndc = cc.xy / cc.w;
        vec2 rad = length(ndc) > 1e-3 ? normalize(ndc * vec2(uRes.x / uRes.y, 1.0)) : vec2(0.0, 1.0);
        vec2 off = position.xy * quad;
        float stretch = uWarp * 0.9 * min(length(ndc), 1.3);
        off += rad * dot(position.xy, rad) * quad * stretch;
        mv.xy += off * z / uPxK;
        gl_Position = projectionMatrix * mv;
        vec4 front = projectionMatrix * vec4(mv.xy, min(mv.z + aInfo.x * 1.1, -0.05), 1.0);
        gl_Position.z = clamp(front.z / front.w, -1.0, 1.0) * gl_Position.w;
        vUv = position.xy * quad; vR = rPx; vBlur = coc; vKind = kind; vSeed = aInfo.z; vRoute = aRoute; vFocus = focus;
        vAlpha = fade * (1.0 - lens) * (1.0 - fogAmt(z) * 0.9 * (1.0 - focus)) / (1.0 + stretch * 1.5);
      }`,fragmentShader:i+`
      uniform vec3 uInk, uSoft, uGround, uRouteCol, uAccentCol, uGlow;
      uniform float uAccent, uFocusT, uRouteT;
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vRoute, vFocus;
      vec4 acc = vec4(0.0);
      void over(vec3 c, float a) { a = clamp(a, 0.0, 1.0); acc.rgb = c * a + acc.rgb * (1.0 - a); acc.a = a + acc.a * (1.0 - a); }
      float disc(float d, float R) { float b = vBlur; return (1.0 - smoothstep(R - 0.6 - b * 0.5, R + 0.6 + b * 0.5, d)) * (R * R) / ((R + b * 0.5) * (R + b * 0.5)); }
      float ring(float e, float th) { float b = vBlur, w = th + b; return (th / w) * (1.0 - smoothstep(w * 0.5 - 0.6 - b * 0.35, w * 0.5 + 0.6, e)); }
      float ringAt(float d, float R, float th) { return ring(abs(d - R), th); }
      void main() {
        float d = length(vUv), r = vR, px = uDpr;
        float thin = max(0.8 * px, r * 0.06);
        float st = vRoute > 0.5 ? uRouteT : 0.0;
        float dest = vFocus * uFocusT;
        if (vKind < 0.5) {
          over(mix(uInk, uRouteCol, st), disc(d, r) * 0.95);
        } else if (vKind < 2.5) {
          over(uGround, disc(d, r * 1.02) * mix(0.55, 0.9, st));
          over(mix(uInk, uRouteCol, st * uAccent), disc(d, r * 0.42) * 0.95);
          over(uInk, ringAt(d, r, max(1.0 * px, r * 0.06)) * 0.85);
          if (vKind > 1.5) over(uInk, ringAt(d, r * 1.25, thin * 0.8) * 0.5);
        } else if (vKind < 3.5) {
          // nucleus: fine concentric rings round an ink heart
          over(uGround, disc(d, r) * 0.7);
          for (int k = 0; k < 7; k++) {
            float R = r * (0.38 + float(k) * 0.1);
            over(uInk, ringAt(d, R, max(0.75 * px, r * 0.018)) * (0.35 + 0.08 * float(k)));
          }
          over(uInk, disc(d, r * 0.24) * 0.95);
          over(uInk, ringAt(d, r, max(1.2 * px, r * 0.035)) * 0.9);
        } else {
          float a = atan(vUv.y, vUv.x);
          float dash = step(0.45, fract(a / 6.2831853 * 14.0));
          over(uSoft, ringAt(d, r, max(1.0 * px, r * 0.08)) * mix(1.0, dash, step(3.0 * px, r)));
          over(uSoft, disc(d, r * 0.24) * 0.9);
        }
        if (vFocus > 0.5) {
          // the destination: a heavier ring, amber with the accent on
          float Rr = r * (vKind > 2.5 && vKind < 3.5 ? 1.18 : 1.45);
          over(uAccentCol, ringAt(d, Rr, max(2.2 * px, r * 0.12)) * dest);
          if (uAccent > 0.5) over(uAccentCol, disc(d, r * 0.42) * dest * 0.9);
        }
        acc *= vAlpha;
        if (acc.a < 0.003) discard;
        // a thought the route threads through sits over the wire, so the wire tucks under its rim
        gl_FragDepth = vKind > 0.5 && vRoute > 0.5 && uRouteT > 0.01 ? 0.0 : gl_FragCoord.z;
        gl_FragColor = acc;
      }`}),b=new t.Mesh(u,y);return b.frustumCulled=!1,b.renderOrder=4,{object:b,uniforms:y.uniforms,setRouteNodes(e){if(h.fill(0),e)for(let t of e)h[t]=1;_.needsUpdate=!0},dispose(){u.dispose(),d.dispose(),y.dispose()}}}function g({THREE:t,network:r,tokens:a,shared:o,quality:s,accent:c}){let l=s.tier===`low`,u=l?1100:2200,d=l?110:220,f=c?l?8:16:0,p=u+d+f,m=new Float32Array(p*3),h=new Float32Array(p*3),g=n(4711),_=r.nodes,v=r.edges,y=0;for(let e=0;e<u;e++,y++){let[e,t]=v[Math.floor(g()*v.length)],n=g(),r=_[e].pos,i=_[t].pos,a=.4+g()*2.2;m.set([r[0]+(i[0]-r[0])*n+(g()-.5)*2*a,r[1]+(i[1]-r[1])*n+(g()-.5)*2*a,r[2]+(i[2]-r[2])*n+(g()-.5)*2*a],y*3),h.set([0,g(),g()],y*3)}for(let e=0;e<d;e++,y++)m.set([g()*26,g()*26,g()*26],y*3),h.set([1,g(),g()],y*3);let b=_.filter(e=>e.kind!==`junction`);for(let e=0;e<f;e++,y++){let e=b[Math.floor(g()*b.length)],t=3+g()*6,n=g()*6.2832,r=(g()-.5)*2.4;m.set([e.pos[0]+Math.cos(n)*t,e.pos[1]+r*2,e.pos[2]+Math.sin(n)*t],y*3),h.set([2,g(),g()],y*3)}let x=new t.BufferGeometry;x.setAttribute(`position`,new t.BufferAttribute(m,3)),x.setAttribute(`aK`,new t.BufferAttribute(h,3));let S=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,uniforms:{...o,uCam:{value:new t.Vector3},uBox:{value:26},uInk:{value:e(t,a.lineInk)},uGold:{value:e(t,a.lineGlow)}},vertexShader:i+`
      uniform vec3 uCam; uniform float uBox;
      attribute vec3 aK;
      varying float vA, vCore, vSize, vKind;
      void main() {
        vec3 p = position;
        float edge = 1.0;
        if (aK.x > 0.5 && aK.x < 1.5) {
          vec3 rel = mod(position - uCam + uBox * 0.5, uBox) - uBox * 0.5;
          p = uCam + rel;
          edge = 1.0 - smoothstep(uBox * 0.3, uBox * 0.5, length(rel));
        }
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float z = -mv.z;
        if (z < 0.12) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float core;
        if (aK.x < 0.5) core = uDpr * (aK.y > 0.93 ? 5.5 : aK.y > 0.75 ? 3.6 : aK.y > 0.4 ? 2.4 : 1.6) * mix(1.4, 0.8, smoothstep(3.0, 40.0, z));
        else if (aK.x < 1.5) core = uDpr * (1.6 + aK.y * 1.6);
        else core = uDpr * (5.0 + aK.y * 5.0);
        float coc = cocPx(z) * (aK.x > 1.5 ? 1.6 : 1.2);
        float size = min(core + coc + 1.5 * uDpr, 90.0 * uDpr);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size;
        float ink = (core * core) / ((core + coc) * (core + coc));
        if (aK.x < 1.5) vA = max(ink, 0.06 * step(4.0 * uDpr, coc)) * (aK.x < 0.5 ? 0.9 : 0.75);
        else vA = 0.42 + 0.3 * aK.z;
        vA *= edge * nearFade(z, 0.35, 1.2) * (1.0 - fogAmt(z) * 0.8);
        vCore = core; vSize = size; vKind = aK.x;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uGold;
      varying float vA, vCore, vSize, vKind;
      void main() {
        float d = length(gl_PointCoord - 0.5) * vSize;
        float R = vSize * 0.5 - 0.75 * uDpr;
        float soft = max(1.0, (vSize - vCore) * 0.45);
        float a = (1.0 - smoothstep(R - soft, R, d)) * vA;
        if (vKind > 1.5) a *= 0.75 + 0.25 * smoothstep(R * 0.4, R, d); // a slightly brighter rim, like lens bokeh
        if (a < 0.003) discard;
        vec3 c = vKind > 1.5 ? uGold : uInk;
        gl_FragColor = vec4(c * a, a);
      }`}),C=new t.Points(x,S);return C.frustumCulled=!1,C.renderOrder=6,{object:C,update(e){S.uniforms.uCam.value.copy(e.position)},dispose(){x.dispose(),S.dispose()}}}function _({THREE:t,tokens:r,shared:a,quality:o}){let s=o.tier===`low`?24:48,c=new t.InstancedBufferGeometry;c.setAttribute(`position`,new t.BufferAttribute(new Float32Array(12),3)),c.setAttribute(`seg`,new t.BufferAttribute(new Float32Array([0,-1,0,1,1,-1,1,1]),2)),c.setIndex([0,1,2,1,3,2]);let l=n(5150),u=new Float32Array(s*4);for(let e=0;e<s;e++)u.set([l()*Math.PI*2,1.8+l()**.8*8.5,l()*70,l()],e*4);c.setAttribute(`aD`,new t.InstancedBufferAttribute(u,4)),c.instanceCount=s;let d=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...a,uFlow:{value:0},uInk:{value:e(t,r.lineInk)}},vertexShader:i+`
      uniform float uFlow;
      attribute vec2 seg; attribute vec4 aD;
      varying float vA, vHalf, vSide, vT;
      void main() {
        float zh = mod(aD.z - uFlow, 70.0) + 0.6;
        float len = 1.0 + 14.0 * uWarp * (0.6 + aD.w * 0.8);
        float z = zh + seg.x * len;
        vec3 v = vec3(cos(aD.x) * aD.y, sin(aD.x) * aD.y * 0.8, -z);
        vec3 side = normalize(cross(vec3(0.0, 0.0, -1.0), normalize(v)));
        vHalf = uDpr * 0.6 * mix(1.5, 0.7, seg.x) + 1.0;
        v += side * seg.y * vHalf * z / uPxK;
        gl_Position = projectionMatrix * vec4(v, 1.0);
        vA = uWarp * smoothstep(0.6, 3.0, zh) * (1.0 - smoothstep(30.0, 70.0, z)) * 0.55;
        vSide = seg.y; vT = seg.x;
      }`,fragmentShader:i+`
      uniform vec3 uInk;
      varying float vA, vHalf, vSide, vT;
      void main() {
        float a = clamp(vHalf - 0.5 - abs(vSide) * vHalf, 0.0, 1.0) * vA * (1.0 - vT);
        if (a < 0.003) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),f=new t.Mesh(c,d);return f.frustumCulled=!1,f.renderOrder=7,f.visible=!1,{object:f,update(e,t,n){f.visible=(n.warp||0)>.01,d.uniforms.uFlow.value+=t*(n.speed||0)*1.6},dispose(){c.dispose(),d.dispose()}}}function v({THREE:e,scene:t,camera:n,renderer:i,network:a,tokens:s,quality:c,accent:u=1}){u=+!!u,t.background=new e.Color(s.lineGround),t.fog=null;let f=r(e),m={THREE:e,network:a,tokens:s,quality:c,shared:f,accent:u},v=new e.Group;v.name=`line-skin`;let y=o(m),b=l(m),x=d(m),S=p(m),C=h(m),w=g(m),T=_(m),E=[y,b,x,S,C,w,T];for(let e of E)v.add(e.object);t.add(v),S.set([new e.Vector3(0,0,-900),new e.Vector3(0,.1,-900)],0),T.object.visible=!0,i.compile(t,n),S.reset(),T.object.visible=!1;let D=new Map(a.nodes.map((e,t)=>[e.id,t])),O=new e.Vector2,k=new e.Vector3,A=-1,j=0;function M(e){let t=new Set;a.nodes.forEach((n,r)=>{k.fromArray(n.pos);for(let n=0;n<e.length;n+=2)if(e[n].distanceToSquared(k)<1.44){t.add(r);break}}),C.setRouteNodes(t)}return{setRoute(e){S.set(e,j),e&&e.length>1&&M(e)},setFocus(e){A=e!=null&&D.has(e)?D.get(e):-1,C.uniforms.uFocusIdx.value=A,C.uniforms.uFocusT.value=0,x.uniforms.uDest.value=A,x.uniforms.uDestT.value=0},update(e,t,r){j=e,n.updateMatrixWorld(),i.getDrawingBufferSize(O);let o=f;o.uTime.value=e,o.uRes.value.copy(O),o.uDpr.value=i.getPixelRatio(),o.uPxK.value=O.y/2/Math.tan(n.fov*Math.PI/360),o.uWarp.value=r.warp||0;let s=r.focus;if(s>0||(s=A>=0?k.fromArray(a.nodes[A].pos).distanceTo(n.position):20),o.uFocus.value=s,s<=35)o.uFogNear.value=Math.max(s*1.2,24),o.uFogFar.value=o.uFogNear.value+90;else{let e=s-35;o.uFogNear.value=42+e*.67,o.uFogFar.value=132+e*.95}let c=s>35?Math.max(35/s,.35):1;o.uAperture.value+=((r.travelling?11:9)*c-o.uAperture.value)*(1-Math.exp(-t*3));let l=C.uniforms;l.uFocusT.value=Math.min(1,l.uFocusT.value+t*(r.travelling?.5:1.6)),l.uRouteT.value=S.active?Math.min(1,l.uRouteT.value+t*3):Math.max(0,l.uRouteT.value-t*1.5),x.uniforms.uDestT.value=l.uFocusT.value;let d=y.uniforms;if(d.uGlowA.value=0,u&&A>=0){let e=a.nodes[A];k.fromArray(e.pos).applyMatrix4(n.matrixWorldInverse);let t=-k.z;t>.5&&(k.fromArray(e.pos).project(n),d.uGlowPos.value.set((k.x+1)/2*O.x,(k.y+1)/2*O.y),d.uGlowR.value=e.radius*5.2*o.uPxK.value/t,d.uGlowA.value=.75*l.uFocusT.value)}y.update(n),S.update(e,t,r),w.update(n),T.update(e,t,r)},dispose(){t.remove(v);for(let e of E)e.dispose();t.background=null}}}export{v as createSkin};