const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'queue-state.json');
const PUBLIC_ROOT = path.join(__dirname, 'public');

function loadQueueState() {
  try {
    const fileContents = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(fileContents);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveQueueState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function normalizeRoom(roomKey, roomData) {
  if (!roomData || typeof roomData !== 'object') {
    return {
      room: roomKey,
      doctor: '',
      number: '000',
      doctorIn: true,
    };
  }

  return {
    ...roomData,
    room: roomData.room || roomKey,
    doctor: roomData.doctor || '',
    number: roomData.number ?? '000',
    doctorIn: roomData.doctorIn !== undefined ? Boolean(roomData.doctorIn) : true,
  };
}

function createApp() {
  const queueState = loadQueueState();
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use(express.static(PUBLIC_ROOT));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/queue', (req, res) => {
    res.json({
      room1: normalizeRoom('room1', queueState.room1 || {
        room: 'room1',
        doctor: 'Dr. Kenneth Miranda',
        number: '000',
        doctorIn: true,
      }),
      room2: normalizeRoom('room2', queueState.room2 || {
        room: 'room2',
        doctor: 'Dr. Kath Miranda',
        number: '000',
        doctorIn: true,
      }),
    });
  });

  app.put('/api/queue/:room', (req, res) => {
    const roomKey = req.params.room;
    const nextRoom = normalizeRoom(roomKey, {
      ...(queueState[roomKey] || {}),
      ...req.body,
      number: req.body.number !== undefined ? String(req.body.number).padStart(3, '0') : (queueState[roomKey]?.number ?? '000'),
      doctorIn: req.body.doctorIn !== undefined ? Boolean(req.body.doctorIn) : (queueState[roomKey]?.doctorIn ?? true),
    });

    queueState[roomKey] = nextRoom;
    saveQueueState(queueState);
    res.json({ success: true, room: nextRoom });
  });

  app.put('/api/queue/:room/doctor-status', (req, res) => {
    const roomKey = req.params.room;
    const doctorIn = req.body && req.body.doctorIn !== undefined ? Boolean(req.body.doctorIn) : (queueState[roomKey]?.doctorIn ?? true);
    const nextRoom = normalizeRoom(roomKey, {
      ...(queueState[roomKey] || {}),
      doctorIn,
    });

    queueState[roomKey] = nextRoom;
    saveQueueState(queueState);
    res.json({ success: true, room: nextRoom });
  });

  app.get('/queue', (req, res) => {
    res.sendFile(path.join(PUBLIC_ROOT, 'queue.html'));
  });

  app.get('/control', (req, res) => {
    res.sendFile(path.join(PUBLIC_ROOT, 'control.html'));
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_ROOT, 'index.html'));
  });

  app.get('*', (req, res) => {
    res.status(404).send('Not found');
  });

  return app;
}

if (require.main === module) {
  const server = createApp();
  server.listen(PORT, () => {
    console.log(`Miranda Clinics unified app running on http://localhost:${PORT}`);
  });
}

module.exports = { createApp };
