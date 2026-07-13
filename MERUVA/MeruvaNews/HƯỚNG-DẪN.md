# MERUVA News — Hướng dẫn viết bài & build

Hệ thống này cho phép **viết 1 bài bằng 3 ngôn ngữ trong 1 file**, rồi tự sinh
ra HTML tĩnh chuẩn SEO cho từng ngôn ngữ (vi / en / ja).

---

## ⚙️ Quy trình mỗi lần đăng / sửa bài

1. Tạo hoặc sửa file bài trong `content/tin-tong-hop/posts/ten-bai.post`
2. Mở terminal tại thư mục `MeruvaNews/` và chạy:
   ```
   node build.js
   ```
3. Upload các file vừa sinh ra: `Main_news.html`, `Main_news.en.html`, `Main_news.ja.html`

> ⚠️ **KHÔNG** sửa trực tiếp `Main_news.html` / `.en.html` / `.ja.html` —
> chúng bị ghi đè mỗi lần build. Chỉ sửa file `.post` và `board.json`.

---

## ✍️ Cấu trúc 1 file `.post`

```
=== META ===
id: ten-bai-khong-dau          # link chia sẻ (#id), không dấu, không cách
accent: coffee                 # màu: coffee|bakery|stay|service|3d|card|promo
date: 22 · 06 · 2026           # ngày hiển thị (số — chung cho mọi ngôn ngữ)
dateISO: 2026-06-22            # ngày chuẩn SEO + dùng để sắp xếp (mới nhất lên đầu)
brand: MERUVA Coffee
brandSub: Specialty · Đà Lạt
week: Tuần 26                  # mặc định (tiếng Việt)
tag: Mới                       # (tuỳ chọn) pill nhỏ
link: ../MeruvaCoffee/MeruvaCoffee.html   # (tuỳ chọn) nút ở chân bài
image: images/ten-anh.webp     # (tuỳ chọn) ảnh đại diện — hiện trên timeline + đầu bài
imageAlt: Mô tả ảnh            # (tuỳ chọn) mô tả ảnh cho SEO

=== VI ===
TITLE: Tiêu đề tiếng Việt
EXCERPT: Tóm tắt 1–2 câu hiển thị ở timeline.
BODY:
<p>Nội dung HTML thật...</p>
<h3>Tiểu mục</h3>
<ul><li>Gạch đầu dòng</li></ul>
<p class="promo-note">🎁 Ô ưu đãi nổi bật</p>

=== EN ===
TITLE: English title
EXCERPT: ...
WEEK: Week 26                  # ghi đè "week" cho tiếng Anh
TAG: New                       # ghi đè "tag" cho tiếng Anh
BODY:
<p>...</p>

=== JA ===
TITLE: 日本語タイトル
EXCERPT: ...
WEEK: 第26週
TAG: 新着
BODY:
<p>...</p>
```

**Quy tắc:**
- `=== META ===` chứa thông tin chung. `=== VI/EN/JA ===` chứa nội dung từng ngôn ngữ.
- Trong mỗi ngôn ngữ: `TITLE`, `EXCERPT` rồi `BODY:` (mọi dòng sau `BODY:` là nội dung).
- Có thể ghi đè `WEEK`, `TAG` riêng cho từng ngôn ngữ. Không ghi → lấy từ META.
- **Thiếu một ngôn ngữ?** Bỏ trống section đó → bài tự dùng tiếng Việt cho ngôn ngữ
  thiếu (build sẽ báo "⚠ x bài chưa dịch"). Trang vẫn chạy bình thường.

---

## 🖼️ Chèn ảnh (lazy-load — chỉ tải khi mở bài)

1. Nén ảnh trước: [squoosh.app](https://squoosh.app) → WebP, quality ~80, rộng ≤1600px.
2. Bỏ ảnh vào thư mục `MeruvaNews/images/`.
3. Trong `BODY:` dùng **`data-src`** (KHÔNG dùng `src`):
   ```html
   <img data-src="images/ten-anh.webp" alt="Mô tả ảnh">
   ```
   Ảnh chỉ tải khi người đọc bấm mở bài → đăng bao nhiêu bài trang vẫn nhẹ.

---

## 📚 Thêm một BẢNG TIN mới (ví dụ: trang Khuyến mãi riêng)

1. Tạo thư mục mới: `content/khuyen-mai/`
2. Copy `content/tin-tong-hop/board.json` sang, sửa:
   - `outBase`: tên file xuất ra (vd `Promo` → `Promo.html`, `Promo.en.html`...)
   - các chữ khung (title, intro, meta...) cho 3 ngôn ngữ
3. Tạo thư mục `content/khuyen-mai/posts/` và viết các file `.post`
4. Chạy `node build.js` — bảng tin mới tự được sinh ra.

> `build.js` tự quét mọi thư mục trong `content/` nên không cần sửa code.

---

## 🔎 SEO — đã lo sẵn

Mỗi lần build, hệ thống tự tạo cho từng trang:
- `<html lang>` + `og:locale` đúng ngôn ngữ
- Thẻ `hreflang` liên kết 3 bản ngôn ngữ (Google không coi là trùng lặp)
- JSON-LD `Blog` + `BlogPosting` + `BreadcrumbList` **tĩnh** trong HTML
- Toàn bộ nội dung bài nằm trong HTML tĩnh → Google đọc & index trực tiếp

Sau khi thêm bài, nhớ cập nhật `../sitemap.xml` nếu thêm bảng tin mới.

---

## ☁️ Đăng bài trực tiếp từ database (admin.html)

Ngoài file `.post`, build còn tự kéo các bài **đã xuất bản** (`published = true`)
từ bảng `posts` trên Supabase và trộn chung (trùng slug → bài database thắng):

1. Viết bài trong **admin.html** (mục Tin tức) — đủ 3 ngôn ngữ càng tốt
2. Upload ảnh vào bucket `news-images` (Supabase Storage) → copy URL public
   dán vào cột `image_url` (+ mô tả vào `image_alt`)
3. Bật `published = true`
4. Chạy `node build.js` (hoặc bấm Build Hook trên Netlify) → deploy

- Ngày hiển thị + số tuần (Tuần N / Week N / 第N週) tự tính từ `date_iso`
- Ảnh trong `body` dùng `src=` bình thường — build tự đổi sang lazy-load
- Không có mạng? Build vẫn chạy, chỉ dùng bài `.post` local (có cảnh báo)
