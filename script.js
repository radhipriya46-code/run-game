
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// WILD RUSH — visual upgrade
// Original procedural 3D characters and forest environment.

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();

scene.background = new THREE.Color("#9ab8a1");
scene.fog = new THREE.FogExp2("#9ab8a1", 0.009);

const camera = new THREE.PerspectiveCamera(
  62, innerWidth / innerHeight, 0.1, 220
);
camera.position.set(0, 4.5, 9);
camera.lookAt(0, 1, -8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute("aria-label", "Wild Rush 3D game");
$("game").prepend(renderer.domElement);

// ---------- LIGHTING ----------

scene.add(new THREE.HemisphereLight("#e6f5d9", "#273b29", 2.1));

const sun = new THREE.DirectionalLight("#ffe2ad", 3.2);
sun.position.set(-12, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -15;
sun.shadow.normalBias = 0.04;
scene.add(sun);

const fillLight = new THREE.DirectionalLight("#9ccebd", 1.1);
fillLight.position.set(9, 7, -12);
scene.add(fillLight);

// ---------- PROCEDURAL TEXTURES ----------

function makeTexture(base, flecks, count = 1800) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = Math.random() * 0.24;
    ctx.fillStyle = flecks[
      Math.floor(Math.random() * flecks.length)
    ];
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = 1 + Math.random() * 5;
    ctx.fillRect(x, y, size, size * (0.4 + Math.random()));
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(
    renderer.capabilities.getMaxAnisotropy(), 4
  );
  return texture;
}

const dirtTexture = makeTexture(
  "#705c42", ["#a38a65", "#4b4335", "#d0b58b", "#514331"]
);
dirtTexture.repeat.set(3, 22);

const grassTexture = makeTexture(
  "#344b30", ["#47663a", "#233d29", "#71834a", "#29372a"]
);
grassTexture.repeat.set(7, 24);

const barkTexture = makeTexture(
  "#493324", ["#79523a", "#33261e", "#96704b"], 900
);

const clothTexture = makeTexture(
  "#583f2c", ["#8c6540", "#35291f", "#b38a58"], 1100
);

function material(color, roughness = 0.85, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness, ...extra
  });
}

const dirtMat = new THREE.MeshStandardMaterial({
  map: dirtTexture, roughness: 1
});
const grassMat = new THREE.MeshStandardMaterial({
  map: grassTexture, roughness: 1
});
const barkMat = new THREE.MeshStandardMaterial({
  map: barkTexture, roughness: 0.94
});
const leatherMat = new THREE.MeshStandardMaterial({
  map: clothTexture,
  color: "#b07b45",
  roughness: 0.78
});

const darkLeather = material("#3b2920");
const hatMat = material("#4b3020");
const hatBandMat = material("#d1a35c");
const shirtMat = material("#c6b28a");
const denimMat = material("#354d68");
const bootMat = material("#38251b");
const skinMat = material("#c88d64");
const goldMat = new THREE.MeshStandardMaterial({
  color: "#ffd34c",
  metalness: 0.8,
  roughness: 0.2,
  emissive: "#ac5a06",
  emissiveIntensity: 0.32
});

const whiteEye = material("#fff2d6", 0.2, {
  emissive: "#ffba6a", emissiveIntensity: 0.5
});
const pupilMat = material("#17100e");
const monsterSkin = material("#392d4b", 0.6);
const monsterLight = material("#59415e", 0.65);
const hornMat = material("#c6b99a", 0.55);
const toothMat = material("#e5d5ad", 0.4);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(0.5, 16, 12);
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const coneGeo = new THREE.ConeGeometry(0.5, 1, 10);

function addMesh(geo, mat, parent, pos, scale, cast = true) {
  const obj = new THREE.Mesh(geo, mat);
  obj.position.set(...pos);
  obj.scale.set(...scale);
  obj.castShadow = cast;
  obj.receiveShadow = true;
  parent.add(obj);
  return obj;
}

function box(parent, mat, pos, scale) {
  return addMesh(boxGeo, mat, parent, pos, scale);
}

function ball(parent, mat, pos, scale) {
  return addMesh(sphereGeo, mat, parent, pos, scale);
}

function cylinder(parent, mat, pos, scale) {
  return addMesh(cylinderGeo, mat, parent, pos, scale);
}

