function e(e){let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}var t=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],n=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],r=e=>.2126*e[0]+.7152*e[1]+.0722*e[2],i=(e,n)=>t(e,[r(e),r(e),r(e)],n);function a(e,t=0){let n=e*374761393+t*668265263|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967295}function o(e){return{uTime:{value:0},uPx:{value:800},uDpr:{value:1},uFocus:{value:12},uNearK:{value:10},uFarK:{value:2},uCam:{value:new e.Vector3},uBand:{value:0},uBandW:{value:8},uBandK:{value:60}}}var s=`
uniform float uTime;
uniform float uPx;
uniform float uDpr;
uniform float uFocus;
uniform float uNearK;
uniform float uFarK;
uniform float uBand;
uniform float uBandW;
uniform float uBandK;
// Near blur measures from a capped focal distance, so a far resting focus
// (the nucleus sits 25 to 40 units out) does not turn the whole middle
// distance into soap bubbles. Only things close to the lens open up.
// From outside the brain a focus band takes over: sharp through the middle of
// the brain, soft in front of it and behind it, like reference 1.
float cocPx(float d) {
  float fn = min(uFocus, 8.0);
  float c = d < fn ? uNearK * (fn / max(d, 0.05) - 1.0) : (d > uFocus ? uFarK * (1.0 - uFocus / d) : 0.0);
  float band = uBandK * max(abs(d - uFocus) - uBandW, 0.0) / max(uFocus, 1.0);
  return max(c, band * uBand);
}
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
`,c=`float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
`,l=e=>c+e.replaceAll(`smoothstep(`,`sstep(`);function u(e,t){return new e.ShaderMaterial({...t,vertexShader:l(t.vertexShader),fragmentShader:l(t.fragmentShader)})}function d(e,t){return{value:new e.Vector3(t[0],t[1],t[2])}}var f=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`,p=`
varying vec2 vUv;
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
void main() {
  float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415926;
  vec3 d = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
  vec3 q = vec3(fbm(d * 1.4 + 3.0), fbm(d * 1.4 + 11.0), fbm(d * 1.4 + 23.0));
  float clouds = fbm(d * 1.8 + q * 1.6);
  float wisps = fbm(d * 4.2 + q * 2.4 + 40.0);
  float lanes = fbm(d * 3.1 - q * 1.2 + 70.0);
  gl_FragColor = vec4(clouds, wisps, lanes, 1.0);
}
`;function m({THREE:r,renderer:i,tokens:a,shared:o,quality:s,camera:c}){let l=s.tier===`low`?512:1024,m=l/2,h=new r.WebGLRenderTarget(l,m,{depthBuffer:!1,generateMipmaps:!1,minFilter:r.LinearFilter,magFilter:r.LinearFilter});h.texture.wrapS=r.RepeatWrapping;let g=new r.Scene,_=new r.PlaneGeometry(2,2),v=u(r,{vertexShader:f,fragmentShader:p,depthTest:!1,depthWrite:!1}),y=new r.Mesh(_,v);y.frustumCulled=!1,g.add(y);let b=new r.OrthographicCamera(-1,1,1,-1,0,1),x=i.getRenderTarget();i.setRenderTarget(h),i.render(g,b),i.setRenderTarget(x),_.dispose(),v.dispose();let S=e(a.sceneBg),C=n(e(a.edge),.3),w=n(t(e(a.core),e(a.neon[0]),.4),.16),T=n(e(a.routeGlow),.07),E=u(r,{uniforms:{uTime:o.uTime,uTex:{value:h.texture},uBg:d(r,S),uNavy:d(r,C),uViolet:d(r,w),uWarm:d(r,T),uRes:{value:new r.Vector2(1,1)},uWarp:{value:0},uFwd:{value:new r.Vector3(0,0,-1)},uHot:d(r,n(t(e(a.route),e(a.routeGlow),.5),.5))},vertexShader:`
      varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }
    `,fragmentShader:`
      uniform float uTime; uniform sampler2D uTex; uniform vec3 uBg, uNavy, uViolet, uWarm, uHot, uFwd; uniform vec2 uRes; uniform float uWarp;
      varying vec3 vDir;
      vec2 eq(vec3 d) { return vec2(atan(d.x, d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415926 + 0.5); }
      vec3 rotY(vec3 d, float a) { float c = cos(a), s = sin(a); return vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z); }
      void main() {
        vec3 d = normalize(vDir);
        vec4 a = texture2D(uTex, eq(rotY(d, uTime * 0.004)));
        vec4 b = texture2D(uTex, eq(rotY(d.zyx * vec3(1.0, 1.0, -1.0), -uTime * 0.006 + 1.3)));
        float cloud = smoothstep(0.38, 0.78, a.r) * (0.55 + 0.45 * b.g);
        float glow = pow(smoothstep(0.45, 0.85, a.r * 0.6 + b.r * 0.4), 2.0);
        float vio = smoothstep(0.5, 0.8, b.r) * smoothstep(0.35, 0.7, a.g);
        float lane = smoothstep(0.52, 0.75, a.b);
        vec3 c = uBg + uNavy * cloud + uNavy * glow * 0.8 + uViolet * vio + uWarm * glow * smoothstep(0.6, 0.9, b.b);
        c *= 1.0 - 0.45 * lane;
        // soft vignette so the frame edges fall to the ground colour
        vec2 s = gl_FragCoord.xy / uRes - 0.5;
        c = mix(uBg, c, 1.0 - 0.7 * smoothstep(0.25, 0.75, length(s * vec2(1.0, 1.2))));
        // warp: the vanishing point warms, as if the streaks pour out of it
        float vp = max(dot(d, uFwd), 0.0);
        c += uHot * uWarp * (pow(vp, 24.0) * 0.8 + pow(vp, 5.0) * 0.18);
        // tiny dither against banding in the dark gradients
        c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,side:r.BackSide,depthWrite:!1,depthTest:!1}),D=new r.SphereGeometry(400,48,24),O=new r.Mesh(D,E);return O.frustumCulled=!1,O.renderOrder=-100,{object:O,update(e,t){O.position.copy(e.position),E.uniforms.uRes.value.copy(t),E.uniforms.uWarp.value=e.warp||0,c.getWorldDirection(E.uniforms.uFwd.value)},dispose(){D.dispose(),E.dispose(),h.dispose()}}}function h({THREE:n,network:r,tokens:i,shared:o}){let c=r.edges.length,l=new n.InstancedBufferGeometry;l.setAttribute(`position`,new n.BufferAttribute(new Float32Array([0,-1,0,1,-1,0,1,1,0,0,1,0]),3)),l.setIndex([0,1,2,0,2,3]);let d=new Float32Array(c*3),f=new Float32Array(c*3),p=new Float32Array(c*3),m=new Float32Array(c*3),h=e(i.edge),g=e(i.nodeRing),_=e(i.node),v=e(i.hub),y=e(i.neon[0]),b=t(h,_,.35),x=t(h,g,.55),S=t(g,y,.35),C=(n,o)=>{let s=r.nodes[n];return s.kind===`hub`||s.kind===`leaf`||s.kind===`core`?s.kind===`core`?t(e(i.core),b,.3):t(v,b,.35):a(n,7+o)<.12?S:t(b,x,a(n,3))},w=e=>{let t=r.nodes[e];return t.kind===`junction`?t.radius*(.85+.45*a(e,2)):t.radius},T=new Float32Array(c*2);r.edges.forEach(([e,t],n)=>{d.set(r.nodes[e].pos,n*3),f.set(r.nodes[t].pos,n*3),p.set(C(e,0),n*3),m.set(C(t,0),n*3),T[n*2]=w(e),T[n*2+1]=w(t)}),l.setAttribute(`aR`,new n.InstancedBufferAttribute(T,2)),l.setAttribute(`aA`,new n.InstancedBufferAttribute(d,3)),l.setAttribute(`aB`,new n.InstancedBufferAttribute(f,3)),l.setAttribute(`aCA`,new n.InstancedBufferAttribute(p,3)),l.setAttribute(`aCB`,new n.InstancedBufferAttribute(m,3)),l.instanceCount=c;let E=u(n,{uniforms:{...o,uGain:{value:1}},vertexShader:s+`
      attribute vec3 aA, aB, aCA, aCB; attribute vec2 aR;
      uniform float uGain; uniform vec3 uAttnPos; uniform float uAttnAmt; uniform float uAttnR0; uniform float uAttnD;
      varying vec3 vCol; varying float vAcross; varying float vI; varying float vAlong; varying float vLen; varying vec2 vR;
      void main() {
        vLen = length(aB - aA); vAlong = position.x * vLen; vR = aR;
        vec3 P = mix(aA, aB, position.x);
        vec3 T = aB - aA;
        vec3 toCam = cameraPosition - P;
        float d = length(toCam);
        vec3 S = cross(T, toCam);
        S = length(S) < 1e-5 ? vec3(1.0, 0.0, 0.0) : normalize(S);
        float ppu = uPx / max(d, 0.02);
        // half width, px, capped so a wire running past the lens stays a line, not a beam
        float core = min(max(0.012 * ppu, 0.75 * uDpr), 2.6 * uDpr);
        float coc = clamp(cocPx(d), 0.0, 14.0 * uDpr);
        float sigma = core + coc * 0.22;   // near wires stay crisp enough to read
        float halfPx = sigma * 2.2 + 0.5 * uDpr;
        P += S * position.y * halfPx / ppu;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        vCol = mix(aCA, aCB, position.x);
        vAcross = position.y * halfPx / sigma;
        // energy spreads as the strip blurs; fade near the lens and into the distance
        float energy = min(core / sigma, 1.0);
        // at rest a wire running past the lens fades out well before it reaches it (the approach
        // wire would otherwise read as a beam); while riding the route mesh carries the wire
        float nearF = mix(smoothstep(0.6, 4.5, d), smoothstep(2.5, 9.0, d), uAttnAmt);
        float farF = exp(-max(d - 10.0, 0.0) / 19.0);
        // at rest the resting node's own neighbourhood stays lit however far it sits
        float fdist = distance(P, uAttnPos);
        float hood = smoothstep(uAttnR0 + 6.0, uAttnR0 * 0.6, fdist);
        farF = mix(farF, max(farF, 0.8), uAttnAmt * hood);
        vI = uGain * energy * nearF * farF * (0.25 + 0.75 * min(1.0, 1.4 * uDpr / core));
        // at rest, wiring far from the resting node and far from the lens goes quiet
        vI *= mix(1.4, 1.0, smoothstep(5.0, 14.0, d));
        // at rest a wire pointing almost straight at the lens foreshortens into a bright beam: dim it
        float align = abs(dot(normalize(T), toCam / max(d, 1e-4)));
        vI *= 1.0 - uAttnAmt * 0.85 * smoothstep(0.82, 0.97, align);   // near wires carry the structure: at least 3:1
        vI *= 1.0 - uAttnAmt * (1.0 - mix(0.3, 1.0, smoothstep(uAttnR0 + 14.0, uAttnR0, fdist)) * mix(1.0, exp(-max(d - uAttnD, 0.0) / 9.0), 0.85 * (1.0 - hood))) * smoothstep(12.0, 20.0, d);
      }
    `,fragmentShader:`
      varying vec3 vCol; varying float vAcross; varying float vI; varying float vAlong; varying float vLen; varying vec2 vR;
      void main() {
        float p = exp(-vAcross * vAcross * 1.6);
        // the wire dims as it enters the glass, so beads are not skewered to their centre
        p *= mix(0.22, 1.0, smoothstep(vR.x * 0.75, vR.x * 1.05, vAlong) * smoothstep(vR.y * 0.75, vR.y * 1.05, vLen - vAlong));
        gl_FragColor = vec4(vCol * p * vI, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),D=new n.Mesh(l,E);return D.frustumCulled=!1,D.renderOrder=10,{object:D,material:E,dispose(){l.dispose(),E.dispose()}}}var g=s+`
attribute vec3 aPos; attribute float aRad; attribute vec3 aCol; attribute float aSeed; attribute float aRouteS; attribute float aId; attribute float aRing;
uniform vec3 uAttnPos; uniform float uAttnAmt; uniform float uAttnR0; uniform float uAttnD;
uniform float uPulseS; uniform float uRouteA; uniform float uFocusId; uniform float uFocusAmt; uniform float uGlowPad; uniform float uFlare;
varying vec2 vQ; varying float vR; varying float vCoc; varying vec3 vCol; varying float vA; varying float vLit; varying float vFocus; varying float vSeed; varying vec3 vRingN; varying float vRing;
void main() {
  vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
  float d = -mv.z;
  if (d < 0.04) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float ppu = uPx / d;
  float rpx = aRad * ppu;
  float coc = clamp(cocPx(d), 0.0, 70.0 * uDpr);
  float focus = aId == uFocusId ? uFocusAmt : 0.0;
  coc *= 1.0 - focus;                            // the resting node always reads sharp
  float lit = (aRouteS >= 0.0 && uPulseS >= aRouteS) ? uRouteA : 0.0;
  float pad = uGlowPad + focus * 1.2 + lit * 1.6;
  float halfPx = max(rpx * pad, rpx + coc) + 2.5 * uDpr;
  mv.xy += position.xy * halfPx / ppu;
  gl_Position = projectionMatrix * mv;
  vQ = position.xy * halfPx; vR = rpx; vCoc = coc; vCol = aCol; vSeed = aSeed; vLit = lit; vFocus = focus; vRing = aRing;
  // fade before the lens clips the bead, and let depth swallow the far field
#ifdef CONTENT
  // the camera arcs round content nodes on the way; their glass clears out of the lens early
  float nearF = smoothstep(aRad * 1.5 + 0.6, aRad * 3.2 + 1.5, d);
#else
  float nearF = smoothstep(aRad * 1.1 + 0.25, aRad * 2.6 + 1.1, d);
#endif
  float farF = max(exp(-max(d - 18.0, 0.0) / 24.0), 0.07);
  float fdist = distance(aPos, uAttnPos);
  float hood = smoothstep(uAttnR0 + 6.0, uAttnR0 * 0.6, fdist);
  farF = mix(farF, max(farF, 0.85), uAttnAmt * hood);
  vA = nearF * farF;
#ifndef CONTENT
  // at rest, glass far from the resting node and far from the lens goes quiet
  vA *= 1.0 - uAttnAmt * (1.0 - mix(0.22, 1.0, smoothstep(uAttnR0 + 14.0, uAttnR0, fdist)) * mix(1.0, exp(-max(d - uAttnD, 0.0) / 9.0), 0.85 * (1.0 - hood))) * smoothstep(12.0, 20.0, d);
#endif
  if (vA < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);   // faded beads cost no fill
  // ring plane: a slow precession around a tilted axis, in view space
  float t = uTime * (0.05 + 0.04 * aSeed) + aSeed * 6.2831;
  float tilt = 0.35 + 0.3 * aSeed;
  vec3 nW = normalize(vec3(sin(tilt) * sin(t), cos(tilt), sin(tilt) * cos(t)));
  vRingN = normalize(mat3(viewMatrix) * nW);
}
`,_=`
uniform float uTime; uniform float uDpr; uniform vec3 uRoute; uniform vec3 uRouteHot; uniform vec3 uBrass; uniform float uBody; uniform float uBokehK;
varying vec2 vQ; varying float vR; varying float vCoc; varying vec3 vCol; varying float vA; varying float vLit; varying float vFocus; varying float vSeed; varying vec3 vRingN; varying float vRing;
void main() {
  float r = max(vR, 0.6 * uDpr);
  float dist = length(vQ);
  float rho = dist / r;
  vec3 col = mix(vCol, uRoute, vLit * 0.8);
  // sharp glass bead
  vec3 bead = vec3(0.0);
  if (rho < 1.0) {
    vec2 n2 = vQ / r; float nz = sqrt(max(1.0 - dot(n2, n2), 0.0));
    vec3 n = vec3(n2, nz);
    vec3 L = normalize(vec3(-0.5, 0.62, 0.62));
    // clear glass: thin bright rim, dark heart, light focused into a crescent opposite the light
    float fres = pow(1.0 - nz, 3.0);
    float rimLine = exp(-pow((rho - 0.93) * 11.0, 2.0));
    float away = smoothstep(-0.1, 0.8, dot(normalize(n2 + 1e-4), -normalize(L.xy)));
    float crescent = exp(-pow((rho - 0.68) * 5.5, 2.0)) * away;
    float spec = pow(max(dot(n, L), 0.0), 70.0);
    float sheen = pow(max(dot(n, L), 0.0), 6.0) * 0.18;
    float aa = smoothstep(1.0, 1.0 - min(1.5 * uDpr / r, 0.5), rho);
#ifdef CONTENT
    bead = (col * (uBody * (0.5 + 0.5 * nz) + 1.05 * fres + 0.5 * rimLine + 0.62 * crescent + sheen * 0.5) + vec3(1.0) * spec * 0.8) * aa;
#else
    bead = (col * (uBody * (0.6 + 0.4 * nz) + 1.3 * fres + 0.55 * rimLine + 1.05 * crescent + sheen) + vec3(1.0) * spec * 0.9) * aa;
#endif
  }
  // soft halo around the glass; the focus node and route-lit beads get more
  float haloK = 0.10 + vFocus * 0.22 + vLit * 0.16;
  vec3 halo = col * haloK * exp(-max(rho - 1.0, 0.0) * (3.2 - vFocus * 1.2 - vLit * 1.0)) * smoothstep(1.0 - min(1.5 * uDpr / r, 0.5), 1.0, rho);
  // four-point star flare on lit beads (ref 7), very fine
  float spike = vLit * (exp(-abs(vQ.y) / (0.9 * uDpr)) * exp(-abs(vQ.x) / (r * 3.5)) + exp(-abs(vQ.x) / (0.9 * uDpr)) * exp(-abs(vQ.y) / (r * 3.5)));
  vec3 sharp = bead * (1.0 - 0.22 * vLit) + halo + uRouteHot * spike * 0.3;
  // bokeh: a flat disc with a brighter rim, energy spread over its area
  float R2 = r + vCoc;
  float soft = 1.0 + vCoc * 0.12;
  float disc = smoothstep(R2, R2 - soft, dist);
  float rim = 0.8 + 0.45 * smoothstep(R2 * 0.55, R2, dist);
  float energy = (r * r * 0.9 + 1.0) / (R2 * R2 + 1.0);
  vec3 bokeh = col * disc * rim * energy * uBokehK;
  float m = clamp(vCoc / (r * 0.4 + 1.5), 0.0, 1.0);
  vec3 c = mix(sharp, bokeh, m);
  // far beads collapse to star points that breathe very slightly
  float star = 1.0 - smoothstep(0.8 * uDpr, 2.2 * uDpr, vR);
  float tw = 0.85 + 0.15 * sin(uTime * (1.3 + vSeed * 2.0) + vSeed * 40.0);
  c = mix(c, col * exp(-dist * dist / (1.1 * uDpr * uDpr)) * (0.55 + 0.9 * vR / uDpr) * tw, star);
#ifdef CONTENT
  // orrery ring: a tilted circle at 1.55 r, its far half hidden behind the glass
  if (vRing > 0.0) {
    vec3 m3 = vRingN;
    vec2 w = length(m3.xy) > 1e-4 ? normalize(m3.xy) : vec2(0.0, 1.0);
    vec2 u = vec2(-w.y, w.x);
    float Rr = r * 1.55;
    float mz = max(abs(m3.z), 0.12);
    float xr = dot(vQ, u) / Rr, yr = dot(vQ, w) / (Rr * mz);
    float f = length(vec2(xr, yr)) - 1.0;
    float fw = max(fwidth(f), 1e-4);
    float ringMask = 1.0 - smoothstep(fw * 0.4, fw * (1.6 + 0.6 * uDpr), abs(f));
    vec3 W3 = cross(m3, vec3(u, 0.0));
    float front = dot(vQ, W3.xy) * W3.z;
    float hidden = (rho < 1.0 && front < 0.0) ? 0.15 : 1.0;
    c += uBrass * ringMask * hidden * vRing * (0.55 + vFocus * 0.5 + vLit * 0.3) * (1.0 - m);
  }
#endif
  gl_FragColor = vec4(c * vA, 1.0);
}
`;function v({THREE:n,network:r,tokens:i,shared:o}){let s=e(i.node),c=e(i.nodeRing),l=e(i.neon[0]),f=e(i.neon[1]),p=e(i.hub),m=e(i.route),h=e(i.soon),v=[],y=[];r.nodes.forEach((e,t)=>{e.kind===`junction`?v.push(t):e.kind!==`core`&&y.push(t)});function b(e){let n=r.nodes[e],i=a(e,11);return n.kind===`hub`?p:n.kind===`leaf`?t(p,m,.3):n.kind===`soon`?t(h,s,.25):i<.16?t(c,l,.55):i>.94?t(s,f,.35):t(s,c,a(e,5)*.8)}function x(e,i){let s=new n.InstancedBufferGeometry;s.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),s.setIndex([0,1,2,0,2,3]);let c=e.length,l=new Float32Array(c*3),f=new Float32Array(c),h=new Float32Array(c*3),v=new Float32Array(c),y=new Float32Array(c).fill(-1),x=new Float32Array(c),S=new Float32Array(c);e.forEach((e,t)=>{let n=r.nodes[e];l.set(n.pos,t*3),f[t]=i?n.radius:n.radius*(.85+.45*a(e,2)),h.set(b(e),t*3),v[t]=a(e,9),x[t]=e,S[t]=n.kind===`hub`?1:n.kind===`leaf`?.6:0}),s.setAttribute(`aPos`,new n.InstancedBufferAttribute(l,3)),s.setAttribute(`aRad`,new n.InstancedBufferAttribute(f,1)),s.setAttribute(`aCol`,new n.InstancedBufferAttribute(h,3)),s.setAttribute(`aSeed`,new n.InstancedBufferAttribute(v,1)),s.setAttribute(`aRouteS`,new n.InstancedBufferAttribute(y,1)),s.setAttribute(`aId`,new n.InstancedBufferAttribute(x,1)),s.setAttribute(`aRing`,new n.InstancedBufferAttribute(S,1)),s.instanceCount=c;let C=u(n,{defines:i?{CONTENT:1}:{},uniforms:{...o,uPulseS:o.uPulseS,uRouteA:o.uRouteA,uFocusId:o.uFocusId,uFocusAmt:o.uFocusAmt,uFlare:{value:0},uGlowPad:{value:i?2.6:1.8},uBody:{value:i?.16:.12},uBokehK:{value:i?.7:1.4},uRoute:d(n,m),uRouteHot:d(n,t(m,[1,1,1],.5)),uBrass:d(n,t(p,[1,1,1],.1))},vertexShader:g,fragmentShader:_,transparent:!0,depthWrite:!1,depthTest:!1,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),w=new n.Mesh(s,C);return w.frustumCulled=!1,w.renderOrder=i?30:20,{mesh:w,g:s,mat:C,list:e,RS:y}}let S=x(v,!1),C=x(y,!0);return{objects:[S.mesh,C.mesh],setRouteS(e){for(let t of[S,C])t.list.forEach((n,r)=>{t.RS[r]=e?e[n]:-1}),t.g.getAttribute(`aRouteS`).needsUpdate=!0},dispose(){for(let e of[S,C])e.g.dispose(),e.mat.dispose()}}}function y({THREE:r,network:a,tokens:o,shared:c}){let l=a.nodes.findIndex(e=>e.kind===`core`),f=a.nodes[Math.max(l,0)],p=e(o.core),m=i(t(e(o.neon[1]),e(o.hub),.52),.12),h=n(t(p,e(o.panel),.55),.55),g=e(o.hub),_=new r.PlaneGeometry(2,2),v=u(r,{uniforms:{...c,uCenter:{value:new r.Vector3(...f.pos)},uRad:{value:f.radius},uViolet:d(r,p),uSage:d(r,m),uDeep:d(r,h),uBrass:d(r,g),uLift:{value:0},uRouteA:c.uRouteA},vertexShader:s+`
      uniform vec3 uCenter; uniform float uRad; uniform float uLift;
      varying vec2 vQ; varying float vR; varying float vA; varying float vCoc; varying vec3 vN1; varying vec3 vN2; varying mat3 vRot;
      void main() {
        vec4 mv = viewMatrix * vec4(uCenter, 1.0);
        float d = -mv.z;
        if (d < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float ppu = uPx / d;
        float rpx = uRad * ppu;
        float coc = clamp(cocPx(d), 0.0, 40.0 * uDpr) * (1.0 - uLift);
        float halfPx = max(rpx * (2.4 + uLift * 0.6), rpx + coc) + 2.0;
        mv.xy += position.xy * halfPx / ppu;
        gl_Position = projectionMatrix * mv;
        vQ = position.xy * halfPx; vR = rpx; vCoc = coc;
        // leave the nucleus cleanly: it fades as the camera nears its surface
        vA = sstep(uRad * 1.05, uRad * 2.4, d);
        if (vA < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        float t = uTime * 0.07;
        vN1 = normalize(mat3(viewMatrix) * normalize(vec3(sin(0.42) * sin(t), cos(0.42), sin(0.42) * cos(t))));
        vN2 = normalize(mat3(viewMatrix) * normalize(vec3(sin(1.1) * sin(-t * 0.7 + 2.0), cos(1.1), sin(1.1) * cos(-t * 0.7 + 2.0))));
        vRot = mat3(viewMatrix);
      }
    `,fragmentShader:`
      uniform float uTime; uniform float uDpr; uniform vec3 uViolet, uSage, uDeep, uBrass; uniform float uLift; uniform float uRouteA;
      varying vec2 vQ; varying float vR; varying float vA; varying float vCoc; varying vec3 vN1; varying vec3 vN2; varying mat3 vRot;
      float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float ring(vec2 q, vec3 m3, float Rr, float r, float rho, float th) {
        vec2 w = length(m3.xy) > 1e-4 ? normalize(m3.xy) : vec2(0.0, 1.0);
        vec2 u = vec2(-w.y, w.x);
        float mz = max(abs(m3.z), 0.05);
        float f = length(vec2(dot(q, u) / Rr, dot(q, w) / (Rr * mz))) - 1.0;
        float fw = max(fwidth(f), 1e-4);
        float mask = 1.0 - smoothstep(0.0, fw * th, abs(f));
        vec3 W3 = cross(m3, vec3(u, 0.0));
        float front = dot(q, W3.xy) * W3.z;
        return mask * ((rho < 1.0 && front < 0.0) ? 0.12 : 1.0);
      }
      void main() {
        float r = max(vR, 1.0);
        float dist = length(vQ), rho = dist / r;
        vec3 c = vec3(0.0); float a = 0.0;
        if (rho < 1.0) {
          vec2 n2 = vQ / r; float nz = sqrt(max(1.0 - dot(n2, n2), 0.0));
          vec3 n = vec3(n2, nz);
          vec3 L = normalize(vec3(-0.5, 0.6, 0.62));
          float fres = pow(1.0 - nz, 2.6);
          float rimLine = exp(-pow((rho - 0.95) * 14.0, 2.0));
          // inner haze: slow noise on a turning inner sphere, refraction faked by shrinking
          vec3 p = transpose(vRot) * vec3(n2 * 0.85, nz * 0.85);
          float tt = uTime * 0.08;
          float w = vn(p * 2.2 + vec3(tt, -tt * 0.7, tt * 0.4)) * 0.65 + vn(p * 4.7 - vec3(tt * 1.3, 0.0, tt)) * 0.35;
          float haze = smoothstep(0.35, 0.85, w) * smoothstep(1.0, 0.25, rho);
          // the nucleus: a small sage sun at the centre, breathing slowly
          float breath = 0.92 + 0.08 * sin(uTime * 0.9);
          float kr = rho / (0.3 * breath);
          float heart = exp(-kr * kr * 1.6);
          float heartGlow = exp(-rho * 3.2) * 0.55;
          float spec = pow(max(dot(n, L), 0.0), 90.0);
          float window = smoothstep(0.1, 0.0, length(n2 - vec2(-0.42, 0.46)) - 0.12) * 0.35;
          float away = smoothstep(-0.1, 0.8, dot(normalize(n2 + 1e-4), -normalize(L.xy)));
          float crescent = exp(-pow((rho - 0.74) * 6.0, 2.0)) * away;
          c = uDeep * (0.35 + 0.35 * nz)
            + uViolet * (fres * 1.5 + rimLine * 0.5 + crescent * 0.55 + haze * 0.22)
            + uSage * (heart * (0.62 + uLift * 0.18) + heartGlow * (0.5 + uLift * 0.25) + haze * 0.3)
            + vec3(1.0) * pow(heart, 6.0) * 0.25
            + vec3(1.0) * (spec * 0.9 + window);
          float aa = smoothstep(1.0, 1.0 - min(1.5 * uDpr / r, 0.3), rho);
          a = 0.82 * aa;
          c *= aa;
        }
        // halo: violet breath around the shell
        float halo = exp(-max(rho - 1.0, 0.0) * (2.4 - uLift * 0.9)) * smoothstep(1.0 - min(1.5 * uDpr / r, 0.3), 1.0, rho) * (0.26 + uLift * 0.3 + uRouteA * 0.08);
        c += uViolet * halo;
        // two brass orrery rings
        float th = 1.3 + 0.6 * uDpr;
        float rg = ring(vQ, vN1, r * 1.5, r, rho, th) * 0.75 + ring(vQ, vN2, r * 1.78, r, rho, th) * 0.45;
        c += uBrass * rg * (0.55 + uLift * 0.35);
        a = max(a, 0.0);
        // defocused: collapse to a soft disc
        float m = clamp(vCoc / (r * 0.6 + 2.0), 0.0, 1.0);
        float R2 = r + vCoc;
        vec3 bok = mix(uViolet, uSage, 0.4) * smoothstep(R2, R2 - 1.0 - vCoc * 0.15, dist) * 0.9 * (r * r) / (R2 * R2);
        c = mix(c, bok, m); a = mix(a, 0.0, m);
        // premultiplied output: rgb adds, alpha dims what is behind the glass body
        gl_FragColor = vec4(c * vA, a * vA);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,blending:r.CustomBlending,blendSrc:r.OneFactor,blendDst:r.OneMinusSrcAlphaFactor,blendEquation:r.AddEquation}),y=new r.Mesh(_,v);return y.frustumCulled=!1,y.renderOrder=15,{object:y,id:f.id,setLift(e){v.uniforms.uLift.value=e},dispose(){_.dispose(),v.dispose()}}}function b({THREE:n,network:r,tokens:i,shared:o}){let c=e(i.route),l=e(i.routeGlow),f=t(c,[1,1,1],.62),p=u(n,{uniforms:{...o,uCamS:{value:0},uPulseS:o.uPulseS,uAlpha:o.uRouteA,uLen:{value:1},uCoreR:{value:.034},uHalo:{value:7.5},uBeadS:{value:new Float32Array(32)},uBeadR:{value:new Float32Array(32)},uBeadN:{value:0},uHot:d(n,f),uAmber:d(n,c),uGlow:d(n,l)},vertexShader:s+`
      attribute vec3 aTan; attribute float aSide; attribute float aS;
      uniform float uCoreR; uniform float uHalo;
      uniform float uBeadS[32]; uniform float uBeadR[32]; uniform int uBeadN;
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide; varying float vIn;
      void main() {
        vec3 P = position;
        vec3 toCam = cameraPosition - P;
        float d = length(toCam);
        vec3 N = cross(aTan, toCam);
        N = length(N) < 1e-5 ? vec3(0.0, 1.0, 0.0) : normalize(N);
        float ppu = uPx / max(d, 0.02);
        // Near the lens the route stays a bright wire leading ahead: the core
        // stops widening at a few pixels, blur adds little, and the glow is
        // capped, so the drop onto the route never turns into a floodlight.
        float coreW = clamp(uCoreR * ppu, 1.5 * uDpr, 5.5 * uDpr);
        float coc = clamp(cocPx(d), 0.0, 90.0 * uDpr);
        float soft = coreW + min(coc * 0.3, 5.0 * uDpr);
        float halfPx = min(soft * uHalo + 3.0 * uDpr, 58.0 * uDpr);
        P += N * aSide * halfPx / ppu;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        soft = min(soft, halfPx);
        vAcross = aSide * halfPx / soft;
        vS = aS;
        vSoft = min(coreW / soft, 1.0);
        vSide = aSide;
        vE = mix(0.55, 1.0, vSoft) * mix(0.55, 1.0, smoothstep(0.5, 3.5, d));
        // inside a bead the wire dims, so the glass keeps its own colour
        float inBead = 0.0;
        for (int i = 0; i < 32; i++) {
          if (i >= uBeadN) break;
          inBead = max(inBead, 1.0 - smoothstep(uBeadR[i] * 0.7, uBeadR[i] * 1.05, abs(aS - uBeadS[i])));
        }
        vIn = inBead;
      }
    `,fragmentShader:`
      uniform float uTime; uniform float uCamS; uniform float uPulseS; uniform float uAlpha; uniform float uLen;
      uniform vec3 uHot, uAmber, uGlow;
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide; varying float vIn;
      void main() {
        float x = abs(vAcross);
        float core = (1.0 - smoothstep(0.35, 1.0, x)) * (1.0 - 0.75 * vIn);
        float body = exp(-x * x * 0.7) * (1.0 - 0.5 * vIn);
        float halo = exp(-x * 0.62) * (1.0 - 0.6 * vIn);
        float charged = mix(0.42, 1.0, smoothstep(uPulseS + 0.6, uPulseS - 0.6, vS));
        float pulse = exp(-pow((vS - uPulseS) / 1.1, 2.0));
        float flow = 0.86 + 0.14 * sin(vS * 1.7 - uTime * 16.0);
        float trail = mix(0.6, 1.0, smoothstep(uCamS - 4.0, uCamS - 0.5, vS));
        float ends = smoothstep(0.0, 0.8, vS) * smoothstep(uLen, uLen - 0.4, vS);
        vec3 c = uHot * core * (1.0 + pulse * 1.4) * vSoft + uAmber * body * 0.95 + uGlow * halo * 0.34 + uHot * pulse * body * 0.8;
        c *= 1.0 - smoothstep(0.72, 1.0, abs(vSide));   // soft outer edge when the width cap bites
        c *= vE * charged * flow * trail * mix(0.3, 1.0, ends) * uAlpha;
        gl_FragColor = vec4(c, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),m=null,h=null,g=null,_=null,v=0,y=0,b=!1,x=0,S=0,C=new n.Group;C.renderOrder=40;function w(){m&&(C.remove(m),h.dispose(),m=null,h=null)}function T(e){if(w(),b=!1,!e||e.length<2)return g=null,v=0,null;let t=e.length;g=e,_=new Float32Array(t);for(let n=1;n<t;n++)_[n]=_[n-1]+e[n].distanceTo(e[n-1]);v=_[t-1];let i=new Float32Array(t*6),s=new Float32Array(t*6),c=new Float32Array(t*2),l=new Float32Array(t*2),u=new n.Vector3;for(let n=0;n<t;n++){u.subVectors(e[Math.min(n+1,t-1)],e[Math.max(n-1,0)]).normalize();for(let t=0;t<2;t++){let r=n*2+t;i[r*3]=e[n].x,i[r*3+1]=e[n].y,i[r*3+2]=e[n].z,s[r*3]=u.x,s[r*3+1]=u.y,s[r*3+2]=u.z,c[r]=t?1:-1,l[r]=_[n]}}let d=[];for(let e=0;e<t-1;e++){let t=e*2;d.push(t,t+1,t+3,t,t+3,t+2)}h=new n.BufferGeometry,h.setAttribute(`position`,new n.BufferAttribute(i,3)),h.setAttribute(`aTan`,new n.BufferAttribute(s,3)),h.setAttribute(`aSide`,new n.BufferAttribute(c,1)),h.setAttribute(`aS`,new n.BufferAttribute(l,1)),h.setIndex(d),m=new n.Mesh(h,p),m.frustumCulled=!1,m.renderOrder=40,C.add(m),p.uniforms.uLen.value=v,y=0,S=0,x=1,o.uRouteA.value=1,o.uPulseS.value=0;let f=new Float32Array(r.nodes.length).fill(-1),T=new n.Box3().setFromPoints(e).expandByScalar(1.4);r.nodes.forEach((n,r)=>{let[i,a,o]=n.pos;if(i<T.min.x||a<T.min.y||o<T.min.z||i>T.max.x||a>T.max.y||o>T.max.z)return;let s=1/0,c=0;for(let n=0;n<t;n++){let t=e[n],r=(t.x-i)**2+(t.y-a)**2+(t.z-o)**2;r<s&&(s=r,c=_[n])}s<1.5625&&(f[r]=c)});let E=[];f.forEach((e,t)=>{if(e>=0){let n=r.nodes[t];E.push([e,n.kind===`junction`?n.radius*(.85+.45*a(t,2)):n.radius])}}),E.sort((e,t)=>e[0]-t[0]);let D=p.uniforms.uBeadS.value,O=p.uniforms.uBeadR.value;return E.slice(0,32).forEach(([e,t],n)=>{D[n]=e,O[n]=t}),p.uniforms.uBeadN.value=Math.min(E.length,32),f}function E(){m&&!b&&(b=!0)}function D(e,t){if(!m)return null;if(S+=e,b&&(x=Math.max(0,x-e/.7),o.uRouteA.value=x,x<=0))return w(),g=null,null;let n=1/0,r=0;for(let e=0;e<g.length;e++){let i=g[e].distanceToSquared(t.position);i<n&&(n=i,r=e)}n<6.25&&(y=Math.max(y,_[r]));let i=t.travelling?t.progress:1,a=1-(1-Math.min(i/.55,1))**2.2,s=Math.min(v,Math.max(v*a,y+4.5));b||(o.uPulseS.value=s),p.uniforms.uCamS.value=y;let c=Math.min(_.findIndex(e=>e>=o.uPulseS.value),g.length-1);return{camS:y,pulseS:o.uPulseS.value,length:v,head:g[c<0?g.length-1:c],alpha:x,arrived:o.uPulseS.value>=v-.01}}return{object:C,set:T,clear:E,update:D,get active(){return!!m},dispose(){w(),p.dispose()}}}function x({THREE:n,network:r,tokens:i,shared:o,camera:c,quality:l}){let d=l.tier===`low`?4:8,f=d*2+1,p=[e(i.neon[0]),e(i.neon[1])],m=t(e(i.route),[1,1,1],.55),h=r.nodes.map(()=>[]);r.edges.forEach(([e,t])=>{h[e].push(t),h[t].push(e)});let g=new n.InstancedBufferGeometry;g.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),g.setIndex([0,1,2,0,2,3]);let _=new Float32Array(f*3),v=new Float32Array(f*3),y=new Float32Array(f*3),b=new Float32Array(f),x=new Float32Array(f),S=new Float32Array(f),C=(e,t,r)=>{let i=new n.InstancedBufferAttribute(t,r);return i.setUsage(n.DynamicDrawUsage),g.setAttribute(e,i),i},w=C(`aT`,_,3),T=C(`aH`,v,3),E=C(`aC`,y,3),D=C(`aI`,b,1),O=C(`aW`,x,1),k=C(`aM`,S,1);g.instanceCount=f;let A=u(n,{uniforms:{...o},vertexShader:s+`
      attribute vec3 aT, aH, aC; attribute float aI, aW, aM;
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI; varying float vM; varying float vWpx;
      void main() {
        if (aI <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec3 mid = (aH + aT) * 0.5, dir = aH - aT;
        float len = length(dir);
        vec3 toCam = cameraPosition - mid;
        float d = length(toCam);
        float ppu = uPx / max(d, 0.02);
        float wpx = max(aW * ppu, 1.1 * uDpr);
        float wW = wpx / ppu;
        vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 X = len > 1e-4 ? dir / len : camRight;
        vec3 S = cross(X, toCam);
        S = length(S) < 1e-5 ? vec3(0.0, 1.0, 0.0) : normalize(S);
        float pad = aM > 0.5 ? 9.0 : 4.0;          // flares carry fine star spikes
        float halfLen = len * 0.5 + wW * pad;
        vec3 P = mid + X * position.x * halfLen + S * position.y * wW * pad;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        vL = vec2(position.x * halfLen / wW, position.y * pad);
        vHL = len * 0.5 / wW;
        vC = aC; vM = aM; vWpx = wpx;
        vI = aI * smoothstep(0.3, 1.6, d) * max(exp(-max(d - 24.0, 0.0) / 28.0), 0.15);
      }
    `,fragmentShader:`
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI; varying float vM; varying float vWpx;
      void main() {
        float dx = max(abs(vL.x) - vHL, 0.0);
        float dist = length(vec2(dx, vL.y));
        vec3 c;
        if (vM > 0.5) {
          float blob = exp(-dist * dist * 0.35);
          float glow = exp(-dist * 0.55) * 0.35;
          float spikes = exp(-abs(vL.y) * 1.6) * exp(-abs(vL.x) * 0.3) + exp(-abs(vL.x) * 1.6) * exp(-abs(vL.y) * 0.3);
          c = vC * (glow + spikes * 0.45) + mix(vC, vec3(1.0), 0.6) * blob;
        } else {
          float f = vHL > 0.0 ? clamp((vL.x / vHL + 1.0) * 0.5, 0.0, 1.0) : 1.0;
          float body = exp(-dist * dist * 0.9) * (0.06 + 0.94 * f * f);
          float head = exp(-(pow(vL.x - vHL, 2.0) + vL.y * vL.y) * 0.45);
          float halo = exp(-dist * 0.7) * 0.18 * f;
          c = vC * (body + halo) + mix(vC, vec3(1.0), 0.55) * head * 1.2;
        }
        gl_FragColor = vec4(c * vI, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),j=new n.Mesh(g,A);j.frustumCulled=!1,j.renderOrder=50;let M=1,N=()=>a(M++,77),P=new n.Vector3,F=new n.Vector3,I=e=>r.nodes[e].pos;function L(){c.getWorldDirection(P);for(let e=0;e<40;e++){let e=r.edges[Math.floor(N()*r.edges.length)],t=I(e[0]),n=I(e[1]);F.set((t[0]+n[0])/2,(t[1]+n[1])/2,(t[2]+n[2])/2).sub(c.position);let i=F.length();if(i>3.5&&i<30&&F.dot(P)>i*.35)return N()<.5?[e[0],e[1]]:[e[1],e[0]]}return null}let R=Array.from({length:d},(e,t)=>({a:0,b:0,t:0,dur:1,wait:.4+t*.7,hops:0,col:p[t%2],flare:0,fa:null})),z=(e,t,n,r,i)=>{r[i]=e[0]+(t[0]-e[0])*n,r[i+1]=e[1]+(t[1]-e[1])*n,r[i+2]=e[2]+(t[2]-e[2])*n};function B(e,t){R.forEach((t,n)=>{let r=n*2,i=n*2+1;if(t.flare>0?(t.flare=Math.max(0,t.flare-e/.45),_.set(t.fa,i*3),v.set(t.fa,i*3),y.set(t.col,i*3),b[i]=t.flare**1.5*1.1,x[i]=.05,S[i]=1):b[i]=0,t.wait>0){if(t.wait-=e,b[r]=0,t.wait<=0){let e=L();if(!e){t.wait=.5;return}t.a=e[0],t.b=e[1],t.t=0,t.hops=1+Math.floor(N()*3),t.col=p[N()<.55?0:1],t.dur=.35+.1*Math.hypot(...I(t.b).map((e,n)=>e-I(t.a)[n]))}return}if(t.t+=e/t.dur,t.t>=1){t.flare=1,t.fa=I(t.b).slice(),t.hops--;let e=h[t.b].filter(e=>e!==t.a);if(t.hops>0&&e.length){let n=e[Math.floor(N()*e.length)];t.a=t.b,t.b=n,t.t=0,t.dur=.35+.1*Math.hypot(...I(t.b).map((e,n)=>e-I(t.a)[n]))}else{t.wait=1.2+N()*3.5,b[r]=0;return}}let a=I(t.a),o=I(t.b);z(a,o,t.t,v,r*3),z(a,o,Math.max(0,t.t-.45),_,r*3),y.set(t.col,r*3),b[r]=1.25,x[r]=.045,S[r]=0});let n=d*2;if(t&&t.head&&t.alpha>0&&!t.arrived){let e=t.head;_[n*3]=v[n*3]=e.x,_[n*3+1]=v[n*3+1]=e.y,_[n*3+2]=v[n*3+2]=e.z,y.set(m,n*3),b[n]=1.3*t.alpha,x[n]=.075,S[n]=1}else b[n]=0;for(let e of[w,T,E,D,O,k])e.needsUpdate=!0}return{object:j,update:B,dispose(){g.dispose(),A.dispose()}}}function S({THREE:n,tokens:r,shared:i,quality:o}){let c=o.tier===`low`?260:520,l=new n.InstancedBufferGeometry;l.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),l.setIndex([0,1,2,0,2,3]);let d=new Float32Array(c*3),f=new Float32Array(c),p=new Float32Array(c*3),m=t(e(r.node),[1,1,1],.35),h=e(r.neon[1]),g=e(r.route);for(let e=0;e<c;e++){d[e*3]=a(e,1)*26,d[e*3+1]=a(e,2)*26,d[e*3+2]=a(e,3)*26,f[e]=a(e,4);let t=a(e,5);p.set(t<.3?g:t<.42?h:m,e*3)}l.setAttribute(`aP`,new n.InstancedBufferAttribute(d,3)),l.setAttribute(`aSeed`,new n.InstancedBufferAttribute(f,1)),l.setAttribute(`aC`,new n.InstancedBufferAttribute(p,3)),l.instanceCount=c;let _=u(n,{uniforms:{...i,uVel:{value:new n.Vector3},uWarp:{value:0},uBox:{value:26}},vertexShader:s+`
      attribute vec3 aP; attribute float aSeed; attribute vec3 aC;
      uniform vec3 uCam; uniform vec3 uVel; uniform float uWarp; uniform float uBox;
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.05 + aSeed * 6.0), cos(uTime * 0.04 + aSeed * 9.0), sin(uTime * 0.03 + aSeed * 3.0)) * 0.6;
        vec3 rel = mod(aP + drift - uCam, uBox) - uBox * 0.5;
        float dl = length(rel);
        vec3 H = uCam + rel;
        float speed = length(uVel);
        // streak: where the mote sat relative to the camera a moment ago
        float st = 0.012 + uWarp * 0.42;
        vec3 Tl = H + uVel * st;
        vec3 mid = (H + Tl) * 0.5, dir = H - Tl;
        float len = length(dir);
        vec3 toCam = cameraPosition - mid;
        float d = max(length(toCam), 0.05);
        float ppu = uPx / d;
        float coc = clamp(cocPx(d), 0.0, 26.0 * uDpr);
        float core = max(0.011 * ppu, (0.8 + 0.7 * uWarp) * uDpr);
        float wpx = core + coc * 0.5;
        float wW = wpx / ppu;
        vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 X = len > 1e-4 ? dir / len : camRight;
        vec3 S = cross(X, toCam); S = length(S) < 1e-5 ? camRight : normalize(S);
        float halfLen = len * 0.5 + wW * 2.5;
        vec3 Pw = mid + X * position.x * halfLen + S * position.y * wW * 2.5;
        gl_Position = projectionMatrix * viewMatrix * vec4(Pw, 1.0);
        vL = vec2(position.x * halfLen / wW, position.y * 2.5);
        vHL = len * 0.5 / wW;
        vC = aC;
        // a third of the motes hang in the air; warp wakes the rest
        float show = step(aSeed, 0.34 + 0.66 * uWarp);
        float amberMote = step(0.7, aC.r - aC.b);                // amber motes stay asleep until warp
        float base = mix(0.2, 0.05 + 0.25 * uWarp, amberMote);
        float energy = core / wpx;
        float lenDim = 1.0 / (1.0 + len * ppu / (60.0 * uDpr) * (1.0 - uWarp * 0.8));
        vI = show * (base + 2.0 * uWarp) * energy * lenDim
           * smoothstep(uBox * 0.5, uBox * 0.28, dl) * smoothstep(0.25, 1.0, dl);
        if (vI < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI;
      void main() {
        float dx = max(abs(vL.x) - vHL, 0.0);
        float dist = length(vec2(dx, vL.y));
        float p = exp(-dist * dist * 1.1);
        gl_FragColor = vec4(vC * p * vI, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),v=new n.Mesh(l,_);v.frustumCulled=!1,v.renderOrder=60;let y=o.tier===`low`?700:1400,b=new Float32Array(y*3),x=new Float32Array(y),S=new Float32Array(y*3),C=t(e(r.node),[1,1,1],.5),w=t(e(r.hub),[1,1,1],.4),T=t(e(r.core),[1,1,1],.2);for(let e=0;e<y;e++){let t=a(e,21)*2-1,n=a(e,22)*Math.PI*2,r=190+a(e,23)*140,i=Math.sqrt(1-t*t);b[e*3]=r*i*Math.cos(n),b[e*3+1]=r*t*.8,b[e*3+2]=r*i*Math.sin(n),x[e]=a(e,24)**3;let o=a(e,25);S.set(o<.12?w:o<.22?T:C,e*3)}let E=new n.BufferGeometry;E.setAttribute(`position`,new n.BufferAttribute(b,3)),E.setAttribute(`aS`,new n.BufferAttribute(x,1)),E.setAttribute(`aC`,new n.BufferAttribute(S,3));let D=u(n,{uniforms:{uTime:i.uTime,uDpr:i.uDpr},vertexShader:`
      uniform float uTime; uniform float uDpr; attribute float aS; attribute vec3 aC; varying vec3 vC; varying float vI;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.4 + aS * 2.2) * uDpr;
        vC = aC;
        vI = (0.16 + 0.7 * aS) * (0.8 + 0.2 * sin(uTime * (0.7 + aS * 2.0) + aS * 90.0));
      }
    `,fragmentShader:`
      varying vec3 vC; varying float vI;
      void main() { vec2 q = gl_PointCoord - 0.5; float p = exp(-dot(q, q) * 18.0); gl_FragColor = vec4(vC * p * vI, 1.0); }
    `,transparent:!0,depthWrite:!1,depthTest:!1,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),O=new n.Points(E,D);O.frustumCulled=!1,O.renderOrder=-50;let k=new n.Vector3,A=new n.Vector3,j=new n.Vector3,M=!1;return{objects:[O,v],update(e,t){M&&e>1e-4&&(j.subVectors(t.position,A).divideScalar(e),(j.length()>200||!(t.speed>.01))&&j.set(0,0,0),k.lerp(j,1-Math.exp(-e*12))),A.copy(t.position),M=!0,_.uniforms.uVel.value.copy(k),_.uniforms.uWarp.value=t.warp||0},dispose(){l.dispose(),_.dispose(),E.dispose(),D.dispose()}}}function C({THREE:e,scene:t,camera:n,renderer:r,network:i,tokens:a,quality:s}){let c=new e.Vector3;t.background=new e.Color(a.sceneBg),t.fog=null;let l=o(e);l.uPulseS={value:-1},l.uRouteA={value:0},l.uFocusId={value:-1},l.uFocusAmt={value:0},l.uAttnPos={value:new e.Vector3},l.uAttnAmt={value:0},l.uAttnR0={value:12},l.uAttnD={value:40};let u={THREE:e,renderer:r,network:i,tokens:a,shared:l,quality:s,camera:n},d=m(u),f=h(u),p=v(u),g=y(u),_=b(u),C=x(u),w=S(u),T=new e.Group;T.add(d.object,f.object,...p.objects,g.object,_.object,C.object,...w.objects),t.add(T);let E=new Map(i.nodes.map((e,t)=>[e.id,t])),D=-1,O=0,k=0,A=12,j=new e.Vector3;for(let e of i.nodes)j.add(c.fromArray(e.pos));j.divideScalar(i.nodes.length);let M=new e.Vector2,N=new e.Vector3;return{setRoute(e){if(!e||e.length<2){_.clear();return}p.setRouteS(_.set(e))},setFocus(e){let t=e==null?-1:E.get(e)??-1;t!==D&&(D=t,O=0),l.uFocusId.value=t},update(e,t,a){r.getDrawingBufferSize(M),l.uTime.value=e,l.uDpr.value=r.getPixelRatio(),l.uPx.value=n.projectionMatrix.elements[5]*M.y/2,l.uNearK.value=.018*M.y,l.uFarK.value=1.6*l.uDpr.value,l.uCam.value.copy(a.position);let o=7.5;D>=0&&!a.travelling?o=N.fromArray(i.nodes[D].pos).distanceTo(a.position):a.glide?o=a.targetDist:D>=0&&a.travelling&&a.progress>.7&&(o=Math.max(7.5,N.fromArray(i.nodes[D].pos).distanceTo(a.position)));let s=a.position.distanceTo(j),c=Math.min(Math.max((s-80)/35,0),1);l.uBand.value+=(c-l.uBand.value)*(1-Math.exp(-t*3)),A+=(o-A)*(1-Math.exp(-t*4)),l.uFocus.value=A+(s-A)*l.uBand.value;let u=+(!a.travelling&&D>=0);if(l.uAttnAmt.value+=(u-l.uAttnAmt.value)*(1-Math.exp(-t*(u?1.6:5))),D>=0){l.uAttnPos.value.fromArray(i.nodes[D].pos);let e=l.uAttnPos.value.distanceTo(a.position);l.uAttnR0.value=Math.max(8,e*.3),l.uAttnD.value=e+3}O+=((a.travelling?.35:1)-O)*(1-Math.exp(-t*2.5)),l.uFocusAmt.value=O;let f=D>=0&&i.nodes[D].id===g.id;k+=((f?O:0)-k)*(1-Math.exp(-t*3)),g.setLift(k),d.update(a,M);let p=_.update(t,a);C.update(t,p),w.update(t,a)},dispose(){t.remove(T);for(let e of[d,f,p,g,_,C,w])e.dispose()}}}export{C as createSkin};