# veikovoneckern.org

Die Website von Veiko von Eckern als einfache Dateien. Sie ersetzt den
one.com-Baukasten. Domain und Mail bleiben bei one.com, ausgeliefert wird die
Seite über GitHub Pages.

## Wie es zusammenhängt

```
inhalt/…/*.html   Texte der Seiten (je Seite eine Datei)
vorlage/          Rahmen: Kopf, Menü, Fuß, Gestaltung (stil.css)
seiten.json       Menü, Name, Mailadresse
bausteine/        interaktive Bausteine (Fragen, Personen, Lernverfahren …)
bilder/, schrift/ Bilder, Videos, Schrift Outfit
bauen.js          setzt alles zu fertigen Seiten in _site/ zusammen
```

Ein Push auf `main` baut und veröffentlicht automatisch
(`.github/workflows/pages.yml`). **Öffentlich wird nur, was auf `main` liegt.**
Änderungen von Neo kommen als Zweig `neo/…` und gehen erst nach
Veikos Übernahme live.

## Eine Seite ändern oder anlegen

Jede Datei unter `inhalt/` beginnt mit einem Kopf:

```html
<!--seite
{ "titel": "Alignment", "beschreibung": "Ein Satz für Suchmaschinen" }
-->
```

Danach folgt normales HTML. Grundgrößen wie im früheren Original: H1 64 px,
H2 42 px, H3 32 px, Text 18 px. Abweichende Größen stehen direkt am Element
(`style="font-size:50px"`). Bausteine, die die Gestaltung kennt:

- Band (dunkelgrauer Streifen mit Bild, weiße Schrift):
  ```html
  <section class="band" data-effekt="aufdecken" style="--h:430px">
    <div class="band-bild" style="background-image:url('/bilder/x.jpg');opacity:0.4"></div>
    <div class="band-innen"><h2>ÜBERSCHRIFT</h2></div>
  </section>
  ```
  `--h` ist die Höhe, `opacity` die Deckkraft des Bildes (ohne Angabe: voll).
  `data-effekt`: `aufdecken` (Bild steht still, Inhalt gleitet darüber),
  `parallax` (Bild läuft beim Scrollen versetzt mit) oder weglassen. Beide
  Effekte wirken wie im früheren Original nur am Rechner, nicht auf Telefon und Tablet.
- `<div class="fliess">…</div>` Fließtext in Lesebreite
- `<div class="balken"><h3>…</h3></div>` dunkler Balken mit Überschrift
- `<div class="spalten"><div>…</div><div>…</div></div>` zwei Spalten nebeneinander
- `<div class="karten"><div class="karte">…</div></div>` Kartenraster
- `<p class="knopfzeile"><a class="knopf" href="…">TEXT</a></p>` Knopf
- `<!--baustein name-->` setzt einen interaktiven Baustein aus `bausteine/name.html` ein
  (bringt sein eigenes CSS und Skript mit; die Seite selbst bleibt dadurch kurz)

Der Dateipfad ist die Adresse: `inhalt/ki-ani-agi-asi/alignment.html` wird zu
`/ki-ani-agi-asi/alignment`, `inhalt/x/index.html` zu `/x/`.
Neue Menüpunkte trägt man in `seiten.json` ein.

## Blogartikel

Eine Datei unter `inhalt/inspiration-blog/`, im Kopf zusätzlich:

```json
"blog": { "reihe": 1, "bild": "/bilder/titelbild.jpg", "auszug": "Zwei Sätze für die Übersicht" }
```

Kleinere `reihe` steht in der Übersicht weiter oben; ein neuer Artikel bekommt
`0` oder eine negative Zahl, damit er vorn steht. Die Übersicht baut sich von selbst.

## Ansehen auf dem eigenen Rechner

```bash
node vorschau.js
```

Danach `http://localhost:4180` öffnen. Die Seite wird bei jedem Aufruf frisch gebaut.

## Umstellung der Domain

Solange in diesem Repo **keine** Datei `CNAME` liegt, ist die Seite nur unter
`https://veikovoneckern-ops.github.io/veikovoneckern-org/` erreichbar
(Probebetrieb). Zum Umschalten: Datei `CNAME` mit dem Inhalt
`veikovoneckern.org` anlegen und bei one.com die DNS-Einträge umstellen.
Die MX-Einträge (Mail) bleiben unverändert.
