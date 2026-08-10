
window.addEventListener('error', function(e){
  const el=document.getElementById('runtimeStatus');
  if(el){ el.textContent='Hiba: '+(e.message||'JavaScript hiba'); el.classList.add('bad'); }
});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB_NAME='pm-dekor-v63', PRODUCT_STORE='products', ASSET_STORE='assets', SETTINGS_KEY='pm-dekor-settings-v63';
let products=[], pendingImage='', pendingImageMeta=null, selectedId=null, dragState=null, undoStack=[], redoStack=[], previewMode=false, cropState=null, logoSelected=false, logoDragState=null;

const defaults={
  brandName:'PM Dekor Melinda',
  facebook:'PM Dekor Melinda',
  instagram:'@pmdekor_melinda',
  orderText:'Rendelés üzenetben!',
  thanksText:'Köszönöm, hogy támogatod a kézzel készült alkotásokat!',
  accentColor:'#741521',
  posterTitle:'Mindenszenteki sírdíszek',
  posterSubtitle:'Kézzel készített, szeretettel díszítve',
  catalogTitle:'Mindenszenteki kollekció',
  backgroundMode:'template',
  logoVisible:true,
  logoScale:100,
  logoOffsetX:0,
  logoOffsetY:0
};

const DEFAULT_POSTER_ROWS=[
  {
    id:'row_default_1', align:'center',
    blocks:[
      {id:'block_default_1',units:2,title:'KIS SZÍV ALAKÚ SÍRDÍSZEK',priceLabel:'',productIds:[null,null]},
      {id:'block_default_2',units:2,title:'SZÍV ALAKÚ SÍRDÍSZEK',priceLabel:'',productIds:[null,null]}
    ]
  },
  {
    id:'row_default_2', align:'center',
    blocks:[
      {id:'block_default_3',units:2,title:'GALAMBOS ÉS VIRÁGOS SZÍV ALAKÚ SÍRDÍSZEK',priceLabel:'',productIds:[null,null]},
      {id:'block_default_4',units:2,title:'ANGYALKÁS SÍRDÍSZEK',priceLabel:'',productIds:[null,null]}
    ]
  },
  {
    id:'row_default_3', align:'center',
    blocks:[
      {id:'block_default_5',units:1,title:'KERESZT ALAKÚ',priceLabel:'',productIds:[null]},
      {id:'block_default_6',units:1,title:'NAGY DÍSZ',priceLabel:'',productIds:[null]},
      {id:'block_default_7',units:1,title:'NAGY SZÍV',priceLabel:'',productIds:[null]}
    ]
  }
];

let settings={...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')};
if(!Array.isArray(settings.posterRows)) settings.posterRows=JSON.parse(JSON.stringify(DEFAULT_POSTER_ROWS));
let assets={logo:'',background:''};
const BUILTIN_BACKGROUNDS={template:'pm-dekor-background.png',easter:'pm-dekor-background-easter.png',christmas:'pm-dekor-background-christmas.png'};
const BUILTIN_POSTER_BG = BUILTIN_BACKGROUNDS.template;

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(PRODUCT_STORE)) db.createObjectStore(PRODUCT_STORE,{keyPath:'id',autoIncrement:true});
      if(!db.objectStoreNames.contains(ASSET_STORE)) db.createObjectStore(ASSET_STORE,{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbGetAll(store){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readonly').objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbAdd(store,obj){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readwrite').objectStore(store).add(obj);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbPut(store,obj){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readwrite').objectStore(store).put(obj);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbDelete(store,key){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readwrite').objectStore(store).delete(key);
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}
async function dbClear(store){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(store,'readwrite').objectStore(store).clear();
    req.onsuccess=()=>resolve();
    req.onerror=()=>reject(req.error);
  });
}

function normProduct(p){
  return {category:'',description:'',posterLabel:'',onPoster:true,frameMode:'auto',scale:100,offsetX:0,offsetY:0,order:999,imageWidth:null,imageHeight:null,...p};
}
function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function setAccent(hex){
  document.documentElement.style.setProperty('--accent',hex);
  document.documentElement.style.setProperty('--accent-dark',shade(hex,-30));
}
function shade(hex,amt){
  const n=parseInt(hex.slice(1),16);
  const r=Math.max(0,Math.min(255,(n>>16)+amt));
  const g=Math.max(0,Math.min(255,((n>>8)&255)+amt));
  const b=Math.max(0,Math.min(255,(n&255)+amt));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function fileToData(file,max=1800,quality=.88){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const ratio=Math.min(1,max/Math.max(img.width,img.height));
        const c=document.createElement('canvas');
        c.width=Math.round(img.width*ratio);
        c.height=Math.round(img.height*ratio);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL('image/jpeg',quality));
      };
      img.onerror=reject;
      img.src=reader.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}
function mediaTransform(p){ return `translate(calc(-50% + ${p.offsetX||0}px), calc(-50% + ${p.offsetY||0}px)) scale(${(p.scale||100)/100})`; }

function getImageMetaFromData(dataUrl){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve({width:img.width,height:img.height});
    img.onerror=reject;
    img.src=dataUrl;
  });
}
function getSlotKindByPosterIndex(idx){
  if(idx>=0 && idx<=3) return 'small';
  if(idx>=4 && idx<=7) return 'big';
  if(idx>=8 && idx<=10) return 'bottom';
  return 'generic';
}
function getProductSlotKind(id){
  return 'generic';
}
function getTargetRatio(kind='generic'){
  return {generic:1.02,catalog:1.18,small:0.99,big:0.77,bottom:1.01}[kind] || 1;
}
function getSmartImageRecommendation(width,height,targetKind='generic'){
  const ar=(width&&height)?width/height:1;
  let recommendation='Normál arányú kép';
  let suggested='cover';

  if(targetKind==='catalog'){
    if(ar>1.08){
      suggested='contain';
      recommendation='Széles vagy kollázs kép – a katalógusban a „Teljes kép” ajánlott.';
    }else if(ar<0.96){
      suggested='contain';
      recommendation='Álló jellegű kép – a katalógusban a „Teljes kép” ajánlott.';
    }else{
      suggested='cover';
      recommendation='Jól illeszkedő katalógusfotó.';
    }
    return {aspect:ar,suggested,recommendation};
  }

  if(targetKind==='generic'){
    if(ar>1.06){
      suggested='contain';
      recommendation='Széles vagy kollázs kép – a plakáton a „Teljes kép” ajánlott.';
    }else if(ar<0.96){
      suggested='contain';
      recommendation='Álló jellegű kép – a plakáton a „Teljes kép” ajánlott.';
    }else{
      suggested='cover';
      recommendation='Normál termékfotó – jól működik kitöltéssel.';
    }
    return {aspect:ar,suggested,recommendation};
  }

  if(ar>1.5 || ar<0.78){
    suggested='contain';
    recommendation='Erősen eltérő képarány – a „Teljes kép” ajánlott.';
  }
  return {aspect:ar,suggested,recommendation};
}
function getSmartDefaults(width,height,targetKind='generic'){
  const rec=getSmartImageRecommendation(width,height,targetKind);
  let scale=100, offsetX=0, offsetY=0;
  if(rec.suggested==='contain'){
    scale=100;
  }else{
    if(Math.abs(rec.aspect-getTargetRatio(targetKind))>.5) scale=106;
  }
  return {frameMode:'auto',scale,offsetX,offsetY,recommendation:rec.recommendation};
}
function getEffectiveFrameMode(p, targetKind='generic'){
  const mode=p.frameMode || 'cover';
  if(mode!=='auto') return mode;
  const rec=getSmartImageRecommendation(p.imageWidth||0,p.imageHeight||0,targetKind);
  return rec.suggested;
}
function mediaModeClass(p,targetKind='generic'){
  return getEffectiveFrameMode(p,targetKind)==='contain' ? 'contain' : 'cover';
}


function syncCropLabels(){
  if(!cropState) return;
  $('#cropScaleValue').textContent=$('#cropScale').value+'%';
  $('#cropXValue').textContent=$('#cropX').value;
  $('#cropYValue').textContent=$('#cropY').value;
}
function renderCropPreview(){
  if(!cropState) return;
  cropState.targetKind=$('#cropTargetKind').value;
  cropState.frameMode=$('#cropFrameMode').value;
  cropState.scale=Number($('#cropScale').value);
  cropState.offsetX=Number($('#cropX').value);
  cropState.offsetY=Number($('#cropY').value);
  const preview=$('#cropPreview');
  preview.className='crop-preview media-frame '+mediaModeClass(cropState,cropState.targetKind)+' '+cropState.targetKind;
  preview.querySelector('img').src=cropState.image;
  preview.querySelector('img').style.transform=mediaTransform(cropState);
  const rec=getSmartImageRecommendation(cropState.imageWidth,cropState.imageHeight,cropState.targetKind);
  $('#cropMeta').innerHTML=`Méret: <strong>${cropState.imageWidth} × ${cropState.imageHeight}</strong><br>${esc(rec.recommendation)}<div class="crop-recommend">Ajánlott cél: ${cropState.targetKind==='small'?'felső kisebb blokk':cropState.targetKind==='big'?'középső magasabb blokk':cropState.targetKind==='bottom'?'alsó blokk':'általános'}</div>`;
  syncCropLabels();
}
function applySmartCropDefaults(){
  if(!cropState) return;
  const smart=getSmartDefaults(cropState.imageWidth,cropState.imageHeight,$('#cropTargetKind').value);
  $('#cropFrameMode').value='auto';
  $('#cropScale').value=smart.scale;
  $('#cropX').value=smart.offsetX;
  $('#cropY').value=smart.offsetY;
  renderCropPreview();
}
function openCropModal(config){
  cropState={...config};
  $('#cropTargetKind').value=config.targetKind || 'generic';
  const smart=getSmartDefaults(config.imageWidth,config.imageHeight,config.targetKind||'generic');
  $('#cropFrameMode').value=config.frameMode || smart.frameMode;
  $('#cropScale').value=config.scale ?? smart.scale;
  $('#cropX').value=config.offsetX ?? smart.offsetX;
  $('#cropY').value=config.offsetY ?? smart.offsetY;
  renderCropPreview();
  $('#cropModal').classList.remove('hidden');
}
function closeCropModal(){
  cropState=null;
  $('#cropModal').classList.add('hidden');
}
async function commitCropModal(){
  if(!cropState) return;
  const payload={
    image:cropState.image,
    imageWidth:cropState.imageWidth,
    imageHeight:cropState.imageHeight,
    frameMode:$('#cropFrameMode').value,
    scale:Number($('#cropScale').value),
    offsetX:Number($('#cropX').value),
    offsetY:Number($('#cropY').value)
  };
  if(cropState.mode==='new'){
    pendingImage=payload.image;
    pendingImageMeta={width:payload.imageWidth,height:payload.imageHeight};
    $('#thumbPreview').innerHTML=`<img src="${payload.image}" alt="">`;
    $('#frameModeInput').value=payload.frameMode;
    $('#scaleInput').value=payload.scale;
    $('#offsetXInput').value=payload.offsetX;
    $('#offsetYInput').value=payload.offsetY;
    updateAddLabels();
  }else if(cropState.mode==='replace-product'){
    const p=products.find(x=>x.id===cropState.productId);
    if(p){
      pushHistory();
      Object.assign(p,payload);
      await dbPut(PRODUCT_STORE,p);
      selectedId=p.id;
      await refresh();
    }
  }
  closeCropModal();
}

