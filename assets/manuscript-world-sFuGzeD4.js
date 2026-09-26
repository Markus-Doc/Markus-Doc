import{d as e,f as t,l as n,p as r}from"./index-DYsSF1N1.js";var i=`
  varying vec2 vNdc;
  void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,a=`
  uniform sampler2D uMap;
  uniform vec2 uRes, uImg, uDrift;
  uniform vec4 uFree;       // free area in screen uv (x0, y0, x1, y1), y up
  uniform float uZoom, uOpacity;
  uniform vec3 uGrade, uTarget;
  uniform float uPull, uDetail;
  varying vec2 vNdc;
  void main() {
    vec2 uv = vNdc * 0.5 + 0.5;
    // into the free area's own 0..1 space, then cover-fit the sheet to that area
    vec2 fs = uFree.zw - uFree.xy;
    vec2 local = (uv - uFree.xy) / fs;
    float fa = fs.x * uRes.x / (fs.y * uRes.y), ia = uImg.x / uImg.y;
    vec2 s = fa > ia ? vec2(1.0, ia / fa) : vec2(fa / ia, 1.0);
    local = (local - 0.5) * s / uZoom + 0.5 + uDrift;
    vec3 c = texture2D(uMap, local).rgb * uGrade;
    // keep the stains and marginalia, and ease their warmth toward the scene ground
    c = mix(uTarget, c, uDetail);
    c = mix(c, uTarget * (dot(c, vec3(0.299, 0.587, 0.114)) / dot(uTarget, vec3(0.299, 0.587, 0.114))), uPull);
    gl_FragColor = vec4(c * uOpacity, uOpacity);
  }`,o={landscape:{url:`/art/library/m2-worked-parchment.webp`,size:[1536,1024],mean:[237,222,198]},portrait:{url:`/art/library/m3-pocket-notebook.webp`,size:[1024,1536],mean:[237,228,208]}},s=e=>{let t=parseInt(e.slice(1),16);return{r:(t>>16&255)/255,g:(t>>8&255)/255,b:(t&255)/255}};function c({THREE:e,tokens:t,loader:n,renderer:r,assetBase:c=`/`}){let l=s(t.sceneBg),u={},d={},f=t=>{if(u[t])return u[t];let i=n.load(c+o[t].url.slice(1),e=>{r?.initTexture(e),d[t]=!0});return i.colorSpace=e.NoColorSpace,i.generateMipmaps=!1,i.minFilter=e.LinearFilter,i.magFilter=e.LinearFilter,i.wrapS=i.wrapT=e.MirroredRepeatWrapping,u[t]=i},p=new e.BufferGeometry;p.setAttribute(`position`,new e.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let m=new e.ShaderMaterial({vertexShader:i,fragmentShader:a,depthTest:!1,depthWrite:!1,transparent:!0,premultipliedAlpha:!0,uniforms:{uMap:{value:null},uRes:{value:new e.Vector2(1,1)},uImg:{value:new e.Vector2(1536,1024)},uDrift:{value:new e.Vector2},uZoom:{value:1.04},uOpacity:{value:0},uFree:{value:new e.Vector4(0,0,1,1)},uGrade:{value:new e.Vector3(1,1,1)},uTarget:{value:new e.Vector3(l.r,l.g,l.b)},uPull:{value:.3},uDetail:{value:.8}}}),h=new e.Mesh(p,m);h.frustumCulled=!1,h.renderOrder=-99,h.visible=!1,h.name=`manuscript-world-folio`;let g=null,_=new e.Vector2,v=1.04,y=0,b=-1,x=new e.Vector3;function S(e,t){let n=e/t<.9?`portrait`:`landscape`;if(n===g)return;g=n;let r=o[n];m.uniforms.uMap.value=f(n),m.uniforms.uImg.value.set(r.size[0],r.size[1]),m.uniforms.uGrade.value.set(l.r*255/r.mean[0],l.g*255/r.mean[1],l.b*255/r.mean[2])}function C(){let e=innerWidth,t=innerHeight,n=document.querySelector(`.topbar`)?.getBoundingClientRect(),r=document.getElementById(`reader`)?.getBoundingClientRect(),i=e,a=n?n.bottom:0,o=t;r&&r.width&&(r.left>e*.35?i=r.left:o=Math.max(a+100,r.top)),m.uniforms.uFree.value.set(0/e,1-o/t,i/e,1-a/t)}return{object:h,update({camera:e,size:t,dt:n,time:r,warp:i,reduced:a,show:o}){S(t.x,t.y),y=o&&d[g]?Math.min(1,y+(a?1:n/.3)):0,h.visible=y>0,m.uniforms.uOpacity.value=y*y*(3-2*y),m.transparent=y<1,m.uniforms.uRes.value.copy(t),(r-b>.5||b<0)&&(b=r,C()),e.getWorldDirection(x);let s=Math.atan2(x.x,-x.z),c=Math.asin(Math.max(-1,Math.min(1,x.y))),l=a?[0,0]:[Math.sin(s)*.018,Math.sin(c)*.015],u=a?1:1-Math.exp(-n*2.5);_.x+=(l[0]-_.x)*u,_.y+=(l[1]-_.y)*u,m.uniforms.uDrift.value.copy(_);let f=1.04+(a?0:.02*i);v+=(f-v)*(1-Math.exp(-n*3)),m.uniforms.uZoom.value=v},get covering(){return y>=1&&h.visible},paper:()=>f(`landscape`),setTokens(e){l=s(e.sceneBg),m.uniforms.uTarget.value.set(l.r,l.g,l.b),g=null},dispose(){p.dispose(),m.dispose();for(let e of Object.values(u))e.dispose()}}}var l=[{id:`book-tree`,near:`writing`,url:`study-book-tree.webp`,size:[512,422],dir:[.583,-.716,-.384],w:19.5,roll:-3,rank:1},{id:`escapement`,near:`capabilities`,url:`study-escapement.webp`,size:[512,344],dir:[.636,.059,-.769],w:20.8,roll:2,rank:3},{id:`compass`,near:`approach`,url:`study-compass.webp`,size:[512,437],dir:[-.941,-.294,-.167],w:19.5,roll:-2,rank:2},{id:`quills`,near:`projects`,url:`study-quills.webp`,size:[512,426],dir:[-.876,-.053,.479],w:19.5,roll:3,rank:0}],u=4,d=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,f=`
  uniform sampler2D uMap, uPaper;
  uniform float uAlpha, uPlate, uInkK, uPad, uSeed, uInside, uReveal;
  uniform vec3 uLamp, uHalo, uPaperGrade;
  uniform vec2 uAspect;
  varying vec2 vUv;
  float h2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    // the patch carries a margin (uPad) around the drawing, for the dark theme's page and glow
    vec2 iuv = (vUv - uPad) / (1.0 - 2.0 * uPad);
    // on a dark page the drawing sits a little smaller, inside the page's margins
    iuv = (iuv - 0.5) / mix(1.0, 0.95, uPlate) + 0.5;
    vec4 art = texture2D(uMap, iuv);
    float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
    art.a *= inside;
    // drawn in like a pen stroke: the ink appears along a ragged front that sweeps across
    // the drawing (left to right, broken up by noise), not as a flat fade
    float front = 0.62 * iuv.x + 0.25 * (1.0 - iuv.y) + 0.35 * n2(iuv * 7.0 + uSeed);
    float ink = smoothstep(front - 0.02, front + 0.06, uReveal * 1.3);
    art.a *= ink;

    // light: ink straight on the folio
    vec3 inkCol = art.rgb;
    float aLight = art.a * uInkK;

    // dark: a page under a lamp. A torn, deckled edge you can see, paper lit enough to
    // read the drawing, the lamp's pool darkening it toward umber at the edges, and a soft
    // warm spill onto the night around it.
    vec2 q = (vUv - 0.5) * uAspect;                        // page space, world proportions
    vec2 half_ = (0.5 - uPad * 0.55) * uAspect;             // page half size
    vec2 e = half_ - abs(q);
    float edge = min(e.x, e.y) / min(uAspect.x, uAspect.y);
    float deckle = (n2(q * 6.0 + uSeed) - 0.5) * 0.035 + (n2(q * 23.0 - uSeed) - 0.5) * 0.016 + (n2(q * 71.0 + uSeed) - 0.5) * 0.008;
    float d = edge + deckle;
    float shape = smoothstep(0.0, 0.012, d);                // a torn edge, crisp enough to see
    vec3 paper = texture2D(uPaper, vUv * 0.28 + vec2(0.36, 0.34) + uSeed * 0.01).rgb * uPaperGrade;
    // the lamp: brightest a little above the middle, the paper going umber toward the edges
    vec2 lp = (vUv - vec2(0.5, 0.58)) * 2.0 * uAspect / max(uAspect.x, uAspect.y);
    float lamp = exp(-dot(lp, lp) * 0.9);                   // 1 in the middle, about 0.5 at the corners
    vec3 warm = mix(vec3(0.8, 0.64, 0.47), vec3(1.0), smoothstep(0.35, 0.95, lamp)); // umber toward the edges
    vec3 lit = paper * uLamp * warm * mix(0.5, 1.0, lamp);
    // ink at full strength on the lit paper (ink tone is already near black)
    vec3 page = mix(lit, art.rgb * 0.3 * uLamp * warm, art.a);
    // the page's own edge darkens a touch, like paper curling away from the light
    page *= mix(0.72, 1.0, smoothstep(0.0, 0.05, d));
    // spill: a faint warm glow outside the edge, gone within a short distance
    float spill = exp(-max(-d, 0.0) * 22.0) * (1.0 - shape) * 0.22;
    float aPage = shape + spill;
    vec3 darkCol = (page * shape + uHalo * spill) / max(aPage, 0.0001); // straight colour
    // outside the brain (the whole-network view) the pages step back entirely
    float aDark = aPage * uInside;

    vec3 col = mix(inkCol, darkCol, uPlate); // straight (not premultiplied) colours
    float a = mix(aLight, aDark, uPlate) * uAlpha;
    gl_FragColor = vec4(col * a, a);
  }`;function p(e,t,n,r,i,a,o){let s=new e.Vector3(...t).normalize(),c=Math.abs(s.y)>.92?new e.Vector3(0,0,-1):new e.Vector3(0,1,0),l=new e.Vector3().crossVectors(s,c).normalize(),u=new e.Vector3().crossVectors(l,s).normalize(),d=o*Math.PI/180,f=Math.cos(d),p=Math.sin(d),m=l.clone().multiplyScalar(f).addScaledVector(u,p),h=u.clone().multiplyScalar(f).addScaledVector(l,-p),g=r/(1-2*a),_=i/(1-2*a),v=[],y=[],b=[],x=new e.Vector3;for(let e=0;e<=12;e++)for(let t=0;t<=16;t++){let r=t/16,i=e/12;x.copy(s).addScaledVector(m,(r-.5)*g/n).addScaledVector(h,(i-.5)*_/n).normalize().multiplyScalar(n),v.push(x.x,x.y,x.z),y.push(r,i)}for(let e=0;e<12;e++)for(let t=0;t<16;t++){let n=e*17+t,r=n+1,i=n+16+1,a=i+1;b.push(n,r,a,n,a,i)}let S=new e.BufferGeometry;S.setAttribute(`position`,new e.Float32BufferAttribute(v,3)),S.setAttribute(`uv`,new e.Float32BufferAttribute(y,2)),S.setIndex(b);let C=(e,t)=>s.clone().addScaledVector(m,(e-.5)*g/n).addScaledVector(h,(t-.5)*_/n).normalize().multiplyScalar(n).toArray(),w=[[.1,.1],[.9,.1],[.1,.9],[.9,.9],[.5,.1],[.5,.9],[.1,.5],[.9,.5]].map(([e,t])=>C(e,t));return{geometry:S,centre:s.clone().multiplyScalar(n),normal:s.clone().negate(),W:g,H:_,drawCorners:w}}function m({THREE:e,loader:t,base:n,tokens:r,paperTexture:i,renderer:a}){let o=new e.Group;o.name=`manuscript-world-studies`;let c=.14,m=s(r.dark.hub),g=s(`#F6E6C6`),_=Math.min(4,a.capabilities.getMaxAnisotropy()),v=l.map((r,s)=>{let l=r.w*r.size[1]/r.size[0],{geometry:u,centre:h,normal:v,W:y,H:b,drawCorners:x}=p(e,r.dir,92,r.w,l,c,r.roll),S=t.load(n+r.url,e=>a.initTexture(e));S.colorSpace=e.NoColorSpace,S.anisotropy=_;let C=new e.ShaderMaterial({vertexShader:d,fragmentShader:f,transparent:!0,premultipliedAlpha:!0,depthTest:!1,depthWrite:!1,side:e.DoubleSide,uniforms:{uMap:{value:S},uPaper:{value:i},uAlpha:{value:0},uReveal:{value:1},uInside:{value:1},uPlate:{value:0},uInkK:{value:.72},uPad:{value:c},uSeed:{value:s*3.7+1.3},uLamp:{value:new e.Vector3(g.r*.68,g.g*.68,g.b*.68)},uHalo:{value:new e.Vector3(m.r*.62,m.g*.42,m.b*.24)},uPaperGrade:{value:new e.Vector3(241/237,233/222,216/198)},uAspect:{value:new e.Vector2(y/Math.max(y,b),b/Math.max(y,b))}}}),w=new e.Mesh(u,C);return w.frustumCulled=!1,w.renderOrder=-40,o.add(w),{...r,mesh:w,mat:C,map:S,centre:h,normal:v,drawCorners:x,radius:Math.max(y,b)/2,live:!1,clear:0}}),y=new e.Vector3,b=0;return{object:o,items:v,update({camera:e,dt:t,theme:n,intro:r,warp:i,tier:a,guard:o,reduced:s=!1,travelling:c=!1,progress:l=1,keepOut:d=null}){let f=+(!c||l>.8);b+=(+(n===`dark`)-b)*Math.min(1,t*12),Math.abs(b-+(n===`dark`))<.01&&(b=+(n===`dark`));for(let t of v){y.subVectors(e.position,t.centre);let n=y.length(),o=y.dot(t.normal)/Math.max(n,1e-6),s=h(20,45,n),c=h(.12,.42,o),l=a===`low`&&t.rank>=4?0:1,u=1-b*h(76,100,e.position.length());t.base=s*c*r*l*u*(1-.35*i),t.live=t.base>.003}let p=o?o.check(v,d?.instruments||[]):{},m=v.filter(e=>e.live&&e.onScreen&&p[e.id]!==!1).sort((e,t)=>t.base-e.base),g=new Set,_=[];for(let e of m){if(g.size>=(a===`low`?2:u))break;let t=e.box;t&&_.some(e=>t.x0<e.x1+24&&t.x1>e.x0-24&&t.y0<e.y1+24&&t.y1>e.y0-24)||(g.add(e.id),t&&_.push(t))}for(let e of v){let n=p[e.id]===!1||!e.onScreen||!g.has(e.id)?0:1;f<1&&e.clear<.5&&(n=0),e.clear+=(n-e.clear)*Math.min(1,t*(n?2.2:9)),e.live||(e.clear=n);let r=e.base*e.clear;e.reveal=r<.02?0:s?1:Math.min(1,(e.reveal||0)+t/.8),e.mat.uniforms.uReveal.value=e.reveal,e.mat.uniforms.uAlpha.value=r,e.mat.uniforms.uPlate.value=b,e.mat.uniforms.uInside.value=1,e.mesh.visible=r>.003&&e.onScreen}d&&(d.studies=v.filter(e=>e.onScreen&&e.box&&(e.clear>.05||g.has(e.id))&&p[e.id]!==!1&&e.live).map(e=>e.box))},dispose(){for(let e of v)e.mesh.geometry.dispose(),e.mat.dispose(),e.map.dispose()}}}function h(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}var g=18,_=14,v=28,y=34,b=16,x=e.nodes.filter(e=>e.kind!==`junction`);function S({THREE:r,camera:i}){let a=new r.Vector3,o=null,s=null,c=[],l=0,u={tags:[],reader:null},d=()=>{let e=[];for(let t of document.querySelectorAll(`.node-label, .edge-chip, .topbar, .explore-controls, #travel`)){if(t.hidden||t.style.visibility===`hidden`)continue;let n=t.getBoundingClientRect();n.width&&n.height&&e.push({x0:n.left,y0:n.top,x1:n.right,y1:n.bottom})}let t=document.getElementById(`reader`),n=t&&t.getBoundingClientRect();return{tags:e,reader:n&&n.width?{x0:n.left,y0:n.top,x1:n.right,y1:n.bottom}:null}},f=e=>(a.set(e[0],e[1],e[2]).project(i),a.z>1||a.z<-1?null:{x:(a.x+1)/2*innerWidth,y:(1-a.y)/2*innerHeight}),p=e=>{let t=1e9,n=1e9,r=-1e9,i=-1e9;for(let a of e.drawCorners){let e=f(a);if(!e)return null;t=Math.min(t,e.x),r=Math.max(r,e.x),n=Math.min(n,e.y),i=Math.max(i,e.y)}return{x0:t,y0:n,x1:r,y1:i}},m=(e,t,n)=>e.x0<t.x1+n&&e.x1>t.x0-n&&e.y0<t.y1+n&&e.y1>t.y0-n,h=(e,t,n,r)=>{let i=Math.max(e.x0-t,0,t-e.x1),a=Math.max(e.y0-n,0,n-e.y1);return i*i+a*a<r*r},S=(e,t,n,r)=>{let i=e.x0-r,a=e.x1+r,o=e.y0-r,s=e.y1+r,c=0,l=1,u=n.x-t.x,d=n.y-t.y;for(let[e,n]of[[-u,t.x-i],[u,a-t.x],[-d,t.y-o],[d,s-t.y]]){if(e===0){if(n<0)return!1;continue}let t=n/e;if(e<0){if(t>l)return!1;t>c&&(c=t)}else{if(t<c)return!1;t<l&&(l=t)}}return!0};return{setNode(r){if(!r||r===s||!n.has(r))return;o=s,s=r;let i=o?t(o,s):null;c=i?i.map(t=>e.nodes[t].pos):[e.nodes[n.get(s)].pos]},route:()=>c,check(e,t=[]){l++%(this.travelling?8:3)==0&&(u=d());let n=innerHeight/2/Math.tan(i.fov*Math.PI/360),r=[];for(let e of x){let t=f(e.pos);if(!t)continue;let o=i.position.distanceTo(a.set(e.pos[0],e.pos[1],e.pos[2]));r.push({x:t.x,y:t.y,r:e.radius*n/Math.max(o,.01)+g})}let o=c.map(f),s={};for(let n of e){if(!n.live){n.onScreen=!1,s[n.id]=!0;continue}let e=p(n);if(n.onScreen=!!e&&e.x1>0&&e.x0<innerWidth&&e.y1>0&&e.y0<innerHeight,n.box=e,n.why=``,!e||!n.onScreen){s[n.id]=!0;continue}let i=u.reader&&m(e,u.reader,v)?`reader`:``;!i&&(e.x0<b||e.y0<b||e.x1>innerWidth-b||e.y1>innerHeight-b)&&(i=`edge`),!i&&u.tags.some(t=>m(e,t,_))&&(i=`tag`),!i&&r.some(t=>h(e,t.x,t.y,t.r))&&(i=`node`),!i&&n.clear<.5&&t.some(t=>t.a>.3&&h(e,t.x,t.y,t.r+16))&&(i=`instrument`);for(let t=1;t<o.length&&!i;t++)o[t-1]&&o[t]&&S(e,o[t-1],o[t],y)&&(i=`route`);n.why=i,s[n.id]=!i}return s}}}function C({THREE:e,scene:t,camera:n,renderer:i,theme:a,quality:o,reducedMotion:s,assetBase:l=`/`}){let u=`${l}art/layers/manuscript-world/`,d=document.documentElement,f=new e.TextureLoader,p=new e.Group;p.name=`manuscript-world`;let h=c({THREE:e,tokens:r.light,loader:f,renderer:i,assetBase:l}),g=m({THREE:e,loader:f,base:u,tokens:r,paperTexture:h.paper(),renderer:i});p.add(h.object,g.object),t.add(p),p.traverse(e=>{e.isMesh&&(e.visible=!0)}),i.compile(t,n),p.traverse(e=>{e.isMesh&&(e.visible=!1)});let _=S({THREE:e,camera:n}),v=a,y=o.tier,b=0,x=new e.Vector2,C=null,w=()=>{if(C&&C.parent&&C.parent.parent===t)return C;let e=t.getObjectByName(`manuscript-skin`);return C=e&&e.children.find(e=>e.renderOrder===-100)||null};return{update(e,r,a){v=d.dataset.theme===`dark`?`dark`:d.dataset.theme===`light`?`light`:v,i.getSize(x);let o=s();b=d.classList.contains(`intro-active`)?0:o?1:Math.min(1,b+r/1.1);let c=a.warp||0;_.travelling=!!a.travelling,_.setNode((/^#\/([\w-]+)$/.exec(location.hash)||[0,`markus`])[1]);let l=w();h.update({camera:n,size:x,dt:r,time:e,warp:c,reduced:o||y===`low`,show:v===`light`&&!!l}),l&&(l.visible=!h.covering);let u=t.userData.renKeepOut||(t.userData.renKeepOut={});g.update({keepOut:u,camera:n,dt:r,theme:v,intro:b*b*(3-2*b),warp:c,tier:y,guard:_,reduced:o,travelling:!!a.travelling,progress:a.progress??1})},setTheme(e,t){v=t},setQuality(e){y=e.tier},dispose(){C&&(C.visible=!0),t.remove(p),h.dispose(),g.dispose()}}}export{C as default};