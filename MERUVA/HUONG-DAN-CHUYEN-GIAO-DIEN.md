# Hướng dẫn chuyển 4 trang còn lại sang giao diện mới

Tài liệu mô tả — không chứa mã. Dùng để đọc trước và trong lúc làm từng trang.

Bốn trang chưa chuyển: **B2B · News · Stay · Card**.
Ba trang đã chuyển xong làm mẫu tham chiếu: **index · Kitchen · Thiết kế**.

---

## Phần 1 — Nguyên tắc chung

### 1.1 Mục tiêu thật sự là gì

Không phải "đổi cho đẹp". Mục tiêu là người vào trang **làm được việc họ định làm, nhanh hơn và ít phân vân hơn**. Mỗi trang có đúng một hành động chính:

| Trang | Việc người dùng định làm | Dấu hiệu thành công |
|---|---|---|
| B2B | Xem MERUVA có những đối tác nào, có nên hợp tác không | Bấm vào một đối tác, hoặc gửi form hợp tác |
| News | Đọc một bài | Mở bài, đọc hết, không bị vướng |
| Stay | Tìm phòng phù hợp túi tiền, rồi hẹn xem | Gửi form đặt lịch xem phòng |
| Card | Hiểu ba hạng thẻ khác nhau chỗ nào, chọn một hạng | Gửi form đăng ký |

Mọi quyết định thiết kế trong lúc làm, quay lại hỏi: **điều này giúp hay cản việc trên?**

### 1.2 Thứ tự làm và lý do

**B2B → News → Stay → Card.**

- **B2B (12 KB)** — gần như không có thành phần đặc thù. Làm trước để chạy thử toàn bộ quy trình chuyển đổi trên một trang nhỏ, rút kinh nghiệm trước khi đụng trang lớn.
- **News (20 KB + CSS riêng)** — vừa phải, nhưng có ràng buộc riêng về quy trình sinh trang (mục 4.2).
- **Stay (118 KB)** — có form đang chạy thật và ba khối tự viết.
- **Card (104 KB)** — nặng nhất, nhiều thành phần tự viết nhất, và có phần nghệ thuật cố ý không theo bảng màu chung.

Làm **từng trang một, mỗi trang một lượt**, xem và duyệt xong mới sang trang kế. Không làm song song hai trang — lỗi sẽ trộn vào nhau và rất khó tách.

### 1.3 Cách làm: viết lại, không vá

Có hai cách chuyển một trang:

1. **Vá** — giữ markup cũ, thêm lớp tương thích đổi màu. Đây là cách bốn trang này đang chạy (`meruva-legacy.css`).
2. **Viết lại** — dựng lại markup bằng component của `meruva.css`, bỏ hẳn `meruva-shared.css`.

Lần này chọn **viết lại**. Lý do: cách vá đã dùng rồi và nó để lại hàng loạt vấn đề — CSS chết, hiệu ứng ngược sáng-tối, tương phản không đạt. Vá thêm lần nữa chỉ chồng thêm lớp.

Dấu hiệu một trang đã chuyển xong: **không còn nạp `meruva-shared.css` và `meruva-legacy.css`**.

---

## Phần 2 — Những "hợp đồng" bắt buộc giữ đúng

Đây là các quy ước mà `meruva.css` và `meruva.js` dựa vào. Đặt sai tên là chức năng câm lặng, không báo lỗi.

### 2.1 Khung trang

| Vai trò | Quy ước |
|---|---|
| Thanh tiến độ cuộn | phần tử id `bar` |
| Đầu trang dính | phần tử id `hdr`, class `hdr` |
| Vùng menu | id `nav`, class `hdr-nav` |
| Nút mở menu di động | id `burger`, class `burger` |
| Lớp phủ khi đổi ngôn ngữ | id `lang-overlay` |
| Hiện dần khi cuộn | class `rv` trên phần tử cần hiện |

Thiếu `lang-overlay` thì đổi ngôn ngữ vẫn chạy nhưng mất hiệu ứng chuyển mềm.

### 2.2 Đa ngôn ngữ

