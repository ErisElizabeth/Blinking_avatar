import * as THREE from "three";

const APP_VERSION = "0.0.7-alpha";
const THREE_VERSION_PIN = "0.164.1";

const avatarAssets = {
  torso: "assets/avatarTorso.png",

  arms: {
    rightUpper: "assets/avatarRightUpperArm.png",
    rightUp: "assets/avatarRightUp.png",
    rightDown: "assets/avatarRightDown.png",

    leftUpper: "assets/avatarLeftUpperArm.png",
    leftUp: "assets/avatarLeftUp.png",
    leftDown: "assets/avatarLeftDown.png",
  },

  eyes: {
    open: "assets/avatarEyesOpen.png",
    closed: "assets/avatarEyesClosed.png",
    tic: "assets/avatarTic.png",
  },

  mouth: {
    closed: "assets/avatarMouthClosed.png",
    open: "assets/avatarMouthOpen.png",
    surprised: "assets/avatarMouthSurprised.png",
  },

  props: {
    eraser: "assets/avatarEraser.png",
    chalk: "assets/avatarChalk.png",
  },

  effects: {
    hearts: "assets/avatarHearts.png",
    stars: "assets/avatarStars.png",
    thoughtBubble: "assets/avatarThoughtBubble.png",
  },

  sounds: {
    write: "assets/write.mp3",
    erase: "assets/erase.mp3",
  },
};

const backgroundLayerSources = [
  "assets/Layer_0011_0.png",
  "assets/Layer_0010_1.png",
  "assets/Layer_0009_2.png",
  "assets/Layer_0008_3.png",
  "assets/Layer_0006_4.png",
  "assets/Layer_0005_5.png",
  "assets/Layer_0003_6.png",
  "assets/Layer_0002_7.png",
  "assets/Layer_0001_8.png",
  "assets/Layer_0000_9.png",
  "assets/Layer_0004_Lights.png",
  "assets/Layer_0007_Lights.png",
];

const sceneContainer = document.getElementById("scene-container");

// The original 2D build appended backgroundLayerSources as <img> layers.
// The 3D build keeps the list above as project history and draws a black room instead.
//const backgroundLayerImages = [];

const ALIEN_COLOR = "#639464";
const WALL_COLOR = "#000000";
const GHOST_SPHERE_COLOR = "#7f827f";
const CHALKBOARD_COLOR = "#274c43";
const CHALK_COLOR = "#e0dcdc";
const ERASER_COLOR = "#b7b7b7";
const AVATAR_FLOOR_OFFSET = 0.64;

const ROOM = {
  width: 12,
  height: 5.2,
  depth: 12,
  avatarTravelLimit: 5.25,
};

const CHALKBOARD_LINES = [
  "Like, comment, and subscribe!",
  "www.eriselizabeth.com",
];

const CHALKBOARD_SEQUENCE = {
  boardPosition: new THREE.Vector3(0, 2.42, -5.66),
  writingPosition: new THREE.Vector3(0.18, 0, -4.42),
  presentingPosition: new THREE.Vector3(-2.08, 0, -3.28),
  avatarFadeOpacity: 0.1,
  writeDuration: 6200,
  holdDuration: 5000,
  eraseDuration: 3200,
  arrivalDistance: 0.065,
};

const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(WALL_COLOR);
scene.fog = new THREE.FogExp2(WALL_COLOR, 0.055);

const camera = new THREE.PerspectiveCamera(
  42,
  sceneContainer.clientWidth / sceneContainer.clientHeight,
  0.1,
  80,
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.setClearColor(WALL_COLOR, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneContainer.appendChild(renderer.domElement);

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function makeVerticalGradientTexture(topColor, middleColor, bottomColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);

  gradient.addColorStop(0, topColor);
  gradient.addColorStop(0.5, middleColor);
  gradient.addColorStop(1, bottomColor);

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

const alienGradientTexture = makeVerticalGradientTexture(
  "#7dae7f",
  ALIEN_COLOR,
  "#456c48",
);

const alienMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  map: alienGradientTexture,
  roughness: 0.72,
  metalness: 0.02,
  emissive: "#203521",
  emissiveIntensity: 0.18,
});

