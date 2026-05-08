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

const backgroundLayerImages = [];
const sceneContainer = document.getElementById("scene-container");

backgroundLayerSources.forEach((src) => {
  const img = document.createElement("img");
  img.src = src;
  img.classList.add("scene-layer");
  img.alt = "";
  img.setAttribute("aria-hidden", "true");

  sceneContainer.appendChild(img);
});
function preloadBackgroundLayers() {
  backgroundLayerSources.forEach((src) => {
    const img = new Image();
    img.src = src;
    backgroundLayerImages.push(img);
  });
}

preloadBackgroundLayers();
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

startMic();
//requestAnimationFrame(checkVolume);

const avatarStates = {
  eyesOpenMouthClosed: "assets/avatarEyesOpen.png",
  eyesClosedMouthClosed: "assets/avatarEyesClosed.png",
  eyesOpenMouthOpen: "assets/avatarEyesOpenMouthOpen.png",
  eyesClosedMouthOpen: "assets/avatarEyesClosedMouthOpen.png",
};

const BLINK_DURATION = 150;
const MIN_INTERVAL = 1000;
const BLINK_CHANCE = 0.005;

function updateAvatarImage() {
  const avatar = document.getElementById("avatar");

  if (!eyesClosed && !mouthOpen) {
    avatar.src = avatarStates.eyesOpenMouthClosed;
  } else if (eyesClosed && !mouthOpen) {
    avatar.src = avatarStates.eyesClosedMouthClosed;
  } else if (!eyesClosed && mouthOpen) {
    avatar.src = avatarStates.eyesOpenMouthOpen;
  } else {
    avatar.src = avatarStates.eyesClosedMouthOpen;
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
