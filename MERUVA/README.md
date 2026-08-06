# ▲ MERUVA

Website chính thức của **MERUVA Consulting** — tư vấn ứng dụng AI và đo lường ROI.
Trang tĩnh thuần HTML/CSS/JS, deploy trên Netlify tại [meruva.vn](https://meruva.vn).

## Cấu trúc

| Thư mục / file | Nội dung |
|---|---|
| `index.html`, `meruva.css`, `meruva.js` | Trang chủ + core style/script |
| `meruva-tokens.css`, `meruva-shared.*` | Design token và thành phần dùng chung |
| `meruva_lang.js`, `home-lang.js` | Chuỗi đa ngôn ngữ (VI / EN / JA) |
| `Meruva3D/` | Nhánh Thiết kế & 3D |
| `MeruvaB2B/` — `MeruvaB2B/Vemil/` | Nhánh B2B và dự án Vemil |
| `MeruvaCard/` | Nhánh Card |
| `MeruvaKitchen/` | Nhánh Kitchen (gộp từ Coffee + Bakery) |
| `MeruvaStay/` | Nhánh Stay |
| `MeruvaNews/` | Trang tin + `build.js` sinh HTML tĩnh từ Supabase |
| `admin/` | Trang quản trị nội bộ (chạy cục bộ, Netlify chặn publish) |
| `demo/` | Bản demo sản phẩm dựng riêng cho khách |
| `og/` | Ảnh Open Graph từng nhánh |

## Chạy cục bộ

```bash
npx http-server . -p 3050
```

Trang quản trị:

```bash
npx http-server ./admin -p 3150
```

## Deploy

Netlify tự build mỗi lần push (`netlify.toml`):

```bash
node MeruvaNews/build.js
```

Lệnh này kéo bài đã xuất bản từ Supabase và sinh HTML tĩnh chuẩn SEO.
Deploy kéo-thả thủ công **không** chạy bước build này.

## Ghi chú

- `admin/` bị chặn publish qua `_redirects` — chỉ dùng nội bộ.
- `demo/` và các trang nội bộ được `robots.txt` chặn lập chỉ mục.
- Hợp đồng và sổ tay vận hành (PDF) nằm trong `.gitignore`, không lên repo.
- Kho lưu trữ bản cũ (`meruva-old/`) đã tách khỏi repo, xem `../_meruva-old-backup/`.

## Tài liệu

- [MERUVA_BrandGuide.md](MERUVA_BrandGuide.md) — brand book
- [HUONG-DAN-CHUYEN-GIAO-DIEN.md](HUONG-DAN-CHUYEN-GIAO-DIEN.md) — hướng dẫn chuyển giao diện
