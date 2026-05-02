import { store } from '../store.js';
import { celestialBodies } from '../data/celestial.js';

let panel, closeBtn, immersiveBtn;

export function initInfoPanel() {
  panel = document.getElementById('info-panel');
  closeBtn = document.getElementById('btn-close-info');
  immersiveBtn = document.getElementById('btn-immersive');

  closeBtn.addEventListener('click', () => {
    store.deselectBody();
    panel.classList.remove('visible');
  });

  immersiveBtn.addEventListener('click', () => {
    if (store.selectedBodyId) {
      store.emit('enterImmersive', store.selectedBodyId);
    }
  });

  store.on('bodySelected', (id) => {
    showBodyInfo(id);
  });

  store.on('bodyDeselected', () => {
    panel.classList.remove('visible');
  });
}

function showBodyInfo(id) {
  const body = celestialBodies.find((b) => b.id === id);
  if (!body) return;

  panel.querySelector('.body-name').textContent = body.name;
  panel.querySelector('.en-name').textContent = body.nameEn;
  panel.querySelector('.info-type').textContent = body.type;

  const rowsContainer = panel.querySelector('.info-rows');
  rowsContainer.innerHTML = '';

  const fields = [
    ['直径', 'diameter'],
    ['质量', 'mass', 'galaxyCount', 'stars'],
    ['温度', 'temperature'],
    ['距离', 'distance'],
    ['公转周期', 'orbitalPeriod'],
    ['年龄', 'age'],
  ];

  fields.forEach(([label, ...keys]) => {
    const value = keys.reduce((v, k) => v || body[k], undefined);
    if (value) {
      const row = document.createElement('div');
      row.className = 'info-row';
      row.innerHTML = `<span class="info-label">${label}</span><span>${value}</span>`;
      rowsContainer.appendChild(row);
    }
  });

  panel.querySelector('.info-desc').textContent = body.desc;

  if (body.hasImmersive) {
    immersiveBtn.style.display = 'block';
  } else {
    immersiveBtn.style.display = 'none';
  }

  panel.classList.add('visible');
}
