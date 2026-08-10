# PM Dekor szerkesztő v8.3

## Fő javítás: a kép feltöltése már ismeri a blokk szélességét

Korábban a crop ablak még a régi „felső / középső / alsó” logikát használta,
miközben a plakátban már 1×, 2×, 3× és 4× széles blokkok vannak.

V8.3-ban a crop célpontjai:
- 1× normál blokk
- 2× dupla blokk
- 3× széles blokk
- 4× teljes sor

## Automatikus felismerés feltöltéskor
A feltöltött kép képaránya alapján a program előre választ egy valószínű célblokkot:
- normál
- dupla
- széles
- teljes sor

Ez kézzel bármikor átállítható a crop ablakban.

## A plakát tényleges blokkja számít
Az AUTO képkezelés most már a valós blokkot nézi:
- 2× blokk + 2 kép = két normál képhely
- 2× blokk + 1 kép = dupla képhely
- 3× blokk + 1 kép = széles képhely
- 4× blokk + 1 kép = teljes soros képhely
- 4× blokk + 2 kép = két dupla képhely

Így egy széles/kollázs fotó nem ugyanazzal a szabállyal jelenik meg egy normál és egy széles blokkban.

## Újravágás
Ha a termék már plakáton van, az „Újravágás” a termék aktuális plakáthelyének arányával nyitja meg az előnézetet.

## Export
A V8.2 crop-hű PNG exportja is az aktuális blokk célméretét használja.
