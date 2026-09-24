function e(e){let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}var t=(e,t,n)=>[e[0]+(t[0]-e[0])*n,e[1]+(t[1]-e[1])*n,e[2]+(t[2]-e[2])*n],n=(e,t)=>[e[0]*t,e[1]*t,e[2]*t];function r(e,t=0){let n=e*374761393+t*668265263|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967295}function i(e,t){return{value:new e.Vector3(t[0],t[1],t[2])}}function a(e){return{uTime:{value:0},uPx:{value:800},uDpr:{value:1},uFocus:{value:12},uNearK:{value:16},uFarK:{value:10},uCam:{value:new e.Vector3},uVel:{value:new e.Vector3},uWarp:{value:0},uFocusPos:{value:new e.Vector3(1e6,0,0)},uRest:{value:0}}}var o=`
uniform float uTime; uniform float uPx; uniform float uDpr; uniform float uFocus; uniform float uNearK; uniform float uFarK;
float cocPx(float d) {
  float band = max(uFocus * 0.14, 1.2);
  float f0 = uFocus - band, f1 = uFocus + band;
  if (d < f0) return uNearK * (f0 / max(d, 0.05) - 1.0);
  if (d > f1) return uFarK * (1.0 - f1 / d);
  return 0.0;
}
`,s=`float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
`,c=e=>s+e.replaceAll(`smoothstep(`,`sstep(`);function l(e,t){return new e.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,blending:e.CustomBlending,blendSrc:e.OneFactor,blendDst:e.OneFactor,blendEquation:e.AddEquation,side:e.DoubleSide,...t,vertexShader:c(t.vertexShader),fragmentShader:c(t.fragmentShader)})}function u(e,t,n=!0){let r=n?new e.InstancedBufferGeometry:new e.BufferGeometry,i=t+1,a=new Float32Array(i*6),o=new Float32Array(i*2),s=new Float32Array(i*2),c=[];for(let e=0;e<i;e++)for(let n=0;n<2;n++)o[e*2+n]=e/t,s[e*2+n]=n?1:-1;for(let e=0;e<t;e++){let t=e*2;c.push(t,t+1,t+3,t,t+3,t+2)}return r.setAttribute(`position`,new e.BufferAttribute(a,3)),r.setAttribute(`aT`,new e.BufferAttribute(o,1)),r.setAttribute(`aSide`,new e.BufferAttribute(s,1)),r.setIndex(c),r}var d=o+`
attribute float aT; attribute float aSide;
uniform float uW; uniform float uGain; uniform vec3 uFocusPos; uniform float uRest;
varying float vX; varying float vI;
void emit(vec3 P, vec3 T, float bright) {
  vec3 toCam = cameraPosition - P;
  float d = length(toCam);
  vec3 S = cross(T, toCam);
  S = length(S) < 1e-6 ? vec3(0.0, 1.0, 0.0) : normalize(S);
  float ppu = uPx / max(d, 0.02);
  float phys = uW * ppu;
  // near threads carry the structure: a touch wider and brighter so they read at 3:1 or better
  float nearBoost = 1.0 - smoothstep(6.0, 16.0, d);
  float core = clamp(phys, (0.6 + 0.35 * nearBoost) * uDpr, 1.5 * uDpr);
  float coc = clamp(cocPx(d), 0.0, 60.0 * uDpr);
  float sigma = core + min(coc * 0.22, 3.5 * uDpr);
  float halfPx = sigma * 2.4 + 0.5 * uDpr;
  gl_Position = projectionMatrix * viewMatrix * vec4(P + S * aSide * halfPx / ppu, 1.0);
  vX = aSide * halfPx / sigma;
  // hairline threads far away thin out rather than stay a full pixel bright
  float thin = pow(min(1.0, phys / (0.6 * uDpr)), 0.3);
  float nearF = smoothstep(0.35, 1.5, d);
  // behind the focus band the drawing recedes into the dark
  float farF = max(exp(-max(d - uFocus - 8.0, 0.0) / 20.0), 0.06) * exp(-max(d - 60.0, 0.0) / 30.0);
  // at rest, the destination's neighbourhood keeps its full line; the rest softens
  float hood = smoothstep(26.0, 8.0, distance(P, uFocusPos));
  float calm = mix(1.0, mix(0.55, 1.0, hood), uRest);
  vI = uGain * mix(bright, max(bright, 0.8) * 1.35, nearBoost) * (core / sigma) * thin * nearF * farF * calm;
  if (vI < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,f=`
