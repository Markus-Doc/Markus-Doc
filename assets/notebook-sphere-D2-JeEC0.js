function e({THREE:e,R:t,loader:n,base:r,maxAniso:i}){let a=new e.SphereGeometry(t,96,64),o=(t,n,r)=>new e.Vector3(t/255,n/255,r/255),s={uTex:{value:null},uHasTex:{value:0},uTint:{value:o(184,168,141)},uWarm:{value:o(114,96,72)},uLit:{value:o(197,181,153)},uCam:{value:new e.Vector3},uToCore:{value:new e.Vector3(0,0,-1)},uScale:{value:1/150},uPool:{value:.7},uVig:{value:.9}},c=new e.ShaderMaterial({side:e.BackSide,depthWrite:!1,depthTest:!1,uniforms:s,vertexShader:`
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,fragmentShader:`
      uniform sampler2D uTex; uniform float uHasTex, uScale, uPool, uVig;
      uniform vec3 uTint, uWarm, uLit, uCam, uToCore;
      varying vec3 vW;
      float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x) {
        vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      vec3 tri(vec3 p, vec3 n) {
        vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z);
        return texture2D(uTex, p.yz).rgb * w.x + texture2D(uTex, p.zx).rgb * w.y + texture2D(uTex, p.xy).rgb * w.z;
      }
      void main() {
        vec3 n = normalize(vW);
        // slow mottling and stains across the whole sphere
        float m = n3(n * 3.1) * 0.6 + n3(n * 8.3 + 4.7) * 0.3 + n3(n * 21.0 + 1.3) * 0.1;
        vec3 col = mix(uTint, uWarm, smoothstep(0.35, 0.95, m) * 0.22);
        if (uHasTex > 0.5) {
          vec3 t = tri(vW * uScale, n);
          // the texture carries fibre and grain only: keep its brightness variation, not its hue
          float l = dot(t, vec3(0.299, 0.587, 0.114));
          col *= mix(1.0, l / 0.80, 0.35);
        }
        vec3 v = normalize(vW - uCam);
        float c = dot(v, uToCore);
        // seen from the landing (outside the network) the paper deepens toward the edges of
        // view and lightens behind the network; from inside it stays open and even
        float outside = smoothstep(40.0, 110.0, length(uCam));
        float vig = 1.0 - smoothstep(0.60, 0.97, c);
        col = mix(col, uWarm, vig * uVig * outside);
        col = mix(col, uLit, smoothstep(0.78, 0.995, c) * uPool * outside);
        col = mix(col, uLit, (1.0 - outside) * 0.3);
        gl_FragColor = vec4(col, 1.0);
      }`}),l=new e.Mesh(a,c);return l.frustumCulled=!1,l.renderOrder=-110,n.load(`${r}parchment.webp`,t=>{t.wrapS=t.wrapT=e.RepeatWrapping,t.anisotropy=Math.min(8,i),t.colorSpace=e.NoColorSpace,s.uTex.value=t,s.uHasTex.value=1},void 0,()=>{}),{object:l,uniforms:s,update(e){s.uCam.value.copy(e.position);let t=s.uToCore.value.copy(e.position).negate();t.lengthSq()<1e-4&&t.set(0,0,-1),t.normalize()},dispose(){a.dispose(),c.dispose(),s.uTex.value?.dispose()}}}var t=(e,t)=>new e.Vector3(t[0],t[1],t[2]),n=e=>e*Math.PI/180;function r({THREE:e,R:r,loader:i,base:a,low:o,maxAniso:s,landing:c,renderer:l}){let u=new e.Group;u.name=`sphere-wall`;let d={uAtlas:{value:null},uCam:{value:new e.Vector3},uToCore:{value:new e.Vector3(0,0,-1)},uWash:{value:.5},uInk:{value:1},uBias:{value:.35},uGamma:{value:1.5}},f=new e.ShaderMaterial({uniforms:d,depthTest:!1,depthWrite:!1,side:e.DoubleSide,transparent:!1,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.DstColorFactor,blendDst:e.ZeroFactor,blendSrcAlpha:e.ZeroFactor,blendDstAlpha:e.OneFactor,vertexShader:`
      attribute vec2 aLocal; attribute vec4 aCrop; attribute vec4 aParams; attribute vec3 aPaper;
      varying vec2 vLocal; varying vec4 vCrop, vParams; varying vec3 vPaper, vW;
      float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x) {
        vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        vLocal = aLocal; vCrop = aCrop; vParams = aParams; vPaper = aPaper;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,fragmentShader:`
      uniform sampler2D uAtlas; uniform vec3 uCam, uToCore; uniform float uWash, uInk, uBias, uGamma;
      varying vec2 vLocal; varying vec4 vCrop, vParams; varying vec3 vPaper, vW;
      float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x) {
        vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
      void main() {
        float strength = vParams.x, feather = vParams.y, ext = vParams.z, bias = vParams.w;
        // patch-local -1..1 (plus the extension) to crop coordinates, mirrored past the edges
        vec2 t = vec2(vLocal.x + 1.0, 1.0 - vLocal.y) * 0.5;
        t = 1.0 - abs(1.0 - mod(t, 2.0));
        vec2 uv = mix(vCrop.xy, vCrop.zw, t);
        vec4 tx = texture2D(uAtlas, uv, uBias + bias);
        // ink as a multiply factor: the source divided by its paper tone, never brighter. The
        // knee at 92 % of paper drops the source's own grain (the shell paints the grain), so
        // overlapping patches never stain the paper, only their marks add up
        vec3 ink = pow(min(tx.rgb / (vPaper * 0.92), vec3(1.0)), vec3(uGamma));
        // feather to no ink at the patch edge
        // where two patches meet they interleave along an irregular, wandering boundary
        // (sketches overlapping on a page) instead of averaging both to a grey haze: the
        // noise is taken from the direction, so the neighbour gets the complementary share
        vec3 nd = normalize(vW);
        float wob = (n3(nd * 9.0 + 7.0) - 0.5) * 0.5 * feather;
        float d = max(abs(vLocal.x), abs(vLocal.y)) / (1.0 + ext) + wob;
        float edge = 1.0 - smoothstep(1.0 - feather, 1.0, d);
        float nz = clamp(n3(nd * 70.0) * 0.7 + n3(nd * 190.0 + 3.0) * 0.3, 0.15, 0.7);
        edge = smoothstep(nz - 0.22, nz + 0.22, edge * 1.15 - 0.08);
        // the network's light thins the ink right behind it
        float c = dot(normalize(vW - uCam), uToCore);
        float wash = 1.0 - uWash * smoothstep(0.84, 0.995, c);
        float a = tx.a * edge * strength * wash * uInk;
        gl_FragColor = vec4(mix(vec3(1.0), ink, a), 1.0);
      }`}),p=[],m=null,h=null;function g(i,a,o){let s=i.mode===`camera`?32:Math.max(8,Math.round((i.width||90)/3.5)),l=i.extend??.1,u=i.crop||[0,0,1,1],[d,f,p,m]=a.uv,h=d+(p-d)*u[0],g=f+(m-f)*u[1],_=d+(p-d)*u[2],v=f+(m-f)*u[3],y=[(_-h)*o,(v-g)*o],b=[],x=[],S=[],C=r*.995;if(i.mode===`camera`){let r=t(e,c.position),a=new e.Quaternion().fromArray(c.quaternion),o=Math.tan(n(c.fov)/2),u=o*c.aspect,d=i.rect||[-1,-1,1,1];for(let t=0;t<=s;t++)for(let n=0;n<=s;n++){let i=(n/s*2-1)*(1+l),f=(t/s*2-1)*(1+l),p=c.offset||[0,0],m=(d[0]+d[2])/2+i*(d[2]-d[0])/2+p[0],h=(d[1]+d[3])/2+f*(d[3]-d[1])/2+p[1],g=new e.Vector3(m*u,h*o,-1).applyQuaternion(a).normalize(),_=r.dot(g),v=r.lengthSq()-C*C,y=-_+Math.sqrt(Math.max(0,_*_-v)),S=r.clone().addScaledVector(g,y);b.push(S.x,S.y,S.z),x.push(i,f)}}else{let t=n(i.yaw||0),r=n(i.pitch||0),a=n(i.roll||0),o=new e.Vector3(Math.sin(t)*Math.cos(r),Math.sin(r),-Math.cos(t)*Math.cos(r)),c=new e.Vector3(Math.cos(t),0,Math.sin(t)),u=new e.Vector3().crossVectors(c,o).normalize();if(a){let e=c.clone().multiplyScalar(Math.cos(a)).addScaledVector(u,Math.sin(a));u=u.multiplyScalar(Math.cos(a)).addScaledVector(c,-Math.sin(a)),c=e}let d=Math.tan(n(i.width||90)/2),f=i.height?Math.tan(n(i.height)/2):d*y[1]/y[0];for(let e=0;e<=s;e++)for(let t=0;t<=s;t++){let n=(t/s*2-1)*(1+l),r=(e/s*2-1)*(1+l),i=o.clone().addScaledVector(c,n*d).addScaledVector(u,r*f).normalize().multiplyScalar(C);b.push(i.x,i.y,i.z),x.push(n,r)}}for(let e=0;e<s;e++)for(let t=0;t<s;t++){let n=e*(s+1)+t;S.push(n,n+1,n+s+1,n+1,n+s+2,n+s+1)}let w=(s+1)*(s+1),T=new Float32Array(w*4),E=new Float32Array(w*4),D=new Float32Array(w*3),O=a.lum?Math.max(1,a.lum.p80/a.lum.p50):1,k=a.paper.map(e=>Math.min(1,e*O/255));for(let e=0;e<w;e++)T.set([h,g,_,v],e*4),E.set([i.strength??1,i.feather??.15,l,i.bias??0],e*4),D.set(k,e*3);let A=new e.BufferGeometry;return A.setAttribute(`position`,new e.Float32BufferAttribute(b,3)),A.setAttribute(`aLocal`,new e.Float32BufferAttribute(x,2)),A.setAttribute(`aCrop`,new e.BufferAttribute(T,4)),A.setAttribute(`aParams`,new e.BufferAttribute(E,4)),A.setAttribute(`aPaper`,new e.BufferAttribute(D,3)),A.setIndex(S),A}function _(t){let n=[`position`,`aLocal`,`aCrop`,`aParams`,`aPaper`],r=new e.BufferGeometry,i=0,a=[];for(let i of n){let n=t[0].getAttribute(i).itemSize,a=t.reduce((e,t)=>e+t.getAttribute(i).count,0),o=new Float32Array(a*n),s=0;for(let e of t)o.set(e.getAttribute(i).array,s),s+=e.getAttribute(i).array.length;r.setAttribute(i,new e.BufferAttribute(o,n))}for(let e of t){let t=e.getIndex().array;for(let e=0;e<t.length;e++)a.push(t[e]+i);i+=e.getAttribute(`position`).count}return r.setIndex(a),r}return{object:u,ready:Promise.all([fetch(`${a}atlas.json`).then(e=>e.ok?e.json():null),fetch(`${a}wall.json`).then(e=>e.ok?e.json():null)]).then(([t,n])=>{if(!t||!n)return;let r=Object.fromEntries(t.sources.map(e=>[e.id,e])),c=n.patches.filter(e=>r[e.src]&&!(o&&e.tier===`high`)).map(e=>g(e,r[e.src],t.size)),v=_(c);c.forEach(e=>e.dispose()),p.push(v),h=new e.Mesh(v,f),h.frustumCulled=!1,h.renderOrder=-105,h.visible=!1,u.add(h),n.wash!=null&&(d.uWash.value=n.wash),n.ink!=null&&(d.uInk.value=n.ink),n.bias!=null&&(d.uBias.value=n.bias),n.gamma!=null&&(d.uGamma.value=n.gamma);let y=o?`atlas-2k.webp`:`atlas-4k.webp`;i.load(`${a}${y}`,t=>{t.colorSpace=e.NoColorSpace,t.flipY=!1,t.anisotropy=Math.min(8,s),t.wrapS=t.wrapT=e.ClampToEdgeWrapping,t.minFilter=e.LinearMipmapLinearFilter,t.magFilter=e.LinearFilter,l?.initTexture?.(t),m=t,d.uAtlas.value=t,h.visible=!0},void 0,()=>{})}).catch(()=>{}),uniforms:d,update(e){d.uCam.value.copy(e.position);let t=d.uToCore.value.copy(e.position).negate();t.lengthSq()<1e-4&&t.set(0,0,-1),t.normalize()},dispose(){p.forEach(e=>e.dispose()),f.dispose(),m?.dispose()}}}var i=700,a={position:[0,56.464,92.096],quaternion:[-.27155,0,0,.96243],fov:58,aspect:16/9,offset:[.02,0]};function o({THREE:t,scene:n,camera:i,renderer:o,quality:s,reducedMotion:c,assetBase:l=`/`}){let u=`${l}art/sphere/`,d=new t.Group;d.name=`notebook-sphere`;let f=s.tier===`low`,p=new t.TextureLoader,m=o.capabilities.getMaxAnisotropy?.()||1,h=e({THREE:t,R:700,loader:p,base:u,maxAniso:m}),g=r({THREE:t,R:700,loader:p,base:u,low:f,maxAniso:m,landing:a,renderer:o});d.add(h.object,g.object),n.add(d);let _=n.background;n.background=new t.Color(`#A89678`);let v=null,y=()=>{if(v&&v.parent&&v.parent.parent===n)return v;let e=n.getObjectByName(`manuscript-skin`);return v=e&&e.children.find(e=>e.renderOrder===-100)||null};return{update(e,t,n){let r=y();r&&(r.visible=!1),i.updateMatrixWorld(),h.update(i),g.update(i)},setTheme(){},setQuality(){},dispose(){v&&(v.visible=!0),n.remove(d),n.background=_,h.dispose(),g.dispose()}}}export{a as LANDING_CAMERA,i as SPHERE_R,o as default};