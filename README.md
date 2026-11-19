# gdocs-tab-reader

Trình đọc Google Docs nhiều tab và thư mục Google Drive, dựng cho kho tài liệu dự án **Vinhomes Global Gate Hạ Long**. Một file Google Docs có hàng trăm tab mở chậm và khó tìm. Trang này mở nhanh, tìm được trên mọi tab, và xem link Drive/PDF/ảnh ngay tại chỗ. Dán link thư mục Drive thì trang chuyển sang giao diện thư mục, mở từng cấp ngay trong trang.

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
- **Dán link là mở.** Ô "Thêm link" tự nhận loại khi dán và lấy tên thật từ Drive:
  - link Google Docs → trình đọc nhiều tab;
  - link thư mục Drive → giao diện thư mục;
  - link một file → khung xem lớn.
- **Giao diện thư mục:**
  - Thanh bên là cây thư mục. Vùng giữa có các thư mục con xổ xuống từng cấp, kèm đường dẫn "Gốc › …".
  - Lọc theo loại (ảnh, video, PDF, tài liệu). Sắp xếp theo tên, ngày hoặc dung lượng. Xem dạng danh sách hoặc lưới.
  - Tìm tên file tức thì trong các thư mục đã mở. Nút "Tìm trong mọi thư mục con" quét toàn bộ cây.
  - Chọn nhiều file để sao chép link một lần.
  - Google Docs trong thư mục xổ xuống đọc tại chỗ.
  - Trang nhớ các thư mục đang mở của từng thư mục gốc.
  - Link dạng `…/#f-<id thư mục>` mở thẳng thư mục đó.
- **Khung xem lớn.** Bấm một file (ảnh, PDF, video, Sheets, Slides) để mở gần kín màn hình:
  - lướt sang file khác bằng ← →, phím mũi tên hoặc vuốt;
  - phóng to bằng 2 ngón;
  - Esc để đóng.
  File đã tải được giữ trong bộ nhớ, nên quay lại xem tiếp ngay. File trong thư mục xổ xuống từ tài liệu cũng mở bằng khung này.
- **Đăng nhập Google trên bản web.** Mỗi người xem được cả những file chỉ chia sẻ riêng cho họ (xem mục "Đăng nhập Google trên bản web").
- **Lịch sử riêng từng người.** Lịch sử tài liệu và thư mục lưu trên trình duyệt (localStorage), người khác không thấy. "Xuất danh sách" và "Nhập danh sách" (file JSON) dùng để chuyển sang máy khác hoặc gửi bộ link cho đồng nghiệp. Tài liệu dự án gốc luôn được ghim sẵn.
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

Trang được viết để chạy như một **Claude artifact**. Đọc trực tiếp Google Docs/Drive và đồng bộ nội dung tài liệu cho cả nhóm đều dùng các khả năng của artifact (`window.claude.use("mcp")`, `use("db")`), nên cần:

- Kết nối **Google Docs** và **Google Drive** trong claude.ai → Settings → Connectors.
- Artifact khai báo các capability: `mcp` (Google Docs: `read_doc`; Google Drive: `search_files`, `get_file_metadata`, `download_file_content`, `read_file_content`), `db`, `user`, `downloads`.

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

Chưa cài máy chủ thì bản web vẫn hiển thị bản lưu `snapshot.json`, và link mở bằng trình xem nhúng của Google, YouTube, Canva, Facebook. Thư mục có trong `drive-index.json` vẫn mở từng cấp ngay trong trang. File này là bản quét tạo từ trang Claude: Thư viện tài nguyên → "Tải file cho bản web". Thư mục chưa có trong bản quét sẽ hiện bằng trình xem nhúng của Google Drive.

### Đăng nhập Google trên bản web

Không phải file nào cũng chia sẻ công khai. Có nút **Đăng nhập** thì mỗi người vào trang tự đăng nhập Google của mình. Trang gọi thẳng Google Drive API và Google Docs API bằng tài khoản đó, nên:
- người xem thấy đúng những file, thư mục **được chia sẻ cho chính họ**, không ai thấy hơn quyền của mình;
- tài liệu Google Docs đọc trực tiếp, có đủ tab, tự cập nhật mỗi 2 phút;
- thư mục xổ từng cấp, ảnh, PDF, video, Sheets, Slides mở trong khung xem lớn, giống bản Claude;
- quyền chỉ là **xem** (`drive.readonly`, `documents.readonly`). Mã truy cập lưu trên trình duyệt khoảng 1 giờ rồi hết hạn. "Đăng xuất" thu hồi mã ngay.

Chưa đăng nhập thì trang chạy như cũ: bản lưu, bản quét `drive-index.json`, trình xem nhúng của Google.

**Cài đặt (khoảng 10 phút, làm một lần), tại https://console.cloud.google.com:**
1. Tạo dự án mới, ví dụ `kho-tai-lieu`.
2. **APIs & Services → Library**: bật **Google Drive API** và **Google Docs API**.
3. **Google Auth Platform** (OAuth consent screen) → *Get started*. Tên ứng dụng: `Kho tài liệu dự án`; email hỗ trợ: email của bạn.
   - *Audience*: tài khoản Google Workspace của công ty → chọn **Internal**. Chỉ người trong công ty đăng nhập được, không cần Google duyệt.
   - Gmail cá nhân → chọn **External**, để ở chế độ *Testing*, rồi thêm email từng người vào **Test users** (tối đa 100 người). Họ sẽ thấy cảnh báo "Google chưa xác minh ứng dụng này", bấm *Tiếp tục* là được.
4. **Data access → Add or remove scopes**: thêm `.../auth/drive.readonly` và `.../auth/documents.readonly`.
5. **Clients → Create client** → loại **Web application**. Ở *Authorized JavaScript origins* thêm `https://lequyducmanh.github.io`. Không cần *redirect URI*.
6. Sao chép **Client ID** (dạng `….apps.googleusercontent.com`), dán vào `config.js` ở trường `googleClientId`, rồi đẩy lên GitHub.

Client ID không phải mật khẩu, để công khai trong `config.js` là bình thường. Google chỉ chấp nhận nó từ địa chỉ đã khai ở bước 5.

### Tạo lại bản lưu

```bash
# raw.json = kết quả Google Docs API documents.get (includeTabsContent=true)
node -e 'const C=require("./convert.js"),fs=require("fs");fs.writeFileSync("snapshot.json",JSON.stringify(C.convert(JSON.parse(fs.readFileSync("raw.json","utf8")))))'
```

## Ghi chú

- PDF được dựng bằng [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174, tải từ cdnjs.
- `snapshot.json` chứa nội dung tài liệu nội bộ. Giữ repo ở chế độ **private** nếu không muốn công khai.
