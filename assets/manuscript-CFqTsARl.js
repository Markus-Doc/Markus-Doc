function e(e,t){let n=t.replace(`#`,``);return new e.Vector3(parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255)}var t=(e,t,n,r)=>new e.Vector3().copy(t).lerp(n,r);function n(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function r(e){return{uTime:{value:0},uRes:{value:new e.Vector2(1,1)},uDpr:{value:1},uPxK:{value:800},uFocus:{value:12},uAperture:{value:5},uFogNear:{value:16},uFogFar:{value:80},uWarp:{value:0},uSpeed:{value:0}}}var i=`
uniform float uTime, uDpr, uPxK, uFocus, uAperture, uFogNear, uFogFar, uWarp, uSpeed;
uniform vec2 uRes;
float fogAmt(float z) { float f = smoothstep(uFogNear, uFogFar, z); return f * (2.0 - f); }
// Circle of confusion in device px: sharp at uFocus, growing fast toward the lens.
float cocPx(float z) { return min(uAperture * uDpr * abs(z - uFocus) / max(z, 0.05), 46.0 * uDpr); }
float nearFade(float z, float a, float b) { return smoothstep(a, b, z); }
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
`;function o({THREE:n,tokens:r,shared:i,quality:a}){let o=e(n,r.sceneBg),s=e(n,r.fog),c=e(n,r.nodeRing),l=e(n,r.edge),u=new n.BufferGeometry;u.setAttribute(`position`,new n.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let d=new n.ShaderMaterial({depthTest:!1,depthWrite:!1,uniforms:{...i,uBg:{value:o},uFog:{value:s},uEdgeTone:{value:t(n,o,c,.22)},uFoxing:{value:t(n,o,c,.1)},uInk:{value:l},uInvProj:{value:new n.Matrix4},uCamRot:{value:new n.Matrix4},uHigh:{value:a.tier===`low`?0:1}},vertexShader:`
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
      }`}),f=new n.Mesh(u,d);return f.frustumCulled=!1,f.renderOrder=-100,{object:f,update(e){d.uniforms.uInvProj.value.copy(e.projectionMatrixInverse),d.uniforms.uCamRot.value.extractRotation(e.matrixWorld)},dispose(){u.dispose(),d.dispose()}}}function s({THREE:t,network:r,tokens:o,shared:s,quality:c}){let l=c.tier===`low`?3:6,u=new t.InstancedBufferGeometry,d=[],f=[];for(let e=0;e<=l;e++)d.push(e/l,-1,e/l,1);for(let e=0;e<l;e++){let t=e*2;f.push(t,t+1,t+2,t+1,t+3,t+2)}u.setAttribute(`position`,new t.BufferAttribute(new Float32Array((l+1)*2*3),3)),u.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(d),2)),u.setIndex(f);let p=r.edges,m=r.nodes.map(e=>e.pos),h=p.length,g=new Float32Array(h*3),_=new Float32Array(h*3),v=new Float32Array(h*2),y=n(7331);p.forEach(([e,t],n)=>{g.set(m[e],n*3),_.set(m[t],n*3);let r=y();v[n*2]=r<.12?1.55:r<.5?1.1:.85,v[n*2+1]=y()*100}),u.setAttribute(`aA`,new t.InstancedBufferAttribute(g,3)),u.setAttribute(`aB`,new t.InstancedBufferAttribute(_,3)),u.setAttribute(`aW`,new t.InstancedBufferAttribute(v,2)),u.instanceCount=h;let b=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...s,uInk:{value:e(t,o.edge)},uAlpha:{value:o.edgeAlpha}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aA, aB; attribute vec2 aW;
      varying float vAlpha; varying vec3 vRib;
      void main() {
        vec3 P = mix(aA, aB, seg.x);
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        // pressure: slow wobble along the stroke, never below 0.55
        float pr = 0.78 + 0.22 * sin(aW.y + seg.x * (2.0 + mod(aW.y, 3.0)));
        // Near wires (within about 12 units) are drawn with a nib of at least 2.4 px and
        // a solid core, so their rendered pixels reach 3:1 on the parchment (a thinner
        // antialiased stroke never reaches its token contrast at any pixel). Pressure
        // then varies their width, not their ink, and near blur is held back. Further
        // out the strokes thin and fade as before, as the depth cue.
        float near = 1.0 - smoothstep(10.0, 16.0, z);
        float nib = uDpr * aW.x * mix(1.7, 0.75, smoothstep(1.5, 34.0, z)) * mix(0.8, 1.1, pr);
        nib = max(nib, near * uDpr * mix(2.4, 3.0, pr - 0.56));
        float coc = cocPx(z) * 0.55 * (1.0 - 0.8 * near);
        float w = nib + coc;
        float halfPx = w * 0.5 + 1.0;
        float zz;
        gl_Position = ribbonClip(P, normalize(aB - aA), halfPx, seg.y, zz);
        float fog = fogAmt(z);
        vAlpha = mix(pr, 1.0, near) * pow(nib / w, 1.3) * (1.0 - fog * 0.94) * nearFade(z, 0.25, 1.1);
        vRib = vec3(seg.y * halfPx, halfPx, 1.0) * gl_Position.w;
      }`,fragmentShader:i+`
      uniform vec3 uInk; uniform float uAlpha;
      varying float vAlpha; varying vec3 vRib;
      void main() {
        float vHalf = vRib.y / vRib.z, d = abs(vRib.x / vRib.z);   // px from the stroke centre
        float a = clamp(vHalf - 0.5 - d, 0.0, 1.0);
        a = a * vAlpha * uAlpha * 1.35;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uInk * a, a);
      }`}),x=new t.Mesh(u,b);return x.frustumCulled=!1,x.renderOrder=1,{object:x,dispose(){u.dispose(),b.dispose()}}}var c={junction:0,leaf:1,hub:2,core:3,soon:4};function l({THREE:r,network:a,tokens:o,shared:s}){let l=a.nodes,u=l.length,d=new r.InstancedBufferGeometry,f=new r.PlaneGeometry(2,2);d.index=f.index,d.setAttribute(`position`,f.getAttribute(`position`));let p=new Float32Array(u*3),m=new Float32Array(u*4),h=new Float32Array(u),g=n(90210);l.forEach((e,t)=>{p.set(e.pos,t*3),m.set([e.radius,c[e.kind]??0,g(),t],t*4)}),d.setAttribute(`aPos`,new r.InstancedBufferAttribute(p,3)),d.setAttribute(`aInfo`,new r.InstancedBufferAttribute(m,4));let _=new r.InstancedBufferAttribute(h,1);_.setUsage(r.DynamicDrawUsage),d.setAttribute(`aRoute`,_),d.instanceCount=u;let v=e(r,o.node),y=e(r,o.panel),b=e(r,o.hub),x=Array.from({length:6},()=>new r.Vector4(-1,-99,0,0)),S=new r.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!0,premultipliedAlpha:!0,uniforms:{...s,uInk:{value:v},uPaper:{value:y},uBrass:{value:b},uUmber:{value:e(r,o.nodeRing)},uSage:{value:e(r,o.core)},uSageDeep:{value:t(r,e(r,o.core),v,.55)},uSoon:{value:e(r,o.soon)},uCopper:{value:e(r,o.route)},uCopperLit:{value:e(r,o.routeGlow)},uBrassLit:{value:t(r,b,e(r,o.routeGlow),.35)},uNeonA:{value:e(r,o.neon[0])},uNeonB:{value:e(r,o.neon[1])},uFocusIdx:{value:-1},uFocusT:{value:0},uRouteT:{value:0},uHits:{value:x}},vertexShader:i+`
      attribute vec3 aPos; attribute vec4 aInfo; attribute float aRoute;
      uniform float uFocusIdx;
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vIdx, vRoute, vFocus;
      void main() {
        float kind = aInfo.y;
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
        float z = -mv.z;
        float fade = nearFade(z, 0.7 + aInfo.x * 1.2, 1.9 + aInfo.x * 2.4);
        if (z < 0.05 || fade < 0.002) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float focus = abs(aInfo.w - uFocusIdx) < 0.5 ? 1.0 : 0.0;
        float rPx = aInfo.x * uPxK / z;
        // Lens pass: as a node swells toward the lens it shrinks back and fades out,
        // so a flash-by reads as a quick ink shape rather than a blot. Junctions go
        // early; content nodes a little later; the resting node never.
        float sz = rPx / min(uRes.x, uRes.y);
        float lens = kind < 0.5 ? smoothstep(0.035, 0.085, sz) : smoothstep(0.1, 0.19, sz) * (1.0 - focus);
        if (lens > 0.995) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        rPx *= 1.0 - 0.4 * lens;
        rPx = max(rPx, (kind < 0.5 ? 1.25 : 2.6) * uDpr);
        float ext = kind < 0.5 ? 2.35 : kind < 2.5 ? 1.7 : kind < 3.5 ? 1.95 : 1.4;
        ext = max(ext, focus * 1.9);
        // near the lens the blur stays tight: a crisp shape that fades, not a soft disc
        float coc = z < uFocus ? min(cocPx(z), 3.0 * uDpr + 0.12 * rPx) : cocPx(z);
        float quad = min(rPx * ext + coc + 2.0 * uDpr, uRes.y * 0.5);
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
        vRoute = aRoute; vFocus = focus;
        vAlpha = fade * (1.0 - lens) * (1.0 - fogAmt(z) * 0.95 * (1.0 - focus)) / (1.0 + stretch * 1.5) * mix(1.0, 0.5, smoothstep(6.0 * uDpr, 40.0 * uDpr, coc));
      }`,fragmentShader:i+`
      uniform vec3 uInk, uPaper, uBrass, uUmber, uSage, uSageDeep, uSoon, uCopper, uCopperLit, uBrassLit, uNeonA, uNeonB;
      uniform float uFocusT, uRouteT;
      uniform vec4 uHits[6];
      varying vec2 vUv; varying float vR, vBlur, vAlpha, vKind, vSeed, vIdx, vRoute, vFocus;
      vec4 acc = vec4(0.0);
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
          if (vSeed < 0.14) {
            over(jInk, disc(d, r * 0.55) * 0.95);
            over(jInk, ringAt(d, r * 1.25, thin) * 0.8);
          } else {
            over(jInk, disc(d, r) * 0.95);
          }
          over(uCopper, disc(d, r * 0.5) * st * (1.0 - 0.7 * smoothstep(20.0 * px, 80.0 * px, r)));
          if (vSeed > 0.3 || st > 0.0) over(mix(jInk, uCopper, st), ringAt(d, r * 1.9, thin * (1.0 + st * 0.4)) * mix(0.55, 0.9, st));
          if (vSeed > 0.74) over(jInk, ringAt(d, r * 2.3, thin * 0.8) * 0.38);
        } else if (vKind < 2.5) {
          // leaf and hub medallions
          bool hub = vKind > 1.5;
          // a thought the route threads through: the disc turns solid so the wire
          // tucks under it at the rim, and the rim takes the copper of the route
          float st = vRoute > 0.5 ? uRouteT : 0.0;
          over(uPaper, disc(d, r) * mix(0.88, 1.0, st));
          over(uInk, disc(d, r * 0.34) * 0.95);
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
          // core: sage glass nucleus with brass orbits
          vec2 p = vUv / r; float l2 = dot(p, p);
          float bk1, bk2;
          float o1 = orbit(vUv, r * 1.42, 0.35 + uTime * 0.06, 0.34, bk1);
          float o2 = orbit(vUv, r * 1.7, -0.6 - uTime * 0.045, 0.22, bk2);
          float oth = max(1.7 * px, r * 0.04);
          bool inside = l2 < 1.0;
          // orbits behind the glass first
          over(uBrass, ring(o1, oth) * (bk1 > 0.5 && inside ? 0.35 : 0.0));
          over(uBrass, ring(o2, oth * 0.8) * (bk2 > 0.5 && inside ? 0.3 : 0.0));
          // soft sage halo
          over(uSage, (1.0 - smoothstep(r, r * 1.9, d)) * 0.22 * step(1.0, l2));
          // glass body
          float nz = sqrt(max(1.0 - l2, 0.0));
          vec3 n = vec3(p, nz);
          float lit = dot(n, normalize(vec3(-0.45, 0.55, 0.7)));
          float fres = pow(1.0 - nz, 2.2);
          vec3 glass = mix(uSageDeep, uSage, smoothstep(-0.3, 0.8, lit));
          glass = mix(glass, uSageDeep, fres * 0.9);
          float caustic = smoothstep(0.35, 0.0, abs(length(p - vec2(0.12, -0.12)) - 0.62)) * step(0.0, -p.y + p.x * 0.3);
          glass = mix(glass, uPaper, caustic * 0.28);
          float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n), normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 28.0);
          glass = mix(glass, uPaper, spec * 0.85);
          over(glass, disc(d, r) * 0.93);
          // nucleus: a small brass orb held in the glass
          over(uBrass, disc(length(vUv - vec2(r * 0.04, -r * 0.03)), r * 0.24) * 0.9);
          over(uPaper, disc(length(vUv - vec2(-r * 0.06, r * 0.07)), r * 0.07) * 0.6);
          over(uInk, ringAt(d, r, max(1.3 * px, r * 0.035)) * 0.9);
          // orbits in front
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
              vec3 c = h.z < 0.5 ? uNeonA : uNeonB;
              float k = exp(-t * 3.0);
              float Rr = max(r, 2.5 * px) * (1.2 + t * 2.4) + 2.0 * px;
              over(c, ringAt(d, Rr, 1.6 * px + min(r, 12.0 * px) * 0.1) * k);
              over(c, ringAt(d, r, clamp(r * 0.12, 1.4 * px, 3.0 * px)) * k);
              over(c, disc(d, min(max(r * 0.5, 2.0 * px), 7.0 * px)) * k * 0.9);
            }
          }
        }
        acc *= vAlpha;
        if (acc.a < 0.003) discard;
        // a thought the route threads through always sits over the wire, so the
        // wire tucks under its rim going in and coming out, whatever the angle
        gl_FragDepth = vKind > 0.5 && vRoute > 0.5 && uRouteT > 0.01 ? 0.0 : gl_FragCoord.z;
        gl_FragColor = acc;
      }`}),C=new r.Mesh(d,S);C.frustumCulled=!1,C.renderOrder=4;let w=0;return{object:C,uniforms:S.uniforms,setRouteNodes(e){if(h.fill(0),e)for(let t of e)h[t]=1;_.needsUpdate=!0},hit(e,t,n){x[w].set(e,t,n,0),w=(w+1)%6},dispose(){d.dispose(),f.dispose(),S.dispose()}}}var u=`
