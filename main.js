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

backgroundLayerSources.forEach((src) => {
  const img = document.createElement("img");
  img.src = src;
  img.classList.add("scene-layer");
  img.alt = "";
  img.setAttribute("aria-hidden", "true");

  sceneContainer.appendChild(img);
});

//const backgroundLayerImages = [];

const torsoLayer = document.createElement("img");
const rightUpperArmLayer = document.createElement("img");
const rightArmLayer = document.createElement("img");
const leftUpperArmLayer = document.createElement("img");
const leftArmLayer = document.createElement("img");
const eyesLayer = document.createElement("img");
const mouthLayer = document.createElement("img");
const propLayer = document.createElement("img");
const effectLayer = document.createElement("img");

const avatarLayers = [
  torsoLayer,
  rightUpperArmLayer,
  rightArmLayer,
  leftUpperArmLayer,
  leftArmLayer,
  eyesLayer,
  mouthLayer,
  propLayer,
  effectLayer,
];

avatarLayers.forEach((layer) => {
  layer.classList.add("avatar-part");
  layer.alt = "";
  layer.setAttribute("aria-hidden", "true");
  sceneContainer.appendChild(layer);
});

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

//preloadBackgroundLayers();
let smoothedVolume = 0;
let eyesClosed = false;
let mouthOpen = false;

let lastBlinkTime = 0;
let blinkStartTime = 0;
let isBlinking = false;

async function startMic() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 512;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);

    const MOUTH_OPEN_THRESHOLD = 14;
    const MOUTH_CLOSE_THRESHOLD = 9;

    function checkVolume() {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;

      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }

      const averageVolume = sum / dataArray.length;
      smoothedVolume = smoothedVolume * 0.75 + averageVolume * 0.25;
      if (!mouthOpen && smoothedVolume > MOUTH_OPEN_THRESHOLD) {
        mouthOpen = true;
        updateAvatarImage();
      }

      if (mouthOpen && smoothedVolume < MOUTH_CLOSE_THRESHOLD) {
        mouthOpen = false;
        updateAvatarImage();
      }

      requestAnimationFrame(checkVolume);
    }

    checkVolume();
  } catch (error) {
    console.error("Microphone access failed:", error);
  }
}

//requestAnimationFrame(checkVolume);

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
function updateAvatarImage() {
  avatarState.eyes = eyesClosed ? "closed" : "open";
  avatarState.mouth = mouthOpen ? "open" : "closed";

  torsoLayer.src = avatarAssets.torso;

  rightUpperArmLayer.src = avatarAssets.arms.rightUpper;
  leftUpperArmLayer.src = avatarAssets.arms.leftUpper;

  rightArmLayer.src =
    avatarAssets.arms[`right${capitalize(avatarState.rightArm)}`];

  leftArmLayer.src =
    avatarAssets.arms[`left${capitalize(avatarState.leftArm)}`];

  eyesLayer.src = avatarAssets.eyes[avatarState.eyes];
  mouthLayer.src = avatarAssets.mouth[avatarState.mouth];

  if (avatarState.prop) {
    propLayer.src = avatarAssets.props[avatarState.prop];
    propLayer.style.display = "block";
  } else {
    propLayer.removeAttribute("src");
    propLayer.style.display = "none";
  }

  if (avatarState.effect) {
    effectLayer.src = avatarAssets.effects[avatarState.effect];
    effectLayer.style.display = "block";
  } else {
    effectLayer.removeAttribute("src");
    effectLayer.style.display = "none";
  }
}

function animate(currentTime) {
  const timeSinceLastBlink = currentTime - lastBlinkTime;

  if (!isBlinking) {
    if (timeSinceLastBlink > MIN_INTERVAL && Math.random() < BLINK_CHANCE) {
      startBlink(currentTime);
    }
  } else {
    if (currentTime - blinkStartTime >= BLINK_DURATION) {
      endBlink(currentTime);
    }
  }

  requestAnimationFrame(animate);
}

function startBlink(timestamp) {
  isBlinking = true;
  blinkStartTime = timestamp;

  eyesClosed = true;
  updateAvatarImage();
}

function endBlink(timestamp) {
  isBlinking = false;
  lastBlinkTime = timestamp;

  eyesClosed = false;
  updateAvatarImage();
}

updateAvatarImage();
requestAnimationFrame(animate);
startMic();
