const http = require('http');
http.get('http://localhost:3000/talent/profile', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('HTTP', r.statusCode);
    console.log('LEN', d.length);
    if (d.includes('ModuleBuildError') || d.includes('Syntax Error')) {
      const m = d.match(/"message":"([^"]{0,300})"/);
      console.log('ERR:', m ? m[1] : 'unknown-build-fail');
    } else {
      console.log('PASS compile');
    }
  });
}).on('error', e => console.log('FETCH-ERR', e.message));
