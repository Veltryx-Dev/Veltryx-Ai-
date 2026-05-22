import http from 'http';
const req = http.request({
  method: 'POST',
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/chat',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk.toString('utf8')}`);
  });
});
req.write(JSON.stringify({
  messages: [{ role: 'user', content: 'hello' }],
  stream: true
}));
req.end();