async function loadAssets(){
  const rows=await dbGetAll(ASSET_STORE);
  assets={logo:'',background:''};
  rows.forEach(r=>assets[r.key]=r.value);
}

async function migrateLegacyFrameModes(){
  let changed=false;
  for(const p of products){
    const untouched = (p.scale ?? 100) === 100 && (p.offsetX ?? 0) === 0 && (p.offsetY ?? 0) === 0;
    if(!untouched || !p.imageWidth || !p.imageHeight) continue;
    const smart=getSmartImageRecommendation(p.imageWidth,p.imageHeight,'generic');
    if((p.frameMode==='cover' || !p.frameMode) && smart.suggested==='contain'){
      p.frameMode='auto';
      changed=true;
      await dbPut(PRODUCT_STORE,p);
    }
  }
  return changed;
}

async function refresh(){
  products=(await dbGetAll(PRODUCT_STORE)).map(normProduct).sort((a,b)=>(a.order??999)-(b.order??999)||a.id-b.id);
  const migrated=await migrateLegacyFrameModes();
  if(migrated){
    products=(await dbGetAll(PRODUCT_STORE)).map(normProduct).sort((a,b)=>(a.order??999)-(b.order??999)||a.id-b.id);
  }
  await loadAssets();
  renderAll();
}
function renderAll(){
  ensurePosterRows();
  pruneLayoutProductIds();
  renderProducts();
  populateCategories();
  renderRowEditor();
  renderPoster();
  renderCatalog();
  renderAssetPreviews();
  updateHistoryButtons();
  setTimeout(fitPreviews,80);
}


function syncSettingsFromInputs(){
  ['brandName','facebook','instagram','orderText','thanksText','accentColor','posterTitle','posterSubtitle','catalogTitle','backgroundMode','logoScale','logoOffsetX','logoOffsetY'].forEach(id=>{
    const el=$('#'+id);
    if(el) settings[id] = el.value;
  });
  if($('#logoVisible')) settings.logoVisible = $('#logoVisible').checked;
}
function deepClone(v){ return JSON.parse(JSON.stringify(v)); }
function snapshotState(){
  syncSettingsFromInputs();
  return deepClone({products, settings, assets});
}
function updateHistoryButtons(){
  const undoBtn=$('#undoBtn'), redoBtn=$('#redoBtn'), toggleBtn=$('#togglePreviewBtn');
  if(undoBtn) undoBtn.disabled = undoStack.length===0;
  if(redoBtn) redoBtn.disabled = redoStack.length===0;
  if(toggleBtn){
    toggleBtn.textContent = `Tiszta előnézet: ${previewMode ? 'BE' : 'KI'}`;
    toggleBtn.classList.toggle('active', previewMode);
  }
  document.body.classList.toggle('clean-preview', previewMode);
}
function pushHistory(){
  const snap=snapshotState();
  const encoded=JSON.stringify(snap);
  const last=undoStack.length ? JSON.stringify(undoStack[undoStack.length-1]) : null;
  if(encoded===last) return;
  undoStack.push(snap);
  if(undoStack.length>40) undoStack.shift();
  redoStack.length=0;
  updateHistoryButtons();
}
async function applySnapshot(snapshot){
  await dbClear(PRODUCT_STORE);
  await dbClear(ASSET_STORE);
  for(const product of (snapshot.products||[])){
    await dbPut(PRODUCT_STORE,{...product});
  }
  if(snapshot.assets?.logo) await dbPut(ASSET_STORE,{key:'logo',value:snapshot.assets.logo});
  if(snapshot.assets?.background) await dbPut(ASSET_STORE,{key:'background',value:snapshot.assets.background});
  settings={...defaults,...(snapshot.settings||{})};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  selectedId=null;
  loadSettingsUi();
  await refresh();
}
async function undoAction(){
  if(!undoStack.length) return;
  const current=snapshotState();
  const previous=undoStack.pop();
  redoStack.push(current);
  await applySnapshot(previous);
  updateHistoryButtons();
}
async function redoAction(){
  if(!redoStack.length) return;
  const current=snapshotState();
  const next=redoStack.pop();
  undoStack.push(current);
  await applySnapshot(next);
  updateHistoryButtons();
}
function togglePreviewMode(){
  previewMode=!previewMode;
  updateHistoryButtons();
  renderPosterUi();
}
function quickEditSetting(key){
  const labels={
    posterTitle:'Plakát cím',
    posterSubtitle:'Plakát alcím',
    brandName:'Márkanév',
    thanksText:'Köszönet szöveg'
  };
  const current = (settings[key] ?? '');
  const next = window.prompt(labels[key] || 'Szöveg', current);
  if(next===null) return;
  pushHistory();
  settings[key]=next.trim();
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  loadSettingsUi();
  renderAll();
}
function bindPosterEditable(){
  const host=$('#posterCanvas');
  host.querySelectorAll('[data-setting-key]').forEach(el=>{
    el.ondblclick=(e)=>{
      e.preventDefault();
      e.stopPropagation();
      quickEditSetting(el.dataset.settingKey);
    };
  });
}
function renderPosterUi(){
  const host=$('#posterCanvas');
  if(!host) return;
  let toolbar=host.querySelector('#posterToolbar');
  if(!toolbar){
    toolbar=document.createElement('div');
    toolbar.id='posterToolbar';
    toolbar.className='poster-toolbar hidden';
    host.appendChild(toolbar);
  }
  const p=products.find(x=>x.id===selectedId);
  if(previewMode){
    toolbar.classList.add('hidden');
    updateHistoryButtons();
    return;
  }

  if(logoSelected && settings.logoVisible!==false){
    toolbar.classList.remove('hidden');
    toolbar.innerHTML=`
      <span class="toolbar-title">Logó</span>
      <button class="tool-btn" type="button" data-logo-act="smaller">− Méret</button>
      <button class="tool-btn" type="button" data-logo-act="larger">+ Méret</button>
      <button class="tool-btn" type="button" data-logo-act="center">Alaphelyzet</button>
      <button class="tool-btn" type="button" data-logo-act="replace">Csere</button>
      <button class="tool-btn" type="button" data-logo-act="hide">Elrejtés</button>
    `;
    toolbar.querySelector('[data-logo-act="smaller"]').onclick=()=>{ pushHistory(); settings.logoScale=Math.max(55,Number(settings.logoScale||100)-10); saveLogoLayout(); renderPoster(); };
    toolbar.querySelector('[data-logo-act="larger"]').onclick=()=>{ pushHistory(); settings.logoScale=Math.min(160,Number(settings.logoScale||100)+10); saveLogoLayout(); renderPoster(); };
    toolbar.querySelector('[data-logo-act="center"]').onclick=()=>{ pushHistory(); settings.logoScale=100; settings.logoOffsetX=0; settings.logoOffsetY=0; saveLogoLayout(); renderPoster(); };
    toolbar.querySelector('[data-logo-act="replace"]').onclick=()=>{ const inp=$('#logoInput'); if(inp){ inp.value=''; inp.click(); } };
    toolbar.querySelector('[data-logo-act="hide"]').onclick=()=>{ pushHistory(); settings.logoVisible=false; logoSelected=false; saveLogoLayout(); renderPoster(); };
    updateHistoryButtons();
    return;
  }

  if(!p){
    toolbar.classList.add('hidden');
    updateHistoryButtons();
    return;
  }
  toolbar.classList.remove('hidden');
  toolbar.innerHTML=`
    <span class="toolbar-title">${esc(p.name)}</span>
    <button class="tool-btn" type="button" data-act="zoomout">− Zoom</button>
    <button class="tool-btn" type="button" data-act="zoomin">+ Zoom</button>
    <button class="tool-btn" type="button" data-act="togglemode">${p.frameMode==='auto' ? 'AUTO' : (p.frameMode==='cover' ? 'Teljes kép' : 'Kitöltés')}</button>
    <button class="tool-btn" type="button" data-act="recrop">Újravágás</button>
    <button class="tool-btn" type="button" data-act="replace">Csere</button>
    <button class="tool-btn" type="button" data-act="reset">Reset</button>
  `;
  toolbar.querySelector('[data-act="zoomout"]').onclick=async()=>{ pushHistory(); p.scale=Math.max(50,(p.scale||100)-10); await dbPut(PRODUCT_STORE,p); renderAll(); selectedId=p.id; };
  toolbar.querySelector('[data-act="zoomin"]').onclick=async()=>{ pushHistory(); p.scale=Math.min(220,(p.scale||100)+10); await dbPut(PRODUCT_STORE,p); renderAll(); selectedId=p.id; };
  toolbar.querySelector('[data-act="togglemode"]').onclick=async()=>{ pushHistory(); p.frameMode=p.frameMode==='auto' ? 'cover' : (p.frameMode==='cover' ? 'contain' : 'auto'); await dbPut(PRODUCT_STORE,p); renderAll(); selectedId=p.id; };
  toolbar.querySelector('[data-act="recrop"]').onclick=()=>{
    openCropModal({
      mode:'replace-product',
      productId:p.id,
      image:p.image,
      imageWidth:p.imageWidth||1000,
      imageHeight:p.imageHeight||1000,
      targetKind:'generic',
      frameMode:p.frameMode,
      scale:p.scale,
      offsetX:p.offsetX,
      offsetY:p.offsetY
    });
  };
  toolbar.querySelector('[data-act="replace"]').onclick=()=>{ const inp=$('#replaceImageInput'); if(inp){ inp.value=''; inp.click(); } };
  toolbar.querySelector('[data-act="reset"]').onclick=async()=>{ pushHistory(); p.frameMode='auto'; p.scale=100; p.offsetX=0; p.offsetY=0; await dbPut(PRODUCT_STORE,p); renderAll(); selectedId=p.id; };
  updateHistoryButtons();
}


