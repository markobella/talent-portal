const http = require('http');
const fs = require('fs');
const req = http.get({
  hostname: '127.0.0.1', port: 3000, path: '/talent/profile',
  headers: {
    'Accept': 'text/html,application/xhtml+xml',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120',
    'Cookie': '',
  }
}, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('HTTP status', r.statusCode, 'content bytes', d.length);
    // Extract all __next_f flight chunks
    const re = /__next_f\.push\(\[([\s\S]*?)\]\)/g;
    const rawChunks = [];
    let m;
    while ((m = re.exec(d)) !== null) rawChunks.push(m[1]);
    console.log('Flight push calls:', rawChunks.length);
    const decoded = rawChunks.map(s => {
      try {
        // Strip surrounding quotes
        let inner = s;
        if (/^["']/.test(inner)) inner = inner.slice(1, -1);
        return inner
          .replace(/\\n/g, '\n').replace(/\\r/g, '')
          .replace(/\\x3c/g, '<').replace(/\\x3e/g, '>')
          .replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')
          .replace(/\\u0026/g, '&').replace(/\\u0027/g, "'")
          .replace(/\\\//g, '/').replace(/\\\\/g, '\\').replace(/\\\"/g, '"').replace(/\\'/g, "'");
      } catch (e) { return ''; }
    }).join('\n');
    console.log('Decoded flight length:', decoded.length);
    const flat = decoded;
    const cc = (pat, flags='g') => (flat.match(new RegExp(pat, flags)) || []).length;
    console.log('\n== Section/button/modal string matches in FLIGHT data ==');
    console.log('Vitals:', cc('Vitals'));
    console.log('Basic Info/Basic Information:', Math.max(cc('Basic Info'), cc('Basic Information')));
    console.log('Social Media:', cc('Social Media'));
    console.log('Gallery:', cc('Gallery'));
    console.log('Experience:', cc('Experience'));
    console.log('Certifications:', cc('Certifications'));
    console.log('\nEdit standalone word boundary:', cc('\\bEdit\\b'));
    console.log('>Edit< literal JSX-text nodes:', cc('>Edit<'));
    console.log('View Measurements:', cc('View Measurements'));
    console.log('View Setcard:', cc('View Setcard'));
    console.log('Download Setcard:', cc('Download Setcard'));
    console.log('\n== Alias / leak markers (from ui.tsx defs) ==');
    console.log('resolvedPhotoSrc var:', cc('resolvedPhotoSrc'));
    console.log('resolvedPhotoEdit var:', cc('resolvedPhotoEdit'));
    console.log('actionsSlot (Card combined header slot):', cc('actionsSlot'));
    console.log('widthClassName alias used in modal:', cc('widthClassName'));
    console.log('formClassName alias:', cc('formClassName'));
    console.log('subtitleClassName alias:', cc('subtitleClassName'));
    console.log('titleClassName alias:', cc('titleClassName'));
    console.log('\nDOM-attr leaks (legacy props leaking through ...rest)');
    console.log('  titleright= attr:', cc('titleright='));
    console.log('  right= attr with object/class:', (flat.match(/ right=(\{|"|class)/gi) || []).length);
    console.log('  glass= attr:', (flat.match(/ glass=([A-Za-z0-9_"'])/gi) || []).length);
    console.log('  subtitle= attr div:', (flat.match(/ subtitle=([A-Za-z0-9_"'])/gi) || []).length);
    console.log('\n== Modal hook order ==');
    const m1 = flat.indexOf('if(!open)return null');
    const m2 = flat.indexOf('if (!open) return null');
    const modIdx = Math.max(m1, m2);
    console.log('Modal conditional-return idx:', modIdx);
    if (modIdx > -1) {
      const before = flat.slice(Math.max(0, modIdx - 20000), modIdx);
      const after = flat.slice(modIdx, Math.min(flat.length, modIdx + 20000));
      const ub = cc.call(null, 'useId\\b', 'g') ? 0 : (before.match(/useId\b/g) || []).length;
      const ua = (after.match(/useId\b/g) || []).length;
      console.log(' useId matches BEFORE early return (20k window):', ub, ub>0?' ✅ CORRECT: useId called before `if (!open) return null`':' ⚠️  none before');
      console.log(' useId matches AFTER  early return (20k window):', ua, ua>0?' ❌ BUG: useId runs after conditional return — causes "Rendered more hooks than previous render"':' ✅ none after — hook order safe');
    } else {
      console.log('  (Could not find modal block markers in flight; checking raw HTML instead for any render hints)');
      // Look around any `useId` occurrences in whole HTML for the error
      const errMsg = d.match(/Rendered more hooks|useId|Error:([^\n]{0,100})/g) || [];
      console.log('  Raw HTML error strings:', errMsg.slice(0, 4));
    }
    fs.writeFileSync('.tmp_flight_decoded.txt', decoded);
    fs.writeFileSync('.tmp_html_raw.txt', d);
    console.log('\nSaved FLIGHT decoded -> .tmp_flight_decoded.txt, HTML raw -> .tmp_html_raw.txt');
  });
});
req.on('error', e => console.log('HTTP-ERR', e.message));
req.end();