const alienGlowMaterial = new THREE.MeshBasicMaterial({
  color: ALIEN_COLOR,
  transparent: true,
  opacity: 0.09,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const eyeMaterial = new THREE.MeshStandardMaterial({
  color: "#030503",
  roughness: 0.44,
  metalness: 0,
  emissive: "#000000",
});

const mouthMaterial = new THREE.MeshBasicMaterial({
  color: "#020202",
  transparent: true,
  opacity: 0.96,
  side: THREE.DoubleSide,
});

const wallMaterial = new THREE.MeshStandardMaterial({
  color: WALL_COLOR,
  roughness: 1,
  metalness: 0,
  side: THREE.BackSide,
});

const ghostSphereMaterial = new THREE.MeshBasicMaterial({
  color: GHOST_SPHERE_COLOR,
  wireframe: true,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const ghostGlowMaterial = new THREE.MeshBasicMaterial({
  color: GHOST_SPHERE_COLOR,
  transparent: true,
  opacity: 0.035,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const chalkboardMaterial = new THREE.MeshStandardMaterial({
  color: CHALKBOARD_COLOR,
  roughness: 0.9,
  metalness: 0,
  emissive: "#07100e",
  emissiveIntensity: 0.25,
});

const chalkMaterial = new THREE.MeshStandardMaterial({
  color: CHALK_COLOR,
  roughness: 0.82,
  metalness: 0,
});

const eraserMaterial = new THREE.MeshStandardMaterial({
  color: ERASER_COLOR,
  roughness: 0.78,
  metalness: 0,
});

const labCoatMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.68,
  metalness: 0,
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
  side: THREE.DoubleSide,
});

//preloadBackgroundLayers();
let smoothedVolume = 0;
let eyesClosed = false;
let mouthOpen = false;

let lastBlinkTime = 0;
let blinkStartTime = 0;
let isBlinking = false;
let nextBlinkTime = 0;
let activeBlinkDuration = 150;

const avatarState = {
  eyes: "open",
  mouth: "closed",
  leftArm: "down",
  rightArm: "down",
  prop: null,
  effect: null,
};

const BLINK_DURATION = 150;
const MIN_INTERVAL = 1000;
const BLINK_CHANCE = 0.005;
const BLINK_MEAN_INTERVAL = 4200;

const mouthStates = [
  { name: "closed", width: 0.24, height: 0.018, y: -0.43 },
  { name: "small", width: 0.16, height: 0.055, y: -0.43 },
  { name: "medium", width: 0.2, height: 0.095, y: -0.44 },
  { name: "open", width: 0.25, height: 0.145, y: -0.45 },
  { name: "surprised", width: 0.18, height: 0.21, y: -0.46 },
];

const controlState = {
  keys: new Set(),
  avatarYaw: 0,
  walkPhase: 0,
  jumpStart: 0,
  jumpDuration: 520,
  jumpHeight: 0.32,
  cameraYaw: 0,
  cameraDistance: 6.6,
  cameraHeight: 2.6,
  waveUntil: 0,
};

const audioState = {
  analyser: null,
  audioContext: null,
  dataArray: null,
  frequencyArray: null,
  noiseFloor: 0.015,
  calibratedFrames: 0,
  voiceLevel: 0,
  targetMouthLevel: 0,
  currentMouthLevel: 0,
  previousVoiceLevel: 0,
  ready: false,
  starting: false,
  permissionBlocked: false,
};

const soundEffects = Object.entries(avatarAssets.sounds).reduce(
  (sounds, [name, path]) => {
    const audio = new Audio(path);

    audio.preload = "auto";
    audio.volume = 0.82;
    sounds[name] = audio;

    return sounds;
  },
  {},
);

const chalkboardEvent = {
  active: false,
  phase: "idle",
  phaseStart: 0,
  savedState: null,
  writeSoundPlaying: false,
  eraseSoundPlaying: false,
  isWalking: false,
};

const visualState = {
  avatarOpacity: 1,
  targetAvatarOpacity: 1,
};

const chalkFontReady = document.fonts
  ? document.fonts.load('64px "Caveat Brush"').catch(() => null)
  : Promise.resolve();

const avatar = buildAvatar();
avatar.root.position.y = AVATAR_FLOOR_OFFSET;
scene.add(avatar.root);

const effectSprites = buildEffectSprites();
const ghostSpheres = buildGhostSpheres(120);
const chalkboard = buildChalkboard();
const heldTools = buildHeldTools();

buildRoom();
buildLighting();
scheduleNextBlink(0);
updateAvatarImage();
resizeRendererToContainer();

window.addEventListener("resize", resizeRendererToContainer);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("pointerdown", unlockAudio, { once: true });

requestMicStart();
requestAnimationFrame(animate);

function buildRoom() {
  const roomMesh = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width, ROOM.height, ROOM.depth),
    wallMaterial,
  );

  roomMesh.position.y = ROOM.height / 2;
  scene.add(roomMesh);

  const floorGrid = new THREE.GridHelper(
    ROOM.width,
    24,
    new THREE.Color("#172017"),
    new THREE.Color("#050505"),
  );

  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.3;
  floorGrid.position.y = 0.003;
  scene.add(floorGrid);
}

function buildLighting() {
  const ambientLight = new THREE.HemisphereLight("#91aa91", "#020202", 1.25);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight("#dff5df", 2.15);
  keyLight.position.set(-2.5, 5.5, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const faceLight = new THREE.PointLight(ALIEN_COLOR, 1.45, 6.5);
  faceLight.position.set(0, 2.5, 2.2);
  scene.add(faceLight);
}

function buildAvatar() {
  const root = new THREE.Group();
  root.name = "basic-three-js-grey-alien-avatar";

  const body = new THREE.Group();
  root.add(body);

  const parts = {};

  const torso = makeAlienMesh(new THREE.CapsuleGeometry(0.42, 0.86, 14, 24), {
    position: [0, 1.2, 0],
    scale: [0.82, 1.05, 0.58],
  });
  torso.castShadow = true;
  body.add(torso);
  parts.torso = torso;

  const hips = makeAlienMesh(new THREE.SphereGeometry(1, 28, 18), {
    position: [0, 0.76, 0],
    scale: [0.5, 0.22, 0.34],
  });
  hips.castShadow = true;
  body.add(hips);
  parts.hips = hips;

  const neck = makeAlienMesh(new THREE.CylinderGeometry(0.11, 0.12, 0.42, 18), {
    position: [0, 1.86, 0],
    scale: [0.9, 1, 0.9],
  });
  neck.castShadow = true;
  body.add(neck);
  parts.neck = neck;

  const head = new THREE.Group();
  head.position.set(0, 2.35, 0);
  body.add(head);
  parts.head = head;

  const cranium = makeAlienMesh(new THREE.SphereGeometry(1, 40, 28), {
    position: [0, 0.34, 0],
    scale: [0.72, 0.92, 0.58],
  });
  cranium.castShadow = true;
  head.add(cranium);

  const chin = makeAlienMesh(new THREE.SphereGeometry(1, 32, 18), {
    position: [0, -0.38, 0.03],
    scale: [0.45, 0.37, 0.41],
  });
  chin.castShadow = true;
  head.add(chin);

  addSoftGlow(cranium, head, 1.055, 0.055);
  addSoftGlow(chin, head, 1.055, 0.045);

  parts.leftEye = makeEye(-0.28, 0.12, 0.52, -0.14);
  parts.rightEye = makeEye(0.28, 0.12, 0.52, 0.14);
  head.add(parts.leftEye.open, parts.leftEye.closed);
  head.add(parts.rightEye.open, parts.rightEye.closed);

  const mouth = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mouthMaterial);
  mouth.name = "procedural-mouth";
  mouth.position.set(0, mouthStates[0].y, 0.555);
  mouth.scale.set(mouthStates[0].width, mouthStates[0].height, 1);
  head.add(mouth);
  parts.mouth = mouth;

  parts.leftArm = makeArm(-1);
  parts.rightArm = makeArm(1);
  parts.leftArm.shoulder.position.set(-0.48, 1.63, 0);
  parts.rightArm.shoulder.position.set(0.48, 1.63, 0);
  body.add(parts.leftArm.shoulder, parts.rightArm.shoulder);

  parts.leftLeg = makeLeg(-1);
  parts.rightLeg = makeLeg(1);
  parts.leftLeg.hip.position.set(-0.22, 0.72, 0);
  parts.rightLeg.hip.position.set(0.22, 0.72, 0);
  body.add(parts.leftLeg.hip, parts.rightLeg.hip);

  parts.labCoat = buildLabCoat(parts);
  body.add(parts.labCoat.torso);

  return { root, body, parts };
}

function makeAlienMesh(geometry, options) {
  const mesh = new THREE.Mesh(geometry, alienMaterial);

  if (options.position) {
    mesh.position.fromArray(options.position);
  }

  if (options.scale) {
    mesh.scale.fromArray(options.scale);
  }

  addSoftGlow(mesh, mesh, 1.04, 0.035);

  return mesh;
}

function addSoftGlow(sourceMesh, parent, scale, opacity) {
  const glow = new THREE.Mesh(sourceMesh.geometry, alienGlowMaterial.clone());
  glow.name = `${sourceMesh.name || "alien-part"}-soft-glow`;
  glow.material.opacity = opacity;

  if (parent === sourceMesh) {
    glow.position.set(0, 0, 0);
    glow.rotation.set(0, 0, 0);
    glow.scale.setScalar(scale);
  } else {
    glow.position.copy(sourceMesh.position);
    glow.rotation.copy(sourceMesh.rotation);
    glow.scale.copy(sourceMesh.scale).multiplyScalar(scale);
  }

  parent.add(glow);
  return glow;
}

function makeEye(x, y, z, tilt) {
  const open = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), eyeMaterial);
  open.name = x < 0 ? "left-open-eye" : "right-open-eye";
  open.position.set(x, y, z);
  open.rotation.z = tilt;
  open.scale.set(0.15, 0.32, 0.025);

  const closed = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.018, 0.23, 4, 10),
    eyeMaterial,
  );
  closed.name = x < 0 ? "left-closed-eye" : "right-closed-eye";
  closed.position.set(x, y, z + 0.012);
  closed.rotation.z = Math.PI / 2 + tilt;
  closed.scale.set(1, 0.85, 1);
  closed.visible = false;

  return { open, closed };
}