function syncLogoControlLabels(){
  if($('#logoScale')) $('#logoScaleValue').textContent = `${$('#logoScale').value}%`;
  if($('#logoOffsetX')) $('#logoOffsetXValue').textContent = `${$('#logoOffsetX').value} px`;
  if($('#logoOffsetY')) $('#logoOffsetYValue').textContent = `${$('#logoOffsetY').value} px`;
}
function logoDiscInlineStyle(){
  const scale = Number(settings.logoScale ?? 100) / 100;
  const x = Number(settings.logoOffsetX ?? 0);
  const y = Number(settings.logoOffsetY ?? 0);
  return `transform:translate(${x}px, ${y}px) scale(${scale});`;
}
function logoSlotMarkup(){
  if(settings.logoVisible === false) return `<div class="logo-slot-empty" aria-hidden="true"></div>`;
  return `<div class="logo-disc ${logoSelected?'logo-selected':''}" data-logo-interactive="true" style="${logoDiscInlineStyle()}">
    ${logoMarkup()}
    <button class="logo-resize-handle" type="button" aria-label="Logó átméretezése" title="Húzd a logó méretéhez"></button>
  </div>`;
}
function applyLogoSettingsFromPanel(){
  if($('#logoVisible')) settings.logoVisible = $('#logoVisible').checked;
  if($('#logoScale')) settings.logoScale = Number($('#logoScale').value);
  if($('#logoOffsetX')) settings.logoOffsetX = Number($('#logoOffsetX').value);
  if($('#logoOffsetY')) settings.logoOffsetY = Number($('#logoOffsetY').value);
  syncLogoControlLabels();
}

function logoMarkup(){
  if(assets.logo) return `<img class="logo-inner" src="${assets.logo}" alt="PM Dekor logó">`;
  return `<div class="logo-fallback"><div class="pm">PM</div><div class="brand">DEKOR</div><div class="small">MELINDA</div></div>`;
}

function catalogLogoMarkup(){
  if(settings.logoVisible===false) return '';
  return `<div class="catalog-logo-disc">${logoMarkup()}</div>`;
}

function cornerSvg(cls){
  return `<svg class="corner ${cls}" viewBox="0 0 170 150" aria-hidden="true">
    <path d="M8 139 C38 107 61 82 112 18" fill="none" stroke="#755c39" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M34 123 C61 103 85 82 142 55" fill="none" stroke="#8a6c43" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M54 99 C83 76 104 57 145 24" fill="none" stroke="#96754b" stroke-width="2.1" stroke-linecap="round"/>
    <ellipse cx="28" cy="112" rx="11" ry="26" fill="#9d4634" transform="rotate(-49 28 112)"/>
    <ellipse cx="49" cy="92" rx="10" ry="26" fill="#d28736" transform="rotate(-40 49 92)"/>
    <ellipse cx="72" cy="69" rx="11" ry="25" fill="#7f3e2f" transform="rotate(-36 72 69)"/>
    <ellipse cx="95" cy="46" rx="10" ry="23" fill="#e0aa45" transform="rotate(-29 95 46)"/>
    <ellipse cx="57" cy="119" rx="9" ry="22" fill="#bd5a35" transform="rotate(50 57 119)"/>
    <ellipse cx="83" cy="100" rx="9" ry="22" fill="#e0a145" transform="rotate(49 83 100)"/>
    <ellipse cx="110" cy="78" rx="10" ry="23" fill="#8e2435" transform="rotate(45 110 78)"/>
    <circle cx="128" cy="63" r="9" fill="#9c1f35"/><circle cx="142" cy="69" r="8" fill="#b83c50"/><circle cx="137" cy="52" r="7" fill="#7a1628"/>
    <circle cx="150" cy="82" r="6" fill="#b27734"/><circle cx="158" cy="72" r="5" fill="#8d5a28"/>
    <g transform="translate(120 102)">
      <circle cx="0" cy="0" r="25" fill="#741525"/>
      <path d="M-18 1 C-10 -16 8 -17 18 -3 C13 10 -3 18 -18 1Z" fill="#a72c42"/>
      <path d="M-11 -7 C-2 -17 13 -12 15 1 C7 11 -8 10 -11 -7Z" fill="#c35161"/>
      <path d="M-4 -4 C4 -10 11 -4 9 4 C4 9 -5 7 -4 -4Z" fill="#6d1121"/>
    </g>
    <g fill="#d9b27b" opacity=".9">
      <circle cx="103" cy="120" r="4"/><circle cx="112" cy="128" r="4"/><circle cx="120" cy="120" r="4"/><circle cx="128" cy="132" r="4"/>
    </g>
  </svg>`;
}
function singleSlotMarkup(p,size,type){
  const photoClass=size==='small' ? 'small-photo' : size==='big' ? 'big-photo' : 'bottom-photo';
  if(!p){
    return `<div class="product-slot"><div class="slot-head">${type==='top'?'<div class="price">—</div>':'<span class="ribbon">—</span>'}<div class="label">ÜRES HELY</div></div><div class="${photoClass} placeholder">Nincs kijelölt termék</div></div>`;
  }
  const head = type==='top'
    ? `<div class="price">${esc(p.price)}</div><div class="label">${esc(p.category||p.name)}</div>`
    : `<span class="ribbon">${esc(p.price)}</span><div class="label">${esc(p.name)}</div>`;
  return `<div class="product-slot">
    <div class="slot-head">${head}</div>
    <div class="${photoClass} media-frame ${mediaModeClass(p,size)}" data-product-id="${p.id}" data-slot-kind="${size}">
      <img src="${p.image}" alt="">
    </div>
  </div>`;
}
function combinedSlotMarkup(items,size,type,title,priceLabel){
  const boxClass=size==='small'?'small':'big';
  const inner = items.map(p=>{
    if(!p){
      return `<div class="combo-cell"><div class="combo-mini-head"><div class="combo-mini-price">—</div><div class="combo-mini-label">ÜRES</div></div><div class="combo-media placeholder">Nincs kép</div></div>`;
    }
    return `<div class="combo-cell">
      <div class="combo-mini-head">
        <div class="combo-mini-price">${esc(p.price)}</div>
        <div class="combo-mini-label">${esc(p.category || p.name)}</div>
      </div>
      <div class="combo-media media-frame ${mediaModeClass(p,size)}" data-product-id="${p.id}" data-slot-kind="${size}">
        <img src="${p.image}" alt="">
      </div>
    </div>`;
  }).join('');
  const head = type==='top'
    ? `<div class="combo-main">${esc(priceLabel)}</div><div class="combo-title">${esc(title)}</div>`
    : `<span class="combo-ribbon">${esc(priceLabel)}</span><div class="combo-title">${esc(title)}</div>`;
  return `<div class="combo-slot">
    <div class="combo-head">${head}</div>
    <div class="combo-box combo-two ${boxClass}">
      <div class="combo-items two">${inner}</div>
    </div>
  </div>`;
}
function selectedProducts(){ return products.filter(p=>p.onPoster); }

function uid(prefix='id'){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
}
function ensurePosterRows(){
  if(!Array.isArray(settings.posterRows)){
    settings.posterRows=JSON.parse(JSON.stringify(DEFAULT_POSTER_ROWS));
  }

  if(settings.posterRows.length>5){
    settings.posterRows.splice(5);
  }

  settings.posterRows.forEach(row=>{
    if(!row.id) row.id=uid('row');
    if(!['left','center','right','spread'].includes(row.align)) row.align='center';
    if(!Array.isArray(row.blocks)) row.blocks=[];

    row.blocks.forEach(block=>{
      if(!block.id) block.id=uid('block');

      block.units=Math.max(1,Math.min(4,Number(block.units)||1));
      block.imageCount=Math.max(
        1,
        Math.min(3,Number(block.imageCount)||Math.min(block.units,3))
      );

      if(block.title===undefined || block.title===null) block.title='';
      if(block.priceLabel===undefined || block.priceLabel===null) block.priceLabel='';
      if(!['classic','airy'].includes(block.variant)) block.variant='classic';

      if(!Array.isArray(block.productIds)) block.productIds=[];
      block.productIds=block.productIds.slice(0,block.imageCount).map(id=>id ? Number(id) : null);
      while(block.productIds.length<block.imageCount) block.productIds.push(null);
    });
  });
}
function rowUsedUnits(row){
  return (row.blocks||[]).reduce((sum,b)=>sum+(Number(b.units)||1),0);
}
function createBlock(units=1,imageCount=1){
  units=Math.max(1,Math.min(4,Number(units)||1));
  imageCount=Math.max(1,Math.min(3,Number(imageCount)||1));
  return {id:uid('block'),units,imageCount,title:'',priceLabel:'',variant:'classic',productIds:Array(imageCount).fill(null)};
}
function createRow(unitsList=[1]){
  return {id:uid('row'),align:'center',blocks:unitsList.map(units=>createBlock(units,Math.min(units,3)))};
}
function savePosterRows(){
  ensurePosterRows();
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
}

