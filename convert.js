/* Google Docs API JSON (documents.get, includeTabsContent) -> compact reader model.
   Shared by the page (live data) and by the snapshot build step, so both always match. */
(function (root) {
  "use strict";

  var ORDERED = { DECIMAL: 1, ZERO_DECIMAL: 1, ALPHA: 1, UPPER_ALPHA: 1, ROMAN: 1, UPPER_ROMAN: 1 };

  function hex(c) {
    if (!c || !c.color || !c.color.rgbColor) return null;
    var r = c.color.rgbColor;
    var to = function (v) { var n = Math.round((v || 0) * 255); return (n < 16 ? "0" : "") + n.toString(16); };
    var h = "#" + to(r.red) + to(r.green) + to(r.blue);
    return h;
  }

  function roman(n) {
    var m = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
    var s = "";
    m.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }
  function alpha(n) {
    var s = "";
    while (n > 0) { n--; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); }
    return s;
  }
  function glyph(type, n) {
    switch (type) {
      case "DECIMAL": return String(n);
      case "ZERO_DECIMAL": return (n < 10 ? "0" : "") + n;
      case "ALPHA": return alpha(n);
      case "UPPER_ALPHA": return alpha(n).toUpperCase();
      case "ROMAN": return roman(n);
      case "UPPER_ROMAN": return roman(n).toUpperCase();
    }
    return String(n);
  }

  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  function sameStyle(a, b) {
    return a.b === b.b && a.i === b.i && a.u === b.u && a.s === b.s && a.c === b.c && a.bg === b.bg && a.a === b.a && !a.rl && !b.rl && !a.img && !b.img;
  }

  function convertParagraph(p, ctx) {
    var runs = [];
    var big = false;
    (p.elements || []).forEach(function (e) {
      var run = null;
      if (e.textRun) {
        var ts = e.textRun.textStyle || {};
        var t = e.textRun.content || "";
        run = { t: t };
        if (ts.bold) run.b = 1;
        if (ts.italic) run.i = 1;
        if (ts.strikethrough) run.s = 1;
        if (ts.link) {
          var l = ts.link;
          if (l.url) run.a = l.url;
          else if (l.tabId) run.a = "#tab:" + l.tabId;
          else if (l.headingId || l.bookmarkId) run.a = "#here";
        } else {
          if (ts.underline) run.u = 1;
          var fg = hex(ts.foregroundColor);
          if (fg && fg !== "#000000") run.c = fg;
        }
        var bg = hex(ts.backgroundColor);
        if (bg && bg !== "#ffffff") run.bg = bg;
        if (ts.fontSize && ts.fontSize.magnitude >= 18 && t.trim()) big = true;
      } else if (e.richLink) {
        var rp = e.richLink.richLinkProperties || {};
        run = { t: rp.title || rp.uri || "Liên kết", a: rp.uri || "", rl: 1 };
        if (rp.mimeType) run.m = rp.mimeType;
      } else if (e.person) {
        var pp = e.person.personProperties || {};
        run = { t: pp.name || pp.email || "", b: 1 };
      } else if (e.dateElement) {
        var dp = e.dateElement.dateElementProperties || {};
        run = { t: dp.displayText || "" };
      } else if (e.inlineObjectElement) {
        run = { t: "", img: 1 };
      } else if (e.horizontalRule) {
        run = { t: "\n", hr: 1 };
      } else if (e.pageBreak || e.columnBreak || e.footnoteReference || e.autoText) {
        run = null;
      } else if (e.equation) {
        run = { t: "[công thức]" };
      }
      if (!run) return;
      var prev = runs[runs.length - 1];
      if (prev && sameStyle(prev, run) && !run.hr && !prev.hr) prev.t += run.t;
      else runs.push(run);
    });
    // trim trailing paragraph newline
    if (runs.length) {
      var last = runs[runs.length - 1];
      last.t = last.t.replace(/\n$/, "");
      if (!last.t && !last.rl && !last.img && !last.hr) runs.pop();
    }
    runs.forEach(function (r) { r.t = r.t.replace(/\u000b/g, "\n"); });
    var blk = { r: runs };
    var ps = p.paragraphStyle || {};
    var nst = ps.namedStyleType || "";
    if (nst === "TITLE") blk.h = 1;
    else if (nst === "SUBTITLE") blk.h = 3;
    else if (/^HEADING_\d$/.test(nst)) blk.h = Math.min(4, +nst.slice(8) + 1);
    if (big && !blk.h) blk.big = 1;
    if (ps.alignment === "CENTER") blk.al = "c";
    else if (ps.alignment === "END") blk.al = "r";
    if (p.bullet) {
      var lvl = p.bullet.nestingLevel || 0;
      var lid = p.bullet.listId;
      var lst = ctx.lists[lid];
      var nl = lst && lst.listProperties && lst.listProperties.nestingLevels && lst.listProperties.nestingLevels[lvl] || {};
      var mark = "•";
      if (ORDERED[nl.glyphType]) {
        var cnt = ctx.counters[lid] || (ctx.counters[lid] = []);
        cnt[lvl] = (cnt[lvl] || (nl.startNumber ? nl.startNumber - 1 : 0)) + 1;
        cnt.length = lvl + 1;
        var g = glyph(nl.glyphType, cnt[lvl]);
        var fmt = nl.glyphFormat || ("%" + lvl + ".");
        mark = fmt.replace(new RegExp("%" + lvl, "g"), g).replace(/%\d/g, "");
        if (!mark.trim()) mark = g + ".";
      } else if (nl.glyphSymbol) {
        mark = nl.glyphSymbol;
        if (ctx.counters[lid]) ctx.counters[lid].length = lvl + 1;
      } else if (lvl % 3 === 1) mark = "◦";
      else if (lvl % 3 === 2) mark = "▪";
      blk.li = lvl;
      blk.m = mark;
    }
    return blk;
  }

  function convertContent(content, ctx, out) {
    (content || []).forEach(function (el) {
      if (el.paragraph) out.push(convertParagraph(el.paragraph, ctx));
      else if (el.table) {
        var rows = (el.table.tableRows || []).map(function (row) {
          return (row.tableCells || []).map(function (cell) {
            var inner = [];
            convertContent(cell.content, ctx, inner);
            return inner;
          });
        });
        out.push({ tb: rows });
      } else if (el.tableOfContents) {
        convertContent(el.tableOfContents.content, ctx, out);
      }
    });
    return out;
  }

  function stripBlank(blocks) {
    // collapse runs of 3+ empty paragraphs into 2, drop leading/trailing empties
    var out = [], empties = 0;
    blocks.forEach(function (b) {
      var empty = !b.tb && (!b.r || !b.r.length);
      if (empty) { empties++; if (empties > 2) return; } else empties = 0;
      out.push(b);
    });
    while (out.length && !out[0].tb && !out[0].r.length) out.shift();
    while (out.length && !out[out.length - 1].tb && !out[out.length - 1].r.length) out.pop();
    return out;
  }

  function findDoc(x) {
    if (!x) return null;
    if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { return null; } }
    if (typeof x !== "object") return null;
    if (Array.isArray(x.tabs) || (x.body && x.documentId)) return x;
    var keys = ["content", "document", "result", "data", "structuredContent"];
    for (var i = 0; i < keys.length; i++) {
      if (x[keys[i]]) { var d = findDoc(x[keys[i]]); if (d) return d; }
    }
    if (Array.isArray(x)) {
      for (var j = 0; j < x.length; j++) {
        var c = x[j];
        var d2 = findDoc(c && c.text !== undefined ? c.text : c);
        if (d2) return d2;
      }
    }
    return null;
  }

  function convert(raw, fetchedAt) {
    var doc = findDoc(raw);
    if (!doc) throw new Error("Không đọc được dữ liệu tài liệu");
    var tabsIn = doc.tabs;
    if (!tabsIn || !tabsIn.length) {
      tabsIn = [{ tabProperties: { tabId: "t.0", title: doc.title || "Tài liệu" }, documentTab: { body: doc.body, lists: doc.lists } }];
    }
    var tabs = [];
    (function walk(list, parent, depth) {
      list.forEach(function (t) {
        var p = t.tabProperties || {};
        var dt = t.documentTab || {};
        var ctx = { lists: dt.lists || {}, counters: {} };
        var blocks = stripBlank(convertContent(dt.body && dt.body.content, ctx, []));
        var tab = { id: p.tabId, title: (p.title || "Không tên").trim(), parent: parent, depth: depth, blocks: blocks };
        if (p.iconEmoji) tab.emoji = p.iconEmoji;
        tab.hash = hash(JSON.stringify(blocks));
        tabs.push(tab);
        walk(t.childTabs || [], p.tabId, depth + 1);
      });
    })(tabsIn, null, 0);
    return { v: 1, docId: doc.documentId, title: doc.title || "", fetchedAt: fetchedAt || Date.now(), tabs: tabs };
  }

  var api = { convert: convert, hash: hash, findDoc: findDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DocConvert = api;
})(typeof window !== "undefined" ? window : this);
