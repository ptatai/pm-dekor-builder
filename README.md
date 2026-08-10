# PM Dekor szerkesztő v8.6

A V8.6 nem új funkciócsomag, hanem export-stabilizáló kiadás.

## 1. JPG / PNG egyszerűsítés
A JPG-minőség csúszka kikerült.

A plakát exportban csak ezt kell választani:
- PNG
- JPG

A JPG fixen 92%-os minőséggel készül.

## 2. Logó export javítása
A logó export előtt külön raszterizálódik.

Ez azt jelenti, hogy a html2canvas már nem próbálja külön újrarajzolni:
- a PM feliratot,
- a DEKOR / MELINDA sort,
- vagy a feltöltött saját logó belső CSS-pozícióját.

A logó külső köre és a felhasználó által beállított hely/méret megmarad,
a belső tartalom pedig egy stabil képréteg lesz.

## 3. Footer fixen legalul
A V8.4-ből örökölt export CSS véletlenül relatív pozícióra állította a láblécet.
Ezért a PM Dekor Melinda / Facebook / Instagram rész fel tudott ugrani a fejléc alá.

V8.6-ban:
- fejléc fixen felül,
- termékterület fixen középen,
- footer fixen alul.

## 4. Kevés termék intelligensebb exportja
Az automatikus rendezés kizárólag a termékterületet módosíthatja.

Kevés terméknél:
- az üres blokkok eltűnhetnek,
- a megmaradó sorok újraszámolódnak,
- de a tartalom felülről lefelé tömörödik,
- nem nyúlik szét a teljes plakáton,
- és nem mozdíthatja el a fejlécet vagy a footert.

## Megmaradt a V8.5-ből
- vizuális termékválasztó
- képhelyek drag & drop cseréje
- gyorsmenü
- valódi export-előnézet
- PNG és JPG plakát
- PDF és JPG katalógus
- blokkarány-tudatos crop
- szezonális hátterek
- automatikus mentés
- teljes JSON biztonsági mentés
