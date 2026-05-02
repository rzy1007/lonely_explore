import * as THREE from 'three';
import { celestialBodies } from '../data/celestial.js';

const bodyMeshes = new Map();

/** Create a procedural texture using canvas */
function makeTexture(color, type) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseColor = '#' + color.toString(16).padStart(6, '0');

  // Fill base
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  if (type === 'star' || type === 'gas_giant') {
    // Add noise / bands
    for (let y = 0; y < size; y++) {
      const alpha = 0.05 + Math.random() * 0.08;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, y, size, 1 + Math.random() * 2);
    }
    // Horizontal bands for gas giants
    if (type === 'gas_giant') {
      for (let i = 0; i < 8; i++) {
        const y = (size / 9) * (i + 1);
        const alpha = 0.1 + Math.random() * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(0, y - 2, size, 4 + Math.random() * 12);
      }
    }
  }

  if (type === 'rocky') {
    // Craters
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 8;
      ctx.fillStyle =
        Math.random() < 0.5
          ? `rgba(0,0,0,${0.05 + Math.random() * 0.1})`
          : `rgba(255,255,255,${0.03 + Math.random() * 0.06})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (type === 'ice_giant') {
    for (let y = 0; y < size; y++) {
      const alpha = 0.03 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, y, size, 1 + Math.random() * 2);
    }
  }

  return new THREE.CanvasTexture(canvas);
}

function getBodyType(body) {
  if (body.type.includes('恒星') || body.type.includes('主序星') || body.type.includes('巨星')) return 'star';
  if (body.type.includes('气态巨行星')) return 'gas_giant';
  if (body.type.includes('冰巨行星')) return 'ice_giant';
  if (body.type.includes('黑洞')) return 'black_hole';
  return 'rocky';
}

export function createAllBodies(scene) {
  celestialBodies.forEach((body) => {
    let mesh;
    const bodyType = getBodyType(body);
    const size = body.size * 0.4; // Scale down for 3D

    if (bodyType === 'black_hole') {
      // Black sphere with glowing accretion disk
      const geo = new THREE.SphereGeometry(size, 48, 48);
      const mat = new THREE.MeshBasicMaterial({ color: 0x000011 });
      mesh = new THREE.Mesh(geo, mat);

      // Accretion ring
      const ringGeo = new THREE.TorusGeometry(size * 1.5, size * 0.15, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x8844ff,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);

      // Glow sphere
      const glowGeo = new THREE.SphereGeometry(size * 1.8, 32, 32);
      const glowMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x4422aa) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform vec3 uColor;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(uColor, intensity * 0.5);
          }
        `,
        transparent: true,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glow);
      mesh.userData.glowMaterial = glowMat;
    } else {
      const texture = makeTexture(body.color, bodyType);
      const geo = new THREE.SphereGeometry(size, 48, 48);
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: bodyType === 'star' ? 0.2 : 0.7,
        metalness: 0.1,
        emissive: bodyType === 'star' ? body.color : 0x000000,
        emissiveIntensity: bodyType === 'star' ? 0.8 : 0,
      });
      mesh = new THREE.Mesh(geo, mat);

      // Add glow for stars
      if (bodyType === 'star') {
        const glowGeo = new THREE.SphereGeometry(size * 1.4, 32, 32);
        const glowColor = new THREE.Color(body.color);
        const glowMat = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: glowColor },
          },
          vertexShader: `
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
              float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
              gl_FragColor = vec4(uColor, intensity * 0.6);
            }
          `,
          transparent: true,
          depthWrite: false,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glow);
      }

      // Rings for Saturn
      if (body.hasRings) {
        const ringGeo = new THREE.TorusGeometry(size * 1.6, size * 0.15, 16, 80);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xeeddbb,
          roughness: 0.6,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.4;
        mesh.add(ring);
      }
    }

    const [x, y, z] = body.position;
    mesh.position.set(x, y, z);
    mesh.name = body.id;
    mesh.userData.bodyId = body.id;

    scene.add(mesh);
    bodyMeshes.set(body.id, mesh);
  });
}

export function getBodyMesh(id) {
  return bodyMeshes.get(id);
}

export function getBodyMeshes() {
  return bodyMeshes;
}
