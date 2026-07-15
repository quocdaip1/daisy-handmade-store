# Codex Rules – Daisy Handmade Store

Cập nhật: 15/07/2026

Mục tiêu của tài liệu này là giảm token và thời gian đọc repository nhưng vẫn giữ kết quả đúng theo source hiện tại.

## 1. Thứ tự nguồn tin

1. Đọc `docs/project-context.md` trước.
2. Đọc file source, route, type, service, test và config trực tiếp liên quan đến yêu cầu.
3. Chỉ mở phần tương ứng trong report/plan; không đọc lại toàn bộ lịch sử phase nếu context hiện tại đã đủ.
4. Khi tài liệu mâu thuẫn với source hoặc kết quả chạy mới, ưu tiên source và kết quả mới.
5. Không suy đoán dữ liệu, API, trạng thái hoàn thành hoặc kết quả test. Điểm chưa xác minh phải ghi rõ là chưa xác minh.

## 2. Token Optimization Rules

- Tìm file bằng `rg --files`; tìm nội dung bằng `rg -n` trước khi mở file đầy đủ.
- Đọc theo lát cắt nhỏ: module đang làm, contract liên quan và test liên quan.
- Tái sử dụng contract và trạng thái đã xác minh trong `docs/project-context.md`; không mô tả lại dài dòng ở mỗi phase.
- Với report dài, đọc heading và đoạn cuối/cụm từ khóa liên quan trước; chỉ mở rộng khi có mâu thuẫn hoặc thiếu bằng chứng.
- Không lặp nguyên nội dung source trong tài liệu. Ghi kết luận, đường dẫn nguồn và rủi ro cần thiết.
- Mỗi lần cập nhật report chỉ thêm delta của công việc hiện tại, kết quả kiểm tra và việc còn lại; không viết lại lịch sử cũ.
- Phản hồi cuối ưu tiên: kết quả, file thay đổi, kiểm tra đã chạy, rủi ro/blocker. Không kể lại toàn bộ quá trình.

## 3. Quy trình làm việc tối thiểu

1. Kiểm tra `git status --short` và giữ nguyên thay đổi không thuộc yêu cầu.
2. Xác định phạm vi và file nguồn có thẩm quyền.
3. Đối chiếu frontend route/service/type với backend route/request/resource/service khi công việc liên quan API.
4. Thực hiện thay đổi nhỏ nhất đáp ứng yêu cầu; không mở rộng sang phase khác.
5. Chạy kiểm tra tương ứng với phần đã chạm.
6. Cập nhật tài liệu nguồn sự thật nếu trạng thái dự án thay đổi lâu dài.
7. Dừng đúng điểm bàn giao người dùng yêu cầu.

## 4. Ràng buộc dự án

- Không tạo lại frontend/backend hiện có.
- Không dùng `migrate:fresh`, không xóa dữ liệu và không đổi schema/API contract nếu chưa có yêu cầu rõ ràng.
- Không tin giá, tồn kho, giảm giá, phí vận chuyển hoặc tổng tiền do frontend gửi lên.
- Không hard-code API URL rải rác; dùng cấu hình tập trung hiện có.
- Không log token, password, secret ngân hàng hoặc stack trace cho người dùng.
- Không đưa file ngoài phạm vi vào commit. Stage bằng đường dẫn cụ thể và kiểm tra staged diff trước khi commit.

## 5. Kiểm tra chuẩn

Frontend:

```powershell
cd D:\Project\frontend
npm.cmd run lint
npm.cmd run build
```

Backend:

```powershell
cd D:\Project\backend
& 'C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe' artisan test
```

Chỉ báo `passed` khi lệnh đã chạy thành công trong lượt hiện tại; nếu dùng kết quả lịch sử phải ghi ngày và nguồn report.
