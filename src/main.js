import './styles/main.css';
import { store } from './store.js';
import { initScene, getScene, getCamera, getRenderer } from './scene/setup.js';
import { createStarfield } from './scene/starfield.js';
import { createAllBodies } from './scene/bodies.js';
import { createOrbits } from './scene/orbits.js';
import { initControls, flyToBody, flyToScale, updateCameraAnimation } from './scene/camera.js';
import { initSidebar } from './ui/sidebar.js';
import { initInfoPanel } from './ui/infopanel.js';
import { initScaleBar } from './ui/scalebar.js';
import { initImmersive, updateImmersive } from './ui/immersive.js';
import { initSplash } from './splash.js';

function initAll() {
  const { scene } = initScene();

  createStarfield(scene);
  createAllBodies(scene);
  createOrbits(scene);
  initControls();
  initSidebar();
  initInfoPanel();
  initScaleBar();
  initImmersive();

  store.on('bodySelected', (id) => flyToBody(id));
  store.on('scaleChanged', (scale) => flyToScale(scale));

  // Render loop
  const clock = new THREE.Clock();
  const renderer = getRenderer();
  const camera = getCamera();

  function render() {
    if (!store.isSplashDone) {
      requestAnimationFrame(render);
      return;
    }

    const delta = clock.getDelta();
    updateCameraAnimation();
    updateImmersive(delta);

    const stars = scene.getObjectByName('starfield');
    if (stars) {
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
    }

    scene.traverse((obj) => {
      if (obj.userData?.glowMaterial) {
        obj.userData.glowMaterial.uniforms.uTime.value += delta;
      }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();
}

// Start splash, then init scene
store.on('splashDone', initAll);

try {
  initSplash();
} catch (e) {
  console.error('Splash failed:', e);
  // Skip splash and go directly to scene
  const c = document.getElementById('splash-canvas');
  const o = document.getElementById('splash-overlay');
  if (c) c.style.display = 'none';
  if (o) o.style.display = 'none';
  store.isSplashDone = true;
  store.emit('splashDone');
  const container = document.getElementById('three-container');
  if (container) container.classList.add('visible');
}
