/* ════════════════════════════════════════════════════════════════
   MERUVA NEWS · BUILD  (thuần Node — không cần cài thư viện)
   ────────────────────────────────────────────────────────────────
   Chạy:   node build.js
   Sinh ra: với mỗi "bảng tin" trong  content/<slug>/  →  HTML tĩnh
            cho từng ngôn ngữ (vi / en / ja), chuẩn SEO + hreflang.

   THÊM BÀI :  tạo file  content/<slug>/posts/ten-bai.post
   THÊM BẢNG TIN :  tạo thư mục  content/<slug-moi>/  (board.json + posts/)
   ════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT       = __dirname;
const CONTENT    = path.join(ROOT, 'content');
const TEMPLATE   = path.join(ROOT, '_template.html');

const CRUMB = {
  vi: { home: 'Trang chủ', news: 'Báo' },
  en: { home: 'Home',      news: 'News' },
  ja: { home: 'ホーム',     news: 'ニュース' }
};

/* ── tiện ích ──────────────────────────────────────────────── */
function esc(s){ return String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function replaceAll(str, find, val){ return str.split(find).join(val); }
function fileFor(board, lang){ return board.outBase + (lang==='vi'?'':'.'+lang) + '.html'; }
function urlFor(board, lang){ return board.baseUrl + fileFor(board, lang); }

/* ── parse 1 file .post ────────────────────────────────────── */
function parsePost(raw){
  const sections = {};
  let cur = null;
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^===\s*(.+?)\s*===\s*$/);
    if (m){ cur = m[1].toUpperCase(); sections[cur] = []; return; }
    if (cur) sections[cur].push(line);
  });

  const meta = {};
  (sections.META || []).forEach(l => {
    const m = l.match(/^([A-Za-z][\w-]*):\s?(.*)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  });

  const langs = {};
  ['VI','EN','JA'].forEach(code => {
    if (!sections[code]) return;
    const fields = {}; const bodyLines = []; let inBody = false;
    sections[code].forEach(l => {
      if (inBody){ bodyLines.push(l); return; }
      const mb = l.match(/^BODY:\s?(.*)$/);
      if (mb){ inBody = true; if (mb[1].trim()) bodyLines.push(mb[1]); return; }
      const m = l.match(/^([A-Za-z][\w-]*):\s?(.*)$/);
      if (m) fields[m[1].toLowerCase()] = m[2].trim();
    });
    langs[code.toLowerCase()] = { fields, body: bodyLines.join('\n').trim() };
  });

  return { meta, langs };
}

/* ── lấy nội dung 1 bài theo ngôn ngữ (fallback về vi) ─────── */
function pick(post, lang){
  const vi = post.langs.vi || { fields:{}, body:'' };
  const L  = post.langs[lang] || vi;
  const f = L.fields, vf = vi.fields;
  return {
    title:   f.title   || vf.title   || '',
    excerpt: f.excerpt || vf.excerpt || '',
    body:    L.body    || vi.body    || '',
    week:    f.week    || post.meta.week || '',
    tag:     f.tag     || post.meta.tag  || '',
    missing: !post.langs[lang]
  };
}

/* ── HTML kho bài (#posts) cho 1 ngôn ngữ ──────────────────── */
function buildPosts(posts, lang){
  return posts.map(p => {
    const d = pick(p, lang), m = p.meta;
    let attrs =
      ' id="'+esc(m.id)+'"' +
      ' data-accent="'+esc(m.accent||'news')+'"' +
      ' data-brand="'+esc(m.brand||'MERUVA')+'"' +
      ' data-brandsub="'+esc(m.brandsub||'')+'"' +
      ' data-date="'+esc(m.date||'')+'"' +
      ' data-week="'+esc(d.week)+'"' +
      ' data-dateiso="'+esc(m.dateiso||'')+'"';
    if (d.tag)  attrs += ' data-tag="'+esc(d.tag)+'"';
    if (m.link) attrs += ' data-link="'+esc(m.link)+'"';
    return (
      '  <article class="post"'+attrs+'>\n' +
      '    <h2 class="post-title">'+esc(d.title)+'</h2>\n' +
      '    <p class="post-excerpt">'+esc(d.excerpt)+'</p>\n' +
      '    <div class="post-body">\n'+d.body+'\n    </div>\n' +
      '  </article>'
    );
  }).join('\n\n');
}

/* ── khối hreflang ─────────────────────────────────────────── */
function buildHreflang(board){
  const links = board.languages.map(l =>
    '<link rel="alternate" hreflang="'+l+'" href="'+urlFor(board,l)+'">');
  links.push('<link rel="alternate" hreflang="x-default" href="'+urlFor(board,'vi')+'">');
  return links.join('\n');
}

