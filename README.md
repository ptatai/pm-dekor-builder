# PM Dekor szerkesztő v7

A V7 legnagyobb változása: **a plakát sorai és blokkjai már nem fixek**.

## Dinamikus sorok
Egy sor maximum **4 egységből** áll.

Példák:
- `1 + 1 + 1 + 1` → 4 külön egyképes blokk
- `2 + 2` → 2 darab kétképes blokk
- `1 + 3` → egy egyképes + egy háromképes blokk
- `1 + 1 + 1` → csonka, háromelemes sor
- `2 + 1` → csonka sor
- `3` → egy háromképes blokk
- `1` → egyetlen blokk

## Csonka sor
A sor igazítása választható:
- balra
- középre
- jobbra
- egyenletesen

A csonka sor nem kap automatikusan ronda üres blokkokat.

## Blokkonként szerkeszthető
- 1 / 2 / 3 képes blokk
- közös cím
- közös ársáv
- minden képhelyhez külön termékválasztó
- blokk törlés / hozzáadás

## Plusz
- `Termékek automatikus kiosztása` gomb
- sorok fel / le mozgatása
- max. 5 sor
- meglévő termék **Újravágás / crop** funkciója a plakát toolbarból és a termék szerkesztéséből
- V6.3 logóvezérlés és intelligens képfeltöltés megmaradt

## Fájlok
- index.html
- styles.css
- app.js
- pm-dekor-background.png
- README.md

GitHub Pages frissítés után érdemes: **Ctrl + Shift + R**