function makeArm(side) {
  const shoulder = new THREE.Group();
  const elbow = new THREE.Group();

  const upperArm = makeLimbSegment(0.62, 0.075);
  const forearm = makeLimbSegment(0.58, 0.07);
  const hand = makeAlienMesh(new THREE.SphereGeometry(1, 18, 12), {
    position: [0, -0.61, 0.035],
    scale: [0.11, 0.13, 0.08],
  });
  const toolSocket = new THREE.Group();

  shoulder.rotation.z = side * 0.2;
  elbow.position.y = -0.61;
  elbow.rotation.z = side * 0.08;
  toolSocket.position.set(0, -0.66, 0.12);

  shoulder.add(upperArm, elbow);
  elbow.add(forearm, hand, toolSocket);

  return {
    side,
    shoulder,
    elbow,
    upperArm,
    forearm,
    hand,
    toolSocket,
    targetZ: side * 0.2,
  };
}

function makeLeg(side) {
  const hip = new THREE.Group();
  const knee = new THREE.Group();

  const thigh = makeLimbSegment(0.66, 0.085);
  const shin = makeLimbSegment(0.62, 0.075);
  const foot = makeAlienMesh(new THREE.SphereGeometry(1, 18, 12), {
    position: [0, -0.64, 0.1],
    scale: [0.16, 0.07, 0.28],
  });

  hip.rotation.z = side * 0.08;
  knee.position.y = -0.65;
  knee.rotation.x = 0.08;

  hip.add(thigh, knee);
  knee.add(shin, foot);

  return {
    side,
    hip,
    knee,
    thigh,
    shin,
    foot,
  };
}

function makeLimbSegment(length, radius) {
  const cylinderLength = Math.max(0.01, length - radius * 2);
  const mesh = makeAlienMesh(
    new THREE.CapsuleGeometry(radius, cylinderLength, 10, 16),
    { position: [0, -length / 2, 0], scale: [1, 1, 1] },
  );

  mesh.castShadow = true;
  return mesh;
}

function buildLabCoat(parts) {
  const torso = new THREE.Group();
  torso.name = "primitive-lab-coat";

  const back = makeCoatPanel([0, 1.13, -0.43], [0.76, 1.16, 0.045]);
  const leftFront = makeCoatPanel([-0.16, 1.16, 0.32], [0.28, 1.18, 0.045]);
  const rightFront = makeCoatPanel([0.16, 1.16, 0.32], [0.28, 1.18, 0.045]);
  const lowerLeft = makeCoatPanel([-0.18, 0.62, 0.28], [0.26, 0.5, 0.05]);
  const lowerRight = makeCoatPanel([0.18, 0.62, 0.28], [0.26, 0.5, 0.05]);
  const leftLapels = makeCoatPanel([-0.14, 1.62, 0.36], [0.12, 0.44, 0.05]);
  const rightLapels = makeCoatPanel([0.14, 1.62, 0.36], [0.12, 0.44, 0.05]);

  leftFront.rotation.z = -0.05;
  rightFront.rotation.z = 0.05;
  back.rotation.x = 0.1;
  lowerLeft.rotation.z = -0.05;
  lowerRight.rotation.z = 0.05;
  leftLapels.rotation.z = -0.42;
  rightLapels.rotation.z = 0.42;

  torso.add(
    back,
    leftFront,
    rightFront,
    lowerLeft,
    lowerRight,
    leftLapels,
    rightLapels,
  );

  addCoatSleeves(parts.leftArm);
  addCoatSleeves(parts.rightArm);

  return { torso };
}

function makeCoatPanel(position, scale) {
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    labCoatMaterial.clone(),
  );

  panel.position.fromArray(position);
  panel.scale.fromArray(scale);
  panel.castShadow = true;
  panel.receiveShadow = true;

  return panel;
}

function addCoatSleeves(arm) {
  const upperSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.088, 0.48, 8, 14),
    labCoatMaterial.clone(),
  );
  const forearmSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.082, 0.44, 8, 14),
    labCoatMaterial.clone(),
  );

  upperSleeve.name =
    arm.side < 0 ? "left-upper-coat-sleeve" : "right-upper-coat-sleeve";
  forearmSleeve.name =
    arm.side < 0 ? "left-forearm-coat-sleeve" : "right-forearm-coat-sleeve";
  upperSleeve.castShadow = true;
  forearmSleeve.castShadow = true;

  arm.upperArm.add(upperSleeve);
  arm.forearm.add(forearmSleeve);
}

function buildChalkboard() {
  const group = new THREE.Group();
  group.name = "spawned-chalkboard";
  group.position.copy(CHALKBOARD_SEQUENCE.boardPosition);
  group.visible = false;

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(3.95, 1.72, 0.14),
    chalkboardMaterial,
  );
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);

  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(4.05, 0.08, 0.18),
    chalkboardMaterial.clone(),
  );
  lip.position.set(0, -0.9, 0.08);
  lip.material.color.set("#1b3832");
  group.add(lip);

  const textCanvas = document.createElement("canvas");
  textCanvas.width = 1024;
  textCanvas.height = 512;

  const textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.minFilter = THREE.LinearFilter;
  textTexture.magFilter = THREE.LinearFilter;

  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.56, 1.24),
    new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      depthWrite: false,
    }),
  );

  textPlane.position.set(0, 0.06, 0.085);
  group.add(textPlane);

  scene.add(group);

  const boardData = {
    group,
    textPlane,
    textCanvas,
    textTexture,
  };

  drawChalkboardText(boardData, 0, 0);
  return boardData;
}

function buildHeldTools() {
  const chalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.36, 14),
    chalkMaterial,
  );
  chalk.name = "right-hand-chalk";
  chalk.rotation.x = Math.PI / 2;
  chalk.position.set(0.02, 0, 0.08);
  chalk.visible = false;

  const eraser = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.12),
    eraserMaterial,
  );
  eraser.name = "right-hand-eraser";
  eraser.position.set(0.025, 0, 0.075);
  eraser.visible = false;

  avatar.parts.rightArm.toolSocket.add(chalk, eraser);

  return { chalk, eraser };
}

