
import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const $ = (id) => document.getElementById(id);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#91b6a2");
scene.fog = new THREE.Fog("#91b6a2", 24, 105);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 180
);
camera.position.set(0, 4.7, 8.5);
camera.lookAt(0, 1, -8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
$("game").prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight("#e4ffe9", "#29462f", 2));

const sun = new THREE.DirectionalLight("#fff0c4", 3);
sun.position.set(-8, 15, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const mat = (color, roughness = 0.85, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const green = mat("#315b36");
const darkGreen = mat("#193c2a");
const trunkMat = mat("#63452e");
const pathMat = mat("#aa9368");
const stoneMat = mat("#777c70");
const goldMat = new THREE.MeshStandardMaterial({
  color: "#ffc928",
  metalness: 0.8,
  roughness: 0.22,
  emissive: "#8c4b00",
  emissiveIntensity: 0.22
});
const playerMat = mat("#38c9b0", 0.4);
const skinMat = mat("#dca77b");
const monsterMat = mat("#59375e", 0.55);
const eyeMat = new THREE.MeshBasicMaterial({ color: "#ff513f" });

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(0.5, 12, 10);
const cylinderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);

function mesh(geometry, material, x, y, z, parent = scene) {
  const obj = new THREE.Mesh(geometry, material);
  obj.position.set(x, y, z);
  obj.castShadow = true;
  obj.receiveShadow = true;
  parent.add(obj);
  return obj;
}

function block(material, x, y, z, sx, sy, sz, parent = scene) {
  const obj = mesh(boxGeo, material, x, y, z, parent);
  obj.scale.set(sx, sy, sz);
  return obj;
}

// Endless-looking forest path.
block(pathMat, 0, -0.16, -40, 7.2, 0.3, 100);

for (const x of [-1.2, 1.2]) {
  block(mat("#7c6847"), x, 0.015, -40, 0.045, 0.025, 100);
}

// Build our runner from simple 3D shapes.
const player = new THREE.Group();
scene.add(player);

const body = mesh(cylinderGeo, playerMat, 0, 1.12, 0, player);
body.scale.set(0.55, 0.95, 0.4);

const head = mesh(sphereGeo, skinMat, 0, 1.9, 0, player);
head.scale.set(0.38, 0.4, 0.34);

mesh(sphereGeo, mat("#202e27"), 0, 2.23, 0, player)
  .scale.set(0.4, 0.19, 0.36); // hair

const armParts = [];
const legParts = [];

for (const side of [-1, 1]) {
  const arm = mesh(cylinderGeo, playerMat, side * 0.42, 1.16, 0, player);
  arm.scale.set(0.15, 0.62, 0.15);
  arm.rotation.z = side * -0.18;
  armParts.push(arm);

  const leg = mesh(cylinderGeo, mat("#263d48"), side * 0.19, 0.48, 0, player);
  leg.scale.set(0.18, 0.63, 0.19);
  legParts.push(leg);
}

// A stylized beast follows behind the runner.
const monster = new THREE.Group();
scene.add(monster);
monster.position.set(0, 0, 3.0);

mesh(sphereGeo, monsterMat, 0, 1.45, 0, monster)
  .scale.set(0.75, 0.92, 0.58);
mesh(sphereGeo, monsterMat, 0, 2.35, -0.05, monster)
  .scale.set(0.64, 0.65, 0.57);

for (const side of [-1, 1]) {
  mesh(sphereGeo, eyeMat, side * 0.26, 2.42, -0.53, monster)
    .scale.set(0.10, 0.09, 0.05);

  const horn = mesh(cylinderGeo, mat("#d7c6a0"),
    side * 0.4, 2.91, -0.03, monster);
  horn.scale.set(0.12, 0.48, 0.12);
  horn.rotation.z = side * -0.35;
}

// Procedural trees.
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);

  const trunk = mesh(cylinderGeo, trunkMat, 0, 1.2, 0, tree);
  trunk.scale.set(0.22, 2.4, 0.22);

  for (const [y, size] of [[2.1, 1.15], [2.8, 0.85], [3.35, 0.58]]) {
    const crown = mesh(
      new THREE.ConeGeometry(size, size * 1.65, 7),
      Math.random() > 0.5 ? green : darkGreen,
      0, y, 0, tree
    );
    crown.rotation.y = Math.random() * 2;
  }

  return tree;
}

const scenery = [];
for (let i = 0; i < 46; i++) {
  const z = -i * 4 - 3;
  for (const side of [-1, 1]) {
    scenery.push(makeTree(
      side * (5 + Math.random() * 5),
      z + Math.random() * 2,
      0.7 + Math.random() * 0.9
    ));
  }
}