function pruneLayoutProductIds(){
  const valid=new Set(products.map(p=>p.id));
  let changed=false;
  ensurePosterRows();
  settings.posterRows.forEach(row=>row.blocks.forEach(block=>{
    block.productIds=(block.productIds||[]).map(id=>{
      if(id && !valid.has(Number(id))){ changed=true; return null; }
      return id ? Number(id) : null;
    });
  }));
  if(changed) savePosterRows();
}
function updatePosterLiveStatus(text='Előnézet frissítve'){
  const el=$('#posterLiveStatus');
  if(!el) return;
  el.textContent=text;
  el.classList.add('pulse');
  clearTimeout(updatePosterLiveStatus._t);
  updatePosterLiveStatus._t=setTimeout(()=>{
    el.textContent='Élő plakát-előnézet';
    el.classList.remove('pulse');
  },900);
}
function getLayoutProductPool(){
  return products.filter(p=>p.onPoster);
}
function findLayoutBlock(rowId,blockId){
  const row=settings.posterRows?.find(r=>r.id===rowId);
  return {row,block:row?.blocks?.find(b=>b.id===blockId)};
}
function productSelectOptions(selected){
  const options=[`<option value="">— Üres —</option>`];
  products.forEach(p=>{
    options.push(`<option value="${p.id}" ${Number(selected)===p.id?'selected':''}>${esc(p.name)} · ${esc(p.price)}</option>`);
  });
  return options.join('');
}
function renderRowEditor(){
  const host=$('#rowEditorList');
  if(!host) return;
  ensurePosterRows();
  if(!settings.posterRows.length){
    host.innerHTML='<div class="empty">Még nincs sor. Válassz fent egy sortípust.</div>';
    return;
  }
  host.innerHTML=settings.posterRows.map((row,rowIndex)=>{
    const used=rowUsedUnits(row);
    return `<article class="row-editor-card" data-row-id="${row.id}">
      <div class="row-editor-head">
        <div class="row-editor-name">Sor ${rowIndex+1}
          <span class="row-capacity ${used<4?'partial':''}">${used}/4 ${used<4?'· csonka':''}</span>
        </div>
        <select class="row-align-select" aria-label="Sor igazítása">
          <option value="left" ${row.align==='left'?'selected':''}>Balra</option>
          <option value="center" ${row.align==='center'?'selected':''}>Középre</option>
          <option value="right" ${row.align==='right'?'selected':''}>Jobbra</option>
          <option value="spread" ${row.align==='spread'?'selected':''}>Egyenletes</option>
        </select>
        <div class="row-editor-actions">
          <button class="icon-btn row-up" type="button" title="Sor fel">↑</button>
          <button class="icon-btn row-down" type="button" title="Sor le">↓</button>
          <button class="icon-btn row-delete" type="button" title="Sor törlése">×</button>
        </div>
      </div>

      <div class="row-block-editor-list">
        ${(row.blocks||[]).map((block,blockIndex)=>`
          <div class="row-block-editor" data-block-id="${block.id}">
            <div class="block-editor-top">
              <label>Szélesség
                <select class="block-units-select">
                  <option value="1" ${block.units===1?'selected':''}>1× normál</option>
                  <option value="2" ${block.units===2?'selected':''}>2× dupla</option>
                  <option value="3" ${block.units===3?'selected':''}>3× széles</option>
                  <option value="4" ${block.units===4?'selected':''}>4× teljes sor</option>
                </select>
              </label>
              <label>Képek
                <select class="block-image-count-select">
                  <option value="1" ${(block.imageCount||1)===1?'selected':''}>1 kép</option>
                  <option value="2" ${(block.imageCount||1)===2?'selected':''}>2 kép</option>
                  <option value="3" ${(block.imageCount||1)===3?'selected':''}>3 kép</option>
                </select>
              </label>
              <label>Típus
                <select class="block-variant-select">
                  <option value="classic" ${(block.variant||'classic')==='classic'?'selected':''}>Klasszikus</option>
                  <option value="airy" ${(block.variant||'classic')==='airy'?'selected':''}>Szellős</option>
                </select>
              </label>
              <button class="icon-btn remove-layout-block" type="button" title="Blokk törlése">×</button>
            </div>
            <div class="block-editor-texts">
              <label>Közös cím
                <input class="block-title-input" value="${esc(block.title)}" placeholder="Automatikus, ha üres">
              </label>
              <label>Közös ár / ársáv
                <input class="block-price-input" value="${esc(block.priceLabel)}" placeholder="Automatikus, ha üres">
              </label>
            </div>
            <div class="block-slot-selects cols-${block.imageCount||1}">
              ${Array.from({length:block.imageCount||1},(_,slotIndex)=>`
                <label>${slotIndex+1}. kép
                  <select class="block-product-select" data-slot-index="${slotIndex}">
                    ${productSelectOptions(block.productIds?.[slotIndex])}
                  </select>
                </label>`).join('')}
            </div>
          </div>`).join('')}
      </div>

      <div class="row-add-blocks">
        <span class="note">Új blokk:</span>
        <button class="btn tiny add-layout-block" data-units="1" type="button" ${used+1>4?'disabled':''}>+ Normál</button>
        <button class="btn tiny add-layout-block" data-units="2" type="button" ${used+2>4?'disabled':''}>+ Dupla</button>
        <button class="btn tiny add-layout-block" data-units="3" type="button" ${used+3>4?'disabled':''}>+ Tripla</button>
        <button class="btn tiny add-layout-block" data-units="4" type="button" ${used+4>4?'disabled':''}>+ Teljes sor</button>
      </div>
    </article>`;
  }).join('');

  host.querySelectorAll('.row-editor-card').forEach(card=>{
    const rowId=card.dataset.rowId;
    const row=settings.posterRows.find(r=>r.id===rowId);
    card.querySelector('.row-align-select').onchange=e=>{
      pushHistory(); row.align=e.target.value; savePosterRows(); renderAll(); updatePosterLiveStatus('Sor igazítása frissítve');
    };
    card.querySelector('.row-up').onclick=()=>{
      const idx=settings.posterRows.findIndex(r=>r.id===rowId); if(idx<=0)return;
      pushHistory(); [settings.posterRows[idx-1],settings.posterRows[idx]]=[settings.posterRows[idx],settings.posterRows[idx-1]];
      savePosterRows(); renderAll(); updatePosterLiveStatus('Sor mozgatva');
    };
    card.querySelector('.row-down').onclick=()=>{
      const idx=settings.posterRows.findIndex(r=>r.id===rowId); if(idx<0||idx>=settings.posterRows.length-1)return;
      pushHistory(); [settings.posterRows[idx+1],settings.posterRows[idx]]=[settings.posterRows[idx],settings.posterRows[idx+1]];
      savePosterRows(); renderAll(); updatePosterLiveStatus('Sor mozgatva');
    };
    card.querySelector('.row-delete').onclick=()=>{
      pushHistory(); settings.posterRows=settings.posterRows.filter(r=>r.id!==rowId); savePosterRows(); renderAll(); updatePosterLiveStatus('Sor törölve');
    };

    card.querySelectorAll('.row-block-editor').forEach(blockEl=>{
      const blockId=blockEl.dataset.blockId;
      const block=row.blocks.find(b=>b.id===blockId);
      blockEl.querySelector('.block-units-select').onchange=e=>{
        const next=Number(e.target.value);
        const otherUnits=rowUsedUnits(row)-block.units;
        if(otherUnits+next>4){ alert('Egy sor legfeljebb 4 szélességi egység lehet.'); e.target.value=block.units; return; }
        pushHistory();
        block.units=next;
        savePosterRows(); renderAll();
        updatePosterLiveStatus('Blokk szélessége frissítve');
      };
      blockEl.querySelector('.block-image-count-select').onchange=e=>{
        const next=Math.max(1,Math.min(3,Number(e.target.value)||1));
        pushHistory();
        block.imageCount=next;
        block.productIds=(block.productIds||[]).slice(0,next);
        while(block.productIds.length<next) block.productIds.push(null);
        savePosterRows(); renderAll();
        updatePosterLiveStatus('Képszám frissítve');
      };
      blockEl.querySelector('.block-variant-select').onchange=e=>{
        pushHistory(); block.variant=e.target.value; savePosterRows(); renderAll(); updatePosterLiveStatus('Blokktípus frissítve');
      };
      blockEl.querySelector('.block-title-input').onchange=e=>{
        pushHistory(); block.title=e.target.value.trim(); savePosterRows(); renderAll(); updatePosterLiveStatus('Cím frissítve');
      };
      blockEl.querySelector('.block-price-input').onchange=e=>{
        pushHistory(); block.priceLabel=e.target.value.trim(); savePosterRows(); renderAll(); updatePosterLiveStatus('Ár frissítve');
      };
      blockEl.querySelector('.remove-layout-block').onclick=()=>{
        pushHistory(); row.blocks=row.blocks.filter(b=>b.id!==blockId); savePosterRows(); renderAll(); updatePosterLiveStatus('Blokk törölve');
      };
      blockEl.querySelectorAll('.block-product-select').forEach(sel=>{
        sel.onchange=e=>{
          pushHistory();
          const slotIndex=Number(e.target.dataset.slotIndex);
          block.productIds[slotIndex] = e.target.value ? Number(e.target.value) : null;
          savePosterRows();
          renderAll();
          updatePosterLiveStatus(e.target.value ? 'Termék felkerült a plakátra' : 'Képhely kiürítve');
        };
      });
    });

    card.querySelectorAll('.add-layout-block').forEach(btn=>{
      btn.onclick=()=>{
        const units=Number(btn.dataset.units);
        if(rowUsedUnits(row)+units>4) return;
        pushHistory(); row.blocks.push(createBlock(units,1)); savePosterRows(); renderAll(); updatePosterLiveStatus('Új blokk hozzáadva');
      };
    });
  });
}
function addPresetRow(unitsList){
  ensurePosterRows();
  if(settings.posterRows.length>=5){ alert('A plakáton legfeljebb 5 sort engedünk, hogy ne zsúfolódjon össze.'); return; }
  pushHistory();
  settings.posterRows.push(createRow(unitsList));
  savePosterRows();
  renderAll();
}
function autoAssignLayoutProducts(){
  ensurePosterRows();
  const pool=getLayoutProductPool();
  let cursor=0;
  pushHistory();
  settings.posterRows.forEach(row=>row.blocks.forEach(block=>{
    const count=Math.max(1,Math.min(3,Number(block.imageCount)||1));
    block.productIds=Array.from({length:count},()=>pool[cursor++]?.id ?? null);
  }));
  savePosterRows();
  renderAll();
  updatePosterLiveStatus('Termékek kiosztva');
}
function layoutHasAnyAssignment(){
  ensurePosterRows();
  return settings.posterRows.some(row=>row.blocks.some(block=>(block.productIds||[]).some(Boolean)));
}
function ensureInitialLayoutAssignments(){
  // V7.4: nincs rejtett automatikus kiosztás.
  // A szerkesztő és az előnézet mindig ugyanazt a settings.posterRows állapotot használja.
}
function blockProducts(block){
  const count=Math.max(1,Math.min(3,Number(block.imageCount)||1));
  return Array.from({length:count},(_,i)=>products.find(p=>p.id===Number(block.productIds?.[i])) || null);
}
function automaticBlockPrice(block){
  const values=blockProducts(block).filter(Boolean).map(p=>p.price).filter(Boolean);
  return [...new Set(values)].join(' / ') || '—';
}
function automaticBlockTitle(block){
  const values=blockProducts(block).filter(Boolean).map(p=>p.category||p.name).filter(Boolean);
  const unique=[...new Set(values)];
  return unique.join(' + ') || 'ÜRES BLOKK';
}

