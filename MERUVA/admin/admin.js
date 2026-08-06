/* ═══════════════════════════════════════════════════════════
   MERUVA · Trung tâm điều hành — admin.js (V2 · Supabase)
   Dữ liệu thật nằm trên Supabase. `state` chỉ là bộ nhớ tạm
   trong trình duyệt để vẽ giao diện — mọi thao tác đều ghi
   thẳng xuống Supabase trước, rồi mới cập nhật state + vẽ lại.
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── cấu hình Supabase (an toàn để lộ — đây là publishable key) ── */
const SUPABASE_URL = 'https://ztqyojsyafhpkmhrawtd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fDQp-ygVduxkor0ocVqQLQ_flK6v-qv';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── nội dung tĩnh (không nằm trong DB) ── */
const SYSTEM_PROGRESS = [
  {name:'Giao diện quản trị',                   pct:95, note:'Nối Supabase, đăng nhập & lưu dữ liệu thật. Đã gộp vào repo MERUVA (thư mục admin/)'},
  {name:'Tin tức: soạn & đăng bài',             pct:95, note:'Đăng thẳng vào database — bài lên web ở lần build kế. Nút tải .post vẫn giữ làm đường lui'},
  {name:'Database Supabase',                    pct:100,note:'Đã kết nối, đăng nhập thành công, phân quyền (RLS) hoạt động đúng'},
  {name:'Email thông báo lịch hẹn',             pct:100,note:'Đã chạy thật — Resend + Edge Function + Webhook, test thành công'},
  {name:'Web chính: đặt lịch + phòng trống',    pct:80, note:'Form trang chủ & MeruvaStay ghi/đọc thẳng Supabase. Trang Service đã gỡ khỏi site'},
  {name:'Nối lại các mục đứt dây',              pct:40, note:'Kitchen đã gộp khớp web. Còn Đánh giá + Lịch mở khung chưa có trang nào đọc'},
  {name:'Deploy admin lên meruva.cloud',        pct:0,  note:'Chưa làm — admin hiện chỉ chạy cục bộ trên một máy'},
];

const CLAUDE_TODO = [
  {k:'supabase', tx:'Tạo tài khoản supabase.com — đặt tên project là "meruva"', sub:'Đã xong'},
  {k:'keys',     tx:'Gửi Claude: Project URL + publishable key',                sub:'Đã xong'},
  {k:'authuser', tx:'Tạo tài khoản đăng nhập admin (Supabase → Authentication → Add user)', sub:'Đã xong — đăng nhập thành công bằng meruva.main@gmail.com'},
  {k:'mail',     tx:'Tạo tài khoản Resend + Edge Function + Webhook báo lịch hẹn mới', sub:'Đã xong — test thành công, mail chạy tốt'},
  {k:'netlify',  tx:'Netlify: tạo site mới cho trang admin này',                 sub:'Cùng repo MERUVA, chỉ đổi publish thành "admin" — Claude đưa checklist khi bạn sẵn sàng'},
  {k:'dns',      tx:'Trỏ tên miền meruva.cloud về site admin',                   sub:'Làm một lần, cùng lúc với bước trên'},
  {k:'signup',   tx:'Supabase → Authentication → tắt "Allow new users to sign up"', sub:'Quan trọng: RLS cho MỌI tài khoản đăng nhập quyền ghi, nên còn mở đăng ký là người lạ tự tạo tài khoản thành admin được'},
];

const CHANGELOG = [
  {d:'05·08·2026', x:'Tin tức đăng thẳng vào database: nút "Đăng bài" đặt cờ published, thêm trường ảnh đại diện + mô tả ảnh + bảng tin. build.js đã đọc sẵn bài published nên bài lên web ở lần build kế tiếp.'},
  {d:'05·08·2026', x:'Gộp Bakery + Coffee thành một mục Kitchen cho khớp trang MeruvaKitchen trên web. Database vẫn giữ cột brand tách đôi, tách lại lúc nào cũng được.'},
  {d:'05·08·2026', x:'Gỡ banner "V1 · nối database Supabase" và sửa lại 3 mảng tĩnh của trang Tổng quan — trước đó vẫn báo hiện trạng ngày 03·07, sai một tháng.'},
  {d:'05·08·2026', x:'Gộp repo adminMERRUVA vào MERUVA (thư mục admin/). Lý do: hai repo cùng ăn một database nhưng git không báo lệch, nên admin trôi khỏi web suốt tháng 7. Netlify chặn /admin/ bằng rule 404.'},
  {d:'04·08·2026', x:'Website hoàn tất bản redesign v2: trang chủ 3 ngôn ngữ, MeruvaKitchen thay Bakery + Coffee, gỡ trang Service, dựng hệ design token dùng chung.'},
  {d:'03·07·2026', x:'Dựng xong kênh báo lịch hẹn qua email: Resend + Edge Function (notify-appointment) + Database Webhook. Test end-to-end thành công.'},
  {d:'03·07·2026', x:'V2 — Nối Supabase thật: đăng nhập bằng tài khoản, dữ liệu lưu database dùng chung mọi máy, RLS khóa quyền ghi cho admin.'},
  {d:'03·07·2026', x:'V1 — Dựng khung 7 mục: Tổng quan · Stay · Service · Bakery · Coffee · Tin tức · Góc Claude. Dữ liệu localStorage.'},
];

const ACCENT_BRAND = {
  coffee:'MERUVA Coffee', bakery:'MERUVA Bakery', stay:'MERUVA Stay',
  service:'MERUVA Service', '3d':'MERUVA 3D', card:'MERUVA Card', promo:'MERUVA'
};

/* ── state: bộ nhớ tạm để vẽ giao diện, nạp từ Supabase khi vào app ── */
let state = {
  rooms:[], cal:{}, appts:[], reviews:[],
  menu:{coffee:[], bakery:[]},
  posts:[], todo:{}, notes:'', act:[]
};