function cone(parent, mat, pos, scale) {
  return addMesh(coneGeo, mat, parent, pos, scale);
}

// ---------- FOREST FLOOR ----------

const floor = new THREE.Group();
scene.add(floor);

box(floor, grassMat, [0, -0.38, -65], [100, 0.5, 190]);
box(floor, dirtMat, [0, -0.1, -65], [7.8, 0.2, 190]);

const pathEdgeMat = material("#b8a17b");
for (const x of [-3.96, 3.96]) {
  box(floor, pathEdgeMat, [x, -0.04, -65], [0.14, 0.16, 190]);
}

// Pebbles, fallen branches and small plants beside the path.
const decoration = [];
const pebbleMat = material("#747967");
const leafMats = [
  material("#355a36"),
  material("#486d3c"),
  material("#253e2b"),
  material("#687d48")
];

for (let i = 0; i < 130; i++) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const x = side * (4.3 + Math.random() * 8);
  const z = -Math.random() * 178;

  if (Math.random() < 0.65) {
    const pebble = ball(scene, pebbleMat, [
      x, -0.02, z
    ], [
      0.15 + Math.random() * 0.32,
      0.1 + Math.random() * 0.16,
      0.15 + Math.random() * 0.32
    ]);
    pebble.rotation.y = Math.random() * 3;
    decoration.push(pebble);
  } else {
    const plant = new THREE.Group();
    plant.position.set(x, 0, z);
    scene.add(plant);

    for (let j = 0; j < 5; j++) {
      const leaf = cone(plant,
        leafMats[j % leafMats.length],
        [
          (Math.random() - 0.5) * 0.5,
          0.25 + Math.random() * 0.3,
          (Math.random() - 0.5) * 0.4
        ],
        [0.12, 0.7, 0.12]
      );
      leaf.rotation.z = (Math.random() - 0.5) * 1.6;
    }

    decoration.push(plant);
  }
}

// ---------- LAYERED FOREST TREES ----------

const scenery = [];

function makeTree(x, z, size = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(size);
  scene.add(tree);

  cylinder(tree, barkMat, [0, 1.6, 0], [0.3, 3.2, 0.3]);

  // Exposed roots add a little more detail at the base.
  for (let i = 0; i < 4; i++) {
    const root = cylinder(
      tree, barkMat,
      [Math.sin(i * 1.57) * 0.32, 0.13, Math.cos(i * 1.57) * 0.32],
      [0.12, 0.75, 0.12]
    );
    root.rotation.z = Math.sin(i * 1.57) * 0.7;
    root.rotation.x = Math.cos(i * 1.57) * 0.7;
  }

  const foliage = [
    [0, 3.1, 0, 1.25],
    [-0.48, 3.55, 0.12, 0.9],
    [0.5, 3.65, -0.1, 0.96],
    [0.05, 4.1, 0, 0.82],
    [-0.25, 4.45, -0.05, 0.58]
  ];

  foliage.forEach(([fx, fy, fz, s], i) => {
    const crown = ball(
      tree, leafMats[i % leafMats.length],
      [fx, fy, fz], [s, s * 0.85, s]
    );
    crown.castShadow = false;
  });

  return tree;
}

for (let i = 0; i < 36; i++) {
  const z = -i * 5 - 6;

  for (const side of [-1, 1]) {
    scenery.push(makeTree(
      side * (5.2 + Math.random() * 4.5),
      z + Math.random() * 2,
      0.75 + Math.random() * 0.75
    ));
  }
}

// ---------- COWBOY CHARACTER ----------

const player = new THREE.Group();
scene.add(player);

const cowboy = new THREE.Group();
player.add(cowboy);

// Boots and legs have pivot groups so the running motion is articulated.
const legPivots = [];
const armPivots = [];

