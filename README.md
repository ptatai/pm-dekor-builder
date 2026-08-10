# PM Dekor szerkesztő v8.5

A V8.5 fő célja: a plakát szerkesztése legyen gyorsabb és vizuálisabb,
az export pedig ellenőrizhető legyen még letöltés előtt.

## 1. Vizuális termékválasztó
- üres képhelyre kattintva képes termékgaléria nyílik
- kereshető név, kategória és ár alapján
- a kijelölt termék egy kattintással bekerül a képhelyre
- már kitöltött képhelyen dupla kattintással is megnyitható
- a gyorsmenüben külön „Másik termék” gomb van

## 2. Drag & drop helycsere
A termékfotó bal alsó sarkában megjelenik egy ↔ fogópont.
Ezt egy másik képhelyre húzva:
- két termék helyet cserél, vagy
- üres képhelyre húzva a termék oda kerül.

A fotó sima húzása továbbra is a crop/pozíció állítására szolgál,
így a két művelet nem ütközik.

## 3. Gyors képhely-menü
Kijelölt terméknél közvetlenül elérhető:
- Másik termék
- Újravágás
- AUTO / Kitöltés / Teljes kép
- Zoom
- Képfájl csere
- Hely ürítése

## 4. Valódi export-előnézet
A plakát letöltés előtt ugyanazzal az export pipeline-nal elkészül,
mint a végleges fájl.

Az előnézetből tölthető le:
- PNG
- JPG

Így crop, logó, háttér és automatikus üreshely-rendezés még letöltés előtt ellenőrizhető.

## 5. JPG export
- állítható JPG minőség: 70–100%
- alapérték: 92%
- plakát: PNG vagy JPG
- katalógus: PDF vagy JPG
- többoldalas katalógusnál oldalanként külön JPG készül

## 6. Stabilitási javítás
A logó globális pointer eseménykezelői renderelésenként már nem halmozódnak;
az előző listener automatikusan megszűnik.

## Megmaradt a V8.4-ből
- stabil interaktív logó
- pontosabb plakátháttér-export
- 1× / 2× / 3× / 4× blokkarány-tudatos crop
- crop-hű PNG/JPG képraszterizálás
- intelligens üreshely-tömörítés
- új katalógus
- szezonális hátterek
- automatikus mentés és teljes JSON biztonsági mentés
