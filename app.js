
window.addEventListener('error', function(e){
  const el=document.getElementById('runtimeStatus');
  if(el){ el.textContent='Hiba: '+(e.message||'JavaScript hiba'); el.classList.add('bad'); }
});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB_NAME='pm-dekor-v52', PRODUCT_STORE='products', ASSET_STORE='assets', SETTINGS_KEY='pm-dekor-settings-v52';
let products=[], pendingImage='', selectedId=null, dragState=null;

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
  backgroundMode:'template'
};
let settings={...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')};
let assets={logo:'',background:''};
const BUILTIN_POSTER_BG = 'pm-dekor-background.png';

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
  return {category:'',description:'',onPoster:true,frameMode:'cover',scale:100,offsetX:0,offsetY:0,order:999,...p};
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
function mediaModeClass(p){ return p.frameMode==='contain' ? 'contain' : 'cover'; }
function mediaTransform(p){ return `translate(calc(-50% + ${p.offsetX||0}px), calc(-50% + ${p.offsetY||0}px)) scale(${(p.scale||100)/100})`; }

async function loadAssets(){
  const rows=await dbGetAll(ASSET_STORE);
  assets={logo:'',background:''};
  rows.forEach(r=>assets[r.key]=r.value);
}
async function refresh(){
  products=(await dbGetAll(PRODUCT_STORE)).map(normProduct).sort((a,b)=>(a.order??999)-(b.order??999)||a.id-b.id);
  await loadAssets();
  renderAll();
}
function renderAll(){
  renderProducts();
  populateCategories();
  renderPoster();
  renderCatalog();
  renderAssetPreviews();
  setTimeout(fitPreviews,80);
}

function logoMarkup(){
  if(assets.logo) return `<img src="${assets.logo}" alt="PM Dekor logó">`;
  return `<div><div class="pm">PM</div><div class="brand">DEKOR</div><div class="small">MELINDA</div></div>`;
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
    <div class="${photoClass} media-frame ${mediaModeClass(p)}" data-product-id="${p.id}">
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
      <div class="combo-media media-frame ${mediaModeClass(p)}" data-product-id="${p.id}">
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
function selectedProducts(){ return products.filter(p=>p.onPoster).slice(0,13); }
function posterBackgroundStyle(){
  const bg = (settings.backgroundMode==='custom' && assets.background) ? assets.background : BUILTIN_POSTER_BG;
  return `background-image:url('${bg}');background-size:cover;background-position:center;background-repeat:no-repeat;`;
}
function renderPoster(){
  settings.posterTitle=$('#posterTitle').value;
  settings.posterSubtitle=$('#posterSubtitle').value;
  settings.backgroundMode=$('#backgroundMode').value;

  const items=selectedProducts();
  const host=$('#posterCanvas');
  const topA=combinedSlotMarkup([items[0],items[1]],'small','top','KIS SZÍV ALAKÚ SÍRDÍSZEK', `${items[0]?.price || '600 Ft'} / ${items[1]?.price || '800 Ft'}`);
  const topB=combinedSlotMarkup([items[2],items[3]],'small','top','SZÍV ALAKÚ SÍRDÍSZEK', `${items[2]?.price || '1 600 Ft'} / ${items[3]?.price || '1 800 Ft'}`);
  const midA=combinedSlotMarkup([items[4],items[5]],'big','mid','GALAMBOS ÉS VIRÁGOS SZÍV ALAKÚ SÍRDÍSZEK', items[4]?.price || '2 300 Ft');
  const midB=combinedSlotMarkup([items[6],items[7]],'big','mid','ANGYALKÁS SÍRDÍSZEK', items[6]?.price || '2 500 Ft');
  host.innerHTML=`<section class="poster" style="${posterBackgroundStyle()}">
    <header class="poster-head">
      <div class="logo-disc">${logoMarkup()}</div>
      <div class="poster-title">
        <div class="script">${esc((settings.posterTitle||'Mindenszenteki sírdíszek').split(' ')[0] || 'Mindenszenteki')}</div>
        <h2>${esc(((settings.posterTitle||'Mindenszenteki sírdíszek').split(' ').slice(1).join(' ')) || 'SÍRDÍSZEK')}</h2>
        <div class="tag">♥ ${esc(settings.posterSubtitle)} ♥</div>
      </div>
      <div aria-hidden="true"></div>
    </header>
    <div class="grid top-grid">${topA}${topB}</div>
    <div class="grid mid-grid">${midA}${midB}</div>
    <div class="grid bottom-grid">
      ${singleSlotMarkup(items[8],'bottom','bottom')}
      ${singleSlotMarkup(items[9],'bottom','bottom')}
      ${singleSlotMarkup(items[10],'bottom','bottom')}
    </div><div class="roof"></div><div class="body"></div><div class="light"></div></div>
    <footer class="poster-footer">
      <strong>${esc(settings.brandName)}</strong>
      <div class="contacts">Facebook: ${esc(settings.facebook)} &nbsp; • &nbsp; Instagram: ${esc(settings.instagram)} &nbsp; • &nbsp; ${esc(settings.orderText)}</div>
      <div class="thanks">♥ ${esc(settings.thanksText)} ♥</div>
    </footer>
  </section>`;
  applyMediaTransforms(host);
  attachPosterDrag(host);
  updateSelectedControls();
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
    frame.onpointerdown=e=>{
      if(e.button!==undefined && e.button!==0) return;
      const id=Number(frame.dataset.productId);
      const p=products.find(x=>x.id===id);
      if(!p) return;
      selectedId=id;
      updateSelectedControls();
      applyMediaTransforms(scope);
      dragState={id,startX:e.clientX,startY:e.clientY,offsetX:p.offsetX||0,offsetY:p.offsetY||0};
      frame.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    frame.onpointermove=e=>{
      if(!dragState || dragState.id!==Number(frame.dataset.productId)) return;
      const p=products.find(x=>x.id===dragState.id);
      if(!p) return;
      p.offsetX=Math.round(dragState.offsetX + (e.clientX-dragState.startX));
      p.offsetY=Math.round(dragState.offsetY + (e.clientY-dragState.startY));
      applyMediaTransforms(scope);
      syncSelectedControlValues(p);
    };
    frame.onpointerup=async()=>{
      if(!dragState) return;
      const p=products.find(x=>x.id===dragState.id);
      dragState=null;
      if(p){
        await dbPut(PRODUCT_STORE,p);
        renderProducts();
        renderCatalog();
      }
    };
  });
}
function updateSelectedControls(){
  const p=products.find(x=>x.id===selectedId);
  ['selectedFrameMode','selectedScale','selectedX','selectedY','resetSelectedBtn'].forEach(id=>$('#'+id).disabled=!p);
  if(!p){
    $('#selectedProductText').textContent='Kattints egy képre a plakáton.';
    $('#selectedScaleValue').textContent='100%';
    $('#selectedXValue').textContent='0';
    $('#selectedYValue').textContent='0';
    return;
  }
  $('#selectedProductText').textContent=p.name;
  $('#selectedFrameMode').value=p.frameMode;
  $('#selectedScale').value=p.scale;
  $('#selectedX').value=p.offsetX;
  $('#selectedY').value=p.offsetY;
  syncSelectedControlValues(p);
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
['selectedFrameMode','selectedScale','selectedX','selectedY'].forEach(id=>$('#'+id).addEventListener('input',changeSelectedProduct));
$('#resetSelectedBtn').onclick=async()=>{
  const p=products.find(x=>x.id===selectedId);
  if(!p) return;
  p.frameMode='cover'; p.scale=100; p.offsetX=0; p.offsetY=0;
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
        <div>
          <div class="brand">${esc(settings.brandName)}</div>
          <h2>${esc(settings.catalogTitle)}</h2>
        </div>
        <div>${index+1}. oldal</div>
      </header>
      <div class="catalog-grid">
        ${page.length ? page.map(p=>`
          <article class="catalog-card">
            <div class="catalog-photo media-frame ${mediaModeClass(p)}" data-product-id="${p.id}">
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
  const shown=products.filter(p=>!q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));
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
    frame.classList.add(mediaModeClass(p));
    frame.dataset.productId=p.id;
    frame.querySelector('img').src=p.image;
    node.querySelector('.manage-name').textContent=p.name;
    node.querySelector('.manage-category').textContent=p.category || 'Nincs kategória';
    node.querySelector('.manage-price').textContent=p.price;
    node.querySelector('.manage-desc').textContent=p.description || '';
    node.querySelector('.mode-badge').textContent=p.frameMode==='contain' ? 'Teljes kép' : 'Kitöltés';
    node.querySelector('.zoom-badge').textContent=`Zoom ${p.scale}%`;
    const cb=node.querySelector('.manage-poster');
    cb.checked=p.onPoster;
    cb.onchange=async()=>{ p.onPoster=cb.checked; await dbPut(PRODUCT_STORE,p); renderPoster(); };
    node.querySelector('.delete').onclick=async()=>{
      if(!confirm(`Törlöd ezt a terméket?\n${p.name}`)) return;
      await dbDelete(PRODUCT_STORE,p.id);
      if(selectedId===p.id) selectedId=null;
      await refresh();
    };
    node.querySelector('.edit').onclick=()=>openEdit(p);
    node.querySelector('.up').onclick=()=>moveProduct(p.id,-1);
    node.querySelector('.down').onclick=()=>moveProduct(p.id,1);
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
  $('#editDesc').value=p.description;
  $('#editPoster').checked=p.onPoster;
  $('#editMode').value=p.frameMode;
  $('#editScale').value=p.scale;
  $('#editX').value=p.offsetX;
  $('#editY').value=p.offsetY;
  $('#editImage').value='';
  $('#editPreview').className='edit-preview media-frame '+mediaModeClass(p);
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
  $('#editPreview').className='edit-preview media-frame '+$('#editMode').value;
  $('#editPreview img').style.transform=mediaTransform(tmp);
}
['editMode','editScale','editX','editY'].forEach(id=>$('#'+id).addEventListener('input',updateEditLabels));
$('#closeModalBtn').onclick=()=>$('#editModal').classList.add('hidden');
$('#editModal').onclick=e=>{ if(e.target.id==='editModal') $('#editModal').classList.add('hidden'); };
$('#editImage').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  $('#editPreview img').src=await fileToData(file);
};
$('#editForm').onsubmit=async e=>{
  e.preventDefault();
  const p=products.find(x=>x.id===Number($('#editId').value));
  if(!p) return;
  p.name=$('#editName').value.trim();
  p.price=$('#editPrice').value.trim();
  p.category=$('#editCategory').value.trim();
  p.description=$('#editDesc').value.trim();
  p.onPoster=$('#editPoster').checked;
  p.frameMode=$('#editMode').value;
  p.scale=Number($('#editScale').value);
  p.offsetX=Number($('#editX').value);
  p.offsetY=Number($('#editY').value);
  const file=$('#editImage').files[0];
  if(file) p.image=await fileToData(file);
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
  pendingImage=await fileToData(file);
  $('#thumbPreview').innerHTML=`<img src="${pendingImage}" alt="">`;
};
$('#productForm').onsubmit=async e=>{
  e.preventDefault();
  if(!pendingImage) return alert('Válassz képet.');
  await dbAdd(PRODUCT_STORE,normProduct({
    name:$('#nameInput').value.trim(),
    price:$('#priceInput').value.trim(),
    category:$('#categoryInput').value.trim(),
    description:$('#descInput').value.trim(),
    onPoster:$('#posterInput').checked,
    image:pendingImage,
    frameMode:$('#frameModeInput').value,
    scale:Number($('#scaleInput').value),
    offsetX:Number($('#offsetXInput').value),
    offsetY:Number($('#offsetYInput').value),
    order:products.length
  }));
  e.target.reset();
  pendingImage='';
  $('#thumbPreview').textContent='Nincs kiválasztott kép';
  $('#posterInput').checked=true;
  $('#frameModeInput').value='cover';
  $('#scaleInput').value=100;
  $('#offsetXInput').value=0;
  $('#offsetYInput').value=0;
  updateAddLabels();
  await refresh();
};

function loadSettingsUi(){
  ['brandName','facebook','instagram','orderText','thanksText','accentColor','posterTitle','posterSubtitle','catalogTitle','backgroundMode'].forEach(id=>{
    if($('#'+id) && settings[id]!==undefined) $('#'+id).value=settings[id];
  });
  setAccent(settings.accentColor);
  updateAddLabels();
}
$('#saveSettingsBtn').onclick=()=>{
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
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  setAccent(settings.accentColor);
  renderAll();
  alert('Beállítások elmentve.');
};
$('#accentColor').oninput=e=>setAccent(e.target.value);

$('#logoInput').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  assets.logo=await fileToData(file,1000,.9);
  await dbPut(ASSET_STORE,{key:'logo',value:assets.logo});
  renderAll();
};
$('#removeLogoBtn').onclick=async()=>{
  assets.logo='';
  await dbDelete(ASSET_STORE,'logo');
  renderAll();
};
$('#backgroundInput').onchange=async e=>{
  const file=e.target.files[0];
  if(!file) return;
  assets.background=await fileToData(file,2400,.88);
  settings.backgroundMode='custom';
  $('#backgroundMode').value='custom';
  await dbPut(ASSET_STORE,{key:'background',value:assets.background});
  renderAll();
};
$('#removeBackgroundBtn').onclick=async()=>{
  assets.background='';
  settings.backgroundMode='template';
  $('#backgroundMode').value='template';
  await dbDelete(ASSET_STORE,'background');
  renderAll();
};
function renderAssetPreviews(){
  $('#logoPreview').innerHTML=assets.logo ? `<img src="${assets.logo}" alt="PM Dekor logó">` : 'Nincs saját logó – a szöveges PM logó látszik.';
}

$('#backupBtn').onclick=()=>{
  const payload={version:"5.2",settings,assets,products};
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
      const copy={...product};
      delete copy.id;
      await dbAdd(PRODUCT_STORE,copy);
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

$('#exportPosterBtn').onclick=async()=>{
  const btn=$('#exportPosterBtn');
  btn.disabled=true; btn.textContent='Készül…';
  try{
    const el=$('#posterCanvas').firstElementChild;
    const canvas=await html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#fffaf0'});
    const a=document.createElement('a');
    a.download='pm-dekor-plakat.png';
    a.href=canvas.toDataURL('image/png');
    a.click();
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