// Obstacles and coins are reused and moved forward again.
const obstacles = [];
const coins = [];
const laneX = [-2.1, 0, 2.1];

function makeObstacle() {
  const root = new THREE.Group();
  scene.add(root);

  // A fallen log: jump over it.
  const log = mesh(cylinderGeo, trunkMat, 0, 0.42, 0, root);
  log.rotation.z = Math.PI / 2;
  log.scale.set(0.35, 1.8, 0.35);

  // Spikes on top make the log easier to see.
  for (let i = -1; i <= 1; i++) {
    const spike = mesh(
      new THREE.ConeGeometry(0.15, 0.36, 5),
      stoneMat, i * 0.4, 0.75, 0, root
    );
    spike.visible = false;
  }

  return { root, type: "log", active: false, hit: false };
}

function makeCoins() {
  const root = new THREE.Group();
  scene.add(root);

  const ring = mesh(
    new THREE.TorusGeometry(0.34, 0.105, 8, 18),
    goldMat, 0, 1.25, 0, root
  );

  return { root, ring, active: false, collected: false };
}

for (let i = 0; i < 12; i++) obstacles.push(makeObstacle());
for (let i = 0; i < 30; i++) coins.push(makeCoins());

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
let monsterGap = 3;
let spawnTimer = 0;
let coinTimer = 0;
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
  monsterGap = 3;
  spawnTimer = 1;
  coinTimer = 0.4;

  for (const item of [...obstacles, ...coins]) {
    item.active = false;
    item.root.visible = false;
  }

  player.position.set(0, 0, 0);
  player.scale.set(1, 1, 1);
  monster.position.set(0, 0, 3);
  monster.visible = true;

  $("coins").textContent = "0";
  $("distance").textContent = "0";
  $("speed").textContent = "1.0";
}

function startGame() {
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
  gameOver = true;
  best = Math.max(best, Math.floor(distance));
  localStorage.setItem("wildRushBest", String(best));

  $("panelTitle").innerHTML = "RUN <span>OVER</span>";
  $("panelText").textContent =
    `Distance: ${Math.floor(distance)} m · Coins: ${coinCount} · Best: ${best} m`;
  $("startBtn").textContent = "RUN AGAIN";
  $("overlay").classList.remove("hidden");
}

function togglePause() {
  if (!running && !paused) return;
  paused = !paused;
  running = !paused;
  $("pauseBtn").textContent = paused ? "▶" : "Ⅱ";

  if (paused) {
    $("panelTitle").textContent = "PAUSED";
    $("panelText").textContent = "Catch your breath. The beast is waiting.";
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
  jumpVelocity = 8.5;
}

function slide() {
  if (!running || paused || jumpY > 0.1) return;
  sliding = 0.7;
}

function spawnObstacle() {
  const item = obstacles.find(x => !x.active);
  if (!item) return;

  item.active = true;
  item.hit = false;
  item.root.visible = true;
  item.root.position.set(laneX[Math.floor(Math.random() * 3)], 0,
    -65 - Math.random() * 8);

  // Every few obstacles, use a low barrier that needs sliding.
  if (Math.random() < 0.35) {
    item.type = "barrier";
    item.root.children[0].scale.set(1.5, 0.45, 0.5);
    item.root.children[0].position.y = 1.55;
    item.root.children[0].rotation.z = 0;
  } else {
    item.type = "log";
    item.root.children[0].scale.set(0.35, 1.8, 0.35);
    item.root.children[0].position.y = 0.42;
    item.root.children[0].rotation.z = Math.PI / 2;
  }
}

function spawnCoinLine() {
  const x = laneX[Math.floor(Math.random() * 3)];
  for (let i = 0; i < 5; i++) {
    const item = coins.find(c => !c.active);
    if (!item) return;

    item.active = true;
    item.collected = false;
    item.root.visible = true;
    item.root.position.set(x, 0, -42 - i * 2.2);
  }
}

function collectCoin(item) {
  item.collected = true;
  item.active = false;
  item.root.visible = false;
  coinCount++;
  $("coins").textContent = coinCount;

  if (sound) {
    // A short, gentle electronic coin sound.
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.frequency.value = 760;
      gain.gain.setValueAtTime(0.05, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001, audio.currentTime + 0.09
      );
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.09);
      oscillator.onended = () => audio.close();
    } catch {}
  }
}