/* ── bộ chuyển ngôn ngữ (điều hướng giữa các file) ─────────── */
function buildLangSwitcher(board, current){
  const label = { vi:'VI', en:'EN', ja:'JA' };
  const parts = [];
  board.languages.forEach((l, i) => {
    if (i) parts.push('      <span class="lang-sep"></span>');
    const active = l===current ? ' lang-active' : '';
    parts.push('      <button class="lang-btn'+active+'" data-lang="'+l+
      '" onclick="location.href=\''+fileFor(board,l)+'\'">'+label[l]+'</button>');
  });
  return parts.join('\n');
}

/* ── JSON-LD tĩnh (Blog + từng BlogPosting + Breadcrumb) ───── */
function buildJsonLd(board, lang, posts){
  const I = board.i18n[lang], url = urlFor(board, lang), cb = CRUMB[lang] || CRUMB.vi;
  const blogPost = posts.map(p => {
    const d = pick(p, lang);
    return { '@type':'BlogPosting', headline:d.title, datePublished:p.meta.dateiso,
      description:d.excerpt, inLanguage:lang, url:url+'#'+p.meta.id, image:board.ogImage,
      author:{ '@type':'Person', name:'Phạm Duy Kha (Bin)' },
      publisher:{ '@type':'Organization', name:'MERUVA',
        logo:{ '@type':'ImageObject', url:'https://meruva.vn/logo-full.png' } } };
  });
  const blog = { '@context':'https://schema.org', '@type':'Blog', name:I.blogName,
    description:I.blogDesc, url, inLanguage:lang, blogPost };
  const crumb = { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[
    { '@type':'ListItem', position:1, name:cb.home, item:'https://meruva.vn/' },
    { '@type':'ListItem', position:2, name:cb.news, item:url } ] };
  return '<script type="application/ld+json">\n'+JSON.stringify(blog)+'\n</script>\n' +
         '<script type="application/ld+json">\n'+JSON.stringify(crumb)+'\n</script>';
}

/* ── build 1 bảng tin ──────────────────────────────────────── */
function buildBoard(slug, template){
  const dir = path.join(CONTENT, slug);
  const board = JSON.parse(fs.readFileSync(path.join(dir, 'board.json'), 'utf8'));
  const postsDir = path.join(dir, 'posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.post'));

  const posts = files
    .map(f => parsePost(fs.readFileSync(path.join(postsDir, f), 'utf8')))
    .sort((a, b) => (b.meta.dateiso || '').localeCompare(a.meta.dateiso || ''));

  const outDir = path.resolve(ROOT, board.outDir || '.');
  console.log('\n📰 Bảng tin: '+slug+'  ('+posts.length+' bài)');

  board.languages.forEach(lang => {
    const I = board.i18n[lang];
    if (!I){ console.log('   ⚠ thiếu cấu hình i18n cho "'+lang+'" trong board.json'); return; }

    let html = template;
    const map = {
      '%LANG%':          lang,
      '%OG_LOCALE%':     I.ogLocale,
      '%PAGE_TITLE%':    esc(I.pageTitle),
      '%META_DESC%':     esc(I.metaDesc),
      '%OG_DESC%':       esc(I.ogDesc || I.metaDesc),
      '%OG_IMAGE%':      board.ogImage,
      '%CANONICAL%':     urlFor(board, lang),
      '%HREFLANG%':      buildHreflang(board),
      '%JSONLD%':        buildJsonLd(board, lang, posts),
      '%KICKER%':        I.kicker,
      '%TITLE_HTML%':    I.titleHtml,
      '%INTRO_HTML%':    I.introHtml,
      '%BACK_LABEL%':    I.backLabel,
      '%FOOTER_HTML%':   I.footerHtml,
      '%CLOSE_LABEL%':   esc(I.closeLabel),
      '%LANG_SWITCHER%': buildLangSwitcher(board, lang),
      '%POSTS%':         buildPosts(posts, lang)
    };
    Object.keys(map).forEach(k => { html = replaceAll(html, k, map[k]); });

    const outPath = path.join(outDir, fileFor(board, lang));
    fs.writeFileSync(outPath, html, 'utf8');

    const missing = posts.filter(p => pick(p, lang).missing).length;
    const note = missing ? '  ⚠ '+missing+' bài chưa dịch (tạm dùng tiếng Việt)' : '';
    console.log('   ✓ '+path.relative(ROOT, outPath)+note);
  });
}

/* ── chạy toàn bộ ──────────────────────────────────────────── */
function main(){
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const boards = fs.readdirSync(CONTENT, { withFileTypes:true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  if (!boards.length){ console.log('Không tìm thấy bảng tin nào trong content/'); return; }
  boards.forEach(slug => buildBoard(slug, template));
  console.log('\n✅ Xong. Đã sinh HTML tĩnh cho '+boards.length+' bảng tin.\n');
}
main();