for (const side of [-1, 1]) {
  const legPivot = new THREE.Group();
  legPivot.position.set(side * 0.19, 0.72, 0);
  cowboy.add(legPivot);
  legPivots.push(legPivot);

  cylinder(legPivot, denimMat, [0, -0.19, 0], [0.19, 0.54, 0.19]);
  ball(legPivot, denimMat, [0, -0.44, 0], [0.2, 0.16, 0.2]);

  const boot = box(
    legPivot, bootMat, [0, -0.63, -0.1], [0.28, 0.19, 0.43]
  );
  boot.rotation.x = -0.04;

  box(legPivot, material("#b58a4e"), [
    0, -0.62, 0.02
  ], [0.23, 0.055, 0.24]);

  const armPivot = new THREE.Group();
  armPivot.position.set(side * 0.46, 1.42, 0);
  cowboy.add(armPivot);
  armPivots.push(armPivot);

  cylinder(armPivot, shirtMat, [side * 0.03, -0.22, 0], [
    0.18, 0.53, 0.18
  ]);

  cylinder(armPivot, skinMat, [side * 0.03, -0.51, 0], [
    0.13, 0.24, 0.14
  ]);

  ball(armPivot, skinMat, [side * 0.03, -0.66, 0], [
    0.14, 0.13, 0.14
  ]);

  // Leather wrist cuffs.
  cylinder(armPivot, darkLeather, [
    side * 0.03, -0.44, 0
  ], [0.16, 0.09, 0.16]);
}

// Torso, shoulders, and leather vest.
cylinder(cowboy, shirtMat, [0, 1.38, 0], [0.66, 0.84, 0.4]);
ball(cowboy, shirtMat, [0, 1.75, 0], [0.39, 0.28, 0.34]);

for (const side of [-1, 1]) {
  const vest = box(cowboy, leatherMat, [
    side * 0.17, 1.43, -0.218
  ], [0.29, 0.66, 0.09]);
  vest.rotation.z = side * -0.08;

  // Vest stitching and buttons.
  for (let j = 0; j < 3; j++) {
    ball(cowboy, hatBandMat, [
      side * 0.12, 1.35 + j * 0.17, -0.28
    ], [0.027, 0.027, 0.018]);
  }
}

// Neck and head.
cylinder(cowboy, skinMat, [0, 1.92, 0], [0.2, 0.25, 0.2]);

ball(cowboy, skinMat, [0, 2.19, -0.01], [
  0.34, 0.42, 0.32
]);

// Ears.
for (const side of [-1, 1]) {
  ball(cowboy, skinMat, [side * 0.32, 2.19, 0], [
    0.09, 0.13, 0.08
  ]);
}

// Eyes, brows, nose and moustache.
for (const side of [-1, 1]) {
  ball(cowboy, material("#fff1d6"), [
    side * 0.125, 2.25, -0.294
  ], [0.073, 0.052, 0.032]);

  ball(cowboy, pupilMat, [
    side * 0.125, 2.25, -0.324
  ], [0.027, 0.035, 0.016]);

  const brow = box(cowboy, darkLeather, [
    side * 0.125, 2.34, -0.3
  ], [0.14, 0.035, 0.045]);
  brow.rotation.z = side * -0.12;

  const moustache = ball(cowboy, darkLeather, [
    side * 0.08, 2.055, -0.306
  ], [0.12, 0.055, 0.045]);
  moustache.rotation.z = side * -0.18;
}

ball(cowboy, skinMat, [0, 2.15, -0.34], [
  0.075, 0.08, 0.075
]);

// Red neckerchief.
const scarfMat = material("#a9322a");
cylinder(cowboy, scarfMat, [0, 1.92, 0], [0.29, 0.13, 0.27]);

const scarfTail = cone(
  cowboy, scarfMat, [0, 1.78, -0.23], [0.12, 0.3, 0.07]
);
scarfTail.rotation.x = -0.5;

// Iconic wide-brimmed cowboy hat.
const brim = cylinder(cowboy, hatMat, [
  0, 2.58, -0.015
], [0.63, 0.085, 0.53]);
brim.scale.set(1, 1, 0.78);

const crown = cylinder(cowboy, hatMat, [
  0, 2.79, 0.02
], [0.36, 0.4, 0.33]);

const hatBand = cylinder(cowboy, hatBandMat, [
  0, 2.68, 0.02
], [0.365, 0.075, 0.337]);

// Belt and brass buckle.
cylinder(cowboy, darkLeather, [0, 0.99, 0], [
  0.35, 0.11, 0.23
]);
box(cowboy, hatBandMat, [0, 0.99, -0.23], [
  0.14, 0.13, 0.045
]);

