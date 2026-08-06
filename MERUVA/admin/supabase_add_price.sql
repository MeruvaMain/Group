-- Thêm giá thuê vào bảng rooms — dán vào Supabase → SQL Editor → Run (1 lần)
alter table rooms add column if not exists price text;

update rooms set price = '6.000.000₫' where id in ('102','202','302'); -- 17m²
update rooms set price = '7.000.000₫' where id in ('101','201','301'); -- 21m²
update rooms set price = '8.000.000₫' where id in ('103','203','303'); -- 24m²
-- Mặt bằng trệt: chưa đặt giá, để trống (admin sửa sau nếu cần)