function productShortTitle(p){
  return (p?.posterLabel || p?.category || p?.name || '').trim().slice(0,42);
}
function productShortPrice(p){
  return (p?.price || '—').trim();
}

function renderV7Block(block,rowUsed,align){
  const items=blockProducts(block);
  const title=(block.title||'').trim() || automaticBlockTitle(block);
  const price=(block.priceLabel||'').trim() || automaticBlockPrice(block);
  const variant=block.variant || 'classic';
  const imageCount=Math.max(1,Math.min(3,Number(block.imageCount)||1));
  const widthStyle=align==='spread' ? `width:${block.units/4*100}%` : `flex:${block.units} 1 0`;

  const cellMarkup = items.map((p,idx)=>{
    const mini = p ? `
      <div class="v7-mini-head">
        <div class="v7-mini-price">${esc(productShortPrice(p))}</div>
        <div class="v7-mini-title">${esc(productShortTitle(p) || ('Termék ' + (idx+1)))}</div>
      </div>` : `<div class="v7-mini-head empty"><div class="v7-mini-price">—</div><div class="v7-mini-title">${idx+1}. kép helye</div></div>`;

    return p
      ? `<div class="v7-media-cell media-frame ${mediaModeClass(p,'generic')}" data-product-id="${p.id}" data-slot-kind="generic">
           ${variant==='classic' ? mini : ''}
           <img src="${p.image}" alt="">
         </div>`
      : `<div class="v7-media-cell v7-empty">
           ${variant==='classic' ? mini : `<span>${idx+1}. kép helye</span>`}
         </div>`;
  }).join('');

  return `<div class="v7-block v7-variant-${variant}" style="${widthStyle}">
    <div class="v7-block-head">
      <div class="v7-block-price">${esc(price)}</div>
      <div class="v7-block-title">${esc(title)}</div>
    </div>
    <div class="v7-block-media slots-${imageCount}">
      ${cellMarkup}
    </div>
  </div>`;
}
function renderDynamicPosterRows(){
  ensurePosterRows();
  if(!settings.posterRows.length) return `<div class="dynamic-rows"><div class="dynamic-row-empty">Adj hozzá legalább egy sort a sorszerkesztőben.</div></div>`;
  return `<div class="dynamic-rows">
    ${settings.posterRows.map(row=>{
      const used=Math.max(1,rowUsedUnits(row));
      const widthPct=row.align==='spread' ? 100 : Math.min(100,(used/4)*100);
      return `<div class="dynamic-poster-row align-${row.align}">
        <div class="dynamic-row-inner" style="width:${widthPct}%">
          ${(row.blocks||[]).length ? row.blocks.map(block=>renderV7Block(block,used,row.align)).join('') : '<div class="dynamic-row-empty">Üres sor</div>'}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function getBackgroundSrc(){
  if(settings.backgroundMode==='custom' && assets.background) return assets.background;
  return BUILTIN_BACKGROUNDS[settings.backgroundMode] || BUILTIN_POSTER_BG;
}

function posterBackgroundStyle(){
  const bg = getBackgroundSrc();
  return `background-image:url('${bg}');background-size:cover;background-position:center;background-repeat:no-repeat;`;
}

function syncBackgroundPresetUi(){
  const mode=settings.backgroundMode || 'template';
  if($('#backgroundMode')) $('#backgroundMode').value=mode;
  $$('.season-bg-card').forEach(card=>card.classList.toggle('active', card.dataset.bgCard===mode));
  $$('.season-bg-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.bgPreset===mode));
}

function syncLogoPanelFromSettings(){
  if($('#logoScale')) $('#logoScale').value=Number(settings.logoScale ?? 100);
  if($('#logoOffsetX')) $('#logoOffsetX').value=Number(settings.logoOffsetX ?? 0);
  if($('#logoOffsetY')) $('#logoOffsetY').value=Number(settings.logoOffsetY ?? 0);
  if($('#logoVisible')) $('#logoVisible').checked=settings.logoVisible!==false;
  syncLogoControlLabels();
}
function saveLogoLayout(){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  syncLogoPanelFromSettings();
}
function bindInteractiveLogo(){
  const host=$('#posterCanvas');
  const logo=host?.querySelector('[data-logo-interactive]');
  if(!logo) return;

  logo.onclick=e=>{
    if(e.target.closest('.logo-resize-handle')) return;
    logoSelected=true;
    selectedId=null;
    logo.classList.add('logo-selected');
    updateSelectedControls();
    renderPosterUi();
    e.stopPropagation();
  };

  logo.ondblclick=e=>{
    if(e.target.closest('.logo-resize-handle')) return;
    e.preventDefault();
    e.stopPropagation();
    const inp=$('#logoInput');
    if(inp){ inp.value=''; inp.click(); }
  };

  logo.onpointerdown=e=>{
    if(e.target.closest('.logo-resize-handle')) return;
    if(e.button!==undefined && e.button!==0) return;
    logoSelected=true;
    selectedId=null;
    pushHistory();
    logoDragState={
      mode:'move',
      startX:e.clientX,
      startY:e.clientY,
      baseX:Number(settings.logoOffsetX||0),
      baseY:Number(settings.logoOffsetY||0)
    };
    logo.setPointerCapture?.(e.pointerId);
    renderPosterUi();
    e.preventDefault();
    e.stopPropagation();
  };

  const handle=logo.querySelector('.logo-resize-handle');
  if(handle){
    handle.onpointerdown=e=>{
      if(e.button!==undefined && e.button!==0) return;
      logoSelected=true;
      selectedId=null;
      pushHistory();
      logoDragState={
        mode:'resize',
        startX:e.clientX,
        startY:e.clientY,
        baseScale:Number(settings.logoScale||100)
      };
      handle.setPointerCapture?.(e.pointerId);
      renderPosterUi();
      e.preventDefault();
      e.stopPropagation();
    };
  }

  const move=e=>{
    if(!logoDragState) return;
    if(logoDragState.mode==='move'){
      const dx=e.clientX-logoDragState.startX;
      const dy=e.clientY-logoDragState.startY;
      settings.logoOffsetX=Math.max(-110,Math.min(110,Math.round(logoDragState.baseX+dx)));
      settings.logoOffsetY=Math.max(-90,Math.min(90,Math.round(logoDragState.baseY+dy)));
    }else{
      const delta=((e.clientX-logoDragState.startX)+(e.clientY-logoDragState.startY))/2;
      settings.logoScale=Math.max(55,Math.min(160,Math.round(logoDragState.baseScale+delta*.65)));
    }
    logo.style.transform=logoDiscInlineStyle().replace('transform:','').replace(/;$/,'');
    syncLogoPanelFromSettings();
  };

  const up=()=>{
    if(!logoDragState) return;
    logoDragState=null;
    saveLogoLayout();
    renderPoster();
  };

  window.addEventListener('pointermove',move,{signal:logo._abort?.signal});
  window.addEventListener('pointerup',up,{signal:logo._abort?.signal});
}

function renderPoster(){
  settings.posterTitle=$('#posterTitle').value;
  settings.posterSubtitle=$('#posterSubtitle').value;
  settings.backgroundMode=$('#backgroundMode').value;
  ensurePosterRows();

  const host=$('#posterCanvas');
  host.innerHTML=`<section class="poster" style="${posterBackgroundStyle()}">
    <header class="poster-head">
      ${logoSlotMarkup()}
      <div class="poster-title poster-editable" data-setting-key="posterTitle">
        <div class="script">${esc((settings.posterTitle||'Mindenszenteki sírdíszek').split(' ')[0] || 'Mindenszenteki')}</div>
        <h2>${esc(((settings.posterTitle||'Mindenszenteki sírdíszek').split(' ').slice(1).join(' ')) || 'SÍRDÍSZEK')}</h2>
        <div class="tag poster-editable" data-setting-key="posterSubtitle">♥ ${esc(settings.posterSubtitle)} ♥</div>
      </div>
      <div aria-hidden="true"></div>
    </header>

    ${renderDynamicPosterRows()}

    <footer class="poster-footer">
      <strong class="poster-editable" data-setting-key="brandName">${esc(settings.brandName)}</strong>
      <div class="contacts">Facebook: ${esc(settings.facebook)} &nbsp; • &nbsp; Instagram: ${esc(settings.instagram)} &nbsp; • &nbsp; ${esc(settings.orderText)}</div>
      <div class="thanks poster-editable" data-setting-key="thanksText">♥ ${esc(settings.thanksText)} ♥</div>
    </footer>
  </section>`;
  applyMediaTransforms(host);
  attachPosterDrag(host);
  bindInteractiveLogo();
  bindPosterEditable();
  updateSelectedControls();
  renderPosterUi();
}
function applyMediaTransforms(scope=document){
  scope.querySelectorAll('.media-frame[data-product-id]').forEach(frame=>{
    const p=products.find(x=>x.id===Number(frame.dataset.productId));
    if(!p) return;
    const img=frame.querySelector('img');
    if(img) img.style.transform=mediaTransform(p);
    frame.classList.toggle('selected', selectedId===p.id);
  });
}
function attachPosterDrag(scope){
  scope.querySelectorAll('.media-frame[data-product-id]').forEach(frame=>{
    frame.onclick=()=>{
      logoSelected=false;
      selectedId=Number(frame.dataset.productId);
      updateSelectedControls();
      applyMediaTransforms(scope);
      renderPosterUi();
    };
    frame.onpointerdown=e=>{
      if(e.button!==undefined && e.button!==0) return;
      const id=Number(frame.dataset.productId);
      const p=products.find(x=>x.id===id);
      if(!p) return;
      logoSelected=false;
      selectedId=id;
      updateSelectedControls();
      applyMediaTransforms(scope);
      dragState={id,startX:e.clientX,startY:e.clientY,offsetX:p.offsetX||0,offsetY:p.offsetY||0,changed:false};
      frame.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    frame.onpointermove=e=>{
      if(!dragState || dragState.id!==Number(frame.dataset.productId)) return;
      const p=products.find(x=>x.id===dragState.id);
      if(!p) return;
      if(!dragState.changed){ pushHistory(); dragState.changed=true; }
      p.offsetX=Math.round(dragState.offsetX + (e.clientX-dragState.startX));
      p.offsetY=Math.round(dragState.offsetY + (e.clientY-dragState.startY));
      applyMediaTransforms(scope);
      syncSelectedControlValues(p);
      renderPosterUi();
    };
    frame.onpointerup=async()=>{
      if(!dragState) return;
      const p=products.find(x=>x.id===dragState.id);
      const changed=dragState.changed;
      dragState=null;
      if(p && changed){
        await dbPut(PRODUCT_STORE,p);
        renderProducts();
        renderCatalog();
      }
    };
    frame.ondragover=e=>{
      if(e.dataTransfer?.files?.length){
        e.preventDefault();
        frame.classList.add('drop-target');
      }
    };
    frame.ondragleave=()=>frame.classList.remove('drop-target');
    frame.ondrop=async e=>{
      e.preventDefault();
      frame.classList.remove('drop-target');
      const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));
      if(!file) return;
      const id=Number(frame.dataset.productId);
      const p=products.find(x=>x.id===id);
      if(!p) return;
      const image=await fileToData(file);
      const meta=await getImageMetaFromData(image);
      const smart=getSmartDefaults(meta.width,meta.height,frame.dataset.slotKind || getProductSlotKind(id));
      pushHistory();
      p.image=image;
      p.imageWidth=meta.width;
      p.imageHeight=meta.height;
      p.frameMode='auto';
      p.scale=smart.scale;
      p.offsetX=0;
      p.offsetY=0;
      selectedId=id;
      await dbPut(PRODUCT_STORE,p);
      renderAll();
    };
  });
}
function updateSelectedControls(){
  const p=products.find(x=>x.id===selectedId);
  ['selectedFrameMode','selectedScale','selectedX','selectedY','resetSelectedBtn','smartSelectedBtn'].forEach(id=>$('#'+id).disabled=!p);
  if(!p){
    $('#selectedProductText').textContent='Kattints egy képre a plakáton.';
    $('#selectedScaleValue').textContent='100%';
    $('#selectedXValue').textContent='0';
    $('#selectedYValue').textContent='0';
    renderPosterUi();
    return;
  }
  $('#selectedProductText').textContent=p.name;
  $('#selectedFrameMode').value=p.frameMode;
  $('#selectedScale').value=p.scale;
  $('#selectedX').value=p.offsetX;
  $('#selectedY').value=p.offsetY;
  syncSelectedControlValues(p);
  renderPosterUi();
}
function syncSelectedControlValues(p){
  $('#selectedScaleValue').textContent=p.scale+'%';
  $('#selectedXValue').textContent=p.offsetX;
  $('#selectedYValue').textContent=p.offsetY;
}
async function changeSelectedProduct(){
  const p=products.find(x=>x.id===selectedId);
  if(!p) return;
  p.frameMode=$('#selectedFrameMode').value;
  p.scale=Number($('#selectedScale').value);
  p.offsetX=Number($('#selectedX').value);
  p.offsetY=Number($('#selectedY').value);
  await dbPut(PRODUCT_STORE,p);
  renderAll();
}
['selectedFrameMode','selectedScale','selectedX','selectedY'].forEach(id=>{ $('#'+id).addEventListener('pointerdown', ()=>{ if(selectedId) pushHistory(); }, {passive:true}); $('#'+id).addEventListener('input',changeSelectedProduct); });
$('#smartSelectedBtn').onclick=async()=>{
  const p=products.find(x=>x.id===selectedId);
  if(!p) return;
  pushHistory();
  const smart=getSmartDefaults(p.imageWidth||1000,p.imageHeight||1000,getProductSlotKind(p.id));
  p.frameMode='auto'; p.scale=smart.scale; p.offsetX=0; p.offsetY=0;
  await dbPut(PRODUCT_STORE,p);
  renderAll();
};
$('#resetSelectedBtn').onclick=async()=>{
  pushHistory();
  const p=products.find(x=>x.id===selectedId);
  if(!p) return;
  p.frameMode='auto'; p.scale=100; p.offsetX=0; p.offsetY=0;
  await dbPut(PRODUCT_STORE,p);
  renderAll();
};

function renderCatalog(){
  settings.catalogTitle=$('#catalogTitle').value;
  const perPage=Number($('#itemsPerPage').value);
  const category=$('#catalogCategory').value;
  const items=products.filter(p=>!category || p.category===category);
  const pages=[];
  for(let i=0;i<items.length;i+=perPage) pages.push(items.slice(i,i+perPage));
  if(!pages.length) pages.push([]);

  $('#catalogCanvas').innerHTML=pages.map((page,index)=>`
    <section class="catalog-page">
      <header class="catalog-head">
        <div class="catalog-brand-group">
          ${catalogLogoMarkup()}
          <div>
            <div class="brand">${esc(settings.brandName)}</div>
            <h2>${esc(settings.catalogTitle)}</h2>
          </div>
        </div>
        <div>${index+1}. oldal</div>
      </header>
      <div class="catalog-grid">
        ${page.length ? page.map(p=>`
          <article class="catalog-card">
            <div class="catalog-photo media-frame ${mediaModeClass(p,'catalog')}" data-product-id="${p.id}" data-slot-kind="catalog">
              <img src="${p.image}" alt="">
            </div>
            <div class="catalog-body">
              <small>${esc(p.category||'PM Dekor')}</small>
              <h3>${esc(p.name)}</h3>
              <p>${esc(p.description||'Kézzel készített dekoráció.')}</p>
              <div class="catalog-price">${esc(p.price)}</div>
            </div>
          </article>
        `).join('') : `<div class="empty" style="grid-column:1/-1">Nincs megjeleníthető termék.</div>`}
      </div>
      <div class="catalog-foot">
        <span>${esc(settings.orderText)} • Facebook: ${esc(settings.facebook)}</span>
        <span>${esc(settings.instagram)}</span>
      </div>
    </section>
  `).join('');
  applyMediaTransforms($('#catalogCanvas'));
}
function populateCategories(){
  const current=$('#catalogCategory').value;
  const categories=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hu'));
  $('#catalogCategory').innerHTML='<option value="">Minden kategória</option>'+categories.map(c=>`<option>${esc(c)}</option>`).join('');
  if(categories.includes(current)) $('#catalogCategory').value=current;
}

function renderProducts(){
  const q=$('#searchInput').value.trim().toLowerCase();
  const shown=products.filter(p=>!q || `${p.name} ${p.category} ${p.posterLabel||''} ${p.description}`.toLowerCase().includes(q));
  $('#productCount').textContent=`${products.length} termék`;
  const list=$('#productList');
  list.innerHTML='';
  if(!shown.length){
    list.innerHTML='<div class="empty">Még nincs termék vagy nincs találat.</div>';
    return;
  }
  shown.forEach(p=>{
    const node=$('#productCardTemplate').content.cloneNode(true);
    const frame=node.querySelector('.manage-thumb');
    frame.classList.add(mediaModeClass(p,'generic'));
    frame.dataset.productId=p.id;
    frame.querySelector('img').src=p.image;
    node.querySelector('.manage-name').textContent=p.name;
    node.querySelector('.manage-category').textContent=p.category || 'Nincs kategória';
    node.querySelector('.manage-price').textContent=p.price;
    node.querySelector('.manage-desc').textContent=[p.posterLabel ? `Plakát: ${p.posterLabel}` : '', p.description || ''].filter(Boolean).join(' · ');
    node.querySelector('.mode-badge').textContent=p.frameMode==='auto' ? 'AUTO' : (p.frameMode==='contain' ? 'Teljes kép' : 'Kitöltés');
    node.querySelector('.mode-badge').classList.toggle('auto', p.frameMode==='auto');
    node.querySelector('.zoom-badge').textContent=`Zoom ${p.scale}%`;
    const cb=node.querySelector('.manage-poster');
    cb.checked=p.onPoster;
    cb.onchange=async()=>{ p.onPoster=cb.checked; await dbPut(PRODUCT_STORE,p); renderPoster(); };
    node.querySelector('.delete').onclick=async()=>{
      pushHistory();
      if(!confirm(`Törlöd ezt a terméket?\n${p.name}`)) return;
      await dbDelete(PRODUCT_STORE,p.id);
      ensurePosterRows();
      settings.posterRows.forEach(row=>row.blocks.forEach(block=>{
        block.productIds=block.productIds.map(id=>Number(id)===p.id?null:id);
      }));
      savePosterRows();
      if(selectedId===p.id) selectedId=null;
      await refresh();
    };
    node.querySelector('.edit').onclick=()=>openEdit(p);
    node.querySelector('.up').onclick=()=>{ pushHistory(); moveProduct(p.id,-1); };
    node.querySelector('.down').onclick=()=>{ pushHistory(); moveProduct(p.id,1); };
    list.appendChild(node);
  });
  applyMediaTransforms(list);
}
async function moveProduct(id,dir){
  const i=products.findIndex(p=>p.id===id);
  const j=i+dir;
  if(i<0 || j<0 || j>=products.length) return;
  [products[i],products[j]]=[products[j],products[i]];
  for(let k=0;k<products.length;k++){
    products[k].order=k;
    await dbPut(PRODUCT_STORE,products[k]);
  }
  renderAll();
}

function openEdit(p){
  $('#editId').value=p.id;
  $('#editName').value=p.name;
  $('#editPrice').value=p.price;
  $('#editCategory').value=p.category;
  $('#editPosterLabel').value=p.posterLabel || '';
  $('#editDesc').value=p.description;
  $('#editPoster').checked=p.onPoster;
  $('#editMode').value=p.frameMode;
  $('#editScale').value=p.scale;
  $('#editX').value=p.offsetX;
  $('#editY').value=p.offsetY;
  $('#editImage').value='';
  $('#editPreview').className='edit-preview media-frame '+mediaModeClass(p,'generic');
  $('#editPreview img').src=p.image;
  $('#editPreview img').style.transform=mediaTransform(p);
  updateEditLabels();
  $('#editModal').classList.remove('hidden');
}
function updateEditLabels(){
  const tmp={scale:Number($('#editScale').value),offsetX:Number($('#editX').value),offsetY:Number($('#editY').value)};
  $('#editScaleValue').textContent=tmp.scale+'%';
  $('#editXValue').textContent=tmp.offsetX;
  $('#editYValue').textContent=tmp.offsetY;
  const tmpMode=$('#editMode').value==='auto' ? 'contain' : $('#editMode').value; $('#editPreview').className='edit-preview media-frame '+tmpMode;
  $('#editPreview img').style.transform=mediaTransform(tmp);
}
['editMode','editScale','editX','editY'].forEach(id=>$('#'+id).addEventListener('input',updateEditLabels));
$('#editRecropBtn').onclick=()=>{
  const p=products.find(x=>x.id===Number($('#editId').value));
  if(!p) return;
  $('#editModal').classList.add('hidden');
  openCropModal({
    mode:'replace-product',
    productId:p.id,
    image:p.image,
    imageWidth:p.imageWidth||1000,
    imageHeight:p.imageHeight||1000,
    targetKind:'generic',
    frameMode:p.frameMode,
    scale:p.scale,
    offsetX:p.offsetX,
    offsetY:p.offsetY
  });
};
$('#closeModalBtn').onclick=()=>$('#editModal').classList.add('hidden');
$('#editModal').onclick=e=>{ if(e.target.id==='editModal') $('#editModal').classList.add('hidden'); };
$('#editImage').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  const data=await fileToData(file);
  $('#editPreview img').src=data;
  const meta=await getImageMetaFromData(data);
  $('#editPreview').dataset.newImage=data;
  $('#editPreview').dataset.newWidth=meta.width;
  $('#editPreview').dataset.newHeight=meta.height;
};
$('#editForm').onsubmit=async e=>{
  pushHistory();
  e.preventDefault();
  const p=products.find(x=>x.id===Number($('#editId').value));
  if(!p) return;
  p.name=$('#editName').value.trim();
  p.price=$('#editPrice').value.trim();
  p.category=$('#editCategory').value.trim();
  p.posterLabel=$('#editPosterLabel').value.trim();
  p.description=$('#editDesc').value.trim();
  p.onPoster=$('#editPoster').checked;
  p.frameMode=$('#editMode').value;
  p.scale=Number($('#editScale').value);
  p.offsetX=Number($('#editX').value);
  p.offsetY=Number($('#editY').value);
  const file=$('#editImage').files[0];
  if(file){ p.image=$('#editPreview').dataset.newImage || await fileToData(file); p.imageWidth=Number($('#editPreview').dataset.newWidth)||p.imageWidth; p.imageHeight=Number($('#editPreview').dataset.newHeight)||p.imageHeight; }
  await dbPut(PRODUCT_STORE,p);
  $('#editModal').classList.add('hidden');
  await refresh();
};

