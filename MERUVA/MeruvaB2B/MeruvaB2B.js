/* ═══════════════════════════════════════
   MERUVA B2B — riêng của trang này
   Hiện dần (.rv) và các thứ dùng chung khác đã do meruva.js xử lý.
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  /* Đếm đối tác đang hoạt động (không tính thẻ "sắp có") — tự cập nhật
     khi thêm đối tác mới, không cần sửa tay số trong HTML. */
  var active = document.querySelectorAll('.b2b-card:not(.b2b-card--soon)').length;
  var el = document.getElementById('partnerCount');
  if (el) el.textContent = active;
});
