const API_BASE = '/api/queue';
const statusBanner = document.getElementById('statusBanner');
const roomCards = Array.from(document.querySelectorAll('.room-card'));
const loginOverlay = document.getElementById('loginOverlay');
const appContent = document.getElementById('appContent');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '--';
  }
  return String(Number(value)).padStart(3, '0');
}

function showStatus(message, type = 'info') {
  if (!statusBanner) return;
  statusBanner.textContent = message;
  statusBanner.style.background = type === 'error' ? '#fee2e2' : '#e8f0ff';
  statusBanner.style.color = type === 'error' ? '#991b1b' : '#1c3b82';
}

async function fetchQueue() {
  try {
    showStatus('Loading queue data...');
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const data = await response.json();
    populateRooms(data);
    showStatus('Queue data loaded. Use the controls to update each room.');
  } catch (error) {
    console.error(error);
    showStatus('Unable to load queue data. Check network or API availability.', 'error');
  }
}

function syncRoomCardUI(card, roomResult) {
  card.querySelector('.current-number').value = formatNumber(roomResult.number);
  card.querySelector('.doctor-name').value = roomResult.doctor || '';

  const toggleButton = card.querySelector('.doctor-toggle');
  const toggleLabel = toggleButton.querySelector('.doctor-toggle__label');
  const doctorIn = Boolean(roomResult.doctorIn);
  if (toggleLabel) {
    toggleLabel.textContent = doctorIn ? 'Doctor In' : 'Doctor Out';
  }
  toggleButton.classList.toggle('is-active', doctorIn);
  toggleButton.setAttribute('aria-pressed', String(doctorIn));
}

function populateRooms(data) {
  roomCards.forEach((card) => {
    const roomKey = card.dataset.room;
    const roomData = data[roomKey];
    if (!roomData) {
      return;
    }
    card.querySelector('.current-number').value = formatNumber(roomData.number);
    card.querySelector('.doctor-name').value = roomData.doctor || '';
    card.querySelector('.custom-number').value = '';
    syncRoomCardUI(card, roomData);
  });
}

async function updateRoom(roomKey, updates, card) {
  const buttons = Array.from(card.querySelectorAll('button'));
  buttons.forEach((btn) => (btn.disabled = true));
  try {
    const currentNumberValue = card.querySelector('.current-number').value;
    const currentNumberText = currentNumberValue && currentNumberValue !== '--' ? currentNumberValue : '000';
    const payload = {
      ...updates,
      number: updates.number === undefined ? currentNumberText : formatNumber(updates.number),
      doctor: card.querySelector('.doctor-name').value || '',
    };

    if (payload.number === '--') {
      payload.number = '000';
    }

    const response = await fetch(`${API_BASE}/${roomKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Update failed: ${response.status}`);
    }
    const result = await response.json();
    const roomResult = result.room || result;
    if (!roomResult) {
      throw new Error('Unexpected API response');
    }

    syncRoomCardUI(card, roomResult);
    const doctorIn = Boolean(roomResult.doctorIn);
    showStatus(`Requested ${roomResult.room} ${doctorIn ? 'doctor in' : 'doctor out'} update.`);
  } catch (error) {
    console.error(error);
    showStatus(`Unable to update ${roomKey}. Try again.`, 'error');
  } finally {
    buttons.forEach((btn) => (btn.disabled = false));
  }
}

async function updateDoctorStatus(roomKey, doctorInValue, card) {
  const buttons = Array.from(card.querySelectorAll('button'));
  buttons.forEach((btn) => (btn.disabled = true));
  try {
    const response = await fetch(`${API_BASE}/${roomKey}/doctor-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorIn: doctorInValue }),
    });
    if (!response.ok) {
      throw new Error(`Doctor status update failed: ${response.status}`);
    }
    const result = await response.json();
    const roomResult = result.room || result;
    if (!roomResult) {
      throw new Error('Unexpected API response');
    }

    syncRoomCardUI(card, roomResult);
    const doctorIn = Boolean(roomResult.doctorIn);
    showStatus(`Requested ${roomResult.room} ${doctorIn ? 'doctor in' : 'doctor out'} update.`);
  } catch (error) {
    console.error(error);
    showStatus(`Unable to update ${roomKey} doctor status. Try again.`, 'error');
  } finally {
    buttons.forEach((btn) => (btn.disabled = false));
  }
}

if (roomCards.length) {
  roomCards.forEach((card) => {
    const roomKey = card.dataset.room;
    const decrementButton = card.querySelector('.decrement');
    const incrementButton = card.querySelector('.increment');
    const setButton = card.querySelector('.set-number');
    const customNumberInput = card.querySelector('.custom-number');
    const doctorToggleButton = card.querySelector('.doctor-toggle');

    decrementButton.addEventListener('click', async () => {
      const current = Number(card.querySelector('.current-number').value || 0);
      await updateRoom(roomKey, { number: Math.max(current - 1, 0) }, card);
    });

    incrementButton.addEventListener('click', async () => {
      const current = Number(card.querySelector('.current-number').value || 0);
      await updateRoom(roomKey, { number: current + 1 }, card);
    });

    setButton.addEventListener('click', async () => {
      const value = Number(customNumberInput.value);
      if (Number.isNaN(value) || value < 0) {
        showStatus('Enter a valid non-negative number before sending.', 'error');
        return;
      }
      await updateRoom(roomKey, { number: value }, card);
      customNumberInput.value = '';
    });

    doctorToggleButton.addEventListener('click', async () => {
      const currentState = doctorToggleButton.getAttribute('aria-pressed') === 'true';
      const doctorInValue = !currentState;
      await updateDoctorStatus(roomKey, doctorInValue, card);
    });
  });
}

document.addEventListener('auth:success', () => {
  if (appContent) {
    appContent.classList.remove('hidden');
  }
  if (loginOverlay) {
    loginOverlay.classList.add('hidden');
  }
  fetchQueue();
});

if (appContent && loginOverlay) {
  if (window.location.pathname === '/control') {
    appContent.classList.add('hidden');
    loginOverlay.classList.remove('hidden');
  } else {
    appContent.classList.remove('hidden');
  }
}