function updateAddLabels(){
  $('#scaleValue').textContent=$('#scaleInput').value+'%';
  $('#offsetXValue').textContent=$('#offsetXInput').value;
  $('#offsetYValue').textContent=$('#offsetYInput').value;
}
['scaleInput','offsetXInput','offsetYInput'].forEach(id=>$('#'+id).oninput=updateAddLabels);

$('#imageInput').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  const image=await fileToData(file);
  const meta=await getImageMetaFromData(image);
  openCropModal({mode:'new',image,imageWidth:meta.width,imageHeight:meta.height,targetKind:'generic'});
};
$('#productForm').onsubmit=async e=>{
  pushHistory();
  e.preventDefault();
  if(!pendingImage) return alert('Válassz képet.');
  await dbAdd(PRODUCT_STORE,normProduct({
    name:$('#nameInput').value.trim(),
    price:$('#priceInput').value.trim(),
    category:$('#categoryInput').value.trim(),
    posterLabel:$('#posterLabelInput').value.trim(),
    description:$('#descInput').value.trim(),
    onPoster:$('#posterInput').checked,
    image:pendingImage,
    imageWidth:pendingImageMeta?.width || null,
    imageHeight:pendingImageMeta?.height || null,
    frameMode:$('#frameModeInput').value,
    scale:Number($('#scaleInput').value),
    offsetX:Number($('#offsetXInput').value),
    offsetY:Number($('#offsetYInput').value),
    order:products.length
  }));
  e.target.reset();
  pendingImage='';
  pendingImageMeta=null;
  $('#thumbPreview').textContent='Nincs kiválasztott kép';
  $('#posterInput').checked=true;
  $('#frameModeInput').value='auto';
  $('#scaleInput').value=100;
  $('#offsetXInput').value=0;
  $('#offsetYInput').value=0;
  updateAddLabels();
  await refresh();
};

