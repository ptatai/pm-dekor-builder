
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB='pm-dekor-v3', STORE='products', ASSETS='assets', SETTINGS='pm-dekor-settings-v3';
let products=[], pendingImage='', selectedId=null, drag=null;

const defaults={brandName:'PM Dekor Melinda',facebook:'PM Dekor Melinda',instagram:'@pmdekor_melinda',orderText:'Rendelés üzenetben!',thanksText:'Köszönöm, hogy támogatod a kézzel készült alkotásokat!',accentColor:'#741521',posterTitle:'Mindenszenteki sírdíszek',posterSubtitle:'Kézzel készített, szeretettel díszítve',catalogTitle:'Mindenszenteki kollekció',posterTemplate:'classic',backgroundMode:'template'};
let settings={...defaults,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')};
let assets={logo:'',background:''};

function openDb(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{
      const db=r.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});
      if(!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS,{keyPath:'key'});
    };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
async function getAll(store){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction(store,'readonly').objectStore(store).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function put(store,obj){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).put(obj);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function add(store,obj){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).add(obj);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function del(store,key){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).delete(key);q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}
async function clearStore(store){const db=await openDb();return new Promise((res,rej)=>{const q=db.transaction(store,'readwrite').objectStore(store).clear();q.onsuccess=()=>res();q.onerror=()=>rej(q.error)})}