function drawChalkboardText(boardData, writeProgress, eraseProgress) {
  const canvas = boardData.textCanvas;
  const context = canvas.getContext("2d");
  const visibleText = getRevealedChalkText(writeProgress);
  const visibleWidth = canvas.width * (1 - eraseProgress);

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (visibleWidth <= 0 || !visibleText.some(Boolean)) {
    boardData.textTexture.needsUpdate = true;
    return;
  }

  context.save();
  context.beginPath();
  context.rect(0, 0, visibleWidth, canvas.height);
  context.clip();
  context.fillStyle = CHALK_COLOR;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(224, 220, 220, 0.42)";
  context.shadowBlur = 4;

  context.font = '72px "Caveat Brush", cursive';
  context.fillText(visibleText[0], canvas.width / 2, 205);

  context.font = '58px "Caveat Brush", cursive';
  context.fillText(visibleText[1], canvas.width / 2, 315);

  context.restore();
  boardData.textTexture.needsUpdate = true;
}

function getRevealedChalkText(writeProgress) {
  const totalCharacters = CHALKBOARD_LINES.join("\n").length;
  let visibleCharacters = Math.floor(
    totalCharacters * clamp(writeProgress, 0, 1),
  );

  return CHALKBOARD_LINES.map((line) => {
    const revealed = line.slice(0, visibleCharacters);
    visibleCharacters = Math.max(0, visibleCharacters - line.length - 1);

    return revealed;
  });
}

function showHeldTool(toolName) {
  heldTools.chalk.visible = toolName === "chalk";
  heldTools.eraser.visible = toolName === "eraser";
  avatarState.prop = toolName;
}

function setChalkboardTextOverlay(enabled) {
  chalkboard.textPlane.renderOrder = enabled ? 50 : 0;
  chalkboard.textPlane.material.depthTest = !enabled;
}

function playSound(name, loop = false) {
  const sound = soundEffects[name];

  if (!sound) {
    return;
  }

  sound.pause();
  sound.currentTime = 0;
  sound.loop = loop;
  sound.play().catch((error) => {
    console.warn(`${capitalize(name)} sound could not play:`, error);
  });
}

function stopSound(name) {
  const sound = soundEffects[name];

  if (!sound) {
    return;
  }

  sound.pause();
  sound.currentTime = 0;
  sound.loop = false;
}

function buildEffectSprites() {
  const effectLayout = {
    hearts: { height: 0.56, position: [-0.72, 3.46, 0.72] },
    stars: { height: 0.62, position: [0.78, 3.46, 0.72] },
    thoughtBubble: { height: 0.78, position: [0.78, 3.42, 0.72] },
  };

  return Object.entries(effectLayout).reduce((sprites, [name, layout]) => {
    const texture = makeCroppedSpriteTexture(
      avatarAssets.effects[name],
      (aspectRatio) => {
        sprite.scale.set(layout.height * aspectRatio, layout.height, 1);
      },
    );

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.name = `${name}-keyboard-effect`;
    sprite.position.fromArray(layout.position);
    sprite.scale.set(layout.height, layout.height, 1);
    sprite.visible = false;
    avatar.root.add(sprite);

    sprites[name] = {
      sprite,
      basePosition: sprite.position.clone(),
      startedAt: 0,
      duration: 2200,
    };

    return sprites;
  }, {});
}

function makeCroppedSpriteTexture(path, onReady) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const image = new Image();

  image.onload = () => {
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;

    const sourceContext = sourceCanvas.getContext("2d");
    sourceContext.drawImage(image, 0, 0);

    const imageData = sourceContext.getImageData(
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
    );
    const bounds = findAlphaBounds(
      imageData.data,
      sourceCanvas.width,
      sourceCanvas.height,
    );

    if (!bounds) {
      return;
    }

    const padding = 6;
    const sx = clamp(bounds.minX - padding, 0, sourceCanvas.width);
    const sy = clamp(bounds.minY - padding, 0, sourceCanvas.height);
    const ex = clamp(bounds.maxX + padding, 0, sourceCanvas.width);
    const ey = clamp(bounds.maxY + padding, 0, sourceCanvas.height);
    const sw = Math.max(1, ex - sx);
    const sh = Math.max(1, ey - sy);

    canvas.width = sw;
    canvas.height = sh;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, sw, sh);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    texture.needsUpdate = true;
    onReady(sw / sh);
  };

  image.src = path;
  return texture;
}

function findAlphaBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let foundPixel = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > 12) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        foundPixel = true;
      }
    }
  }

  if (!foundPixel) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function buildGhostSpheres(count) {
  const spheres = [];
  const geometry = new THREE.SphereGeometry(1, 14, 10);

  for (let i = 0; i < count; i += 1) {
    const group = new THREE.Group();
    const radius = 0.012 + Math.random() * 0.028;
    const basePosition = makeGhostSpherePosition();

    const wire = new THREE.Mesh(geometry, ghostSphereMaterial.clone());
    wire.scale.setScalar(radius);
    wire.material.opacity = 0.34 + Math.random() * 0.28;

    const glow = new THREE.Mesh(geometry, ghostGlowMaterial.clone());
    glow.scale.setScalar(radius * 2);
    glow.material.opacity = 0.018 + Math.random() * 0.04;

    group.position.copy(basePosition);
    group.add(glow, wire);
    scene.add(group);

    spheres.push({
      group,
      basePosition,
      drift: new THREE.Vector3(
        (Math.random() - 0.5) * 0.18,
        (Math.random() - 0.5) * 0.14,
        (Math.random() - 0.5) * 0.18,
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.8,
      spin: new THREE.Vector3(
        Math.random() * 0.25,
        Math.random() * 0.35,
        Math.random() * 0.2,
      ),
    });
  }

  return spheres;
}

function makeGhostSpherePosition() {
  const halfWidth = ROOM.width / 2;
  const halfDepth = ROOM.depth / 2;
  const face = Math.random();

  let position;

  if (face < 0.52) {
    position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(ROOM.width * 0.9),
      ROOM.height - THREE.MathUtils.randFloat(0.12, 0.78),
      THREE.MathUtils.randFloatSpread(ROOM.depth * 0.9),
    );
  } else if (face < 0.64) {
    position = new THREE.Vector3(
      -halfWidth + THREE.MathUtils.randFloat(0.08, 0.42),
      THREE.MathUtils.randFloat(3.35, ROOM.height - 0.3),
      THREE.MathUtils.randFloatSpread(ROOM.depth * 0.9),
    );
  } else if (face < 0.76) {
    position = new THREE.Vector3(
      halfWidth - THREE.MathUtils.randFloat(0.08, 0.42),
      THREE.MathUtils.randFloat(3.35, ROOM.height - 0.3),
      THREE.MathUtils.randFloatSpread(ROOM.depth * 0.9),
    );
  } else if (face < 0.88) {
    position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(ROOM.width * 0.9),
      THREE.MathUtils.randFloat(3.35, ROOM.height - 0.3),
      -halfDepth + THREE.MathUtils.randFloat(0.08, 0.42),
    );
  } else {
    position = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(ROOM.width * 0.9),
      THREE.MathUtils.randFloat(3.35, ROOM.height - 0.3),
      halfDepth - THREE.MathUtils.randFloat(0.08, 0.42),
    );
  }

  const avatarHeadSpace = new THREE.Vector3(0, AVATAR_FLOOR_OFFSET + 2.72, 0);
  const isNearAvatar =
    position.distanceTo(avatarHeadSpace) < 4 ||
    Math.hypot(position.x, position.z) < 3.75;

  if (isNearAvatar) {
    return makeGhostSpherePosition();
  }

  return position;
}

