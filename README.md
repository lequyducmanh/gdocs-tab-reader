# gdocs-tab-reader

Trình đọc Google Docs nhiều tab, dựng cho kho tài liệu dự án **Vinhomes Global Gate Hạ Long**. Một file Google Docs có hàng trăm tab mở chậm và khó tìm. Trang này mở nhanh, tìm được trên mọi tab, và xem link Drive/PDF/ảnh ngay tại chỗ.

## Tính năng

- **Đủ cây tab của Google Docs.** Các tab theo ngày hiển thị dạng lịch trong thanh bên (07 · T7, 09 · T2…).
- **Tìm kiếm trên mọi tab, gõ không dấu cũng được.** Bấm vào kết quả là nhảy tới đúng đoạn văn.
- **Báo tab mới / tab vừa sửa.** Trang tự kiểm tra Google Docs mỗi 2 phút và hiện thông báo khi có tab mới.
- **Link mở xổ xuống ngay trong trang:**
  - Thư mục Drive: duyệt thư mục con
  - Ảnh, PDF, Google Slides: xem tại chỗ, phóng to bằng 2 ngón tay (trackpad / màn hình cảm ứng), kéo để di chuyển
  - Video, Google Docs, Google Sheets, file Word/Excel/PowerPoint
  - Link Facebook, YouTube, Canva: hiện thẻ link để sao chép, chỉ mở tab mới khi bấm nút
- **Thanh tiến trình khi tải file.** Số MB là ước tính, vì connector không báo số byte đã tải.
- **Thư viện tài nguyên.** Gom mọi link của tài liệu, bỏ trùng, lọc theo loại.
- **Mở nhiều tài liệu.** Dán link Google Docs khác vào, có lịch sử (tên + link) để mở lại.
- **Tiện ích đọc:** chế độ sáng/tối (mặc định sáng), ẩn/hiện thanh điều hướng, chỉnh cỡ chữ, phím tắt.

## Cấu trúc

| File | Vai trò |
|---|---|
| `index.html` | Toàn bộ giao diện và logic (HTML + CSS + JS, không cần build) |
| `convert.js` | Chuyển JSON của Google Docs API (`documents.get`, có tabs) sang mô hình gọn để hiển thị. Trang web và bước tạo bản lưu dùng chung file này |
| `snapshot.json` | Bản lưu của tài liệu gốc, giúp trang mở ngay khi chưa kịp đọc dữ liệu trực tiếp |
| `config.js` | Cấu hình bản web: địa chỉ máy chủ Apps Script |
| `apps-script/` | Mã máy chủ Apps Script cho bản GitHub Pages (`Code.gs`, `Convert.gs`, `appsscript.json`) |

## Cách chạy

Trang được viết để chạy như một **Claude artifact**. Đọc trực tiếp Google Docs/Drive, đồng bộ cho cả nhóm và lưu lịch sử chung đều dùng các khả năng của artifact (`window.claude.use("mcp")`, `use("db")`), nên cần:

- Kết nối **Google Docs** và **Google Drive** trong claude.ai → Settings → Connectors.
- Artifact khai báo các capability: `mcp` (Google Docs: `read_doc`; Google Drive: `search_files`, `get_file_metadata`, `download_file_content`, `read_file_content`), `db`, `user`.

### Bản GitHub Pages

Ngoài Claude không có connector. Vì vậy bản web dùng một **máy chủ nhỏ trên Google Apps Script** (miễn phí, chạy bằng tài khoản Google của bạn) để:
- mở **từng cấp thư mục Drive** ngay trong trang;
- **tự cập nhật** khi file Google Docs có tab mới (kiểm tra mỗi 2 phút);
- mở được cả tài liệu Google Docs khác dán vào, có đủ tab và tìm kiếm.

Máy chủ chỉ trả về những gì đang chia sẻ **"Bất kỳ ai có đường liên kết"**. File riêng tư trong Drive không bị lộ.

**Cài đặt (khoảng 5 phút, làm một lần):**
1. Vào https://script.google.com → **Dự án mới**. Đặt tên `gdocs-tab-reader`.
2. Dán nội dung `apps-script/Code.gs` vào file `Code.gs`.
3. Bấm **+** → *Tập lệnh* → đặt tên `Convert`, rồi dán nội dung `apps-script/Convert.gs`.
4. ⚙️ **Cài đặt dự án** → bật *Hiển thị tệp kê khai "appsscript.json"*. Mở `appsscript.json` và dán nội dung `apps-script/appsscript.json`.
5. Chọn hàm `testSetup` → **Chạy** → cấp quyền (Nâng cao → Đi tới dự án). Nhật ký báo `OK: … · 100 tab` là được.
6. **Triển khai** → *Triển khai mới* → loại **Ứng dụng web**: *Thực thi với tư cách* **Tôi**, *Ai có quyền truy cập* **Bất kỳ ai** → Triển khai → sao chép địa chỉ `…/exec`.
7. Dán địa chỉ đó vào `config.js` (trường `api`) rồi đẩy lên GitHub. Cách khác: dán vào ô *Máy chủ cho bản web* trong cửa sổ "Đổi tài liệu" của trang (chỉ lưu trên trình duyệt đó).

Chưa cài máy chủ thì bản web vẫn hiển thị bản lưu `snapshot.json`, và link mở bằng trình xem nhúng của Google, YouTube, Canva, Facebook. Riêng thư mục con sẽ mở ra tab mới.

### Tạo lại bản lưu

```bash
# raw.json = kết quả Google Docs API documents.get (includeTabsContent=true)
node -e 'const C=require("./convert.js"),fs=require("fs");fs.writeFileSync("snapshot.json",JSON.stringify(C.convert(JSON.parse(fs.readFileSync("raw.json","utf8")))))'
```

## Ghi chú

- PDF được dựng bằng [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174, tải từ cdnjs.
- `snapshot.json` chứa nội dung tài liệu nội bộ. Giữ repo ở chế độ **private** nếu không muốn công khai.
