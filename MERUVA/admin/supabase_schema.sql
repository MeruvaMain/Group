-- ═══════════════════════════════════════════════════════════
-- MERUVA · Trung tâm điều hành — schema khởi tạo (V1)
-- Dán toàn bộ file này vào Supabase → SQL Editor → Run (1 lần duy nhất)
-- ═══════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── STAY: phòng ──
create table if not exists rooms (
  id text primary key,
  floor text not null,
  label text,
  area int not null,
  is_free boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- ── SERVICE: lịch mở khung ngày ──
create table if not exists calendar_days (
  month_key text not null,        -- 'YYYY-MM'
  day int not null,
  status text not null default 'free' check (status in ('free','near','full')),
  primary key (month_key, day)
);

-- ── SERVICE: lịch hẹn tư vấn ──
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  service text not null default 'Tư vấn Service',
  appt_date date not null,
  appt_time text not null default '09:00',
  note text,
  status text not null default 'pending' check (status in ('pending','confirmed','done','cancelled')),
  created_at timestamptz not null default now()
);

-- ── BAKERY / COFFEE: menu ──
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('coffee','bakery')),
  name text not null,
  note text,
  price text not null default '—',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── TIN TỨC: bài nháp ──
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  accent text not null default 'coffee',
  date_iso date not null default current_date,
  brand text not null default 'MERUVA',
  brand_sub text,
  tag text,
  link text,
  vi jsonb not null default '{}'::jsonb,
  en jsonb not null default '{}'::jsonb,
  ja jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── nhật ký hoạt động ──
create table if not exists activity_log (
  id bigserial primary key,
  ts timestamptz not null default now(),
  text text not null
);

-- ── Góc Claude: checklist việc chính chủ ──
create table if not exists admin_todo (
  key text primary key,
  done boolean not null default false
);

-- ── Góc Claude: sổ tay ghi chú ──
create table if not exists admin_notes (
  id int primary key default 1,
  notes text not null default '',
  check (id = 1)
);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security — khóa mặc định, chỉ mở đúng phần cần
-- ═══════════════════════════════════════════════════════════
alter table rooms          enable row level security;
alter table calendar_days  enable row level security;
alter table appointments   enable row level security;
alter table menu_items     enable row level security;
alter table posts          enable row level security;
alter table activity_log   enable row level security;
alter table admin_todo     enable row level security;
alter table admin_notes    enable row level security;

-- rooms & menu_items & calendar_days: web công khai sau này cần ĐỌC được
-- (khách xem phòng trống / menu / lịch mở), nhưng chỉ admin đã đăng nhập mới SỬA
drop policy if exists "rooms select all" on rooms;
create policy "rooms select all" on rooms for select using (true);
drop policy if exists "rooms write auth" on rooms;
create policy "rooms write auth" on rooms for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "cal select all" on calendar_days;
create policy "cal select all" on calendar_days for select using (true);
drop policy if exists "cal write auth" on calendar_days;
create policy "cal write auth" on calendar_days for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "menu select all" on menu_items;
create policy "menu select all" on menu_items for select using (true);
drop policy if exists "menu write auth" on menu_items;
create policy "menu write auth" on menu_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- appointments: khách (chưa đăng nhập) được phép TẠO lịch hẹn từ web sau này,
-- nhưng chỉ admin mới XEM / SỬA / XÓA được danh sách
drop policy if exists "appt insert anon" on appointments;
create policy "appt insert anon" on appointments for insert with check (true);
drop policy if exists "appt manage auth" on appointments;
create policy "appt manage auth" on appointments for select using (auth.role() = 'authenticated');
drop policy if exists "appt update auth" on appointments;
create policy "appt update auth" on appointments for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "appt delete auth" on appointments;
create policy "appt delete auth" on appointments for delete using (auth.role() = 'authenticated');

-- posts / activity_log / admin_todo / admin_notes: dữ liệu nội bộ, chỉ admin
drop policy if exists "posts auth only" on posts;
create policy "posts auth only" on posts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "act auth only" on activity_log;
create policy "act auth only" on activity_log for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "todo auth only" on admin_todo;
create policy "todo auth only" on admin_todo for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "notes auth only" on admin_notes;
create policy "notes auth only" on admin_notes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- Dữ liệu khởi tạo
-- ═══════════════════════════════════════════════════════════
insert into rooms (id, floor, label, area, is_free, sort_order) values
  ('101','Tầng 1',null,21,true,1), ('102','Tầng 1',null,17,true,2), ('103','Tầng 1',null,24,true,3),
  ('201','Tầng 2',null,21,true,4), ('202','Tầng 2',null,17,true,5), ('203','Tầng 2',null,24,true,6),
  ('301','Tầng 3',null,21,true,7), ('302','Tầng 3',null,17,true,8), ('303','Tầng 3',null,24,true,9),
  ('Trệt','Mặt bằng','Mặt bằng trệt',35,true,10)
on conflict (id) do nothing;

insert into menu_items (brand, name, note, price, active, sort_order) values
  ('coffee','Summit Espresso','Single origin · house blend · 30ml','45.000₫',true,1),
  ('coffee','Pour-over Đà Lạt','V60 · hand-brew · 200ml','65.000₫',true,2),
  ('coffee','Cappuccino Cream','Double shot · sữa tươi nguyên kem','55.000₫',true,3),
  ('coffee','Cold Brew 12h','Slow cold-extracted · 300ml','55.000₫',true,4),
  ('coffee','Flat White','Ristretto · micro-foam milk','60.000₫',true,5),
  ('coffee','Hạt rang Summit','Túi 250g · medium roast','180.000₫',true,6),
  ('bakery','Sourdough Summit','Ổ 600g · men tự nhiên 24h (mẫu — sửa theo thực tế)','85.000₫',true,1),
  ('bakery','Croissant bơ','Bơ lạt nhập · 27 lớp (mẫu)','42.000₫',true,2),
  ('bakery','Bánh mì hoa cúc','Brioche mềm · trứng sữa (mẫu)','55.000₫',true,3)
on conflict do nothing;

insert into admin_todo (key, done) values
  ('supabase', true),
  ('keys', true),
  ('authuser', false),
  ('mail', false),
  ('netlify', false),
  ('dns', false)
on conflict (key) do nothing;

insert into admin_notes (id, notes) values (1, '') on conflict (id) do nothing;