async function requestMicStart() {
  if (audioState.ready || audioState.starting || audioState.permissionBlocked) {
    return;
  }

  audioState.starting = true;

  try {
    await startMic();
  } finally {
    audioState.starting = false;
  }
}

async function startMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;

    const dataArray = new Float32Array(analyser.fftSize);
    const frequencyArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);

    audioState.analyser = analyser;
    audioState.audioContext = audioContext;
    audioState.dataArray = dataArray;
    audioState.frequencyArray = frequencyArray;
    audioState.ready = true;

    checkVolume();
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      audioState.permissionBlocked = true;
    }

    console.warn("Microphone access unavailable:", error);
  }
}

function unlockAudio() {
  if (audioState.audioContext?.state === "suspended") {
    audioState.audioContext.resume();
  }

  if (!audioState.permissionBlocked) {
    requestMicStart();
  }
}

function checkVolume() {
  if (!audioState.analyser) {
    return;
  }

  audioState.analyser.getFloatTimeDomainData(audioState.dataArray);
  audioState.analyser.getByteFrequencyData(audioState.frequencyArray);

  let squaredSum = 0;

  for (let i = 0; i < audioState.dataArray.length; i += 1) {
    squaredSum += audioState.dataArray[i] * audioState.dataArray[i];
  }

  const rootMeanSquare = Math.sqrt(squaredSum / audioState.dataArray.length);

  if (audioState.calibratedFrames < 72) {
    audioState.noiseFloor =
      audioState.noiseFloor * 0.92 + rootMeanSquare * 0.08;
    audioState.calibratedFrames += 1;
  } else if (rootMeanSquare < audioState.noiseFloor * 1.6) {
    audioState.noiseFloor =
      audioState.noiseFloor * 0.995 + rootMeanSquare * 0.005;
  }

  const voiceAboveFloor = Math.max(
    0,
    rootMeanSquare - audioState.noiseFloor * 1.18,
  );
  const normalizedVoice = clamp(voiceAboveFloor * 24, 0, 1);
  const attack = normalizedVoice > audioState.voiceLevel ? 0.38 : 0.16;

  audioState.previousVoiceLevel = audioState.voiceLevel;
  audioState.voiceLevel =
    audioState.voiceLevel * (1 - attack) + normalizedVoice * attack;

  smoothedVolume = smoothedVolume * 0.82 + audioState.voiceLevel * 100 * 0.18;

  const spike =
    audioState.voiceLevel - audioState.previousVoiceLevel > 0.22 ? 0.12 : 0;
  const mouthLevel = clamp(
    Math.round((audioState.voiceLevel + spike) * 4),
    0,
    4,
  );

  audioState.targetMouthLevel = mouthLevel;
  mouthOpen = mouthLevel > 0;
  avatarState.mouth = mouthStates[mouthLevel].name;

  //requestAnimationFrame(checkVolume);
  requestAnimationFrame(checkVolume);
}

function updateAvatarImage() {
  // Historical name retained from the layered PNG version.
  // It now syncs avatar state to Three.js mesh visibility and procedural mouth shape.
  avatarState.eyes = eyesClosed ? "closed" : "open";

  avatar.parts.leftEye.open.visible = !eyesClosed;
  avatar.parts.rightEye.open.visible = !eyesClosed;
  avatar.parts.leftEye.closed.visible = eyesClosed;
  avatar.parts.rightEye.closed.visible = eyesClosed;

  setMouthState(mouthStates[audioState.targetMouthLevel]);
}

function setMouthState(targetState) {
  avatar.parts.mouth.userData.targetWidth = targetState.width;
  avatar.parts.mouth.userData.targetHeight = targetState.height;
  avatar.parts.mouth.userData.targetY = targetState.y;
}

