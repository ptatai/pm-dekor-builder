# PM Dekor szerkesztő v7.4

Ez a verzió főleg stabilitási javítás.

## Javítva: az előnézet nem frissült megbízhatóan
A V7.3-ban a plakát renderelése bizonyos helyzetekben **rejtetten újra kiosztotta a termékeket**.
Ez főleg sorok törlése / újra létrehozása után okozhatott eltérést a szerkesztő és az előnézet között.

A V7.4-ben:
- nincs rejtett automatikus kiosztás;
- a sorszerkesztő és a plakát **ugyanazt az állapotot használja**;
- termékcsere után az előnézet azonnal újrarenderelődik;
- a `Termékek automatikus kiosztása` gomb ismét ténylegesen működik.

## Szélesség és képszám külön
Egy blokk beállításai most két külön dolog:

### Szélesség
- 1× normál
- 2× dupla
- 3× széles
- 4× teljes sor

### Képek száma
- 1 kép
- 2 kép
- 3 kép

Ezért például lehet:
- 2× széles blokk **1 panorámaképpel**
- 2× széles blokk 2 képpel
- 3× széles blokk 1 kiemelt képpel
- teljes soros blokk 1 képpel

## Blokk hozzáadása
A félreérthető `+1 / +2 / +3` helyett:
- + Normál
- + Dupla
- + Tripla
- + Teljes sor

Az új kézi blokk alapból 1 képes, a képszám utána külön állítható.

A meglévő böngészős termékadatokat és beállításokat ez a verzió továbbra is ugyanabban az adatbázisban használja.
