# PM Dekor szerkesztő v7.7

## Új termékadat: Plakát alcím
A termék most külön kezeli:
- Terméknév
- Ár
- Kategória
- **Plakát alcím**
- Leírás

### Plakát
A mini termékfelirat sorrendje:
1. Plakát alcím
2. ha nincs, Kategória
3. ha az sincs, Terméknév

A hosszabb leírás nem zsúfolja a plakátot.

### Katalógus
A katalógus továbbra is megjeleníti:
- kategóriát
- terméknevet
- leírást
- árat

## Logó javítás
- a katalógus fejlécébe is bekerült a dinamikus logó;
- export előtt a program megvárja a képek és betűk betöltődését;
- ez csökkenti annak esélyét, hogy a logó vagy egy termékkép lemaradjon a PNG/PDF exportból.

A meglévő termékek tovább működnek; az új `Plakát alcím` mező náluk kezdetben üres.