function animate(currentTime) {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = currentTime * 0.001;

  runBlinkController(currentTime);
  updateChalkboardEvent(delta, currentTime);
  updateKeyboardMotion(delta, currentTime);
  updateJump(currentTime);
  updateMouthGeometry(delta);
  updateAvatarOpacity(delta);
  updateEffects(currentTime);
  updateGhostSphereMotion(elapsed);
  updateCamera(delta);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function scheduleNextBlink(timestamp) {
  const randomValue = Math.max(Number.EPSILON, Math.random());
  const poissonDelay =
    MIN_INTERVAL - Math.log(randomValue) * BLINK_MEAN_INTERVAL;

  nextBlinkTime = timestamp + poissonDelay;
}

function runBlinkController(currentTime) {
  const timeSinceLastBlink = currentTime - lastBlinkTime;

  if (!isBlinking) {
    if (timeSinceLastBlink > MIN_INTERVAL && currentTime >= nextBlinkTime) {
      startBlink(currentTime);
    }
  } else if (currentTime - blinkStartTime >= activeBlinkDuration) {
    endBlink(currentTime);
  }
}

function startBlink(timestamp) {
  isBlinking = true;
  blinkStartTime = timestamp;
  activeBlinkDuration = BLINK_DURATION + THREE.MathUtils.randInt(-28, 46);

  eyesClosed = true;
  updateAvatarImage();
}

function endBlink(timestamp) {
  isBlinking = false;
  lastBlinkTime = timestamp;

  eyesClosed = false;
  scheduleNextBlink(timestamp);
  updateAvatarImage();
}

function updateMouthGeometry(delta) {
  const mouth = avatar.parts.mouth;
  const targetState = mouthStates[audioState.targetMouthLevel];

  if (avatarState.mouth !== targetState.name) {
    avatarState.mouth = targetState.name;
  }

  setMouthState(targetState);

  const currentWidth = mouth.scale.x;
  const currentHeight = mouth.scale.y;
  const currentY = mouth.position.y;
  const damping = 1 - Math.pow(0.001, delta);

  mouth.scale.x = THREE.MathUtils.lerp(
    currentWidth,
    mouth.userData.targetWidth,
    damping,
  );
  mouth.scale.y = THREE.MathUtils.lerp(
    currentHeight,
    mouth.userData.targetHeight,
    damping,
  );
  mouth.position.y = THREE.MathUtils.lerp(
    currentY,
    mouth.userData.targetY,
    damping,
  );
}

function setAvatarOpacityTarget(opacity, immediate = false) {
  visualState.targetAvatarOpacity = clamp(opacity, 0, 1);

  if (immediate) {
    visualState.avatarOpacity = visualState.targetAvatarOpacity;
    applyAvatarOpacity(visualState.avatarOpacity);
  }
}

function updateAvatarOpacity(delta) {
  visualState.avatarOpacity = THREE.MathUtils.damp(
    visualState.avatarOpacity,
    visualState.targetAvatarOpacity,
    6,
    delta,
  );

  applyAvatarOpacity(visualState.avatarOpacity);
}

function applyAvatarOpacity(opacity) {
  avatar.root.traverse((object) => {
    if (!object.isMesh || object.isSprite) {
      return;
    }

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.forEach((material) => {
      if (!material) {
        return;
      }

      if (material.userData.baseOpacity === undefined) {
        material.userData.baseOpacity = material.opacity;
        material.userData.baseTransparent = material.transparent;
      }

      material.opacity = material.userData.baseOpacity * opacity;
      material.transparent =
        material.userData.baseTransparent || opacity < 0.999;
      material.depthWrite =
        opacity >= 0.999 && material.userData.baseOpacity >= 0.999;
    });
  });
}

function startJump(currentTime) {
  if (
    chalkboardEvent.active ||
    (controlState.jumpStart &&
      currentTime - controlState.jumpStart < controlState.jumpDuration)
  ) {
    return;
  }

  controlState.jumpStart = currentTime;
}

function updateJump(currentTime) {
  const jumpAge = currentTime - controlState.jumpStart;

  if (
    !controlState.jumpStart ||
    jumpAge < 0 ||
    jumpAge > controlState.jumpDuration ||
    chalkboardEvent.active
  ) {
    avatar.root.position.y = AVATAR_FLOOR_OFFSET;
    return;
  }

  const progress = jumpAge / controlState.jumpDuration;
  avatar.root.position.y =
    AVATAR_FLOOR_OFFSET +
    Math.sin(progress * Math.PI) * controlState.jumpHeight;
}

function startChalkboardEvent(currentTime = performance.now()) {
  if (chalkboardEvent.active) {
    return;
  }

  chalkboardEvent.active = true;
  chalkboardEvent.phase = "approach";
  chalkboardEvent.phaseStart = currentTime;
  chalkboardEvent.writeSoundPlaying = false;
  chalkboardEvent.eraseSoundPlaying = false;
  chalkboardEvent.isWalking = false;
  chalkboardEvent.savedState = captureControlSnapshot();

  avatar.root.position.y = AVATAR_FLOOR_OFFSET;
  controlState.jumpStart = 0;
  controlState.cameraYaw = 0;
  controlState.cameraDistance = 7.2;
  controlState.cameraHeight = 2.45;
  controlState.keys.clear();
  controlState.waveUntil = 0;

  avatarState.leftArm = "down";
  avatarState.rightArm = "down";
  avatarState.effect = null;

  chalkboard.group.visible = true;
  setAvatarOpacityTarget(CHALKBOARD_SEQUENCE.avatarFadeOpacity);
  setChalkboardTextOverlay(true);
  showHeldTool(null);
  drawChalkboardText(chalkboard, 0, 0);

  chalkFontReady.then(() => {
    if (chalkboardEvent.active && chalkboard.group.visible) {
      drawChalkboardText(chalkboard, 0, 0);
    }
  });
}

function cancelChalkboardEvent() {
  if (!chalkboardEvent.active) {
    return;
  }

  finishChalkboardEvent(true);
}

function updateChalkboardEvent(delta, currentTime) {
  if (!chalkboardEvent.active) {
    return;
  }

  chalkboardEvent.isWalking = false;

  if (chalkboardEvent.phase === "approach") {
    avatarState.leftArm = "down";
    avatarState.rightArm = "down";
    chalkboardEvent.isWalking = moveAvatarToward(
      CHALKBOARD_SEQUENCE.writingPosition,
      Math.PI,
      delta,
      1.65,
    );

    if (!chalkboardEvent.isWalking || phaseAge(currentTime) > 3400) {
      setChalkboardPhase("write", currentTime);
    }
  } else if (chalkboardEvent.phase === "write") {
    const progress = clamp(
      phaseAge(currentTime) / CHALKBOARD_SEQUENCE.writeDuration,
      0,
      1,
    );

    avatarState.leftArm = "half";
    avatarState.rightArm = "write";
    showHeldTool("chalk");
    drawChalkboardText(chalkboard, progress, 0);

    if (!chalkboardEvent.writeSoundPlaying) {
      chalkboardEvent.writeSoundPlaying = true;
      playSound("write", true);
    }

    if (progress >= 1) {
      stopSound("write");
      setChalkboardPhase("present", currentTime);
    }
  } else if (chalkboardEvent.phase === "present") {
    avatarState.leftArm = "half";
    avatarState.rightArm = "half";
    showHeldTool(null);
    drawChalkboardText(chalkboard, 1, 0);
    chalkboardEvent.isWalking = moveAvatarToward(
      CHALKBOARD_SEQUENCE.presentingPosition,
      0,
      delta,
      1.45,
    );

    if (!chalkboardEvent.isWalking || phaseAge(currentTime) > 3600) {
      setChalkboardPhase("hold", currentTime);
    }
  } else if (chalkboardEvent.phase === "hold") {
    avatarState.leftArm = "down";
    avatarState.rightArm = "down";
    drawChalkboardText(chalkboard, 1, 0);

    if (phaseAge(currentTime) >= CHALKBOARD_SEQUENCE.holdDuration) {
      setAvatarOpacityTarget(1);
      setChalkboardTextOverlay(false);
      setChalkboardPhase("eraseApproach", currentTime);
    }
  } else if (chalkboardEvent.phase === "eraseApproach") {
    avatarState.leftArm = "down";
    avatarState.rightArm = "erase";
    showHeldTool("eraser");
    chalkboardEvent.isWalking = moveAvatarToward(
      CHALKBOARD_SEQUENCE.writingPosition,
      Math.PI,
      delta,
      1.65,
    );

    if (!chalkboardEvent.isWalking || phaseAge(currentTime) > 3400) {
      setChalkboardPhase("erase", currentTime);
    }
  } else if (chalkboardEvent.phase === "erase") {
    const progress = clamp(
      phaseAge(currentTime) / CHALKBOARD_SEQUENCE.eraseDuration,
      0,
      1,
    );

    avatarState.leftArm = "half";
    avatarState.rightArm = "erase";
    showHeldTool("eraser");
    drawChalkboardText(chalkboard, 1, progress);

    if (!chalkboardEvent.eraseSoundPlaying) {
      chalkboardEvent.eraseSoundPlaying = true;
      playSound("erase", true);
    }

    if (progress >= 1) {
      stopSound("erase");
      chalkboard.group.visible = false;
      drawChalkboardText(chalkboard, 0, 0);
      showHeldTool(null);
      finishChalkboardEvent(false);
    }
  } else if (chalkboardEvent.phase === "return") {
    const target = chalkboardEvent.savedState?.position || new THREE.Vector3();
    const yaw = chalkboardEvent.savedState?.avatarYaw || 0;

    avatarState.leftArm = chalkboardEvent.savedState?.leftArm || "down";
    avatarState.rightArm = chalkboardEvent.savedState?.rightArm || "down";
    chalkboardEvent.isWalking = moveAvatarToward(target, yaw, delta, 1.65);

    if (!chalkboardEvent.isWalking || phaseAge(currentTime) > 4200) {
      finishChalkboardEvent(true);
    }
  }
}

function setChalkboardPhase(phase, currentTime) {
  chalkboardEvent.phase = phase;
  chalkboardEvent.phaseStart = currentTime;

  if (phase !== "write") {
    chalkboardEvent.writeSoundPlaying = false;
  }

  if (phase !== "erase") {
    chalkboardEvent.eraseSoundPlaying = false;
  }
}

function phaseAge(currentTime) {
  return currentTime - chalkboardEvent.phaseStart;
}

function moveAvatarToward(targetPosition, targetYaw, delta, speed) {
  const current = avatar.root.position;
  const toTarget = new THREE.Vector3(
    targetPosition.x - current.x,
    0,
    targetPosition.z - current.z,
  );
  const distance = toTarget.length();

  if (distance > CHALKBOARD_SEQUENCE.arrivalDistance) {
    const step = Math.min(distance, speed * delta);

    toTarget.normalize();
    current.x += toTarget.x * step;
    current.z += toTarget.z * step;
  }

  controlState.avatarYaw = dampAngle(
    controlState.avatarYaw,
    targetYaw,
    6,
    delta,
  );
  avatar.root.rotation.y = controlState.avatarYaw;

  return distance > CHALKBOARD_SEQUENCE.arrivalDistance * 1.7;
}

function dampAngle(current, target, lambda, delta) {
  const deltaAngle = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + deltaAngle * (1 - Math.exp(-lambda * delta));
}

function captureControlSnapshot() {
  return {
    position: avatar.root.position.clone(),
    avatarYaw: controlState.avatarYaw,
    cameraYaw: controlState.cameraYaw,
    cameraDistance: controlState.cameraDistance,
    cameraHeight: controlState.cameraHeight,
    leftArm: avatarState.leftArm,
    rightArm: avatarState.rightArm,
    effect: avatarState.effect,
    prop: avatarState.prop,
  };
}

function restoreControlSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  avatar.root.position.copy(snapshot.position);
  avatar.root.position.y = snapshot.position.y || AVATAR_FLOOR_OFFSET;
  controlState.avatarYaw = snapshot.avatarYaw;
  controlState.cameraYaw = snapshot.cameraYaw;
  controlState.cameraDistance = snapshot.cameraDistance;
  controlState.cameraHeight = snapshot.cameraHeight;
  avatar.root.rotation.y = controlState.avatarYaw;
  avatar.body.position.y = 0;
  avatarState.leftArm = snapshot.leftArm;
  avatarState.rightArm = snapshot.rightArm;
  avatarState.effect = snapshot.effect;
  avatarState.prop = snapshot.prop;
}

