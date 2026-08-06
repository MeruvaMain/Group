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
const https = require('https');

const ROOT       = __dirname;
const CONTENT    = path.join(ROOT, 'content');
const TEMPLATE   = path.join(ROOT, '_template.html');

/* ── Supabase: đọc bài ĐÃ XUẤT BẢN từ bảng posts ───────────────
   Publishable key an toàn để nằm trong code (giống các trang web) —
   RLS chỉ cho đọc bài published = true, bài nháp vẫn kín.        */
const SB_URL = 'https://ztqyojsyafhpkmhrawtd.supabase.co';
const SB_KEY = 'sb_publishable_fDQp-ygVduxkor0ocVqQLQ_flK6v-qv';

function fetchDbPosts(){
  return new Promise(function(resolve){
    const url = SB_URL + '/rest/v1/posts?select=*&published=eq.true&order=date_iso.desc';
    const req = https.get(url, {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
      timeout: 15000
    }, function(res){
      let data = '';
      res.on('data', function(c){ data += c; });
      res.on('end', function(){
        try {
          const rows = JSON.parse(data);
          if (!Array.isArray(rows)){
            console.log('⚠ Supabase báo lỗi — build chỉ với bài .post local: ' + data.slice(0, 140));
            return resolve([]);
          }
          resolve(rows);
        } catch(e){
          console.log('⚠ Không đọc được phản hồi Supabase — build chỉ với bài .post local');
          resolve([]);
        }
      });
    });
    req.on('error', function(e){
      console.log('⚠ Không kết nối được Supabase (' + e.message + ') — build chỉ với bài .post local');
      resolve([]);
    });
    req.on('timeout', function(){ req.destroy(new Error('timeout')); });
  });
}

/* Số tuần ISO — khớp cách admin.html tính (Tuần N / Week N / 第N週) */
function isoWeek(d){
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil(((dt - y0) / 86400000 + 1) / 7);
}

/* Ảnh trong body: đổi src= → data-src= để lazy-load (bài DB do admin
   dán HTML thường dùng src trực tiếp; bài .post đã viết data-src sẵn) */
function lazyImgs(html){
  return String(html == null ? '' : html).replace(/<img\b([^>]*?)\ssrc=/gi, function(m, pre){
    return /data-src=/i.test(m) ? m : '<img' + pre + ' data-src=';
  });
}

/* ── đổi 1 dòng bảng posts (Supabase) → cấu trúc bài như .post ── */
function dbRowToPost(row){
  const d = row.date_iso ? new Date(row.date_iso + 'T00:00:00') : new Date();
  const pad = function(n){ return String(n).padStart(2, '0'); };
  const dateDisplay = pad(d.getDate()) + ' · ' + pad(d.getMonth() + 1) + ' · ' + d.getFullYear();
  const w = isoWeek(d);
  const week = { vi: 'Tuần ' + w, en: 'Week ' + w, ja: '第' + w + '週' };

  const langs = {};
  ['vi', 'en', 'ja'].forEach(function(l){
    const L = row[l];
    if (!L || !L.title) return;
    langs[l] = {
      fields: { title: L.title, excerpt: L.excerpt || '', week: week[l] },
      body: lazyImgs(L.body)
    };
  });

  return {
    meta: {
      id:       row.slug,
      accent:   row.accent || 'news',
      date:     dateDisplay,
      dateiso:  row.date_iso || '',
      brand:    row.brand || 'MERUVA',
      brandsub: row.brand_sub || '',
      tag:      row.tag || '',
      link:     row.link || '',
      image:    row.image_url || '',
      imagealt: row.image_alt || ''
    },
    langs
  };
}

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
    if (m.image) attrs += ' data-image="'+esc(m.image)+'" data-imagealt="'+esc(m.imagealt||'')+'"';
    /* Ảnh cover (nếu có) đứng đầu bài — lazy-load, chỉ tải khi mở bài */
    const cover = m.image
      ? '      <img class="post-cover" data-src="'+esc(m.image)+'" alt="'+esc(m.imagealt || d.title)+'">\n'
      : '';
    return (
      '  <article class="post"'+attrs+'>\n' +
      '    <h2 class="post-title">'+esc(d.title)+'</h2>\n' +
      '    <p class="post-excerpt">'+esc(d.excerpt)+'</p>\n' +
      '    <div class="post-body">\n'+cover+d.body+'\n    </div>\n' +
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
function absUrl(u, base){
  if (!u) return u;
  try { return new URL(u, base).href; } catch(e){ return u; }
}
function buildJsonLd(board, lang, posts){
  const I = board.i18n[lang], url = urlFor(board, lang), cb = CRUMB[lang] || CRUMB.vi;
  const blogPost = posts.map(p => {
    const d = pick(p, lang);
    return { '@type':'BlogPosting', headline:d.title, datePublished:p.meta.dateiso,
      description:d.excerpt, inLanguage:lang, url:url+'#'+p.meta.id,
      image: absUrl(p.meta.image, board.baseUrl) || board.ogImage,
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
function buildBoard(slug, template, dbPosts){
  const dir = path.join(CONTENT, slug);
  const board = JSON.parse(fs.readFileSync(path.join(dir, 'board.json'), 'utf8'));
  const postsDir = path.join(dir, 'posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.post'));

  /* Gộp bài .post local + bài đã xuất bản từ database.
     Trùng slug/id → bài database thắng (nguồn mới nhất). */
  const byId = new Map();
  files.forEach(f => {
    const p = parsePost(fs.readFileSync(path.join(postsDir, f), 'utf8'));
    byId.set(p.meta.id, p);
  });
  let fromDb = 0;
  (dbPosts || []).forEach(row => {
    if ((row.board || 'tin-tong-hop') !== slug) return;
    if (!row.slug) return;
    byId.set(row.slug, dbRowToPost(row));
    fromDb++;
  });

  const posts = Array.from(byId.values())
    .sort((a, b) => (b.meta.dateiso || '').localeCompare(a.meta.dateiso || ''));

  const outDir = path.resolve(ROOT, board.outDir || '.');
  console.log('\n📰 Bảng tin: '+slug+'  ('+posts.length+' bài · '+fromDb+' từ database)');

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
async function main(){
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const boards = fs.readdirSync(CONTENT, { withFileTypes:true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  if (!boards.length){ console.log('Không tìm thấy bảng tin nào trong content/'); return; }
  const dbPosts = await fetchDbPosts();
  console.log('☁ Bài đã xuất bản từ database: ' + dbPosts.length);
  boards.forEach(slug => buildBoard(slug, template, dbPosts));
  console.log('\n✅ Xong. Đã sinh HTML tĩnh cho '+boards.length+' bảng tin.\n');
}
main();
