# MERUVA Menu — Database cho menu (Tầng 1)

> Mục tiêu: quản lý **menu / sản phẩm / bảng giá** ở một nơi duy nhất (Airtable),
> rồi tự động sinh ra web tĩnh — không phải sửa code mỗi lần đổi giá.

---

## 1. Database giúp gì cho web của bạn?

**Hiện tại** menu Coffee nằm *bên trong code* — file [`meruva_lang.js`](../meruva_lang.js).
Mỗi lần đổi 1 giá, bạn phải:

- Mở file JavaScript dài ~800 dòng
- Sửa đúng chỗ, đúng cú pháp (sai 1 dấu phẩy là vỡ trang)
- Sửa **3 lần** cho 3 ngôn ngữ (vi / en / ja)

**Có database** thì menu nằm *ngoài code*, trong một bảng giống Excel:

| Bạn làm | Kết quả |
|---|---|
| Sửa giá trong Airtable (như sửa Excel) | Không đụng tới code |
| Chạy 1 lệnh `node build-menu.js` | Web tự cập nhật |
| Nhân viên không biết code vẫn sửa được | Bạn không thành "nút thắt cổ chai" |

**Quan trọng:** web khách xem **vẫn là HTML tĩnh** — nhanh y như cũ, không gọi Airtable
lúc khách truy cập (nên không lộ mật khẩu, không sợ Airtable sập, không tốn tiền theo lượt xem).
Airtable chỉ được gọi lúc *bạn build*, trên máy bạn.

```
Airtable (bạn gõ như Excel)
      │   node build-menu.js  (chỉ chạy trên máy bạn)
      ▼
meruva-menu.js  ──►  web tĩnh  ──►  khách xem (nhanh, an toàn)
```

---

## 2. Chạy thử NGAY (chưa cần Airtable)

Đã có sẵn dữ liệu demo trong `menu-data.json`. Chỉ cần:

```bash
cd MeruvaMenu
node build-menu.js
```

→ sinh ra file [`../meruva-menu.js`](../meruva-menu.js). Mở trang Coffee lên là thấy menu chạy từ file này.
Thử đổi 1 giá trong `menu-data.json`, chạy lại lệnh trên → giá đổi theo.

---

## 3. Cấu trúc bảng Airtable (khi sẵn sàng nối thật)

Tạo 1 base, trong đó 1 bảng tên **`Menu`** với các cột:

| Cột (Field) | Kiểu | Ví dụ |
|---|---|---|
| `Brand` | Single select | `coffee`, `bakery`, `service`, `print3d`, `card` |
| `Order` | Number | `1`, `2`, `3`… (thứ tự hiển thị) |
| `Active` | Checkbox | ✓ (bỏ tick = ẩn món, không cần xoá) |
| `Name_vi` / `Name_en` / `Name_ja` | Single line text | Tên món 3 ngôn ngữ |
| `Note_vi` / `Note_en` / `Note_ja` | Long text | Mô tả ngắn 3 ngôn ngữ |
| `Price_vi` / `Price_en` / `Price_ja` | Single line text | `45.000₫` / `45,000₫` / `45,000₫` |

> Mỗi **dòng = 1 món**. Thiếu bản dịch (vd để trống `Name_ja`) → tự động dùng tiếng Việt.

---

## 4. Nối Airtable thật

1. Lấy **Personal Access Token**: https://airtable.com/create/tokens
   (quyền `data.records:read`, gắn với base của bạn)
2. Lấy **Base ID**: mở https://airtable.com/api , chọn base — ID dạng `appXXXXXXXXXXXXXX`
3. Đặt biến môi trường rồi chạy:

**PowerShell (Windows):**
```powershell
$env:AIRTABLE_TOKEN = "patXXXX..."
$env:AIRTABLE_BASE  = "appXXXX..."
node build-menu.js
```

Script tự nhận ra có token → lấy từ Airtable thay vì file demo. **Không phải sửa code.**

> ⚠️ Token là mật khẩu — đừng commit lên Git, đừng dán vào file HTML.

---

## 5. Thêm brand khác (Bakery, Service…)

1. Trong Airtable: thêm dòng với `Brand` = `bakery` (hoặc `service`, `print3d`, `card`)
2. Trong trang brand đó (vd `MeruvaBakery/...html`), làm y hệt trang Coffee:
   - Thêm `<script src="../meruva-menu.js?v=1"></script>`
   - Chỗ render sản phẩm, ưu tiên `window.MERUVA_MENU[brandId][lang]`, fallback về `data.products`

Xem [`MeruvaCoffee/MeruvaCoffee.html`](../MeruvaCoffee/MeruvaCoffee.html) làm mẫu (tìm chữ `MERUVA_MENU`).

---

## 6. Khi nào KHÔNG dùng cách này

Cách Tầng 1 hợp với dữ liệu **ít đổi, ai cũng xem giống nhau** (menu, giá, tin).
Với **đặt phòng Stay, thẻ thành viên Card, đăng nhập** → cần database thật (Supabase) — đó là Tầng 2.