function finishChalkboardEvent(restoreSnapshot) {
  const savedState = chalkboardEvent.savedState;

  stopSound("write");
  stopSound("erase");
  chalkboard.group.visible = false;
  drawChalkboardText(chalkboard, 0, 0);
  setChalkboardTextOverlay(false);
  showHeldTool(null);
  setAvatarOpacityTarget(1, true);

  chalkboardEvent.active = false;
  chalkboardEvent.phase = "idle";
  chalkboardEvent.phaseStart = 0;
  chalkboardEvent.savedState = null;
  chalkboardEvent.writeSoundPlaying = false;
  chalkboardEvent.eraseSoundPlaying = false;
  chalkboardEvent.isWalking = false;

  if (restoreSnapshot) {
    restoreControlSnapshot(savedState);
  } else {
    avatarState.leftArm = "down";
    avatarState.rightArm = "down";
  }
}

function handleKeyDown(event) {
  if (isHandledControl(event.code)) {
    event.preventDefault();
  }

  if (event.code === "Escape") {
    cancelChalkboardEvent();
    return;
  }

  if (chalkboardEvent.active) {
    return;
  }

  controlState.keys.add(event.code);
  unlockAudio();

  if (event.repeat) {
    return;
  }

  if (event.code === "Digit1") {
    triggerEffect("hearts");
  }

  if (event.code === "Digit2") {
    triggerEffect("stars");
  }

  if (event.code === "Digit3") {
    triggerEffect("thoughtBubble");
  }

  if (event.code === "KeyZ") {
    toggleArm("left");
  }

  if (event.code === "KeyX") {
    toggleArm("right");
  }

  if (event.code === "Space") {
    controlState.waveUntil = performance.now() + 1650;
  }

  if (event.code === "KeyJ") {
    startJump(performance.now());
  }

  if (event.code === "KeyH") {
    toggleHalfHands();
  }

  if (event.code === "KeyB") {
    startChalkboardEvent(performance.now());
  }
}

function handleKeyUp(event) {
  controlState.keys.delete(event.code);
}

function isHandledControl(code) {
  return [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyZ",
    "KeyX",
    "KeyJ",
    "KeyH",
    "KeyB",
    "Digit1",
    "Digit2",
    "Digit3",
    "Space",
    "Escape",
    "PageUp",
    "PageDown",
  ].includes(code);
}

function toggleArm(sideName) {
  const key = `${sideName}Arm`;
  avatarState[key] = avatarState[key] === "up" ? "down" : "up";
}

function toggleHalfHands() {
  const bothHalf =
    avatarState.leftArm === "half" && avatarState.rightArm === "half";

  avatarState.leftArm = bothHalf ? "down" : "half";
  avatarState.rightArm = bothHalf ? "down" : "half";
}

function triggerEffect(name) {
  avatarState.effect = name;

  Object.entries(effectSprites).forEach(([effectName, effect]) => {
    effect.sprite.visible = effectName === name;
    effect.sprite.material.opacity = effectName === name ? 0.92 : 0;
    effect.startedAt = effectName === name ? performance.now() : 0;
    effect.sprite.position.copy(effect.basePosition);
  });
}

