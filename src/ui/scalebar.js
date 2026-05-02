import { store } from '../store.js';
import { SCALES } from '../data/celestial.js';

let scaleBar;

export function initScaleBar() {
  scaleBar = document.getElementById('scale-bar');

  SCALES.forEach((scale) => {
    const item = document.createElement('div');
    item.className = 'scale-item';
    item.dataset.scale = scale.id;
    item.innerHTML = `
      <span class="scale-icon">${scale.icon}</span>
      <span class="scale-label">${scale.name}</span>
    `;

    item.addEventListener('click', () => {
      store.setScale(scale.id);
    });

    scaleBar.appendChild(item);
  });

  store.on('scaleChanged', (scale) => {
    scaleBar.querySelectorAll('.scale-item').forEach((el) => {
      el.classList.toggle('active', Number(el.dataset.scale) === scale);
    });
  });

  // Initial active state
  const initial = scaleBar.querySelector('[data-scale="0"]');
  if (initial) initial.classList.add('active');
}