uniform vec3 uInk;
varying float vX; varying float vI;
void main() {
  float p = exp(-vX * vX * 1.4);
  gl_FragColor = vec4(uInk * p * vI, 1.0);
}
`;function p({THREE:t,network:n,tokens:i,shared:a,quality:o}){let s=o.tier===`low`,c=e(i.lineInk),p=n.nodes,m=new Map;p.forEach((e,t)=>{e.kind!==`junction`&&m.set(t,e.radius*3+.5)});let h=s?11:22,g=p.map((e,t)=>t).filter(e=>p[e].kind===`junction`);for(let e=0,t=0;e<h&&t<4e3;t++){let n=g[Math.floor(r(t,41)*g.length)];m.has(n)||(m.set(n,.7+.9*r(n,43)),e++)}let _=u(t,10),v=[],y=[],b=[],x=e=>new t.Vector3(...e),S=new t.Vector3,C=new t.Vector3,w=new t.Vector3(0,1,0);function T(e,n,i){let a=x(p[e].pos),o=m.get(e);if(!o)return a;let s=S.copy(n).sub(a).normalize();return C.crossVectors(s,Math.abs(s.y)<.9?w:new t.Vector3(1,0,0)).normalize(),C.applyAxisAngle(s,r(i,51)*Math.PI*2),s.clone().addScaledVector(C,.55*r(i,53)).normalize().multiplyScalar(o).add(a)}n.edges.forEach(([e,t],n)=>{let i=x(p[e].pos),a=x(p[t].pos),o=i.distanceTo(a),c=s?1+ +(r(n,3)<.5):2+Math.floor(r(n,3)*2.99);for(let s=0;s<c;s++){let c=n*7+s,l=T(e,a,c),u=T(t,i,c+3);v.push(l.x,l.y,l.z),y.push(u.x,u.y,u.z);let d=Math.min(o*.14,3.2)*(.5+.5*r(n,13))*(.55+.9*r(c,5));b.push(d,r(n,7)*Math.PI*2+(r(c,15)-.5)*.9,(r(c,9)-.5)*.8,s===0?.85:.4+.35*r(c,11))}});let E=v.length/3;_.setAttribute(`aA`,new t.InstancedBufferAttribute(new Float32Array(v),3)),_.setAttribute(`aB`,new t.InstancedBufferAttribute(new Float32Array(y),3)),_.setAttribute(`aP`,new t.InstancedBufferAttribute(new Float32Array(b),4)),_.instanceCount=E;let D={...a,uInk:{value:new t.Vector3(...c)}},O=l(t,{uniforms:{...D,uW:{value:.007},uGain:{value:.72}},vertexShader:d+`
      attribute vec3 aA, aB; attribute vec4 aP;
      vec3 curve(float t) {
        vec3 D = aB - aA; float L = length(D); vec3 dir = D / max(L, 1e-5);
        vec3 u = normalize(cross(dir, abs(dir.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 w = cross(dir, u);
        float ph = aP.y + aP.z * t;
        float s = sin(3.14159265 * t);
        return aA + D * t + (cos(ph) * u + sin(ph) * w) * aP.x * s * s;
      }
      void main() {
        vec3 P = curve(aT);
        vec3 T = curve(min(aT + 0.02, 1.0)) - curve(max(aT - 0.02, 0.0));
        emit(P, T, aP.w);
      }
    `,fragmentShader:f}),k=new t.Mesh(_,O);k.frustumCulled=!1,k.renderOrder=10;let A=u(t,44),j=[],M=[],N=[],P=[],F=1;for(let[e,t]of m){let n=p[e],i=Math.round((n.kind===`core`?110:n.kind===`hub`?80:n.kind===`leaf`?56:n.kind===`soon`?26:10+t*6)*(s?.5:1));for(let e=0;e<i;e++,F++){let e=r(F,65)<.22,i=t*(e?1.08+.45*r(F,67)**1.5:.9+.16*r(F,67));j.push(...n.pos),M.push(i,(e?.1:.045)*(.4+r(F,69)),2+Math.floor(r(F,71)*4),r(F,73)*6.283),N.push(r(F,75)*6.283,(r(F,77)-.5)*(e?1.2:.7),e?.3+.3*r(F,79):.25+.5*r(F,79),r(F,81)*6.283),P.push(r(F,83)<.28?.25+.6*r(F,85):0)}}let I=j.length/3;A.setAttribute(`aC`,new t.InstancedBufferAttribute(new Float32Array(j),3)),A.setAttribute(`aQ`,new t.InstancedBufferAttribute(new Float32Array(M),4)),A.setAttribute(`aK`,new t.InstancedBufferAttribute(new Float32Array(N),4)),A.setAttribute(`aX`,new t.InstancedBufferAttribute(new Float32Array(P),1)),A.instanceCount=I;let L=l(t,{uniforms:{...D,uW:{value:.007},uGain:{value:.6},uFocusAmt:a.uFocusAmt},vertexShader:d+`
      attribute vec3 aC; attribute vec4 aQ; attribute vec4 aK; attribute float aX;
      vec3 loop(float t, vec3 ax, vec3 ay) {
        float th = t * 6.2831853;
        float r = aQ.x * (1.0 + aQ.y * sin(aQ.z * th + aQ.w + uTime * 0.12) + aQ.y * 0.5 * sin((aQ.z + 3.0) * th + aK.w - uTime * 0.08));
        float tail = max(t - 0.6, 0.0) / 0.4;
        r *= 1.0 + aX * tail * tail * 2.2;
        return aC + r * (cos(th) * ax + sin(th) * ay);
      }
      uniform float uFocusAmt;
      void main() {
        vec3 v = normalize(cameraPosition - aC);
        vec3 a = normalize(cross(v, abs(v.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
        vec3 b = cross(v, a);
        float ca = cos(aK.x), sa = sin(aK.x);
        vec3 ax = ca * a + sa * b, ay = -sa * a + ca * b;
        ay = cos(aK.y) * ay + sin(aK.y) * v;
        vec3 P = loop(aT, ax, ay);
        vec3 T = loop(aT + 0.01, ax, ay) - loop(aT - 0.01, ax, ay);
        // the destination's own chamber steps back so its ring leads; spiral tails thin out
        float own = 1.0 - 0.45 * uFocusAmt * (1.0 - smoothstep(0.05, 0.5, distance(aC, uFocusPos)));
        float tailFade = aX > 0.0 ? 1.0 - smoothstep(0.75, 1.0, aT) : 1.0;
        emit(P, T, aK.z * own * tailFade);
      }
    `,fragmentShader:f}),R=new t.Mesh(A,L);return R.frustumCulled=!1,R.renderOrder=12,{objects:[k,R],chamberR:m,counts:{strands:E,loops:I},dispose(){_.dispose(),O.dispose(),A.dispose(),L.dispose()}}}function m({THREE:t,network:n,tokens:a,shared:s,accent:c}){let u=n.nodes.length,d=new t.InstancedBufferGeometry;d.setAttribute(`position`,new t.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),d.setIndex([0,1,2,0,2,3]);let f=new Float32Array(u*3),p=new Float32Array(u),m=new Float32Array(u),h=new Float32Array(u),g=new Float32Array(u),_={junction:0,leaf:1,hub:2,core:3,soon:4};n.nodes.forEach((e,t)=>{f.set(e.pos,t*3),m[t]=_[e.kind]??0,h[t]=t,g[t]=r(t,17),p[t]=e.kind===`junction`?.075+.07*r(t,19):e.radius}),d.setAttribute(`aPos`,new t.InstancedBufferAttribute(f,3)),d.setAttribute(`aR`,new t.InstancedBufferAttribute(p,1)),d.setAttribute(`aKind`,new t.InstancedBufferAttribute(m,1)),d.setAttribute(`aId`,new t.InstancedBufferAttribute(h,1)),d.setAttribute(`aSeed`,new t.InstancedBufferAttribute(g,1)),d.instanceCount=u;let v=e(a.lineInk),y=c?e(a.lineAccent):v,b=l(t,{uniforms:{...s,uFocusId:s.uFocusId,uFocusAmt:s.uFocusAmt,uInk:i(t,v),uDest:i(t,y)},vertexShader:o+`
      attribute vec3 aPos; attribute float aR; attribute float aKind; attribute float aId; attribute float aSeed;
      uniform float uFocusId; uniform float uFocusAmt; uniform vec3 uFocusPos; uniform float uRest;
      varying vec2 vQ; varying float vDot; varying float vRing; varying float vCoc; varying float vA; varying float vKind; varying float vFocus; varying float vSeed;
      void main() {
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
        float d = -mv.z;
        if (d < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float ppu = uPx / d;
        float focus = aId == uFocusId ? uFocusAmt : 0.0;
        bool content = aKind > 0.5;
        float dotPx = max((content ? aR * 0.2 : aR) * ppu, 1.15 * uDpr);
        float ringPx = content ? aR * ppu : 0.0;
        float coc = clamp(cocPx(d), 0.0, 80.0 * uDpr) * (1.0 - focus);
        float halfPx = max(max(ringPx * (1.35 + focus * 0.5), dotPx * 2.5), dotPx + coc) + 3.0 * uDpr + ringPx * 0.1;
        mv.xy += position.xy * halfPx / ppu;
        gl_Position = projectionMatrix * mv;
        vQ = position.xy * halfPx; vDot = dotPx; vRing = ringPx; vCoc = coc; vKind = aKind; vFocus = focus; vSeed = aSeed;
        float nearF = content ? smoothstep(aR * 1.6 + 0.6, aR * 3.4 + 1.6, d) : smoothstep(0.3, 1.3, d);
        float farF = max(exp(-max(d - uFocus - 8.0, 0.0) / 22.0), 0.08) * exp(-max(d - 60.0, 0.0) / 30.0);
        float hood = smoothstep(26.0, 8.0, distance(aPos, uFocusPos));
        vA = nearF * max(farF, focus) * mix(1.0, mix(0.55, 1.0, hood), uRest * (content ? 0.0 : 1.0));
        if (vA < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,fragmentShader:`
      uniform vec3 uInk; uniform vec3 uDest; uniform float uDpr; uniform float uTime;
      varying vec2 vQ; varying float vDot; varying float vRing; varying float vCoc; varying float vA; varying float vKind; varying float vFocus; varying float vSeed;
      void main() {
        float dist = length(vQ);
        float aa = 1.0 * uDpr;
        bool content = vKind > 0.5;
        float base = content ? (vKind > 3.5 ? 0.45 : 0.95) : 0.85;
        // sharp mark
        float dotM = smoothstep(vDot + aa * 0.5, vDot - aa * 0.5, dist);
        float glow = exp(-dist / (vDot * 1.6 + 0.8)) * 0.18;
        float ring = 0.0, ring2 = 0.0;
        if (content) {
          float w = 0.75 * uDpr + vRing * 0.012;
          ring = exp(-pow((dist - vRing) / w, 2.0)) * (0.7 + 0.5 * vFocus);
          if (vKind > 2.5 && vKind < 3.5) ring += exp(-pow((dist - vRing * 0.55) / w, 2.0)) * 0.5;   // the core: rings within rings
          ring2 = exp(-pow((dist - vRing * (1.3 + 0.04 * sin(uTime * 1.2))) / w, 2.0)) * vFocus * 0.8
                + exp(-abs(dist - vRing) / (vRing * 0.25 + 2.0)) * vFocus * 0.25;
        }
        float sharpI = (dotM + glow) * base + ring * base + ring2;
        // bokeh: the mark's light spread over a disc with a brighter edge
        float R2 = vDot + vCoc;
        float disc = smoothstep(R2, R2 - 1.0 - vCoc * 0.12, dist) * (0.75 + 0.5 * smoothstep(R2 * 0.5, R2, dist));
        float energy = (vDot * vDot * 2.0 + 2.0) / (R2 * R2 + 2.0);
        float bokehI = disc * min(energy * 1.6, 0.5) * base * (content ? 0.6 : 0.9);
        float m = clamp(vCoc / (vDot + 1.5), 0.0, 1.0);
        float I = mix(sharpI, bokehI + ring * base * (1.0 - m), m);
        vec3 col = mix(uInk, uDest, vFocus);
        gl_FragColor = vec4(col * I * vA, 1.0);
      }
    `}),x=new t.Mesh(d,b);return x.frustumCulled=!1,x.renderOrder=30,{object:x,dispose(){d.dispose(),b.dispose()}}}var h=`
varying vec2 vUv;
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * vn(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
void main() {
  float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415926;
  vec3 d = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
  vec3 q = vec3(fbm(d * 1.3 + 3.0), fbm(d * 1.3 + 11.0), fbm(d * 1.3 + 23.0));
  // wisps: stretched, ridged noise, not blobs
  float r = 1.0 - abs(fbm(d * vec3(1.6, 4.5, 1.6) + q * 2.2) * 2.0 - 1.0);
  float wisps = pow(r, 5.0);
  float body = fbm(d * 1.9 + q * 1.4 + 40.0);
  gl_FragColor = vec4(wisps, body, 0.0, 1.0);
}
`;function g({THREE:r,renderer:a,tokens:o,accent:s,quality:c,camera:l}){let u=c.tier===`low`?512:1024,d=new r.WebGLRenderTarget(u,u/2,{depthBuffer:!1,generateMipmaps:!1,minFilter:r.LinearFilter,magFilter:r.LinearFilter});d.texture.wrapS=r.RepeatWrapping;let f=new r.Scene,p=new r.PlaneGeometry(2,2),m=new r.ShaderMaterial({vertexShader:`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:h,depthTest:!1,depthWrite:!1}),g=new r.Mesh(p,m);g.frustumCulled=!1,f.add(g);let _=a.getRenderTarget();a.setRenderTarget(d),a.render(f,new r.OrthographicCamera(-1,1,1,-1,0,1)),a.setRenderTarget(_),p.dispose(),m.dispose();let v=e(o.lineGround),y=s?n(e(o.lineGlow),.28):n(e(o.lineInkSoft),.16),b=s?n(t(e(o.lineGlow),v,.5),.1):n(e(o.lineInkSoft),.06),x=new r.ShaderMaterial({uniforms:{uTime:{value:0},uTex:{value:d.texture},uGround:i(r,v),uTint:i(r,y),uDeep:i(r,b),uRes:{value:new r.Vector2(1,1)}},vertexShader:`varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,fragmentShader:`
      uniform float uTime; uniform sampler2D uTex; uniform vec3 uGround, uTint, uDeep; uniform vec2 uRes;
      varying vec3 vDir;
      vec2 eq(vec3 d) { return vec2(atan(d.x, d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415926 + 0.5); }
      vec3 rotY(vec3 d, float a) { float c = cos(a), s = sin(a); return vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z); }
      void main() {
        vec3 d = normalize(vDir);
        vec4 a = texture2D(uTex, eq(rotY(d, uTime * 0.005)));
        vec4 b = texture2D(uTex, eq(rotY(d.zyx, -uTime * 0.004 + 2.0)));
        float w = a.r * 0.7 + b.r * 0.45;
        float body = smoothstep(0.4, 0.8, a.g) * 0.6 + smoothstep(0.45, 0.85, b.g) * 0.4;
        vec3 c = uGround + uDeep * body + uTint * w * (0.4 + 0.6 * body);
        vec2 s = gl_FragCoord.xy / uRes - 0.5;
        c = mix(uGround, c, 1.0 - 0.65 * smoothstep(0.3, 0.8, length(s * vec2(1.0, 1.25))));
        c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }
    `,side:r.BackSide,depthWrite:!1,depthTest:!1}),S=new r.SphereGeometry(400,48,24),C=new r.Mesh(S,x);return C.frustumCulled=!1,C.renderOrder=-100,{object:C,update(e,t,n){C.position.copy(t.position),x.uniforms.uTime.value=e,x.uniforms.uRes.value.copy(n)},dispose(){S.dispose(),x.dispose(),d.dispose()}}}function _({THREE:n,tokens:i,shared:a,quality:s,accent:c}){let u=s.tier===`low`?150:300,d=new n.InstancedBufferGeometry;d.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),d.setIndex([0,1,2,0,2,3]);let f=new Float32Array(u*3),p=new Float32Array(u),m=new Float32Array(u*3),h=new Float32Array(u),g=e(i.lineInk),_=e(i.lineInkSoft),v=e(i.lineGlow),y=e(i.lineAccent);for(let e=0;e<u;e++){f[e*3]=r(e,1)*34,f[e*3+1]=r(e,2)*34,f[e*3+2]=r(e,3)*34,p[e]=r(e,4),h[e]=.02+.05*r(e,6)**2;let n=r(e,5);m.set(c?n<.5?v:n<.6?y:t(g,_,.5):n<.6?t(g,_,.4):_,e*3)}d.setAttribute(`aP`,new n.InstancedBufferAttribute(f,3)),d.setAttribute(`aSeed`,new n.InstancedBufferAttribute(p,1)),d.setAttribute(`aC`,new n.InstancedBufferAttribute(m,3)),d.setAttribute(`aSize`,new n.InstancedBufferAttribute(h,1)),d.instanceCount=u;let b=l(n,{uniforms:{...a,uBox:{value:34}},vertexShader:o+`
      attribute vec3 aP; attribute float aSeed; attribute vec3 aC; attribute float aSize;
      uniform vec3 uCam; uniform vec3 uVel; uniform float uWarp; uniform float uBox;
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI; varying float vSoft;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.05 + aSeed * 6.0), cos(uTime * 0.04 + aSeed * 9.0), sin(uTime * 0.03 + aSeed * 3.0)) * 0.8;
        vec3 rel = mod(aP + drift - uCam, uBox) - uBox * 0.5;
        float dl = length(rel);
        vec3 H = uCam + rel;
        vec3 Tl = H + uVel * (0.02 + uWarp * 0.3);
        vec3 mid = (H + Tl) * 0.5, dir = H - Tl;
        float len = length(dir);
        vec3 toCam = cameraPosition - mid;
        float d = max(length(toCam), 0.05);
        float ppu = uPx / d;
        float core = max(aSize * ppu, 0.9 * uDpr);
        float coc = clamp(cocPx(d), 0.0, 90.0 * uDpr);
        float wpx = core + coc;
        float wW = wpx / ppu;
        vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 X = len > 1e-4 ? dir / len : camRight;
        vec3 S = cross(X, toCam); S = length(S) < 1e-5 ? camRight : normalize(S);
        float halfLen = len * 0.5 + wW * 1.3;
        vec3 Pw = mid + X * position.x * halfLen + S * position.y * wW * 1.3;
        gl_Position = projectionMatrix * viewMatrix * vec4(Pw, 1.0);
        vL = vec2(position.x * halfLen / wW, position.y * 1.3);
        vHL = len * 0.5 / wW;
        vC = aC;
        vSoft = clamp(coc / (core + 1.0), 0.0, 1.0);
        float energy = min((core * core + 1.0) / (wpx * wpx + 1.0) * 3.0, 1.0);
        float lenDim = 1.0 / (1.0 + len * ppu / (70.0 * uDpr) * (1.0 - uWarp * 0.8));
        vI = (0.55 + 1.6 * uWarp) * energy * lenDim * smoothstep(uBox * 0.5, uBox * 0.3, dl) * smoothstep(0.2, 0.9, dl);
        if (vI < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vL; varying float vHL; varying vec3 vC; varying float vI; varying float vSoft;
      void main() {
        float dx = max(abs(vL.x) - vHL, 0.0);
        float dist = length(vec2(dx, vL.y));
        float sharp = exp(-dist * dist * 3.0);
        float disc = smoothstep(1.0, 0.86, dist) * (0.7 + 0.45 * smoothstep(0.55, 1.0, dist));
        float p = mix(sharp, disc, vSoft);
        gl_FragColor = vec4(vC * p * vI, 1.0);
      }
    `}),x=new n.Mesh(d,b);return x.frustumCulled=!1,x.renderOrder=60,{object:x,dispose(){d.dispose(),b.dispose()}}}function v({THREE:n,tokens:r,shared:a,accent:s}){let c=e(s?r.lineRoute:r.lineInk),u=t(c,[1,1,1],s?.6:1),d=e(s?r.lineRoute:r.lineInk),f=l(n,{uniforms:{...a,uCamS:{value:0},uPulseS:{value:0},uAlpha:{value:0},uLen:{value:1},uCoreR:{value:.03},uHalo:{value:6.5},uHot:i(n,u),uBody:i(n,c),uGlow:i(n,d),uGlowK:{value:s?.34:.22}},vertexShader:o+`
      attribute vec3 aTan; attribute float aSide; attribute float aS;
      uniform float uCoreR; uniform float uHalo;
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide;
      void main() {
        vec3 P = position;
        vec3 toCam = cameraPosition - P;
        float d = length(toCam);
        vec3 N = cross(aTan, toCam);
        N = length(N) < 1e-5 ? vec3(0.0, 1.0, 0.0) : normalize(N);
        float ppu = uPx / max(d, 0.02);
        float coreW = clamp(uCoreR * ppu, 1.8 * uDpr, 4.5 * uDpr);
        float coc = clamp(cocPx(d), 0.0, 90.0 * uDpr);
        float soft = coreW + min(coc * 0.25, 4.0 * uDpr);
        float halfPx = min(soft * uHalo + 3.0 * uDpr, 44.0 * uDpr);
        gl_Position = projectionMatrix * viewMatrix * vec4(P + N * aSide * halfPx / ppu, 1.0);
        soft = min(soft, halfPx);
        vAcross = aSide * halfPx / soft; vS = aS; vSide = aSide;
        vSoft = min(coreW / soft, 1.0);
        vE = mix(0.6, 1.0, vSoft) * mix(0.6, 1.0, smoothstep(0.5, 3.5, d));
      }
    `,fragmentShader:`
      uniform float uTime; uniform float uCamS; uniform float uPulseS; uniform float uAlpha; uniform float uLen; uniform float uGlowK;
      uniform vec3 uHot, uBody, uGlow;
      varying float vAcross; varying float vS; varying float vE; varying float vSoft; varying float vSide;
      void main() {
        float x = abs(vAcross);
        float core = 1.0 - smoothstep(0.35, 1.0, x);
        float bodyP = exp(-x * x * 0.8);
        float halo = exp(-x * 0.7);
        float charged = mix(0.5, 1.0, smoothstep(uPulseS + 0.6, uPulseS - 0.6, vS));
        float pulse = exp(-pow((vS - uPulseS) / 1.1, 2.0));
        float trail = mix(0.6, 1.0, smoothstep(uCamS - 4.0, uCamS - 0.5, vS));
        float ends = smoothstep(0.0, 0.8, vS) * smoothstep(uLen, uLen - 0.4, vS);
        vec3 c = uHot * core * (1.0 + pulse) * vSoft + uBody * bodyP * 0.85 + uGlow * halo * uGlowK + uHot * pulse * bodyP * 0.6;
        c *= 1.0 - smoothstep(0.72, 1.0, abs(vSide));
        c *= vE * charged * trail * mix(0.3, 1.0, ends) * uAlpha;
        gl_FragColor = vec4(c, 1.0);
      }
    `}),p=new n.PlaneGeometry(2,2),m=l(n,{uniforms:{...a,uHead:{value:new n.Vector3},uI:{value:0},uHot:i(n,u)},vertexShader:o+`
      uniform vec3 uHead; uniform float uI; varying vec2 vQ; varying float vPx;
      void main() {
        vec4 mv = viewMatrix * vec4(uHead, 1.0);
        float d = -mv.z;
        if (d < 0.3 || uI <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float ppu = uPx / d;
        float px = clamp(0.09 * ppu, 3.0 * uDpr, 12.0 * uDpr);
        mv.xy += position.xy * px * 6.0 / ppu;
        gl_Position = projectionMatrix * mv;
        vQ = position.xy * 6.0; vPx = px;
      }
    `,fragmentShader:`
      uniform float uI; uniform vec3 uHot; varying vec2 vQ;
      void main() {
        float r = length(vQ);
        float blob = exp(-r * r * 1.4);
        float glow = exp(-r * 0.9) * 0.3;
        float spikes = exp(-abs(vQ.y) * 5.0) * exp(-abs(vQ.x) * 0.5) + exp(-abs(vQ.x) * 5.0) * exp(-abs(vQ.y) * 0.5);
        gl_FragColor = vec4((uHot * (glow + spikes * 0.35) + vec3(1.0) * blob) * uI, 1.0);
      }
    `}),h=new n.Mesh(p,m);h.frustumCulled=!1,h.renderOrder=45;let g=null,_=null,v=null,y=null,b=0,x=0,S=!1,C=0,w=new n.Group;w.add(h);function T(){g&&(w.remove(g),_.dispose(),g=null,_=null)}function E(e){if(T(),S=!1,!e||e.length<2){v=null,b=0;return}let t=e.length;v=e,y=new Float32Array(t);for(let n=1;n<t;n++)y[n]=y[n-1]+e[n].distanceTo(e[n-1]);b=y[t-1];let r=new Float32Array(t*6),i=new Float32Array(t*6),a=new Float32Array(t*2),o=new Float32Array(t*2),s=new n.Vector3;for(let n=0;n<t;n++){s.subVectors(e[Math.min(n+1,t-1)],e[Math.max(n-1,0)]).normalize();for(let t=0;t<2;t++){let c=n*2+t;r[c*3]=e[n].x,r[c*3+1]=e[n].y,r[c*3+2]=e[n].z,i[c*3]=s.x,i[c*3+1]=s.y,i[c*3+2]=s.z,a[c]=t?1:-1,o[c]=y[n]}}let c=[];for(let e=0;e<t-1;e++){let t=e*2;c.push(t,t+1,t+3,t,t+3,t+2)}_=new n.BufferGeometry,_.setAttribute(`position`,new n.BufferAttribute(r,3)),_.setAttribute(`aTan`,new n.BufferAttribute(i,3)),_.setAttribute(`aSide`,new n.BufferAttribute(a,1)),_.setAttribute(`aS`,new n.BufferAttribute(o,1)),_.setIndex(c),g=new n.Mesh(_,f),g.frustumCulled=!1,g.renderOrder=40,w.add(g),f.uniforms.uLen.value=b,x=0,C=1,f.uniforms.uAlpha.value=1,f.uniforms.uPulseS.value=0}function D(){g&&(S=!0)}function O(e,t){if(m.uniforms.uI.value=0,!g)return;if(S&&(C=Math.max(0,C-e/.7),f.uniforms.uAlpha.value=C,C<=0)){T(),v=null;return}let n=1/0,r=0;for(let e=0;e<v.length;e++){let i=v[e].distanceToSquared(t.position);i<n&&(n=i,r=e)}n<6.25&&(x=Math.max(x,y[r]));let i=t.travelling?t.progress:1,a=1-(1-Math.min(i/.55,1))**2.2,o=Math.min(b,Math.max(b*a,x+4.5));if(S||(f.uniforms.uPulseS.value=o),f.uniforms.uCamS.value=x,!S&&o<b-.01){let e=Math.max(0,y.findIndex(e=>e>=o));m.uniforms.uHead.value.copy(v[e]),m.uniforms.uI.value=C}}return{object:w,set:E,clear:D,update:O,dispose(){T(),f.dispose(),p.dispose(),m.dispose()}}}function y({THREE:e,scene:t,camera:n,renderer:r,network:i,tokens:o,quality:s,accent:c=1}){t.background=new e.Color(o.lineGround),t.fog=null,c=+!!c;let l=a(e);l.uFocusId={value:-1},l.uFocusAmt={value:0};let u={THREE:e,renderer:r,camera:n,network:i,tokens:o,shared:l,quality:s,accent:c},d=g(u),f=p(u),h=m(u),y=_(u),b=v(u),x=new e.Group;x.add(d.object,...f.objects,h.object,y.object,b.object),t.add(x);let S=new Map(i.nodes.map((e,t)=>[e.id,t])),C=-1,w=0,T=12,E=!1,D=new e.Vector2,O=new e.Vector3,k=new e.Vector3;return{setRoute(e){!e||e.length<2?b.clear():b.set(e)},setFocus(e){let t=e==null?-1:S.get(e)??-1;t!==C&&(C=t,w=0),l.uFocusId.value=t,t>=0?l.uFocusPos.value.fromArray(i.nodes[t].pos):l.uFocusPos.value.set(1e6,0,0)},update(e,t,i){r.getDrawingBufferSize(D),l.uTime.value=e,l.uDpr.value=r.getPixelRatio(),l.uPx.value=n.projectionMatrix.elements[5]*D.y/2,l.uNearK.value=.022*D.y,l.uFarK.value=.012*D.y,l.uCam.value.copy(i.position);let a=i.focus??12;T+=(a-T)*(1-Math.exp(-t*6)),l.uFocus.value=T,w+=((i.travelling?.4:1)-w)*(1-Math.exp(-t*2.5)),l.uFocusAmt.value=w,l.uRest.value+=(+!i.travelling-l.uRest.value)*(1-Math.exp(-t*(i.travelling?5:1.5))),E&&t>1e-4&&(k.subVectors(i.position,O).divideScalar(t),(k.length()>200||!(i.speed>.01))&&k.set(0,0,0),l.uVel.value.lerp(k,1-Math.exp(-t*12))),O.copy(i.position),E=!0,l.uWarp.value=i.warp||0,d.update(e,i,D),b.update(t,i)},dispose(){t.remove(x);for(let e of[d,f,h,y,b])e.dispose()}}}export{y as createSkin};