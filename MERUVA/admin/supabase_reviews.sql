-- ═══════════════════════════════════════════════════════════
-- MERUVA · Đánh giá khách hàng (reviews) — chạy 1 lần
-- Dán toàn bộ file này vào Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null default 'male' check (gender in ('male','female')),
  role text,                          -- nghề nghiệp / vai trò (tuỳ chọn)
  rating int not null default 5 check (rating between 1 and 5),
  content text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

-- Khách (chưa đăng nhập) chỉ được GỬI đánh giá ở trạng thái chờ duyệt
drop policy if exists "reviews insert anon" on reviews;
create policy "reviews insert anon" on reviews for insert
  with check (status = 'pending' or auth.role() = 'authenticated');

-- Web công khai chỉ ĐỌC được đánh giá đã duyệt; admin đọc tất cả
drop policy if exists "reviews select" on reviews;
create policy "reviews select" on reviews for select
  using (status = 'approved' or auth.role() = 'authenticated');

-- Chỉ admin được duyệt / ẩn / xóa
drop policy if exists "reviews update auth" on reviews;
create policy "reviews update auth" on reviews for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "reviews delete auth" on reviews;
create policy "reviews delete auth" on reviews for delete
  using (auth.role() = 'authenticated');
