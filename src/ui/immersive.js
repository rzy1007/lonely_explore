import * as THREE from 'three';
import { store } from '../store.js';
import { celestialBodies } from '../data/celestial.js';
import { getBodyMesh } from '../scene/bodies.js';
import { getScene, getCamera, getRenderer } from '../scene/setup.js';

let overlay, exitBtn, hintEl;
let savedCameraPos, savedCameraTarget;
let immersiveBodyId = null;
let rotationSpeed = 0;

export function initImmersive() {
  overlay = document.getElementById('immersive-overlay');
  exitBtn = document.getElementById('btn-exit-immersive');
  hintEl = document.getElementById('immersive-hint');

  exitBtn.addEventListener('click', exitImmersive);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && store.isImmersive) {
      exitImmersive();
    }
  });

  store.on('enterImmersive', (bodyId) => {
    enterImmersive(bodyId);
  });
}

function enterImmersive(bodyId) {
  const body = celestialBodies.find((b) => b.id === bodyId);
  if (!body) return;

  store.isImmersive = true;
  immersiveBodyId = bodyId;

  // Save camera state
  const camera = getCamera();
  savedCameraPos = camera.position.clone();
  savedCameraTarget = new THREE.Vector3();

  // Position camera close to body
  const bodyMesh = getBodyMesh(bodyId);
  if (bodyMesh) {
    const pos = bodyMesh.position;
    camera.position.set(pos.x + body.size * 1.2, pos.y + body.size * 0.6, pos.z + body.size * 1.5);
    camera.lookAt(pos);
    savedCameraTarget.copy(pos);
  }

  // Get the Three canvas into immersive overlay
  const renderer = getRenderer();
  const canvas = renderer.domElement;

  if (canvas.parentElement.id !== 'immersive-overlay') {
    overlay.appendChild(canvas);
  }

  overlay.classList.add('active');

  // Show hint about 3D video availability
  if (!body.hasImmersive) {
    hintEl.textContent = '该天体的 3D 视频资源暂不可用，正在展示增强 3D 视图';
    hintEl.classList.add('visible');
  } else {
    hintEl.textContent =
      '3D 沉浸模式 · 拖拽旋转 · 滚轮缩放 · 按 ESC 退出';
    hintEl.classList.add('visible');
  }

  // Auto-hide hint after 5s
  setTimeout(() => hintEl.classList.remove('visible'), 5000);

  rotationSpeed = 0.003;
}

function exitImmersive() {
  store.isImmersive = false;

  // Restore canvas
  const container = document.getElementById('three-container');
  const renderer = getRenderer();
  if (renderer.domElement.parentElement !== container) {
    container.appendChild(renderer.domElement);
  }

  overlay.classList.remove('active');
  hintEl.classList.remove('visible');

  // Restore camera
  if (savedCameraPos) {
    const camera = getCamera();
    camera.position.copy(savedCameraPos);
    camera.lookAt(savedCameraTarget);
  }

  immersiveBodyId = null;
  rotationSpeed = 0;
}

export function updateImmersive(delta) {
  if (!store.isImmersive || !immersiveBodyId) return;

  const bodyMesh = getBodyMesh(immersiveBodyId);
  if (bodyMesh && rotationSpeed) {
    bodyMesh.rotation.y += rotationSpeed;

    // Also rotate glow children
    bodyMesh.children.forEach((child) => {
      if (child.userData.glowMaterial) {
        child.userData.glowMaterial.uniforms.uTime.value += delta;
      }
    });
  }
}
