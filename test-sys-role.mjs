import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-latest',
      messages: [
        { role: 'system', content: 'You are a bot.' },
        { role: 'user', content: 'Hi' }
      ]
    })
  });
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
  } else {
    // console.log(await res.text());
    console.log('Success!');
  }
}

test();
