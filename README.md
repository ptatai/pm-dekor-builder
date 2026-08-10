# PM Dekor szerkesztő v8.2

Ez a verzió két, kész plakátnál kritikus exporthibát javít.

## 1. Crop / zoom / eltolás pontos PNG export
Korábban a böngészős előnézetben jól beállított kép a PNG exportban eltérően jelenhetett meg.

V8.2-ben:
- az export előtt minden plakátkép külön raszterizálódik,
- a tényleges AUTO / Teljes kép / Kitöltés mód alapján,
- ugyanazzal a zoommal,
- ugyanazzal az X/Y eltolással,
- a html2canvas már a kész rasztert exportálja.

Ez lényegesen stabilabb, mint a CSS transform közvetlen exportja.

## 2. Kevés termék esetén intelligens tömörítés
Ha az exportnál elrejtjük az üres helyeket:
- a részben üres blokkokból az üres képcellák is eltűnnek,
- a teljesen üres blokkok eltűnnek,
- a teljesen üres sorok eltűnnek,
- a megmaradó részleges sorok szélessége újraszámolódik,
- 1–3 sor esetén a termékek nem nyúlnak szét függőlegesen az egész plakáton,
- a ritka elrendezés automatikusan középre rendeződik.

## Megmaradt
- V8.1 új katalógus
- szezonális hátterek
- interaktív logó
- automatikus mentés
- biztonsági mentés / visszaállítás
- plakát export előtti figyelmeztetés
- PNG plakát és PDF katalógus export
