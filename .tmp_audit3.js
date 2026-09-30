const http = require('http');
// Fetch RSC flight payload by emulating Next.js App Router _rsc request
function rscRequest(path, rsc) {
  return new Promise(resolve => {
    const headers = {
      'RSC': '1',
      'Next-Router-State-Tree': '%5B%22%22%2C%7B%7D%2Cnull%2Cnull%2Ctrue%5D',
      'Next-Router-Prefetch': '1',
    };
    const req = http.get({
      hostname: '127.0.0.1',
      port: 3000,
      path: path + (rsc ? '?_rsc=' + rsc : ''),
      headers,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d }));
    });
    req.on('error', e => resolve({ err: String(e) }));
  });
}
(async () => {
  // First get the page with cookies to obtain the _rsc cache key
  const first = await new Promise(resolve => {
    http.get({ hostname: '127.0.0.1', port: 3000, path: '/talent/profile' }, r => {
      let d = '';
      const cookies = (r.headers['set-cookie'] || []).join('; ');
      r.on('data', c => d += c);
      r.on('end', () => resolve({ html: d, cookies }));
    });
  });
  // Extract _rsc=XXXX references in HTML
  const rscRefs = [...first.html.matchAll(/_rsc=([a-zA-Z0-9]+)/g)].map(x => x[1]);
  console.log('Cookies present?', first.cookies.length > 3, '; _rsc refs found:', rscRefs.slice(0, 5));
  // Now extract all __next_f.push(...) content and print the long textual content
  const chunks = [...first.html.matchAll(/__next_f\.push\(\[["']([\s\S]*?)["']\]\)/g)].map(x => x[1]);
  const decoded = chunks.map(s => s
    .replace(/\\x3c/g, '<').replace(/\\x3e/g, '>').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&').replace(/\\u0027/g, "'").replace(/\\\//g, '/').replace(/\\\\/g, '\\').replace(/\\\"/g, '"')
  );
  const haystack = decoded.join('\n=====\n');
  console.log('Decoded flight haystack length:', haystack.length);
  console.log('\n==Profile content strings==');
  console.log('Vitals:', haystack.includes('Vitals') ? 'YES' : 'no');
  console.log('Edit word:', (haystack.match(/\bEdit\b/g) || []).length);
  console.log('View Measurements word:', (haystack.match(/View Measurements/g) || []).length);
  console.log('View Setcard word:', (haystack.match(/View Setcard/g) || []).length);
  console.log('Gallery word:', haystack.includes('Gallery'));
  console.log('Experience word:', haystack.includes('Experience'));
  console.log('Social word:', haystack.includes('Social'));
  console.log('Basic Information:', haystack.includes('Basic Information') || haystack.includes('Basic Info'));
  console.log('\n==DOM leak check==');
  console.log('titleRight attr leaked?', (haystack.match(/titleright=/gi) || []).length, '; right attr leaked?', (haystack.match(/ right=(\{|"|')/gi) || []).length);
  console.log('\n==Modal hook order check inside flight==');
  const earlyRetIdx = Math.max(haystack.indexOf('if (!open) return null'), haystack.indexOf('if(!open)return null'));
  const useEffectMarkers = [...haystack.matchAll(/useEffect\(/g)];
  const useIdMarkers = [...haystack.matchAll(/useId\b/g)];
  console.log('Modal early return idx:', earlyRetIdx, '; useEffect markers:', useEffectMarkers.length, '; useId markers:', useIdMarkers.length);
  // Find order around Modal's block
  // Find the effect body: `useEffect(() => {if (!open) return`
  const modalEffectStart = haystack.indexOf(`if (!open) return`);
  if (modalEffectStart > -1) {
    const blockBefore = haystack.slice(Math.max(0, modalEffectStart - 500), modalEffectStart);
    const useIdBefore = blockBefore.lastIndexOf('useId');
    const blockAfter = haystack.slice(modalEffectStart, modalEffectStart + 1500);
    const useIdAfter = blockAfter.indexOf('useId');
    console.log(`\n===Modal block analysis:
    Closest useId BEFORE useEffect body start:${useIdBefore > -1 ? ' YES (offset=' + (modalEffectStart - 500 + useIdBefore) + ') ✅ CORRECT' : ' NONE ❌ BUG'}
    Closest useId AFTER  useEffect body start:${useIdAfter > -1 ? ' YES (offset=' + (modalEffectStart + useIdAfter) + '), DISTANCE=' + useIdAfter + ' chars into useEffect body == useId called AFTER early return == BREAKS RENDER ❌' : ' none - OK'}
    `);
  } else {
    // Try minified versions
    const minEarly = haystack.indexOf('if(!open)return null');
    if (minEarly > 0) {
      const ba = haystack.slice(Math.max(0, minEarly - 500), minEarly);
      const bb = haystack.slice(minEarly, minEarly + 1500);
      console.log('minified early return at', minEarly);
      console.log('useId BEFORE early return?', ba.includes('useId') ? ' YES ✅' : ' NO');
      console.log('useId AFTER  early return?', bb.includes('useId') ? ' YES ⚠️  BUG - useId called after conditional return' : ' NO ✅');
    } else {
      console.log('Could not find Modal return. Dumping 4000-char preview of haystack:');
      console.log(haystack.slice(0, 2000));
      console.log('\n-------PART 2-------\n');
      console.log(haystack.slice(2000, 4000));
    }
  }
})();
