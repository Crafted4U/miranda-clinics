const queueRoot = document.getElementById('queueRoot');

if (queueRoot) {
  async function loadQueue() {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();
      renderQueue(data);
    } catch (error) {
      console.error(error);
    }
  }

  function renderQueue(data) {
    const rooms = [data.room1, data.room2].filter(Boolean);
    queueRoot.innerHTML = rooms.map((room, index) => `
      <div class="room-card ${index === 0 ? 'room-one' : 'room-two'}">
        <div class="room-header">
          <div class="room-name">${index === 0 ? 'INTERNAL MEDICINE' : 'PEDIA'}</div>
          <div class="status ${room.doctorIn === false ? 'status-out' : 'status-in'}">
            ${room.doctorIn === false ? 'Doctor is OUT' : 'Doctor is IN'}
          </div>
        </div>
        <div class="info">
          <strong>${room.doctor || (index === 0 ? 'Dr. Kenneth Miranda' : 'Dr. Kath Miranda')}</strong>
        </div>
        <div class="serving">
          <small>CURRENTLY SERVING</small>
          <div class="queue-number">${room.number || '---'}</div>
        </div>
      </div>
    `).join('');
  }

  loadQueue();
  setInterval(loadQueue, 2000);
}