// Small holster on the hip.
const holster = box(cowboy, darkLeather, [
  0.39, 1.04, 0.04
], [0.16, 0.35, 0.18]);
holster.rotation.z = -0.2;

// ---------- MONSTER: THE HOLLOW BEAST ----------

const monster = new THREE.Group();
scene.add(monster);
monster.position.set(0, 0, 3.2);

const beastBody = new THREE.Group();
monster.add(beastBody);

// Oversized shoulders and torso.
ball(beastBody, monsterSkin, [0, 1.42, 0], [
  0.83, 0.98, 0.58
]);
ball(beastBody, monsterLight, [0, 1.92, -0.04], [
  0.91, 0.45, 0.56
]);

// Rib-like markings.
for (const side of [-1, 1]) {
  for (let i = 0; i < 3; i++) {
    const rib = ball(beastBody, monsterLight, [
      side * (0.31 + i * 0.1), 1.34 - i * 0.12, -0.49
    ], [0.18, 0.055, 0.035]);
    rib.rotation.z = side * -0.25;
  }
}

// Neck and massive skull.
cylinder(beastBody, monsterSkin, [0, 2.13, 0], [
  0.48, 0.7, 0.45
]);

ball(beastBody, monsterSkin, [0, 2.55, -0.08], [
  0.66, 0.67, 0.56
]);

// Jaw and muzzle.
ball(beastBody, monsterLight, [0, 2.22, -0.49], [
  0.46, 0.26, 0.26
]);

ball(beastBody, material("#160f19"), [0, 2.3, -0.682], [
  0.36, 0.12, 0.04
]);

// Glowing orange-red eyes.
const eyeGlow = new THREE.MeshStandardMaterial({
  color: "#ff4a19",
  emissive: "#ff2600",
  emissiveIntensity: 4,
  roughness: 0.2
});

for (const side of [-1, 1]) {
  ball(beastBody, material("#151018"), [
    side * 0.27, 2.66, -0.54
  ], [0.18, 0.13, 0.085]);

  ball(beastBody, eyeGlow, [
    side * 0.27, 2.66, -0.612
  ], [0.105, 0.085, 0.04]);

  ball(beastBody, material("#fff0bd", 0.15, {
    emissive: "#ff8a20", emissiveIntensity: 2
  }), [
    side * 0.27, 2.66, -0.648
  ], [0.035, 0.05, 0.018]);

  // Long swept horns.
  const horn = cone(beastBody, hornMat, [
    side * 0.44, 3.14, -0.03
  ], [0.19, 0.82, 0.19]);
  horn.rotation.z = side * -0.48;
  horn.rotation.x = -0.2;

  const ear = cone(beastBody, monsterSkin, [
    side * 0.64, 2.78, 0.02
  ], [0.17, 0.42, 0.13]);
  ear.rotation.z = side * -1.0;

  // Thick arms and clawed fingers.
  const arm = cylinder(beastBody, monsterSkin, [
    side * 0.8, 1.48, -0.02
  ], [0.29, 0.85, 0.32]);
  arm.rotation.z = side * -0.3;

  const hand = ball(beastBody, monsterLight, [
    side * 0.91, 1.03, -0.15
  ], [0.28, 0.24, 0.24]);

  for (let j = 0; j < 3; j++) {
    const claw = cone(beastBody, hornMat, [
      side * (0.82 + j * 0.12), 0.84, -0.31
    ], [0.055, 0.27, 0.055]);
    claw.rotation.x = -0.45;
    claw.rotation.z = side * 0.15;
  }

  // Fangs visible at the mouth.
  for (let j = 0; j < 2; j++) {
    const fang = cone(beastBody, toothMat, [
      side * (0.17 + j * 0.1), 2.26, -0.7
    ], [0.07, 0.22, 0.07]);
    fang.rotation.x = Math.PI;
  }

  // Heavy legs.
  const leg = cylinder(beastBody, monsterSkin, [
    side * 0.34, 0.52, 0.04
  ], [0.27, 0.75, 0.29]);
  leg.rotation.z = side * -0.08;

  ball(beastBody, monsterLight, [
    side * 0.36, 0.19, -0.12
  ], [0.29, 0.18, 0.38]);
}

