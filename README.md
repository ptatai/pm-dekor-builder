# PM Dekor szerkesztő v3

A v3 célja, hogy az eredeti PM Dekor plakát hangulatát jóval közelebbről hozza, de a termékfotók teljesen cserélhetők legyenek.

## Fő funkciók
- PM Dekor Classic plakátsablon, 4 + 2 + 3 termékes elrendezéssel
- Modern plakátsablon
- Saját termékfotók
- Eltérő képarányok: Kitöltés / Teljes kép
- Zoom, vízszintes és függőleges pozíció
- A plakáton közvetlenül húzható termékkép
- Saját háttérkép feltöltése
- Saját logó feltöltése
- PNG plakát export
- Többoldalas PDF katalógus
- JSON biztonsági mentés és visszatöltés
- Böngészőben tárolt adatok, backend nélkül
- GitHub Pages kompatibilis

## Gyors teszt
1. Nyisd meg az index.html fájlt.
2. Kattints a `Mintaadatok` gombra.
3. Menj a `Plakát` fülre.
4. A `PM Dekor Classic` sablon automatikusan a 4 + 2 + 3 elrendezést használja.
5. Kattints bármelyik képre és húzd egérrel.
6. A bal oldali csúszkákkal zoomolhatsz és finomhangolhatsz.
7. A `Plakát letöltése PNG-ben` gombbal exportálhatsz.

## GitHub Pages
1. Hozz létre egy új repositoryt, pl. `pm-dekor-szerkeszto`.
2. Töltsd fel a repo gyökerébe:
   - index.html
   - styles.css
   - app.js
3. GitHub → Settings → Pages.
4. Source: `Deploy from a branch`
5. Branch: `main`
6. Folder: `/ (root)`
7. Save

Néhány perc múlva a GitHub megadja a publikus URL-t.

## Fontos
A PNG/PDF export két külső könyvtárat CDN-ről tölt be, ezért exportáláskor internetkapcsolat kell.
A termékadatok az adott böngészőben tárolódnak. Másik gépre a `Mentés fájlba` / `Mentés betöltése` funkcióval vihetők át.