function updateEffects(currentTime) {
  Object.entries(effectSprites).forEach(([name, effect]) => {
    if (!effect.startedAt || !effect.sprite.visible) {
      return;
    }

    const progress = (currentTime - effect.startedAt) / effect.duration;

    if (progress >= 1) {
      effect.sprite.visible = false;
      effect.sprite.material.opacity = 0;

      if (avatarState.effect === name) {
        avatarState.effect = null;
      }

      return;
    }

    effect.sprite.material.opacity = Math.sin(progress * Math.PI) * 0.92;
    effect.sprite.position.y =
      effect.basePosition.y + Math.sin(progress * Math.PI) * 0.18;
  });
}

function updateKeyboardMotion(delta, currentTime) {
  if (chalkboardEvent.active) {
    updateWalkCycle(delta, chalkboardEvent.isWalking, currentTime);
    return;
  }

  const keys = controlState.keys;
  const forwardInput = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
  const turnInput = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);

  const cameraTurnInput =
    (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
  const cameraZoomInput =
    (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0);
  const cameraHeightInput =
    (keys.has("PageUp") ? 1 : 0) - (keys.has("PageDown") ? 1 : 0);

  controlState.avatarYaw -= turnInput * delta * 1.95;
  controlState.cameraYaw += cameraTurnInput * delta * 1.5;
  controlState.cameraDistance = clamp(
    controlState.cameraDistance + cameraZoomInput * delta * 3.2,
    4.2,
    9.4,
  );
  controlState.cameraHeight = clamp(
    controlState.cameraHeight + cameraHeightInput * delta * 2.4,
    1.4,
    4.3,
  );

  avatar.root.rotation.y = controlState.avatarYaw;

  const forward = new THREE.Vector3(
    Math.sin(controlState.avatarYaw),
    0,
    Math.cos(controlState.avatarYaw),
  );
  const moveSpeed = 1.55;

  avatar.root.position.addScaledVector(
    forward,
    forwardInput * moveSpeed * delta,
  );
  avatar.root.position.x = clamp(
    avatar.root.position.x,
    -ROOM.avatarTravelLimit,
    ROOM.avatarTravelLimit,
  );
  avatar.root.position.z = clamp(
    avatar.root.position.z,
    -ROOM.avatarTravelLimit,
    ROOM.avatarTravelLimit,
  );

  const isWalking = Math.abs(forwardInput) > 0.01 || Math.abs(turnInput) > 0.01;
  updateWalkCycle(delta, isWalking, currentTime);
}

function updateWalkCycle(delta, isWalking, currentTime) {
  const walkBlendTarget = isWalking ? 1 : 0;
  avatar.root.userData.walkBlend = THREE.MathUtils.damp(
    avatar.root.userData.walkBlend || 0,
    walkBlendTarget,
    7,
    delta,
  );

  const walkBlend = avatar.root.userData.walkBlend;

  if (isWalking) {
    controlState.walkPhase += delta * 6.4;
  }

  const swing = Math.sin(controlState.walkPhase);
  const counterSwing = Math.sin(controlState.walkPhase + Math.PI);
  const bob =
    Math.abs(Math.sin(controlState.walkPhase * 2)) * 0.035 * walkBlend;

  avatar.body.position.y = bob;

  updateLegPose(avatar.parts.leftLeg, swing * walkBlend);
  updateLegPose(avatar.parts.rightLeg, counterSwing * walkBlend);
  updateArmPose(
    avatar.parts.leftArm,
    "leftArm",
    counterSwing * walkBlend,
    delta,
    currentTime,
  );
  updateArmPose(
    avatar.parts.rightArm,
    "rightArm",
    swing * walkBlend,
    delta,
    currentTime,
  );
}

function updateLegPose(leg, swing) {
  leg.hip.rotation.x = swing * 0.38;
  leg.knee.rotation.x = Math.max(0.06, -swing * 0.28 + 0.08);
}

function updateArmPose(arm, stateKey, walkSwing, delta, currentTime) {
  const isWaving = currentTime < controlState.waveUntil;
  const armState = avatarState[stateKey];
  const baseZ = arm.side * 0.2;
  const halfZ = arm.side * 1.12;
  const raisedZ = arm.side * 2.28;
  let targetZ = armState === "up" ? raisedZ : baseZ;
  let targetX = walkSwing * 0.34;
  let elbowZ = arm.side * 0.08;

  if (armState === "half") {
    targetZ = halfZ;
    targetX = walkSwing * 0.12;
    elbowZ = arm.side * 0.18;
  }

  if (armState === "write" || armState === "erase") {
    const scribbleSpeed = armState === "write" ? 0.016 : 0.024;
    const scribble = Math.sin(currentTime * scribbleSpeed);

    targetZ = arm.side * (1.72 + scribble * 0.08);
    targetX = -0.78 + Math.cos(currentTime * scribbleSpeed * 0.7) * 0.08;
    elbowZ = arm.side * (0.36 + scribble * 0.18);
  }

  if (isWaving) {
    targetZ = arm.side * 2.08;
    targetX = Math.sin(currentTime * 0.014) * 0.18;
    elbowZ = arm.side * (0.42 + Math.sin(currentTime * 0.024) * 0.22);
  }

  arm.shoulder.rotation.z = THREE.MathUtils.damp(
    arm.shoulder.rotation.z,
    targetZ,
    8,
    delta,
  );
  arm.shoulder.rotation.x = THREE.MathUtils.damp(
    arm.shoulder.rotation.x,
    targetX,
    8,
    delta,
  );
  arm.elbow.rotation.z = THREE.MathUtils.damp(
    arm.elbow.rotation.z,
    elbowZ,
    8,
    delta,
  );
}

function updateGhostSphereMotion(elapsed) {
  ghostSpheres.forEach((sphere) => {
    const offset = Math.sin(elapsed * sphere.speed + sphere.phase);

    sphere.group.position.set(
      sphere.basePosition.x + sphere.drift.x * offset,
      sphere.basePosition.y + sphere.drift.y * offset,
      sphere.basePosition.z + sphere.drift.z * offset,
    );

    sphere.group.rotation.x += sphere.spin.x * 0.01;
    sphere.group.rotation.y += sphere.spin.y * 0.01;
    sphere.group.rotation.z += sphere.spin.z * 0.01;
  });
}

function updateCamera(delta) {
  const target = avatar.root.position
    .clone()
    .add(new THREE.Vector3(0, 1.65, 0));
  const cameraOffset = new THREE.Vector3(
    Math.sin(controlState.cameraYaw) * controlState.cameraDistance,
    controlState.cameraHeight,
    Math.cos(controlState.cameraYaw) * controlState.cameraDistance,
  );
  const desiredPosition = target.clone().add(cameraOffset);

  camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, delta));
  camera.lookAt(target);
}

function resizeRendererToContainer() {
  const width = sceneContainer.clientWidth || window.innerWidth;
  const height = sceneContainer.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

console.info(
  `Avatar ${APP_VERSION} running on Three.js ${THREE_VERSION_PIN}.`,
  { backgroundLayerSources, avatarAssets },
);
