-- ═══════════════════════════════════════════════════════════
-- MERUVA · Đăng báo trực tiếp từ database + ảnh bài viết
-- Dán toàn bộ file này vào Supabase → SQL Editor → Run (1 lần)
-- ═══════════════════════════════════════════════════════════

-- Cột mới cho bảng posts
alter table posts add column if not exists published boolean not null default false;
alter table posts add column if not exists board text not null default 'tin-tong-hop';
alter table posts add column if not exists image_url text;  -- ảnh đại diện (URL đầy đủ, vd từ Storage)
alter table posts add column if not exists image_alt text;  -- mô tả ảnh (SEO + accessibility)

-- Web/build đọc được bài ĐÃ XUẤT BẢN bằng publishable key.
-- Bài nháp (published = false) vẫn kín — chỉ admin đăng nhập thấy.
drop policy if exists "posts select published" on posts;
create policy "posts select published" on posts for select
  using (published = true);

-- ── Storage: bucket ảnh báo ──
-- Public ĐỌC (ảnh hiển thị trên web), chỉ admin đăng nhập mới upload/sửa/xóa
insert into storage.buckets (id, name, public)
  values ('news-images', 'news-images', true)
  on conflict (id) do nothing;

drop policy if exists "news images read" on storage.objects;
create policy "news images read" on storage.objects for select
  using (bucket_id = 'news-images');

drop policy if exists "news images insert" on storage.objects;
create policy "news images insert" on storage.objects for insert
  with check (bucket_id = 'news-images' and auth.role() = 'authenticated');

drop policy if exists "news images update" on storage.objects;
create policy "news images update" on storage.objects for update
  using (bucket_id = 'news-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'news-images' and auth.role() = 'authenticated');

drop policy if exists "news images delete" on storage.objects;
create policy "news images delete" on storage.objects for delete
  using (bucket_id = 'news-images' and auth.role() = 'authenticated');

-- URL ảnh sau khi upload vào bucket có dạng:
-- https://ztqyojsyafhpkmhrawtd.supabase.co/storage/v1/object/public/news-images/ten-anh.webp