function norm(p){return {category:'',description:'',onPoster:true,frameMode:'cover',scale:100,offsetX:0,offsetY:0,order:999,...p}}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fileData(file,max=1800,quality=.88){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',quality))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
function mediaClass(p){return p.frameMode==='contain'?'contain':'cover'}
function transform(p){return `translate(calc(-50% + ${p.offsetX||0}px),calc(-50% + ${p.offsetY||0}px)) scale(${(p.scale||100)/100})`}
function mediaHtml(p, cls=''){return `<div class="media-frame ${mediaClass(p)} ${cls}" data-product-id="${p.id}"><img src="${p.image}" alt=""></div>`}
function applyTransforms(scope=document){scope.querySelectorAll('.media-frame[data-product-id]').forEach(f=>{const p=products.find(x=>x.id===Number(f.dataset.productId));if(p){const im=f.querySelector('img');if(im)im.style.transform=transform(p);f.classList.toggle('selected',p.id===selectedId)}})}
function leafSvg(cls){return `<svg class="ornament ${cls}" viewBox="0 0 130 120" aria-hidden="true"><path d="M8 106 C35 76 54 55 92 14" fill="none" stroke="#6f5a37" stroke-width="3"/><ellipse cx="28" cy="83" rx="9" ry="21" fill="#9a3c2d" transform="rotate(-45 28 83)"/><ellipse cx="48" cy="63" rx="9" ry="23" fill="#c77831" transform="rotate(-38 48 63)"/><ellipse cx="70" cy="43" rx="9" ry="22" fill="#b44335" transform="rotate(-35 70 43)"/><ellipse cx="87" cy="27" rx="8" ry="19" fill="#d7a647" transform="rotate(-26 87 27)"/><ellipse cx="41" cy="91" rx="8" ry="20" fill="#d5a046" transform="rotate(52 41 91)"/><ellipse cx="63" cy="72" rx="9" ry="21" fill="#9b2d39" transform="rotate(48 63 72)"/></svg>`}

async function loadAssets(){const arr=await getAll(ASSETS);assets={logo:'',background:''};arr.forEach(a=>assets[a.key]=a.value)}
async function refresh(){products=(await getAll(STORE)).map(norm).sort((a,b)=>(a.order??999)-(b.order??999)||a.id-b.id);await loadAssets();renderAll()}
function renderAll(){renderProducts();populateCategories();renderPoster();renderCatalog();renderAssetPreviews();setTimeout(fit,60)}

function renderProducts(){
  const q=$('#searchInput').value.trim().toLowerCase(),host=$('#productList');host.innerHTML='';
  const shown=products.filter(p=>!q||`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));
  $('#productCount').textContent=`${products.length} termék`;
  if(!shown.length){host.innerHTML='<div class="empty">Még nincs termék vagy nincs találat.</div>';return}
  shown.forEach(p=>{
    const n=$('#productCardTemplate').content.cloneNode(true), card=n.querySelector('.manage-card'),frame=n.querySelector('.manage-thumb');
    frame.classList.add(mediaClass(p));frame.dataset.productId=p.id;frame.querySelector('img').src=p.image;
    n.querySelector('.manage-name').textContent=p.name;n.querySelector('.manage-category').textContent=p.category||'Nincs kategória';n.querySelector('.manage-price').textContent=p.price;n.querySelector('.manage-desc').textContent=p.description||'';
    n.querySelector('.mode-badge').textContent=p.frameMode==='contain'?'Teljes kép':'Kitöltés';n.querySelector('.zoom-badge').textContent=`Zoom ${p.scale}%`;
    const c=n.querySelector('.manage-poster');c.checked=p.onPoster;c.onchange=async()=>{p.onPoster=c.checked;await put(STORE,p);renderPoster()};
    n.querySelector('.edit').onclick=()=>openEdit(p);n.querySelector('.delete').onclick=async()=>{if(confirm(`Törlöd? ${p.name}`)){await del(STORE,p.id);if(selectedId===p.id)selectedId=null;await refresh()}};
    n.querySelector('.up').onclick=()=>move(p.id,-1);n.querySelector('.down').onclick=()=>move(p.id,1);host.appendChild(n)
  });applyTransforms(host)
}
async function move(id,d){const i=products.findIndex(p=>p.id===id),j=i+d;if(i<0||j<0||j>=products.length)return;[products[i],products[j]]=[products[j],products[i]];for(let k=0;k<products.length;k++){products[k].order=k;await put(STORE,products[k])}renderAll()}

function logoHtml(){return assets.logo?`<img src="${assets.logo}" alt="PM Dekor logó">`:`<div><div class="pm">PM</div><div class="brand">DEKOR</div><div class="small">MELINDA</div></div>`}
function posterBackgroundStyle(){return settings.backgroundMode==='custom'&&assets.background?`style="background-image:linear-gradient(rgba(255,250,240,.12),rgba(255,250,240,.12)),url('${assets.background}')"`:''}
function renderPoster(){
  settings.posterTemplate=$('#posterTemplate').value;settings.backgroundMode=$('#backgroundMode').value;settings.posterTitle=$('#posterTitle').value;settings.posterSubtitle=$('#posterSubtitle').value;
  const chosen=products.filter(p=>p.onPoster).slice(0,settings.posterTemplate==='classic'?9:10),host=$('#posterCanvas');
  host.innerHTML=settings.posterTemplate==='classic'?classicPoster(chosen):modernPoster(chosen);
  applyTransforms(host);attachDrag(host);updateSelectedControls()
}
function classicPoster(items){
  const slots=Array.from({length:9},(_,i)=>items[i]||null);
  const words=($('#posterTitle').value||'Mindenszenteki sírdíszek').trim().split(/\s+/), script=words.shift()||'Mindenszenteki',main=words.join(' ')||'SÍRDÍSZEK';
  const card=(p,type)=>{
    if(!p)return `<div class="classic-card"><div class="classic-card-head">${type==='top'?'<div class="price">—</div>':'<span class="ribbon">—</span>'}</div><div class="classic-photo empty">Üres hely</div></div>`;
    return `<div class="classic-card"><div class="classic-card-head">${type==='top'?`<div class="price">${esc(p.price)}</div><div class="label">${esc(p.category||p.name)}</div>`:`<span class="ribbon">${esc(p.price)}</span><div class="label">${esc(p.name)}</div>`}</div>${mediaHtml(p,'classic-photo')}<div class="classic-card-name">${type==='top'?esc(p.name):''}</div></div>`
  };
  return `<section class="poster-classic ${settings.backgroundMode==='custom'&&assets.background?'custom-bg':''}" ${posterBackgroundStyle()}>
    ${leafSvg('tl')}${leafSvg('tr')}${leafSvg('bl')}${leafSvg('br')}
    <header class="poster-head"><div class="classic-logo">${logoHtml()}</div><div class="classic-title"><div class="script">${esc(script)}</div><h2>${esc(main)}</h2><div class="tag">♥ ${esc($('#posterSubtitle').value)} ♥</div></div><div class="candle-wrap"><div class="candle"></div></div></header>
    <div class="classic-grid classic-top">${slots.slice(0,4).map(p=>card(p,'top')).join('')}</div>
    <div class="classic-grid classic-mid">${slots.slice(4,6).map(p=>card(p,'mid')).join('')}</div>
    <div class="classic-grid classic-bottom">${slots.slice(6,9).map(p=>card(p,'bottom')).join('')}</div>
    <footer class="poster-footer"><strong>${esc(settings.brandName)}</strong><div class="contacts">Facebook: ${esc(settings.facebook)} &nbsp; • &nbsp; Instagram: ${esc(settings.instagram)} &nbsp; • &nbsp; ${esc(settings.orderText)}</div><div class="thanks">♥ ${esc(settings.thanksText)} ♥</div></footer>
  </section>`
}
function modernPoster(items){
  return `<section class="poster-modern ${settings.backgroundMode==='custom'&&assets.background?'custom-bg':''}" ${posterBackgroundStyle()}><div class="modern-head"><h2>${esc($('#posterTitle').value)}</h2><p>${esc($('#posterSubtitle').value)}</p></div><div class="modern-grid">${items.length?items.map(p=>`<article class="modern-card">${mediaHtml(p,'modern-photo')}<div class="modern-info"><small>${esc(p.category||'PM Dekor')}</small><h3>${esc(p.name)}</h3><p>${esc(p.description||'Kézzel készített dekoráció.')}</p><div class="price">${esc(p.price)}</div></div></article>`).join(''):'<div class="empty">Jelölj ki termékeket a plakáthoz.</div>'}</div><footer class="poster-footer"><strong>${esc(settings.brandName)}</strong><div class="contacts">${esc(settings.facebook)} • ${esc(settings.instagram)} • ${esc(settings.orderText)}</div></footer></section>`
}

function attachDrag(scope){
  scope.querySelectorAll('.media-frame[data-product-id]').forEach(frame=>{
    frame.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;const id=Number(frame.dataset.productId),p=products.find(x=>x.id===id);if(!p)return;selectedId=id;updateSelectedControls();applyTransforms(scope);drag={id,startX:e.clientX,startY:e.clientY,ox:p.offsetX||0,oy:p.offsetY||0};frame.setPointerCapture?.(e.pointerId);e.preventDefault()};
    frame.onpointermove=e=>{if(!drag||drag.id!==Number(frame.dataset.productId))return;const p=products.find(x=>x.id===drag.id);p.offsetX=Math.round(drag.ox+(e.clientX-drag.startX));p.offsetY=Math.round(drag.oy+(e.clientY-drag.startY));applyTransforms(scope);syncSelectedValues(p)};
    frame.onpointerup=async()=>{if(!drag)return;const p=products.find(x=>x.id===drag.id);drag=null;await put(STORE,p);renderProducts();renderCatalog()}
  })
}
function updateSelectedControls(){
  const p=products.find(x=>x.id===selectedId),els=['selectedFrameMode','selectedScale','selectedX','selectedY','resetSelectedBtn'];
  els.forEach(id=>$('#'+id).disabled=!p);
  if(!p){$('#selectedProductText').textContent='Kattints egy termékképre a plakáton.';return}
  $('#selectedProductText').textContent=p.name;$('#selectedFrameMode').value=p.frameMode;$('#selectedScale').value=p.scale;$('#selectedX').value=p.offsetX;$('#selectedY').value=p.offsetY;syncSelectedValues(p)
}
function syncSelectedValues(p){$('#selectedScaleValue').textContent=`${p.scale}%`;$('#selectedXValue').textContent=p.offsetX;$('#selectedYValue').textContent=p.offsetY}
async function changeSelected(){
  const p=products.find(x=>x.id===selectedId);if(!p)return;p.frameMode=$('#selectedFrameMode').value;p.scale=Number($('#selectedScale').value);p.offsetX=Number($('#selectedX').value);p.offsetY=Number($('#selectedY').value);syncSelectedValues(p);await put(STORE,p);renderAll()
}
['selectedFrameMode','selectedScale','selectedX','selectedY'].forEach(id=>$('#'+id).addEventListener('input',changeSelected));
$('#resetSelectedBtn').onclick=async()=>{const p=products.find(x=>x.id===selectedId);if(!p)return;p.frameMode='cover';p.scale=100;p.offsetX=0;p.offsetY=0;await put(STORE,p);renderAll()};

function populateCategories(){const s=$('#catalogCategory'),v=s.value,c=[...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hu'));s.innerHTML='<option value="">Minden kategória</option>'+c.map(x=>`<option>${esc(x)}</option>`).join('');if(c.includes(v))s.value=v}
function renderCatalog(){
  const host=$('#catalogCanvas'),per=Number($('#itemsPerPage').value),cat=$('#catalogCategory').value,items=products.filter(p=>!cat||p.category===cat),pages=[];for(let i=0;i<items.length;i+=per)pages.push(items.slice(i,i+per));if(!pages.length)pages.push([]);
  host.innerHTML=pages.map((page,i)=>`<section class="catalog-page"><header class="catalog-head"><div><div class="brand">${esc(settings.brandName)}</div><h2>${esc($('#catalogTitle').value)}</h2></div><div>${i+1}. oldal</div></header><div class="catalog-grid">${page.length?page.map(p=>`<article class="catalog-card">${mediaHtml(p,'catalog-photo')}<div class="catalog-body"><small>${esc(p.category||'PM Dekor')}</small><h3>${esc(p.name)}</h3><p>${esc(p.description||'Kézzel készített dekoráció.')}</p><div class="catalog-price">${esc(p.price)}</div></div></article>`).join(''):'<div class="empty">Nincs termék.</div>'}</div><footer class="catalog-foot"><span>${esc(settings.orderText)} • ${esc(settings.facebook)}</span><span>${esc(settings.instagram)}</span></footer></section>`).join('');applyTransforms(host)
}

function openEdit(p){$('#editId').value=p.id;$('#editName').value=p.name;$('#editPrice').value=p.price;$('#editCategory').value=p.category;$('#editDesc').value=p.description;$('#editPoster').checked=p.onPoster;$('#editMode').value=p.frameMode;$('#editScale').value=p.scale;$('#editX').value=p.offsetX;$('#editY').value=p.offsetY;$('#editImage').value='';$('#editPreview').className='edit-preview media-frame '+mediaClass(p);$('#editPreview img').src=p.image;$('#editPreview img').style.transform=transform(p);editLabels();$('#editModal').classList.remove('hidden')}
function editLabels(){const p={scale:Number($('#editScale').value),offsetX:Number($('#editX').value),offsetY:Number($('#editY').value)};$('#editScaleValue').textContent=p.scale+'%';$('#editXValue').textContent=p.offsetX;$('#editYValue').textContent=p.offsetY;$('#editPreview').className='edit-preview media-frame '+$('#editMode').value;$('#editPreview img').style.transform=transform(p)}
['editMode','editScale','editX','editY'].forEach(id=>$('#'+id).addEventListener('input',editLabels));
$('#closeModalBtn').onclick=()=>$('#editModal').classList.add('hidden');$('#editModal').onclick=e=>{if(e.target.id==='editModal')$('#editModal').classList.add('hidden')};
$('#editImage').onchange=async e=>{const f=e.target.files[0];if(f)$('#editPreview img').src=await fileData(f)};
$('#editForm').onsubmit=async e=>{e.preventDefault();const p=products.find(x=>x.id===Number($('#editId').value));p.name=$('#editName').value.trim();p.price=$('#editPrice').value.trim();p.category=$('#editCategory').value.trim();p.description=$('#editDesc').value.trim();p.onPoster=$('#editPoster').checked;p.frameMode=$('#editMode').value;p.scale=Number($('#editScale').value);p.offsetX=Number($('#editX').value);p.offsetY=Number($('#editY').value);const f=$('#editImage').files[0];if(f)p.image=await fileData(f);await put(STORE,p);$('#editModal').classList.add('hidden');await refresh()};

function addLabels(){ $('#scaleValue').textContent=$('#scaleInput').value+'%';$('#offsetXValue').textContent=$('#offsetXInput').value;$('#offsetYValue').textContent=$('#offsetYInput').value}
['scaleInput','offsetXInput','offsetYInput'].forEach(id=>$('#'+id).oninput=addLabels);
$('#imageInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;pendingImage=await fileData(f);$('#thumbPreview').innerHTML=`<img src="${pendingImage}" alt="">`};
$('#productForm').onsubmit=async e=>{e.preventDefault();if(!pendingImage)return alert('Válassz képet.');await add(STORE,norm({name:$('#nameInput').value.trim(),price:$('#priceInput').value.trim(),category:$('#categoryInput').value.trim(),description:$('#descInput').value.trim(),onPoster:$('#posterInput').checked,image:pendingImage,frameMode:$('#frameModeInput').value,scale:Number($('#scaleInput').value),offsetX:Number($('#offsetXInput').value),offsetY:Number($('#offsetYInput').value),order:products.length}));e.target.reset();$('#posterInput').checked=true;$('#frameModeInput').value='cover';$('#scaleInput').value=100;$('#offsetXInput').value=0;$('#offsetYInput').value=0;pendingImage='';$('#thumbPreview').textContent='Nincs kiválasztott kép';addLabels();await refresh()};

function setAccent(c){document.documentElement.style.setProperty('--accent',c);document.documentElement.style.setProperty('--accent-dark',shade(c,-30))}function shade(h,a){const n=parseInt(h.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+a)),g=Math.max(0,Math.min(255,((n>>8)&255)+a)),b=Math.max(0,Math.min(255,(n&255)+a));return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function loadSettingsUi(){['brandName','facebook','instagram','orderText','thanksText','accentColor','posterTitle','posterSubtitle','catalogTitle','posterTemplate','backgroundMode'].forEach(id=>{if(settings[id]!==undefined&&$('#'+id))$('#'+id).value=settings[id]});setAccent(settings.accentColor);addLabels()}
$('#saveSettingsBtn').onclick=()=>{['brandName','facebook','instagram','orderText','thanksText','accentColor'].forEach(id=>settings[id]=$('#'+id).value.trim?.()||$('#'+id).value);localStorage.setItem(SETTINGS,JSON.stringify(settings));setAccent(settings.accentColor);renderAll();alert('Beállítások elmentve.')};$('#accentColor').oninput=e=>setAccent(e.target.value);
$('#logoInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;assets.logo=await fileData(f,1000,.9);await put(ASSETS,{key:'logo',value:assets.logo});renderAll()};$('#removeLogoBtn').onclick=async()=>{assets.logo='';await del(ASSETS,'logo');renderAll()};
$('#backgroundInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;assets.background=await fileData(f,2200,.86);await put(ASSETS,{key:'background',value:assets.background});$('#backgroundMode').value='custom';settings.backgroundMode='custom';renderAll()};$('#removeBackgroundBtn').onclick=async()=>{assets.background='';await del(ASSETS,'background');$('#backgroundMode').value='template';settings.backgroundMode='template';renderAll()};
function renderAssetPreviews(){const h=$('#logoPreview');h.innerHTML=assets.logo?`<img src="${assets.logo}" alt="Logó">`:'Nincs saját logó – a PM Dekor szöveges logó jelenik meg.'}

['posterTemplate','backgroundMode','posterTitle','posterSubtitle'].forEach(id=>$('#'+id).addEventListener('input',renderPoster));['catalogTitle','itemsPerPage','catalogCategory'].forEach(id=>$('#'+id).addEventListener('input',renderCatalog));$('#searchInput').oninput=renderProducts;
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));$$('.view').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#view-'+b.dataset.tab).classList.add('active');setTimeout(fit,50)});

$('#exportPosterBtn').onclick=async()=>{const btn=$('#exportPosterBtn');btn.disabled=true;btn.textContent='Készül…';try{const el=$('#posterCanvas').firstElementChild,c=await html2canvas(el,{scale:2,useCORS:true,backgroundColor:'#fffaf0'}),a=document.createElement('a');a.download='pm-dekor-plakat.png';a.href=c.toDataURL('image/png');a.click()}finally{btn.disabled=false;btn.textContent='Plakát letöltése PNG-ben'}};
$('#exportCatalogBtn').onclick=async()=>{const btn=$('#exportCatalogBtn');btn.disabled=true;btn.textContent='PDF készül…';try{const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}),pages=$$('.catalog-page');for(let i=0;i<pages.length;i++){const c=await html2canvas(pages[i],{scale:1.5,useCORS:true,backgroundColor:'#fffaf0'});if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297)}pdf.save('pm-dekor-katalogus.pdf')}finally{btn.disabled=false;btn.textContent='Katalógus letöltése PDF-ben'}};

$('#backupBtn').onclick=async()=>{const data={version:3,settings,products,assets},blob=new Blob([JSON.stringify(data)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pm-dekor-mentes.json';a.click();URL.revokeObjectURL(a.href)};
$('#restoreInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data.products)throw new Error();await clearStore(STORE);await clearStore(ASSETS);for(const p of data.products){const copy={...p};delete copy.id;await add(STORE,copy)}if(data.assets?.logo)await put(ASSETS,{key:'logo',value:data.assets.logo});if(data.assets?.background)await put(ASSETS,{key:'background',value:data.assets.background});settings={...defaults,...(data.settings||{})};localStorage.setItem(SETTINGS,JSON.stringify(settings));loadSettingsUi();await refresh();alert('Mentés betöltve.')}catch{alert('A fájlt nem sikerült betölteni.')}};
$('#clearBtn').onclick=async()=>{if(!confirm('Biztosan törlöd az összes terméket és képet?'))return;await clearStore(STORE);await clearStore(ASSETS);selectedId=null;await refresh()};

function demoImg(label,w=1000,h=700,c1='#c8b493',c2='#765846'){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='rgba(255,255,255,.86)';x.beginPath();x.ellipse(w/2,h/2,w*.28,h*.3,0,0,Math.PI*2);x.fill();x.fillStyle='#654b3d';x.textAlign='center';x.font=`bold ${Math.max(30,w*.045)}px Georgia`;x.fillText(label,w/2,h*.48);x.font=`${Math.max(18,w*.025)}px Georgia`;x.fillText('SAJÁT FOTÓ HELYE',w/2,h*.56);return c.toDataURL('image/jpeg',.85)}
$('#demoBtn').onclick=async()=>{if(products.length&&!confirm('A mintaadatok hozzáadódnak a meglévőkhöz. Folytatod?'))return;const d=[['Teamécseses dísz','600 Ft','TEAMÉCSESSEL',900,1200,'contain'],['LED mécseses dísz','800 Ft','LED MÉCSESSEL',1200,800,'cover'],['Szív alakú dísz','1 600 Ft','TEAMÉCSESSEL',1000,750,'cover'],['LED szív dísz','1 800 Ft','LED MÉCSESSEL',750,1100,'contain'],['Galambos és virágos szív','2 300 Ft','SZÍV ALAKÚ',1400,800,'cover'],['Angyalkás sírdísz','2 500 Ft','ANGYALKÁS',800,1200,'contain'],['Kereszt alakú sírdísz','1 100 Ft','KERESZT',850,1200,'contain'],['Nagy méretű sírtál','3 200 Ft','NAGY SÍRTÁL',1500,850,'cover'],['Nagy szív alakú dísz','3 200 Ft','NAGY SZÍV',1000,1000,'cover']];for(let i=0;i<d.length;i++){const [name,price,category,w,h,frameMode]=d[i];await add(STORE,norm({name,price,category,description:'Kézzel készített dekoráció.',onPoster:true,image:demoImg(name,w,h),frameMode,scale:100,offsetX:0,offsetY:0,order:products.length+i}))}await refresh()};

function fit(){const ww=window.innerWidth;if(ww>=980){$$('.poster-classic,.poster-modern,.catalog-page').forEach(el=>{el.style.transform='';el.style.marginBottom=''});return}const avail=Math.max(280,ww-30);$$('.poster-classic').forEach(el=>{const s=Math.min(1,avail/1000);el.style.transform=`scale(${s})`;el.style.marginBottom=`${-(el.offsetHeight*(1-s))}px`});$$('.poster-modern').forEach(el=>{const s=Math.min(1,avail/900);el.style.transform=`scale(${s})`;el.style.marginBottom=`${-(el.offsetHeight*(1-s))}px`});$$('.catalog-page').forEach(el=>{const s=Math.min(1,avail/794);el.style.transform=`scale(${s})`;el.style.marginBottom=`${-(el.offsetHeight*(1-s))}px`})}window.onresize=()=>setTimeout(fit,80);

(async()=>{loadSettingsUi();await refresh();setTimeout(fit,100)})();
