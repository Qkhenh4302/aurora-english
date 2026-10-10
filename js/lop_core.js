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
  function parse(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function ymOf(s) { return String(s).slice(0, 7); }
  function ymAdd(ym, n) { var d = parse(ym + '-01'); d.setMonth(d.getMonth() + n); return iso(d).slice(0, 7); }
  function monthDays(ym) { var d = parse(ym + '-01'), out = []; while (iso(d).slice(0, 7) === ym) { out.push(iso(d)); d.setDate(d.getDate() + 1); } return out; }
  function dow(s) { return parse(s).getDay(); }
  function hm(t) { var p = String(t || '').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function timeTxt(t) { var p = String(t).split(':'), h = +p[0], m = p[1]; return h + 'h' + (m && m !== '00' ? m : ''); }

  /* Các buổi học của một lớp trong khoảng ngày [a, b] (gồm buổi cố định, buổi học thêm, đánh dấu buổi nghỉ) */
  function sessions(cls, cd, a, b) {
    cd = cd || {}; var out = [], seen = {}, d = parse(a), end = parse(b);
    while (d <= end) {
      var s = iso(d), w = d.getDay();
      (cls.slots || []).forEach(function (sl) {
        if (+sl.dow !== w || (sl.from && s < sl.from) || (sl.to && s > sl.to)) return;
        var k = s + '@' + sl.start; if (seen[k]) return; seen[k] = 1;
        out.push({ key: k, date: s, start: sl.start, end: sl.end, off: !!(cd.off && cd.off[k] != null), note: cd.off && cd.off[k] || '', extra: false });
      });
      d.setDate(d.getDate() + 1);
    }
    Object.keys(cd.extra || {}).forEach(function (k) {
      var s = k.split('@')[0]; if (s < a || s > b || seen[k]) return; seen[k] = 1;
      var x = cd.extra[k] || {}; out.push({ key: k, date: s, start: k.split('@')[1], end: x.end || '', off: !!(cd.off && cd.off[k] != null), note: x.note || (cd.off && cd.off[k]) || '', extra: true });
    });
    return out.sort(function (x, y) { return x.date < y.date ? -1 : x.date > y.date ? 1 : hm(x.start) - hm(y.start); });
  }
  function monthSessions(cls, cd, ym) { var ds = monthDays(ym); return sessions(cls, cd, ds[0], ds[ds.length - 1]); }
  function activeOn(st, date) { return (!st.joined || date >= st.joined) && (!st.left || date <= st.left); }
  function priceOf(cls, st) { return +(st && st.price) || +cls.price || 0; }
  function mark(cd, key, sid) { var r = cd && cd.att && cd.att[key]; return r && r[sid] != null ? r[sid] : null; }
  function firstMonth(cls) { var f = null; (cls.slots || []).forEach(function (s) { if (s.from && (!f || s.from < f)) f = s.from; }); (cls.students || []).forEach(function (s) { if (s.joined && (!f || s.joined < f)) f = s.joined; }); return ymOf(f || iso(new Date())); }

  /* Các khoản phải đóng của một học sinh (đến hết tháng `untilYm`) */
  function periods(cls, cd, st, today, untilYm) {
    cd = cd || {}; var b = cls.billing || {}, price = priceOf(cls, st), out = [], ymNow = untilYm || ymOf(today);
    if (b.mode === 'pack') {
      var size = Math.max(1, +b.size || 5), from = firstMonth(cls) + '-01', to = monthDays(ymNow).pop();
      var att = sessions(cls, cd, from, to).filter(function (s) { return !s.off && mark(cd, s.key, st.id) === 1; });
      var chunks = []; for (var i = 0; i < att.length; i += size) chunks.push(att.slice(i, i + size));
      chunks.forEach(function (ch, i) {
        var full = ch.length === size, before = b.when === 'before';
        if (!full && !before) return;
        out.push({ id: 'P' + (i + 1), kind: 'pack', label: 'Gói ' + (i + 1) + ' (' + size + ' buổi)', n: before ? size : ch.length, amount: size * price,
          dates: ch.map(function (s) { return s.date; }), due: addDays(before ? ch[0].date : ch[ch.length - 1].date, +b.grace || 0), done: ch.length, size: size });
      });
      var rest = att.length % size; out.progress = { done: rest, size: size, next: rest ? null : null };
      return out;
    }
    var ym = firstMonth(cls);
    while (ym <= ymNow) {
      var snap = cd.closed && cd.closed[ym] && cd.closed[ym].snap && cd.closed[ym].snap[st.id], n = 0, dates = [];
      monthSessions(cls, cd, ym).forEach(function (s) { if (!s.off && mark(cd, s.key, st.id) === 1) { n++; dates.push(s.date); } });
      var amt = snap ? snap.amount : n * price;
      if (snap) n = snap.n;
      if (n > 0 || amt > 0) out.push({ id: ym, kind: 'month', label: 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4), n: n, amount: amt, dates: dates, due: ymAdd(ym, 1) + '-' + pad(Math.min(28, +b.dueDay || 5)), closed: !!snap, price: price });
      ym = ymAdd(ym, 1);
    }
    return out;
  }
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
  var API = { DOWS: DOWS, DOWS_S: DOWS_S, iso: iso, parse: parse, addDays: addDays, ymOf: ymOf, ymAdd: ymAdd, monthDays: monthDays, dow: dow, hm: hm, timeTxt: timeTxt,
    sessions: sessions, monthSessions: monthSessions, activeOn: activeOn, priceOf: priceOf, mark: mark, periods: periods, ledger: ledger, firstMonth: firstMonth };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else { root.LN = root.LN || {}; root.LN.lopCore = API; }
})(this);
