# PM Dekor szerkesztő v7.5

## Fő javítás: termékcsere → plakát előnézet

A V7.4-ben maradt egy állapotkezelési hiba:
az `ensurePosterRows()` minden rendernél új objektumokat hozott létre.
Emiatt bizonyos szerkesztési sorrend után a lenyíló mezők még egy régi blokkobjektumot módosítottak,
miközben a plakát már egy új példányból renderelt.

### V7.5 javítás
- a sorszerkezet normalizálása most **helyben történik**, nem cseréli le a blokkokat;
- termék kiválasztásakor a teljes szerkesztő + plakát újrarenderelődik;
- cím, ár, blokktípus és sorigazítás után is teljes állapotszinkron történik;
- a kiválasztott termék képének láthatóságára külön CSS biztosíték került.

A böngészős adatbázis neve nem változott, így a meglévő termékek továbbra is megmaradnak.
