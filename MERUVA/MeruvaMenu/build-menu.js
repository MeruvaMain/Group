/* ════════════════════════════════════════════════════════════════
   MERUVA MENU · BUILD  (thuần Node — không cần cài thư viện)
   ────────────────────────────────────────────────────────────────
   Chạy:   node build-menu.js
   Sinh ra:  ../meruva-menu.js   →  window.MERUVA_MENU

   2 CHẾ ĐỘ NGUỒN DỮ LIỆU (tự động chọn):
     • Có biến môi trường AIRTABLE_TOKEN + AIRTABLE_BASE → lấy từ Airtable
     • Không có                                          → lấy từ menu-data.json (demo offline)

   Nhờ vậy bạn chạy thử được NGAY mà chưa cần tài khoản Airtable. Khi nào
   sẵn sàng, chỉ cần đặt 2 biến môi trường — không phải sửa code.
   ════════════════════════════════════════════════════════════════ */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const LOCAL    = path.join(ROOT, 'menu-data.json');
const OUT      = path.resolve(ROOT, '..', 'meruva-menu.js'); // cạnh meruva_lang.js
const LANGS    = ['vi', 'en', 'ja'];

/* ── Airtable config (đọc từ biến môi trường) ──────────────── */
const AT_TOKEN = process.env.AIRTABLE_TOKEN || '';
const AT_BASE  = process.env.AIRTABLE_BASE  || '';
const AT_TABLE = process.env.AIRTABLE_TABLE || 'Menu';

/* ── chuẩn hoá 1 dòng (dù từ Airtable hay JSON) về cùng 1 dạng ─ */
function normalizeRow(raw) {
  // gom key về chữ thường để không phân biệt Name_vi / name_vi
  const f = {};
  Object.keys(raw).forEach(k => { f[k.toLowerCase()] = raw[k]; });

  const pick = (prefix) => {
    const o = {};
    LANGS.forEach(l => { o[l] = (f[prefix + '_' + l] || '').toString().trim(); });
    return o;
  };

  return {
    brand:  (f.brand || '').toString().trim().toLowerCase(),
    order:  Number(f.order || 0),
    active: f.active === false ? false : true, // mặc định hiện
    name:   pick('name'),
    note:   pick('note'),
    price:  pick('price')
  };
}

/* ── lấy dữ liệu từ Airtable (có phân trang) ───────────────── */
async function fetchAirtable() {
  const base = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`;
  const headers = { Authorization: `Bearer ${AT_TOKEN}` };
  let records = [], offset;
  do {
    const url = base + '?pageSize=100' + (offset ? '&offset=' + offset : '');
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = await res.json();
    records = records.concat(data.records.map(r => r.fields));
    offset = data.offset;
  } while (offset);
  return records;
}

/* ── lấy dữ liệu từ file JSON local ────────────────────────── */
function readLocal() {
  const data = JSON.parse(fs.readFileSync(LOCAL, 'utf8'));
  return data.menu || [];
}

/* ── biến danh sách dòng → { brand: { vi:[...], en:[...], ja:[...] } } ─ */
function buildMenu(rows) {
  const norm = rows.map(normalizeRow)
    .filter(r => r.active && r.brand)
    .sort((a, b) => a.order - b.order);

  const menu = {};
  norm.forEach(r => {
    menu[r.brand] = menu[r.brand] || { vi: [], en: [], ja: [] };
    LANGS.forEach(l => {
      menu[r.brand][l].push({
        name:  r.name[l]  || r.name.vi,   // thiếu bản dịch → tạm dùng tiếng Việt
        note:  r.note[l]  || r.note.vi,
        price: r.price[l] || r.price.vi
      });
    });
  });
  return menu;
}

/* ── chạy ──────────────────────────────────────────────────── */
async function main() {
  let rows, source;
  if (AT_TOKEN && AT_BASE) {
    source = `Airtable (base ${AT_BASE} · bảng "${AT_TABLE}")`;
    rows = await fetchAirtable();
  } else {
    source = 'menu-data.json (demo offline)';
    rows = readLocal();
  }

  const menu = buildMenu(rows);
  const brands = Object.keys(menu);

  const header =
    '/* ════════════════════════════════════════════════════════\n' +
    '   FILE TỰ ĐỘNG SINH RA — ĐỪNG SỬA TAY.\n' +
    '   Nguồn: ' + source + '\n' +
    '   Sinh lúc: ' + new Date().toISOString() + '\n' +
    '   Sửa nội dung tại Airtable (hoặc menu-data.json) rồi chạy:\n' +
    '       node MeruvaMenu/build-menu.js\n' +
    '   ════════════════════════════════════════════════════════ */\n';

  const body = 'window.MERUVA_MENU = ' + JSON.stringify(menu, null, 2) + ';\n';
  fs.writeFileSync(OUT, header + body, 'utf8');

  console.log('\n☕ Nguồn dữ liệu: ' + source);
  brands.forEach(b => console.log('   ✓ ' + b + ' — ' + menu[b].vi.length + ' sản phẩm'));
  console.log('\n✅ Đã ghi: ' + path.relative(path.join(ROOT, '..'), OUT) + '\n');
}

main().catch(err => { console.error('\n❌ Lỗi:', err.message, '\n'); process.exit(1); });