// Dark dorsal spikes.
for (let i = 0; i < 5; i++) {
  const spike = cone(beastBody, monsterLight, [
    (i - 2) * 0.23, 2.18 + (i % 2) * 0.1, 0.43
  ], [0.14, 0.42, 0.14]);
  spike.rotation.x = 0.5;
}

// ---------- OBSTACLES AND COINS ----------

const laneX = [-2.1, 0, 2.1];
const obstacles = [];
const coins = [];

function makeObstacle() {
  const root = new THREE.Group();
  scene.add(root);

  const log = cylinder(root, barkMat, [0, 0.4, 0], [
    0.35, 1.9, 0.35
  ]);
  log.rotation.z = Math.PI / 2;

  const logEnd = cylinder(root, material("#ad8355"), [
    0, 0.4, -0.97
  ], [0.34, 0.06, 0.34]);
  logEnd.rotation.z = Math.PI / 2;

  const barrier = box(root, material("#6e4530"), [
    0, 1.45, 0
  ], [1.6, 0.3, 0.38]);

  barrier.visible = false;
  const marker = box(root, material("#d9ba78"), [
    0, 1.45, -0.205
  ], [1.2, 0.07, 0.025]);
  marker.visible = false;

  return {
    root, log, logEnd, barrier, marker,
    type: "log", active: false, hit: false
  };
}

function makeCoin() {
  const root = new THREE.Group();
  scene.add(root);

  const ring = addMesh(
    new THREE.TorusGeometry(0.32, 0.105, 10, 24),
    goldMat, root, [0, 1.2, 0], [1, 1, 1]
  );

  const core = cylinder(root, goldMat, [0, 1.2, 0], [
    0.17, 0.045, 0.17
  ]);
  core.rotation.x = Math.PI / 2;

  return { root, ring, active: false };
}

for (let i = 0; i < 14; i++) obstacles.push(makeObstacle());
for (let i = 0; i < 36; i++) coins.push(makeCoin());

// ---------- GAME STATE ----------

let running = false;
let paused = false;
let gameOver = false;
let lane = 1;
let jumpY = 0;
let jumpVelocity = 0;
let sliding = 0;
let elapsed = 0;
let distance = 0;
let coinCount = 0;
let speed = 12;
let monsterGap = 3.2;
let spawnTimer = 1;
let coinTimer = 1;
let lastTime = 0;
let shake = true;
let sound = true;
let quality = "high";

let best = Number(localStorage.getItem("wildRushBest") || 0);

function resetGame() {
  lane = 1;
  jumpY = 0;
  jumpVelocity = 0;
  sliding = 0;
  elapsed = 0;
  distance = 0;
  coinCount = 0;
  speed = 12;
  monsterGap = 3.2;
  spawnTimer = 1;
  coinTimer = 0.8;

  for (const item of [...obstacles, ...coins]) {
    item.active = false;
    item.root.visible = false;
  }

  player.position.set(0, 0, 0);
  player.scale.set(1, 1, 1);
  cowboy.visible = true;
  monster.position.set(0, 0, 3.2);
  monster.visible = true;

  $("coins").textContent = "0";
  $("distance").textContent = "0";
  $("speed").textContent = "1.0";
}

function startGame() {
  $("panelTitle").innerHTML = 'WILD <span>RUSH</span>';
  $("panelText").textContent =
    "Run fast. Collect gold. Escape the beast.";
  $("startBtn").textContent = "START RUN";

  resetGame();
  running = true;
  paused = false;
  gameOver = false;
  $("overlay").classList.add("hidden");
  $("settings").classList.add("hidden");
  $("pauseBtn").textContent = "Ⅱ";
}

function endGame() {
  running = false;
  paused = false;
  gameOver = true;

  best = Math.max(best, Math.floor(distance));
  localStorage.setItem("wildRushBest", String(best));

  $("panelTitle").innerHTML = 'BEAST <span>CAUGHT YOU</span>';
  $("panelText").textContent =
    `Distance: ${Math.floor(distance)} m · Coins: ${coinCount} · Best: ${best} m`;
  $("startBtn").textContent = "RUN AGAIN";
  $("overlay").classList.remove("hidden");
}