/* ── helpers ── */
const $ = id => document.getElementById(id);
function esc(s){ return String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function slugify(s){
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
}
function isoWeek(d){
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return Math.ceil(((t - y0)/864e5 + 1)/7);
}
function fmtAct(t){
  const d = new Date(t);
  const p = n => String(n).padStart(2,'0');
  return p(d.getDate()) + '·' + p(d.getMonth()+1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function alertErr(err, ctx){
  console.error(ctx, err);
  alert('Có lỗi khi ' + ctx + ': ' + (err && err.message ? err.message : 'không rõ nguyên nhân') +
    '\nKiểm tra lại kết nối mạng hoặc báo Claude nếu lặp lại.');
}
async function logAct(x){
  state.act.unshift({t: Date.now(), x});
  if(state.act.length > 40) state.act.length = 40;
  renderOverviewIfOn();
  const {error} = await sb.from('activity_log').insert({text:x});
  if(error) console.error('log activity', error);
}

/* ── điều hướng ──
   Toàn bộ nội dung nằm trên MỘT trang, không còn ẩn/hiện theo mục.
   Các nút trên thanh chỉ cuộn tới đúng khối, và vì mọi khối luôn hiển
   thị nên phải vẽ hết một lượt sau khi nạp dữ liệu.                    */
const VIEWS = ['news','service','stay','reviews','kitchen','claude'];
function nav(v){
  const el = $('sec-' + v);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}
function renderAll(){
  updateNavBadge();
  renderOverview();
  renderRooms();
  renderAppts();
  renderCal();
  renderReviews();
  renderKitchen();
  renderPosts();
  renderClaude();
  layoutBoard();
}

/* ── xếp thẻ vào cột ──────────────────────────────────────────────
   Giữ nguyên thứ tự ưu tiên trong HTML, nhưng mỗi thẻ được thả vào cột
   đang THẤP NHẤT tại thời điểm đó. Nhờ vậy đáy các cột gần bằng nhau,
   không còn khoảng trống hụt như khi để CSS tự chia.                 */
let boardPanels = null;
function colCount(){
  const w = window.innerWidth;
  if(w >= 1600) return 4;
  if(w >= 1150) return 3;
  if(w >= 820)  return 2;
  return 1;
}
function layoutBoard(){
  const box = $('cols'); if(!box) return;
  if(!boardPanels) boardPanels = Array.from(box.querySelectorAll(':scope > .panel, :scope > .col > .panel'));

  const n = colCount();
  const cols = [];
  box.innerHTML = '';
  for(let i = 0; i < n; i++){
    const c = document.createElement('div');
    c.className = 'col';
    box.appendChild(c);
    cols.push(c);
  }
  boardPanels.forEach(p => {
    let min = cols[0];
    for(const c of cols) if(c.offsetHeight < min.offsetHeight) min = c;
    min.appendChild(p);
  });
}
/* Gộp nhiều lần gọi liên tiếp (renderAll gọi 8 hàm vẽ) thành một lần xếp */
let relayoutPending = false;
function relayout(){
  if(relayoutPending) return;
  relayoutPending = true;
  requestAnimationFrame(() => { relayoutPending = false; layoutBoard(); });
}
window.addEventListener('resize', relayout);
function updateNavBadge(){
  const n = state.appts.filter(a => a.status === 'pending').length;
  $('svc-badge').textContent = n > 0 ? n : '';
  const r = state.reviews.filter(x => x.status === 'pending').length;
  $('rv-badge').textContent = r > 0 ? r : '';
}

/* ═══════ NẠP TOÀN BỘ DỮ LIỆU TỪ SUPABASE ═══════ */
async function loadAll(){
  const [roomsQ, calQ, apptQ, menuQ, postsQ, actQ, todoQ, notesQ, rvQ] = await Promise.all([
    sb.from('rooms').select('*').order('sort_order'),
    sb.from('calendar_days').select('*'),
    sb.from('appointments').select('*').order('appt_date').order('appt_time'),
    sb.from('menu_items').select('*').order('sort_order'),
    sb.from('posts').select('*').order('created_at', {ascending:false}),
    sb.from('activity_log').select('*').order('ts', {ascending:false}).limit(40),
    sb.from('admin_todo').select('*'),
    sb.from('admin_notes').select('*').eq('id',1).maybeSingle(),
    sb.from('reviews').select('*').order('created_at', {ascending:false}),
  ]);

  state.rooms = roomsQ.data || [];
  state.reviews = rvQ.data || [];
  if(rvQ.error) console.warn('Bảng reviews chưa có — chạy supabase_reviews.sql trong SQL Editor.', rvQ.error);

  state.cal = {};
  (calQ.data || []).forEach(r => {
    if(!state.cal[r.month_key]) state.cal[r.month_key] = {};
    state.cal[r.month_key][r.day] = r.status;
  });

  state.appts = (apptQ.data || []).map(a => ({
    id:a.id, name:a.name, phone:a.phone, svc:a.service,
    date:a.appt_date, time:a.appt_time, note:a.note, status:a.status
  }));

  state.menu = {coffee:[], bakery:[]};
  (menuQ.data || []).forEach(m => {
    state.menu[m.brand].push({id:m.id, name:m.name, note:m.note || '', price:m.price, active:m.active});
  });

  state.posts = (postsQ.data || []).map(p => ({
    id:p.id, slug:p.slug, accent:p.accent, dateISO:p.date_iso, brand:p.brand,
    brandSub:p.brand_sub || '', tag:p.tag || '', link:p.link || '',
    published: !!p.published, board: p.board || 'tin-tong-hop',
    imageUrl: p.image_url || '', imageAlt: p.image_alt || '',
    vi:p.vi || {title:'',excerpt:'',body:''}, en:p.en || {title:'',excerpt:'',body:''}, ja:p.ja || {title:'',excerpt:'',body:''}
  }));
  if(postsQ.error) console.warn('Bảng posts thiếu cột published/board/image_url — chạy supabase_news_publish.sql trong SQL Editor.', postsQ.error);

  state.act = (actQ.data || []).map(a => ({t: new Date(a.ts).getTime(), x:a.text}));

  state.todo = {};
  (todoQ.data || []).forEach(t => state.todo[t.key] = t.done);

  state.notes = (notesQ.data && notesQ.data.notes) || '';
}

/* ═══════ TỔNG QUAN ═══════ */
function renderOverview(){
  const pending = state.appts.filter(a => a.status === 'pending').length;
  const livePosts = state.posts.filter(p => p.published).length;
  $('o-pend').textContent  = pending;
  $('o-pend').className    = 'n ' + (pending > 0 ? 'a' : 'g');
  $('o-posts').textContent = livePosts;
  $('o-drafts').textContent = state.posts.length - livePosts;

  $('o-prog').innerHTML = SYSTEM_PROGRESS.map(p =>
    '<div class="prog-row">' +
      '<div><div class="pn">' + esc(p.name) + '</div><div class="pnote">' + esc(p.note) + '</div></div>' +
      '<div class="prog-bar' + (p.pct === 0 ? ' zero' : '') + '"><i style="width:' + p.pct + '%"></i></div>' +
      '<div class="prog-pct">' + p.pct + '%</div>' +
    '</div>').join('');

  $('o-act').innerHTML = state.act.length
    ? state.act.slice(0,12).map(a =>
        '<li><span class="at">' + fmtAct(a.t) + '</span><span class="ax">' + esc(a.x) + '</span></li>').join('')
    : '<li class="empty">Chưa có thao tác nào. Mọi thay đổi (bật/tắt phòng, lịch hẹn, menu…) sẽ hiện ở đây.</li>';
}
/* Mọi khối luôn hiển thị nên không còn phải kiểm tra "đang mở hay không" */
function renderOverviewIfOn(){ renderOverview(); }

/* ═══════ STAY ═══════ */
function renderRooms(){
  const box = $('rooms'); box.innerHTML = '';
  const floors = [...new Set(state.rooms.map(r => r.floor))];
  floors.forEach(fl => {
    const wrap = document.createElement('div'); wrap.className = 'floor-row';
    wrap.innerHTML = '<div class="floor-label">' + esc(fl) + '</div>';
    const grid = document.createElement('div'); grid.className = 'room-grid';
    state.rooms.filter(r => r.floor === fl).forEach(r => {
      const mod = document.createElement('div');
      mod.className = 'room-mod ' + (r.is_free ? 'free' : 'occupied');
      mod.innerHTML =
        '<div class="top"><div class="rid">' + esc(r.label || r.id) + '</div><div class="area">' + r.area + 'm²</div></div>' +
        '<div class="room-price"><input value="' + esc(r.price || '') + '" placeholder="Giá / tháng"' +
          ' onchange="roomPrice(\'' + r.id + '\', this.value)"></div>' +
        '<div class="bot">' +
          '<span class="stxt ' + (r.is_free ? 'free' : 'full') + '">' + (r.is_free ? 'Còn trống' : 'Đã thuê') + '</span>' +
          '<label class="switch"><input type="checkbox" ' + (r.is_free ? 'checked' : '') +
            ' onchange="toggleRoom(\'' + r.id + '\', this.checked)"><span class="slider"></span></label>' +
        '</div>';
      grid.appendChild(mod);
    });
    wrap.appendChild(grid); box.appendChild(wrap);
  });
  const free = state.rooms.filter(r => r.is_free).length;
  $('s-free').textContent = free;
  $('s-full').textContent = state.rooms.length - free;
  relayout();
}
async function roomPrice(id, val){
  const r = state.rooms.find(x => x.id === id); if(!r) return;
  const price = val.trim(); const prev = r.price;
  r.price = price;
  const {error} = await sb.from('rooms').update({price, updated_at:new Date().toISOString()}).eq('id', id);
  if(error){ r.price = prev; renderRooms(); alertErr(error, 'đổi giá phòng'); return; }
  logAct('Stay · đổi giá ' + (id === 'Trệt' ? 'mặt bằng trệt' : 'phòng ' + id) + ' → ' + (price || '(trống)'));
}
async function toggleRoom(id, val){
  const r = state.rooms.find(x => x.id === id); if(!r) return;
  const prev = r.is_free;
  r.is_free = val; renderRooms(); // optimistic
  const {error} = await sb.from('rooms').update({is_free:val, updated_at:new Date().toISOString()}).eq('id', id);
  if(error){ r.is_free = prev; renderRooms(); alertErr(error, 'cập nhật phòng'); return; }
  logAct('Stay · ' + (id === 'Trệt' ? 'Mặt bằng trệt' : 'Phòng ' + id) + ' → ' + (val ? 'còn trống' : 'đã thuê'));
}

/* ═══════ SERVICE — lịch hẹn ═══════ */
async function addAppt(){
  const name = $('a-name').value.trim(), phone = $('a-phone').value.trim();
  if(!name || !phone){ alert('Cần ít nhất tên và số điện thoại.'); return; }
  const row = {
    name, phone, service: $('a-svc').value,
    appt_date: $('a-date').value || new Date().toISOString().slice(0,10),
    appt_time: $('a-time').value || '09:00',
    note: $('a-note').value.trim(), status:'pending'
  };
  const {data, error} = await sb.from('appointments').insert(row).select().single();
  if(error){ alertErr(error, 'thêm lịch hẹn'); return; }
  state.appts.push({id:data.id, name:data.name, phone:data.phone, svc:data.service, date:data.appt_date, time:data.appt_time, note:data.note, status:data.status});
  logAct('Service · thêm lịch hẹn: ' + name + ' (' + row.service + ')');
  ['a-name','a-phone','a-note'].forEach(i => $(i).value = '');
  renderAppts(); updateNavBadge();
}
async function apptStatus(id, st){
  const a = state.appts.find(x => x.id === id); if(!a) return;
  const prev = a.status;
  a.status = st; renderAppts(); updateNavBadge(); // optimistic
  const {error} = await sb.from('appointments').update({status:st}).eq('id', id);
  if(error){ a.status = prev; renderAppts(); updateNavBadge(); alertErr(error, 'cập nhật lịch hẹn'); return; }
  const vn = {confirmed:'xác nhận', done:'hoàn thành', cancelled:'hủy'};
  logAct('Service · ' + (vn[st] || st) + ' lịch hẹn của ' + a.name);
}
async function apptDel(id){
  const a = state.appts.find(x => x.id === id); if(!a) return;
  if(!confirm('Xóa hẳn lịch hẹn của "' + a.name + '"?')) return;
  const {error} = await sb.from('appointments').delete().eq('id', id);
  if(error){ alertErr(error, 'xóa lịch hẹn'); return; }
  state.appts = state.appts.filter(x => x.id !== id);
  logAct('Service · xóa lịch hẹn của ' + a.name);
  renderAppts(); updateNavBadge();
}
function renderAppts(){
  const order = {pending:0, confirmed:1, done:2, cancelled:3};
  const list = [...state.appts].sort((a,b) =>
    (order[a.status] - order[b.status]) || (a.date + a.time).localeCompare(b.date + b.time));
  const stt = {pending:'Chờ duyệt', confirmed:'Đã xác nhận', done:'Hoàn thành', cancelled:'Đã hủy'};
  $('appt-count').textContent = state.appts.filter(a => a.status === 'pending').length + ' chờ duyệt · ' + state.appts.length + ' tổng';
  $('appt-list').innerHTML = list.length ? list.map(a => {
    const [y,m,d] = (a.date || '').split('-');
    let ops = '';
    if(a.status === 'pending')   ops = '<button class="mini ok" onclick="apptStatus(\'' + a.id + '\',\'confirmed\')">Xác nhận</button><button class="mini no" onclick="apptStatus(\'' + a.id + '\',\'cancelled\')">Hủy</button>';
    if(a.status === 'confirmed') ops = '<button class="mini ok" onclick="apptStatus(\'' + a.id + '\',\'done\')">Hoàn thành</button><button class="mini no" onclick="apptStatus(\'' + a.id + '\',\'cancelled\')">Hủy</button>';
    if(a.status === 'done' || a.status === 'cancelled') ops = '<button class="mini no" onclick="apptDel(\'' + a.id + '\')">Xóa</button>';
    return '<div class="appt">' +
      '<div class="when"><div class="d">' + (d || '--') + '/' + (m || '--') + '</div><div class="t">' + esc(a.time) + '</div></div>' +
      '<div class="who"><div class="nm">' + esc(a.name) + '</div><div class="ph">' + esc(a.phone) + '</div>' +
        '<div class="sv">' + esc(a.svc) + '</div>' +
        (a.note ? '<div class="nt">“' + esc(a.note) + '”</div>' : '') + '</div>' +
      '<div class="ops"><span class="pill ' + a.status + '">' + stt[a.status] + '</span><div class="mini-ops">' + ops + '</div></div>' +
    '</div>';
  }).join('') : '<div class="empty">Chưa có lịch hẹn. Khi nối web chính, khách đặt lịch sẽ tự hiện ở đây kèm email báo về hộp thư của bạn.</div>';
  relayout();
}

/* ═══════ SERVICE — lịch mở khung ═══════ */
let calY, calM;
function initCal(){ const n = new Date(); calY = n.getFullYear(); calM = n.getMonth(); }
function calShift(d){
  calM += d;
  if(calM < 0){ calM = 11; calY--; }
  if(calM > 11){ calM = 0; calY++; }
  renderCal();
}
function calKey(){ return calY + '-' + String(calM + 1).padStart(2,'0'); }
function dayState(d){ return (state.cal[calKey()] || {})[d] || 'free'; }
async function cycleDay(d){
  const next = {free:'near', near:'full', full:'free'};
  const key = calKey();
  if(!state.cal[key]) state.cal[key] = {};
  const val = next[dayState(d)];
  state.cal[key][d] = val; renderCal(); // optimistic
  const {error} = await sb.from('calendar_days').upsert({month_key:key, day:d, status:val});
  if(error) alertErr(error, 'cập nhật lịch');
}
function renderCal(){
  const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  $('cal-month').textContent = MONTHS[calM] + ' · ' + calY;
  const first = new Date(calY, calM, 1);
  const nDays = new Date(calY, calM + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const today = new Date();
  const TAG = {free:'Trống', near:'Sắp kín', full:'Kín'};
  let html = ['T2','T3','T4','T5','T6','T7','CN'].map(d => '<div class="cal-dow">' + d + '</div>').join('');
  for(let i = 0; i < offset; i++) html += '<div class="cal-day empty"></div>';
  for(let d = 1; d <= nDays; d++){
    const st = dayState(d);
    const isToday = d === today.getDate() && calM === today.getMonth() && calY === today.getFullYear();
    html += '<div class="cal-day ' + st + (isToday ? ' today' : '') + '" onclick="cycleDay(' + d + ')">' +
      d + '<span class="tag">' + TAG[st] + '</span></div>';
  }
  $('cal-grid').innerHTML = html;
  relayout();
}

/* ═══════ ĐÁNH GIÁ KHÁCH HÀNG ═══════ */
function rvStars(n){ let s=''; for(let i=0;i<(n||5);i++) s+='★'; return s; }
function renderReviews(){
  const pending  = state.reviews.filter(r => r.status === 'pending').length;
  const approved = state.reviews.filter(r => r.status === 'approved').length;
  $('rv-pending').textContent  = pending;
  $('rv-approved').textContent = approved;
  $('rv-count').textContent    = pending + ' chờ duyệt · ' + approved + ' đang hiển thị';

  const order = {pending:0, approved:1, hidden:2};
  const list = [...state.reviews].sort((a,b) =>
    (order[a.status] - order[b.status]) || (a.created_at < b.created_at ? 1 : -1));
  const stt = {pending:'Chờ duyệt', approved:'Đang hiển thị', hidden:'Đã ẩn'};

  $('rv-list').innerHTML = list.length ? list.map(r => {
    const d = new Date(r.created_at);
    const p = n => String(n).padStart(2,'0');
    let ops = '';
    if(r.status === 'pending')  ops = '<button class="mini ok" onclick="reviewStatus(\'' + r.id + '\',\'approved\')">Duyệt — cho hiển thị</button><button class="mini" onclick="reviewStatus(\'' + r.id + '\',\'hidden\')">Ẩn</button>';
    if(r.status === 'approved') ops = '<button class="mini" onclick="reviewStatus(\'' + r.id + '\',\'hidden\')">Ẩn khỏi web</button>';
    if(r.status === 'hidden')   ops = '<button class="mini ok" onclick="reviewStatus(\'' + r.id + '\',\'approved\')">Hiển thị lại</button>';
    ops += '<button class="mini no" onclick="reviewDel(\'' + r.id + '\')">Xóa</button>';
    return '<div class="appt">' +
      '<div class="when"><div class="d">' + p(d.getDate()) + '/' + p(d.getMonth()+1) + '</div><div class="t">' + p(d.getHours()) + ':' + p(d.getMinutes()) + '</div></div>' +
      '<div class="who"><div class="nm">' + esc(r.name) + ' <span style="color:var(--silver-soft);font-weight:400;font-size:.7rem">· ' + (r.gender === 'female' ? 'Nữ' : 'Nam') + '</span></div>' +
        (r.role ? '<div class="sv">' + esc(r.role) + '</div>' : '') +
        '<div class="rv-stars-admin">' + rvStars(r.rating) + '</div>' +
        '<div class="rv-content">“' + esc(r.content) + '”</div></div>' +
      '<div class="ops"><span class="pill ' + r.status + '">' + stt[r.status] + '</span><div class="mini-ops">' + ops + '</div></div>' +
    '</div>';
  }).join('') : '<div class="empty">Chưa có đánh giá nào. Khách gửi từ trang Service (mục "Chia sẻ trải nghiệm của bạn") sẽ hiện ở đây chờ duyệt.</div>';
  relayout();
}
async function reviewStatus(id, st){
  const r = state.reviews.find(x => x.id === id); if(!r) return;
  const prev = r.status;
  r.status = st; renderReviews(); updateNavBadge(); // optimistic
  const {error} = await sb.from('reviews').update({status:st}).eq('id', id);
  if(error){ r.status = prev; renderReviews(); updateNavBadge(); alertErr(error, 'cập nhật đánh giá'); return; }
  const vn = {approved:'duyệt', hidden:'ẩn'};
  logAct('Đánh giá · ' + (vn[st] || st) + ' đánh giá của ' + r.name);
}
async function reviewDel(id){
  const r = state.reviews.find(x => x.id === id); if(!r) return;
  if(!confirm('Xóa hẳn đánh giá của "' + r.name + '"?')) return;
  const {error} = await sb.from('reviews').delete().eq('id', id);
  if(error){ alertErr(error, 'xóa đánh giá'); return; }
  state.reviews = state.reviews.filter(x => x.id !== id);
  logAct('Đánh giá · xóa đánh giá của ' + r.name);
  renderReviews(); updateNavBadge();
}
async function reviewAdd(){
  const name = $('rv-name').value.trim(), content = $('rv-content').value.trim();
  if(!name || !content){ alert('Cần ít nhất tên khách và nội dung.'); return; }
  const row = {
    name, content,
    gender: $('rv-gender').value === 'female' ? 'female' : 'male',
    role: $('rv-role').value.trim() || null,
    rating: parseInt($('rv-rating').value) || 5,
    status: 'approved'
  };
  const {data, error} = await sb.from('reviews').insert(row).select().single();
  if(error){ alertErr(error, 'thêm đánh giá'); return; }
  state.reviews.unshift(data);
  logAct('Đánh giá · thêm thủ công đánh giá của ' + name);
  ['rv-name','rv-role','rv-content'].forEach(i => $(i).value = '');
  renderReviews(); updateNavBadge();
}

/* ═══════ KITCHEN — menu bánh + cà phê ═══════
   Web đã gộp Bakery và Coffee thành một trang (MeruvaKitchen) nên admin
   cũng gộp về một mục. Database vẫn giữ cột brand tách đôi — tách lại
   thành hai trang lúc nào cũng được mà không phải chuyển dữ liệu.        */
function renderKitchen(){
  const all = state.menu.coffee.concat(state.menu.bakery);
  const on  = all.filter(m => m.active).length;
  $('kitchen-on').textContent    = on;
  $('kitchen-off').textContent   = all.length - on;
  renderMenu('coffee');
  renderMenu('bakery');
  relayout();
}
function renderMenu(brand){
  const items = state.menu[brand];
  const on = items.filter(m => m.active).length;
  $(brand + '-badge').textContent = items.length ? on + '/' + items.length + ' đang bán' : 'chưa có món';
  $(brand + '-list').innerHTML = items.length ? items.map(m =>
    '<div class="menu-row' + (m.active ? '' : ' off') + '">' +
      '<div class="mi-main"><div class="mi-name">' + esc(m.name) + '</div>' +
        (m.note ? '<div class="mi-note">' + esc(m.note) + '</div>' : '') + '</div>' +
      '<div class="mi-price"><input value="' + esc(m.price) + '" onchange="menuPrice(\'' + brand + '\',\'' + m.id + '\', this.value)"></div>' +
      '<div class="mi-stt ' + (m.active ? 'on' : 'off') + '">' + (m.active ? 'Đang bán' : 'Hết / ẩn') + '</div>' +
      '<label class="switch sm"><input type="checkbox" ' + (m.active ? 'checked' : '') +
        ' onchange="menuToggle(\'' + brand + '\',\'' + m.id + '\', this.checked)"><span class="slider"></span></label>' +
      '<button class="mi-del" title="Xóa món" onclick="menuDel(\'' + brand + '\',\'' + m.id + '\')">✕</button>' +
    '</div>').join('') : '<div class="empty">Chưa có món nào — thêm ở form bên dưới.</div>';
}
function brandLabel(brand){ return brand === 'coffee' ? 'Coffee' : 'Bakery'; }
async function menuToggle(brand, id, val){
  const m = state.menu[brand].find(x => x.id === id); if(!m) return;
  const prev = m.active;
  m.active = val; renderKitchen();
  const {error} = await sb.from('menu_items').update({active:val}).eq('id', id);
  if(error){ m.active = prev; renderKitchen(); alertErr(error, 'cập nhật món'); return; }
  logAct(brandLabel(brand) + ' · "' + m.name + '" → ' + (val ? 'đang bán' : 'hết hàng / ẩn'));
}
async function menuPrice(brand, id, val){
  const m = state.menu[brand].find(x => x.id === id); if(!m) return;
  const price = val.trim(); const prev = m.price;
  m.price = price;
  const {error} = await sb.from('menu_items').update({price}).eq('id', id);
  if(error){ m.price = prev; renderKitchen(); alertErr(error, 'đổi giá'); return; }
  logAct(brandLabel(brand) + ' · đổi giá "' + m.name + '" → ' + price);
  renderKitchen();
}
async function menuDel(brand, id){
  const m = state.menu[brand].find(x => x.id === id); if(!m) return;
  if(!confirm('Xóa món "' + m.name + '"?')) return;
  const {error} = await sb.from('menu_items').delete().eq('id', id);
  if(error){ alertErr(error, 'xóa món'); return; }
  state.menu[brand] = state.menu[brand].filter(x => x.id !== id);
  logAct(brandLabel(brand) + ' · xóa món "' + m.name + '"');
  renderKitchen();
}
async function menuAdd(brand){
  const name = $(brand + '-new-name').value.trim();
  if(!name){ alert('Nhập tên món trước đã.'); return; }
  const row = {brand, name, note: $(brand + '-new-note').value.trim(), price: $(brand + '-new-price').value.trim() || '—', active:true};
  const {data, error} = await sb.from('menu_items').insert(row).select().single();
  if(error){ alertErr(error, 'thêm món'); return; }
  state.menu[brand].push({id:data.id, name:data.name, note:data.note || '', price:data.price, active:data.active});
  logAct(brandLabel(brand) + ' · thêm món "' + name + '"');
  [brand + '-new-name', brand + '-new-note', brand + '-new-price'].forEach(i => $(i).value = '');
  renderKitchen();
}

/* ═══════ TIN TỨC ═══════ */
let editingPost = null;

function newsAccentChange(){
  const acc = $('n-accent').value;
  if(!$('n-brand').value.trim() || Object.values(ACCENT_BRAND).includes($('n-brand').value.trim()))
    $('n-brand').value = ACCENT_BRAND[acc] || 'MERUVA';
}
function newsTitleInput(){
  if(!$('n-slug').dataset.touched) $('n-slug').value = slugify($('n-title').value);
}
function collectPost(){
  const title = $('n-title').value.trim();
  if(!title){ alert('Bài cần ít nhất tiêu đề tiếng Việt.'); return null; }
  const slug = $('n-slug').value.trim() || slugify(title);
  const dateISO = $('n-date').value || new Date().toISOString().slice(0,10);
  return {
    id: editingPost,
    slug, accent: $('n-accent').value, dateISO,
    brand: $('n-brand').value.trim() || 'MERUVA',
    brandSub: $('n-brandsub').value.trim(),
    tag: $('n-tag').value.trim(),
    link: $('n-link').value.trim(),
    board: $('n-board').value.trim() || 'tin-tong-hop',
    imageUrl: $('n-image').value.trim(),
    imageAlt: $('n-imagealt').value.trim(),
    vi: {title, excerpt: $('n-excerpt').value.trim(), body: $('n-body').value.trim()},
    en: {title: $('ne-title').value.trim(), excerpt: $('ne-excerpt').value.trim(), body: $('ne-body').value.trim()},
    ja: {title: $('nj-title').value.trim(), excerpt: $('nj-excerpt').value.trim(), body: $('nj-body').value.trim()},
  };
}
function postToRow(p){
  return {
    slug:p.slug, accent:p.accent, date_iso:p.dateISO, brand:p.brand,
    brand_sub:p.brandSub, tag:p.tag, link:p.link,
    board:p.board, image_url:p.imageUrl || null, image_alt:p.imageAlt || null,
    published:p.published, vi:p.vi, en:p.en, ja:p.ja
  };
}
/* publish = true  → đăng luôn (published = true, web thấy sau lần build kế)
   publish = false → lưu nháp, chỉ admin đăng nhập mới đọc được (RLS)   */
async function savePost(publish){
  const p = collectPost(); if(!p) return;
  p.published = !!publish;

  /* Ảnh vào cả thẻ og:image lẫn JSON-LD nên thiếu mô tả là hụt cả SEO
     lẫn trình đọc màn hình — chặn nhẹ ở đây thay vì để lọt lên web. */
  if(p.published && p.imageUrl && !p.imageAlt){
    if(!confirm('Bài có ảnh nhưng chưa có mô tả ảnh.\nĐăng mà thiếu mô tả sẽ hụt SEO và trình đọc màn hình.\n\nVẫn đăng?')) return;
  }

  const verb = p.published ? 'đăng' : 'lưu nháp';
  if(p.id){
    const {error} = await sb.from('posts').update(postToRow(p)).eq('id', p.id);
    if(error){ alertErr(error, 'cập nhật bài'); return; }
    const i = state.posts.findIndex(x => x.id === p.id);
    if(i >= 0) state.posts[i] = p;
    logAct('Tin tức · ' + verb + ' bài "' + p.vi.title + '"');
  }else{
    const {data, error} = await sb.from('posts').insert(postToRow(p)).select().single();
    if(error){ alertErr(error, 'lưu bài'); return; }
    p.id = data.id;
    state.posts.unshift(p);
    logAct('Tin tức · ' + verb + ' bài "' + p.vi.title + '"');
  }
  clearPostForm(); renderPosts(); renderOverviewIfOn();
}

/* Đăng / gỡ một bài đã lưu, không cần mở lại form soạn */
async function togglePublish(id, val){
  const p = state.posts.find(x => x.id === id); if(!p) return;
  if(!val && !confirm('Gỡ bài "' + p.vi.title + '" khỏi web?\nBài vẫn còn trong database, đăng lại lúc nào cũng được.')) return;
  const prev = p.published;
  p.published = val; renderPosts();
  const {error} = await sb.from('posts').update({published: val}).eq('id', id);
  if(error){ p.published = prev; renderPosts(); alertErr(error, val ? 'đăng bài' : 'gỡ bài'); return; }
  logAct('Tin tức · ' + (val ? 'đăng' : 'gỡ') + ' bài "' + p.vi.title + '"');
  renderOverviewIfOn();
}
function clearPostForm(){
  editingPost = null;
  ['n-title','n-slug','n-brandsub','n-tag','n-link','n-image','n-imagealt','n-excerpt','n-body',
   'ne-title','ne-excerpt','ne-body','nj-title','nj-excerpt','nj-body'].forEach(i => $(i).value = '');
  delete $('n-slug').dataset.touched;
  $('n-date').value = new Date().toISOString().slice(0,10);
  $('n-board').value = 'tin-tong-hop';
  $('n-accent').value = 'coffee'; newsAccentChange();
  $('post-pub-btn').textContent  = '✓ Đăng bài';
  $('post-save-btn').textContent = 'Lưu nháp';
}
function editPost(id){
  const p = state.posts.find(x => x.id === id); if(!p) return;
  editingPost = id;
  $('n-title').value = p.vi.title; $('n-slug').value = p.slug; $('n-slug').dataset.touched = '1';
  $('n-accent').value = p.accent; $('n-date').value = p.dateISO;
  $('n-brand').value = p.brand; $('n-brandsub').value = p.brandSub;
  $('n-tag').value = p.tag; $('n-link').value = p.link;
  $('n-board').value = p.board || 'tin-tong-hop';
  $('n-image').value = p.imageUrl || ''; $('n-imagealt').value = p.imageAlt || '';
  $('n-excerpt').value = p.vi.excerpt; $('n-body').value = p.vi.body;
  $('ne-title').value = p.en.title; $('ne-excerpt').value = p.en.excerpt; $('ne-body').value = p.en.body;
  $('nj-title').value = p.ja.title; $('nj-excerpt').value = p.ja.excerpt; $('nj-body').value = p.ja.body;
  $('post-pub-btn').textContent  = p.published ? '✓ Cập nhật bài đã đăng' : '✓ Đăng bài';
  $('post-save-btn').textContent = p.published ? 'Chuyển về nháp' : 'Cập nhật nháp';
  window.scrollTo(0,0);
}
async function delPost(id){
  const p = state.posts.find(x => x.id === id); if(!p) return;
  if(!confirm('Xóa hẳn bài "' + p.vi.title + '"' + (p.published ? ' (đang đăng trên web)' : ' (nháp)') + '?\nKhông khôi phục lại được.')) return;
  const {error} = await sb.from('posts').delete().eq('id', id);
  if(error){ alertErr(error, 'xóa bài'); return; }
  state.posts = state.posts.filter(x => x.id !== id);
  logAct('Tin tức · xóa nháp "' + p.vi.title + '"');
  if(editingPost === id) clearPostForm();
  renderPosts();
}
function buildPostFile(p){
  const d = new Date(p.dateISO + 'T00:00:00');
  const pad = n => String(n).padStart(2,'0');
  const dateDisp = pad(d.getDate()) + ' · ' + pad(d.getMonth()+1) + ' · ' + d.getFullYear();
  const week = 'Tuần ' + isoWeek(d);
  let out = '=== META ===\n' +
    'id: ' + p.slug + '\n' +
    'accent: ' + p.accent + '\n' +
    'date: ' + dateDisp + '\n' +
    'dateISO: ' + p.dateISO + '\n' +
    'brand: ' + p.brand + '\n' +
    (p.brandSub ? 'brandSub: ' + p.brandSub + '\n' : '') +
    'week: ' + week + '\n' +
    (p.tag ? 'tag: ' + p.tag + '\n' : '') +
    (p.link ? 'link: ' + p.link + '\n' : '') +
    (p.imageUrl ? 'image: ' + p.imageUrl + '\n' : '') +
    (p.imageAlt ? 'imageAlt: ' + p.imageAlt + '\n' : '') +
    '\n=== VI ===\n' +
    'TITLE: ' + p.vi.title + '\n' +
    'EXCERPT: ' + p.vi.excerpt + '\n' +
    'BODY:\n' + p.vi.body + '\n';
  if(p.en.title){
    out += '\n=== EN ===\nTITLE: ' + p.en.title + '\nEXCERPT: ' + p.en.excerpt +
      '\nWEEK: Week ' + isoWeek(d) + '\nBODY:\n' + p.en.body + '\n';
  }
  if(p.ja.title){
    out += '\n=== JA ===\nTITLE: ' + p.ja.title + '\nEXCERPT: ' + p.ja.excerpt +
      '\nWEEK: 第' + isoWeek(d) + '週\nBODY:\n' + p.ja.body + '\n';
  }
  return out;
}
function downloadPost(id){
  const p = id ? state.posts.find(x => x.id === id) : collectPost();
  if(!p) return;
  const blob = new Blob([buildPostFile(p)], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = p.slug + '.post';
  a.click();
  URL.revokeObjectURL(a.href);
  logAct('Tin tức · xuất file ' + p.slug + '.post');
}
function renderPosts(){
  const live = state.posts.filter(p => p.published).length;
  $('post-count').textContent = live + ' đã đăng · ' + (state.posts.length - live) + ' nháp';
  $('post-list').innerHTML = state.posts.length ? state.posts.map(p =>
    '<div class="post-row">' +
      '<div class="post-main"><div class="post-title">' + esc(p.vi.title) + '</div>' +
        '<div class="post-meta">' +
        '<span class="pub-dot ' + (p.published ? 'live' : 'draft') + '">' + (p.published ? 'Đã đăng' : 'Nháp') + '</span>' +
        '<span class="acc ' + esc(p.accent) + '">' + esc(p.accent) + '</span>' +
        '<span>' + esc(p.dateISO) + '</span><span>' + esc(p.brand) + '</span>' +
        (p.imageUrl ? '<span>🖼</span>' : '') +
        '<span>' + (p.en.title ? 'EN ✓' : 'EN —') + ' · ' + (p.ja.title ? 'JA ✓' : 'JA —') + '</span></div></div>' +
      '<div class="mini-ops">' +
        (p.published
          ? '<button class="mini no" onclick="togglePublish(\'' + p.id + '\', false)">Gỡ xuống</button>'
          : '<button class="mini ok" onclick="togglePublish(\'' + p.id + '\', true)">Đăng</button>') +
        '<button class="mini" onclick="editPost(\'' + p.id + '\')">Sửa</button>' +
        '<button class="mini" onclick="downloadPost(\'' + p.id + '\')">Tải .post</button>' +
        '<button class="mini no" onclick="delPost(\'' + p.id + '\')">Xóa</button>' +
      '</div>' +
    '</div>').join('') : '<div class="empty">Chưa có bài nào — soạn ở form bên trên.</div>';
  relayout();
}

/* ═══════ GÓC CLAUDE ═══════ */
function renderClaude(){
  $('todo-list').innerHTML = CLAUDE_TODO.map(t =>
    '<li class="' + (state.todo[t.k] ? 'done' : '') + '" onclick="toggleTodo(\'' + t.k + '\')">' +
      '<span class="cb">' + (state.todo[t.k] ? '✓' : '') + '</span>' +
      '<span><span class="tx">' + esc(t.tx) + '</span><div class="sub">' + esc(t.sub) + '</div></span>' +
    '</li>').join('');
  $('changelog').innerHTML = CHANGELOG.map(c =>
    '<li><span class="cd">' + c.d + '</span>' + esc(c.x) + '</li>').join('');
  $('todo-left').textContent = CLAUDE_TODO.filter(t => !state.todo[t.k]).length;
  $('claude-notes').value = state.notes || '';
}
async function toggleTodo(k){
  const prev = !!state.todo[k];
  state.todo[k] = !prev; renderClaude();
  const {error} = await sb.from('admin_todo').upsert({key:k, done: !prev});
  if(error){ state.todo[k] = prev; renderClaude(); alertErr(error, 'cập nhật việc cần làm'); }
}
async function saveNotes(){
  const notes = $('claude-notes').value;
  state.notes = notes;
  const {error} = await sb.from('admin_notes').upsert({id:1, notes});
  if(error){ alertErr(error, 'lưu ghi chú'); return; }
  $('notes-saved').textContent = 'Đã lưu ' + fmtAct(Date.now());
}

/* ═══════ ĐĂNG NHẬP ═══════ */
async function doLogin(e){
  e.preventDefault();
  $('l-err').textContent = '';
  const email = $('l-email').value.trim();
  const password = $('l-pass').value;
  const {error} = await sb.auth.signInWithPassword({email, password});
  if(error){ $('l-err').textContent = 'Sai email hoặc mật khẩu.'; return; }
  await enterApp();
}
function doLogout(){ sb.auth.signOut(); }
function showLogin(){
  $('login-view').style.display = 'flex';
  $('app-view').style.display = 'none';
}
async function enterApp(){
  const {data:{session}} = await sb.auth.getSession();
  $('who-email').textContent = session ? session.user.email : '';
  $('login-view').style.display = 'none';
  $('app-view').style.display = 'block';
  await loadAll();
  renderAll();
}

/* ═══════ khởi động ═══════ */
document.addEventListener('DOMContentLoaded', async () => {
  VIEWS.forEach(v => $('nav-' + v).addEventListener('click', () => nav(v)));
  initCal();
  $('n-date').value = new Date().toISOString().slice(0,10);
  newsAccentChange();
  $('n-slug').addEventListener('input', e => e.target.dataset.touched = '1');

  sb.auth.onAuthStateChange((event) => {
    if(event === 'SIGNED_OUT') showLogin();
  });
  const {data:{session}} = await sb.auth.getSession();
  if(session) await enterApp(); else showLogin();
});
