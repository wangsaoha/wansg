// 共用舞台：渲染器、灯光、桌面、电路板、小克
import * as THREE from 'three';
import { makeXiaoke, mat } from './xiaoke.js';
import { makePCB } from './pcb.js';

export function createStage() {
  const W = 1080, H = 1920;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H); renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#FFE9D2');
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
  scene.add(new THREE.HemisphereLight('#FFF6EA', '#C89A78', 1.4));
  const sun = new THREE.DirectionalLight('#FFFFFF', 2.4);
  sun.position.set(14, 30, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 5; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 100 });
  scene.add(sun);

  // 桌面
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), mat('#F3D2B0', 0.9));
  desk.rotation.x = -Math.PI / 2; desk.position.y = -1; desk.receiveShadow = true; scene.add(desk);

  const pcb = makePCB(); scene.add(pcb.root);
  const xk = makeXiaoke(); xk.root.scale.setScalar(0.58); scene.add(xk.root);
  return { THREE, renderer, scene, camera, sun, pcb, xk };
}