function loadSettingsUi(){
  ['brandName','facebook','instagram','orderText','thanksText','accentColor','posterTitle','posterSubtitle','catalogTitle','backgroundMode','logoScale','logoOffsetX','logoOffsetY'].forEach(id=>{
    if($('#'+id) && settings[id]!==undefined) $('#'+id).value=settings[id];
  });
  if($('#logoVisible')) $('#logoVisible').checked = settings.logoVisible !== false;
  setAccent(settings.accentColor);
  updateAddLabels();
  syncLogoControlLabels();
  updateHistoryButtons();
}
$('#saveSettingsBtn').onclick=()=>{
  pushHistory();
  settings.brandName=$('#brandName').value.trim() || defaults.brandName;
  settings.facebook=$('#facebook').value.trim();
  settings.instagram=$('#instagram').value.trim();
  settings.orderText=$('#orderText').value.trim();
  settings.thanksText=$('#thanksText').value.trim();
  settings.accentColor=$('#accentColor').value;
  settings.posterTitle=$('#posterTitle').value.trim();
  settings.posterSubtitle=$('#posterSubtitle').value.trim();
  settings.catalogTitle=$('#catalogTitle').value.trim();
  settings.backgroundMode=$('#backgroundMode').value;
  settings.logoVisible=$('#logoVisible').checked;
  settings.logoScale=Number($('#logoScale').value);
  settings.logoOffsetX=Number($('#logoOffsetX').value);
  settings.logoOffsetY=Number($('#logoOffsetY').value);
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  setAccent(settings.accentColor);
  renderAll();
  alert('Beállítások elmentve.');
};
$('#accentColor').oninput=e=>setAccent(e.target.value);

$('#logoInput').onchange=async e=>{
  pushHistory();
  const file=e.target.files[0];
  if(!file) return;
  assets.logo=await fileToData(file,1000,.9);
  await dbPut(ASSET_STORE,{key:'logo',value:assets.logo});
  logoSelected=true;
  renderAll();
};
$('#removeLogoBtn').onclick=async()=>{
  pushHistory();
  assets.logo='';
  await dbDelete(ASSET_STORE,'logo');
  renderAll();
};
$('#backgroundInput').onchange=async e=>{
  pushHistory();
  const file=e.target.files[0];
  if(!file) return;
  assets.background=await fileToData(file,2400,.88);
  settings.backgroundMode='custom';
  $('#backgroundMode').value='custom';
  await dbPut(ASSET_STORE,{key:'background',value:assets.background});
  renderAll();
};
$('#removeBackgroundBtn').onclick=async()=>{
  pushHistory();
  assets.background='';
  settings.backgroundMode='template';
  $('#backgroundMode').value='template';
  await dbDelete(ASSET_STORE,'background');
  renderAll();
};
$$('.season-bg-btn').forEach(btn=>btn.onclick=()=>{
  pushHistory();
  settings.backgroundMode=btn.dataset.bgPreset;
  renderAll();
});
$('#backgroundMode').addEventListener('change',()=>{
  settings.backgroundMode=$('#backgroundMode').value;
  renderAll();
});
function renderAssetPreviews(){
  $('#logoPreview').innerHTML=assets.logo ? `<img src="${assets.logo}" alt="PM Dekor logó">` : 'Nincs saját logó – a szöveges PM logó látszik.';
}

$('#backupBtn').onclick=()=>{
  const payload={version:"7.12",settings,assets,products};
  const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='pm-dekor-mentes.json';
  a.click();
  URL.revokeObjectURL(a.href);
};
$('#restoreInput').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    await dbClear(PRODUCT_STORE);
    await dbClear(ASSET_STORE);
    for(const product of (data.products||[])){
      await dbPut(PRODUCT_STORE,{...product});
    }
    if(data.assets?.logo) await dbPut(ASSET_STORE,{key:'logo',value:data.assets.logo});
    if(data.assets?.background) await dbPut(ASSET_STORE,{key:'background',value:data.assets.background});
    settings={...defaults,...(data.settings||{})};
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
    selectedId=null;
    await refresh();
    loadSettingsUi();
    alert('Mentés sikeresen betöltve.');
  }catch{
    alert('Nem sikerült beolvasni a mentést.');
  }
};
$('#clearBtn').onclick=async()=>{
  pushHistory();
  if(!confirm('Biztosan törlöd az összes terméket és feltöltött logót/hátteret?')) return;
  await dbClear(PRODUCT_STORE);
  await dbClear(ASSET_STORE);
  selectedId=null;
  await refresh();
};

['posterTitle','posterSubtitle','backgroundMode'].forEach(id=>$('#'+id).addEventListener('input',renderPoster));
['catalogTitle','itemsPerPage','catalogCategory'].forEach(id=>$('#'+id).addEventListener('input',renderCatalog));
$('#searchInput').oninput=renderProducts;

