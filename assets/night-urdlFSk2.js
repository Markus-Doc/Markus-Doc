function e(e){let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}var t=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],n=(e,t)=>[e[0]*t,e[1]*t,e[2]*t],r=e=>.2126*e[0]+.7152*e[1]+.0722*e[2],i=(e,n)=>t(e,[r(e),r(e),r(e)],n);function a(e,t=0){let n=e*374761393+t*668265263|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967295}function o(e){return{uTime:{value:0},uPx:{value:800},uDpr:{value:1},uFocus:{value:12},uNearK:{value:10},uFarK:{value:2},uCam:{value:new e.Vector3},uBand:{value:0},uBandW:{value:8},uBandK:{value:60},uBandLit:{value:0}}}var s=`
uniform float uTime;
uniform float uPx;
uniform float uDpr;
uniform float uFocus;
uniform float uNearK;
uniform float uFarK;
uniform float uBand;
uniform float uBandW;
uniform float uBandK;
uniform float uBandLit;
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
`;function m({THREE:r,renderer:i,tokens:a,shared:o,quality:s,camera:c}){let l=s.tier===`low`?512:1024,m=l/2,h=new r.WebGLRenderTarget(l,m,{depthBuffer:!1,generateMipmaps:!1,minFilter:r.LinearFilter,magFilter:r.LinearFilter});h.texture.wrapS=r.RepeatWrapping;let g=new r.Scene,_=new r.PlaneGeometry(2,2),v=u(r,{vertexShader:f,fragmentShader:p,depthTest:!1,depthWrite:!1}),y=new r.Mesh(_,v);y.frustumCulled=!1,g.add(y);let b=new r.OrthographicCamera(-1,1,1,-1,0,1),x=i.getRenderTarget();i.setRenderTarget(h),i.render(g,b),i.setRenderTarget(x),_.dispose(),v.dispose();let S=e(a.sceneBg),C=n(e(a.edge),.26),w=n(t(e(a.edge),e(a.node),.3),.1),T=n(e(a.routeGlow),.09),E=u(r,{uniforms:{uTime:o.uTime,uTex:{value:h.texture},uBg:d(r,S),uNavy:d(r,C),uViolet:d(r,w),uWarm:d(r,T),uRes:{value:new r.Vector2(1,1)},uWarp:{value:0},uFwd:{value:new r.Vector3(0,0,-1)},uHot:d(r,n(t(e(a.route),e(a.routeGlow),.5),.5))},vertexShader:`
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
    `,side:r.BackSide,depthWrite:!1,depthTest:!1}),D=new r.SphereGeometry(400,48,24),O=new r.Mesh(D,E);return O.frustumCulled=!1,O.renderOrder=-100,{object:O,update(e,t){O.position.copy(e.position),E.uniforms.uRes.value.copy(t),E.uniforms.uWarp.value=e.warp||0,c.getWorldDirection(E.uniforms.uFwd.value)},dispose(){D.dispose(),E.dispose(),h.dispose()}}}var h=6;function g({THREE:r,network:i,tokens:o,shared:c}){let l=i.edges.length,d=new r.InstancedBufferGeometry,f=[],p=[];for(let e=0;e<=h;e++)f.push(e/h,-1,0,e/h,1,0);for(let e=0;e<h;e++){let t=e*2;p.push(t,t+2,t+3,t,t+3,t+1)}d.setAttribute(`position`,new r.BufferAttribute(new Float32Array(f),3)),d.setIndex(p);let m=new Float32Array(l*3),g=new Float32Array(l*3),_=new Float32Array(l*3),v=new Float32Array(l*3),y=e(o.edge),b=e(o.node),x=e(o.hub),S=e(o.route),C=t(y,b,.3),w=n(y,.85),T=t(t(x,S,.4),C,.35),E=(e,n)=>{let r=i.nodes[e];return r.kind===`core`?t(C,b,.4):r.kind===`hub`||r.kind===`leaf`?t(x,C,.7):a(e,7+n)<.07?T:t(C,w,a(e,3))},D=e=>{let t=i.nodes[e];return t.kind===`junction`?t.radius*(.85+.45*a(e,2)):t.radius},O=new Float32Array(l*2);i.edges.forEach(([e,t],n)=>{m.set(i.nodes[e].pos,n*3),g.set(i.nodes[t].pos,n*3),_.set(E(e,0),n*3),v.set(E(t,0),n*3),O[n*2]=D(e),O[n*2+1]=D(t)}),d.setAttribute(`aR`,new r.InstancedBufferAttribute(O,2)),d.setAttribute(`aA`,new r.InstancedBufferAttribute(m,3)),d.setAttribute(`aB`,new r.InstancedBufferAttribute(g,3)),d.setAttribute(`aCA`,new r.InstancedBufferAttribute(_,3)),d.setAttribute(`aCB`,new r.InstancedBufferAttribute(v,3)),d.instanceCount=l;let k=u(r,{uniforms:{...c,uGain:{value:1}},vertexShader:s+`
      attribute vec3 aA, aB, aCA, aCB; attribute vec2 aR;
      uniform float uGain; uniform vec3 uAttnPos; uniform float uAttnAmt; uniform float uAttnR0; uniform float uAttnD; uniform float uLive;
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
        // wire would otherwise read as a beam); while riding the route mesh carries the wire and
        // other wiring clears out of the lens early, so nothing near it outshines the route
        float nearF = mix(smoothstep(1.8, 7.0, d), smoothstep(2.5, 9.0, d), uAttnAmt);
        float farF = exp(-max(d - 10.0, 0.0) / 19.0);
        // seen from outside the brain the sharp focus band stays lit (reference 01)
        farF = mix(farF, max(farF, 0.5), uBandLit * (1.0 - smoothstep(uBandW, uBandW * 2.5, abs(d - uFocus))));
        // at rest the resting node's own neighbourhood stays lit however far it sits
        float fdist = distance(P, uAttnPos);
        float hood = smoothstep(uAttnR0 + 6.0, uAttnR0 * 0.6, fdist);
        farF = mix(farF, max(farF, 0.8), uAttnAmt * hood);
        // idle life: slow bands of light sweep through the resting brain, about a 7 s cycle and
        // 7 units apart; never below 0.7 of the wire's own light, and off under reduced motion
        float wave = 0.5 + 0.5 * sin(dot(mix(aA, aB, position.x), vec3(0.55, 0.42, 0.33)) * 1.1 - uTime * 0.9);
        farF *= 1.0 + uLive * uAttnAmt * (wave * wave * 0.9 - 0.3);
        vI = uGain * energy * nearF * farF * (0.25 + 0.75 * min(1.0, 1.4 * uDpr / core));
        // at rest, near wires carry the structure (the near-wire lift applies at rest only)
        vI *= mix(1.0, mix(1.4, 1.0, smoothstep(5.0, 14.0, d)), uAttnAmt);
        // at rest a wire pointing almost straight at the lens foreshortens into a bright beam: dim it
        float align = abs(dot(normalize(T), toCam / max(d, 1e-4)));
        vI *= 1.0 - uAttnAmt * 0.85 * smoothstep(0.82, 0.97, align);   // near wires carry the structure: at least 3:1
        // at rest, wiring far from the resting node and far from the lens goes quiet
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
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:r.DoubleSide,blending:r.CustomBlending,blendSrc:r.OneFactor,blendDst:r.OneFactor,blendEquation:r.AddEquation}),A=new r.Mesh(d,k);return A.frustumCulled=!1,A.renderOrder=10,{object:A,material:k,dispose(){d.dispose(),k.dispose()}}}var _=s+`
attribute vec3 aPos; attribute float aRad; attribute vec3 aCol; attribute float aSeed; attribute float aRouteS; attribute float aId; attribute float aRing; attribute float aWarm;
uniform vec3 uAttnPos; uniform float uAttnAmt; uniform float uAttnR0; uniform float uAttnD;
uniform float uPulseS; uniform float uRouteA; uniform float uFocusId; uniform float uFocusAmt; uniform float uGlowPad; uniform float uLive;
varying vec2 vQ; varying float vR; varying float vCoc; varying vec3 vCol; varying float vA; varying float vLit; varying float vFocus; varying float vSeed; varying float vRing; varying float vWarm; varying float vGlow; varying float vBreath;
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
  float pad = uGlowPad + focus * 1.2 + lit * 1.6 + aWarm * 1.2;
  float halfPx = max(rpx * pad, rpx + coc) + 2.5 * uDpr;
  mv.xy += position.xy * halfPx / ppu;
  gl_Position = projectionMatrix * mv;
  vQ = position.xy * halfPx; vR = rpx; vCoc = coc; vCol = aCol; vSeed = aSeed; vLit = lit; vFocus = focus; vRing = aRing; vWarm = aWarm;
  // fade before the lens clips the bead, and let depth swallow the far field
#ifdef CONTENT
  // the camera arcs round content nodes on the way; their glass clears out of the lens early
  float nearF = smoothstep(aRad * 1.5 + 0.6, aRad * 3.2 + 1.5, d);
#else
  float nearF = smoothstep(aRad * 1.1 + 0.25, aRad * 2.6 + 1.1, d);
#endif
  // while riding, glow near the lens goes first: a hub or bead passing close never flares past the route
  vGlow = mix(smoothstep(aRad * 2.2 + 1.0, aRad * 5.5 + 3.5, d), 1.0, uAttnAmt);
  float farF = max(exp(-max(d - 18.0, 0.0) / 24.0), 0.07);
  // seen from outside the brain the sharp focus band stays lit (reference 01), so the dive
  // and the whole-network view show the brain rather than a black void
  farF = mix(farF, max(farF, 0.55), uBandLit * (1.0 - smoothstep(uBandW, uBandW * 2.5, abs(d - uFocus))));
  float fdist = distance(aPos, uAttnPos);
  float hood = smoothstep(uAttnR0 + 6.0, uAttnR0 * 0.6, fdist);
  farF = mix(farF, max(farF, 0.85), uAttnAmt * hood);
  vA = nearF * farF;
#ifndef CONTENT
  // at rest, glass far from the resting node and far from the lens goes quiet
  vA *= 1.0 - uAttnAmt * (1.0 - mix(0.22, 1.0, smoothstep(uAttnR0 + 14.0, uAttnR0, fdist)) * mix(1.0, exp(-max(d - uAttnD, 0.0) / 9.0), 0.85 * (1.0 - hood))) * smoothstep(12.0, 20.0, d);
#endif
  // idle life: junction glow breathes gently near the resting node (never moves)
  vBreath = 1.0 + uLive * uAttnAmt * mix(0.6, 1.0, hood) * 0.35 * sin(uTime * (0.9 + 0.8 * aSeed) + aSeed * 37.0);
#ifdef CONTENT
  vBreath = mix(1.0, vBreath, 0.4);   // content glass only breathes a little; the junctions carry it
#endif
  if (vA < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);   // faded beads cost no fill
}
`,v=`
uniform float uTime; uniform float uDpr; uniform vec3 uRoute; uniform vec3 uRouteHot; uniform vec3 uBrass; uniform float uBody; uniform float uBokehK;
varying vec2 vQ; varying float vR; varying float vCoc; varying vec3 vCol; varying float vA; varying float vLit; varying float vFocus; varying float vSeed; varying float vRing; varying float vWarm; varying float vGlow; varying float vBreath;
void main() {
  float r = max(vR, 0.6 * uDpr);
  float dist = length(vQ);
  float rho = dist / r;
  vec3 col = mix(vCol, uRoute, vLit * 0.8);
  vec3 tintW = mix(col, vec3(1.0), 0.55);          // speculars take the bead's colour: only the route runs white-hot
  vec3 sharp;
  if (vWarm > 0.5) {
    // amber star point: a small hot lamp and a soft glow; close up it stays a point
    // inside a faint glass shell rather than swelling into a sun
    float lr = clamp(0.42 * r, 1.1 * uDpr, 3.0 * uDpr);
    float k = dist / lr;
    float lamp = exp(-k * k * 1.4);
    float gr = max(lr * 2.4, min(r * 0.8, 9.0 * uDpr));
    float glow = exp(-dist / gr * 1.6) * 0.34 * vGlow * vBreath;
    float shell = exp(-pow((rho - 0.93) * 11.0, 2.0)) * 0.3 * smoothstep(5.0 * uDpr, 12.0 * uDpr, r);
    sharp = (tintW * lamp * 0.95 + col * lamp * 0.4) * mix(1.0, vBreath, 0.7) + col * (glow + shell);
  } else {
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
      bead = (col * (uBody * (0.5 + 0.5 * nz) + 1.05 * fres + 0.5 * rimLine + 0.62 * crescent + sheen * 0.5) + tintW * spec * 0.6) * aa;
#else
      bead = (col * (uBody * (0.6 + 0.4 * nz) + 1.3 * fres + 0.55 * rimLine + 1.05 * crescent + sheen) + tintW * spec * 0.6) * aa;
#endif
    }
    // soft halo around the glass; the focus node and route-lit beads get more
    float haloK = (0.10 + vFocus * 0.22 + vLit * 0.16) * vGlow * vBreath;
    vec3 halo = col * haloK * exp(-max(rho - 1.0, 0.0) * (3.2 - vFocus * 1.2 - vLit * 1.0)) * smoothstep(1.0 - min(1.5 * uDpr / r, 0.5), 1.0, rho);
    // four-point star flare on lit beads (ref 7), very fine
    float spike = vLit * vGlow * (exp(-abs(vQ.y) / (0.9 * uDpr)) * exp(-abs(vQ.x) / (r * 3.5)) + exp(-abs(vQ.x) / (0.9 * uDpr)) * exp(-abs(vQ.y) / (r * 3.5)));
    sharp = bead * (1.0 - 0.22 * vLit) + halo + uRouteHot * spike * 0.3;
  }
  // bokeh: a flat disc with a brighter rim, energy spread over its area
  float R2 = r + vCoc;
  float soft = 1.0 + vCoc * 0.12;
  float disc = smoothstep(R2, R2 - soft, dist);
  float rim = 0.8 + 0.45 * smoothstep(R2 * 0.55, R2, dist);
  float energy = (r * r * 0.9 + 1.0) / (R2 * R2 + 1.0);
  vec3 bokeh = col * disc * rim * energy * uBokehK * (1.0 + vWarm * 0.6) * vGlow;
  float m = clamp(vCoc / (r * 0.4 + 1.5), 0.0, 1.0);
  vec3 c = mix(sharp, bokeh, m);
  // far beads collapse to star points that breathe very slightly
  float star = 1.0 - smoothstep(0.8 * uDpr, 2.2 * uDpr, vR);
  float tw = 0.85 + 0.15 * sin(uTime * (1.3 + vSeed * 2.0) + vSeed * 40.0);
  c = mix(c, col * exp(-dist * dist / (1.1 * uDpr * uDpr)) * (0.55 + 0.9 * vR / uDpr) * tw * (1.0 + vWarm * 0.8), star);
#ifdef CONTENT
  // engraved brass bezel in the screen plane: two rules with 5 and 10 degree ticks between them
  if (vRing > 0.0) {
    float hub = step(0.8, vRing);
    float Ro = r * 1.44, Ri = r * 1.28;
    float lw = 0.55 * uDpr;
    float outer = 1.0 - smoothstep(lw, lw + 1.0 * uDpr, abs(dist - Ro));
    float inner = (1.0 - smoothstep(lw * 0.8, lw * 0.8 + 0.9 * uDpr, abs(dist - Ri))) * 0.55 * hub;
    float step5 = 0.0872665;
    float spin = hub * (uTime * 0.012 + vSeed * 6.2831);
    float u = (atan(vQ.y, vQ.x) + spin) / step5;
    float kk = floor(u + 0.5);
    float ten = 1.0 - step(0.5, mod(kk, 2.0));
    float along = abs(u - kk) * step5 * Ro;
    float band = Ro - Ri;
    float len = mix(band * 0.45, band, ten) * mix(0.8, 1.0, hub);
    float radial = smoothstep(Ro - len - 0.6 * uDpr, Ro - len + 0.4 * uDpr, dist) * (1.0 - smoothstep(Ro, Ro + 0.6 * uDpr, dist));
    float tick = (1.0 - smoothstep(0.35 * uDpr, 0.35 * uDpr + 0.9 * uDpr, along)) * radial;
    // ticks thin out before they alias: the 5 degree ones need about 4 px between them
    float gap = step5 * Ro / uDpr;
    tick *= mix(smoothstep(5.0, 9.0, gap * 2.0), smoothstep(3.5, 6.5, gap), 1.0 - ten) * mix(ten, 1.0, hub);
    float bezel = max(max(outer, inner), tick * 0.9) * smoothstep(3.0 * uDpr, 9.0 * uDpr, vR);
    c += uBrass * bezel * vRing * (0.5 + vFocus * 0.45 + vLit * 0.25) * (1.0 - m);
  }
#endif
  gl_FragColor = vec4(c * vA, 1.0);
}
`;function y({THREE:n,network:r,tokens:i,shared:o}){let s=e(i.node),c=e(i.edge),l=e(i.nodeRing),f=e(i.hub),p=e(i.route),m=e(i.soon),h=t(f,p,.35),g=[],y=[];r.nodes.forEach((e,t)=>{e.kind===`junction`?g.push(t):e.kind!==`core`&&y.push(t)});let b=e=>r.nodes[e].kind===`junction`&&a(e,13)<.34;function x(e){let n=r.nodes[e];return n.kind===`hub`?f:n.kind===`leaf`?t(f,p,.3):n.kind===`soon`?t(m,s,.25):b(e)?t(h,f,a(e,5)*.5):t(s,c,.15+a(e,5)*.45)}function S(e,i){let s=new n.InstancedBufferGeometry;s.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),s.setIndex([0,1,2,0,2,3]);let c=e.length,m=new Float32Array(c*3),h=new Float32Array(c),g=new Float32Array(c*3),y=new Float32Array(c),S=new Float32Array(c).fill(-1),C=new Float32Array(c),w=new Float32Array(c),T=new Float32Array(c);e.forEach((e,t)=>{let n=r.nodes[e];m.set(n.pos,t*3),h[t]=i?n.radius:n.radius*(.85+.45*a(e,2)),g.set(x(e),t*3),y[t]=a(e,9),C[t]=e,w[t]=n.kind===`hub`?1:n.kind===`leaf`?.6:0,T[t]=+!!b(e)}),s.setAttribute(`aPos`,new n.InstancedBufferAttribute(m,3)),s.setAttribute(`aRad`,new n.InstancedBufferAttribute(h,1)),s.setAttribute(`aCol`,new n.InstancedBufferAttribute(g,3)),s.setAttribute(`aSeed`,new n.InstancedBufferAttribute(y,1)),s.setAttribute(`aRouteS`,new n.InstancedBufferAttribute(S,1)),s.setAttribute(`aId`,new n.InstancedBufferAttribute(C,1)),s.setAttribute(`aRing`,new n.InstancedBufferAttribute(w,1)),s.setAttribute(`aWarm`,new n.InstancedBufferAttribute(T,1)),s.instanceCount=c;let E=u(n,{defines:i?{CONTENT:1}:{},uniforms:{...o,uGlowPad:{value:i?2.6:1.8},uBody:{value:i?.16:.12},uBokehK:{value:i?.7:1.4},uRoute:d(n,p),uRouteHot:d(n,t(p,[1,1,1],.5)),uBrass:d(n,t(l,f,.35))},vertexShader:_,fragmentShader:v,transparent:!0,depthWrite:!1,depthTest:!1,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),D=new n.Mesh(s,E);return D.frustumCulled=!1,D.renderOrder=i?30:20,{mesh:D,g:s,mat:E,list:e,RS:S}}let C=S(g,!1),w=S(y,!0);return{objects:[C.mesh,w.mesh],setRouteS(e){for(let t of[C,w])t.list.forEach((n,r)=>{t.RS[r]=e?e[n]:-1}),t.g.getAttribute(`aRouteS`).needsUpdate=!0},dispose(){for(let e of[C,w])e.g.dispose(),e.mat.dispose()}}}function b({THREE:r,network:a,tokens:o,shared:c}){let l=a.nodes.findIndex(e=>e.kind===`core`),f=a.nodes[Math.max(l,0)],p=e(o.core),m=i(t(e(o.neon[1]),e(o.hub),.52),.12),h=n(t(p,e(o.panel),.55),.55),g=e(o.hub),_=new r.PlaneGeometry(2,2),v=u(r,{uniforms:{...c,uCenter:{value:new r.Vector3(...f.pos)},uRad:{value:f.radius},uViolet:d(r,p),uSage:d(r,m),uDeep:d(r,h),uBrass:d(r,g),uLift:{value:0},uRouteA:c.uRouteA},vertexShader:s+`
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
          // while a route is live the nucleus banks its heart, so the route stays the brightest thing
          float bank = 1.0 - 0.45 * uRouteA;
          c = uDeep * (0.35 + 0.35 * nz)
            + uViolet * (fres * 1.5 + rimLine * 0.5 + crescent * 0.55 + haze * 0.22) * mix(1.0, 0.62, uRouteA)
            + uSage * (heart * (0.62 + uLift * 0.18) * bank + heartGlow * (0.5 + uLift * 0.25) + haze * 0.3)
            + vec3(1.0) * pow(heart, 6.0) * 0.25 * bank
            + mix(uSage, vec3(1.0), 0.6) * (spec * 0.75 + window * 0.85) * bank;
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
    `,transparent:!0,depthWrite:!1,depthTest:!1,blending:r.CustomBlending,blendSrc:r.OneFactor,blendDst:r.OneMinusSrcAlphaFactor,blendEquation:r.AddEquation}),y=new r.Mesh(_,v);return y.frustumCulled=!1,y.renderOrder=15,{object:y,id:f.id,setLift(e){v.uniforms.uLift.value=e},dispose(){_.dispose(),v.dispose()}}}function x({THREE:n,network:r,tokens:i,shared:o,renderer:c,camera:l}){let f=e(i.route),p=e(i.routeGlow),m=t(f,[1,1,1],.62),h=u(n,{uniforms:{...o,uCamS:{value:0},uPulseS:o.uPulseS,uAlpha:o.uRouteA,uLen:{value:1},uCoreR:{value:.034},uHalo:{value:7.5},uBeadS:{value:new Float32Array(32)},uBeadR:{value:new Float32Array(32)},uBeadN:{value:0},uHot:d(n,m),uAmber:d(n,f),uGlow:d(n,p)},vertexShader:s+`
      attribute vec3 aTan; attribute float aSide; attribute float aS;
      uniform float uCoreR; uniform float uHalo;
      uniform float uBeadS[32]; uniform float uBeadR[32]; uniform int uBeadN;
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide; varying float vIn; varying float vHaloX;
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
        // Round 3 P2: the blur widens the halo's reach (softWide) but not the core and
        // body profile, which is capped at 6.5 px so the wire near the lens stays a
        // wire (under 18 px across) while the wide ember halo carries the closeness.
        float softWide = coreW + min(coc * 0.3, 5.0 * uDpr);
        float soft = min(softWide, 6.5 * uDpr);
        float halfPx = min(softWide * uHalo + 3.0 * uDpr, 58.0 * uDpr);
        P += N * aSide * halfPx / ppu;
        gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
        soft = min(soft, halfPx);
        vAcross = aSide * halfPx / soft;
        vHaloX = aSide * halfPx / min(softWide, halfPx);
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
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide; varying float vIn; varying float vHaloX;
      void main() {
        float x = abs(vAcross);
        float core = (1.0 - smoothstep(0.35, 1.0, x)) * (1.0 - 0.75 * vIn);
        float body = exp(-x * x * 0.7) * (1.0 - 0.5 * vIn);
        float halo = exp(-abs(vHaloX) * 0.62) * (1.0 - 0.6 * vIn);   // on the halo's own, wider scale
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
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),g=null,_=null,v=null,y=null,b=0,x=0,S=!1,C=0,w=0,T=new n.Group;if(T.renderOrder=40,c&&l){let e=new n.BufferGeometry;e.setAttribute(`position`,new n.BufferAttribute(new Float32Array(6),3)),e.setAttribute(`aTan`,new n.BufferAttribute(new Float32Array(6),3)),e.setAttribute(`aSide`,new n.BufferAttribute(new Float32Array(2),1)),e.setAttribute(`aS`,new n.BufferAttribute(new Float32Array(2),1));let t=new n.Scene;t.add(new n.Mesh(e,h));try{c.compile(t,l)}catch{}e.dispose()}function E(){g&&(T.remove(g),_.dispose(),g=null,_=null)}function D(e){if(E(),S=!1,!e||e.length<2)return v=null,b=0,null;let t=e.length;v=e,y=new Float32Array(t);for(let n=1;n<t;n++)y[n]=y[n-1]+e[n].distanceTo(e[n-1]);b=y[t-1];let i=new Float32Array(t*6),s=new Float32Array(t*6),c=new Float32Array(t*2),l=new Float32Array(t*2),u=new n.Vector3;for(let n=0;n<t;n++){u.subVectors(e[Math.min(n+1,t-1)],e[Math.max(n-1,0)]).normalize();for(let t=0;t<2;t++){let r=n*2+t;i[r*3]=e[n].x,i[r*3+1]=e[n].y,i[r*3+2]=e[n].z,s[r*3]=u.x,s[r*3+1]=u.y,s[r*3+2]=u.z,c[r]=t?1:-1,l[r]=y[n]}}let d=[];for(let e=0;e<t-1;e++){let t=e*2;d.push(t,t+1,t+3,t,t+3,t+2)}_=new n.BufferGeometry,_.setAttribute(`position`,new n.BufferAttribute(i,3)),_.setAttribute(`aTan`,new n.BufferAttribute(s,3)),_.setAttribute(`aSide`,new n.BufferAttribute(c,1)),_.setAttribute(`aS`,new n.BufferAttribute(l,1)),_.setIndex(d),g=new n.Mesh(_,h),g.frustumCulled=!1,g.renderOrder=40,T.add(g),h.uniforms.uLen.value=b,x=0,w=0,C=1,o.uRouteA.value=1,o.uPulseS.value=0;let f=new Float32Array(r.nodes.length).fill(-1),p=new n.Box3().setFromPoints(e).expandByScalar(1.4);r.nodes.forEach((n,r)=>{let[i,a,o]=n.pos;if(i<p.min.x||a<p.min.y||o<p.min.z||i>p.max.x||a>p.max.y||o>p.max.z)return;let s=1/0,c=0;for(let n=0;n<t;n++){let t=e[n],r=(t.x-i)**2+(t.y-a)**2+(t.z-o)**2;r<s&&(s=r,c=y[n])}s<1.5625&&(f[r]=c)});let m=[];f.forEach((e,t)=>{if(e>=0){let n=r.nodes[t];m.push([e,n.kind===`junction`?n.radius*(.85+.45*a(t,2)):n.radius])}}),m.sort((e,t)=>e[0]-t[0]);let D=h.uniforms.uBeadS.value,O=h.uniforms.uBeadR.value;return m.slice(0,32).forEach(([e,t],n)=>{D[n]=e,O[n]=t}),h.uniforms.uBeadN.value=Math.min(m.length,32),f}function O(){g&&!S&&(S=!0)}function k(e,t){if(!g)return null;if(w+=e,S&&(C=Math.max(0,C-e/.7),o.uRouteA.value=C,C<=0))return E(),v=null,null;let n=1/0,r=0;for(let e=0;e<v.length;e++){let i=v[e].distanceToSquared(t.position);i<n&&(n=i,r=e)}n<6.25&&(x=Math.max(x,y[r]));let i=t.travelling?t.progress:1,a=1-(1-Math.min(i/.55,1))**2.2,s=Math.min(b,Math.max(b*a,x+4.5));S||(o.uPulseS.value=s),h.uniforms.uCamS.value=x;let c=Math.min(y.findIndex(e=>e>=o.uPulseS.value),v.length-1);return{camS:x,pulseS:o.uPulseS.value,length:b,head:v[c<0?v.length-1:c],alpha:C,arrived:o.uPulseS.value>=b-.01}}return{object:T,set:D,clear:O,update:k,get active(){return!!g},dispose(){E(),h.dispose()}}}function S({THREE:n,network:r,tokens:i,shared:o,camera:c,quality:l}){let d=l.tier===`low`?4:8,f=d*2+3,p=[e(i.neon[0]),e(i.neon[1])],m=t(e(i.route),[1,1,1],.55),h=t(t(e(i.hub),e(i.route),.3),[1,1,1],.2),g=r.nodes.map(()=>[]);r.edges.forEach(([e,t])=>{g[e].push(t),g[t].push(e)});let _=new n.InstancedBufferGeometry;_.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),_.setIndex([0,1,2,0,2,3]);let v=new Float32Array(f*3),y=new Float32Array(f*3),b=new Float32Array(f*3),x=new Float32Array(f),S=new Float32Array(f),C=new Float32Array(f),w=(e,t,r)=>{let i=new n.InstancedBufferAttribute(t,r);return i.setUsage(n.DynamicDrawUsage),_.setAttribute(e,i),i},T=w(`aT`,v,3),E=w(`aH`,y,3),D=w(`aC`,b,3),O=w(`aI`,x,1),k=w(`aW`,S,1),A=w(`aM`,C,1);_.instanceCount=f;let j=u(n,{uniforms:{...o},vertexShader:s+`
      attribute vec3 aT, aH, aC; attribute float aI, aW, aM;
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI; varying float vM; varying float vWpx;
      void main() {
        if (aI <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec3 mid = (aH + aT) * 0.5, dir = aH - aT;
        float len = length(dir);
        vec3 toCam = cameraPosition - mid;
        float d = length(toCam);
        float ppu = uPx / max(d, 0.02);
        // a hit is a fine thread of light, never a laser: capped width near the lens
        float wpx = clamp(aW * ppu, 1.1 * uDpr, (aM > 0.5 ? 4.0 : 2.6) * uDpr);
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
          c = vC * (glow + spikes * 0.45) + mix(vC, vec3(1.0), 0.35) * blob;
        } else {
          float f = vHL > 0.0 ? clamp((vL.x / vHL + 1.0) * 0.5, 0.0, 1.0) : 1.0;
          float body = exp(-dist * dist * 0.9) * (0.06 + 0.94 * f * f);
          float head = exp(-(pow(vL.x - vHL, 2.0) + vL.y * vL.y) * 0.45);
          float halo = exp(-dist * 0.7) * 0.18 * f;
          c = vC * (body + halo) + mix(vC, vec3(1.0), 0.35) * head * 1.1;
        }
        gl_FragColor = vec4(c * vI, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),M=new n.Mesh(_,j);M.frustumCulled=!1,M.renderOrder=50;let N=1,P=()=>a(N++,77),F=new n.Vector3,I=new n.Vector3,L=e=>r.nodes[e].pos;function R(){c.getWorldDirection(F);for(let e=0;e<40;e++){let e=r.edges[Math.floor(P()*r.edges.length)],t=L(e[0]),n=L(e[1]);I.set((t[0]+n[0])/2,(t[1]+n[1])/2,(t[2]+n[2])/2).sub(c.position);let i=I.length();if(i>6&&i<30&&I.dot(F)>i*.35)return P()<.5?[e[0],e[1]]:[e[1],e[0]]}return null}let z=Array.from({length:d},(e,t)=>({a:0,b:0,t:0,dur:1,wait:.4+t*.7,hops:0,col:p[t%2],flare:0,fa:null})),B=(e,t,n,r,i)=>{r[i]=e[0]+(t[0]-e[0])*n,r[i+1]=e[1]+(t[1]-e[1])*n,r[i+2]=e[2]+(t[2]-e[2])*n},V={at:-1,a:0,b:0,t:0,dur:1,wait:1.4,hops:0,flare:0,fa:null,k:1},H=(e,t)=>Math.hypot(L(t)[0]-L(e)[0],L(t)[1]-L(e)[1],L(t)[2]-L(e)[2]);function U(e,t=-1){c.getWorldDirection(F);let n=c.position,r=L(e),i=I.set(n.x-r[0],n.y-r[1],n.z-r[2]).normalize().clone(),a=g[e].filter(a=>{if(a===t)return!1;let o=L(a),s=H(e,a)||1,c=Math.abs(((o[0]-r[0])*i.x+(o[1]-r[1])*i.y+(o[2]-r[2])*i.z)/s),l=[(r[0]+o[0])/2-n.x,(r[1]+o[1])/2-n.y,(r[2]+o[2])/2-n.z];return c<.8&&l[0]*F.x+l[1]*F.y+l[2]*F.z>2}),o=a.length?a:g[e].filter(e=>e!==t);return o.length?o[Math.floor(P()*o.length)]:-1}function W(e,t){let n=d*2+1,r=d*2+2;if(t!==V.at&&(V.at=t,V.wait=1.4,V.hops=0,x[n]=0),V.flare>0?(V.flare=Math.max(0,V.flare-e/.6),v.set(V.fa,r*3),y.set(V.fa,r*3),b.set(h,r*3),x[r]=V.flare**1.4*1.2*V.k,S[r]=.06,C[r]=1):x[r]=0,t<0){x[n]=0;return}if(V.hops<=0){if(x[n]=0,V.wait-=e,V.wait>0)return;let r=U(t);if(r<0){V.wait=3;return}V.a=t,V.b=r,V.t=0,V.k=1,V.hops=P()<.55?2:1,V.dur=.55+.11*H(V.a,V.b)}if(V.t+=e/V.dur,V.t>=1){V.flare=1,V.fa=L(V.b).slice(),V.hops--;let e=V.hops>0?U(V.b,V.a):-1;if(e>=0)V.a=V.b,V.b=e,V.t=0,V.k*=.7,V.dur=.55+.11*H(V.a,V.b);else{V.hops=0,V.wait=2.2+P()*1.6,x[n]=0;return}}let i=L(V.a),a=L(V.b);B(i,a,V.t,y,n*3),B(i,a,Math.max(0,V.t-.55),v,n*3),b.set(h,n*3),x[n]=1.3*V.k,S[n]=.05,C[n]=0}function G(e,t,n=!1,r=-1){W(e,n?-1:r),z.forEach((t,r)=>{if(n){x[r*2]=x[r*2+1]=0,t.flare=0;return}let i=r*2,a=r*2+1;if(t.flare>0?(t.flare=Math.max(0,t.flare-e/.45),v.set(t.fa,a*3),y.set(t.fa,a*3),b.set(t.col,a*3),x[a]=t.flare**1.5*1.1,S[a]=.05,C[a]=1):x[a]=0,t.wait>0){if(t.wait-=e,x[i]=0,t.wait<=0){let e=R();if(!e){t.wait=.5;return}t.a=e[0],t.b=e[1],t.t=0,t.hops=1+Math.floor(P()*3),t.col=p[P()<.55?0:1],t.dur=.35+.1*Math.hypot(...L(t.b).map((e,n)=>e-L(t.a)[n]))}return}if(t.t+=e/t.dur,t.t>=1){t.flare=1,t.fa=L(t.b).slice(),t.hops--;let e=g[t.b].filter(e=>e!==t.a);if(t.hops>0&&e.length){let n=e[Math.floor(P()*e.length)];t.a=t.b,t.b=n,t.t=0,t.dur=.35+.1*Math.hypot(...L(t.b).map((e,n)=>e-L(t.a)[n]))}else{t.wait=1.2+P()*3.5,x[i]=0;return}}let o=L(t.a),s=L(t.b);B(o,s,t.t,y,i*3),B(o,s,Math.max(0,t.t-.45),v,i*3),b.set(t.col,i*3),x[i]=1.25,S[i]=.045,C[i]=0});let i=d*2;if(t&&t.head&&t.alpha>0&&!t.arrived){let e=t.head;v[i*3]=y[i*3]=e.x,v[i*3+1]=y[i*3+1]=e.y,v[i*3+2]=y[i*3+2]=e.z,b.set(m,i*3),x[i]=1.3*t.alpha,S[i]=.075,C[i]=1}else x[i]=0;for(let e of[T,E,D,O,k,A])e.needsUpdate=!0}return{object:M,update:G,dispose(){_.dispose(),j.dispose()}}}function C({THREE:n,tokens:r,shared:i,quality:o}){let c=o.tier===`low`?260:520,l=new n.InstancedBufferGeometry;l.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),l.setIndex([0,1,2,0,2,3]);let d=new Float32Array(c*3),f=new Float32Array(c),p=new Float32Array(c*3),m=t(e(r.node),[1,1,1],.3),h=t(e(r.edge),e(r.node),.5),g=e(r.route);for(let e=0;e<c;e++){d[e*3]=a(e,1)*26,d[e*3+1]=a(e,2)*26,d[e*3+2]=a(e,3)*26,f[e]=a(e,4);let t=a(e,5);p.set(t<.3?g:t<.5?h:m,e*3)}l.setAttribute(`aP`,new n.InstancedBufferAttribute(d,3)),l.setAttribute(`aSeed`,new n.InstancedBufferAttribute(f,1)),l.setAttribute(`aC`,new n.InstancedBufferAttribute(p,3)),l.instanceCount=c;let _=u(n,{uniforms:{...i,uVel:{value:new n.Vector3},uWarp:{value:0},uBox:{value:26}},vertexShader:s+`
      attribute vec3 aP; attribute float aSeed; attribute vec3 aC;
      uniform vec3 uCam; uniform vec3 uVel; uniform float uWarp; uniform float uBox;
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI;
      void main() {
        // idle life: the dust wanders slowly (a gentle flow plus a sway); the skin clock stops under reduced motion
        vec3 drift = vec3(sin(uTime * 0.11 + aSeed * 6.0), cos(uTime * 0.09 + aSeed * 9.0), sin(uTime * 0.07 + aSeed * 3.0)) * 0.9
                   + vec3(0.06, 0.035, -0.045) * uTime * (0.5 + aSeed);
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
        float amberMote = step(0.4, aC.r - aC.b);                // amber motes stay dim until warp
        float base = mix(0.26, 0.12 + 0.18 * uWarp, amberMote);
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
    `,transparent:!0,depthWrite:!1,depthTest:!1,side:n.DoubleSide,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),v=new n.Mesh(l,_);v.frustumCulled=!1,v.renderOrder=60;let y=o.tier===`low`?700:1400,b=new Float32Array(y*3),x=new Float32Array(y),S=new Float32Array(y*3),C=t(e(r.node),[1,1,1],.5),w=t(e(r.hub),[1,1,1],.4),T=t(e(r.route),[1,1,1],.2);for(let e=0;e<y;e++){let t=a(e,21)*2-1,n=a(e,22)*Math.PI*2,r=190+a(e,23)*140,i=Math.sqrt(1-t*t);b[e*3]=r*i*Math.cos(n),b[e*3+1]=r*t*.8,b[e*3+2]=r*i*Math.sin(n),x[e]=a(e,24)**3;let o=a(e,25);S.set(o<.12?w:o<.22?T:C,e*3)}let E=new n.BufferGeometry;E.setAttribute(`position`,new n.BufferAttribute(b,3)),E.setAttribute(`aS`,new n.BufferAttribute(x,1)),E.setAttribute(`aC`,new n.BufferAttribute(S,3));let D=u(n,{uniforms:{uTime:i.uTime,uDpr:i.uDpr},vertexShader:`
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
    `,transparent:!0,depthWrite:!1,depthTest:!1,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),O=new n.Points(E,D);O.frustumCulled=!1,O.renderOrder=-50;let k=new n.Vector3,A=new n.Vector3,j=new n.Vector3,M=!1;return{objects:[O,v],update(e,t){M&&e>1e-4&&(j.subVectors(t.position,A).divideScalar(e),(j.length()>200||!(t.speed>.01))&&j.set(0,0,0),k.lerp(j,1-Math.exp(-e*12))),A.copy(t.position),M=!0,_.uniforms.uVel.value.copy(k),_.uniforms.uWarp.value=t.warp||0},dispose(){l.dispose(),_.dispose(),E.dispose(),D.dispose()}}}function w({THREE:n,tokens:r,quality:i,camera:o}){let s=i.tier===`low`?100:200,c=i.tier===`low`?7:14,l=t(e(r.edge),e(r.node),.45),d=t(e(r.route),e(r.hub),.4),f=Array.from({length:s},(n,i)=>({p:[a(i,31)*12,a(i,32)*12,a(i,33)*12],s:a(i,34),col:a(i,35)<.38?d:t(l,e(r.node),a(i,36)*.4)})),p=new n.InstancedBufferGeometry;p.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),p.setIndex([0,1,2,0,2,3]);let m=new Float32Array(c*4),h=new Float32Array(c*4),g=new n.InstancedBufferAttribute(m,4),_=new n.InstancedBufferAttribute(h,4);g.setUsage(n.DynamicDrawUsage),_.setUsage(n.DynamicDrawUsage),p.setAttribute(`aC`,g),p.setAttribute(`aK`,_),p.instanceCount=c;let v=u(n,{uniforms:{uRes:{value:new n.Vector2(1,1)}},vertexShader:`
      attribute vec4 aC; attribute vec4 aK; uniform vec2 uRes;
      varying vec2 vQ; varying float vR; varying float vA; varying vec3 vCol;
      void main() {
        if (aC.w < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vR = aC.z; vA = aC.w; vCol = aK.rgb; vQ = position.xy * (aC.z + 2.0);
        gl_Position = vec4(aC.xy + position.xy * (aC.z + 2.0) * 2.0 / uRes, 0.0, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vQ; varying float vR; varying float vA; varying vec3 vCol;
      void main() {
        float d = length(vQ);
        float disc = smoothstep(vR, vR - max(2.0, vR * 0.12), d);
        float rim = 0.78 + 0.4 * smoothstep(vR * 0.5, vR, d);
        gl_FragColor = vec4(vCol * disc * rim * vA, 1.0);
      }
    `,transparent:!0,depthWrite:!1,depthTest:!1,blending:n.CustomBlending,blendSrc:n.OneFactor,blendDst:n.OneFactor,blendEquation:n.AddEquation}),y=new n.Mesh(p,v);y.frustumCulled=!1,y.renderOrder=-45;let b=new n.Vector3,x=new n.Vector3,S=new n.Vector3,C=e=>(e%12+12)%12-6,w=new Float32Array(s),T=[];function E(e,t,n,r,i,a){v.uniforms.uRes.value.set(n.x,n.y),o.getWorldDirection(S);let l=n.x/r,u=n.y/r,d=o.projectionMatrix.elements[5]*u/2,p=1-Math.min(Math.max(((a.speed||0)-6)/20,0),1),y=[];for(let n=0;n<s;n++){let r=f[n];x.set(C(r.p[0]+.1*e*(.5+r.s)+.5*Math.sin(e*.15+r.s*7)-o.position.x),C(r.p[1]+.06*e*(.5+r.s)+.4*Math.cos(e*.13+r.s*5)-o.position.y),C(r.p[2]-.07*e*(.5+r.s)+.5*Math.sin(e*.11+r.s*3)-o.position.z));let a=x.dot(S),s=0,c=0,m=0,h=0;if(a>1.1&&a<6.8&&(b.copy(o.position).add(x).project(o),c=(b.x+1)/2*l,m=(1-b.y)/2*u,h=Math.min(Math.max((.16+.16*r.s)*d/a,12),58),c>-h&&c<l+h&&m>-h&&m<u+h)){s=Math.min((a-1.1)/.8,1)*Math.min((6.8-a)/2.2,1)*p,i.subj&&Math.hypot(c-i.subj.x,m-i.subj.y)-i.subj.r*1.6-h<24&&(s=0);for(let e of i.tags){let t=Math.max(e.x-c,0,c-(e.x+e.w)),n=Math.max(e.y-m,0,m-(e.y+e.h));if(Math.hypot(t,n)-h<16){s=0;break}}}w[n]+=(s-w[n])*Math.min(1,t*(s>w[n]?1.2:8)),s===0&&w[n]<.02&&(w[n]=0),w[n]>.004&&h>0&&y.push({i:n,x:c,y:m,r:h,a:w[n]})}y.sort((e,t)=>t.a-e.a||e.i-t.i),T=y.slice(0,c),m.fill(0),T.forEach((t,n)=>{let i=f[t.i];m[n*4]=t.x/l*2-1,m[n*4+1]=1-t.y/u*2,m[n*4+2]=t.r*r,m[n*4+3]=t.a*(.13+.07*i.s)*(.72+.34*Math.sin(e*(.7+.35*i.s)+i.s*20)),h.set(i.col,n*4),h[n*4+3]=i.s}),g.needsUpdate=!0,_.needsUpdate=!0}return{object:y,update:E,discs:()=>T.map(e=>({x:+e.x.toFixed(1),y:+e.y.toFixed(1),r:+e.r.toFixed(1),a:+e.a.toFixed(3)})),dispose(){p.dispose(),v.dispose()}}}function T({THREE:e,scene:t,camera:n,renderer:r,network:i,tokens:a,quality:s}){let c=new e.Vector3;t.background=new e.Color(a.sceneBg),t.fog=null;let l=o(e);l.uPulseS={value:-1},l.uRouteA={value:0},l.uFocusId={value:-1},l.uFocusAmt={value:0},l.uAttnPos={value:new e.Vector3},l.uAttnAmt={value:0},l.uAttnR0={value:12},l.uAttnD={value:40},l.uLive={value:1};let u=typeof document<`u`?document.documentElement:null,d=()=>!!u?.classList.contains(`motion-reduced`),f=0,p={THREE:e,renderer:r,network:i,tokens:a,shared:l,quality:s,camera:n},h=m(p),_=g(p),v=y(p),T=b(p),E=x(p),D=S(p),O=C(p),k=w(p),A=new e.Group;A.add(h.object,_.object,...v.objects,T.object,E.object,D.object,...O.objects,k.object),t.add(A);let j=new Map(i.nodes.map((e,t)=>[e.id,t])),M=-1,N=0,P=0,F=12,I=0,L=new e.Vector3;for(let e of i.nodes)L.add(c.fromArray(e.pos));L.divideScalar(i.nodes.length);let R=new e.Vector2,z=new e.Vector3,B=new e.Vector3,V={subj:null,tags:[]},H=1;function U(){if(V.tags=[],typeof document>`u`)return;let e=r.domElement.getBoundingClientRect();for(let t of document.querySelectorAll(`.node-label, #reader, .topbar, .explore-controls`)){if(t.hidden)continue;let n=t.getBoundingClientRect();n.width>0&&n.height>0&&V.tags.push({x:n.left-e.left,y:n.top-e.top,w:n.width,h:n.height})}}function W(){if(V.subj=null,M<0)return;let e=i.nodes[M];z.fromArray(e.pos);let t=z.clone().sub(n.position).dot(n.getWorldDirection(B));if(t<=.05)return;z.project(n);let r=R.x/l.uDpr.value,a=R.y/l.uDpr.value;V.subj={x:(z.x+1)/2*r,y:(1-z.y)/2*a,r:e.radius*n.projectionMatrix.elements[5]*a/2/t}}return{setRoute(e){if(!e||e.length<2){E.clear();return}v.setRouteS(E.set(e))},setFocus(e){let t=e==null?-1:j.get(e)??-1;t!==M&&(M=t,N=0),l.uFocusId.value=t},update(e,t,a){r.getDrawingBufferSize(R);let o=d();o||(f+=t),l.uTime.value=f,l.uLive.value=+!o,l.uDpr.value=r.getPixelRatio(),l.uPx.value=n.projectionMatrix.elements[5]*R.y/2,l.uNearK.value=.018*R.y,l.uFarK.value=1.6*l.uDpr.value,l.uCam.value.copy(a.position);let s=7.5;M>=0&&!a.travelling?s=z.fromArray(i.nodes[M].pos).distanceTo(a.position):a.glide?s=a.targetDist:M>=0&&a.travelling&&a.progress>.7&&(s=Math.max(7.5,z.fromArray(i.nodes[M].pos).distanceTo(a.position)));let c=a.position.distanceTo(L),u=Math.min(Math.max((c-80)/35,0),1);l.uBand.value+=(u-l.uBand.value)*(1-Math.exp(-t*3)),I+=((a.glide&&a.travelling?1:0)-I)*(1-Math.exp(-t*(a.glide&&a.travelling?6:.9))),l.uBandLit.value=Math.max(l.uBand.value,I),F+=(s-F)*(1-Math.exp(-t*4)),l.uFocus.value=F+(c-F)*l.uBand.value;let p=+(!a.travelling&&M>=0);if(l.uAttnAmt.value+=(p-l.uAttnAmt.value)*(1-Math.exp(-t*(p?1.6:5))),M>=0){l.uAttnPos.value.fromArray(i.nodes[M].pos);let e=l.uAttnPos.value.distanceTo(a.position);l.uAttnR0.value=Math.max(8,e*.3),l.uAttnD.value=e+3}N+=((a.travelling?.35:1)-N)*(1-Math.exp(-t*2.5)),l.uFocusAmt.value=N;let m=M>=0&&i.nodes[M].id===T.id;P+=((m?N:0)-P)*(1-Math.exp(-t*3)),T.setLift(P),h.update(a,R);let g=E.update(t,a);D.update(t,g,o,!a.travelling&&M>=0?M:-1),O.update(t,a),H+=t,H>.15&&(H=0,U()),W(),k.update(f,t,R,l.uDpr.value,V,a)},dispose(){t.remove(A);for(let e of[h,_,v,T,E,D,O,k])e.dispose();typeof window<`u`&&window.__nightBokeh&&delete window.__nightBokeh}}}export{T as createSkin};