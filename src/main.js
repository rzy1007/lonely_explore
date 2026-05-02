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

// Start splash animation
initSplash();

// When splash is done, init the 3D scene
store.on('splashDone', () => {
  initAll();
});

function initAll() {
  // Scene
  const { scene } = initScene();

  // Background stars
  createStarfield(scene);

  // Celestial bodies
  createAllBodies(scene);

  // Orbits for solar system
  createOrbits(scene);

  // Controls
  initControls();

  // UI
  initSidebar();
  initInfoPanel();
  initScaleBar();
  initImmersive();

  // Listen for body selection
  store.on('bodySelected', (id) => {
    flyToBody(id);
  });

  // Listen for scale changes
  store.on('scaleChanged', (scale) => {
    flyToScale(scale);
  });

  // Render loop
  const clock = new THREE.Clock();
  const renderer = getRenderer();
  const camera = getCamera();

  function render() {
    if (store.isSplashDone) {
      const delta = clock.getDelta();

      updateCameraAnimation();
      updateImmersive(delta);

      // Slowly rotate starfield
      const stars = scene.getObjectByName('starfield');
      if (stars) {
        stars.rotation.y += 0.0001;
        stars.rotation.x += 0.00005;
      }

      // Update black hole glows
      scene.traverse((obj) => {
        if (obj.userData && obj.userData.glowMaterial) {
          obj.userData.glowMaterial.uniforms.uTime.value += delta;
        }
      });

      renderer.render(scene, camera);
    }

    requestAnimationFrame(render);
  }

  render();
}
