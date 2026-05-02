import * as THREE from 'three';
import { getBodiesByScale } from '../data/celestial.js';

const orbitLines = [];

export function createOrbits(scene) {
  const solarBodies = getBodiesByScale(0).filter((b) => b.parent === 'sun');

  solarBodies.forEach((body) => {
    const radius = Math.abs(body.position[0]);
    const points = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x334466,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    const line = new THREE.LineLoop(geo, mat);
    scene.add(line);
    orbitLines.push(line);
  });
}

export function clearOrbits() {
  orbitLines.forEach((line) => {
    line.geometry.dispose();
    line.material.dispose();
    if (line.parent) line.parent.remove(line);
  });
  orbitLines.length = 0;
}
