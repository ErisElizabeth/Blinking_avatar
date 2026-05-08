const avatarEyesOpen = "assets/avatarEyesOpen.png";
const avatarEyesClosed = "assets/avatarEyesClosed.png";

const avatarLayerSources = [
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

const avatarLayerImages = [];

function preloadAvatarLayers() {
  avatarLayerSources.forEach((src) => {
    const img = new Image();
    img.src = src;
    avatarLayerImages.push(img);
  });
}

preloadAvatarLayers();

let lastBlinkTime = 0;
let blinkStartTime = 0;
let isBlinking = false;

const BLINK_DURATION = 150;
const MIN_INTERVAL = 1000;
const BLINK_CHANCE = 0.005;

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

  document.getElementById("avatar").src = avatarEyesClosed;
}

function endBlink(timestamp) {
  isBlinking = false;
  lastBlinkTime = timestamp;

  document.getElementById("avatar").src = avatarEyesOpen;
}

requestAnimationFrame(animate);
