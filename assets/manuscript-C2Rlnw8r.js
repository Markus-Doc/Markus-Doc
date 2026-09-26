function e(e,t){let n=t.replace(`#`,``);return new e.Vector3(parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255)}var t=(e,t,n,r)=>new e.Vector3().copy(t).lerp(n,r);function n(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function r(e){return{uTime:{value:0},uRes:{value:new e.Vector2(1,1)},uDpr:{value:1},uPxK:{value:800},uFocus:{value:12},uAperture:{value:5},uFogNear:{value:16},uFogFar:{value:80},uWarp:{value:0},uSpeed:{value:0},uAttnPos:{value:new e.Vector3},uAttnR:{value:new e.Vector2(8,30)},uAttnOn:{value:0},uLand:{value:0},uCamR:{value:100},uVolOn:{value:1},uVolGlow:{value:1},uVolHaze:{value:1},uVolRays:{value:1},uVolDark:{value:1},uVolEdge:{value:1},uVolDepth:{value:1},uVolIn:{value:1},uVolLand:{value:0},uMajors:{value:Array.from({length:8},()=>new e.Vector4(0,0,0,0))},uDriftAmp:{value:.3},uDrift:{value:0},uAnchors:{value:Array.from({length:32},()=>new e.Vector4(1e4,1e4,1e4,0))}}}var i=`
uniform float uTime, uDpr, uPxK, uFocus, uAperture, uFogNear, uFogFar, uWarp, uSpeed, uAttnOn, uLand, uCamR;
uniform float uVolOn, uVolGlow, uVolHaze, uVolRays, uVolDark, uVolEdge, uVolDepth, uVolLand;
uniform vec4 uMajors[8];
uniform float uDrift;
uniform vec4 uAnchors[32];
// The living mesh: a point's sway is a function of its resting position and the life clock, so
// every layer that draws the same point moves it the same way and strokes stay joined. Layered:
// a slow tide per region, a wave rolling through the mesh, a quicker small sway, and the whole
// network slowly swelling and settling. Zero at the named places, growing over about 7 units.
vec3 drift(vec3 p) {
  if (uDrift < 0.001) return p;
  float pin = 1e4;
  for (int i = 0; i < 32; i++) pin = min(pin, distance(p, uAnchors[i].xyz));
  float w = smoothstep(0.8, 7.5, pin);
  float t = uTime;
  vec3 o = vec3(
    sin(t * 0.23 + p.y * 0.045 + p.z * 0.03) * 1.7 + sin(t * 0.61 + p.x * 0.21 + p.z * 0.13) * 0.75,
    sin(t * 0.19 + p.z * 0.05 + p.x * 0.025 + 1.7) * 1.4 + sin(t * 0.53 + p.y * 0.19 + p.x * 0.17 + 2.1) * 0.65,
    sin(t * 0.21 + p.x * 0.04 + p.y * 0.035 + 3.1) * 1.7 + sin(t * 0.67 + p.z * 0.23 + p.y * 0.11 + 4.2) * 0.75);
  o += p * 0.028 * sin(t * 0.17);
  return p + o * w * uDrift;
}
uniform vec2 uRes, uAttnR;
uniform vec3 uAttnPos;
float fogAmt(float z) { float f = smoothstep(uFogNear, uFogFar, z); return f * (2.0 - f); }
// 1 near the resting node, falling to 0 in the far field; 1 everywhere while riding
float attnAt(vec3 p) { return mix(1.0, 1.0 - smoothstep(uAttnR.x, uAttnR.y, distance(p, uAttnPos)), uAttnOn); }
// Circle of confusion in device px: sharp at uFocus, growing fast toward the lens.
float cocPx(float z) { return min(uAperture * uDpr * abs(z - uFocus) / max(z, 0.05), 46.0 * uDpr); }
float nearFade(float z, float a, float b) { return smoothstep(a, b, z); }
// 0 on the near face of the network, 1 on its far face (seen from outside it)
float depthK(float z) { return clamp((z - uCamR + 46.0) / 92.0, 0.0, 1.0); }
// how strongly the light of the core and the hubs falls on a point (0 to 1)
float majorLight(vec3 p) {
  float l = 0.0;
  for (int i = 0; i < 8; i++) { vec4 m = uMajors[i]; if (m.w > 0.0) l = max(l, 1.0 - smoothstep(m.w * 0.15, m.w, distance(p, m.xyz))); }
  return l;
}
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
`,a=`
vec4 ribbonClip(vec3 p, vec3 dir, float halfPx, float side, out float z) {
  vec4 a = modelViewMatrix * vec4(p, 1.0);
  z = -a.z;
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
`,o=`
#define ROUND_R 45.0
`;function s({THREE:n,tokens:r,shared:i,quality:a}){let o=e(n,r.sceneBg),s=e(n,r.fog),c=e(n,r.nodeRing),l=e(n,r.edge),u=new n.BufferGeometry;u.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let d=new n.ShaderMaterial({depthTest:!1,depthWrite:!1,uniforms:{...i,uBg:{value:o},uFog:{value:s},uEdgeTone:{value:t(n,o,c,.22)},uFoxing:{value:t(n,o,c,.1)},uInk:{value:l},uInvProj:{value:new n.Matrix4},uCamRot:{value:new n.Matrix4},uHigh:{value:a.tier===`low`?0:1}},vertexShader:`
      varying vec2 vNdc;
      void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,fragmentShader:`
      uniform vec2 uRes; uniform float uTime, uHigh, uWarp;
      uniform vec3 uBg, uFog, uEdgeTone, uFoxing, uInk;
      uniform mat4 uInvProj, uCamRot;
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
        // soft cloudy mottling of old paper, world fixed
        float m = n3(dir * 2.2) * 0.62 + n3(dir * 6.1 + 7.1) * 0.45 * uHigh;
        vec3 col = mix(uBg, uFog, smoothstep(0.35, 0.8, m));
        col = mix(col, uFoxing, smoothstep(0.62, 0.95, m) * 0.55);
        // screen space tooth: very faint grain and horizontal laid lines
        vec2 px = gl_FragCoord.xy;
        float g = h2(floor(px)) - 0.5;
        float laid = sin(px.y * 0.9 + sin(px.x * 0.011 + px.y * 0.004) * 3.0) * 0.5 + 0.5;
        col += (g * 0.018 - laid * 0.006 * uHigh);
        // vignette: warm umber toward the corners, leaving the centre clean
        vec2 q = vNdc * vec2(uRes.x / uRes.y, 1.0) * 0.62;
        float vig = smoothstep(0.45, 1.25, length(q));
        col = mix(col, uEdgeTone, vig * 0.85);
        gl_FragColor = vec4(col, 1.0);
      }`}),f=new n.Mesh(u,d);return f.frustumCulled=!1,f.renderOrder=-100,{object:f,update(e){d.uniforms.uInvProj.value.copy(e.projectionMatrixInverse),d.uniforms.uCamRot.value.extractRotation(e.matrixWorld)},dispose(){u.dispose(),d.dispose()}}}function c({THREE:r,network:s,tokens:c,shared:l,quality:u}){let d=u.tier===`low`?3:6,f=new r.InstancedBufferGeometry,p=[],m=[];for(let e=0;e<=d;e++)p.push(e/d,-1,e/d,1);for(let e=0;e<d;e++){let t=e*2;m.push(t,t+1,t+2,t+1,t+3,t+2)}f.setAttribute(`position`,new r.BufferAttribute(new Float32Array((d+1)*2*3),3)),f.setAttribute(`seg`,new r.BufferAttribute(new Float32Array(p),2)),f.setIndex(m);let h=s.edges,g=s.nodes.map(e=>e.pos),_=[],v=new Set(h.map(([e,t])=>e<t?e*4096+t:t*4096+e));s.nodes.forEach((e,t)=>{if(e.kind!==`junction`)return;let n=[];s.nodes.forEach((r,i)=>{if(i===t)return;let a=Math.hypot(r.pos[0]-e.pos[0],r.pos[1]-e.pos[1],r.pos[2]-e.pos[2]);a<10&&n.push([a,i])}),n.sort((e,t)=>e[0]-t[0]);let r=0;for(let[,e]of n){let n=t<e?t*4096+e:e*4096+t;if(!v.has(n)&&(v.add(n),_.push([t,e]),++r>=1))break}});let y=h.concat(_),b=y.length,x=h.map(([e,t])=>Math.hypot(g[e][0]-g[t][0],g[e][1]-g[t][1],g[e][2]-g[t][2])).sort((e,t)=>e-t),S=x[x.length>>1]||8,C=new Float32Array(b*3),w=new Float32Array(b*3),T=new Float32Array(b*2),E=new Float32Array(b*2),D=new Float32Array(b).fill(2),O=n(7331),k=n(2718),A=s.nodes.map(e=>e.kind!==`junction`);y.forEach(([e,t],n)=>{C.set(g[e],n*3),w.set(g[t],n*3);let r=O();T[n*2]=r<.12?1.55:r<.5?1.1:.85,T[n*2+1]=O()*100,E[n*2]=n>=h.length?2:A[e]||A[t]?1:0,E[n*2+1]=k()}),f.setAttribute(`aA`,new r.InstancedBufferAttribute(C,3)),f.setAttribute(`aB`,new r.InstancedBufferAttribute(w,3)),f.setAttribute(`aW`,new r.InstancedBufferAttribute(T,2)),f.setAttribute(`aK`,new r.InstancedBufferAttribute(E,2));let j=new r.InstancedBufferAttribute(D,1);j.setUsage(r.DynamicDrawUsage),f.setAttribute(`aHop`,j),f.instanceCount=b;let M=s.nodes.map(()=>[]);h.forEach(([e,t])=>{M[e].push(t),M[t].push(e)});let N=new r.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:r.DoubleSide,uniforms:{...l,uInk:{value:e(r,c.edge)},uAlpha:{value:c.edgeAlpha},uMed:{value:S},uInkLit:{value:t(r,e(r,c.edge),e(r,c.nodeRing),.7)},uSheath:{value:new r.Vector3(1,.965,.88)},uThread:{value:new r.Vector3(1,.97,.9)}},vertexShader:i+a+o+`
      attribute vec2 seg; attribute vec3 aA, aB; attribute vec2 aW, aK; attribute float aHop;
      uniform float uMed;
      varying float vAlpha, vAmp, vLit, vLum; varying vec3 vRib, vP;
      void main() {
        vec3 P = drift(mix(aA, aB, seg.x));
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        // Drawn hierarchy (at rest): the strokes of the resting thought are the boldest,
        // its neighbours' strokes next, and the field falls away with distance from it,
        // thinning to fine hairlines and dropping about four in ten of the far strokes.
        // Spokes of any thought keep some weight, so clusters still read far off.
        float hb = (aHop < 0.5 ? 1.0 : aHop < 1.5 ? 0.8 : 0.0) * uAttnOn;
        float lvl = max(max(attnAt(P), hb), aK.x * 0.6);
        float aMul = mix(0.26, 1.0, lvl) * (aK.y < 0.42 ? smoothstep(0.12, 0.55, lvl) : 1.0);
        // at rest the nib is set by rank, not depth: the thought's own strokes a bold
        // 2.7 px, its neighbours' 1.7 px, the attended field about 1 px, the far field hairline
        // (the thought's strokes thin as they run away from it, like a pen losing ink)
        float away = smoothstep(uAttnR.x * 0.5, uAttnR.y, distance(P, uAttnPos));
        float rankNib = aHop < 0.5 ? mix(2.8, 1.5, away) : aHop < 1.5 ? mix(1.7, 1.05, away) : mix(0.5, 1.05, max(attnAt(P), aK.x * 0.6)) * mix(1.0, aW.x, 0.5);
        // pressure: slow wobble along the stroke, never below 0.55
        float pr = 0.78 + 0.22 * sin(aW.y + seg.x * (2.0 + mod(aW.y, 3.0)));
        // Near wires (within about 12 units) are drawn with a nib of at least 2.4 px and
        // a solid core, so their rendered pixels reach 3:1 on the parchment (a thinner
        // antialiased stroke never reaches its token contrast at any pixel). Pressure
        // then varies their width, not their ink, and near blur is held back. Further
        // out the strokes thin and fade as before, as the depth cue.
        float near = 1.0 - smoothstep(10.0, 16.0, z);
        // the hierarchy never thins or fades a near wire: they keep 3:1
        aMul = mix(aMul, 1.0, near);
        float rideNib = aW.x * mix(1.7, 0.75, smoothstep(1.5, 34.0, z));
        float nib = uDpr * mix(rideNib, max(rankNib, rideNib * 0.6), uAttnOn) * mix(0.8, 1.1, pr);
        // idle life: slow swells of ink run outward along the thought's own strokes
        // (and faintly its neighbours'), as if the drawing were still being inked.
        // The swell is drawn per pixel in the fragment shader; here the ribbon makes room.
        float amp = (aHop < 0.5 ? 0.6 : aHop < 1.5 ? 0.3 : 0.0) * uAttnOn * (1.0 - near);
        // strokes of the far field lift off toward their ends, like a pen
        nib *= mix(0.55, 1.0, max(lvl, smoothstep(0.0, 0.2, seg.x) * smoothstep(1.0, 0.8, seg.x)));
        nib = max(nib, near * uDpr * mix(2.4, 3.0, pr - 0.56));
        // seen from outside the whole network (the landing): a pen drawing by depth. The near
        // face is drawn with a firm nib, the far face in hairline, every stroke sharp (no blur)
        // Toward the rim of the sphere the drawing lightens, so the middle holds the weight
        // and the silhouette never reads as a hard wire cage; a share of the rim strokes drop.
        // The view from outside is held inside one round boundary: strokes past it fade out,
        // so the silhouette reads as a sphere rather than the brain's two lobes. The shell is
        // measured on screen, where the rim's tangent strokes pile up into a dark band.
        vec4 c0 = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0), cp = projectionMatrix * modelViewMatrix * vec4(P, 1.0);
        float Rc = ROUND_R * uPxK / max(c0.w, 1.0), rPx0 = length((cp.xy / cp.w - c0.xy / c0.w) * uRes * 0.5);
        float rnd = 1.0 - smoothstep(0.8 * Rc, Rc, rPx0);
        float dk = depthK(z), shell = smoothstep(0.5, 0.92, rPx0 / Rc);
        float keep = aK.x > 0.5 ? 1.0 : step(mix(0.08, 0.45, shell) + 0.1 * dk, hash11(aW.y * 7.13 + 3.1));
        float landNib = uDpr * mix(1.4, 0.65, dk) * mix(1.0, 0.8, shell) * mix(1.0, aW.x, 0.4) * mix(0.9, 1.05, pr) * (aK.x > 0.5 && aK.x < 1.5 ? 1.12 : 1.0);
        nib = mix(nib, landNib, uLand);
        amp *= 1.0 - uLand;
        float coc = cocPx(z) * 0.55 * (1.0 - 0.8 * near) * (1.0 - uLand);
        float w = nib + coc;
        float lit = min(majorLight(P) * uVolLand * uVolOn * uVolEdge, 1.0);
        // a thread of light: most strokes, strongest in the middle of the sphere
        float mid = 1.0 - smoothstep(22.0, 50.0, length(P));
        float lumK = uVolLand * uVolOn * min(uVolEdge, 1.5) * (hash11(aW.y * 3.7 + 1.9) < 0.85 ? 1.0 : 0.25) * max(mid, lit * 0.8);
        float halfPx = w * 0.5 + 1.0, halfW = halfPx + nib * 0.5 * amp + 3.0 * uDpr * max(lit, min(lumK, 1.0));
        float zz;
        gl_Position = ribbonClip(P, normalize(drift(aB) - drift(aA)), halfW, seg.y, zz);
        float fog = fogAmt(z);
        vAlpha = mix(mix(pr, 1.0, near), 1.0, hb) * pow(nib / w, 1.3) * (1.0 - fog * 0.94 * (1.0 - 0.7 * hb)) * nearFade(z, 0.25, 1.1) * aMul;
        // volume pass: the near face a little stronger, the far face fainter
        float vd = uVolDepth * uVolOn;
        vAlpha = mix(vAlpha, mix(0.84, 0.38, dk) * mix(1.0 + 0.15 * vd, 1.0 - 0.2 * vd, dk) * mix(1.0, 0.42, shell) * mix(0.9, 1.0, pr) * keep * rnd * mix(1.0, 0.3, smoothstep(1.35 * uMed, 1.6 * uMed, length(aB - aA))), uLand);
        // the landing mesh fades out with the landing
        if (aK.x > 1.5) { vAlpha *= uLand * 0.85; }
        vRib = vec3(seg.y * halfW, halfPx, 1.0) * gl_Position.w;
        vP = P; vAmp = amp * nib * 0.5 * gl_Position.w;
        // lit by the core and the hubs, seen from outside only (inside, the near wires keep 3:1 ink)
        vLit = lit; vLum = lumK;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uInkLit, uSheath, uThread; uniform float uAlpha;
      varying float vAlpha, vAmp, vLit, vLum; varying vec3 vRib, vP;
      void main() {
        float vHalf = vRib.y / vRib.z, d = abs(vRib.x / vRib.z);   // px from the stroke centre
        if (vAmp > 0.0) vHalf += vAmp / vRib.z * pow(0.5 + 0.5 * sin(distance(vP, uAttnPos) * 0.8 - uTime * 1.5), 4.0);
        float cov = clamp(vHalf - 0.5 - d, 0.0, 1.0);
        float lum = min(vLum, 1.0);
        float a = min(cov * vAlpha * uAlpha * 1.35 * (1.0 + 0.25 * vLit), 1.0);
        // a thread of light is drawn near opaque, or it vanishes into the bright volume behind it
        a = mix(a, max(a, cov * min(vAlpha * 2.2, 1.0) * 0.9), lum);
        // the sheath of light round the stroke, fading out a few px either side
        float s = max(vLit * 0.26, lum * 0.1) * min(vAlpha * 2.5, 1.0) * exp(-pow(d / (vHalf + 2.5 * uDpr), 2.0));
        float o = a + s * (1.0 - a);
        if (o < 0.004) discard;
        vec3 ink = mix(mix(uInk, uInkLit, vLit * 0.8), uThread, lum * 0.95);
        gl_FragColor = vec4(ink * a + uSheath * s * (1.0 - a), o);
      }`}),P=new r.Mesh(f,N);return P.frustumCulled=!1,P.renderOrder=1,{object:P,setFocus(e){if(D.fill(2),e>=0){let t=new Set(M[e]);h.forEach(([n,r],i)=>{D[i]=n===e||r===e?0:t.has(n)||t.has(r)?1:2})}j.needsUpdate=!0},dispose(){f.dispose(),N.dispose()}}}function l({THREE:t,network:r,tokens:o,shared:s,quality:c}){let l=c.tier===`low`,u=new t.InstancedBufferGeometry,d=[],f=[];for(let e=0;e<=72;e++)d.push(e/72,-1,e/72,1);for(let e=0;e<72;e++){let t=e*2;f.push(t,t+1,t+2,t+1,t+3,t+2)}u.setAttribute(`position`,new t.BufferAttribute(new Float32Array(438),3)),u.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(d),2)),u.setIndex(f);let p=[],m=[],h=[],g=n(1452),_=(e,t,n)=>{p.push(...e),m.push(...t),h.push(...n)},v=Math.PI*2;for(let e of r.nodes){if(e.kind!==`hub`&&e.kind!==`core`)continue;let t=e.kind===`core`,n=e.radius;_(e.pos,[n*(t?2.6:3.1),g()*v,v,t?56:44],[.8,1.3,.56,.0026]),!l&&(_(e.pos,[n*(t?4.4:5.4),g()*v,v*(.55+g()*.25),110],[.6,1.05,.3,-.0018]),t&&_(e.pos,[n*7.2,.2+g()*1.2,v*.42,160],[.5,1,.62,.0014]))}let y=r.nodes.filter(e=>e.kind===`junction`),b=l?5:10;for(let e=0;e<b;e++){let t=y[Math.floor(g()*y.length)];_(t.pos,[11+g()*14,g()*v,v*(.2+g()*.25),70],[.5,1,.7,(e%2?-1:1)*.0022])}let x=p.length/3;u.setAttribute(`aC`,new t.InstancedBufferAttribute(new Float32Array(p),3)),u.setAttribute(`aArc`,new t.InstancedBufferAttribute(new Float32Array(m),4)),u.setAttribute(`aSty`,new t.InstancedBufferAttribute(new Float32Array(h),4)),u.instanceCount=x;let S=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...s,uInk:{value:e(t,o.nodeRing)}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aC; attribute vec4 aArc, aSty;
      varying float vAlpha, vS, vDuty; varying vec3 vRib;
      void main() {
        // the page plane: camera right and up in world space
        vec3 U = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 V = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        float t = aArc.y + seg.x * aArc.z;
        vec3 P = aC + aArc.x * (cos(t) * U + sin(t) * V);
        vec3 dir = -sin(t) * U + cos(t) * V;
        float z = max(-(modelViewMatrix * vec4(aC, 1.0)).z, 0.02);
        float rPx = aArc.x * uPxK / z;
        float coc = cocPx(z) * 0.4;
        float w = aSty.y * uDpr + coc;
        float halfPx = w * 0.5 + 1.0;
        float zz;
        gl_Position = ribbonClip(P, dir, halfPx, seg.y, zz);
        vRib = vec3(seg.y * halfPx, halfPx, 1.0) * gl_Position.w;
        // dashes counted round the turn, creeping slowly with the idle clock
        vS = t / 6.2831853 * aArc.w + uTime * aSty.w * aArc.w;
        vDuty = aSty.z;
        // quieter away from the resting node, gone under the lens, too small or too vast
        float big = min(uRes.x, uRes.y);
        vAlpha = aSty.x * mix(0.7, 1.0, attnAt(aC)) * pow(aSty.y * uDpr / w, 1.2)
          * (1.0 - fogAmt(z) * 0.55) * nearFade(z, 1.5, 4.0)
          * smoothstep(6.0 * uDpr, 16.0 * uDpr, rPx) * (1.0 - smoothstep(0.7, 1.3, rPx / big))
          * (1.0 - uWarp);
        // the ends of an open arc taper off like a lifted pen
        if (aArc.z < 6.2) vAlpha *= smoothstep(0.0, 0.08, seg.x) * smoothstep(1.0, 0.9, seg.x);
      }`,fragmentShader:i+`
      uniform vec3 uInk;
      varying float vAlpha, vS, vDuty; varying vec3 vRib;
      void main() {
        float vHalf = vRib.y / vRib.z, d = abs(vRib.x / vRib.z);
        float a = clamp(vHalf - 0.5 - d, 0.0, 1.0);
        float f = fract(vS), fw = max(fwidth(vS), 1e-4);
        float dash = smoothstep(0.0, fw, f) * (1.0 - smoothstep(vDuty - fw, vDuty, f));
        a *= dash * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),C=new t.Mesh(u,S);return C.frustumCulled=!1,C.renderOrder=0,{object:C,count:x,dispose(){u.dispose(),S.dispose()}}}var u={junction:0,leaf:1,hub:2,core:3,soon:4},d=`
uniform float uSolidLeaves;
float nodeRadiusPx(float radius, float kind, float z, float focus, out float lens) {
  float rPx = radius * uPxK / z;
  // Lens pass: as a node swells toward the lens it shrinks back and fades out,
  // so a flash-by reads as a quick ink shape rather than a blot. Junctions go
  // early; content nodes a little later; the resting node never.
  float sz = rPx / min(uRes.x, uRes.y);
  lens = kind < 0.5 ? smoothstep(0.035, 0.085, sz) : smoothstep(0.1, 0.19, sz) * (1.0 - focus);
  rPx *= 1.0 - 0.4 * lens;
  // from outside, the core and the hubs are drawn a little larger, as the instruments of the sheet
  rPx *= mix(1.0, kind > 2.5 && kind < 3.5 ? 1.3 : kind > 1.5 && kind < 2.5 ? 1.55 : 1.0, uLand);
  // and every hub stays a legible instrument even on the far face
  rPx = mix(rPx, max(rPx, (kind > 1.5 && kind < 2.5 ? 17.0 : kind > 0.5 && kind < 1.5 ? 7.0 : kind < 0.5 ? 2.8 : 0.0) * uDpr), uLand);
  // hubs and the core never shrink below a readable bead, however far away
  return max(rPx, (kind < 0.5 ? 1.25 : kind > 1.5 && kind < 3.5 ? 6.5 : 2.6) * uDpr);
}
// How much of a node is drawn as a solid (0 to 1): once it is big enough to read as one.
// Thoughts (leaves) only on the high tier.
float solidVis(float kind, float rPx) {
  if (kind > 2.5 && kind < 3.5) return smoothstep(4.0 * uDpr, 8.0 * uDpr, rPx);
  if (kind > 1.5 && kind < 2.5) return smoothstep(6.0 * uDpr, 11.0 * uDpr, rPx);
  if (kind > 0.5 && kind < 1.5) return smoothstep(10.0 * uDpr, 16.0 * uDpr, rPx) * uSolidLeaves;
  return 0.0;
}
`;function f({THREE:r,network:a,tokens:s,shared:c}){let l=a.nodes,f=l.length,p=[[-49,6,4,.8],[-53,-12,-6,.6],[-45,25,-12,.7],[-55,17,10,.5],[-47,-26,8,.55],[50,-14,-8,.6],[44,30,6,.5]],m=f+p.length,h=new r.InstancedBufferGeometry,g=new r.PlaneGeometry(2,2);h.index=g.index,h.setAttribute(`position`,g.getAttribute(`position`));let _=new Float32Array(m*3),v=new Float32Array(m*4),y=new Float32Array(m),b=n(90210);l.forEach((e,t)=>{_.set(e.pos,t*3),v.set([e.radius,u[e.kind]??0,b(),t],t*4)}),p.forEach(([e,t,n,r],i)=>{_.set([e,t,n],(f+i)*3),v.set([r,1,.5,-10-i],(f+i)*4)}),h.setAttribute(`aPos`,new r.InstancedBufferAttribute(_,3)),h.setAttribute(`aInfo`,new r.InstancedBufferAttribute(v,4));let x=new r.InstancedBufferAttribute(y,1);x.setUsage(r.DynamicDrawUsage),h.setAttribute(`aRoute`,x),h.instanceCount=m;let S=e(r,s.node),C=e(r,s.panel),w=e(r,s.hub),T=Array.from({length:6},()=>new r.Vector4(-1,-99,0,0)),E=new r.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!0,premultipliedAlpha:!0,uniforms:{...c,uInk:{value:S},uPaper:{value:C},uBrass:{value:w},uUmber:{value:e(r,s.nodeRing)},uSage:{value:e(r,s.core)},uSageDeep:{value:t(r,e(r,s.core),S,.55)},uSoon:{value:e(r,s.soon)},uCopper:{value:e(r,s.route)},uCopperLit:{value:e(r,s.routeGlow)},uBrassLit:{value:t(r,w,C,.25)},uGlowSage:{value:t(r,e(r,s.glassLit||s.core),S,.2)},uGlass:{value:e(r,s.glass||s.node)},uGlassLit:{value:e(r,s.glassLit||s.core)},uNeonA:{value:e(r,s.neon[0])},uNeonB:{value:e(r,s.neon[1])},uHalo:{value:e(r,s.halo||`#F4FAF6`)},uGold:{value:e(r,s.core)},uGoldLit:{value:t(r,e(r,s.core),new r.Vector3(1,.97,.88),.6)},uHaze:{value:t(r,C,e(r,s.core),.15)},uFocusIdx:{value:-1},uFocusT:{value:0},uRouteT:{value:0},uGlowK:{value:1},uHits:{value:T}},vertexShader:i+o+d+`
      attribute vec3 aPos; attribute vec4 aInfo; attribute float aRoute;
      uniform float uFocusIdx;
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vIdx, vRoute, vFocus, vAttn, vInkF, vFar, vDk, vBead, vSolid;
      void main() {
        float kind = aInfo.y;
        vec4 mv = modelViewMatrix * vec4(drift(aPos), 1.0);
        float z = -mv.z;
        float fade = nearFade(z, 0.7 + aInfo.x * 1.2, 1.9 + aInfo.x * 2.4);
        if (z < 0.05 || fade < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float focus = abs(aInfo.w - uFocusIdx) < 0.5 ? 1.0 : 0.0;
        float lens;
        float rPx = nodeRadiusPx(aInfo.x, kind, z, focus, lens);
        if (lens > 0.995) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        // the named places the solids layer draws: the painted body steps aside for it
        vSolid = aInfo.w < -5.0 ? 0.0 : solidVis(kind, rPx);
        // volume pass: some junctions become small glass beads in white halos (the reference)
        vBead = kind < 0.5 && aInfo.z >= 0.1 && aInfo.z < 0.18 ? uVolLand * uVolOn : 0.0;
        rPx = mix(rPx, max(rPx, 5.5 * uDpr), vBead);
        float ext = kind < 0.5 ? 2.9 : kind < 2.5 ? 1.7 : kind < 3.5 ? 1.95 : 1.4;
        // the landing draws soft white halos and outer brass rings: the quad makes room for them
        ext = mix(ext, kind < 0.5 ? 3.4 : kind < 1.5 ? 2.6 : kind < 2.5 ? 2.3 : kind < 3.5 ? 2.6 : kind < 4.5 ? 1.4 : 3.2, uLand);
        ext = max(ext, focus * 1.9);
        // near the lens the blur stays tight: a crisp shape that fades, not a soft disc
        float coc = (z < uFocus ? min(cocPx(z), 3.0 * uDpr + 0.12 * rPx) : cocPx(z)) * (1.0 - uLand);
        float quad = min(max(rPx * ext, kind < 0.5 ? rPx + 7.0 * uDpr : 0.0) + coc + 2.0 * uDpr, uRes.y * 0.5);
        vec4 cc = projectionMatrix * mv; vec2 ndc = cc.xy / cc.w;
        vec2 rad = length(ndc) > 1e-3 ? normalize(ndc * vec2(uRes.x / uRes.y, 1.0)) : vec2(0.0, 1.0);
        vec2 off = position.xy * quad;
        // warp: a light smear outward along the line to the vanishing point
        float stretch = uWarp * 0.9 * min(length(ndc), 1.3);
        off += rad * dot(position.xy, rad) * quad * stretch;
        mv.xy += off * z / uPxK;
        gl_Position = projectionMatrix * mv;
        // depth at the front of the node's sphere, so a wire threaded through it
        // disappears under the disc at the rim and comes out the far side
        // (thoughts on the live route go further: see gl_FragDepth in the fragment shader)
        float lift = aInfo.x * 1.1;
        vec4 front = projectionMatrix * vec4(mv.xy, min(mv.z + lift, -0.05), 1.0);
        gl_Position.z = clamp(front.z / front.w, -1.0, 1.0) * gl_Position.w;
        vUv = position.xy * quad; vR = rPx; vBlur = coc; vKind = kind; vSeed = aInfo.z; vIdx = aInfo.w;
        vRoute = aRoute; vFocus = focus; vAttn = mix(0.7, 1.0, attnAt(aPos)) * uAttnOn;
        // attention: far-field junctions fade with their strokes, thoughts never do
        vInkF = mix(kind < 0.5 ? mix(0.3, 1.0, attnAt(aPos)) : 1.0, 1.0, uLand);
        vDk = depthK(z);
        // from outside, nothing is drawn over the core: a point that falls on its disc steps back
        vec4 cc0 = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float coreGap = length((cc0.xy / cc0.w - cc.xy / cc.w) * uRes * 0.5);
        float coreR = 2.2 * 1.3 * 1.38 * uPxK / max(-(modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z, 1.0);
        float hideByCore = kind > 2.5 && kind < 3.5 ? 0.0 : uLand * (1.0 - smoothstep(coreR * 1.05, coreR * 1.6, coreGap));
        // and nothing past the round boundary (thoughts stay, faintly, so none goes missing)
        float Rc = ROUND_R * uPxK / max(cc0.w, 1.0);
        bool deco = aInfo.w < -5.0;
        hideByCore = deco ? 1.0 - uLand : max(hideByCore, uLand * smoothstep(0.8 * Rc, Rc, coreGap) * (kind < 0.5 ? 1.0 : 0.5));
        // P6: the breathing field is halved past about 25 units from the lens, so the far page
        // does not fill with sage discs at the core and through the dive; round the resting
        // thought (the attention radius) it keeps its full life whatever the viewing distance
        vFar = 1.0 - 0.5 * smoothstep(20.0, 30.0, z) * (1.0 - attnAt(aPos));
        vAlpha = fade * (1.0 - lens) * (1.0 - fogAmt(z) * 0.95 * (1.0 - focus)) / (1.0 + stretch * 1.5) * mix(1.0, 0.5, smoothstep(6.0 * uDpr, 40.0 * uDpr, coc));
        // seen from outside, a node on the far face is drawn lighter, never blurred or fogged away
        // (the volume pass pushes the far face a little further back)
        vAlpha = mix(vAlpha, fade * mix(1.0, 0.6 - (kind > 1.5 && kind < 3.5 ? 0.0 : 0.1) * uVolDepth * uVolOn, vDk), uLand) * (1.0 - hideByCore);
      }`,fragmentShader:i+`
      uniform vec3 uInk, uPaper, uBrass, uUmber, uSage, uSageDeep, uSoon, uCopper, uCopperLit, uBrassLit, uNeonA, uNeonB, uGlowSage, uGlass, uGlassLit, uHalo, uGold, uGoldLit, uHaze;
      uniform float uFocusT, uRouteT, uGlowK;
      uniform vec4 uHits[6];
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vIdx, vRoute, vFocus, vAttn, vInkF, vFar, vDk, vBead, vSolid;
      vec4 acc = vec4(0.0);
      float glowA = 0.0;
      void over(vec3 c, float a) { a = clamp(a, 0.0, 1.0); acc.rgb = c * a + acc.rgb * (1.0 - a); acc.a = a + acc.a * (1.0 - a); }
      float disc(float d, float R) {
        float b = vBlur;
        return (1.0 - smoothstep(R - 0.6 - b * 0.5, R + 0.6 + b * 0.5, d)) * (R * R) / ((R + b * 0.5) * (R + b * 0.5));
      }
      float ring(float e, float th) {
        float b = vBlur, w = th + b;
        return (th / w) * (1.0 - smoothstep(w * 0.5 - 0.6 - b * 0.35, w * 0.5 + 0.6, e));
      }
      float ringAt(float d, float R, float th) { return ring(abs(d - R), th); }
      // a lit glass bead seen head on: deep at the rim, lighter where the light falls,
      // a caustic crescent opposite, and a small hard highlight
      vec3 glassBead(vec2 p, vec3 deep, vec3 lite) {
        float l2 = dot(p, p), nz = sqrt(max(1.0 - l2, 0.0));
        vec3 n = vec3(p, nz), L = normalize(vec3(-0.45, 0.55, 0.7));
        float lit = dot(n, L), fres = pow(1.0 - nz, 2.0);
        vec3 c = mix(deep, lite, smoothstep(-0.35, 0.95, lit) * 0.75);
        c = mix(c, deep * 0.72, fres * 0.75);
        float caustic = smoothstep(0.32, 0.0, abs(length(p - vec2(0.1, -0.1)) - 0.62)) * smoothstep(-0.2, 0.5, -p.y + p.x * 0.3);
        c = mix(c, lite, caustic * 0.45);
        float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n), L), 0.0), 26.0);
        return mix(c, vec3(0.97, 0.98, 0.95), spec * 0.9);
      }
      // distance to a tilted ellipse of radius R turned by phi, squashed by c
      float orbit(vec2 p, float R, float phi, float c, out float back) {
        float s = sin(phi), k = cos(phi);
        vec2 q = vec2(k * p.x + s * p.y, -s * p.x + k * p.y);
        vec2 ab = vec2(R, R * c);
        float f = dot(q / ab, q / ab) - 1.0;
        vec2 g = 2.0 * q / (ab * ab);
        back = step(0.0, q.y);
        return abs(f) / max(length(g), 1e-4);
      }
      // The landing look (target 06), seen from outside the whole network: small dark ink
      // points, some brass ringed, a few with a white glint; dark glass beads in soft white
      // halos; brass ringed hubs with a dashed outer ring; one teal glass core lit gold inside.
      void landLook(float d, float r, float px, vec3 ringCol) {
        float fk = mix(1.0, 0.72, vDk);
        float a = atan(vUv.y, vUv.x);
        if (vKind < 0.5 && vBead > 0.02) {
          // (fades with the landing rather than switching, so nothing pops through the dive)
          float rb = r * 0.62;
          over(uHalo, (1.0 - smoothstep(rb, r * 2.4, d)) * 0.5 * vBead);
          vec3 bead = glassBead(vUv / rb, mix(uGlass, uInk, 0.8), mix(uInk, uGlassLit, 0.45));
          over(bead, disc(d, rb) * 0.97 * fk * vBead);
          over(uInk, ringAt(d, rb, max(0.8 * px, rb * 0.08)) * 0.5 * vBead);
        } else if (vKind < 0.5) {
          float rd = max(r * 0.7, 1.7 * px);
          bool glint = vSeed > 0.66;
          if (glint) {
            over(uHalo, (1.0 - smoothstep(0.0, rd * 4.0, d)) * 0.4);
            vec2 q = abs(vUv) / max(rd, 1e-3);
            float star = max(smoothstep(0.55, 0.0, q.y) * smoothstep(3.6, 0.8, q.x), smoothstep(0.55, 0.0, q.x) * smoothstep(3.6, 0.8, q.y));
            over(uHalo, star * 0.55 * fk);
          }
          // a soft pale light round some of the points, so the drawing reads lit, not dry
          else if (vSeed > 0.3) over(uHalo, (1.0 - smoothstep(rd, rd * 3.4, d)) * 0.3 * mix(1.0, 0.85, vDk));
          if (vSeed < 0.1) over(uBrass, ringAt(d, rd * 1.9, max(0.8 * px, rd * 0.4)) * 0.85 * fk);
          over(uInk, disc(d, rd) * 0.9 * mix(1.0, 0.62, vDk));
          if (glint) over(uHalo, disc(d, rd * 0.45) * 0.6);
        } else if (vKind < 1.5) {
          float rb = r * 0.62;
          over(uHalo, (1.0 - smoothstep(rb, r * 2.5, d)) * 0.45);
          over(uHalo, ringAt(d, r * 1.75, max(1.0 * px, r * 0.07)) * 0.45);
          vec3 bead = glassBead(vUv / rb, mix(uGlass, uInk, 0.88), mix(uInk, uGlassLit, 0.3));
          over(bead, disc(d, rb) * 0.97);
          over(uInk, ringAt(d, rb, max(0.8 * px, rb * 0.08)) * 0.6);
        } else if (vKind < 2.5) {
          float rb = r * 0.46;
          over(uHalo, (1.0 - smoothstep(r * 0.7, r * 2.2, d)) * 0.3);
          over(uPaper, disc(d, r * 0.9) * 0.3);
          over(ringCol, ringAt(d, r * 0.74, max(1.6 * px, r * 0.17)) * 0.95);
          over(uUmber, ringAt(d, r * 0.6, max(0.7 * px, r * 0.04)) * 0.7);
          vec3 bead = glassBead(vUv / rb, mix(uGlass, uInk, 0.9), mix(uInk, uGlassLit, 0.22));
          over(bead, disc(d, rb) * 0.97);
          over(ringCol, ringAt(d, r * 1.0, max(0.9 * px, r * 0.05)) * 0.85);
          float dash = step(0.45, fract(a / 6.2831853 * 30.0 + uTime * 0.004));
          over(ringCol, ringAt(d, r * 1.4, max(0.9 * px, r * 0.05)) * dash * 0.8);
          // volume pass: a warm ring round the bead, lit at its edge (restrained on 26 September:
          // the wide gold wash was 0.35 and the lit ring 0.95 and wider, six bright lamps)
          float vk = min(uVolGlow, 1.3) * uVolOn;
          over(uGold, ring(abs(d - r * 0.72), max(3.0 * px, r * 0.3)) * 0.1 * vk * fk);
          over(mix(uGoldLit, uGold, 0.35), ring(abs(d - r * 0.62), max(1.4 * px, r * 0.09)) * 0.6 * vk * fk);
          over(uHalo, ringAt(d, r * 1.85, max(0.9 * px, r * 0.04)) * 0.35);
        } else if (vKind < 3.5) {
          vec2 p = vUv / r;
          over(mix(uGold, uPaper, 0.35), (1.0 - smoothstep(r, r * 2.6, d)) * 0.38);
          over(uHalo, ringAt(d, r * 1.3, max(1.2 * px, r * 0.06)) * 0.35);
          vec3 glass = glassBead(p, mix(uGlass, uInk, 0.4), mix(uGlassLit, uPaper, 0.25));
          over(glass, disc(d, r) * 0.97);
          vec2 nc = vUv - vec2(r * 0.02, -r * 0.06);
          over(uGold, (1.0 - smoothstep(0.0, r * 0.6, length(nc))) * 0.85);
          over(uGoldLit, disc(length(nc), max(r * 0.13, 1.5 * px)) * 0.8);
          over(uBrass, ringAt(d, r, max(1.3 * px, r * 0.05)) * 0.9);
          float vk = min(uVolGlow, 1.3) * uVolOn;
          over(uGold, ring(abs(d - r * 1.18), max(6.0 * px, r * 0.4)) * 0.4 * vk);
          over(mix(uGoldLit, vec3(1.0), 0.25), ring(abs(d - r * 1.08), max(2.6 * px, r * 0.12)) * 0.95 * vk);
          float dash = step(0.5, fract(a / 6.2831853 * 40.0 - uTime * 0.003));
          over(ringCol, ringAt(d, r * 1.75, max(0.9 * px, r * 0.035)) * dash * 0.75);
        }
      }
      // Where the solids layer draws the body, the quad keeps only the light round it and a
      // glass heart inside the frame (focus, hits and blur still come from here).
      void slimBody(float d, float r, float px) {
        if (vKind > 2.5) {
          // core: warm light, the teal glass heart lit gold inside the dodecahedron
          over(mix(uGold, uPaper, 0.35), (1.0 - smoothstep(r * 0.2, r * 2.2, d)) * 0.2);
          float rh = r * 0.5;
          vec3 glass = glassBead(vUv / rh, mix(uGlass, uInk, 0.4), mix(uGlassLit, uPaper, 0.25));
          over(glass, disc(d, rh) * 0.95);
          vec2 nc = vUv - vec2(rh * 0.02, -rh * 0.06);
          over(uGold, (1.0 - smoothstep(0.0, rh * 0.62, length(nc))) * 0.85);
          over(uGoldLit, disc(length(nc), max(rh * 0.14, 1.4 * px)) * 0.85);
          float vk = min(uVolGlow, 1.3) * uVolOn * uLand;
          over(uGold, ring(abs(d - rh * 1.25), max(4.0 * px, rh * 0.45)) * 0.22 * vk);
        } else if (vKind > 1.5) {
          // hub: a soft light and a small glass bead at the heart of the solid
          over(uHalo, (1.0 - smoothstep(r * 0.3, r * 2.0, d)) * 0.28);
          float rh = r * 0.32;
          over(mix(uGold, uGoldLit, 0.4), (1.0 - smoothstep(rh, rh * 2.6, d)) * 0.35 * uVolOn);
          vec3 bead = glassBead(vUv / rh, mix(uGlass, uInk, 0.8), mix(uInk, uGlassLit, 0.4));
          over(bead, disc(d, rh) * 0.95);
          over(uInk, ringAt(d, rh, max(0.8 * px, rh * 0.08)) * 0.6);
        } else {
          // leaf: a faint light and an ink heart
          over(uHalo, (1.0 - smoothstep(r * 0.3, r * 1.8, d)) * 0.22);
          over(uInk, disc(d, max(r * 0.2, 1.5 * px)) * 0.85);
        }
      }
      void main() {
        float d = length(vUv), r = vR, px = uDpr;
        float thin = max(0.85 * px, r * 0.07);
        vec3 ringCol = mix(uBrass, uBrassLit, vFocus * uFocusT);
        if (vKind < 0.5) {
          // junction
          // stations on the live route keep their ink body and take a copper heart and ring
          float st = vRoute > 0.5 ? uRouteT : 0.0;
          // out of focus, the ink thins toward the paper: light bokeh, not smudges
          vec3 jInk = mix(uInk, uPaper, 0.5 * smoothstep(8.0 * px, 50.0 * px, vBlur));
          // idle life: round the resting thought each junction breathes, a sage glow
          // under its ink swelling and settling on its own slow phase
          float bph = 0.5 + 0.5 * sin(uTime * 0.8 + vSeed * 47.0);
          // (a pinpoint's glow, so it fades out on big near junctions and on blurred ones)
          float gk = (1.0 - smoothstep(8.0 * px, 16.0 * px, r)) * (1.0 - smoothstep(14.0 * px, 30.0 * px, vBlur));
          // (kept apart and laid under the ink below, so the far field breathes too while its ink stays faint)
          glowA = (1.0 - smoothstep(r * 0.9, max(r * 2.8, r + 8.0 * px), d)) * 0.9 * bph * vAttn * gk * uGlowK * vFar;
          float breath = 1.0 - 0.3 * (1.0 - bph) * vAttn;
          // a big (near) junction opens into an inked ring round a pale wash and a
          // small heart, a lens bead rather than a solid blot
          float rb = vSeed < 0.14 ? r * 0.55 : r;
          float open = smoothstep(8.0 * px, 16.0 * px, rb);
          over(jInk, disc(d, rb) * mix(0.95 * breath, 0.14, open));
          over(jInk, ringAt(d, rb - max(0.8 * px, rb * 0.04), max(1.5 * px, rb * 0.08)) * 0.9 * open);
          over(jInk, disc(d, min(rb * 0.22, 5.0 * px)) * 0.85 * open);
          if (vSeed < 0.14) over(jInk, ringAt(d, r * 1.25, thin) * 0.8);
          // (the copper heart stays a dot near the lens, never a big copper disc beside the fine wire)
          over(uCopperLit, disc(d, min(r * 0.5, 6.0 * px)) * st * (1.0 - 0.7 * smoothstep(20.0 * px, 80.0 * px, r)));
          if (vSeed > 0.3 || st > 0.0) over(mix(jInk, uCopper, st), ringAt(d, r * 1.9, thin * (1.0 + st * 0.4)) * mix(0.55, 0.9, st));
          if (vSeed > 0.74) over(jInk, ringAt(d, r * 2.3, thin * 0.8) * 0.38);
        } else if (vKind < 2.5) {
          // leaf and hub medallions close up (lane A): paper disc, ink heart, brass rims
          bool hub = vKind > 1.5;
          // a thought the route threads through: the disc turns solid so the wire
          // tucks under it at the rim, and the rim takes the copper of the route
          float st = vRoute > 0.5 ? uRouteT : 0.0;
          over(uPaper, disc(d, r) * mix(0.88, 1.0, st));
          // the ink heart stays a dot: past 28 px it opens into a ring round a wash
          float hr = r * 0.34, hs = min(hr, 14.0 * px), ho = smoothstep(12.0 * px, 16.0 * px, hr);
          over(uInk, disc(d, hr) * mix(0.95, 0.18, ho));
          over(uInk, ringAt(d, hr - max(0.8 * px, hr * 0.05), max(1.6 * px, hr * 0.1)) * 0.9 * ho);
          over(uInk, disc(d, hs * 0.55) * 0.95 * ho);
          over(mix(uBrass, uCopper, st), ringAt(d, r * 0.6, thin * 0.9) * mix(0.55, 0.8, st));
          over(mix(ringCol, uCopper, st), ringAt(d, r, max(1.3 * px, r * 0.11)));
          over(uInk, ringAt(d, r * 1.08, thin * 0.7) * 0.7);
          if (hub) {
            float a = atan(vUv.y, vUv.x) + uTime * 0.05;
            float tick = step(0.82, fract(a / 6.2831853 * 48.0) ) + step(0.9, fract(a / 6.2831853 * 12.0)) * 0.6;
            float band = smoothstep(r * 1.12, r * 1.15, d) * (1.0 - smoothstep(r * 1.3, r * 1.33, d));
            over(uUmber, band * min(tick, 1.0) * 0.8 * (r > 7.0 * px ? 1.0 : 0.0));
            over(ringCol, ringAt(d, r * 1.4, thin) * 0.75);
          }
        } else if (vKind < 3.5) {
          // core: the one warm gold glass nucleus, with two tilted brass orbits
          vec2 p = vUv / r; float l2 = dot(p, p);
          float bk1, bk2;
          float o1 = orbit(vUv, r * 1.42, 0.35 + uTime * 0.06, 0.34, bk1);
          float o2 = orbit(vUv, r * 1.7, -0.6 - uTime * 0.045, 0.22, bk2);
          float oth = max(1.7 * px, r * 0.04);
          bool inside = l2 < 1.0;
          over(uBrass, ring(o1, oth) * (bk1 > 0.5 && inside ? 0.35 : 0.0));
          over(uBrass, ring(o2, oth * 0.8) * (bk2 > 0.5 && inside ? 0.3 : 0.0));
          // warm light round the core
          over(mix(uSage, uPaper, 0.55), (1.0 - smoothstep(r, r * 2.1, d)) * 0.42 * step(1.0, l2));
          vec3 gold = glassBead(p, mix(uSage, uInk, 0.45), mix(uSage, uPaper, 0.55));
          over(gold, disc(d, r) * 0.97);
          over(mix(uSage, uPaper, 0.7), disc(length(vUv - vec2(r * 0.04, -r * 0.03)), r * 0.2) * 0.55);
          over(uUmber, ringAt(d, r, max(1.3 * px, r * 0.035)) * 0.8);
          over(ringCol, ring(o1, oth) * (bk1 > 0.5 && inside ? 0.0 : 0.95));
          over(ringCol, ring(o2, oth * 0.8) * (bk2 > 0.5 && inside ? 0.0 : 0.8));
        } else {
          // soon: open dashed ring
          float a = atan(vUv.y, vUv.x);
          float dash = step(0.45, fract(a / 6.2831853 * 14.0));
          over(uPaper, disc(d, r) * 0.55);
          over(uSoon, ringAt(d, r, max(1.2 * px, r * 0.1)) * mix(1.0, dash, step(3.0 * px, r)));
          over(uSoon, disc(d, r * 0.26) * 0.9);
        }
        // the landing look replaces the close-up drawing while the camera stands outside
        if (uLand > 0.01 && vKind < 3.5) {
          vec4 near = acc; acc = vec4(0.0);
          landLook(d, r, px, ringCol);
          // volume pass: atmospheric depth, the far face tinted toward the warm air
          // (the core and the hubs stay clear: they are the landmarks)
          if (vKind < 1.5) acc.rgb = mix(acc.rgb, uHaze * acc.a, vDk * 0.28 * uVolDepth * uVolOn);
          acc = mix(near, acc, uLand);
          glowA *= 1.0 - uLand;
        }
        if (vSolid > 0.002 && vKind > 0.5 && vKind < 3.5) {
          vec4 full = acc; acc = vec4(0.0);
          slimBody(d, r, px);
          acc = mix(full, acc, vSolid);
        }
        // focus: a slow breathing outer ring
        if (vFocus > 0.5) {
          float br = 0.5 + 0.5 * sin(uTime * 1.6);
          float R = r * (vKind > 2.5 && vKind < 3.5 ? 1.9 : 1.55 + 0.05 * br);
          over(ringCol, ringAt(d, R, max(1.0 * px, r * 0.04)) * uFocusT * (0.45 + 0.35 * br));
        }
        // neon hits: a ring that flares out from a node when a signal lands
        for (int i = 0; i < 6; i++) {
          vec4 h = uHits[i];
          if (abs(h.x - vIdx) < 0.5) {
            float t = uTime - h.y;
            if (t > 0.0 && t < 1.4) {
              vec3 c = mix(h.z < 0.5 ? uNeonA : h.z < 1.5 ? uNeonB : uCopperLit, uHalo, uLand);
              float k = exp(-t * 3.0);
              float Rr = max(r, 2.5 * px) * (1.2 + t * 2.4) + 2.0 * px;
              over(c, ringAt(d, Rr, 1.6 * px + min(r, 12.0 * px) * 0.1) * k);
              over(c, ringAt(d, r, clamp(r * 0.12, 1.4 * px, 3.0 * px)) * k);
              over(c, disc(d, min(max(r * 0.5, 2.0 * px), 7.0 * px)) * k * 0.9);
            }
          }
        }
        acc *= vInkF;
        acc.rgb += uGlowSage * glowA * (1.0 - acc.a); acc.a += glowA * (1.0 - acc.a);
        acc *= vAlpha;
        if (acc.a < 0.003) discard;
        // a thought the route threads through always sits over the wire, so the
        // wire tucks under its rim going in and coming out, whatever the angle
        gl_FragDepth = vKind > 0.5 && vRoute > 0.5 && uRouteT > 0.01 ? 0.0 : gl_FragCoord.z;
        gl_FragColor = acc;
      }`}),D=new r.Mesh(h,E);D.frustumCulled=!1,D.renderOrder=4;let O=0;return{object:D,uniforms:E.uniforms,setRouteNodes(e){if(y.fill(0),e)for(let t of e)y[t]=1;x.needsUpdate=!0},hit(e,t,n){T[O].set(e,t,n,0),O=(O+1)%6},clearHits(){for(let e of T)e.set(-1,-99,0,0)},dispose(){h.dispose(),g.dispose(),E.dispose()}}}var p=`
uniform vec2 uPulse;
float pulseAt(float s) {
  float p = 0.0;
  for (int i = 0; i < 2; i++) { float ds = s - uPulse[i]; p = max(p, ds > 0.0 ? exp(-ds * ds * 0.9) : exp(ds * 0.45) * 0.8); }
  return p;
}
`;function m({THREE:n,tokens:r,shared:o}){let s=e(n,r.route),c=e(n,r.routeGlow),l=new n.ShaderMaterial({transparent:!0,depthWrite:!0,depthTest:!0,premultipliedAlpha:!0,side:n.DoubleSide,uniforms:{...o,uCopper:{value:s},uGlow:{value:c},uDeep:{value:t(n,s,e(n,r.ink),.45)},uSheen:{value:t(n,c,e(n,r.panel),.55)},uHot:{value:t(n,c,e(n,r.panel),.45)},uReveal:{value:0},uFade:{value:0},uLen:{value:1},uCamS:{value:0},uPulse:{value:new n.Vector2(-99,-99)}},vertexShader:i+a+p+`
      attribute vec3 aTan; attribute float aS, aSide;
      varying float vS, vZ, vClose;
      varying vec4 vLin;
      void main() {
        float z = max(-(modelViewMatrix * vec4(position, 1.0)).z, 0.02);
        float pv = pulseAt(aS) * smoothstep(3.0, 9.0, z);  // no swelling right under the lens
        // core half width: a real wire in world units, never thinner than a bold
        // pen stroke and never a blob under the lens. The signal swells it a little.
        // the glow stays close round the wire, so a clear band of parchment frames it
        // Close to the lens the wire stays a fine wire (items 12 and R6 of the lane A spec):
        // the core is capped at 9 px, and past the cap the glow does not widen (a wide
        // glow band read as a pipe); it only brightens, held within 8 px of the wire.
        float rawPx = 0.034 * uPxK / z;
        float corePx = min(clamp(rawPx, 2.3 * uDpr, 0.026 * min(uRes.x, uRes.y)) * (1.0 + 0.45 * pv), 4.5 * uDpr);
        float close = clamp((rawPx - corePx) / (corePx * 3.0), 0.0, 1.0);
        float haloPx = mix(min(corePx * 3.4, corePx + 16.0 * uDpr) * (1.0 + 0.6 * pv), corePx + 8.0 * uDpr, smoothstep(0.0, 0.3, close));
        // Round 3 P2: a hard cap on the ribbon in screen pixels, so on a portrait phone
        // (wider field of view, the wire passing at two to four units) the swollen glow
        // never reads as a pipe: 18 px across at most. Closeness is carried by the
        // glow brightening (0.22 * vClose below), not by width.
        haloPx = min(haloPx, 9.0 * uDpr);
        float halfPx = haloPx + 1.5;
        float zz;
        gl_Position = ribbonClip(position, aTan, halfPx, aSide, zz);
        // across-the-wire values must interpolate linearly on screen, or the
        // edges scallop between samples: carry them multiplied by w
        float w = gl_Position.w;
        vLin = vec4(aSide * halfPx, corePx, haloPx, 1.0) * w;
        vS = aS; vZ = z; vClose = close;
      }`,fragmentShader:i+p+`
      uniform vec3 uCopper, uGlow, uDeep, uSheen, uHot;
      uniform float uReveal, uFade, uLen, uCamS;
      varying float vS, vZ, vClose;
      varying vec4 vLin;
      vec4 acc = vec4(0.0);
      void over(vec3 c, float a) { a = clamp(a, 0.0, 1.0); acc.rgb = c * a + acc.rgb * (1.0 - a); acc.a = a + acc.a * (1.0 - a); }
      void main() {
        vec3 lin = vLin.xyz / vLin.w;
        float vCorePx = lin.y, vX = lin.x / lin.y, vHaloX = lin.z / lin.y;
        float x = abs(vX);
        float aa = 1.2 / vCorePx;                      // one device px in core units
        // travelling signal: a hot bead with a tail that trails toward the camera
        float p = pulseAt(vS);
        // glow halo, much stronger around the pulse
        float h = clamp((x - 0.9) / max(vHaloX - 0.9, 0.1), 0.0, 1.0);
        float g = exp(-h * h * 4.0) * (1.0 - h);
        over(uGlow, g * (0.3 + 0.55 * p + 0.22 * vClose));
        // the wire: inked edge, copper body, sheen
        float body = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, x);
        float nz = sqrt(max(1.0 - x * x, 0.0));
        // near the lens the wire is drawn flat, one solid copper stroke: the inked edges
        // and sheen of a rounded wire read as a twin-edged pipe up close
        vec3 c = mix(uDeep, uCopper, max(smoothstep(0.0, 0.55, nz), vClose));
        float sheen = exp(-pow((vX + 0.32) * 4.2, 2.0));
        c = mix(c, uSheen, sheen * 0.55 * (1.0 - vClose));
        // the signal: the copper heats from the inside out, while the outer third of
        // the wire stays copper so the bead keeps its 3:1 silhouette on the paper
        c = mix(c, uGlow, p * smoothstep(0.6, 0.9, nz));
        c = mix(c, uHot, p * p * smoothstep(0.9, 0.99, nz) * 0.7);
        over(c, body);
        float a = uFade;
        // ink itself in from the start, with a soft wet tip
        a *= 1.0 - smoothstep(uReveal - 1.5, uReveal, vS);
        // the stretch already ridden reads as spent, a little quieter
        // (no dimming of the stretch already ridden: the rider now arcs off the wire
        // round intermediate thoughts, so "behind" is not reliable, and the route
        // must keep its full contrast wherever it is on screen)
        a *= 1.0 - fogAmt(vZ) * 0.45;
        a *= smoothstep(0.08, 0.35, vZ);
        acc *= a;
        if (acc.a < 0.003) discard;
        // only the wire itself goes into the depth buffer (the glow does not), so
        // nodes behind it are covered and a node it threads through hides it cleanly
        gl_FragDepth = body > 0.5 && a > 0.3 ? gl_FragCoord.z : 1.0;
        gl_FragColor = acc;
      }`}),u=null,d=null,f=null,m=null,h=0,g=0,_=`off`,v=0,y=0,b=0,x=[-99,-99],S=new n.Group;function C(e){let t=e.length,r=new Float32Array(t*2*3),i=new Float32Array(t*2*3),a=new Float32Array(t*2),o=new Float32Array(t*2);m=new Float32Array(t);let s=0;for(let c=0;c<t;c++){c&&(s+=e[c].distanceTo(e[c-1])),m[c]=s;let l=e[Math.max(c-1,0)],u=e[Math.min(c+1,t-1)],d=new n.Vector3().subVectors(u,l).normalize();for(let t=0;t<2;t++){let n=c*2+t;r.set([e[c].x,e[c].y,e[c].z],n*3),i.set([d.x,d.y,d.z],n*3),a[n]=s,o[n]=t?1:-1}}let c=[];for(let e=0;e<t-1;e++){let t=e*2;c.push(t,t+1,t+2,t+1,t+3,t+2)}d=new n.BufferGeometry,d.setAttribute(`position`,new n.BufferAttribute(r,3)),d.setAttribute(`aTan`,new n.BufferAttribute(i,3)),d.setAttribute(`aS`,new n.BufferAttribute(a,1)),d.setAttribute(`aSide`,new n.BufferAttribute(o,1)),d.setIndex(c),u=new n.Mesh(d,l),u.frustumCulled=!1,u.renderOrder=3,S.add(u),f=e,h=s,g=0}function w(){u&&(S.remove(u),d.dispose(),u=null,d=null,f=null)}return{object:S,get active(){return _===`on`},reset(){w(),_=`off`},set(e,t){if(!e||e.length<2){u&&(_=`fading`,y=0);return}w(),C(e),_=`on`,v=t,x[0]=-99,x[1]=-99,l.uniforms.uLen.value=h,l.uniforms.uFade.value=1,l.uniforms.uCamS.value=0},update(e,t,n){if(!u)return;let r=l.uniforms;if(_===`fading`&&(y+=t,r.uFade.value=Math.max(0,1-y/.35),y>=.35)){w(),_=`off`;return}if(r.uReveal.value=Math.min(h+2,(e-v)*Math.max(60,h*2.2)),n.travelling){let e=g,t=1/0;for(let r=g;r<Math.min(g+16,f.length);r++){let i=f[r].distanceToSquared(n.position);i<t&&(t=i,e=r)}g=e}let i=m[g];if(r.uCamS.value=i,_===`on`&&n.travelling){b+=(16+n.speed*.4)*t;let e=Math.max(Math.min(h-i-2.5,36),5);for(let t=0;t<2;t++)x[t]=i+2.5+(b+t*e/2)%e}else _!==`on`&&(x[0]=x[1]=-99);r.uPulse.value.set(x[0],x[1])},dispose(){w(),l.dispose()}}}function h({THREE:t,network:r,tokens:o,shared:s,quality:c,nodes:l}){let u=c.tier===`low`?3:6,d=u+1,f=u,p=new t.InstancedBufferGeometry,m=[],h=[];for(let e=0;e<=8;e++)m.push(e/8,-1,e/8,1);for(let e=0;e<8;e++){let t=e*2;h.push(t,t+1,t+2,t+1,t+3,t+2)}p.setAttribute(`position`,new t.BufferAttribute(new Float32Array(54),3)),p.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(m),2)),p.setIndex(h);let g=new Float32Array(d*3),_=new Float32Array(d*3),v=new Float32Array(d*4).fill(-99),y=new t.InstancedBufferAttribute(g,3),b=new t.InstancedBufferAttribute(_,3),x=new t.InstancedBufferAttribute(v,4);for(let e of[y,b,x])e.setUsage(t.DynamicDrawUsage);p.setAttribute(`aA`,y),p.setAttribute(`aB`,b),p.setAttribute(`aT`,x),p.instanceCount=d;let S=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...s,uNeonA:{value:e(t,o.neon[0])},uNeonB:{value:e(t,o.neon[1])},uPaper:{value:e(t,o.panel)},uCopper:{value:e(t,o.routeGlow)},uGlint:{value:e(t,o.glint||`#CFEDEA`)}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aA, aB; attribute vec4 aT; // start, duration, colour, trail fraction
      varying float vAlpha, vHead, vCol; varying vec3 vRib;
      void main() {
        float u = (uTime - aT.x) / aT.y;
        if (u < 0.0 || u > 1.0 + aT.w) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        // at the landing a spark is a pale glint with a short tail, not a cyan streak
        float tw = aT.w * mix(1.0, 0.35, uLand);
        if (u > 1.0 + tw) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float head = clamp(u, 0.0, 1.0), tail = clamp(u - tw, 0.0, 1.0);
        vec3 P = drift(mix(aA, aB, mix(head, tail, seg.x)));
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        // a thought (colour 2) keeps a readable head even from far back
        float big = aT.z > 1.5 ? 1.35 : 1.0;
        float core = uDpr * big * mix(1.0, 0.7, uLand) * mix(3.2, 0.8, sqrt(seg.x)) * mix(1.6, 1.0, smoothstep(2.0, 20.0, z)) + cocPx(z) * 0.3;
        float vHalf = core * 3.0 + 1.0;
        float zz;
        gl_Position = ribbonClip(P, normalize(drift(aB) - drift(aA)), vHalf, seg.y, zz);
        vRib = vec3(seg.y * vHalf, vHalf, 1.0) * gl_Position.w; vHead = 1.0 - seg.x; vCol = aT.z;
        vAlpha = (1.0 - fogAmt(z) * 0.9) * nearFade(z, 0.4, 1.4);
      }`,fragmentShader:i+`
      uniform vec3 uNeonA, uNeonB, uPaper, uCopper, uGlint;
      varying float vAlpha, vHead, vCol; varying vec3 vRib;
      void main() {
        vec3 c = mix(vCol < 0.5 ? uNeonA : vCol < 1.5 ? uNeonB : uCopper, uGlint, uLand);
        float vHalf = vRib.y / vRib.z, d = abs(vRib.x / vRib.z), core = (vHalf - 1.0) / 3.0;
        float body = clamp(core * 0.5 + 0.5 - d, 0.0, 1.0);
        float glow = exp(-pow(d / (core * 1.5 + 0.5), 2.0)) * 0.6;
        float trail = pow(vHead, 1.3);
        vec3 col = mix(c, uPaper, pow(vHead, 12.0) * body * 0.45);
        float a = max(body, glow) * trail * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(col * a, a);
      }`}),C=new t.Mesh(p,S);C.frustumCulled=!1,C.renderOrder=5;let w=r.nodes.map(e=>new t.Vector3(...e.pos)),T=r.nodes.map(()=>[]);r.edges.forEach(([e,t])=>{T[e].push(t),T[t].push(e)});let E=n(4242),D=Array.from({length:d},(e,t)=>({busy:!1,next:.6+t*.9+E()*1.5,to:-1,end:0,colour:0,hops:0})),O=new t.Vector3,k=new t.Vector3,A=-1,j=1.2,M=!1,N=0;function P(e,t,n,r,i){let a=i>1.5,o=D[e],s=w[t].distanceTo(w[n]),c=s/(a?6.5:13);g.set(w[t].toArray(),e*3),_.set(w[n].toArray(),e*3),v.set([r,c,i,Math.min((a?6:4.5)/Math.max(s,.1),a?.75:.9)],e*4),Object.assign(o,{busy:!0,from:t,to:n,end:r+c,colour:i}),y.needsUpdate=b.needsUpdate=x.needsUpdate=!0}function F(){for(let e of D)e.busy=!1,e.hops=0;v.fill(-99),x.needsUpdate=!0}let I=new t.Vector3;function L(e){let t=s.uAttnR.value.y,n=w[A];for(let i=0;i<60;i++){let[i,a]=r.edges[Math.floor(E()*r.edges.length)];if(k.addVectors(w[i],w[a]).multiplyScalar(.5),!(k.distanceTo(n)>t||k.distanceTo(e.position)<10)&&(I.copy(k).project(e),I.z<1&&Math.abs(I.x)<.95&&Math.abs(I.y)<.9))return E()<.5?[i,a]:[a,i]}return null}function R(e){e.getWorldDirection(O);for(let t=0;t<60;t++){let[t,n]=r.edges[Math.floor(E()*r.edges.length)];k.addVectors(w[t],w[n]).multiplyScalar(.5).sub(e.position);let i=k.length();if(i>4&&i<30&&k.dot(O)>i*.55)return E()<.5?[t,n]:[n,t]}return null}return{object:C,setFocus(e){A=e},update(e,t,n,r,i=!1){if(i){M||(F(),l.clearHits()),M=!0;return}if(M){M=!1,j=e+1;for(let t=0;t<u;t++)D[t].next=e+.6+E()*2}if(N=s.uLand.value>.99?N+t:0,s.uLand.value>.01&&N<6){for(let t of D)t.busy||(t.next=Math.max(t.next,e+.3));j=Math.max(j,e+.3);return}let a=D[f],o=A>=0&&!n.travelling;if(a.busy&&e>=a.end){l.hit(a.to,e,2),a.busy=!1,a.hops++;let t=T[a.to].filter(e=>e!==a.from);o&&a.hops<3&&t.length&&E()<.5?P(f,a.to,t[Math.floor(E()*t.length)],e,2):a.hops=0}if(!o)j=Math.max(j,e+1.4);else if(!a.busy&&e>=j&&T[A].length){let t=T[A];P(f,A,t[Math.floor(E()*t.length)],e,2),a.hops=0,j=e+3+E()*2}let c=o?Math.ceil(u/2):u;for(let t=0;t<u;t++){let n=D[t];if(t>=c&&!n.busy){n.next=Math.max(n.next,e+.5);continue}if(n.busy&&e>=n.end){if(l.hit(n.to,e,n.colour),n.busy=!1,n.hops++,n.hops<3&&E()<.6){let r=T[n.to];P(t,n.to,r[Math.floor(E()*r.length)],e,n.colour);continue}n.next=e+1.2+E()*3.5,n.hops=0}if(!n.busy&&e>=n.next){let i=o?L(r):R(r);i?P(t,i[0],i[1],e,E()<.55?0:1):n.next=e+.5}}},dispose(){p.dispose(),S.dispose()}}}function g({THREE:t,tokens:r,shared:a,quality:o}){let s=o.tier===`low`?320:640,c=n(1618),l=new Float32Array(s*3),u=new Float32Array(s*2);for(let e=0;e<s;e++)l.set([c()*30,c()*30,c()*30],e*3),u.set([c(),c()],e*2);let d=new t.BufferGeometry;d.setAttribute(`position`,new t.BufferAttribute(l,3)),d.setAttribute(`aS`,new t.BufferAttribute(u,2));let f=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,uniforms:{...a,uCam:{value:new t.Vector3},uAnchor:{value:new t.Vector3},uBox:{value:30},uInk:{value:e(t,r.edge)},uBrass:{value:e(t,r.hub)}},vertexShader:i+`
      uniform vec3 uCam, uAnchor; uniform float uBox;
      attribute vec2 aS;
      varying float vA, vCore, vSize, vKind;
      void main() {
        float k = uBox / 30.0;
        vec3 drift = vec3(sin(uTime * 0.07 + aS.x * 40.0), cos(uTime * 0.05 + aS.y * 30.0), sin(uTime * 0.06 + aS.x * 17.0)) * mix(0.6, 1.4, uAttnOn) * k;
        vec3 rel = mod(position * k + drift - uAnchor + uBox * 0.5, uBox) - uBox * 0.5;
        vec4 mv = viewMatrix * vec4(uAnchor + rel, 1.0);
        float z = -mv.z;
        if (z < 0.1) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float core = uDpr * (aS.y > 0.93 ? 2.2 : 0.9 + aS.x * 0.9);
        // at rest the specks read as ink spatter on the drawing, softer blur
        float coc = cocPx(z) * mix(1.3, 0.55, uAttnOn);
        float size = min(core + coc + 1.5 * uDpr, 70.0 * uDpr);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size;
        float edge = 1.0 - smoothstep(uBox * 0.32, uBox * 0.5, length(rel));
        vA = edge * nearFade(z, 0.25, 0.9) * (core * core) / ((core + coc) * (core + coc)) * mix(0.55, 0.9, aS.x) * (1.0 + 0.6 * uAttnOn);
        vA = max(vA, edge * nearFade(z, 0.25, 0.9) * 0.05 * step(3.0, coc));
        vCore = core; vSize = size; vKind = aS.y;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uBrass;
      varying float vA, vCore, vSize, vKind;
      void main() {
        float d = length(gl_PointCoord - 0.5) * vSize;
        float R = vSize * 0.5 - 0.75 * uDpr;
        float a = (1.0 - smoothstep(R - max(1.0, (vSize - vCore) * 0.35), R, d)) * vA;
        vec3 c = vKind > 0.85 ? uBrass : uInk;
        if (a < 0.003) discard;
        gl_FragColor = vec4(c * a, a);
      }`}),p=new t.Points(d,f);return p.frustumCulled=!1,p.renderOrder=6,{object:p,update(e,t,n,r,i=null){let o=f.uniforms,s=a.uAttnOn.value;if(o.uCam.value.copy(r.position),i){let e=r.position.distanceTo(i);o.uAnchor.value.copy(r.position).lerp(i,.55*s),o.uBox.value=30+(Math.max(30,e*1.15)-30)*s}else o.uAnchor.value.copy(r.position),o.uBox.value=30},dispose(){d.dispose(),f.dispose()}}}function _({THREE:t,tokens:r,shared:a,quality:o}){let s=o.tier===`low`?36:72,c=new t.InstancedBufferGeometry;c.setAttribute(`position`,new t.BufferAttribute(new Float32Array(12),3)),c.setAttribute(`seg`,new t.BufferAttribute(new Float32Array([0,-1,0,1,1,-1,1,1]),2)),c.setIndex([0,1,2,1,3,2]);let l=n(5150),u=new Float32Array(s*4);for(let e=0;e<s;e++){let t=1.6+l()**.8*8.5;u.set([l()*Math.PI*2,t,l()*70,l()],e*4)}c.setAttribute(`aD`,new t.InstancedBufferAttribute(u,4)),c.instanceCount=s;let d=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...a,uFlow:{value:0},uInk:{value:e(t,r.edge)},uCopper:{value:e(t,r.route)}},vertexShader:i+`
      uniform float uFlow;
      attribute vec2 seg; attribute vec4 aD;
      varying float vA, vSide, vHalf, vT, vK;
      void main() {
        float zh = mod(aD.z - uFlow, 70.0) + 0.6;
        float len = 1.0 + 16.0 * uWarp * (0.6 + aD.w * 0.8);
        float z = zh + seg.x * len;
        vec3 v = vec3(cos(aD.x) * aD.y, sin(aD.x) * aD.y * 0.8, -z);
        // screen space sideways offset for a pen-width stroke
        vec3 along = normalize(vec3(0.0, 0.0, -1.0));
        vec3 side = normalize(cross(along, normalize(v)));
        vHalf = uDpr * (aD.w > 0.9 ? 1.1 : 0.7) * mix(1.5, 0.7, seg.x) + 1.0;
        v += side * seg.y * vHalf * z / uPxK;
        gl_Position = projectionMatrix * vec4(v, 1.0);
        vA = uWarp * smoothstep(0.6, 3.0, zh) * (1.0 - smoothstep(30.0, 70.0, z));
        vSide = seg.y; vT = seg.x; vK = aD.w;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uCopper;
      varying float vA, vSide, vHalf, vT, vK;
      void main() {
        float d = abs(vSide) * vHalf;
        float a = clamp(vHalf - 0.5 - d, 0.0, 1.0) * vA * (1.0 - vT) * (vK > 0.9 ? 0.85 : 0.5);
        if (a < 0.003) discard;
        vec3 c = vK > 0.9 ? uCopper : uInk;
        gl_FragColor = vec4(c * a, a);
      }`}),f=new t.Mesh(c,d);return f.frustumCulled=!1,f.renderOrder=7,f.visible=!1,{object:f,update(e,t,n){f.visible=(n.warp||0)>.01,d.uniforms.uFlow.value+=t*(n.speed||0)*1.6},dispose(){c.dispose(),d.dispose()}}}var v=[[53,.97,1.3,.12,-.08,170,.5,1],[50,.72,.55,-.35,.62,150,.42,.95],[47,1,.12,.05,0,190,.3,.85]],y=150,b=[66,58,36,-41,-60,-71];function x({THREE:t,tokens:n,shared:r}){let o=new t.InstancedBufferGeometry,s=[],c=[];for(let e=0;e<=200;e++)s.push(e/200,-1,e/200,1);for(let e=0;e<200;e++){let t=e*2;c.push(t,t+1,t+2,t+1,t+3,t+2)}o.setAttribute(`position`,new t.BufferAttribute(new Float32Array(1206),3)),o.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(s),2)),o.setIndex(c);let l=[],u=[],d=[],f=[];for(let[e,n,r,i,a,o,s,c]of v){let p=new t.Matrix4().makeRotationY(i).multiply(new t.Matrix4().makeRotationZ(a)).multiply(new t.Matrix4().makeRotationX(r)),m=new t.Vector3(1,0,0).applyMatrix4(p).multiplyScalar(e),h=new t.Vector3(0,1,0).applyMatrix4(p).multiplyScalar(e*n);l.push(m.x,m.y,m.z),u.push(h.x,h.y,h.z),d.push(o,s,c,0),f.push(0)}l.push(0,y,0),u.push(0,0,0),d.push(0,.34,.8,0),f.push(1),o.setAttribute(`aU`,new t.InstancedBufferAttribute(new Float32Array(l),3)),o.setAttribute(`aV`,new t.InstancedBufferAttribute(new Float32Array(u),3)),o.setAttribute(`aS`,new t.InstancedBufferAttribute(new Float32Array(d),4)),o.setAttribute(`aMode`,new t.InstancedBufferAttribute(new Float32Array(f),1)),o.instanceCount=v.length+1;let p=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...r,uInk:{value:e(t,n.edge)},uGold:{value:e(t,n.core)},uHalo:{value:e(t,n.halo||`#F4FAF6`)},uBeads:{value:b}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aU, aV; attribute vec4 aS; attribute float aMode;
      varying float vAlpha, vS, vMode, vY, vPpu; varying vec3 vRib;
      void main() {
        float t = seg.x * 6.2831853;
        vec3 P = aMode > 0.5 ? mix(-aU, aU, seg.x) : cos(t) * aU + sin(t) * aV;
        vec3 dir = aMode > 0.5 ? vec3(0.0, 1.0, 0.0) : normalize(-sin(t) * aU + cos(t) * aV);
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        float w = aS.z * uDpr + cocPx(z) * 0.3 * (1.0 - uLand);
        // the axis ribbon is wide enough to carry its beads
        float halfPx = (aMode > 0.5 ? 4.5 * uDpr : w * 0.5) + 1.0, zz;
        gl_Position = ribbonClip(P, dir, halfPx, seg.y, zz);
        vRib = vec3(seg.y * halfPx, halfPx, 1.0) * gl_Position.w;
        vS = seg.x * aS.x; vMode = aMode; vY = P.y; vPpu = uPxK / z;
        // the axis fades toward the frame's top and bottom edges
        float ends = aMode > 0.5 ? smoothstep(0.0, 0.25, seg.x) * smoothstep(1.0, 0.75, seg.x) : 1.0;
        vAlpha = aS.y * pow(aS.z * uDpr / w, 1.2) * nearFade(z, 4.0, 12.0) * uLand * (1.0 - uWarp) * ends;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uGold, uHalo; uniform float uBeads[${b.length}];
      varying float vAlpha, vS, vMode, vY, vPpu; varying vec3 vRib;
      void main() {
        float d = abs(vRib.x / vRib.z);
        if (vMode > 0.5) {
          // the axis: a fine line, and small gold beads with a soft light round them
          float line = clamp(0.4 * uDpr + 0.5 - d, 0.0, 1.0);
          vec4 c = vec4(uInk * line, line) * 0.5;
          // the axis glows gently along its length
          float ax = exp(-pow(d / (2.4 * uDpr), 2.0)) * 0.22;
          c = vec4(uHalo * ax, ax) + c * (1.0 - ax);
          float bead = 0.0, glow = 0.0;
          for (int i = 0; i < ${b.length}; i++) {
            float r = length(vec2(d, (vY - uBeads[i]) * vPpu));
            bead = max(bead, clamp(3.0 * uDpr + 0.5 - r, 0.0, 1.0));
            glow = max(glow, 1.0 - smoothstep(0.0, 4.5 * uDpr, r));
          }
          c = vec4(uHalo * glow * 0.5, glow * 0.5) + c * (1.0 - glow * 0.5);
          c = vec4(uGold * bead, bead) + c * (1.0 - bead);
          c *= vAlpha / 0.34;
          if (c.a < 0.004) discard;
          gl_FragColor = c;
          return;
        }
        float a = clamp(vRib.y / vRib.z - 0.5 - d, 0.0, 1.0);
        float f = fract(vS), fw = max(fwidth(vS), 1e-4);
        a *= smoothstep(0.0, fw, f) * (1.0 - smoothstep(0.55 - fw, 0.55, f)) * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),m=new t.Mesh(o,p);return m.frustumCulled=!1,m.renderOrder=0,{object:m,dispose(){o.dispose(),p.dispose()}}}var S=45;function C({THREE:n,tokens:r,shared:a}){let o=new n.PlaneGeometry(2,2),s=new n.ShaderMaterial({transparent:!0,depthTest:!1,depthWrite:!1,premultipliedAlpha:!0,uniforms:{...a,uR:{value:S},uHalo:{value:e(n,r.halo||`#F4FAF6`)},uPool:{value:t(n,e(n,r.panel),e(n,r.core),.12)}},vertexShader:i+`
      uniform float uR; varying vec2 vP; varying float vK;
      void main() {
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float Rs = uR;
        vK = 1.35;
        vP = position.xy * vK;
        mv.xy += position.xy * Rs * vK;
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:i+`
      uniform vec3 uHalo, uPool; varying vec2 vP; varying float vK;
      void main() {
        float d = length(vP);
        // light pooling behind the drawing, strongest round the core
        // soft light inside the disc only, so the wall's ink round it is untouched
        float pool = 0.2 * exp(-d * d * 0.9) * (1.0 - smoothstep(0.7, 1.02, d));
        // the luminous boundary: a soft bright rim with a faint glow either side
        // a faint thin boundary arc, a drawn line of light rather than a glowing ring
        float rim = exp(-pow((d - 1.0) / 0.0045, 2.0)) * 0.22 + exp(-pow((d - 1.0) / 0.03, 2.0)) * 0.04;
        // volume pass: the boundary becomes a clear line of light with a soft glow either side
        rim *= 1.0 + 0.6 * uVolGlow * uVolOn;
        rim += exp(-pow((d - 1.0) / 0.05, 2.0)) * 0.035 * uVolGlow * uVolOn;
        float inner = 0.0;
        float a = (pool + rim + inner) * uLand * (1.0 - uWarp);
        if (a < 0.003) discard;
        vec3 c = (uPool * pool + uHalo * (rim + inner)) / max(pool + rim + inner, 1e-4);
        gl_FragColor = vec4(c * a, a);
      }`}),c=new n.Mesh(o,s);return c.frustumCulled=!1,c.renderOrder=-1,{object:c,dispose(){o.dispose(),s.dispose()}}}function w({THREE:e,network:t,shared:r,quality:a}){let s=new e.Group;s.name=`volume`;let c=a.tier===`low`,l=new e.PlaneGeometry(2,2),u=new e.ShaderMaterial({transparent:!0,depthTest:!1,depthWrite:!1,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.OneFactor,blendDst:e.SrcAlphaFactor,blendSrcAlpha:e.ZeroFactor,blendDstAlpha:e.OneFactor,uniforms:{...r,uLight:{value:new e.Vector3(1,.93,.78)},uHazeC:{value:new e.Vector3(.94,.91,.84)},uSrc:{value:new e.Vector3(-75,170,-40)},uInvVP:{value:new e.Matrix4},uFloorY:{value:-1.1*45}},vertexShader:i+o+`
      uniform vec3 uSrc;
      varying vec2 vCore, vSrc; varying float vRc;
      void main() {
        vec4 c = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec4 s = projectionMatrix * modelViewMatrix * vec4(uSrc, 1.0);
        vCore = (c.xy / c.w * 0.5 + 0.5) * uRes;
        vSrc = (s.xy / max(s.w, 0.1) * 0.5 + 0.5) * uRes;
        vRc = ROUND_R * uPxK / max(c.w, 1.0);
        // inside the sphere the whole view is the lit volume: measure it from the screen centre
        // (the core may be behind the camera, where its projection means nothing)
        float inS = 1.0 - smoothstep(ROUND_R * 0.9, ROUND_R * 1.15, uCamR);
        vCore = mix(vCore, uRes * 0.5, inS);
        vRc = mix(vRc, uRes.y * 0.75, inS);
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,fragmentShader:i+`
      uniform vec3 uLight, uHazeC;
      uniform mat4 uInvVP; uniform float uFloorY;
      varying vec2 vCore, vSrc; varying float vRc;
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
      void main() {
        float k = uVolLand * (1.0 - uWarp) * uVolOn;
        if (k < 0.002) discard;
        vec2 q = (gl_FragCoord.xy - vCore) / vRc;       // network radii from the core, y up
        float d = length(q);
        // the parchment darkens toward sepia away from the network
        // (most inside the sphere, so the light of the threads and beads has something to read
        // against; outside it the paper stays a mid tan, deepening only toward the corners)
        float insideSoft = 1.0 - smoothstep(0.75, 1.15, d);
        float dim = 1.0 - k * uVolDark * (mix(0.14, 0.4, insideSoft) + 0.26 * smoothstep(1.4, 3.0, d));
        // the volume filling the sphere: smoke, lit unevenly, brightest toward the core
        float cloud = fbm(q * 2.2 + vec2(uTime * 0.012, -uTime * 0.008));
        float smoke = smoothstep(0.25, 0.8, fbm(q * 4.5 - vec2(uTime * 0.01, 3.0) + cloud));
        float inside = 1.0 - smoothstep(0.85, 1.05, d);
        float vol = exp(-d * d * 1.2) * 0.1 * (0.5 + cloud) + exp(-d * d * 7.0) * 0.1;
        float haze = inside * (0.04 + 0.14 * smoke) + exp(-d * d * 0.6) * 0.05 * smoke;
        // mist on the floor below the sphere, pooled brightest under it, dappled into patches
        // of light, never a solid band. It lies on a plane in the world (26 September: it used
        // to be painted on the screen, so it stood still while the scene turned).
        vec4 far = uInvVP * vec4(gl_FragCoord.xy / uRes * 2.0 - 1.0, 1.0, 1.0);
        vec3 dir = normalize(far.xyz / far.w - cameraPosition);
        float mist = 0.0;
        if (dir.y < -0.002 && cameraPosition.y > uFloorY) {
          float tt = (uFloorY - cameraPosition.y) / dir.y;
          vec2 f = (cameraPosition.xz + dir.xz * tt) / 45.0; // in network radii (ROUND_R) from under the core
          // (wide: from the landing the floor runs about four network radii toward the camera)
          float spread = exp(-dot(f, f) / 70.0), pool = exp(-dot(f, f) / 0.6);
          float wisp = fbm(f * 1.6 + vec2(uTime * 0.01, -uTime * 0.006));
          float dapple = smoothstep(0.35, 0.8, fbm(f * 3.2 + 3.1));
          // a shallow look along the floor gathers more mist, as a real haze does
          float graze = mix(1.0, 1.35, smoothstep(0.45, 0.06, -dir.y));
          // the floor behind the sphere fades away, so the mist lies below and before the
          // network and never veils it (as the painted version did)
          float tCore = length(cameraPosition - vec3(0.0, uFloorY, 0.0));
          float behind = 1.0 - smoothstep(tCore * 0.92, tCore * 1.25, tt);
          mist = (pool * 0.13 + spread * (0.15 + 0.42 * dapple)) * (0.45 + 1.1 * wisp) * graze * behind;
        }
        // the shaft: a fan of streaked light from above, aimed at the core
        vec2 v = gl_FragCoord.xy - vSrc, ax = normalize(vCore - vSrc);
        float along = dot(v, ax) / vRc, across = (v.x * ax.y - v.y * ax.x) / max(length(v), 1.0);
        float cone = exp(-across * across / 0.06);
        float streak = fbm(vec2(across * 26.0, uTime * 0.02)) * 0.7 + fbm(vec2(across * 70.0, 3.0 + uTime * 0.03)) * 0.3;
        streak = smoothstep(0.3, 0.75, streak);
        // measured from the core: full strength from the top of the frame down to the core,
        // fading out toward the floor
        float t = along - length(vCore - vSrc) / vRc;
        float shaft = cone * (0.25 + 1.5 * streak) * exp(-max(t + 0.2, 0.0) * 1.1) * 0.26;
        // (the floor mist takes the paler smoke light, not the warm candle light)
        vec3 light = (uLight * (vol * uVolHaze + shaft * uVolRays) + uHazeC * (haze + mist) * uVolHaze) * k;
        gl_FragColor = vec4(light, dim);
      }`}),d=new e.Mesh(l,u);d.frustumCulled=!1,d.renderOrder=-50,d.onBeforeRender=(e,t,n)=>{u.uniforms.uInvVP.value.copy(n.projectionMatrixInverse).premultiply(n.matrixWorld)},s.add(d);let f=[],p=n(5150),m=n(90210),h=t.nodes.map(()=>m());t.nodes.forEach((e,t)=>{e.kind===`junction`&&h[t]>=.1&&h[t]<.18&&f.push([...e.pos,2.4,.55,2,p()])});for(let e of t.nodes)if(e.kind===`core`)f.push([...e.pos,11,1,0,0]);else if(e.kind===`hub`)f.push([...e.pos,4.2,.28,1,p()]);else if(e.kind===`leaf`||e.kind===`soon`)f.push([...e.pos,3.4,.6,2,p()]);else{let t=p();t<.22?f.push([...e.pos,1.3,.8,3,p()]):t<.28&&f.push([...e.pos,1.1,.5,4,p()])}let g=c?60:150;for(let e=0;e<g;e++){let e=p()*Math.PI*2,t=p()*2-1,n=Math.sqrt(1-t*t),r=20+p()**.6*75;f.push([Math.cos(e)*n*r,t*r*.8,Math.sin(e)*n*r,.35+p()*.5,.35+p()*.4,5,p()])}let _=[],v=t=>{let n=new e.InstancedBufferGeometry;n.index=l.index,n.setAttribute(`position`,l.getAttribute(`position`));let r=new Float32Array(t.length*3),i=new Float32Array(t.length*4);return t.forEach(([e,t,n,a,o,s,c],l)=>{r.set([e,t,n],l*3),i.set([a,o,s,c],l*4)}),n.setAttribute(`aPos`,new e.InstancedBufferAttribute(r,3)),n.setAttribute(`aInfo`,new e.InstancedBufferAttribute(i,4)),n.instanceCount=t.length,_.push(n),n},y=new e.ShaderMaterial({transparent:!0,depthTest:!1,depthWrite:!1,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.OneFactor,blendDst:e.OneFactor,blendSrcAlpha:e.ZeroFactor,blendDstAlpha:e.OneFactor,uniforms:{...r,uCoreC:{value:new e.Vector3(1,.86,.58)},uGoldC:{value:new e.Vector3(1,.74,.36)},uPaleC:{value:new e.Vector3(.9,1,.97)},uWhiteC:{value:new e.Vector3(1,.97,.9)}},vertexShader:i+`
      attribute vec3 aPos; attribute vec4 aInfo;
      varying vec2 vQ; varying float vA, vType, vSeed;
      void main() {
        vec4 mv = modelViewMatrix * vec4(drift(aPos), 1.0);
        float z = -mv.z, type = aInfo.z;
        float a = aInfo.y * mix(0.25, 1.0, uVolLand) * uVolGlow * uVolOn * (1.0 - uWarp) * nearFade(z, 2.0, 8.0);
        a *= mix(1.0, 0.45, depthK(z) * uVolDepth);
        if (type > 4.5) a *= (0.55 + 0.45 * sin(uTime * (0.7 + aInfo.w * 1.6) + aInfo.w * 40.0)) * uVolLand;
        if (a < 0.003 || z < 0.3) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float rPx = aInfo.x * uPxK / z;
        // glints and dust keep a visible minimum size however far away
        rPx = max(rPx, (type > 4.5 ? 2.5 : type > 2.5 ? 7.0 : 10.0) * uDpr);
        float quad = min(rPx, uRes.y * 0.4);
        mv.xy += position.xy * quad * z / uPxK;
        gl_Position = projectionMatrix * mv;
        vQ = position.xy; vA = a; vType = type; vSeed = aInfo.w;
      }`,fragmentShader:i+`
      uniform vec3 uCoreC, uGoldC, uPaleC, uWhiteC;
      varying vec2 vQ; varying float vA, vType, vSeed;
      void main() {
        float d2 = dot(vQ, vQ);
        float g; vec3 c;
        if (vType < 0.5) { g = exp(-d2 * 5.0) * 0.4 + exp(-d2 * 20.0) * 0.45; c = uCoreC; }
        else if (vType < 1.5) { g = exp(-d2 * 6.0) * 0.36 + exp(-d2 * 26.0) * 0.4; c = uGoldC; }
        else if (vType < 2.5) { g = exp(-d2 * 10.0) * 0.26 + exp(-d2 * 40.0) * 0.26; c = uPaleC; }
        else if (vType < 4.5) {
          // a small star: a soft point with thin cross spikes on some
          vec2 a = abs(vQ);
          float spike = exp(-a.y * 60.0) * exp(-a.x * 3.5) + exp(-a.x * 60.0) * exp(-a.y * 3.5);
          g = exp(-d2 * 14.0) * 0.5 + exp(-d2 * 90.0) * 0.8 + spike * 0.3 * step(vSeed, 0.3) * step(3.5, vType);
          c = vType < 3.5 ? uGoldC : uWhiteC;
        } else { g = exp(-d2 * 9.0) * 0.8; c = mix(uGoldC, uWhiteC, vSeed); }
        g *= vA * smoothstep(1.0, 0.85, sqrt(d2));
        if (g < 0.002) discard;
        gl_FragColor = vec4(c * g, 0.0);
      }`}),b=new e.Mesh(v(f.filter(e=>e[5]<2.5)),y);b.frustumCulled=!1,b.renderOrder=3.5;let x=new e.Mesh(v(f.filter(e=>e[5]>2.5)),y);x.frustumCulled=!1,x.renderOrder=4.5,s.add(b,x);let S=r.uMajors.value;return t.nodes.filter(e=>e.kind===`core`||e.kind===`hub`).slice(0,S.length).forEach((e,t)=>S[t].set(...e.pos,e.kind===`core`?34:20)),{object:s,dispose(){l.dispose();for(let e of _)e.dispose();u.dispose(),y.dispose()}}}var T={junction:0,leaf:1,hub:2,core:3,soon:4},E=(1+Math.sqrt(5))/2,D=e=>e.reduce((e,t)=>e.flatMap(e=>t===0?[[...e,0]]:[[...e,t],[...e,-t]]),[[]]),O=([e,t,n])=>[[e,t,n],[t,n,e],[n,e,t]],k=([e,t,n])=>[[e,t,n],[e,n,t],[t,e,n],[t,n,e],[n,e,t],[n,t,e]];function A(e){let t=new Set,n=[];for(let r of e){let e=r.map(e=>e.toFixed(4)).join(`,`);t.has(e)||(t.add(e),n.push(r))}return n}var j=(...e)=>A(e.flatMap(e=>O(e).flatMap(D))),M=(...e)=>A(e.flatMap(e=>k(e).flatMap(D))),N=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],P=N.map(e=>e.map(e=>-e)),F={tetrahedron:[N],cube:[D([1,1,1])],octahedron:[j([1,0,0])],stella:[N,P],icosahedron:[j([0,1,E])],dodecahedron:[A([...D([1,1,1]),...j([0,1/E,E])])],cuboctahedron:[M([1,1,0])],truncatedOctahedron:[M([0,1,2])],rhombicuboctahedron:[M([1,1,1+Math.SQRT2])]};function I(e){let t=Math.hypot(...e[0]),n=e.map(e=>e.map(e=>e/t)),r=1/0;for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++)r=Math.min(r,Math.hypot(n[e][0]-n[t][0],n[e][1]-n[t][1],n[e][2]-n[t][2]));let i=[];for(let e=0;e<n.length;e++)for(let t=e+1;t<n.length;t++)Math.hypot(n[e][0]-n[t][0],n[e][1]-n[t][1],n[e][2]-n[t][2])<r*1.001&&i.push([n[e],n[t]]);return i}var L=e=>F[e].flatMap(I),R={experience:`truncatedOctahedron`,projects:`rhombicuboctahedron`,writing:`icosahedron`,capabilities:`cuboctahedron`,approach:`stella`,contact:`cube`},z=[`octahedron`,`cube`,`tetrahedron`],B={core:1.38,hub:1.1,leaf:1},V=.1,H=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],U=(e,t)=>[e[0]+t[0],e[1]+t[1],e[2]+t[2]],W=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],G=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2],K=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],q=e=>W(e,1/(Math.hypot(...e)||1));function J(e,t){let n=Math.cos(t),r=Math.sin(t);return[e[0],n*e[1]-r*e[2],r*e[1]+n*e[2]]}function Y(e,t){let n=Math.cos(t),r=Math.sin(t);return[n*e[0]-r*e[1],r*e[0]+n*e[1],e[2]]}function X(){let e={base:[],off:[],nrm:[],edge:[],center:[],info:[],spin:[],style:[]},t=[],n=0;function r(r,i,a,o){let s=[[-1,0],[1,0],[1,1],[-1,1]];for(let t=0;t<4;t++)e.base.push(...r[t]),e.off.push(...i[t]),e.nrm.push(...a),e.edge.push(...s[t]),e.center.push(...o.center),e.info.push(...o.info),e.spin.push(...o.spin),e.style.push(o.style);t.push(n,n+1,n+2,n,n+2,n+3),n+=4}function i(e,t,n,i){let a=q(H(t,e)),o=q(W(U(e,t),.5));Math.abs(G(o,a))>.9&&(o=q(K(a,[.3,1,.2]))),o=q(H(o,W(a,G(o,a))));let s=K(a,o),c=n/2,l=c*.9,u=H(e,W(a,l)),d=U(t,W(a,l)),f=[[o,s],[W(s,1),W(o,-1)],[W(o,-1),W(s,-1)],[W(s,-1),o]];for(let[e,t]of f){let n=U(W(e,c),W(t,-c)),a=U(W(e,c),W(t,c));r([u,u,d,d],[n,a,a,n],e,i)}}function a(e,t,n,i,a){let o=[[1,0],[0,1],[-1,0],[0,-1]].map(([e,n])=>[e*t/2,n*t/2]),s=(t,r)=>{let a=t/n*Math.PI*2,s=[Math.cos(a),0,Math.sin(a)],c=W(s,e),l=U(W(s,o[r][0]),[0,o[r][1],0]);return[i(c),i(l)]};for(let e=0;e<n;e++)for(let t=0;t<4;t++){let[n,i]=s(e,t),[o,c]=s(e,(t+1)%4),[l,u]=s(e+1,(t+1)%4),[d,f]=s(e+1,t),p=q(K(H(U(d,f),U(n,i)),H(U(o,c),U(n,i)))),m=G(p,U(i,c))<0?W(p,-1):p;r([n,o,l,d],[i,c,u,f],m,a)}}return{A:e,idx:t,beam:i,ring:a,count:()=>n}}function Z({THREE:r,network:a,tokens:o,shared:s,quality:c}){let l=X(),u=n(1509),f=e=>[...q([u()-.5,1.4+u(),u()-.5]),e*(u()<.5?-1:1)];a.nodes.forEach((e,t)=>{let n=T[e.kind]??0,r=null,i=0,a=1,o=.08;if(e.kind===`core`?(r=`dodecahedron`,i=0,a=B.core,o=.07):e.kind===`hub`?(r=R[e.id]||`cube`,i=1,a=B.hub,o=.06+u()*.04):e.kind===`leaf`&&(r=z[t%z.length],i=2,a=B.leaf,o=.1+u()*.05),!r)return;let s={center:e.pos,info:[e.radius,n,a,t],spin:f(o),style:i};for(let[e,t]of L(r))l.beam(e,t,V,s);if(e.kind===`core`){let e={...s,spin:[0,1,0,.06],style:3},t={...s,spin:[0,1,0,-.045],style:3};l.ring(1.3,.09,28,e=>Y(J(e,1.15),.35),e),l.ring(1.46,.075,32,e=>Y(J(e,-1.3),-.6),t)}});let p=l.A,m=new r.BufferGeometry;m.setAttribute(`position`,new r.Float32BufferAttribute(p.base,3)),m.setAttribute(`aBase`,new r.Float32BufferAttribute(p.base,3)),m.setAttribute(`aOff`,new r.Float32BufferAttribute(p.off,3)),m.setAttribute(`aNrm`,new r.Float32BufferAttribute(p.nrm,3)),m.setAttribute(`aEdge`,new r.Float32BufferAttribute(p.edge,2)),m.setAttribute(`aCenter`,new r.Float32BufferAttribute(p.center,3)),m.setAttribute(`aInfo`,new r.Float32BufferAttribute(p.info,4)),m.setAttribute(`aSpin`,new r.Float32BufferAttribute(p.spin,4)),m.setAttribute(`aStyle`,new r.Float32BufferAttribute(p.style,1)),m.setIndex(l.count()>65535?new r.Uint32BufferAttribute(l.idx,1):new r.Uint16BufferAttribute(l.idx,1));let h=e(r,o.node),g=e(r,o.panel),_=new r.ShaderMaterial({transparent:!0,depthWrite:!0,depthTest:!0,premultipliedAlpha:!0,side:r.DoubleSide,extensions:{derivatives:!0},uniforms:{...s,uInk:{value:h},uPaper:{value:g},uBrass:{value:e(r,o.hub)},uUmber:{value:e(r,o.nodeRing)},uGold:{value:e(r,o.core)},uGlass:{value:e(r,o.glass||o.node)},uGlassLit:{value:e(r,o.glassLit||o.core)},uHaze:{value:t(r,g,e(r,o.core),.15)},uFocusIdx:{value:-1}},vertexShader:i+d+`
      attribute vec3 aBase, aOff, aNrm, aCenter; attribute vec2 aEdge; attribute vec4 aInfo, aSpin; attribute float aStyle;
      uniform float uFocusIdx;
      varying vec3 vN, vLocal; varying vec2 vEdge; varying float vAlpha, vStyle, vWpx, vDk;
      mat3 turn(vec3 a, float t) {
        float c = cos(t), s = sin(t), k = 1.0 - c;
        return mat3(c + a.x * a.x * k, a.y * a.x * k + a.z * s, a.z * a.x * k - a.y * s,
                    a.x * a.y * k - a.z * s, c + a.y * a.y * k, a.z * a.y * k + a.x * s,
                    a.x * a.z * k + a.y * s, a.y * a.z * k - a.x * s, c + a.z * a.z * k);
      }
      void cull() { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; }
      void main() {
        float kind = aInfo.y;
        vec3 c = drift(aCenter);
        vec4 mvC = modelViewMatrix * vec4(c, 1.0);
        float z = -mvC.z;
        float fade = nearFade(z, 0.7 + aInfo.x * 1.2, 1.9 + aInfo.x * 2.4);
        if (z < 0.05 || fade < 0.002) { cull(); return; }
        float focus = abs(aInfo.w - uFocusIdx) < 0.5 ? 1.0 : 0.0;
        float lens;
        float rPx = nodeRadiusPx(aInfo.x, kind, z, focus, lens);
        float vis = solidVis(kind, rPx);
        if (lens > 0.995 || vis < 0.002) { cull(); return; }
        float solidPx = rPx * aInfo.z;
        float worldR = solidPx * z / uPxK;
        // struts never thinner than about 1.5 px: small solids draw a little bolder, like ink
        float thick = clamp(1.5 * uDpr / (${V.toFixed(2)} * solidPx), 1.0, 2.2);
        mat3 R = turn(normalize(aSpin.xyz), uTime * aSpin.w + aInfo.w * 1.7);
        vec3 lp = R * (aBase + aOff * thick);
        vLocal = aBase * 3.0 + aOff;
        vec4 mv = modelViewMatrix * vec4(c + lp * worldR, 1.0);
        gl_Position = projectionMatrix * mv;
        vN = normalize(mat3(modelViewMatrix) * (R * aNrm));
        vEdge = aEdge; vStyle = aStyle; vWpx = ${V.toFixed(2)} * thick * solidPx; vDk = depthK(z);
        float coc = cocPx(z) * (1.0 - uLand);
        float a = fade * (1.0 - lens) * (1.0 - fogAmt(z) * 0.95 * (1.0 - focus)) * mix(1.0, 0.45, smoothstep(6.0 * uDpr, 40.0 * uDpr, coc));
        // seen from outside, the far face is drawn lighter (as the quads do)
        a = mix(a, fade * mix(1.0, 0.62, vDk), uLand);
        vAlpha = a * vis;
      }`,fragmentShader:i+`
      uniform vec3 uInk, uPaper, uBrass, uUmber, uGold, uGlass, uGlassLit, uHaze;
      varying vec3 vN, vLocal; varying vec2 vEdge; varying float vAlpha, vStyle, vWpx, vDk;
      void main() {
        if (vAlpha < 0.003) discard;
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        // light from the upper left, where the shaft falls from
        float lit = dot(n, normalize(vec3(-0.55, 0.62, 0.56))) * 0.5 + 0.5;
        vec3 cLit, cMid, cDark;
        if (vStyle < 0.5) {        // core: verdigris wash
          cLit = mix(uGlassLit, uGlass, 0.25); cMid = mix(uGlass, uGlassLit, 0.3); cDark = mix(uGlass, uInk, 0.55);
        } else if (vStyle < 1.5) { // hub: brass and umber wash on pale wood
          cLit = mix(uPaper, uBrass, 0.3); cMid = mix(uBrass, uUmber, 0.25); cDark = mix(uUmber, uInk, 0.5);
        } else if (vStyle < 2.5) { // leaf: sepia
          cLit = mix(uPaper, uUmber, 0.2); cMid = mix(uUmber, uPaper, 0.3); cDark = mix(uInk, uUmber, 0.3);
        } else {                   // the rings: gilt
          cLit = mix(uGold, uPaper, 0.45); cMid = mix(uGold, uBrass, 0.5); cDark = mix(uUmber, uInk, 0.35);
        }
        vec3 col = lit > 0.58 ? mix(cMid, cLit, smoothstep(0.58, 0.9, lit)) : mix(cDark, cMid, smoothstep(0.18, 0.58, lit));
        // watercolour: the wash pools a little unevenly along each strut
        col *= 0.95 + 0.07 * sin(vLocal.x * 23.0 + vLocal.y * 17.0) * sin(vLocal.z * 19.0 - vLocal.x * 11.0);
        // woodcut hatching on the shadow side, only where a strut is wide enough to carry it
        vec2 fc = gl_FragCoord.xy / uDpr;
        float s = abs(fract((fc.x - fc.y) / 3.2) - 0.5);
        float hatch = (1.0 - smoothstep(0.1, 0.24, s)) * smoothstep(5.0 * uDpr, 9.0 * uDpr, vWpx) * (1.0 - smoothstep(0.32, 0.6, lit));
        col = mix(col, cDark * 0.6 + uInk * 0.4, hatch * 0.6);
        // ink outline round every face, about a pixel wide
        float wx = fwidth(vEdge.x), wy = fwidth(vEdge.y);
        float line = 1.0 - smoothstep(wx * 0.7, wx * 1.7, 1.0 - abs(vEdge.x));
        line = max(line, (1.0 - smoothstep(wy * 0.7, wy * 1.7, min(vEdge.y, 1.0 - vEdge.y))) * step(2.5, vStyle));
        // a strut only a couple of pixels wide is simply a pen line
        float pen = 1.0 - smoothstep(2.2 * uDpr, 4.5 * uDpr, vWpx);
        col = mix(col, mix(uInk, cDark, 0.25), max(line * 0.85, pen * 0.65));
        // the far face leans toward the warm air, as the rest of the drawing does
        col = mix(col, uHaze, vDk * 0.22 * uVolDepth * uVolOn * uLand);
        gl_FragColor = vec4(col * vAlpha, vAlpha);
      }`}),v=new r.Mesh(m,_);return v.frustumCulled=!1,v.renderOrder=3.5,v.name=`solids`,{object:v,uniforms:_.uniforms,dispose(){m.dispose(),_.dispose()}}}var Q=6.5;function $({THREE:e,scene:t,camera:n,renderer:i,network:a,tokens:o,quality:u}){t.background=new e.Color(o.sceneBg),t.fog=null;let d=r(e);d.uSolidLeaves={value:u.tier===`low`?0:1};let p={THREE:e,network:a,tokens:o,quality:u,shared:d},v=new e.Group;v.name=`manuscript-skin`;let y=s(p),b=c(p),S=f(p),T=Z(p),E=m(p),D=h({...p,nodes:S}),O=g(p),k=_(p),A=l(p),j=x(p),M=[y,C(p),w(p),A,j,b,S,T,E,D,O,k];for(let e of M)v.add(e.object);t.add(v),E.set([new e.Vector3(0,0,-900),new e.Vector3(0,.1,-900)],0),k.object.visible=!0,i.compile(t,n),E.reset(),k.object.visible=!1;let N=new Map(a.nodes.map((e,t)=>[e.id,t]));a.nodes.filter(e=>e.kind!==`junction`).slice(0,32).forEach((e,t)=>d.uAnchors.value[t].set(...e.pos,1));let P=0,F=new e.Vector2,I=new e.Vector3,L=new e.Vector3,R=-1,z=0,B=typeof document<`u`?document.documentElement:null,V=0;function H(e){if(!e){S.setRouteNodes(null);return}let t=new Set;a.nodes.forEach((n,r)=>{I.fromArray(n.pos);for(let n=0;n<e.length;n+=2)if(e[n].distanceToSquared(I)<1.44){t.add(r);break}}),S.setRouteNodes(t)}return{setRoute(e){E.set(e,z),e&&e.length>1&&H(e)},setFocus(e){R=e!=null&&N.has(e)?N.get(e):-1,S.uniforms.uFocusIdx.value=R,T.uniforms.uFocusIdx.value=R,S.uniforms.uFocusT.value=0,b.setFocus(R),D.setFocus(R),R>=0&&d.uAttnPos.value.fromArray(a.nodes[R].pos)},update(e,t,r){z=e;let o=!!B&&B.classList.contains(`motion-reduced`);o||(V+=t),n.updateMatrixWorld(),i.getDrawingBufferSize(F);let s=d;s.uTime.value=V,s.uRes.value.copy(F),s.uDpr.value=i.getPixelRatio(),s.uPxK.value=F.y/2/Math.tan(n.fov*Math.PI/360),s.uWarp.value=r.warp||0,s.uSpeed.value=r.speed||0;let c=n.position.length();s.uCamR.value=c;let l=Math.min(Math.max((c-58)/30,0),1);s.uLand.value=l*l*(3-2*l),s.uVolLand.value=Math.max(s.uLand.value,s.uVolIn.value);let u=Q;!r.travelling&&R>=0?u=I.fromArray(a.nodes[R].pos).distanceTo(n.position):r.glide&&(u=r.targetDist);let f=e=>o?1:1-Math.exp(-t*e);s.uFocus.value+=(u-s.uFocus.value)*f(4),s.uAperture.value+=((r.travelling?4.5:3.2)-s.uAperture.value)*f(3);let p=Math.max(s.uFocus.value-35,0);s.uFogNear.value=16+p*.9,s.uFogFar.value=80+p*1.4;let m=R>=0&&(!r.travelling||r.glide)?1:0;s.uAttnOn.value+=(m-s.uAttnOn.value)*f(m?2.2:5);let h=r.travelling||o?0:1;if(P+=(h-P)*(o?1:1-Math.exp(-t*(h?.9:5))),s.uDrift.value=P*s.uDriftAmp.value,R>=0){let e=I.fromArray(a.nodes[R].pos).distanceTo(n.position);s.uAttnR.value.set(Math.min(Math.max(5,e*.2),14),Math.min(Math.max(18,e*.6),44)),S.uniforms.uGlowK.value=1-.65*Math.min(Math.max((e-85)/55,0),1)}let g=S.uniforms;g.uFocusT.value=o?1:Math.min(1,g.uFocusT.value+t*(r.travelling?.5:1.6)),g.uRouteT.value=E.active?Math.min(1,g.uRouteT.value+t*3):Math.max(0,g.uRouteT.value-t*1.5),y.update(n),E.update(e,t,r),D.update(V,t,r,n,o),O.update(V,t,r,n,R>=0?L.fromArray(a.nodes[R].pos):null),k.update(e,t,r,n)},dispose(){t.remove(v);for(let e of M)e.dispose();t.background=null}}}export{$ as createSkin};