- Chữ cần dịch: đánh dấu `data-i18n` với khoá tương ứng.
- Ô nhập: `data-i18n-placeholder`.
- Thuộc tính (mô tả trang, nhãn trợ năng): `data-i18n-attr`.
- Ba nút VI/EN/JA: class `lang-btn` kèm `data-lang`.
- Ngôn ngữ đang chọn lưu ở `localStorage` khoá `meruva_lang` — **dùng chung toàn site**, khách chọn EN ở Kitchen thì sang Stay vẫn là EN.

Trang chủ hiện **chưa có** đa ngôn ngữ (0 khoá). Bốn trang này đang có — **không được làm mất** khi viết lại. Đây là rủi ro lớn nhất của việc dựng lại markup: dịch bị rơi rụng mà không ai phát hiện cho tới khi có khách nước ngoài.

### 2.3 Biểu mẫu

Ba trang mới đang dùng chung một quy ước:

- Thẻ form mang `data-appt-form` với giá trị là tên dịch vụ (dùng làm nhãn khi ghi vào cơ sở dữ liệu).
- Dòng báo thành công mang class `form-ok`.
- Các ô nhập đặt tên: `name`, `phone`, `service`, `appt_date`, `note`.
- Ô bẫy bot tên `botcheck`, để ẩn.

Đặt đúng bốn thứ này là form tự chạy, không cần viết thêm gì.

### 2.4 Các quy ước tương tác khác

| Quy ước | Tác dụng |
|---|---|
| `data-toggle` | biến hàng thành accordion đóng/mở |
| `data-count` | số đếm tăng dần khi cuộn tới |
| `data-book` | nút chọn gói rồi cuộn xuống form |
| `data-skip` | đánh dấu nút không kích hoạt accordion |

---

## Phần 3 — Component đã có sẵn

Trước khi tự viết một khối mới, kiểm xem `meruva.css` đã có chưa. Hiện có sẵn:

**Khung** — `wrap`, `blk-white` (nền trắng), `blk-ink` (nền mực), `pad-sm`
**Chữ** — `lead`, `lbl` (nhãn nhỏ), `sec-top` + `sec-idx` (đầu mục có số thứ tự), `hl` (chữ nhấn)
**Nút** — `btn`, `btn-fill` (ấn son), `btn-ink` (mực), `btn-light` (trên nền tối), `btn-sm`, `alink` (link mũi tên)
**Hero trang nhánh** — `b-hero`, `b-hero-in`, `b-cta`, `b-mark`, `back` (link về trang chủ)
**Thẻ & lưới** — `card`, `card-k`, `grid-2`, `grid-3`
**Danh mục đóng mở** — `rows`, `row-i`, `row-h`, `row-n`, `row-t`, `row-p`, `row-d`
**Câu hỏi thường gặp** — `qa`
**Biểu mẫu trên nền mực** — `f-row`, `f-two`, `form-ok`, `ci` (khối thông tin liên hệ)
**Chân trang** — `f-in`, `f-name`, `f-links`, `f-right`, `f-copy`

Nếu phải tự viết CSS riêng cho trang: đặt trong thẻ `<style>` của chính trang đó, **không thêm vào `meruva.css`**. `meruva.css` chỉ chứa thứ dùng chung từ hai trang trở lên. Đây chính là bài học từ lần trước: `home.css` và `meruva-v2.css` từng chép nhau 43 class rồi lệch dần.

---

## Phần 4 — Ghi chú riêng từng trang

### 4.1 B2B — làm trước

**Người dùng đến đây từ đâu:** hầu hết từ trang Vemil (có link "quay lại"), một số từ tìm kiếm. **Trang chủ không link tới đây** — cần cân nhắc có nên thêm không.

**Luồng cần thuận:** vào → hiểu MERUVA B2B là gì trong 5 giây → xem danh sách đối tác → hoặc bấm vào Vemil, hoặc gửi form hợp tác.

