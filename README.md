# PM Dekor szerkesztő v5

A v5 már kezeli azt az esetet is, amikor **egy blokkban két kép van összefogva egy közös címmel**.

## Új a v5-ben
- felső két blokk: 2-2 kép egy közös főcímmel
- középső két nagy blokk: 2-2 kép egy közös főcímmel
- alsó sor: 3 külön termék marad
- minden belső kép külön mozgatható / zoomolható
- a kombinált blokk fölött közös ár/cím jelenik meg
- belül a két képhez külön mini cím / mini ár tartozik

## Mit modellez?
Pont azt a mintát, amit mutattál:
- egy külső blokk
- közös cím
- közös ársáv vagy árlogika
- belül két külön fotó

## Használat
1. Nyisd meg az `index.html` fájlt
2. Kattints a `Mintaadatok` gombra
3. Menj a `Plakát` fülre
4. Nézd meg a felső és a középső kombinált blokkokat
5. Kattints bármelyik belső képre
6. Húzd egérrel, vagy állítsd a bal oldali csúszkákkal

## GitHub Pages
A ZIP tartalmát töltsd fel a repo gyökerébe:
- `index.html`
- `styles.css`
- `app.js`

Utána: Settings → Pages → Deploy from a branch → main → /(root)

## Fontos
A PNG/PDF export külső CDN könyvtárakat használ, ezért internetkapcsolat kell.
Az adatok a böngészőben maradnak, de a JSON mentés funkcióval átvihetők.