uniform vec2 uPulse;
float pulseAt(float s) {
  float p = 0.0;
  for (int i = 0; i < 2; i++) { float ds = s - uPulse[i]; p = max(p, ds > 0.0 ? exp(-ds * ds * 0.9) : exp(ds * 0.45) * 0.8); }
  return p;
}
`;function d({THREE:n,tokens:r,shared:o}){let s=e(n,r.route),c=e(n,r.routeGlow),l=new n.ShaderMaterial({transparent:!0,depthWrite:!0,depthTest:!0,premultipliedAlpha:!0,side:n.DoubleSide,uniforms:{...o,uCopper:{value:s},uGlow:{value:c},uDeep:{value:t(n,s,e(n,r.ink),.45)},uSheen:{value:t(n,c,e(n,r.panel),.55)},uHot:{value:t(n,c,e(n,r.panel),.45)},uReveal:{value:0},uFade:{value:0},uLen:{value:1},uCamS:{value:0},uPulse:{value:new n.Vector2(-99,-99)}},vertexShader:i+a+u+`
      attribute vec3 aTan; attribute float aS, aSide;
      varying float vS, vZ;
      varying vec4 vLin;
      void main() {
        float z = max(-(modelViewMatrix * vec4(position, 1.0)).z, 0.02);
        float pv = pulseAt(aS) * smoothstep(3.0, 9.0, z);  // no swelling right under the lens
        // core half width: a real wire in world units, never thinner than a bold
        // pen stroke and never a blob under the lens. The signal swells it a little.
        // the glow stays close round the wire, so a clear band of parchment frames it
        float corePx = clamp(0.034 * uPxK / z, 2.3 * uDpr, 0.026 * min(uRes.x, uRes.y)) * (1.0 + 0.45 * pv);
        float haloPx = min(corePx * 3.4, corePx + 16.0 * uDpr) * (1.0 + 0.6 * pv);
        float halfPx = haloPx + 1.5;
        float zz;
        gl_Position = ribbonClip(position, aTan, halfPx, aSide, zz);
        // across-the-wire values must interpolate linearly on screen, or the
        // edges scallop between samples: carry them multiplied by w
        float w = gl_Position.w;
        vLin = vec4(aSide * halfPx, corePx, haloPx, 1.0) * w;
        vS = aS; vZ = z;
      }`,fragmentShader:i+u+`
      uniform vec3 uCopper, uGlow, uDeep, uSheen, uHot;
      uniform float uReveal, uFade, uLen, uCamS;
      varying float vS, vZ;
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
        over(uGlow, g * (0.3 + 0.55 * p));
        // the wire: inked edge, copper body, sheen
        float body = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, x);
        float nz = sqrt(max(1.0 - x * x, 0.0));
        vec3 c = mix(uDeep, uCopper, smoothstep(0.0, 0.55, nz));
        float sheen = exp(-pow((vX + 0.32) * 4.2, 2.0));
        c = mix(c, uSheen, sheen * 0.55);
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
      }`}),d=null,f=null,p=null,m=null,h=0,g=0,_=`off`,v=0,y=0,b=0,x=[-99,-99],S=new n.Group;function C(e){let t=e.length,r=new Float32Array(t*2*3),i=new Float32Array(t*2*3),a=new Float32Array(t*2),o=new Float32Array(t*2);m=new Float32Array(t);let s=0;for(let c=0;c<t;c++){c&&(s+=e[c].distanceTo(e[c-1])),m[c]=s;let l=e[Math.max(c-1,0)],u=e[Math.min(c+1,t-1)],d=new n.Vector3().subVectors(u,l).normalize();for(let t=0;t<2;t++){let n=c*2+t;r.set([e[c].x,e[c].y,e[c].z],n*3),i.set([d.x,d.y,d.z],n*3),a[n]=s,o[n]=t?1:-1}}let c=[];for(let e=0;e<t-1;e++){let t=e*2;c.push(t,t+1,t+2,t+1,t+3,t+2)}f=new n.BufferGeometry,f.setAttribute(`position`,new n.BufferAttribute(r,3)),f.setAttribute(`aTan`,new n.BufferAttribute(i,3)),f.setAttribute(`aS`,new n.BufferAttribute(a,1)),f.setAttribute(`aSide`,new n.BufferAttribute(o,1)),f.setIndex(c),d=new n.Mesh(f,l),d.frustumCulled=!1,d.renderOrder=3,S.add(d),p=e,h=s,g=0}function w(){d&&(S.remove(d),f.dispose(),d=null,f=null,p=null)}return{object:S,get active(){return _===`on`},reset(){w(),_=`off`},set(e,t){if(!e||e.length<2){d&&(_=`fading`,y=0);return}w(),C(e),_=`on`,v=t,x[0]=-99,x[1]=-99,l.uniforms.uLen.value=h,l.uniforms.uFade.value=1,l.uniforms.uCamS.value=0},update(e,t,n){if(!d)return;let r=l.uniforms;if(_===`fading`&&(y+=t,r.uFade.value=Math.max(0,1-y/.35),y>=.35)){w(),_=`off`;return}if(r.uReveal.value=Math.min(h+2,(e-v)*Math.max(60,h*2.2)),n.travelling){let e=g,t=1/0;for(let r=g;r<Math.min(g+16,p.length);r++){let i=p[r].distanceToSquared(n.position);i<t&&(t=i,e=r)}g=e}let i=m[g];if(r.uCamS.value=i,_===`on`&&n.travelling){b+=(16+n.speed*.4)*t;let e=Math.max(Math.min(h-i-2.5,36),5);for(let t=0;t<2;t++)x[t]=i+2.5+(b+t*e/2)%e}else _!==`on`&&(x[0]=x[1]=-99);r.uPulse.value.set(x[0],x[1])},dispose(){w(),l.dispose()}}}function f({THREE:t,network:r,tokens:o,shared:s,quality:c,nodes:l}){let u=c.tier===`low`?3:6,d=new t.InstancedBufferGeometry,f=[],p=[];for(let e=0;e<=8;e++)f.push(e/8,-1,e/8,1);for(let e=0;e<8;e++){let t=e*2;p.push(t,t+1,t+2,t+1,t+3,t+2)}d.setAttribute(`position`,new t.BufferAttribute(new Float32Array(54),3)),d.setAttribute(`seg`,new t.BufferAttribute(new Float32Array(f),2)),d.setIndex(p);let m=new Float32Array(u*3),h=new Float32Array(u*3),g=new Float32Array(u*4).fill(-99),_=new t.InstancedBufferAttribute(m,3),v=new t.InstancedBufferAttribute(h,3),y=new t.InstancedBufferAttribute(g,4);for(let e of[_,v,y])e.setUsage(t.DynamicDrawUsage);d.setAttribute(`aA`,_),d.setAttribute(`aB`,v),d.setAttribute(`aT`,y),d.instanceCount=u;let b=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...s,uNeonA:{value:e(t,o.neon[0])},uNeonB:{value:e(t,o.neon[1])},uPaper:{value:e(t,o.panel)}},vertexShader:i+a+`
      attribute vec2 seg; attribute vec3 aA, aB; attribute vec4 aT; // start, duration, colour, trail fraction
      varying float vAlpha, vHead, vCol; varying vec3 vRib;
      void main() {
        float u = (uTime - aT.x) / aT.y;
        if (u < 0.0 || u > 1.0 + aT.w) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float head = clamp(u, 0.0, 1.0), tail = clamp(u - aT.w, 0.0, 1.0);
        vec3 P = mix(aA, aB, mix(head, tail, seg.x));
        float z = max(-(modelViewMatrix * vec4(P, 1.0)).z, 0.02);
        float core = uDpr * mix(3.2, 0.8, sqrt(seg.x)) * mix(1.6, 1.0, smoothstep(2.0, 20.0, z)) + cocPx(z) * 0.3;
        float vHalf = core * 3.0 + 1.0;
        float zz;
        gl_Position = ribbonClip(P, normalize(aB - aA), vHalf, seg.y, zz);
        vRib = vec3(seg.y * vHalf, vHalf, 1.0) * gl_Position.w; vHead = 1.0 - seg.x; vCol = aT.z;
        vAlpha = (1.0 - fogAmt(z) * 0.9) * nearFade(z, 0.4, 1.4);
      }`,fragmentShader:i+`
      uniform vec3 uNeonA, uNeonB, uPaper;
      varying float vAlpha, vHead, vCol; varying vec3 vRib;
      void main() {
        vec3 c = vCol < 0.5 ? uNeonA : uNeonB;
        float vHalf = vRib.y / vRib.z, d = abs(vRib.x / vRib.z), core = (vHalf - 1.0) / 3.0;
        float body = clamp(core * 0.5 + 0.5 - d, 0.0, 1.0);
        float glow = exp(-pow(d / (core * 1.5 + 0.5), 2.0)) * 0.6;
        float trail = pow(vHead, 1.3);
        vec3 col = mix(c, uPaper, pow(vHead, 12.0) * body * 0.45);
        float a = max(body, glow) * trail * vAlpha;
        if (a < 0.003) discard;
        gl_FragColor = vec4(col * a, a);
      }`}),x=new t.Mesh(d,b);x.frustumCulled=!1,x.renderOrder=5;let S=r.nodes.map(e=>new t.Vector3(...e.pos)),C=r.nodes.map(()=>[]);r.edges.forEach(([e,t])=>{C[e].push(t),C[t].push(e)});let w=n(4242),T=Array.from({length:u},(e,t)=>({busy:!1,next:.6+t*.9+w()*1.5,to:-1,end:0,colour:0,hops:0})),E=new t.Vector3,D=new t.Vector3;function O(e,t,n,r,i){let a=T[e],o=S[t].distanceTo(S[n]),s=o/13;m.set(S[t].toArray(),e*3),h.set(S[n].toArray(),e*3),g.set([r,s,i,Math.min(4.5/Math.max(o,.1),.9)],e*4),Object.assign(a,{busy:!0,to:n,end:r+s,colour:i}),_.needsUpdate=v.needsUpdate=y.needsUpdate=!0}function k(e){e.getWorldDirection(E);for(let t=0;t<60;t++){let[t,n]=r.edges[Math.floor(w()*r.edges.length)];D.addVectors(S[t],S[n]).multiplyScalar(.5).sub(e.position);let i=D.length();if(i>4&&i<30&&D.dot(E)>i*.55)return w()<.5?[t,n]:[n,t]}return null}return{object:x,update(e,t,n,r){for(let t=0;t<u;t++){let n=T[t];if(n.busy&&e>=n.end){if(l.hit(n.to,e,n.colour),n.busy=!1,n.hops++,n.hops<3&&w()<.6){let r=C[n.to];O(t,n.to,r[Math.floor(w()*r.length)],e,n.colour);continue}n.next=e+1.2+w()*3.5,n.hops=0}if(!n.busy&&e>=n.next){let i=k(r);i?O(t,i[0],i[1],e,w()<.55?0:1):n.next=e+.5}}},dispose(){d.dispose(),b.dispose()}}}function p({THREE:t,tokens:r,shared:a,quality:o}){let s=o.tier===`low`?320:640,c=n(1618),l=new Float32Array(s*3),u=new Float32Array(s*2);for(let e=0;e<s;e++)l.set([c()*30,c()*30,c()*30],e*3),u.set([c(),c()],e*2);let d=new t.BufferGeometry;d.setAttribute(`position`,new t.BufferAttribute(l,3)),d.setAttribute(`aS`,new t.BufferAttribute(u,2));let f=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,uniforms:{...a,uCam:{value:new t.Vector3},uBox:{value:30},uInk:{value:e(t,r.edge)},uBrass:{value:e(t,r.hub)}},vertexShader:i+`
      uniform vec3 uCam; uniform float uBox;
      attribute vec2 aS;
      varying float vA, vCore, vSize, vKind;
      void main() {
        vec3 drift = vec3(sin(uTime * 0.07 + aS.x * 40.0), cos(uTime * 0.05 + aS.y * 30.0), sin(uTime * 0.06 + aS.x * 17.0)) * 0.6;
        vec3 rel = mod(position + drift - uCam + uBox * 0.5, uBox) - uBox * 0.5;
        vec4 mv = viewMatrix * vec4(uCam + rel, 1.0);
        float z = -mv.z;
        if (z < 0.1) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float core = uDpr * (aS.y > 0.93 ? 2.2 : 0.9 + aS.x * 0.9);
        float coc = cocPx(z) * 1.3;
        float size = min(core + coc + 1.5 * uDpr, 70.0 * uDpr);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size;
        float edge = 1.0 - smoothstep(uBox * 0.32, uBox * 0.5, length(rel));
        vA = edge * nearFade(z, 0.25, 0.9) * (core * core) / ((core + coc) * (core + coc)) * mix(0.55, 0.9, aS.x);
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
      }`}),p=new t.Points(d,f);return p.frustumCulled=!1,p.renderOrder=6,{object:p,update(e,t,n,r){f.uniforms.uCam.value.copy(r.position)},dispose(){d.dispose(),f.dispose()}}}function m({THREE:t,tokens:r,shared:a,quality:o}){let s=o.tier===`low`?36:72,c=new t.InstancedBufferGeometry;c.setAttribute(`position`,new t.BufferAttribute(new Float32Array(12),3)),c.setAttribute(`seg`,new t.BufferAttribute(new Float32Array([0,-1,0,1,1,-1,1,1]),2)),c.setIndex([0,1,2,1,3,2]);let l=n(5150),u=new Float32Array(s*4);for(let e=0;e<s;e++){let t=1.6+l()**.8*8.5;u.set([l()*Math.PI*2,t,l()*70,l()],e*4)}c.setAttribute(`aD`,new t.InstancedBufferAttribute(u,4)),c.instanceCount=s;let d=new t.ShaderMaterial({transparent:!0,depthWrite:!1,depthTest:!1,premultipliedAlpha:!0,side:t.DoubleSide,uniforms:{...a,uFlow:{value:0},uInk:{value:e(t,r.edge)},uCopper:{value:e(t,r.route)}},vertexShader:i+`
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
      }`}),f=new t.Mesh(c,d);return f.frustumCulled=!1,f.renderOrder=7,f.visible=!1,{object:f,update(e,t,n){f.visible=(n.warp||0)>.01,d.uniforms.uFlow.value+=t*(n.speed||0)*1.6},dispose(){c.dispose(),d.dispose()}}}var h=6.5;function g({THREE:e,scene:t,camera:n,renderer:i,network:a,tokens:c,quality:u}){t.background=new e.Color(c.sceneBg),t.fog=null;let g=r(e),_={THREE:e,network:a,tokens:c,quality:u,shared:g},v=new e.Group;v.name=`manuscript-skin`;let y=o(_),b=s(_),x=l(_),S=d(_),C=f({..._,nodes:x}),w=p(_),T=m(_);for(let e of[y,b,x,S,C,w,T])v.add(e.object);t.add(v),S.set([new e.Vector3(0,0,-900),new e.Vector3(0,.1,-900)],0),T.object.visible=!0,i.compile(t,n),S.reset(),T.object.visible=!1;let E=new Map(a.nodes.map((e,t)=>[e.id,t])),D=new e.Vector2,O=new e.Vector3,k=-1,A=0;function j(e){if(!e){x.setRouteNodes(null);return}let t=new Set;a.nodes.forEach((n,r)=>{O.fromArray(n.pos);for(let n=0;n<e.length;n+=2)if(e[n].distanceToSquared(O)<1.44){t.add(r);break}}),x.setRouteNodes(t)}return{setRoute(e){S.set(e,A),e&&e.length>1&&j(e)},setFocus(e){k=e!=null&&E.has(e)?E.get(e):-1,x.uniforms.uFocusIdx.value=k,x.uniforms.uFocusT.value=0},update(e,t,r){A=e,n.updateMatrixWorld(),i.getDrawingBufferSize(D);let o=g;o.uTime.value=e,o.uRes.value.copy(D),o.uDpr.value=i.getPixelRatio(),o.uPxK.value=D.y/2/Math.tan(n.fov*Math.PI/360),o.uWarp.value=r.warp||0,o.uSpeed.value=r.speed||0;let s=h;!r.travelling&&k>=0&&(s=O.fromArray(a.nodes[k].pos).distanceTo(n.position)),o.uFocus.value+=(s-o.uFocus.value)*(1-Math.exp(-t*4)),o.uAperture.value+=((r.travelling?4.5:3.2)-o.uAperture.value)*(1-Math.exp(-t*3));let c=Math.max(o.uFocus.value-35,0);o.uFogNear.value=16+c*.9,o.uFogFar.value=80+c*1.4;let l=x.uniforms;l.uFocusT.value=Math.min(1,l.uFocusT.value+t*(r.travelling?.5:1.6)),l.uRouteT.value=S.active?Math.min(1,l.uRouteT.value+t*3):Math.max(0,l.uRouteT.value-t*1.5),y.update(n),S.update(e,t,r),C.update(e,t,r,n),w.update(e,t,r,n),T.update(e,t,r,n)},dispose(){t.remove(v);for(let e of[y,b,x,S,C,w,T])e.dispose();t.background=null}}}export{g as createSkin};