**Lưu ý:**
- Hiện chỉ có **một** đối tác (Vemil). Lưới thẻ thiết kế cho nhiều đối tác nhưng chỉ có một ô sẽ trông trống trải. Cân nhắc bố cục hợp với con số thật, hoặc nói rõ "đang mở rộng".
- Thẻ đối tác dùng biến màu nhấn riêng cho từng đối tác — giữ cơ chế này, vì đối tác sau sẽ có màu khác.
- Vemil là **đối tác**, không phải nhánh MERUVA. Cố ý không mang logo và tên MERUVA. Đừng "thống nhất" nó vào nhận diện chung.
- Trang này không có form gửi mail, nhẹ nhất, dùng để tập.

### 4.2 News — có ràng buộc quy trình

**Đây là điểm dễ mất công nhất nếu không biết trước.**

Ba file `Main_news.html`, `.en.html`, `.ja.html` **được sinh tự động** từ `_template.html` cộng với nội dung bài. Netlify chạy lệnh sinh này mỗi lần triển khai.

Hệ quả: **sửa thẳng vào ba file đó sẽ bị ghi đè** ở lần triển khai kế tiếp. Phải sửa ở `_template.html`, rồi chạy lệnh sinh lại.

Cách kiểm đã làm đúng: sửa xong, chạy lệnh sinh, rồi kiểm ba file kết quả xem sửa đổi còn nguyên không.

**Luồng người đọc:** vào → lướt danh sách bài → mở một bài → đọc → đóng → có thể đọc bài khác.

**Lưu ý:**
- Bài mở trong hộp nổi (modal), không chuyển trang. Giữ cách này — nó giữ được vị trí đang lướt.
- Có thanh tiến độ đọc. Nhỏ nhưng người đọc bài dài rất thích, đừng bỏ.
- Nút đóng bài phải **to và luôn thấy** kể cả khi cuộn giữa bài. Đây là chỗ vừa sửa một lỗi: chữ trắng trên nền xám nhạt, rê vào là biến mất.
- Ba ngôn ngữ là ba trang riêng biệt, có khai báo liên kết chéo. Giữ nguyên cấu trúc này.
- Màu nhấn theo nhánh (cà phê, stay, thiết kế…) khai ở hai nơi: bảng màu trong CSS và bảng trong JS. **Hai nơi phải khớp** — vừa sửa một lần lệch.

### 4.3 Stay — có tiền thật đi qua

**Luồng người thuê:** vào → xem có phòng loại nào, bao nhiêu tiền → xem ảnh và tiện nghi → tính thử chi phí → **đặt lịch xem phòng**.

Bước cuối là mục tiêu. Mọi thứ trước đó chỉ để người ta đủ tự tin bấm nút.

**Ba khối tự viết cần dựng lại:**
1. Sơ đồ/danh sách phòng — trạng thái còn trống hay đã thuê
2. Máy tính giá thuê
3. Thư viện ảnh

**Lưu ý quan trọng:**
- **Form ghi thẳng vào cơ sở dữ liệu Supabase**, bảng `appointments`. Đây là đường khách hàng thật. Viết lại xong **phải thử gửi và kiểm dữ liệu có vào đúng bảng không**. Cách thử an toàn: chặn lời gọi mạng lại, xem nội dung định gửi, không ghi rác vào dữ liệu thật.
- Form gộp loại phòng và email vào trường ghi chú. Giữ đúng cách gộp này, nếu không người đọc đơn sẽ thiếu thông tin.
- Giá thuê đọc từ cơ sở dữ liệu. Nếu mất mạng thì phải có giá dự phòng hiển thị, đừng để trống.
- Trang có con trỏ chuột tuỳ biến và hiệu ứng hạt nhiễu từ hệ cũ. Cân nhắc bỏ — hệ mới không có, và chúng làm trang nặng thêm.
- Số phòng, giá, diện tích là **thông tin thật đang bán**. Chép sai một con số là hậu quả thật. Đối chiếu lại với bản cũ trước khi xoá bản cũ.

### 4.4 Card — nặng nhất, để cuối

**Luồng người đăng ký:** vào → thấy tấm thẻ (phần gây thích) → hiểu ba hạng khác nhau chỗ nào → thử hình dung thẻ của mình → chọn hạng → điền form.

