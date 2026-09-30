const http = require('http');
const fs = require('fs');
const st = '["",{"children":["talent",{"children":["profile",{"children":["__PAGE__",{}]},"__DEFAULT__",null,true]}]';
const headers = {
  RSC: '1',
  Accept: 'text/x-component',
  'Next-Router-State-Tree': encodeURIComponent(st),
  'Next-Url': '/talent/profile',
};
const req = http.get({
  hostname: '127.0.0.1', port: 3000, path: '/talent/profile', headers,
}, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('RSC status', r.statusCode, 'bytes', d.length);
    const flat = d.slice(0, 50000);
    console.log('\n== Content strings ==');
    const cc = pat => (flat.match(new RegExp(pat, 'g')) || []).length;
    console.log('Vitals:', cc('Vitals'));
    console.log('Edit word:', cc('\\bEdit\\b'));
    console.log('>Edit< tags:', (flat.match(new RegExp('>Edit<', 'g')) || []).length);
    console.log('View Measurements:', cc('View Measurements'));
    console.log('View Setcard:', cc('View Setcard'));
    console.log('Gallery:', cc('Gallery'));
    console.log('Experience:', cc('Experience'));
    console.log('Social Media:', cc('Social Media'));
    console.log('Basic Info:', cc('Basic Info'));
    console.log('\n== DOM leak checks ==');
    console.log('titleright= attr:', cc('titleright='));
    console.log(' right= attr:', (flat.match(/ right=([{"])/gi) || []).length);
    console.log('\n== Modal hook order (within 40k window) ==');
    const modIdx = Math.max(flat.indexOf('if(!open)return null'), flat.indexOf('if (!open) return null'));
    console.log('Modal early return idx:', modIdx);
    if (modIdx > -1) {
      const before = flat.slice(Math.max(0, modIdx - 10000), modIdx);
      const after = flat.slice(modIdx, Math.min(flat.length, modIdx + 10000));
      const ub = (before.match(/useId\b/g) || []).length;
      const ua = (after.match(/useId\b/g) || []).length;
      console.log('useId BEFORE early return:', ub);
      console.log('useId AFTER  early return:', ua, ua>0?'BUG - useId called AFTER conditional return':'none AFTER');
    }
    console.log('\n== Key marker positions ==');
    ['useId','React.useId','if(!open)return null','if (!open) return null','headerRight','titleRight','right=','resolvedPhotoSrc','resolvedPhotoEdit','widthClassName','formClassName','bodyClassName','subtitle=','subtitleClassName','titleClassName','glass=','actionsSlot'].forEach(kw => {
      const idxs = []; let p = 0;
      while (p = flat.indexOf(kw, p), p !== -1) { idxs.push(p); p += kw.length; if (idxs.length>6) break }
      if (idxs.length) console.log('  ' + kw.padEnd(24) + ':', idxs);
    });
    fs.writeFileSync('.tmp_rsc_raw.txt', d);
    console.log('\nSaved full RSC response to .tmp_rsc_raw.txt ('+d.length+' bytes)');
  });
});
req.on('error', e => console.log('RSC HTTP err:', e.message));
req.end();