$$('.tab').forEach(tab=>{
  tab.onclick=()=>{
    $$('.tab').forEach(t=>t.classList.remove('active'));
    $$('.view').forEach(v=>v.classList.remove('active'));
    tab.classList.add('active');
    $('#view-'+tab.dataset.tab).classList.add('active');
    setTimeout(fitPreviews,60);
  };
});


$('#undoBtn').onclick=undoAction;
$('#redoBtn').onclick=redoAction;
$('#togglePreviewBtn').onclick=togglePreviewMode;
$('#replaceImageInput').onchange=async e=>{
  const file=e.target.files[0];
  if(!file || !selectedId) return;
  const p=products.find(x=>x.id===selectedId);
  if(!p) return;
  const image=await fileToData(file);
  const meta=await getImageMetaFromData(image);
  openCropModal({
    mode:'replace-product',
    productId:p.id,
    image,
    imageWidth:meta.width,
    imageHeight:meta.height,
    targetKind:getProductSlotKind(p.id),
    frameMode:'auto'
  });
  e.target.value='';
};


$('#cropTargetKind').oninput=()=>{ if(cropState) applySmartCropDefaults(); };
$('#cropFrameMode').oninput=renderCropPreview;
['cropScale','cropX','cropY'].forEach(id=>$('#'+id).oninput=renderCropPreview);
$('#cropAutoBtn').onclick=applySmartCropDefaults;
$('#cropResetBtn').onclick=applySmartCropDefaults;
$('#cropCancelBtn').onclick=closeCropModal;
$('#closeCropModalBtn').onclick=closeCropModal;
$('#cropSaveBtn').onclick=commitCropModal;
$('#cropModal').onclick=e=>{ if(e.target.id==='cropModal') closeCropModal(); };
$('#cropPreview').onpointerdown=e=>{
  if(!cropState) return;
  const preview=$('#cropPreview');
  const startX=e.clientX, startY=e.clientY;
  const baseX=Number($('#cropX').value), baseY=Number($('#cropY').value);
  const move=ev=>{
    $('#cropX').value=Math.max(-200,Math.min(200,Math.round(baseX + (ev.clientX-startX))));
    $('#cropY').value=Math.max(-200,Math.min(200,Math.round(baseY + (ev.clientY-startY))));
    renderCropPreview();
  };
  const up=()=>{
    window.removeEventListener('pointermove',move);
    window.removeEventListener('pointerup',up);
  };
  window.addEventListener('pointermove',move);
  window.addEventListener('pointerup',up);
};



['logoScale','logoOffsetX','logoOffsetY'].forEach(id=>{
  if($('#'+id)){
    $('#'+id).addEventListener('input', ()=>{
      applyLogoSettingsFromPanel();
      logoSelected=true;
      renderPoster();
    });
  }
});
if($('#logoVisible')){
  $('#logoVisible').addEventListener('input', ()=>{
    applyLogoSettingsFromPanel();
    renderPoster();
  });
}
$('#resetLogoLayoutBtn').onclick=()=>{
  $('#logoVisible').checked = true;
  $('#logoScale').value = 100;
  $('#logoOffsetX').value = 0;
  $('#logoOffsetY').value = 0;
  applyLogoSettingsFromPanel();
  logoSelected=true;
  renderPoster();
};
$('#applyLogoLayoutBtn').onclick=()=>{
  applyLogoSettingsFromPanel();
  logoSelected=true;
  renderPoster();
};


$$('.layout-preset').forEach(btn=>{
  btn.onclick=()=>{
    const units=btn.dataset.preset.split(',').filter(Boolean).map(Number);
    addPresetRow(units);
  };
});
$('#autoAssignLayoutBtn').onclick=autoAssignLayoutProducts;


async function waitForRenderableAssets(root){
  if(document.fonts?.ready){
    try{ await document.fonts.ready; }catch(_){}
  }
  const imgs=[...root.querySelectorAll('img')];
  await Promise.all(imgs.map(img=>{
    if(img.complete && img.naturalWidth>0) return Promise.resolve();
    return new Promise(resolve=>{
      const done=()=>resolve();
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      setTimeout(done,2500);
    });
  }));
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}


async function exportElementAsPng(node, fileName, scale=2){
  const host=document.createElement('div');
  host.className='export-host';
  host.style.position='fixed';
  host.style.left='-200vw';
  host.style.top='0';
  host.style.pointerEvents='none';
  host.style.opacity='1';
  host.style.zIndex='-1';
  const clone=node.cloneNode(true);
  clone.classList.add('clean-preview','export-snapshot');
  clone.querySelectorAll('.poster-toolbar,.logo-resize-handle').forEach(el=>el.remove());
  clone.querySelectorAll('.logo-disc').forEach(el=>el.classList.remove('logo-selected'));
  host.appendChild(clone);
  document.body.appendChild(host);
  try{
    await waitForRenderableAssets(clone);
    const canvas=await html2canvas(clone,{scale,useCORS:true,backgroundColor:'#fffaf0'});
    const a=document.createElement('a');
    a.download=fileName;
    a.href=canvas.toDataURL('image/png');
    a.click();
  }finally{
    host.remove();
  }
}

$('#exportPosterBtn').onclick=async()=>{
  const btn=$('#exportPosterBtn');
  btn.disabled=true; btn.textContent='Készül…';
  try{
    const el=$('#posterCanvas').firstElementChild;
    await exportElementAsPng(el,'pm-dekor-plakat.png',2);
  }finally{
    btn.disabled=false; btn.textContent='Plakát letöltése PNG-ben';
  }
};
$('#exportCatalogBtn').onclick=async()=>{
  const btn=$('#exportCatalogBtn');
  btn.disabled=true; btn.textContent='PDF készül…';
  try{
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    const pages=$$('.catalog-page');
    for(let i=0;i<pages.length;i++){
      await waitForRenderableAssets(pages[i]);
      const canvas=await html2canvas(pages[i],{scale:1.5,useCORS:true,backgroundColor:'#fffaf0'});
      if(i>0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);
    }
    pdf.save('pm-dekor-katalogus.pdf');
  }finally{
    btn.disabled=false; btn.textContent='Katalógus letöltése PDF-ben';
  }
};

function demoCanvas(label,w,h,c1,c2){
  const canvas=document.createElement('canvas');
  canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,c1); grad.addColorStop(1,c2);
  ctx.fillStyle=grad; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.88)';
  ctx.beginPath();
  ctx.ellipse(w/2,h/2,w*0.28,h*0.28,0,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle='#654b3d';
  ctx.textAlign='center';
  ctx.font=`bold ${Math.max(28,Math.round(w*0.045))}px Georgia`;
  ctx.fillText(label,w/2,h*0.48);
  ctx.font=`${Math.max(18,Math.round(w*0.022))}px Georgia`;
  ctx.fillText('minta saját fotó helyett',w/2,h*0.58);
  return canvas.toDataURL('image/jpeg',.88);
}
$('#demoBtn').onclick=async()=>{
  pushHistory();
  if(products.length && !confirm('A mintaadatok hozzáadódnak a meglévőkhöz. Folytatod?')) return;
  const demo=[
    ['Kis teamécseses','600 Ft','SIMA TEAMÉCSESSEL',900,1200,'contain','#d8c4a5','#87674e'],
    ['Kis LED mécseses','800 Ft','LED MÉCSESSEL',1200,800,'cover','#d9b786','#8f5c3c'],
    ['Szív teamécseses','1 600 Ft','TEAMÉCSESSEL',1000,740,'cover','#c8c5b4','#7e715d'],
    ['Szív LED mécseses','1 800 Ft','LED MÉCSESSEL',780,1140,'contain','#d2bca7','#7b5d53'],
    ['Galambos szív','2 300 Ft','GALAMBOS',1400,850,'cover','#c9d1be','#77705d'],
    ['Virágos szív','2 300 Ft','VIRÁGOS',850,1220,'contain','#dfd3c5','#9b8371'],
    ['Angyalkás bal','2 500 Ft','ANGYALKÁS',760,1180,'contain','#bfcbac','#6f6a5e'],
    ['Angyalkás jobb','2 500 Ft','ANGYALKÁS',1350,860,'cover','#dcc6aa','#8f614a'],
    ['Kereszt alakú dísz','1 100 Ft','KERESZT ALAKÚ',760,1180,'contain','#c7d3b0','#6d735d'],
    ['Nagy sírtál','3 200 Ft','NAGY DÍSZ',1350,860,'cover','#dac5aa','#90634a'],
    ['Nagy szív alakú dísz','3 200 Ft','NAGY SZÍV',1100,850,'cover','#d6c0b1','#7c5b5d']
  ];
  for(let i=0;i<demo.length;i++){
    const [name,price,category,w,h,frameMode,c1,c2]=demo[i];
    await dbAdd(PRODUCT_STORE,normProduct({
      name,price,category,description:'Kézzel készített dekoráció.',onPoster:true,
      image:demoCanvas(name,w,h,c1,c2),frameMode,scale:100,offsetX:0,offsetY:0,order:products.length+i
    }));
  }
  await refresh();
  if($('#demoBtn')) autoAssignLayoutProducts();
};

function fitPreviews(){
  const ww=window.innerWidth;
  if(ww>=980){
    $$('.poster,.catalog-page').forEach(el=>{el.style.transform='';el.style.marginBottom='';});
    return;
  }
  const available=Math.max(280,ww-32);
  $$('.poster').forEach(el=>{
    const scale=Math.min(1,available/1000);
    el.style.transform=`scale(${scale})`;
    el.style.marginBottom=`${-(el.offsetHeight*(1-scale))}px`;
  });
  $$('.catalog-page').forEach(el=>{
    const scale=Math.min(1,available/794);
    el.style.transform=`scale(${scale})`;
    el.style.marginBottom=`${-(el.offsetHeight*(1-scale))}px`;
  });
}
window.addEventListener('resize',()=>setTimeout(fitPreviews,100));

(async()=>{
  loadSettingsUi();
  await refresh();
  setTimeout(fitPreviews,120);
})();

const __runtimeStatus=document.getElementById('runtimeStatus');
if(__runtimeStatus){__runtimeStatus.textContent='Rendszer: OK';__runtimeStatus.classList.add('ok');}