function togglePause() {
  if (gameOver) return;
  if (!running && !paused) return;

  paused = !paused;
  running = !paused;
  $("pauseBtn").textContent = paused ? "▶" : "Ⅱ";

  if (paused) {
    $("panelTitle").textContent = "PAUSED";
    $("panelText").textContent = "The beast is still hunting you.";
    $("startBtn").textContent = "RESUME RUN";
    $("overlay").classList.remove("hidden");
  } else {
    $("overlay").classList.add("hidden");
  }
}

function move(direction) {
  if (!running || paused) return;
  lane = THREE.MathUtils.clamp(lane + direction, 0, 2);
}

function jump() {
  if (!running || paused || jumpY > 0.01 || sliding > 0) return;
  jumpVelocity = 8.7;
}

function slide() {
  if (!running || paused || jumpY > 0.1) return;
  sliding = 0.78;
}

function spawnObstacle() {
  const item = obstacles.find(x => !x.active);
  if (!item) return;

  item.active = true;
  item.hit = false;
  item.root.visible = true;
  item.root.position.set(
    laneX[Math.floor(Math.random() * 3)],
    0,
    -65
  );

  item.type = Math.random() < 0.32 ? "barrier" : "log";
  const isBarrier = item.type === "barrier";

  item.log.visible = !isBarrier;
  item.logEnd.visible = !isBarrier;
  item.barrier.visible = isBarrier;
  item.marker.visible = isBarrier;
}

function spawnCoinLine() {
  const x = laneX[Math.floor(Math.random() * 3)];

  for (let i = 0; i < 5; i++) {
    const item = coins.find(c => !c.active);
    if (!item) return;

    item.active = true;
    item.root.visible = true;
    item.root.position.set(x, 0, -36 - i * 2.1);
  }
}

function collectCoin(item) {
  item.active = false;
  item.root.visible = false;
  coinCount++;
  $("coins").textContent = coinCount;

  if (sound) {
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 760;
      gain.gain.setValueAtTime(0.045, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001, audio.currentTime + 0.1
      );

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.1);
      oscillator.onended = () => audio.close();
    } catch {}
  }
}

// ---------- MAIN UPDATE ----------

function update(dt) {
  if (!running || paused) return;

  elapsed += dt;
  distance += speed * dt * 0.7;
  speed = Math.min(12 + elapsed * 0.2, 31);

  $("distance").textContent = Math.floor(distance);
  $("speed").textContent = (speed / 12).toFixed(1);

  const stride = Math.sin(elapsed * speed * 0.7);

  legPivots.forEach((leg, i) => {
    leg.rotation.x = stride * (i === 0 ? 0.8 : -0.8);
  });

  armPivots.forEach((arm, i) => {
    arm.rotation.x = stride * (i === 0 ? -0.75 : 0.75);
  });

  // Jumping and sliding.
  if (jumpY > 0 || jumpVelocity > 0) {
    jumpVelocity -= 21 * dt;
    jumpY = Math.max(0, jumpY + jumpVelocity * dt);
    if (jumpY === 0) jumpVelocity = 0;
  }

  sliding = Math.max(0, sliding - dt);
  player.position.x = THREE.MathUtils.damp(
    player.position.x, laneX[lane], 12, dt
  );
  player.position.y = jumpY;
  cowboy.scale.y = sliding > 0 ? 0.65 : 1;

  // The monster reacts to the chase.
  monsterGap = Math.min(3.2, monsterGap + dt * 0.05);
  monster.position.x = THREE.MathUtils.damp(
    monster.position.x, player.position.x * 0.65, 2, dt
  );
  monster.position.z = monsterGap;
  beastBody.rotation.z = Math.sin(elapsed * 7) * 0.035;
  beastBody.rotation.x = Math.sin(elapsed * 5) * 0.025;

  // Move scenery toward the camera to simulate forward running.
  for (const tree of scenery) {
    tree.position.z += speed * dt;
    if (tree.position.z > 12) tree.position.z -= 180;
  }

  for (const obj of decoration) {
    obj.position.z += speed * dt;
    if (obj.position.z > 12) obj.position.z -= 180;
  }

  spawnTimer -= dt;
  coinTimer -= dt;

  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.58, 1.45 - elapsed * 0.003)
      * (0.8 + Math.random() * 0.45);
  }

  if (coinTimer <= 0) {
    spawnCoinLine();
    coinTimer = 2 + Math.random() * 1.6;
  }

  for (const item of obstacles) {
    if (!item.active) continue;

    item.root.position.z += speed * dt;

    const close = Math.abs(item.root.position.z) < 1;
    const sameLane =
      Math.abs(item.root.position.x - player.position.x) < 0.8;

    if (close && sameLane && !item.hit) {
      const avoided = item.type === "log"
        ? jumpY > 0.72
        : sliding > 0;

      if (!avoided) {
        item.hit = true;
        monsterGap -= 1.1;
        speed = Math.max(12, speed - 2.5);

        if (monsterGap <= 0.55) {
          endGame();
          return;
        }
      }
    }

    if (item.root.position.z > 8) {
      item.active = false;
      item.root.visible = false;
    }
  }

  for (const item of coins) {
    if (!item.active) continue;

    item.root.position.z += speed * dt;
    item.ring.rotation.y += dt * 3.5;

    const close = Math.abs(item.root.position.z) < 1;
    const sameLane =
      Math.abs(item.root.position.x - player.position.x) < 0.8;

    if (close && sameLane) collectCoin(item);

    if (item.root.position.z > 8) {
      item.active = false;
      item.root.visible = false;
    }
  }

  const shakeX = shake
    ? Math.sin(elapsed * 18) * speed * 0.0012
    : 0;

  camera.position.x = THREE.MathUtils.damp(
    camera.position.x,
    player.position.x * 0.2 + shakeX,
    3, dt
  );

  camera.position.y = THREE.MathUtils.damp(
    camera.position.y, 4.5 + jumpY * 0.1, 3, dt
  );

  camera.lookAt(player.position.x * 0.12, 1.2, -8);
}

