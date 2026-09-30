const http = require('http');
function findInStatic() {
  return new Promise(resolve => {
    http.get('http://127.0.0.1:3000/_next/static/webpack/webpack.manifest.json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const m = JSON.parse(d);
          const files = Object.values(m.files || {});
          const all = files.map(f => Array.isArray(f) ? f.join('\n') : f).join('\n');
          resolve({ manifest: d.slice(0, 120), filesCount: files.length, first: files[0] || 'none' });
        } catch (e) {
          resolve({ err: String(e), peek: d.slice(0, 200) });
        }
      });
    }).on('error', e => resolve({ err: String(e) }));
  });
}
function profileHydrate() {
  return new Promise(resolve => {
    http.get('http://127.0.0.1:3000/talent/profile', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const ssrScript = d.split('<script').find(s => s.includes('self.__next_f.push(') || s.includes('__next_f.push'));
        const haystack = d;
        const openRet = haystack.indexOf('if(!open)return null') !== -1 ? haystack.indexOf('if(!open)return null') :
                        (haystack.indexOf('if (!open) return null') !== -1 ? haystack.indexOf('if (!open) return null') : -1);
        const useId = haystack.indexOf('React.useId') !== -1 ? haystack.indexOf('React.useId') :
                      (haystack.indexOf('react.useId') !== -1 ? haystack.indexOf('react.useId') : -1);
        resolve({
          status: r.statusCode,
          len: d.length,
          openRet,
          useId,
          order: (useId > -1 && openRet > -1) ? (useId < openRet ? 'CORRECT useId before early return' : 'WRONG early return before useId') : 'not-found-in-html',
          hasNextData: d.includes('__next_f.push') ? 'hasNextPush' : d.includes('self.__next_f') ? 'hasSelfPush' : 'no',
        });
      });
    }).on('error', e => resolve({ err: String(e) }));
  });
}
(async function () {
  const p = await profileHydrate();
  console.log('PROFILE', JSON.stringify(p, null, 2));
  console.log('\n---Checking SSR-rendered page for edit button string (proves Edit buttons on section render)---');
  http.get('http://127.0.0.1:3000/talent/profile', r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
      const editCount = (d.match(/class="[^"]*"[^>]*>\s*Edit\s*<\/button>/g) || []).length;
      const editBtn2 = (d.match(/>Edit</g) || []).length;
      const mBtn = (d.match(/View Measurements/g) || []).length;
      const sBtn = (d.match(/View Setcard/g) || []).length;
      console.log('SSR raw >Edit< tag count:', editBtn2);
      console.log('SSR >View Measurements< count:', mBtn);
      console.log('SSR >View Setcard< count:', sBtn);
      console.log('SSR class= btn tag w/ Edit count:', editCount);
      const hasRightDom = d.includes('titleright') || d.includes('data-right=');
      console.log('Leaky titleright/right attrs on DOM divs in SSR HTML? titleright leak=', d.includes(' titleright='), '; right leak=', d.includes(' right='));
    });
  });
})();