**Bốn khối tự viết:**
1. Thẻ lật 3D ở đầu trang
2. Bộ mô phỏng — người dùng chọn hạng, xem thẻ đổi theo
3. Xuất ảnh thẻ ra file
4. Bảng so sánh ba hạng

**Lưu ý quan trọng nhất — phần nghệ thuật mặt thẻ:**

Mặt thẻ **cố ý giữ nền tối và bảng màu kim loại** (bạc / vàng / xanh), không theo bảng giấy–mực–ấn son của site. Đây là chủ ý, không phải sót.

Khi viết lại: **giữ nguyên vùng này**, đừng "đồng bộ" nó. Lần đổi màu trước đã quét nhầm vào đây và gây ba lỗi: chữ tàng hình trên nền đen, hiệu ứng loé bị tắt, và một chữ đỏ-cam lọt giữa tấm thẻ toàn sắc vàng.

Ranh giới cần rõ: **bên trong khung thẻ** dùng bảng kim loại; **ngoài khung thẻ** (tiêu đề, bảng so sánh, form) dùng bảng chung của site.

**Lưu ý khác:**
- **Form gửi mail qua Web3Forms.** Vừa sửa lỗi Reply-To trỏ về chính hòm thư mình. Khi dựng lại, nhớ gán Reply-To bằng email khách, đừng để giá trị cố định.
- Trường ẩn ghi hạng thẻ đang chọn phải cập nhật theo lựa chọn của người dùng, nếu không mọi đơn về đều ghi cùng một hạng.
- Chữ hạng Black cố ý mờ để tạo cảm giác "kín đáo" — tỷ lệ tương phản 2,3:1. Đây là chủ ý đã ghi trong mã. Giữ hay nâng lên là quyết định của bạn, nhưng phải là quyết định có ý thức.
- Chức năng xuất ảnh vẽ lại tấm thẻ bằng mã riêng, có bảng màu riêng của nó. **Bảng màu này phải khớp với bảng màu hiển thị**, nếu không ảnh xuất ra khác với thẻ người dùng nhìn thấy. Đây từng là lỗi thật.

---

## Phần 5 — Bẫy đã gặp, đừng lặp lại

Đây là các lỗi có thật trong dự án này, không phải cảnh báo chung chung.

### 5.1 Hiệu ứng hoà trộn ngược sáng-tối

Hệ cũ nền đen dùng chế độ hoà trộn "screen" để logo và vệt sáng nổi lên. Trên nền giấy sáng, chế độ này **đẩy mọi màu về trắng** — vừa gây ra logo gần như tàng hình trên bốn trang. Đo được: điểm ảnh tối nhất chỉ còn 239 trên 255.

Quy tắc: nền sáng thì dùng "multiply", nền tối thì dùng "screen". Đổi nền mà quên đổi chế độ hoà trộn là hiệu ứng chết hoặc phản tác dụng.

### 5.2 Đổi màu hàng loạt

Đừng tìm-thay toàn bộ mã màu. Lần trước làm vậy và quét nhầm vào những bề mặt **cố ý giữ nền tối**, khiến chữ sáng bị lật thành chữ tối trên nền tối.

Cách đúng: đi từng khối, hỏi "bề mặt này sáng hay tối?", rồi mới quyết định.

### 5.3 CSS chết gây chẩn đoán sai

Khi đổi markup mà không xoá CSS cũ, phần CSS đó nằm lại và **trông y hệt lỗi thật**. Trong trang Card từng có 21 quy tắc như vậy — mình đã báo nhầm chúng là lỗi hiển thị.

Quy tắc: đổi markup xong thì xoá luôn CSS không còn ai dùng, trong cùng một lần.

### 5.4 Độ ưu tiên CSS

Vừa gặp: quy tắc cho link trong menu đè lên nút bấm nằm trong menu, làm nút CTA thành chữ xám trên nền đen — **2,74:1, gần như không đọc được, trên cả ba trang mới**.

Khi một quy tắc nhắm vào "mọi link trong vùng X", nhớ loại trừ nút bấm.

### 5.5 Tương phản màu ấn son