// ---------- RENDER LOOP ----------

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;

  update(dt);
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ---------- KEYBOARD ----------

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if ([
    "arrowleft", "arrowright", "arrowup", "arrowdown", " "
  ].includes(key)) event.preventDefault();

  if (event.repeat) return;

  if (key === "arrowleft" || key === "a") move(-1);
  if (key === "arrowright" || key === "d") move(1);
  if (key === "arrowup" || key === "w" || key === " ") jump();
  if (key === "arrowdown" || key === "s") slide();

  if (key === "p" || key === "escape") {
    if ($("settings").classList.contains("hidden")) togglePause();
  }
});

$("startBtn").addEventListener("click", () => {
  if (paused && !gameOver) {
    paused = false;
    running = true;
    $("overlay").classList.add("hidden");
    $("pauseBtn").textContent = "Ⅱ";
  } else {
    startGame();
  }
});

$("pauseBtn").addEventListener("click", togglePause);

$("settingsBtn").addEventListener("click", () => {
  if (running) {
    running = false;
    paused = true;
  }
  $("settings").classList.remove("hidden");
});

$("closeSettings").addEventListener("click", () => {
  $("settings").classList.add("hidden");

  if (paused && !gameOver) {
    paused = false;
    running = true;
    $("overlay").classList.add("hidden");
  } else if (!running && !gameOver) {
    $("overlay").classList.remove("hidden");
  }
});

$("soundToggle").addEventListener("change", e => {
  sound = e.target.checked;
});

$("shakeToggle").addEventListener("change", e => {
  shake = e.target.checked;
});

$("quality").addEventListener("change", e => {
  quality = e.target.value;
  const high = quality === "high";

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, high ? 1.5 : 1)
  );
  renderer.shadowMap.enabled = high;
  sun.castShadow = high;
});

// ---------- MOBILE BUTTONS AND SWIPES ----------

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("pointerdown", e => {
    e.preventDefault();

    const action = button.dataset.action;
    if (action === "left") move(-1);
    if (action === "right") move(1);
    if (action === "jump") jump();
    if (action === "slide") slide();
  });
});

let touchStart = null;

renderer.domElement.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse") return;
  touchStart = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener("pointerup", e => {
  if (!touchStart) return;

  const dx = e.clientX - touchStart.x;
  const dy = e.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? 1 : -1);
  } else if (dy < 0) {
    jump();
  } else {
    slide();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, quality === "high" ? 1.5 : 1)
  );
});
