import{d as e,l as t,s as n,u as r}from"./index-D6FOjZ2k.js";var i=`
  varying vec2 vNdc;
  void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,a=`
  uniform sampler2D uMap;
  uniform vec2 uRes, uImg, uDrift;
  uniform float uZoom;
  uniform vec3 uGrade, uTarget;
  uniform float uPull, uDetail;
  varying vec2 vNdc;
  void main() {
    vec2 uv = vNdc * 0.5 + 0.5;
    float sa = uRes.x / uRes.y, ia = uImg.x / uImg.y;
    vec2 s = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
    uv = (uv - 0.5) * s / uZoom + 0.5 + uDrift;
    vec3 c = texture2D(uMap, uv).rgb * uGrade;
    // keep the stains and marginalia, softened, and ease their warmth toward the scene ground
    c = mix(uTarget, c, uDetail);
    c = mix(c, uTarget * (dot(c, vec3(0.299, 0.587, 0.114)) / dot(uTarget, vec3(0.299, 0.587, 0.114))), uPull);
    gl_FragColor = vec4(c, 1.0);
  }`,o={landscape:{url:`/art/library/m2-worked-parchment.webp`,size:[1536,1024],mean:[237,222,198]},portrait:{url:`/art/library/m3-pocket-notebook.webp`,size:[1024,1536],mean:[237,228,208]}},s=e=>{let t=parseInt(e.slice(1),16);return{r:(t>>16&255)/255,g:(t>>8&255)/255,b:(t&255)/255}};function c({THREE:e,tokens:t,loader:n}){let r=s(t.sceneBg),c={},l={},u=t=>{if(c[t])return c[t];let r=n.load(o[t].url,()=>{l[t]=!0});return r.colorSpace=e.NoColorSpace,r.generateMipmaps=!1,r.minFilter=e.LinearFilter,r.magFilter=e.LinearFilter,r.wrapS=r.wrapT=e.ClampToEdgeWrapping,c[t]=r},d=new e.BufferGeometry;d.setAttribute(`position`,new e.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let f=new e.ShaderMaterial({vertexShader:i,fragmentShader:a,depthTest:!1,depthWrite:!1,uniforms:{uMap:{value:null},uRes:{value:new e.Vector2(1,1)},uImg:{value:new e.Vector2(1536,1024)},uDrift:{value:new e.Vector2},uZoom:{value:1.08},uGrade:{value:new e.Vector3(1,1,1)},uTarget:{value:new e.Vector3(r.r,r.g,r.b)},uPull:{value:.3},uDetail:{value:.62}}}),p=new e.Mesh(d,f);p.frustumCulled=!1,p.renderOrder=-99,p.visible=!1,p.name=`manuscript-world-folio`;let m=null,h=new e.Vector2,g=1.08,_=new e.Vector3;function v(e,t){let n=e/t<.9?`portrait`:`landscape`;if(n===m)return;m=n;let i=o[n];f.uniforms.uMap.value=u(n),f.uniforms.uImg.value.set(i.size[0],i.size[1]),f.uniforms.uGrade.value.set(r.r*255/i.mean[0],r.g*255/i.mean[1],r.b*255/i.mean[2])}return{object:p,update({camera:e,size:t,dt:n,warp:r,reduced:i,show:a}){v(t.x,t.y),p.visible=a&&!!l[m],f.uniforms.uRes.value.copy(t),e.getWorldDirection(_);let o=Math.atan2(_.x,-_.z),s=Math.asin(Math.max(-1,Math.min(1,_.y))),c=i?[0,0]:[Math.sin(o)*.03,Math.sin(s)*.025],u=i?1:1-Math.exp(-n*2.5);h.x+=(c[0]-h.x)*u,h.y+=(c[1]-h.y)*u,f.uniforms.uDrift.value.copy(h);let d=1.08+(i?0:.025*r);g+=(d-g)*(1-Math.exp(-n*3)),f.uniforms.uZoom.value=g},paper:()=>u(`landscape`),setTokens(e){r=s(e.sceneBg),f.uniforms.uTarget.value.set(r.r,r.g,r.b),m=null},dispose(){d.dispose(),f.dispose();for(let e of Object.values(c))e.dispose()}}}var l=[{id:`book-tree`,near:`writing`,url:`study-book-tree.webp`,size:[512,422],dir:[.372,-.855,-.363],w:19.5,roll:-3,rank:1},{id:`escapement`,near:`capabilities`,url:`study-escapement.webp`,size:[512,344],dir:[.782,-.03,-.622],w:20.8,roll:2,rank:0},{id:`compass`,near:`approach`,url:`study-compass.webp`,size:[512,437],dir:[.134,-.452,.882],w:19.5,roll:-2,rank:2},{id:`quills`,near:`projects`,url:`study-quills.webp`,size:[512,426],dir:[-.885,-.466,-.025],w:19.5,roll:3,rank:3}],u=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,d=`
  uniform sampler2D uMap, uPaper;
  uniform float uAlpha, uPlate, uInkK, uPad, uSeed, uInside;
  uniform vec3 uLamp, uHalo, uPaperGrade;
  uniform vec2 uAspect;
  varying vec2 vUv;
  float h2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    // the patch carries a margin (uPad) around the drawing, for the dark theme's plate and glow
    vec2 iuv = (vUv - uPad) / (1.0 - 2.0 * uPad);
    // on a dark plate the drawing sits a little smaller, wholly inside the lamp's pool
    iuv = (iuv - 0.5) / mix(1.0, 0.8, uPlate) + 0.5;
    vec4 art = texture2D(uMap, iuv);
    float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
    art.a *= inside;

    // light: ink straight on the folio
    vec3 inkCol = art.rgb;
    float aLight = art.a * uInkK;

    // dark: a page under a lamp. No card edge: the page's outline is deckled and wide
    // feathered, and the lamp's warm pool sets the alpha too, so the page brightens toward
    // the middle and dissolves into the night at its rim.
    vec2 q = (vUv - 0.5) * uAspect;                        // plate space, world proportions
    vec2 half_ = (0.5 - uPad * 0.3) * uAspect;              // page half size
    vec2 e = half_ - abs(q);
    float edge = min(e.x, e.y) / min(uAspect.x, uAspect.y);
    float deckle = (n2(q * 5.0 + uSeed) - 0.5) * 0.08 + (n2(q * 17.0 - uSeed) - 0.5) * 0.03 + (n2(q * 53.0 + uSeed) - 0.5) * 0.012;
    float shape = smoothstep(-0.04, 0.3, edge + deckle);
    vec3 paper = texture2D(uPaper, vUv * 0.28 + vec2(0.36, 0.34) + uSeed * 0.01).rgb * uPaperGrade;
    // the lamp: a warm radial pool, brightest a little above the middle
    vec2 lp = (vUv - vec2(0.5, 0.56)) * 2.0 * uAspect / max(uAspect.x, uAspect.y);
    float r = length(lp) + deckle * 1.5;
    float lamp = exp(-r * r * 1.6);                         // 1 in the middle, about 0.2 at the rim
    float pool = 1.0 - smoothstep(0.34, 1.0, r);
    vec3 page = mix(paper, art.rgb, art.a);
    // light falls off warm: the rim goes umber before it goes dark
    vec3 warm = mix(uHalo * 1.25, vec3(1.0), lamp);
    vec3 darkCol = page * uLamp * warm * mix(0.3, 1.0, lamp);
    float aDark = shape * pool * pool * mix(0.15, 0.95, lamp);
    // outside the brain (the whole-network view) the pages step back entirely
    aDark *= uInside;

    vec3 col = mix(inkCol, darkCol, uPlate); // both straight (not premultiplied) colours
    float a = mix(aLight, aDark, uPlate) * uAlpha;
    gl_FragColor = vec4(col * a, a);
  }`;function f(e,t,n,r,i,a,o){let s=new e.Vector3(...t).normalize(),c=Math.abs(s.y)>.92?new e.Vector3(0,0,-1):new e.Vector3(0,1,0),l=new e.Vector3().crossVectors(s,c).normalize(),u=new e.Vector3().crossVectors(l,s).normalize(),d=o*Math.PI/180,f=Math.cos(d),p=Math.sin(d),m=l.clone().multiplyScalar(f).addScaledVector(u,p),h=u.clone().multiplyScalar(f).addScaledVector(l,-p),g=r/(1-2*a),_=i/(1-2*a),v=[],y=[],b=[],x=new e.Vector3;for(let e=0;e<=12;e++)for(let t=0;t<=16;t++){let r=t/16,i=e/12;x.copy(s).addScaledVector(m,(r-.5)*g/n).addScaledVector(h,(i-.5)*_/n).normalize().multiplyScalar(n),v.push(x.x,x.y,x.z),y.push(r,i)}for(let e=0;e<12;e++)for(let t=0;t<16;t++){let n=e*17+t,r=n+1,i=n+16+1,a=i+1;b.push(n,r,a,n,a,i)}let S=new e.BufferGeometry;S.setAttribute(`position`,new e.Float32BufferAttribute(v,3)),S.setAttribute(`uv`,new e.Float32BufferAttribute(y,2)),S.setIndex(b);let C=(e,t)=>s.clone().addScaledVector(m,(e-.5)*g/n).addScaledVector(h,(t-.5)*_/n).normalize().multiplyScalar(n).toArray(),w=[[.1,.1],[.9,.1],[.1,.9],[.9,.9],[.5,.1],[.5,.9],[.1,.5],[.9,.5]].map(([e,t])=>C(e,t));return{geometry:S,centre:s.clone().multiplyScalar(n),normal:s.clone().negate(),W:g,H:_,drawCorners:w}}function p({THREE:e,loader:t,base:n,tokens:r,paperTexture:i,renderer:a}){let o=new e.Group;o.name=`manuscript-world-studies`;let c=.14,p=s(r.dark.hub),h=s(`#F6E6C6`),g=Math.min(4,a.capabilities.getMaxAnisotropy()),_=l.map((r,a)=>{let s=r.w*r.size[1]/r.size[0],{geometry:l,centre:m,normal:_,W:v,H:y,drawCorners:b}=f(e,r.dir,92,r.w,s,c,r.roll),x=t.load(n+r.url);x.colorSpace=e.NoColorSpace,x.anisotropy=g;let S=new e.ShaderMaterial({vertexShader:u,fragmentShader:d,transparent:!0,premultipliedAlpha:!0,depthTest:!1,depthWrite:!1,side:e.DoubleSide,uniforms:{uMap:{value:x},uPaper:{value:i},uAlpha:{value:0},uInside:{value:1},uPlate:{value:0},uInkK:{value:.72},uPad:{value:c},uSeed:{value:a*3.7+1.3},uLamp:{value:new e.Vector3(h.r*.56,h.g*.56,h.b*.56)},uHalo:{value:new e.Vector3(p.r*.62,p.g*.42,p.b*.24)},uPaperGrade:{value:new e.Vector3(241/237,233/222,216/198)},uAspect:{value:new e.Vector2(v/Math.max(v,y),y/Math.max(v,y))}}}),C=new e.Mesh(l,S);return C.frustumCulled=!1,C.renderOrder=-40,o.add(C),{...r,mesh:C,mat:S,map:x,centre:m,normal:_,drawCorners:b,radius:Math.max(v,y)/2,live:!1,clear:0}}),v=new e.Vector3,y=0;return{object:o,items:_,update({camera:e,dt:t,theme:n,intro:r,warp:i,tier:a,guard:o}){y+=(+(n===`dark`)-y)*Math.min(1,t*12),Math.abs(y-+(n===`dark`))<.01&&(y=+(n===`dark`));for(let t of _){v.subVectors(e.position,t.centre);let n=v.length(),o=v.dot(t.normal)/Math.max(n,1e-6),s=m(20,45,n),c=m(.12,.42,o),l=a===`low`&&t.rank>=2?0:1,u=1-y*m(76,100,e.position.length());t.base=s*c*r*l*u*(1-.35*i),t.live=t.base>.003}let s=o?o.check(_):{};for(let e of _){let n=s[e.id]===!1?0:1;e.clear+=(n-e.clear)*Math.min(1,t*(n?2.2:9)),e.live||(e.clear=n);let r=e.base*e.clear;e.mat.uniforms.uAlpha.value=r,e.mat.uniforms.uPlate.value=y,e.mat.uniforms.uInside.value=1,e.mesh.visible=r>.003}},dispose(){for(let e of _)e.mesh.geometry.dispose(),e.mat.dispose(),e.map.dispose()}}}function m(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}var h=18,g=14,_=28,v=34,y=t.nodes.filter(e=>e.kind!==`junction`);function b({THREE:e,camera:i}){let a=new e.Vector3,o=null,s=null,c=[],l=0,u={tags:[],reader:null},d=()=>{let e=[];for(let t of document.querySelectorAll(`.node-label, .edge-chip`)){if(t.hidden||t.style.visibility===`hidden`)continue;let n=t.getBoundingClientRect();n.width&&n.height&&e.push({x0:n.left,y0:n.top,x1:n.right,y1:n.bottom})}let t=document.getElementById(`reader`),n=t&&t.getBoundingClientRect();return{tags:e,reader:n&&n.width?{x0:n.left,y0:n.top,x1:n.right,y1:n.bottom}:null}},f=e=>(a.set(e[0],e[1],e[2]).project(i),a.z>1||a.z<-1?null:{x:(a.x+1)/2*innerWidth,y:(1-a.y)/2*innerHeight}),p=e=>{let t=1e9,n=1e9,r=-1e9,i=-1e9;for(let a of e.drawCorners){let e=f(a);if(!e)return null;t=Math.min(t,e.x),r=Math.max(r,e.x),n=Math.min(n,e.y),i=Math.max(i,e.y)}return{x0:t,y0:n,x1:r,y1:i}},m=(e,t,n)=>e.x0<t.x1+n&&e.x1>t.x0-n&&e.y0<t.y1+n&&e.y1>t.y0-n,b=(e,t,n,r)=>{let i=Math.max(e.x0-t,0,t-e.x1),a=Math.max(e.y0-n,0,n-e.y1);return i*i+a*a<r*r},x=(e,t,n,r)=>{let i=e.x0-r,a=e.x1+r,o=e.y0-r,s=e.y1+r,c=0,l=1,u=n.x-t.x,d=n.y-t.y;for(let[e,n]of[[-u,t.x-i],[u,a-t.x],[-d,t.y-o],[d,s-t.y]]){if(e===0){if(n<0)return!1;continue}let t=n/e;if(e<0){if(t>l)return!1;t>c&&(c=t)}else{if(t<c)return!1;t<l&&(l=t)}}return!0};return{setNode(e){if(!e||e===s||!n.has(e))return;o=s,s=e;let i=o?r(o,s):null;c=i?i.map(e=>t.nodes[e].pos):[t.nodes[n.get(s)].pos]},route:()=>c,check(e){l++%3==0&&(u=d());let t=innerHeight/2/Math.tan(i.fov*Math.PI/360),n=[];for(let e of y){let r=f(e.pos);if(!r)continue;let o=i.position.distanceTo(a.set(e.pos[0],e.pos[1],e.pos[2]));n.push({x:r.x,y:r.y,r:e.radius*t/Math.max(o,.01)+h})}let r=c.map(f),o={};for(let t of e){if(!t.live){o[t.id]=!0;continue}let e=p(t);if(!e){o[t.id]=!0;continue}let i=u.reader&&m(e,u.reader,_)?`reader`:``;!i&&u.tags.some(t=>m(e,t,g))&&(i=`tag`),!i&&n.some(t=>b(e,t.x,t.y,t.r))&&(i=`node`);for(let t=1;t<r.length&&!i;t++)r[t-1]&&r[t]&&x(e,r[t-1],r[t],v)&&(i=`route`);t.why=i,o[t.id]=!i}return o}}}var x=`/art/layers/manuscript-world/`;function S({THREE:t,scene:n,camera:r,renderer:i,theme:a,quality:o,reducedMotion:s}){let l=document.documentElement,u=new t.TextureLoader,d=new t.Group;d.name=`manuscript-world`;let f=c({THREE:t,tokens:e.light,loader:u}),m=p({THREE:t,loader:u,base:x,tokens:e,paperTexture:f.paper(),renderer:i});d.add(f.object,m.object),n.add(d),d.traverse(e=>{e.isMesh&&(e.visible=!0)}),i.compile(n,r),d.traverse(e=>{e.isMesh&&(e.visible=!1)});let h=b({THREE:t,camera:r}),g=a,_=o.tier,v=0,y=new t.Vector2,S=null,C=()=>{if(S&&S.parent&&S.parent.parent===n)return S;let e=n.getObjectByName(`manuscript-skin`);return S=e&&e.children.find(e=>e.renderOrder===-100)||null};return{update(e,t,n){g=l.dataset.theme===`dark`?`dark`:l.dataset.theme===`light`?`light`:g,i.getSize(y);let a=s();v=l.classList.contains(`intro-active`)?0:a?1:Math.min(1,v+t/1.1);let o=n.warp||0;h.setNode((/^#\/([\w-]+)$/.exec(location.hash)||[0,`markus`])[1]);let c=C();f.update({camera:r,size:y,dt:t,warp:o,reduced:a||_===`low`,show:g===`light`&&!!c}),c&&(c.visible=!f.object.visible),m.update({camera:r,dt:t,theme:g,intro:v*v*(3-2*v),warp:o,tier:_,guard:h})},setTheme(e,t){g=t},setQuality(e){_=e.tier},dispose(){S&&(S.visible=!0),n.remove(d),f.dispose(),m.dispose()}}}export{S as default};