/* ================= Lớp học – lịch, điểm danh, học phí (phần tính toán) =================
   Dữ liệu (đồng bộ lên mạng như các dữ liệu khác của lớp):
   - ln_classes            : { id: lớp }   lớp = { id, name, grade, color, price, billing:{mode:'month'|'pack', size, dueDay, grace, when}, slots:[{dow,start,end,from,to}], students:[{id,name,user,joined,left,price}], archived }
   - ln_cl_<id>            : { att:{ 'YYYY-MM-DD@HH:MM': { sid: 1 có mặt | 0 vắng | 2 vắng có phép } }, off:{ key: lý do nghỉ }, extra:{ key:{end,note} }, closed:{ 'YYYY-MM': {at, by, snap:{sid:{n,amount}}} } }
   - ln_pay                : { sid: [ {id, date, amount, method, note, at} ] }
   Lịch cố định có ngày hiệu lực (from/to): đổi lịch chỉ áp dụng từ một ngày → các tháng cũ giữ nguyên. */
(function (root) {
  var DOWS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'], DOWS_S = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1), 12); }
  function addDays(s, n) { var d = parse(s); d.setHours(12); d.setDate(d.getDate() + n); return iso(d); }
  function ymOf(s) { return String(s).slice(0, 7); }
  function ymAdd(ym, n) { var d = parse(ym + '-01'); d.setMonth(d.getMonth() + n); return iso(d).slice(0, 7); }
  function monthDays(ym) { var d = parse(ym + '-01'), out = []; while (iso(d).slice(0, 7) === ym) { out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
  function dow(s) { return parse(s).getDay(); }
  function hm(t) { var p = String(t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function timeTxt(t) { var p = String(t).split(':'), h = +p[0], m = p[1]; return h + 'h' + (m && m !== '00' ? m : ''); }

  /* Các buổi học của một lớp trong khoảng ngày [a, b] (gồm buổi cố định, buổi học thêm, đánh dấu buổi nghỉ) */
  function sessions(cls, cd, a, b) {
    cd = cd || {}; var out = [], seen = {}, d = parse(a), guard = 0;
    while (iso(d) <= b && guard++ < 4000) {
      var s = iso(d), w = d.getDay();
      (cls.slots || []).forEach(function (sl) {
        if (+sl.dow !== w || (sl.from && s < sl.from) || (sl.to && s > sl.to)) return;
        var k = s + '@' + sl.start; if (seen[k]) return; seen[k] = 1;
        out.push({ key: k, date: s, start: sl.start, end: sl.end, off: !!(cd.off && cd.off[k] != null), note: cd.off && cd.off[k] || '', extra: false });
      });
      d = parse(addDays(iso(d), 1));
    }
    Object.keys(cd.extra || {}).forEach(function (k) {
      var s = k.split('@')[0]; if (s < a || s > b || seen[k]) return; seen[k] = 1;
      var x = cd.extra[k]; if (!x) return; out.push({ key: k, date: s, start: k.split('@')[1], end: x.end || '', off: !!(cd.off && cd.off[k] != null), note: x.note || (cd.off && cd.off[k]) || '', extra: true });
    });
    return out.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : hm(x.start) - hm(y.start); });
  }
  function monthSessions(cls, cd, ym) { var ds = monthDays(ym); return sessions(cls, cd, ds[0], ds[ds.length - 1]); }
  function activeOn(st, date) { return (!st.joined || date >= st.joined) && (!st.left || date <= st.left); }
  /* Giá mỗi buổi tại một ngày: giá riêng của bé > lịch sử đổi giá của lớp (áp dụng từ ngày) > giá lớp */
  function hist(list, date, base) {
    var v = base; (list || []).slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; }).forEach(function (x) { if (!date || x.from <= date) v = x.price; });
    return v;
  }
  function priceOf(cls, st, date) {
    var sp = st ? hist(st.prices, date, +st.price || 0) : 0;   // giá riêng (null/0 = theo giá lớp)
    if (+sp > 0) return +sp;
    return +hist(cls.prices, date, +cls.price || 0) || 0;
  }
  function mark(cd, key, sid) { var r = cd && cd.att && cd.att[key]; return r && r[sid] != null ? r[sid] : null; }
  function firstMonth(cls, today, cd) {
    var f = null; function t(d) { if (d && (!f || d < f)) f = d; }
    (cls.slots || []).forEach(function (s) { t(s.from); }); (cls.students || []).forEach(function (s) { t(s.joined); });
    if (cd) { Object.keys(cd.att || {}).forEach(function (k) { t(k.split('@')[0]); }); Object.keys(cd.extra || {}).forEach(function (k) { if (cd.extra[k]) t(k.split('@')[0]); }); }
    return ymOf(f || today || iso(new Date()));
  }

  /* Các khoản phải đóng của một học sinh (đến hết tháng `untilYm`) */
  function chargeRows(cls, st, charges, ymNow) {
    var b = cls.billing || {};
    return (charges || []).filter(function (c) { return c && c.ym && c.ym <= ymNow && +c.amount; }).map(function (c) {
      return { id: 'C' + c.id, kind: 'charge', ym: c.ym, label: (c.note || 'Nợ cũ') + ' tháng ' + (+c.ym.slice(5)) + '/' + c.ym.slice(0, 4), n: 0, amount: +c.amount, dates: [], due: ymAdd(c.ym, 1) + '-' + pad(Math.min(28, +b.dueDay || 5)), price: 0 };
    });
  }
  function periods(cls, cd, st, today, untilYm, charges) {
    cd = cd || {}; var b = cls.billing || {}, out = chargeRows(cls, st, charges, untilYm || ymOf(today)), ymNow = untilYm || ymOf(today);
    var progress = null;
    if (b.mode === 'pack') {
      var size = Math.max(1, +b.size || 5), from = firstMonth(cls, today, cd) + '-01', to = monthDays(ymNow).pop();
      var att = sessions(cls, cd, from, to).filter(function (s) { return !s.off && activeOn(st, s.date) && mark(cd, s.key, st.id) === 1; });
      progress = { done: att.length % size, size: size, packs: Math.floor(att.length / size) };
      if (b.when === 'before') {
        // thu trước: mỗi gói tính đủ tiền ngay từ buổi đầu của gói, hạn = buổi đầu + số ngày cho phép
        for (var i = 0; i < att.length; i += size) {
          var ch = att.slice(i, i + size), price = priceOf(cls, st, ch[0].date);
          out.push({ id: 'P' + (i / size + 1), kind: 'pack', label: 'Gói ' + (i / size + 1) + ' (' + size + ' buổi, đóng trước)', n: size, amount: size * price, price: price,
            dates: ch.map(function (x) { return x.date; }), due: addDays(ch[0].date, +b.grace || 0), done: ch.length, size: size });
        }
        out.progress = progress; return out;
      }
      // thu sau: tính theo buổi đi học từng tháng (tick buổi nào cộng tiền buổi đó), kèm tiến độ gói để theo dõi
    }
    var ym = firstMonth(cls, today, cd);
    while (ym <= ymNow) {
      var snap = cd.closed && cd.closed[ym] && cd.closed[ym].snap && cd.closed[ym].snap[st.id], n = 0, dates = [], sum = 0, price = 0, parts = [];
      monthSessions(cls, cd, ym).forEach(function (s) {
        if (s.off || !activeOn(st, s.date) || mark(cd, s.key, st.id) !== 1) return;
        n++; dates.push(s.date); price = priceOf(cls, st, s.date); sum += price;
        var pt = parts.filter(function (x) { return x.price === price; })[0]; if (pt) pt.n++; else parts.push({ price: price, n: 1 });
      });
      if (!n) price = priceOf(cls, st, ym + '-28');
      var amt = snap ? snap.amount : sum;
      if (snap) n = snap.n;
      if (n > 0 || amt > 0) out.push({ id: ym, kind: 'month', label: 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4), n: n, parts: parts, amount: amt, dates: dates, due: ymAdd(ym, 1) + '-' + pad(Math.min(28, +b.dueDay || 5)), closed: !!snap, price: price });
      ym = ymAdd(ym, 1);
    }
    if (progress) out.progress = progress;
    return out;
  }
  function partsTxt(r, money) { return (r.parts && r.parts.length ? r.parts : [{ n: r.n, price: r.price }]).map(function (x) { return x.n + ' buổi × ' + money(x.price); }).join(' + '); }
  /* Trừ tiền đã đóng vào các khoản theo thứ tự hạn (khoản cũ trước) */
  function ledger(per, pays, today) {
    pays = (pays || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var paid = pays.reduce(function (s, p) { return s + (+p.amount || 0); }, 0), pool = paid, billed = 0;
    var rows = per.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }).map(function (p) {
      billed += p.amount; var got = Math.min(pool, p.amount); pool -= got; var rem = p.amount - got;
      var st = rem <= 0 ? 'paid' : today > p.due ? 'overdue' : got > 0 ? 'partial' : 'due';
      return Object.assign({}, p, { paid: got, rem: rem, status: st });
    });
    return { rows: rows, paid: paid, billed: billed, debt: Math.max(0, billed - paid), credit: Math.max(0, paid - billed), overdue: rows.filter(function (r) { return r.status === 'overdue'; }).reduce(function (s, r) { return s + r.rem; }, 0), pays: pays };
  }
  /* Phiếu báo tháng: học phí tháng này + nợ các kỳ trước (đã trừ tiền đóng, kỳ cũ trừ trước) */
  function monthReport(cls, cd, st, pays, ym, today, charges) {
    var L = ledger(periods(cls, cd, st, today, ym, charges), pays, today), pack = (cls.billing || {}).mode === 'pack';
    var cur = L.rows.filter(function (r) { return r.kind === 'pack' ? ymOf(r.dates[0]) === ym : r.kind === 'charge' ? r.ym === ym : r.id === ym; });
    var old = L.rows.filter(function (r) { return cur.indexOf(r) < 0 && r.rem > 0; });
    var ss = monthSessions(cls, cd, ym).filter(function (s) { return activeOn(st, s.date); }).map(function (s) { return { date: s.date, start: s.start, off: s.off, v: s.off ? null : mark(cd, s.key, st.id) }; });
    var c = { p: 0, a: 0, e: 0 }; ss.forEach(function (s) { if (s.v === 1) c.p++; else if (s.v === 0) c.a++; else if (s.v === 2) c.e++; });
    var fee = cur.reduce(function (s, r) { return s + r.amount; }, 0), feePaid = cur.reduce(function (s, r) { return s + r.paid; }, 0), feeRem = cur.reduce(function (s, r) { return s + r.rem; }, 0);
    var oldRem = old.reduce(function (s, r) { return s + r.rem; }, 0);
    var due = cur[0] ? cur[0].due : (old[0] ? old[0].due : null);
    var received = (pays || []).filter(function (p) { return String(p.date).slice(0, 7) === ym; }).reduce(function (s, p) { return s + (+p.amount || 0); }, 0);
    var overdue = old.concat(cur).some(function (r) { return r.rem > 0 && today > r.due; });
    return { ym: ym, sessions: ss, count: c, cur: cur, old: old, fee: fee, feePaid: feePaid, feeRem: feeRem, oldRem: oldRem, total: oldRem + feeRem, credit: ym >= ymOf(today) ? L.credit : 0, due: due, L: L, received: received, overdue: overdue,
      price: cur[0] ? cur[0].price : priceOf(cls, st, ym + '-28'), progress: pack ? periods(cls, cd, st, today, ym).progress : null };
  }
  /* Mã VietQR: thêm số tiền + nội dung chuyển khoản vào mã QR gốc của ngân hàng (chuẩn EMVCo/NAPAS) */
  function crc16(s) { var c = 0xFFFF; for (var i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return ('000' + c.toString(16).toUpperCase()).slice(-4); }
  function tlv(s) { var a = [], i = 0; while (i + 4 <= s.length) { var l = +s.substr(i + 2, 2); if (isNaN(l)) break; a.push([s.substr(i, 2), s.substr(i + 4, l)]); i += 4 + l; } return a; }
  function fld(id, v) { return id + ('0' + v.length).slice(-2) + v; }
  function asciiNote(t) { return String(t || '').replace(/Đ/g, 'D').replace(/đ/g, 'd').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 25); }
  function qrValid(s) { s = String(s || '').trim(); return /^000201/.test(s) && s.length > 30 && crc16(s.slice(0, -4)) === s.slice(-4).toUpperCase(); }
  function vietqr(base, amount, note) {
    base = String(base || '').trim(); if (!qrValid(base)) return base;
    amount = Math.round(+amount || 0); note = asciiNote(note);
    var out = '';
    tlv(base).forEach(function (x) {
      if (x[0] === '54' || x[0] === '63') return;
      if (x[0] === '62') { if (!note) out += fld('62', x[1]); return; }
      if (x[0] === '01') x = ['01', amount > 0 ? '12' : x[1]];
      out += fld(x[0], x[1]);
      if (x[0] === '53' && amount > 0) out += fld('54', String(amount));
    });
    if (note) out += fld('62', fld('08', note));
    out += '6304'; return out + crc16(out);
  }
  var API = { DOWS: DOWS, DOWS_S: DOWS_S, iso: iso, parse: parse, addDays: addDays, ymOf: ymOf, ymAdd: ymAdd, monthDays: monthDays, dow: dow, hm: hm, timeTxt: timeTxt,
    sessions: sessions, monthSessions: monthSessions, hist: hist, partsTxt: partsTxt, activeOn: activeOn, priceOf: priceOf, mark: mark, periods: periods, ledger: ledger, firstMonth: firstMonth, monthReport: monthReport, vietqr: vietqr, qrValid: qrValid, crc16: crc16, asciiNote: asciiNote };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else { root.LN = root.LN || {}; root.LN.lopCore = API; }
})(this);
;
(window.LN_V=window.LN_V||{})["lop_core.js"]="b88675ae";
