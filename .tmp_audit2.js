const http = require('http');
http.get('http://127.0.0.1:3000/talent/profile', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    // Extract all RSC flight chunks from __next_f.push([...]) calls inside scripts
    const chunks = [];
    const re = /__next_f\.push\(\[([\s\S]*?)\]\)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      try {
        // The pushed array is JSON-like but may be single-quoted / raw; grab raw string
        const raw = m[1];
        // Decode unicode escapes
        chunks.push(raw.replace(/\\x3c/g, '<').replace(/\\x3e/g, '>').replace(/\\u0026/g, '&').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\\//g, '/').replace(/\\\\/g, '\\').replace(/\\\"/g, '"').replace(/\\'/g, "'"));
      } catch (e) {}
    }
    const joined = chunks.join('\n');
    const htmlPart = d + '\n=====\nFLIGHT:' + joined;
    const editBtnCount = (htmlPart.match(/View Measurements/g) || []).length;
    console.log('View Measurements text found count:', editBtnCount);
    const scCount = (htmlPart.match(/View Setcard/g) || []).length;
    console.log('View Setcard text found count:', scCount);
    const editSec = (htmlPart.match(/>Edit</g) || []).length;
    console.log('>Edit< text button count:', editSec);
    const editText = (htmlPart.match(/\bEdit\b/g) || []).length;
    console.log('Edit standalone word count:', editText);
    const titleRightLeak = (htmlPart.match(/titleright=/gi) || []).length;
    const rightLeak = (htmlPart.match(/ right="/gi) || []).length;
    const rightAttrLeak2 = (htmlPart.match(/right="function/gi) || []).length;
    console.log('titleRight DOM-attr leak count:', titleRightLeak);
    console.log('right DOM-attr literal =" count:', rightLeak + rightAttrLeak2);
    // Modal hook order — search RSC flight for the exact code pattern
    const modPattern1 = 'if(!open)return null';
    const modPattern2 = 'if (!open) return null';
    const useId1 = 'useId';
    const i1 = Math.max(htmlPart.indexOf(modPattern1), htmlPart.indexOf(modPattern2));
    const i2 = htmlPart.indexOf(useId1);
    // find nearest useId AFTER a Modal def marker (useEffect+useId combo)
    const modIdxs = [...htmlPart.matchAll(/(useEffect\([^\n]*?open[^\n]*?onClose[\s\S]{0,2000})/g)].map(x=>x.index);
    console.log('\nModal code pattern (if!open)return null) idx:', i1, '; nearest useId before/after that idx? useId idx=', i2);
    if (modIdxs.length) {
      modIdxs.slice(0, 3).forEach((mi, i) => {
        const snippet = htmlPart.slice(mi, Math.min(mi + 1200, htmlPart.length));
        const o = Math.max(snippet.indexOf(modPattern1), snippet.indexOf(modPattern2));
        const u = snippet.indexOf('useId');
        console.log(`Modal block #${i + 1}: early-return idx within block=${o}, useId idx within block=${u} => ORDER=${o > -1 && u > -1 ? (u < o ? 'useId BEFORE return ✅' : 'useId AFTER return ❌ BUG') : 'n/a'}`);
      });
    }
    // Also check raw html directly for Edit <button> nodes
    console.log('\n--- Direct SSR payload size: HTML=', d.length, 'Extracted flight chunks count:', chunks.length, 'chunks joined len=', joined.length);
    console.log('\n--- Raw page title tag:', (d.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'no-title');
  });
}).on('error', e => console.log('HTTP-ERR', e.message));
