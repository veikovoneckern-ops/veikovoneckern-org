#!/usr/bin/env node
// Baut die Website aus inhalt/ + vorlage/ nach _site/.
// Ohne Fremdpakete, damit es auf jedem Rechner mit Node und in GitHub Actions
// gleich läuft. Aufruf: node bauen.js
//
// Jede Datei unter inhalt/ beginnt mit einem Kopf als HTML-Kommentar:
//   <!--seite { "titel": "...", "beschreibung": "..." } -->
// Blogartikel tragen zusätzlich "blog": { "reihe": 1, "bild": "/bilder/...", "auszug": "..." }.
// Kleinere "reihe" steht in der Übersicht weiter oben.
// Die Datei inhalt/x/y.html wird zu _site/x/y.html; GitHub Pages liefert sie
// auch unter /x/y (ohne Endung) aus, so bleiben die alten Adressen gültig.
const fs = require('fs');
const path = require('path');

const WURZEL = __dirname;
const AUS = path.join(WURZEL, '_site');
const cfg = JSON.parse(fs.readFileSync(path.join(WURZEL, 'seiten.json'), 'utf8'));
const vorlage = fs.readFileSync(path.join(WURZEL, 'vorlage', 'seite.html'), 'utf8');
const stand = Date.now().toString(36);
// Vorspann für den Probebetrieb unter https://<konto>.github.io/<repo>/:
// dort liegt die Seite nicht an der Wurzel. Mit eigener Domain (Datei CNAME)
// ist BASIS leer. Der Workflow setzt die Variable, lokal bleibt sie leer.
const BASIS = (process.env.BASIS || '').replace(/\/$/, '');
function mitBasis(html) {
  if (!BASIS) return html;
  return html
    .replace(/(\s(?:href|src|content)=")\/(?!\/)/g, '$1' + BASIS + '/')
    .replace(/url\((['"]?)\/(?!\/)/g, 'url($1' + BASIS + '/')
    .replace(/(["'])\/bilder\//g, '$1' + BASIS + '/bilder/');
}

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function alleDateien(dir, basis = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const rel = path.posix.join(basis, e.name);
    return e.isDirectory() ? alleDateien(path.join(dir, e.name), rel) : [rel];
  });
}

function lesen(rel) {
  const roh = fs.readFileSync(path.join(WURZEL, 'inhalt', rel), 'utf8');
  const m = roh.match(/^\s*<!--seite\s*([\s\S]*?)-->/);
  if (!m) throw new Error(`${rel}: Kopf <!--seite {...} --> fehlt`);
  let kopf;
  try { kopf = JSON.parse(m[1]); } catch (e) { throw new Error(`${rel}: Kopf ist kein gültiges JSON (${e.message})`); }
  if (!kopf.titel) throw new Error(`${rel}: "titel" fehlt im Kopf`);
  return { rel, kopf, inhalt: roh.slice(m[0].length).trim() };
}

// Adresse einer Seite, wie sie im Browser steht
function adresse(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.replace(/\.html$/, '');
}

function navigation(aktuell) {
  const punkt = (p, tief) => {
    const aktiv = p.href === aktuell ? ' aria-current="page"' : '';
    if (!p.unter) return `<li><a href="${p.href}"${aktiv}>${esc(p.text)}</a></li>`;
    return `<li><div class="eintrag"><a href="${p.href}"${aktiv}>${esc(p.text)}</a>` +
      `<button class="klapp" aria-expanded="false" aria-label="${esc(p.text)} aufklappen"></button></div>` +
      `<ul>${p.unter.map(u => punkt(u, tief + 1)).join('')}</ul></li>`;
  };
  return '    <ul>' + cfg.navigation.map(p => punkt(p, 0)).join('\n      ') + '</ul>';
}

function blogliste(artikel) {
  const liste = artikel
    .sort((a, b) => (a.kopf.blog.reihe ?? 999) - (b.kopf.blog.reihe ?? 999))
    .map(a => `  <a class="blogeintrag" href="${adresse(a.rel)}">
    ${a.kopf.blog.bild ? `<img src="${a.kopf.blog.bild}" alt="" loading="lazy">` : '<span></span>'}
    <div><h2>${esc(a.kopf.titel)}</h2><p>${esc(a.kopf.blog.auszug || '')}</p></div>
  </a>`).join('\n');
  return `<div class="blogliste">\n${liste}\n</div>`;
}

function seiteBauen(s, artikel) {
  let inhalt = s.inhalt;
  if (s.kopf.blog) {
    inhalt = `<div class="blogkopf"><a href="/inspiration-blog/">← Alle Beiträge</a><h1>${esc(s.kopf.titel)}</h1></div>\n` + inhalt;
  }
  if (inhalt.includes('<!--blogliste-->')) inhalt = inhalt.replace('<!--blogliste-->', blogliste(artikel));
  // Interaktive Bausteine liegen in bausteine/<name>.html; in der Seite steht nur
  // <!--baustein name-->. So bleibt die Seite für den Editor und für Neo kurz.
  inhalt = inhalt.replace(/<!--baustein ([a-z0-9-]+)-->/g, (m, name) => {
    const f = path.join(WURZEL, 'bausteine', name + '.html');
    if (!fs.existsSync(f)) throw new Error(`${s.rel}: Baustein "${name}" fehlt (bausteine/${name}.html)`);
    return `<div class="baustein">\n${fs.readFileSync(f, 'utf8').replace(/\n$/, '')}\n</div>`;
  });
  const url = adresse(s.rel);
  const bild = s.kopf.bild || (s.kopf.blog && s.kopf.blog.bild);
  const werte = {
    titel: esc(s.kopf.titel),
    titel_voll: esc(s.rel === 'index.html' ? s.kopf.titel : `${s.kopf.titel} | ${cfg.name}`),
    beschreibung: esc(s.kopf.beschreibung || ''),
    kanonisch: cfg.domain + url,
    og_bild: bild ? `<meta property="og:image" content="${cfg.domain}${bild}">` : '',
    navigation: navigation(url),
    inhalt,
    mail: cfg.mail,
    name: esc(cfg.name),
    jahr: new Date().getFullYear(),
    stand,
  };
  return vorlage.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in werte ? werte[k] : `{{${k}}}`));
}

function kopieren(von, nach) {
  if (!fs.existsSync(von)) return;
  fs.cpSync(von, nach, { recursive: true });
}

// --- los ---
fs.rmSync(AUS, { recursive: true, force: true });
fs.mkdirSync(AUS, { recursive: true });
const seiten = alleDateien(path.join(WURZEL, 'inhalt')).filter(f => f.endsWith('.html')).map(lesen);
const artikel = seiten.filter(s => s.kopf.blog);

for (const s of seiten) {
  const ziel = path.join(AUS, s.rel);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, mitBasis(seiteBauen(s, artikel)));
}
kopieren(path.join(WURZEL, 'bilder'), path.join(AUS, 'bilder'));
kopieren(path.join(WURZEL, 'schrift'), path.join(AUS, 'schrift'));
fs.writeFileSync(path.join(AUS, 'stil.css'), mitBasis(fs.readFileSync(path.join(WURZEL, 'vorlage', 'stil.css'), 'utf8')));
if (fs.existsSync(path.join(WURZEL, 'CNAME'))) fs.copyFileSync(path.join(WURZEL, 'CNAME'), path.join(AUS, 'CNAME'));
fs.writeFileSync(path.join(AUS, '.nojekyll'), '');

// Sitemap und robots.txt
const urls = seiten.map(s => `  <url><loc>${cfg.domain}${adresse(s.rel)}</loc></url>`).join('\n');
fs.writeFileSync(path.join(AUS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(AUS, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${cfg.domain}/sitemap.xml\n`);

// 404-Seite
fs.writeFileSync(path.join(AUS, '404.html'), mitBasis(seiteBauen({ rel: '404.html', kopf: { titel: 'Seite nicht gefunden' },
  inhalt: '<div class="fliess"><h1>Seite nicht gefunden</h1><p>Diese Seite gibt es nicht (mehr). <a href="/">Zur Startseite</a></p></div>' }, artikel)));

console.log(`${seiten.length} Seiten gebaut (${artikel.length} Blogartikel) -> _site/`);
