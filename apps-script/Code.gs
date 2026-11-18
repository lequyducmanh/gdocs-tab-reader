/**
 * gdocs-tab-reader · máy chủ nhỏ cho bản GitHub Pages
 *
 * Trang web gọi địa chỉ Web App này để:
 *   ?action=doc&id=<Google Doc ID>      đọc tài liệu (đủ các tab), trả về mô hình gọn của convert.js
 *   ?action=list&id=<Folder ID>         liệt kê thư mục Drive (thư mục con + file)
 *   ?action=meta&id=<File ID>           thông tin một file (tên, loại, dung lượng)
 *
 * An toàn: script chạy bằng tài khoản của người triển khai, nên CHỈ trả về những gì
 * đang chia sẻ "Bất kỳ ai có đường liên kết" (bản thân nó, hoặc một thư mục chứa nó).
 * File riêng tư trong Drive của bạn không bao giờ bị lộ qua địa chỉ này.
 */

var MAX_ITEMS = 400;      // số mục tối đa trả về cho một thư mục
var PARENT_DEPTH = 6;     // số cấp thư mục cha được dò khi kiểm tra quyền chia sẻ

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    if (p.action === 'doc') out = getDoc_(p.id);
    else if (p.action === 'list') out = listFolder_(p.id);
    else if (p.action === 'meta') out = fileMeta_(p.id);
    else out = { ok: true, service: 'gdocs-tab-reader', time: new Date().toISOString() };
  } catch (err) {
    out = { error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- quyền chia sẻ ---------- */
function isOpen_(item) {
  try {
    var a = item.getSharingAccess();
    return a === DriveApp.Access.ANYONE_WITH_LINK || a === DriveApp.Access.ANYONE;
  } catch (e) { return false; }
}
function reachable_(item) {
  if (isOpen_(item)) return true;
  var level = [item];
  for (var d = 0; d < PARENT_DEPTH && level.length; d++) {
    var next = [];
    for (var i = 0; i < level.length; i++) {
      var it = level[i].getParents();
      while (it.hasNext()) {
        var parent = it.next();
        if (isOpen_(parent)) return true;
        next.push(parent);
      }
    }
    level = next;
  }
  return false;
}
function checkId_(id) {
  if (!id || !/^[\w-]{10,}$/.test(id)) throw new Error('bad_id');
  return id;
}

/* ---------- tài liệu ---------- */
function getDoc_(id) {
  checkId_(id);
  var file = DriveApp.getFileById(id);
  if (!reachable_(file)) throw new Error('not_public');
  var raw = Docs.Documents.get(id, { includeTabsContent: true });
  // Docs.Documents.get trả đối tượng Apps Script; chuyển qua JSON để có dạng giống REST API
  raw = JSON.parse(JSON.stringify(raw));
  return DocConvert.convert(raw, Date.now());
}

/* ---------- thư mục ---------- */
function listFolder_(id) {
  checkId_(id);
  var folder = DriveApp.getFolderById(id);
  if (!reachable_(folder)) throw new Error('not_public');
  var files = [];
  var subs = folder.getFolders();
  while (subs.hasNext() && files.length < MAX_ITEMS) {
    var f = subs.next();
    files.push({ id: f.getId(), title: f.getName(), mimeType: 'application/vnd.google-apps.folder', modifiedTime: f.getLastUpdated().toISOString() });
  }
  var it = folder.getFiles();
  while (it.hasNext() && files.length < MAX_ITEMS) {
    var x = it.next();
    files.push(fileInfo_(x));
  }
  return { id: id, title: folder.getName(), files: files, truncated: subs.hasNext() || it.hasNext() };
}

function fileInfo_(x) {
  var o = { id: x.getId(), title: x.getName(), mimeType: x.getMimeType(), modifiedTime: x.getLastUpdated().toISOString() };
  try { var s = x.getSize(); if (s) o.fileSize = String(s); } catch (e) {}
  o.viewUrl = x.getUrl();
  return o;
}

function fileMeta_(id) {
  checkId_(id);
  var x;
  try { x = DriveApp.getFileById(id); } catch (e) { x = DriveApp.getFolderById(id); return { id: id, title: x.getName(), mimeType: 'application/vnd.google-apps.folder' }; }
  if (!reachable_(x)) throw new Error('not_public');
  return fileInfo_(x);
}

/* Chạy thử trong trình soạn thảo: chọn hàm này rồi bấm Run để cấp quyền lần đầu. */
function testSetup() {
  var r = getDoc_('1lH8WpFHtnjkxImlivvNNud97OTcR0wWQhEFXgB09rUE');
  Logger.log('OK: ' + r.title + ' · ' + r.tabs.length + ' tab');
}
