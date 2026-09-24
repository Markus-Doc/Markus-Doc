import{d as e}from"./index-DPNpaJJ6.js";function t(e){return{uTime:{value:0},uRes:{value:new e.Vector2(1,1)},uDpr:{value:1},uCam:{value:new e.Vector3},uCore:{value:new e.Vector3},uWinR:{value:150},uHole:{value:0},uFade:{value:1},uIntro:{value:0},uCoreBoost:{value:0},uDark:{value:0},uRot:{value:0},uSpeed:{value:0},uWarp:{value:0},uTwinkle:{value:1},uSpread:{value:0}}}var n=`
uniform float uTime, uDpr, uWinR, uHole, uFade, uIntro, uCoreBoost, uDark, uRot, uSpeed, uWarp, uTwinkle, uSpread;
uniform vec2 uRes;
uniform vec3 uCam, uCore;
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {  // three octaves
  float s = 0.5 * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7;
  s += 0.25 * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7;
  s += 0.125 * vnoise(p);
  return s / 0.875;
}
float fbm2(vec2 p) { return (vnoise(p) * 0.5 + vnoise(mat2(1.6, 1.2, -1.2, 1.6) * p + 11.7) * 0.25) / 0.75; }
// where a world point lands on the core's view plane, in window radii
float rhoEq(vec3 P) {
  vec3 A = normalize(uCore - uCam);
  vec3 q = P - uCam;
  float z = max(dot(q, A), 1e-3);
  return length(q - A * z) / z * dot(uCore - uCam, A) / uWinR;
}
// 1 inside the plate's night, 0 on the paper and inside the opening
float nightMask(float rho) {
  float s = mix(uDark > 0.5 ? 0.7 : 0.06, 1.0, uSpread);
  float outer = uDark > 0.5 ? 1.0 - smoothstep(1.05 * s, 1.6 * s, rho) : 1.0 - smoothstep(0.8 * s, 0.98 * s, rho);
  float hole = uHole > 0.0 ? smoothstep(uHole * 0.45, uHole, rho) : 1.0;
  return outer * hole;
}
float holeMask(float rho) { return uHole > 0.0 ? smoothstep(uHole * 0.45, uHole, rho) : 1.0; }
`;function r(e,t){let n=t.replace(`#`,``);return new e.Vector3(parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255)}var i=(e,t,n,r)=>new e.Vector3().copy(t).lerp(n,r);function a(t,n,a){let o=e.light,s=e.dark,c=a===`dark`,l=e=>r(t,e),u=c?i(t,l(s.sceneBg),l(s.ground),.5):i(t,l(s.sceneBg),l(s.node),.075),d=i(t,u,l(s.nodeRing),c?.06:.12),f=i(t,l(o.panel),l(s.hub),.55),p=i(t,l(s.ink),l(s.node),.55),m=i(t,l(o.routeGlow),l(s.core),.55),h=i(t,l(s.hub),l(o.route),.3),g=c?i(t,l(s.hub),l(s.ink),.2):l(n.ink),_=l(c?s.hub:o.hub),v=i(t,l(o.panel),l(s.hub),c?.55:.35),y=c?i(t,l(s.hub),l(s.ink),.35):i(t,l(o.ground),l(s.hub),.5);return{dark:+!!c,nightDeep:u,nightLift:d,coreLight:f,armLight:p,knot:m,warm:h,inkOut:g,brass:_,inkIn:v,rim:y,wash:i(t,l(o.panel),l(s.hub),.28),inkAlpha:c?.42:.78}}function o({THREE:e,shared:t,pal:r}){let i=new e.PlaneGeometry(2,2),a=new e.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,uniforms:{...t,uSize:{value:1},uWash:{value:0},uWashCol:{value:r.wash},uNightDeep:{value:r.nightDeep},uNightLift:{value:r.nightLift},uInkOut:{value:r.inkOut},uInkIn:{value:r.inkIn},uBrass:{value:r.brass},uRim:{value:r.rim},uCoreLight:{value:r.coreLight},uInkAlpha:{value:r.inkAlpha}},vertexShader:n+`
      uniform float uSize;
      varying vec2 vP;
      void main() {
        vec4 mv = viewMatrix * vec4(uCore, 1.0);
        vP = position.xy * uSize;
        mv.xy += vP;
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:n+`
      uniform vec3 uNightDeep, uNightLift, uInkOut, uInkIn, uBrass, uRim, uCoreLight, uWashCol;
      uniform float uInkAlpha, uWash;
      varying vec2 vP;
      const float TAU = 6.2831853;
      // anti-aliased line at distance d (window radii), w px wide
      float stroke(float d, float px, float w) { return 1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.6, abs(d) / px); }
      void main() {
        vec2 q = vP / uWinR;
        float rho = length(q), px = max(fwidth(rho), 1e-6);
        if (rho > 1.34 && uHole <= 0.0) discard;
        float phi = atan(q.y, q.x);
        vec2 dir = rho > 1e-5 ? q / rho : vec2(1.0, 0.0);

        // ---- the night ----
        float rag = fbm2(dir * 2.3 + 4.0) - 0.5;              // a slow irregular wash line
        float grain = h21(floor(gl_FragCoord.xy)) - 0.5;       // aquatint tooth in the feather
        float spread = mix(uDark > 0.5 ? 0.7 : 0.06, 1.0, uSpread);   // the dark sky is already night: it only widens
        float edge = (uDark > 0.5 ? 1.12 : 0.95 + rag * 0.035) * spread;
        float soft = (uDark > 0.5 ? 0.5 : 0.2) * mix(0.5, 1.0, uSpread);
        float wash = grain * 0.01;
        if (abs(rho - edge) < soft + 0.08) wash += (fbm(q * 7.0) - 0.5) * 0.05 + (fbm2(q * 26.0) - 0.5) * 0.02;   // only near the edge
        float night = 1.0 - smoothstep(edge - soft, edge + 0.02, rho + wash);
        night = night * night * (3.0 - 2.0 * night);
        vec3 sky = mix(uNightLift, uNightDeep, smoothstep(0.05, 0.75, rho));
        sky *= 0.9 + 0.2 * fbm2(q * 3.2 + 1.3);             // faint cloud in the sky
        // the round glow of the nucleus
        float glow = exp(-rho / 0.045) * 0.55 + exp(-rho / 0.16) * 0.22 + exp(-rho / 0.42) * 0.07;
        sky += uCoreLight * glow * (1.0 + uCoreBoost);
        // The opening: night peels back from the core. Near it, in the light theme, the night turns to warm light before it lets go, so the
        // paper is reached through light and never through a grey half tone.
        float open = holeMask(rho);
        float lit = uHole > 0.0 ? 1.0 - smoothstep(uHole * 0.7, uHole * 1.7, rho) : 0.0;
        sky = mix(sky, uRim, lit * (1.0 - uDark));
        float ring = pow(lit * (1.0 - lit) * 4.0, 3.0) * uDark;            // in the dark, a ring of light instead
        float nightA = night * open * (uDark > 0.5 ? 0.94 : 1.0);

        // ---- engraving ----
        float deg = phi / TAU * 360.0;
        float lines = 0.0, brass = 0.0;
        lines += stroke(rho - 1.035, px, 0.9);                 // border of the window
        lines += stroke(rho - 1.07, px, 1.3);                  // graduated circle
        lines += stroke(rho - 1.118, px, 0.9);
        float band = step(1.07, rho) * step(rho, 1.118);
        float t2 = abs(fract(deg / 2.0 + 0.5) - 0.5) * 2.0 * TAU / 360.0 * rho;   // to the nearest 2 degree tick
        float t10 = abs(fract(deg / 10.0 + 0.5) - 0.5) * 10.0 * TAU / 360.0 * rho;
        float t30 = abs(fract(deg / 30.0 + 0.5) - 0.5) * 30.0 * TAU / 360.0 * rho;
        lines += band * step(rho, 1.085) * stroke(t2, px, 0.8);
        lines += band * stroke(t10, px, 1.0);
        brass += step(1.118, rho) * step(rho, 1.15) * stroke(t30, px, 1.4);    // hour marks outside
        float a30 = floor(deg / 30.0 + 0.5) * 30.0 / 360.0 * TAU;
        brass += 1.0 - smoothstep(1.6, 2.6, length(q - vec2(cos(a30), sin(a30)) * 1.175) / px);  // a dot past each
        // dotted outer circle
        float dots = stroke(rho - 1.26, px, 1.2) * step(0.5, fract(deg * 0.9));
        lines += dots * 0.8;
        // meridian arcs across the sky, tilted like a globe seen from above
        vec2 g = mat2(0.94, -0.34, 0.34, 0.94) * q / 0.86;
        float mer = 0.0;
        for (int i = 1; i <= 2; i++) {
          float a = float(i) == 1.0 ? 0.5 : 0.866;
          float e = length(g / vec2(a, 1.0));
          mer += stroke((e - 1.0) * a * 0.86, px, 0.8) * step(length(g), 1.0);
        }
        mer += stroke((length(g) - 1.0) * 0.86, px, 0.8);                    // limb
        mer *= smoothstep(0.08, 0.3, rho);                                    // keep the nucleus clean
        // pale inside the night, page ink outside it
        float inside = night;
        float la = clamp(lines, 0.0, 1.0) * mix(uInkAlpha, 0.0, inside);
        float ba = clamp(brass, 0.0, 1.0) * mix(uInkAlpha, 0.0, inside);
        float ma = clamp(mer, 0.0, 1.0) * inside * (uDark > 0.5 ? 0.1 : 0.12);
        la *= open * uIntro; ba *= open * uIntro; ma *= open * uIntro;   // the engraving fades in
        nightA *= uDark > 0.5 ? 1.0 : min(1.0, uSpread * 5.0);             // the night spreads in

        // compose: night, then pale arcs on it, then ink over the paper
        vec3 col = sky * nightA; float a = nightA;
        col = uInkIn * ma + col * (1.0 - ma); a = ma + a * (1.0 - ma);
        col = uInkOut * la + col * (1.0 - la); a = la + a * (1.0 - la);
        col = uBrass * ba + col * (1.0 - ba); a = ba + a * (1.0 - ba);
        // once the opening has passed the lens, a last warm wash lingers while the network comes up
        float wa = uWash * (1.0 - open);
        col = col + uWashCol * wa * (1.0 - a); a = a + wa * (1.0 - a);
        col += uRim * ring * 0.7;
        if (a < 0.002) discard;
        gl_FragColor = vec4(col, a);
      }`}),o=new e.Mesh(i,a);return o.frustumCulled=!1,o.renderOrder=70,{object:o,setSize(e){a.uniforms.uSize.value=e},setWash(e){a.uniforms.uWash.value=e},setPalette(e){let t=a.uniforms;t.uNightDeep.value=e.nightDeep,t.uNightLift.value=e.nightLift,t.uInkOut.value=e.inkOut,t.uInkIn.value=e.inkIn,t.uBrass.value=e.brass,t.uRim.value=e.rim,t.uWashCol.value=e.wash,t.uCoreLight.value=e.coreLight,t.uInkAlpha.value=e.inkAlpha},dispose(){i.dispose(),a.dispose()}}}var s={r0:11,pitch:.29,width:.36};function c({THREE:e,shared:t,pal:r,galaxyR:i}){let a=i*1.2,o=new e.PlaneGeometry(2,2);o.rotateX(-Math.PI/2);let c=new e.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:e.DoubleSide,uniforms:{...t,uHalf:{value:a},uGal:{value:i},uCoreLight:{value:r.coreLight},uArmLight:{value:r.armLight},uKnot:{value:r.knot}},vertexShader:n+`
      uniform float uHalf;
      varying vec3 vLocal, vWorld;
      void main() {
        vec3 p = position * uHalf;
        vLocal = p;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,fragmentShader:n+`
      uniform float uHalf, uGal;
      uniform vec3 uCoreLight, uArmLight, uKnot;
      varying vec3 vLocal, vWorld;
      const float PI = 3.14159265, TAU = 6.2831853;
      const float R0 = ${s.r0.toFixed(2)}, PITCH = ${s.pitch.toFixed(3)}, WIDTH = ${s.width.toFixed(3)};
      void main() {
        vec2 q = vLocal.xz;
        float r = length(q);
        float rho = rhoEq(vWorld);
        float m = nightMask(rho) * uFade * uIntro;
        vec3 light = vec3(0.0);
        if (m > 0.002 && r < uGal * 1.15) {
          float c = cos(uRot), s = sin(uRot);
          vec2 qr = mat2(c, -s, s, c) * q;                  // into the pattern's frame
          float th = atan(qr.y, qr.x);
          float lr = log(max(r, 3.0) / R0) / PITCH;
          float arm = 0.0, lane = 0.0;
          for (int k = 0; k < 4; k++) {
            float amp = k < 2 ? 1.0 : 0.38;
            float d = th - lr - (k < 2 ? float(k) : float(k) - 1.5) * PI;
            d = mod(d + PI, TAU) - PI;
            float w = WIDTH * (0.75 + 0.5 * r / uGal);
            arm += amp * exp(-d * d / (w * w));
            float ld = (d + w * 0.55) / (w * 0.38);
            lane += amp * exp(-ld * ld);
          }
          float n = fbm(qr * 0.055), n2 = fbm2(qr * 0.14 + 7.0), n3 = fbm(qr * 0.4 - 3.0);
          float fall = 1.0 - smoothstep(0.7 * uGal, 1.08 * uGal, r + (n - 0.5) * 30.0);
          float bulge = exp(-r / 5.0) * 1.6 + exp(-r / 16.0) * 0.55 + exp(-r / 40.0) * 0.12;
          float disc = exp(-r / 42.0) * fall;
          float armL = disc * (0.2 + 2.6 * arm * (0.3 + 0.9 * n) * (0.65 + 0.7 * n3));
          float dust = clamp(lane * smoothstep(6.0, 22.0, r) * (0.2 + n2) * 0.9, 0.0, 0.85);
          vec3 col = uCoreLight * bulge + mix(uArmLight, uCoreLight, exp(-r / 26.0)) * armL;
          col *= 1.0 - 0.8 * dust;
          float knots = smoothstep(0.7, 0.86, n3) * smoothstep(0.6, 1.0, arm) * smoothstep(16.0, 36.0, r) * fall * disc * 3.0;
          col += uKnot * knots * 0.5;
          col *= 1.0 + uCoreBoost * 1.6 * exp(-r / 14.0);
          light = (1.0 - exp(-col * 0.9)) * m;
        }
        if (max(light.r, max(light.g, light.b)) < 0.002) discard;
        gl_FragColor = vec4(light, 0.0);   // pure light: added, never laid over
      }`}),l=new e.Mesh(o,c);return l.frustumCulled=!1,l.renderOrder=71,{object:l,setPalette(e){let t=c.uniforms;t.uCoreLight.value=e.coreLight,t.uArmLight.value=e.armLight,t.uKnot.value=e.knot},dispose(){o.dispose(),c.dispose()}}}function l(e,t,n){let r=0,i=Math.log(Math.max(e,3)/s.r0)/s.pitch;for(let a=0;a<4;a++){let o=a<2?1:.38,c=t-i-(a<2?a:a-1.5)*Math.PI;c=((c+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;let l=s.width*(.75+.5*e/n);r+=o*Math.exp(-c*c/(l*l))}return r}function u(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var d=e=>{let t=0;for(let n=0;n<4;n++)t+=e();return(t-2)*1.73};function f({THREE:e,shared:t,pal:r,network:i,quality:a,galaxyR:o}){let s=a.tier===`low`,c=s?4500:9e3,f=s?700:1400,p=i.nodes,m=c+f+p.length,h=new Float32Array(m*3),g=new Float32Array(m*4),_=u(4417),v=0,y=(e,t,n,r,i,a)=>{h.set([e,t,n],v*3),g.set([r,i,_(),a],v*4),v++},b=()=>_()>.985?1.8+_()*1.6:.18+_()**3*1.1;for(let e=0;e<c;e++){let e=_();if(e<.2){let e=Math.min(-Math.log(1-_()*.995)*9,46),t=_()*2-1,n=_()*Math.PI*2,r=Math.sqrt(1-t*t);y(e*r*Math.cos(n),e*t*.62,e*r*Math.sin(n),b(),.05+_()*.3,0)}else if(e<.93){let e,t,n=0;do e=6+Math.min(-Math.log(1-_()*.999)*44,o*1.05),t=_()*Math.PI*2,n++;while(_()>.12+.88*Math.min(1,l(e,t,o))&&n<30);let r=Math.min(1,l(e,t,o)),i=d(_)*(1.6+e*.018),a=(_()-.5)*4;y((e+a)*Math.cos(t),i,(e+a)*Math.sin(t),b()*(.8+r*.4),.45+r*.5+(_()-.5)*.2,0)}else{let e=30+_()*(o*.85),t=_()*2-1,n=_()*Math.PI*2,r=Math.sqrt(1-t*t);y(e*r*Math.cos(n),e*t*.7,e*r*Math.sin(n),.5+_()*.5,.15+_()*.25,0)}}let x=t.uWinR.value;for(let e=0;e<f;e++){let e=-40-_()*90,t=Math.sqrt(_())*x*1.45,n=_()*Math.PI*2;y(t*Math.cos(n),t*Math.sin(n),e,.45+_()**3*1.6,.5+_()*.5,1)}for(let e of p){let t=e.kind===`core`?3.2:e.kind===`hub`?2.4:e.kind===`leaf`||e.kind===`soon`?1.8:.9+_()*.6;y(e.pos[0],e.pos[1],e.pos[2],t,e.kind===`junction`?.55+_()*.35:.12,2)}let S=new e.PlaneGeometry(2,2),C=new e.InstancedBufferAttribute(h,3),w=new e.InstancedBufferAttribute(g,4),T=new e.InstancedBufferGeometry;T.index=S.index,T.setAttribute(`position`,S.getAttribute(`position`)),T.setAttribute(`aPos`,C),T.setAttribute(`aInfo`,w),T.instanceCount=m;let E=new e.BufferGeometry;E.setAttribute(`position`,new e.BufferAttribute(h,3)),E.setAttribute(`aInfo`,new e.BufferAttribute(g,4));let D={...t,uBasis:{value:new e.Matrix3},uFrame:{value:new e.Matrix3},uCoreNdc:{value:new e.Vector2},uWarm:{value:r.warm},uCoreLight:{value:r.coreLight},uArmLight:{value:r.armLight}},O=t=>new e.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,defines:t?{POINTS:1}:{},uniforms:D,vertexShader:n+`
      #ifndef POINTS
      attribute vec3 aPos;
      #endif
      attribute vec4 aInfo;
      uniform mat3 uBasis, uFrame;
      uniform vec2 uCoreNdc;
      uniform vec3 uWarm, uCoreLight, uArmLight;
      varying vec2 vPx; varying float vStreak, vSig, vHalo, vI, vHalf; varying vec3 vCol;
      void main() {
        #ifdef POINTS
        vec3 P = position;
        #else
        vec3 P = aPos;
        #endif
        float kind = aInfo.w, seed = aInfo.z;
        vec3 wp;
        if (kind < 0.5) {
          float c = cos(uRot), s = sin(uRot);
          vec3 lp = P; lp.xz = mat2(c, s, -s, c) * lp.xz;
          wp = uCore + uBasis * lp;
        } else if (kind < 1.5) wp = uCore + uFrame * P;
        else wp = P;
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        float z = -mv.z;
        float rho = rhoEq(wp);
        float m = nightMask(rho) * uIntro * smoothstep(3.0, 14.0, z) * (uDark > 0.5 ? 1.0 : 1.0 - smoothstep(0.7 * mix(0.06, 1.0, uSpread), 0.88 * mix(0.06, 1.0, uSpread), rho));
        m *= kind > 1.5 ? smoothstep(0.02, 0.3, uFade) : uFade;
        if (z < 0.5 || m < 0.004) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec4 clip = projectionMatrix * mv;
        float b = aInfo.x;
        float size = (0.7 + 0.5 * sqrt(b)) * uDpr * (1.0 + clamp(60.0 / z - 0.15, 0.0, 1.6));
        float sig = max(size * 0.55, 0.6);
        float halo = size > 1.35 * uDpr ? 1.0 : 0.0;          // halos only on the bright few
        float halfW = halo > 0.5 ? sig * 8.0 : sig * 3.0 + 0.5;
        float streak = 0.0;
        #ifdef POINTS
        gl_PointSize = halfW * 2.0;
        #else
        vec2 dpx = (clip.xy / clip.w - uCoreNdc) * 0.5 * uRes;
        float dl = length(dpx);
        vec2 dir = dl > 1e-3 ? dpx / dl : vec2(1.0, 0.0);
        streak = min(dl * uSpeed / z * 0.05 * (0.3 + uWarp), 260.0 * uDpr);
        float halfL = halfW + streak * 0.5;
        vec2 local = vec2(position.x * halfL - streak * 0.5, position.y * halfW);  // head at the origin, tail behind
        vPx = local;
        clip.xy += (dir * local.x + vec2(-dir.y, dir.x) * local.y) * 2.0 / uRes * clip.w;
        #endif
        gl_Position = clip;
        vStreak = streak; vSig = sig; vHalo = halo; vHalf = halfW;
        float tw = 1.0 + 0.4 * uTwinkle * sin(uTime * (1.1 + seed * 2.3) + seed * 61.0) * step(0.72, fract(seed * 13.7));
        float tone = aInfo.y;
        vCol = tone < 0.4 ? mix(uWarm, uCoreLight, tone / 0.4) : mix(uCoreLight, uArmLight, (tone - 0.4) / 0.6);
        vI = m * tw * min(b, 1.8) * 0.6 * (kind > 0.5 && kind < 1.5 ? 0.7 : 1.0) * (1.0 + uCoreBoost * 0.4) * size / (size + streak * 0.6);
      }`,fragmentShader:`
      varying vec2 vPx; varying float vStreak, vSig, vHalo, vI, vHalf; varying vec3 vCol;
      void main() {
        #ifdef POINTS
        vec2 local = (gl_PointCoord - 0.5) * vHalf * 2.0;
        float d = length(local);
        #else
        float ax = clamp(vPx.x, -vStreak, 0.0);
        float d = length(vec2(vPx.x - ax, vPx.y));
        #endif
        float I = (exp(-d * d / (vSig * vSig)) + exp(-d / (vSig * 2.4)) * 0.14 * vHalo) * vI;
        if (I < 0.003) discard;
        gl_FragColor = vec4(vCol * I, 0.0);
      }`}),k=O(!1),A=O(!0),j=new e.Mesh(T,k);j.frustumCulled=!1,j.renderOrder=72;let M=new e.Points(E,A);M.frustumCulled=!1,M.renderOrder=72;let N=new e.Group;return N.add(M,j),{object:N,uniforms:D,setStreaking(e){j.visible=e,M.visible=!e},setPalette(e){D.uWarm.value=e.warm,D.uCoreLight.value=e.coreLight,D.uArmLight.value=e.armLight},dispose(){T.dispose(),E.dispose(),S.dispose(),k.dispose(),A.dispose()}}}var p=9,m=2.4,h=138,g=118,_=.98,v=-.32,y=.016,b=e=>Math.min(1,Math.max(0,e)),x=(e,t,n)=>{let r=b((n-e)/(t-e));return r*r*(3-2*r)};function S({THREE:e,scene:n,camera:r,renderer:i,network:s,tokens:l,theme:u,quality:d}){let p=t(e);p.uWinR.value=h;let m=s.nodes.find(e=>e.kind===`core`)||s.nodes[0];p.uCore.value.fromArray(m.pos);let S=a(e,l,u);p.uDark.value=S.dark;let C=o({THREE:e,shared:p,pal:S}),w=c({THREE:e,shared:p,pal:S,galaxyR:g}),T=f({THREE:e,shared:p,pal:S,network:s,quality:d,galaxyR:g});C.setSize(h*1.34);let E=new e.Group;E.name=`galaxy-opening`,E.add(C.object,w.object,T.object);let D=!0,O=!1,k=i.domElement;u===`dark`&&(k.style.opacity=`0`);let A=()=>{D&&!O&&(O=!0,n.add(E),k.style.opacity=``)};try{i.compileAsync(E,r,n).then(A,A)}catch{A()}setTimeout(A,1200);let j=new e.Vector2,M=new e.Vector3,N=new e.Vector3,P=new e.Vector3,F=new e.Vector3,I=new e.Vector3,L=new e.Vector3,R=new e.Vector3,z=new e.Matrix4,B=null,V=0,H=.6,U=0;function W(){N.copy(r.position).sub(p.uCore.value).normalize(),P.setFromMatrixColumn(r.matrixWorld,0).normalize(),F.setFromMatrixColumn(r.matrixWorld,1).normalize();let t=Math.cos(v),n=Math.sin(v),i=P.clone().multiplyScalar(t).addScaledVector(F,n),a=F.clone().multiplyScalar(t).addScaledVector(P,-n);I.copy(N).multiplyScalar(Math.cos(_)).addScaledVector(a,Math.sin(_)).normalize(),L.copy(i).addScaledVector(I,-i.dot(I)).normalize(),R.crossVectors(L,I).normalize(),z.makeBasis(L,I,R),w.object.quaternion.setFromRotationMatrix(z),w.object.position.copy(p.uCore.value),T.uniforms.uBasis.value.setFromMatrix4(z),T.uniforms.uFrame.value.setFromMatrix4(new e.Matrix4().makeBasis(P,F,N))}return{update(e,t,n){O&&(V+=t),i.getDrawingBufferSize(j);let a=r.position.distanceTo(p.uCore.value);!n.travelling&&B!==null&&a<B*.5?U<4&&(U++,queueMicrotask(()=>dispatchEvent(new Event(`resize`)))):(!n.travelling||B===null)&&(B!==null&&a>B*.9&&(U=0),B=a,W());let o=B/9,s=b((a-o)/Math.max(B-o,.001)),c=n.warp||0,l=p,u=document.documentElement.classList.contains(`motion-reduced`);u||(H+=t*y*(1+28*c)),l.uTwinkle.value=+!u;let d=Math.tan(r.fov*Math.PI/360),f=1.5*a*d*Math.hypot(1,r.aspect)/h,m=x(.32,.03,s);l.uTime.value=e,l.uRes.value.copy(j),l.uDpr.value=i.getPixelRatio(),l.uCam.value.copy(r.position),l.uRot.value=H,T.setStreaking(!!n.travelling);let g=M.copy(l.uCore.value).project(r);T.uniforms.uCoreNdc.value.set(g.x,g.y),l.uSpeed.value=n.speed||0,l.uWarp.value=c,l.uIntro.value=x(.3,1.6,V);let _=b(V/1.5);l.uSpread.value=1-(1-_)**3,l.uHole.value=m>0?.02+m*m*f:0,l.uFade.value=x(.04,.25,s),C.setWash(S.dark?0:.2*x(.003,.05,s)),l.uCoreBoost.value=1.6*x(.85,.3,s)*x(.04,.2,s)},setTheme(t,n){S=a(e,t,n),p.uDark.value=S.dark,C.setPalette(S),w.setPalette(S),T.setPalette(S)},dispose(){D=!1,n.remove(E),k.style.opacity=``,C.dispose(),w.dispose(),T.dispose()}}}export{m as ENTRY_DURATION,p as FAR_FACTOR,S as createGalaxyOpening};