Màu ấn son gốc dùng làm **chữ nhỏ** chỉ đạt khoảng 4,1:1 ở **cả nền sáng lẫn nền tối** — dưới chuẩn 4,5. Đã có hai biến riêng cho chữ nhỏ: một bản đậm hơn cho nền giấy, một bản nhạt hơn cho nền mực. **Dùng đúng hai biến này cho nhãn nhỏ**, giữ màu gốc cho nền tô, viền và chữ lớn.

Bốn màu nhận diện nhánh đều nằm sát ngưỡng. Nếu định dùng chúng làm chữ nhỏ thì phải hạ tối đáng kể — đây là quyết định thẩm mỹ, cần cân nhắc chứ không tự động.

### 5.6 Bộ nhớ đệm trình duyệt

Mọi file CSS/JS nội bộ đều đã gắn tham số phiên bản. **Sửa file thì nhớ tăng số này**, nếu không khách cũ vẫn chạy bản cũ. Trong phiên vừa rồi việc này đã gây nhầm lẫn ba lần — sửa xong mà tưởng không ăn.

Đặc biệt nguy hiểm: file bảng màu bị đệm lại trong khi file giao diện đã mới. Khi đó các biến màu không phân giải được và chữ **mất màu hoàn toàn**. Đã thêm giá trị dự phòng để hỏng nhẹ hơn, nhưng vẫn nên tăng phiên bản cho đúng.

### 5.7 Đừng tách hệ thiết kế ra làm hai

Trước đây trang chủ có bộ CSS riêng, tách khỏi bộ dùng chung. Hai bên chép nhau 43 class rồi **lệch dần** — sửa một bên không lan sang bên kia, và ba lỗi hiển thị đã sinh ra từ đó.

Giờ chỉ còn một bộ. Giữ như vậy.

---

## Phần 6 — Danh sách kiểm trước khi coi là xong

Với mỗi trang, kiểm đủ những mục sau:

**Chức năng**
- Form gửi được, dữ liệu vào đúng nơi, đủ trường (thử bằng cách chặn lời gọi mạng, không ghi dữ liệu thật)
- Với form gửi mail: Reply-To là email khách
- Ba ngôn ngữ đổi được, không khoá dịch nào bị rơi
- Menu di động mở/đóng được
- Các khối đóng mở, đếm số, cuộn tới form đều chạy

**Hiển thị**
- Không còn nạp `meruva-shared.css` và `meruva-legacy.css`
- Không còn chế độ hoà trộn "screen" trên nền sáng
- Tương phản chữ đạt 4,5:1 với chữ nhỏ và 3:1 với chữ lớn
- Xem ở bề ngang 375px: không tràn ngang, chữ không dính nhau
- Logo hiện rõ, biểu tượng trên thanh tab hiện đúng

**Sạch sẽ**
- Không còn CSS của markup đã bỏ
- CSS riêng của trang nằm trong trang, không lẫn vào bộ dùng chung
- Tham số phiên bản đã tăng cho file vừa sửa

**SEO** (hiện đang không lỗi, giữ nguyên)
- Tiêu đề dưới 60 ký tự, mô tả 70–160 ký tự
- Đúng một thẻ tiêu đề cấp một
- Mọi ảnh có văn bản thay thế
- Địa chỉ chuẩn trỏ đúng vị trí trang

**Đối chiếu nội dung**
- Giá, số phòng, quyền lợi từng hạng thẻ, thông tin liên hệ: so với bản cũ trước khi xoá bản cũ

---

## Phần 7 — Vài điều nên quyết trước khi bắt đầu

1. **Đa ngôn ngữ cho trang chủ** — hiện trang chủ không có, bốn trang kia có. Nên thống nhất một hướng trước khi làm tiếp, tránh làm xong rồi sửa lại.
2. **Màu nhận diện nhánh** — có hạ tối cho đạt chuẩn tương phản hay giữ tông hiện tại.
3. **Hiệu ứng của hệ cũ** (con trỏ tuỳ biến, hạt nhiễu, màn hình chờ) — bỏ hẳn hay mang sang hệ mới. Nên quyết một lần cho cả bốn trang.
4. **B2B có nên được link từ trang chủ không** — hiện chỉ vào được qua Vemil.
