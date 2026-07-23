const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');

test('GET /api/queue returns queue state', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/queue`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(data.room1);
    assert.ok(data.room2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('PUT /api/queue/room1 updates the room number', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/queue/room1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: 42 })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.room.number, '042');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
