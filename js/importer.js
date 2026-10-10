/* Trợ lý tự động nạp bài tập — chạy hoàn toàn trên máy, miễn phí, không dùng AI trả phí.
   Đọc chữ từ file (.txt .md .docx .pdf) → tách câu hỏi, lựa chọn A–D, đáp án → gợi ý chủ điểm ngữ pháp bằng luật từ khoá. */
(function () {
  'use strict';
  var LN = window.LN;

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      if (document.querySelector('script[src="' + src + '"]')) { ok(); return; }
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('Không tải được thư viện đọc file (cần có mạng).')); }; document.head.appendChild(s);
    });
  }
  function readAs(file, kind) { return new Promise(function (ok, bad) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = bad; kind === 'buf' ? r.readAsArrayBuffer(file) : r.readAsText(file, 'utf-8'); }); }
  function decodeXml(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); }

  LN.readFileText = function (file) {
    var name = (file.name || '').toLowerCase();
    if (/\.(txt|md|csv)$/.test(name)) return readAs(file, 'text');
    if (/\.docx$/.test(name)) {
      return loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js').then(function () { return readAs(file, 'buf'); }).then(function (buf) { return window.JSZip.loadAsync(buf); })
        .then(function (zip) { return zip.file('word/document.xml').async('string'); })
        .then(function (xml) {
          xml = xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n');
          return decodeXml(xml.replace(/<[^>]+>/g, ''));
        });
    }
    if (/\.pdf$/.test(name)) {
      var base = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
      return loadScript(base + 'pdf.min.js').then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.js';
        return readAs(file, 'buf');
      }).then(function (buf) { return window.pdfjsLib.getDocument({ data: buf }).promise; }).then(function (pdf) {
        var jobs = []; for (var i = 1; i <= pdf.numPages; i++) jobs.push(pdf.getPage(i).then(function (pg) { return pg.getTextContent(); }));
        return Promise.all(jobs).then(function (pages) {
          return pages.map(function (tc) { var out = '', lastY = null; tc.items.forEach(function (it) { var y = it.transform[5]; if (lastY !== null && Math.abs(y - lastY) > 4) out += '\n'; else if (out && !/\s$/.test(out)) out += ' '; out += it.str; lastY = y; }); return out; }).join('\n');
        });
      });
    }
    return Promise.reject(new Error('Chưa đọc được loại file này. Dùng .txt, .docx hoặc .pdf, hoặc dán chữ vào ô bên dưới.'));
  };

  /* ---------- Gợi ý chủ điểm ---------- */
  var RULES = [
    ['cd15', /^\s*(never|rarely|seldom|hardly|scarcely|no sooner|not only|not until|only (when|after|by|then)|little did|under no)/i, 4],
    ['cd5', /\b(is|are|was|were|be|been|being)\s+(\w+ed|built|made|written|done|taken|given|seen|sung|spoken|known|sold|found|told)\b|\bby (him|her|them|the)\b/i, 3],
    ['cd6', /\b(said|told|asked|wondered|reported|explained)\b.*\b(that|if|whether|to)\b|\breported speech|\bgián tiếp/i, 3],
    ['cd4', /\bif\b|\bunless\b|\bwish(es|ed)?\b|would rather|it'?s (high )?time|as if|as though|provided that|suggest(ed|s)? that|insist(ed|s)? that/i, 3],
    ['cd7', /\b(who|whom|whose|which)\b/i, 2],
    ['cd8', /\bthan\b|\bthe (most|least)\b|\bas \w+ as\b|\bthe \w+est\b|\bthe more\b/i, 3],
    ['cd17', /\b(despite|in spite of|so that|in order (to|that)|so as to|such (a|an)?\s*\w+ that|so \w+ that)\b/i, 3],
    ['cd9', /\b(although|though|because|however|therefore|moreover|nevertheless|whereas|both|either|neither)\b/i, 2],
    ['cd12', /\b(much|many|few|a few|little|a little|a lot of|lots of|plenty of|a great deal of|a number of|each|every)\b/i, 1.5],
    ['cd2', /\b(the number of|a number of|each of|neither of|either of|as well as|along with|together with)\b/i, 3],
    ['cd3', /\b(enjoy|avoid|mind|finish|suggest|keep|deny|consider|want|hope|decide|plan|agree|refuse|promise|manage|remember|forget|stop|try|look forward to|used to)\b/i, 1.5],
    ['cd13', /\b(give up|look (after|for|up|forward)|put (off|on|up with)|take (off|after|over)|turn (on|off|up|down)|run out of|get (up|on|over)|carry on|set off|break down|come across|bring up)\b/i, 3],
    ['cd18', /pronounc|stress|underlined|phát âm|trọng âm|gạch chân/i, 5],
    ['cd19', /\b(passage|according to the|the author|the word .* refers to|closest in meaning)\b/i, 4],
    ['cd20', /would you like|do you mind|thank you|how about|why don'?t (you|we)|you'?re welcome|congratulations|sorry/i, 2.5],
    ['cd16', /\b(make|do|take|have|pay)\b.*\b(mistake|decision|homework|housework|attention|photo|care|progress|effort|exercise)\b/i, 3],
    ['cd1', /\b(since|for \d+|already|yet|just|ever|never|ago|yesterday|tomorrow|last (week|year|night|month)|next (week|year)|at the moment|now|right now|by the time|when|while|by next|so far|recently|every (day|morning|week|weekend|sunday|monday)|usually|always|often|sometimes)\b/i, 2],
    ['past', /\b(was|were)\b.*\b(last|yesterday|ago)\b|\bwere you\b/i, 2],
    ['can', /\bcan('t|not)?\b/i, 2],
    ['there', /\bthere (is|are)\b|how many|^\s*there\s+_{2,}/i, 2.5],
    ['there', /^\s*(is|are)?\s*there\s+_{2,}|^\s*_{2,}\s+there\b/i, 4],
    ['be', /^\s*(i|he|she|it|we|you|they|\w+)\s+_{2,}\s+(from|a|an|my|your|years)\b/i, 2]
  ];
  var OPTRULES = [
    ['cd10', function (o) { return o.every(function (x) { return /^(a|an|the|no article|ø|x|–|-|\/)$/i.test(x.trim()); }); }, 6],
    ['article', function (o) { return o.every(function (x) { return /^(a|an|some|any)$/i.test(x.trim()); }); }, 6],
    ['cd11', function (o) { return o.filter(function (x) { return /^(in|on|at|for|to|with|of|from|by|about|into|onto|under|since)$/i.test(x.trim()); }).length >= 3; }, 5],
    ['cd7', function (o) { return o.filter(function (x) { return /^(who|whom|whose|which|that|where|when|why)$/i.test(x.trim()); }).length >= 3; }, 6],
    ['wh', function (o) { return o.filter(function (x) { return /^(what|where|when|who|how|how old|how many|why|whose)$/i.test(x.trim()); }).length >= 3; }, 5],
    ['be', function (o) { return o.filter(function (x) { return /^(am|is|are|be|isn't|aren't)$/i.test(x.trim()); }).length >= 3; }, 5],
    ['cd14', function (o) { if (o.length < 3) return false; var r = o.map(function (x) { return x.trim().toLowerCase().slice(0, 4); }); return r.every(function (x) { return x === r[0]; }) && o.some(function (x) { return /(tion|ment|ness|ful|less|ous|ly|ive|al|ity|ize)$/i.test(x.trim()); }); }, 6],
    ['cd3', function (o) { return o.some(function (x) { return /^to \w+/i.test(x.trim()); }) && o.some(function (x) { return /^\w+ing$/i.test(x.trim()); }); }, 5],
    ['cd1', function (o) { return o.filter(function (x) { return /\b(have|has|had|will|is|are|was|were|been|did|does)\b|\w+(ed|ing)$/i.test(x.trim()); }).length >= 3 && o.every(function (x) { return x.trim().split(/\s+/).length <= 4; }); }, 2.5],
    ['cd5', function (o) { return o.filter(function (x) { return /\b(is|are|was|were|be|been|being)\s+\w+(ed|en)\b|\bbe \w+/i.test(x.trim()); }).length >= 2; }, 3],
    ['cd8', function (o) { return o.some(function (x) { return /(er|est)$|^(more|most|less|least)\b/i.test(x.trim()); }) && o.filter(function (x) { return /(er|est)$|^(more|most)\b/i.test(x.trim()); }).length >= 2; }, 4],
    ['cd12', function (o) { return o.filter(function (x) { return /^(much|many|few|a few|little|a little|some|any|a lot of|lots of|plenty of)$/i.test(x.trim()); }).length >= 3; }, 6],
    ['cd13', function (o) { return o.filter(function (x) { return /^\w+ (up|down|off|on|out|over|after|for|away|back)( \w+)?$/i.test(x.trim()); }).length >= 3; }, 5],
    ['cd16', function (o) { return o.filter(function (x) { return /^(make|do|take|have|get|made|did|took|had|making|doing|taking)$/i.test(x.trim()); }).length >= 3; }, 5],
    ['cd9', function (o) { return o.filter(function (x) { return /^(and|but|or|so|because|although|though|however|therefore|despite|in spite of|unless|if)$/i.test(x.trim()); }).length >= 3; }, 5]
  ];
  LN.suggestTopic = function (q, opts) {
    var score = {}, text = (q || '') + ' ' + (opts || []).join(' ');
    RULES.forEach(function (r) { if (r[1].test(text)) score[r[0]] = (score[r[0]] || 0) + r[2]; });
    if (opts && opts.length) OPTRULES.forEach(function (r) { try { if (r[1](opts)) score[r[0]] = (score[r[0]] || 0) + r[2]; } catch (e) {} });
    var best = '', bs = 0; Object.keys(score).forEach(function (k) { if (score[k] > bs) { bs = score[k]; best = k; } });
    return { topic: best, conf: bs >= 5 ? 'cao' : bs >= 2.5 ? 'vừa' : bs > 0 ? 'thấp' : '' };
  };

  /* ---------- Tách câu hỏi ---------- */
  LN.parseExercises = function (raw) {
    var text = String(raw || '').replace(/\r/g, '').replace(/[   ]/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...');
    var lines = text.split('\n');
    // 1. bảng đáp án ở cuối
    var keyStart = -1;
    for (var i = 0; i < lines.length; i++) if (/^\s*(đáp án|dap an|answer key|answers|keys?|key:|đáp án:)\b/i.test(lines[i]) && i > lines.length * 0.3) { keyStart = i; break; }
    var key = {};
    if (keyStart >= 0) {
      var ktxt = lines.slice(keyStart).join(' ');
      var re = /(\d{1,3})\s*[\.\-\):]?\s*([A-Da-d])(?![A-Za-z])/g, m; while ((m = re.exec(ktxt))) key[+m[1]] = m[2].toUpperCase();
      lines.slice(keyStart + 1).forEach(function (l) { var mm = l.match(/^\s*(\d{1,3})\s*[\.\):\-]\s*(.{2,})$/); if (mm && !/^[A-Da-d]\s*$/.test(mm[2].trim()) && !key[+mm[1]]) key[+mm[1]] = mm[2].trim(); });
      lines = lines.slice(0, keyStart);
    }
    // 2. gom khối câu hỏi
    var blocks = [], cur = null;
    lines.forEach(function (l) {
      var m = l.match(/^\s*(?:câu|question|q)?\s*(\d{1,3})\s*[\.\):]\s*(.*)$/i);
      if (m && m[2].trim().length > 1 && !/^[A-Da-d][\.\)]/.test(l.trim())) { cur = { n: +m[1], lines: [m[2]] }; blocks.push(cur); }
      else if (cur && l.trim()) cur.lines.push(l);
    });
    // 3. phân tích từng khối
    var out = [];
    blocks.forEach(function (b) {
      var body = b.lines.join('\n'), ans = null, mAns = body.match(/(?:đáp án|answer|key|=>|→|->)\s*[:\-]?\s*([^\n]+)\s*$/i);
      if (mAns) { ans = mAns[1].trim(); body = body.slice(0, mAns.index); }
      var flat = body.replace(/\n/g, ' '), opts = [], star = -1;
      var parts = flat.split(/\s(?=\*?\(?[A-Da-d][\.\)]\s)|^(?=\*?\(?[A-Da-d][\.\)]\s)/);
      var stem = parts.shift() || '';
      if (parts.length >= 2) {
        parts.forEach(function (p, k) {
          var mm = p.match(/^\*?\(?([A-Da-d])[\.\)]\s*(.*)$/);
          if (!mm) { stem += ' ' + p; return; }
          var v = mm[2].trim(); if (/^\*/.test(p) || /^\*/.test(v) || /\*\s*$/.test(v) || /\(x\)\s*$/i.test(v)) { star = opts.length; v = v.replace(/^\*\s*/, '').replace(/\*\s*$/, '').replace(/\(x\)\s*$/i, '').trim(); }
          opts.push(v);
        });
      }
      stem = stem.replace(/\s+/g, ' ').replace(/\.{3,}|…|_{2,}|-{3,}/g, '___').trim();
      if (!stem) return;
      var item;
      if (opts.length >= 2) {
        var letter = star >= 0 ? 'ABCD'[star] : (ans && /^[A-Da-d]\b/.test(ans) ? ans[0].toUpperCase() : (typeof key[b.n] === 'string' && /^[A-D]$/.test(key[b.n]) ? key[b.n] : null));
        item = { n: b.n, type: 'mcq', q: stem, o: opts, a: letter ? 'ABCD'.indexOf(letter) : -1 };
      } else {
        var a2 = ans || (key[b.n] && !/^[A-D]$/.test(key[b.n]) ? key[b.n] : null);
        item = { n: b.n, type: 'fill', q: /___/.test(stem) ? stem : stem + ' ___', ans: a2 ? a2.split(/\s*\/\s*/).filter(Boolean) : [] };
      }
      var sg = LN.suggestTopic(stem + (item.ans ? ' ' + item.ans.join(' ') : ''), opts); item.topic = sg.topic; item.conf = sg.conf;
      out.push(item);
    });
    return out;
  };
})();
