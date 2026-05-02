import * as THREE from 'three';

let scene, camera, renderer, container;

export function initScene() {
  container = document.createElement('div');
  container.id = 'three-container';
  document.getElementById('app').appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(0, 30, 60);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Ambient + point lights
  const ambient = new THREE.AmbientLight(0x222244, 1.5);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xffffff, 200, 300, 0.5);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, container };
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function getScene() {
  return scene;
}
export function getCamera() {
  return camera;
}
export function getRenderer() {
  return renderer;
}
export function getContainer() {
  return container;
}

export function showScene() {
  if (container) container.classList.add('visible');
}

export function getCanvas() {
  return renderer ? renderer.domElement : null;
}
