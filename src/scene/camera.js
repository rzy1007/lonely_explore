import * as THREE from 'three';
import { getCamera, getRenderer } from './setup.js';
import { celestialBodies } from '../data/celestial.js';
import { store } from '../store.js';

let controls;
let targetPosition = new THREE.Vector3(0, 30, 60);
let targetLookAt = new THREE.Vector3(0, 0, 0);
let isAnimating = false;
const animSpeed = 0.04;

export function initControls() {
  const camera = getCamera();
  const renderer = getRenderer();

  // Simple custom orbit controls
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let spherical = new THREE.Spherical();
  const pivot = new THREE.Vector3(0, 0, 0);

  spherical.set(60, Math.PI / 3, 0);

  function updateCameraFromSpherical() {
    const pos = new THREE.Vector3().setFromSpherical(spherical).add(pivot);
    camera.position.copy(pos);
    camera.lookAt(pivot);
    targetPosition.copy(pos);
    targetLookAt.copy(pivot);
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;

    spherical.theta -= dx * 0.005;
    spherical.phi -= dy * 0.005;
    spherical.phi = Math.max(0.1, Math.min(Math.PI / 2, spherical.phi));

    prevMouse = { x: e.clientX, y: e.clientY };
    updateCameraFromSpherical();
  });

  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius *= 1 + e.deltaY * 0.001;
    spherical.radius = Math.max(5, Math.min(500, spherical.radius));
    updateCameraFromSpherical();

    // Scale change based on camera distance
    const r = spherical.radius;
    let newScale;
    if (r < 40) newScale = 0;
    else if (r < 120) newScale = 1;
    else if (r < 200) newScale = 2;
    else if (r < 350) newScale = 3;
    else newScale = 4;
    store.setScale(newScale);
  });

  controls = { spherical, pivot, updateCameraFromSpherical };
  updateCameraFromSpherical();
}

export function flyToBody(bodyId) {
  const body = celestialBodies.find((b) => b.id === bodyId);
  if (!body) return;

  targetPosition.set(body.position[0] + 8, body.position[1] + 5, body.position[2] + 12);
  targetLookAt.set(...body.position);
  isAnimating = true;
}

export function flyToScale(scale) {
  const distances = {
    0: { pos: [0, 30, 60], look: [0, 0, 0] },
    1: { pos: [0, 30, 200], look: [0, 0, -80] },
    2: { pos: [0, 30, 350], look: [0, 0, -200] },
    3: { pos: [0, 50, 700], look: [150, 0, -550] },
    4: { pos: [0, 80, 1600], look: [0, 0, -1200] },
  };

  const cfg = distances[scale] || distances[0];
  targetPosition.set(...cfg.pos);
  targetLookAt.set(...cfg.look);
  isAnimating = true;
}

export function updateCameraAnimation() {
  if (!isAnimating) return;

  const camera = getCamera();
  camera.position.lerp(targetPosition, animSpeed);
  camera.lookAt(targetLookAt);

  if (camera.position.distanceTo(targetPosition) < 0.5) {
    camera.position.copy(targetPosition);
    camera.lookAt(targetLookAt);
    isAnimating = false;
  }
}