function update(dt) {
  if (!running || paused) return;

  elapsed += dt;
  distance += speed * dt * 0.7;

  // Gradually accelerate as the run continues.
  speed = Math.min(12 + elapsed * 0.19, 31);
  $("distance").textContent = Math.floor(distance);
  $("speed").textContent = (speed / 12).toFixed(1);

  // Animate running limbs.
  const stride = Math.sin(elapsed * speed * 0.8);
  armParts.forEach((arm, i) => {
    arm.rotation.x = stride * (i === 0 ? 0.7 : -0.7);
  });
  legParts.forEach((leg, i) => {
    leg.rotation.x = stride * (i === 0 ? -0.8 : 0.8);
  });

  // Jump physics.
  if (jumpY > 0 || jumpVelocity > 0) {
    jumpVelocity -= 20 * dt;
    jumpY = Math.max(0, jumpY + jumpVelocity * dt);
    if (jumpY === 0) jumpVelocity = 0;
  }

  sliding = Math.max(0, sliding - dt);
  player.position.x = THREE.MathUtils.damp(
    player.position.x, laneX[lane], 13, dt
  );
  player.position.y = jumpY;
  player.scale.y = sliding > 0 ? 0.55 : 1;

  // The beast moves closer when the player makes a mistake.
  monsterGap = Math.min(3.5, monsterGap + dt * 0.04);
  monster.position.x = THREE.MathUtils.damp(
    monster.position.x, player.position.x * 0.7, 2, dt
  );
  monster.position.z = monsterGap;
  monster.position.y = Math.abs(Math.sin(elapsed * 7)) * 0.05;

  spawnTimer -= dt;
  coinTimer -= dt;

  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.55, 1.5 - elapsed * 0.004)
      * (0.8 + Math.random() * 0.5);
  }

  if (coinTimer <= 0) {
    spawnCoinLine();
    coinTimer = 2.0 + Math.random() * 1.6;
  }

  // Recycle forest scenery to keep the world moving forever.
  for (const tree of scenery) {
    tree.position.z += speed * dt;
    if (tree.position.z > 12) tree.position.z -= 184;
  }

  // Move obstacles toward the runner.
  for (const item of obstacles) {
    if (!item.active) continue;

    item.root.position.z += speed * dt;

    const close = Math.abs(item.root.position.z) < 1.0;
    const sameLane = Math.abs(item.root.position.x - player.position.x) < 0.8;

    if (close && sameLane && !item.hit) {
      const avoided = item.type === "log"
        ? jumpY > 0.75
        : sliding > 0;

      if (!avoided) {
        item.hit = true;
        monsterGap -= 1.05;
        speed = Math.max(12, speed - 2.5);

        if (monsterGap <= 0.5) {
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

  // Coins can be collected in any lane.
  for (const item of coins) {
    if (!item.active) continue;

    item.root.position.z += speed * dt;
    item.ring.rotation.y += dt * 3;
    item.ring.rotation.x = Math.sin(elapsed * 2) * 0.2;

    const close = Math.abs(item.root.position.z) < 1.0;
    const sameLane = Math.abs(item.root.position.x - player.position.x) < 0.8;

    if (close && sameLane && jumpY < 1.2) collectCoin(item);

    if (item.root.position.z > 8) {
      item.active = false;
      item.root.visible = false;
    }
  }

  // Smooth follow camera and optional subtle shake.
  const shakeX = shake ? Math.sin(elapsed * 18) * speed * 0.0015 : 0;
  camera.position.x = THREE.MathUtils.damp(
    camera.position.x, player.position.x * 0.22 + shakeX, 3, dt
  );
  camera.position.y = THREE.MathUtils.damp(
    camera.position.y, 4.7 + jumpY * 0.12, 3, dt
  );
  camera.lookAt(player.position.x * 0.12, 1.1, -8);
}

function animate(time) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;

  update(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// Keyboard controls.
window.addEventListener("keydown", (event) => {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp",
    "ArrowDown", "Space"];
  if (keys.includes(event.code) || keys.includes(event.key)) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
  if (event.key === "ArrowUp" || event.key === " " ||
      event.key.toLowerCase() === "w") jump();
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") slide();
  if (event.key.toLowerCase() === "p" || event.key === "Escape") {
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

$("soundToggle").addEventListener("change", e => sound = e.target.checked);
$("shakeToggle").addEventListener("change", e => shake = e.target.checked);

$("quality").addEventListener("change", e => {
  quality = e.target.value;
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, quality === "high" ? 1.7 : 1)
  );
  sun.castShadow = quality === "high";
  renderer.shadowMap.enabled = quality === "high";
});

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

// Swipe gestures on the game canvas.
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
    Math.min(devicePixelRatio, quality === "high" ? 1.7 : 1)
  );
});
