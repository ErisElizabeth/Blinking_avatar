# Avatar Modeling And Animation Control Guide

## Version

Guide written for avatar build `0.0.10-alpha`.

Core runtime:

- `index.html`: browser entry point and module import map.
- `styles.css`: full-screen canvas layout.
- `main.js`: all current modeling, animation, audio, controls, and scene logic.
- `assets/`: legacy PNG layers, keyboard effect PNGs, and chalkboard sounds.

Line numbers below match the current `main.js` at the time this guide was written. If they drift later, search the function or constant name with `rg -n "name" main.js`.

## Mental Model

The app is one Three.js scene with one articulated avatar rig.

The avatar is not a skeletal skinned mesh. It is a hierarchy of `THREE.Group` objects and primitive/custom geometry meshes. Movement comes from changing group rotations, positions, scales, and a few geometry vertices.

The important hierarchy is:

```text
scene
  avatar.root
    avatar.body
      torso mesh
      neck mesh
      head group
        headShell mesh
        leftEye group
        rightEye group
        mouth mesh
      leftArm shoulder group
        upperArm mesh
        elbow group
          forearm mesh
          hand group
            palm mesh
            3 finger meshes
            toolSocket group
      rightArm shoulder group
        upperArm mesh
        elbow group
          forearm mesh
          hand group
            palm mesh
            3 finger meshes
            toolSocket group
      leftLeg hip group
        thigh mesh
        knee group
          shin mesh
          foot mesh
      rightLeg hip group
        thigh mesh
        knee group
          shin mesh
          foot mesh
      effect sprites attached to avatar.root
  ghost spheres
  chalkboard group, hidden until routine starts
```

## File Map

### `index.html`

Purpose:

- Loads `styles.css`.
- Loads Google Font `Caveat Brush` for chalkboard writing.
- Defines the import map for Three.js.
- Runs `main.js` as an ES module.

Important section:

- Import map includes `three` and `three/addons/`. `main.js` also imports `ParametricGeometry` directly from the pinned CDN URL.

### `styles.css`

Purpose:

- Makes the app fill the browser viewport.
- Gives the scene black background.
- Preserves older `.scene-layer` and `.avatar-part` styles for project continuity, though the live avatar is now a Three.js canvas.

### `main.js`

Everything important lives here.

Large sections:

- Imports and constants: lines 1-120.
- Materials: lines 153-240.
- State objects: lines 242-338.
- Scene initialization: lines 339-360.
- Room and lighting: lines 362-397.
- Avatar modeling: lines 399-751.
- Chalkboard/effects/ghosts: lines 754-1134.
- Microphone and mouth states: lines 1136-1270.
- Main animation loop and procedural motion: lines 1272-1423.
- Chalkboard sequence: lines 1456-1731.
- Keyboard controls: lines 1733-1829.
- Walk/arm/leg/camera animation: lines 1833-2059.

## Global Constants

### Build And Imports

Location:

- `APP_VERSION`: line 4.
- `THREE_VERSION_PIN`: line 5.
- `ParametricGeometry` import: line 2.

Purpose:

- `APP_VERSION` is printed in the console.
- `THREE_VERSION_PIN` documents the expected Three.js version.
- `ParametricGeometry` is used for the almond eye surfaces.

### Asset Manifest

Location:

- `avatarAssets`: line 7.

Purpose:

- Keeps the original sprite vocabulary.
- Live 3D avatar does not use the old body PNGs for its body.
- Current live asset use:
  - `effects.hearts`, `effects.stars`, `effects.thoughtBubble`: converted to cropped Three.js sprites.
  - `sounds.write`, `sounds.erase`: chalkboard routine sound effects.

### Colors

Location:

- `ALIEN_COLOR`: `#639464`, line 70.
- `WALL_COLOR`: `#000000`, line 71.
- `GHOST_SPHERE_COLOR`: `#7f827f`, line 72.
- `CHALKBOARD_COLOR`: `#274c43`, line 73.
- `CHALK_COLOR`: `#e0dcdc`, line 74.
- `ERASER_COLOR`: `#b7b7b7`, line 75.

How to change color:

- Change the constant.
- If changing the alien color, also consider the gradient in `alienGradientTexture`.

### Room

Location:

- `ROOM`: line 78.

Parameters:

```js
{
  width: 12,
  height: 5.2,
  depth: 12,
  avatarTravelLimit: 5.25,
}
```

Meaning:

- `width`, `height`, `depth`: black box room size.
- `avatarTravelLimit`: clamps avatar root X/Z movement. The walls are at about `+/-6`, so `5.25` gives a small safety margin.

## Materials

### Alien Material

Location:

- Gradient texture: `makeVerticalGradientTexture()`, line 130.
- `alienGradientTexture`: line 153.
- `alienMaterial`: line 159.

Parameters:

- Top color: `#7dae7f`.
- Middle color: `#639464`.
- Bottom color: `#456c48`.
- Roughness: `0.72`.
- Metalness: `0.02`.
- Emissive: `#203521`.
- Emissive intensity: `0.18`.

Used by:

- Torso, neck, head, arms, hands, fingers, legs, feet.

Notes:

- Meshes are created with color `#ffffff` so the gradient texture controls the final green.
- To make her less shiny, increase roughness.
- To make her brighter from within, increase emissive intensity gently.

### Alien Glow

Location:

- `alienGlowMaterial`: line 168.
- Added by `addSoftGlow()`: line 482.

Purpose:

- Soft additive halo around alien parts.
- Each mesh made by `makeAlienMesh()` gets a small child glow mesh.

Important:

- The glow copies the geometry. This adds visual softness but also extra draw work.
- If performance becomes a problem, reduce or remove glow in `makeAlienMesh()`.

### Eye Material

Location:

- `eyeMaterial`: line 176.
- `eyeHighlightMaterial`: line 184.

Parameters:

- Eye color: near black `#030503`.
- Roughness: `0.16`.
- Metalness: `0.08`.
- Highlights: `#f4fff6`, opacity `0.82`.

Used by:

- Parametric almond eye patches.
- Closed-eye blink capsules.
- Reflection glints.

### Mouth Material

Location:

- `mouthMaterial`: line 190.

Purpose:

- Small black shallow ellipsoid used for mouth states.

### Chalkboard Materials

Locations:

- `chalkboardMaterial`: line 221.
- `chalkMaterial`: line 229.
- `eraserMaterial`: line 235.

Used by:

- Spawned chalkboard.
- Chalk cylinder.
- Eraser box.

## Avatar State

### `avatarState`

Location:

- line 252.

Fields:

```js
{
  eyes: "open",
  mouth: "closed",
  leftArm: "down",
  rightArm: "down",
  prop: null,
  effect: null,
}
```

Purpose:

- Central symbolic state for visible features.
- Arm values are read by `updateArmPose()`.
- Mouth state is driven by microphone volume.
- Effect state is used by the keyboard sprite triggers.

Arm state values:

- `"down"`: normal relaxed arm.
- `"up"`: high arm.
- `"half"`: both-hands half-high pose.
- `"write"`: right arm scribbling pose for chalk.
- `"erase"`: right arm erasing pose.

### `controlState`

Location:

- line 274.

Fields:

- `keys`: active key set.
- `avatarYaw`: avatar facing direction.
- `walkPhase`: walk cycle phase.
- `jumpStart`, `jumpDuration`, `jumpHeight`: hop mechanic.
- `cameraYaw`, `cameraDistance`, `cameraHeight`: camera controls.
- `waveUntil`: timestamp until wave animation ends.

### `audioState`

Location:

- line 287.

Purpose:

- Stores microphone analyser, calibration, voice level, and target mouth level.

Important fields:

- `noiseFloor`: adaptive baseline.
- `voiceLevel`: smoothed normalized speech level.
- `targetMouthLevel`: integer `0-4`, maps into `mouthStates`.
- `permissionBlocked`: prevents repeated mic prompts if denied.

### `chalkboardEvent`

Location:

- line 316.

Purpose:

- State machine for the chalkboard routine.

Fields:

- `active`: routine owns controls.
- `phase`: current sequence phase.
- `phaseStart`: timestamp for phase timing.
- `savedState`: snapshot used by `Escape` restore.
- `writeSoundPlaying`, `eraseSoundPlaying`: sound loop guards.
- `isWalking`: feeds walk animation during scripted movement.

## Modeling Guide

### Scene Room

Build function:

- `buildRoom()`: line 362.

Geometry:

- `THREE.BoxGeometry(ROOM.width, ROOM.height, ROOM.depth)`.
- Material side is `THREE.BackSide`, so the camera is inside the room box.
- Position: `roomMesh.position.y = ROOM.height / 2`.

Floor grid:

- `THREE.GridHelper(ROOM.width, 24, "#172017", "#050505")`.
- Opacity: `0.3`.
- Y position: `0.003`.

### Lighting

Build function:

- `buildLighting()`: line 384.

Lights:

- Hemisphere light:
  - Sky: `#91aa91`.
  - Ground: `#020202`.
  - Intensity: `1.25`.
- Directional key light:
  - Color: `#dff5df`.
  - Intensity: `2.15`.
  - Position: `(-2.5, 5.5, 3.5)`.
  - Casts shadow.
- Face point light:
  - Color: alien green.
  - Intensity: `1.45`.
  - Range: `6.5`.
  - Position: `(0, 2.5, 2.2)`.

### Avatar Root

Build function:

- `buildAvatar()`: line 399.

Root objects:

- `root`: entire avatar, moved/rotated by keyboard and scripted events.
- `body`: child of root, receives walk bob and contains modeled anatomy.

Floor placement:

- `avatar.root.position.y = AVATAR_FLOOR_OFFSET`, line 340.
- `AVATAR_FLOOR_OFFSET = 0.69`, line 76.

If feet clip through floor:

- Increase `AVATAR_FLOOR_OFFSET` slightly.

If avatar floats:

- Decrease `AVATAR_FLOOR_OFFSET` slightly.

### Torso

Build location:

- Created in `buildAvatar()`: lines 408-416.
- Geometry function: `makeSlenderTorsoGeometry()`, line 501.
- Breathing mutation: `updateTorsoBreathingGeometry()`, line 531.

Construction:

- Custom `THREE.LatheGeometry`.
- Profile samples: `32`.
- Radial segments: `80`.
- Y range: `-0.78` to `0.94`.
- Mesh position: `(0, 1.28, 0)`.
- Mesh scale: `(1, 1, 0.68)`.

Shape formula:

- Base radius starts at about `0.17`.
- Adds a small lower-base bulge.
- Subtracts a waist pinch.
- Adds a small chest form.
- Tapers near the shoulders.

Why stored vertex positions matter:

- `geometry.userData.originalPositions` stores a copy of the original mesh vertices.
- Breathing rewrites current X/Z from the original positions every frame.
- This prevents breathing drift or cumulative deformation.

Breathing behavior:

- Only lower torso diameter changes.
- Head, arms, legs, feet, and root scale do not change.

To make the torso slimmer:

- Lower base radius in `makeSlenderTorsoGeometry()`, currently `0.17`.
- Or reduce mesh X/Z scale in `buildAvatar()`.

To make breathing bigger:

- Increase `breathing` amplitude in `updateBreathingMotion()`, currently `0.018`.

To make breathing affect more of the torso:

- Lower exponent in `Math.pow(1 - verticalPosition, 2.6)`.
- Example: `1.8` affects higher torso.

To keep breathing only at the belly/base:

- Increase exponent.
- Example: `3.2`.

### Neck

Build location:

- `buildAvatar()`: lines 418-425.

Geometry:

- `THREE.CylinderGeometry(0.085, 0.1, 0.54, 32)`.

Position:

- `(0, 2.1, 0)`.

Purpose:

- Narrow connector between torso and head.
- Arms are attached near this neck/torso junction.

### Head

Build location:

- Group created in `buildAvatar()`: lines 427-430.
- Head shell created lines 432-439.
- Geometry function: `makePyriformHeadGeometry()`, line 562.

Construction:

- Custom `THREE.LatheGeometry`.
- Profile samples: `48`.
- Radial segments: `96`.
- Y range: `-0.74` to `1.2`.
- Mesh scale: `(1, 1, 0.78)`.
- Head group position: `(0, 2.55, 0)`.

Shape logic:

- Uses a sampled radius profile.
- Radius is based on:
  - sine roundness.
  - top weighting.
  - cheek taper.
- The result is one continuous inverted pyriform/ovoid surface.

To make the head bigger:

- Increase `headShell` scale in `buildAvatar()`.
- For height, increase Y scale.
- For width, increase X scale.
- For front/back depth, increase Z scale.

To change the taper:

- Edit `topWeight` and `cheekTaper` in `makePyriformHeadGeometry()`.

### Eyes

Build location:

- Eye groups created in `buildAvatar()`: lines 441-444.
- Parametric eye geometry: `makeAlmondEyeGeometry()`, line 588.
- Eye assembly: `makeEye()`, line 609.

Current placements:

- Left eye: `makeEye(-0.29, -0.12, 0.405, -0.34)`.
- Right eye: `makeEye(0.29, -0.12, 0.405, 0.34)`.

Parameter meanings:

- First value: X position.
- Second value: Y position on head.
- Third value: Z position forward from head center.
- Fourth value: Z rotation/slant.

Eye group rotations:

- Left eye Y rotation: `0.26`.
- Right eye Y rotation: `-0.26`.

These turn the eyes inward toward the face center/chin area.

Geometry:

- Uses `ParametricGeometry`.
- `u` controls horizontal position.
- `v` controls vertical position.
- Width collapses near top and bottom to create almond shape.
- Dome formula pushes the center forward.

Material:

- Black glossy material from `eyeMaterial`.
- Small white-green reflection from `eyeHighlightMaterial`.

Blink behavior:

- Open eye is a group with almond patch and highlight.
- Closed eye is a small capsule mesh.
- `updateAvatarImage()` switches visibility.

To slant eyes more inward:

- Increase the absolute value of the `tilt` argument in `buildAvatar()`.
- Current: `-0.34` left, `0.34` right.

To move eyes lower:

- Decrease Y argument.
- Current: `-0.12`.

To make eyes more embedded:

- Decrease Z argument slightly.
- Current: `0.405`.

To make eyes protrude:

- Increase Z argument slightly.

### Mouth

Build location:

- Mesh created in `buildAvatar()`: lines 446-451.
- Mouth states: line 266.
- State target setter: `setMouthState()`, line 1266.
- Smooth animation: `updateMouthGeometry()`, line 1329.

Geometry:

- `THREE.SphereGeometry(1, 36, 18)`.
- Scaled into a shallow ellipsoid.

Position:

- Initial position: `(0, mouthStates[0].y, 0.47)`.

Mouth states:

```js
closed:    width 0.125, height 0.010, y -0.510
small:     width 0.090, height 0.033, y -0.510
medium:    width 0.115, height 0.055, y -0.515
open:      width 0.140, height 0.078, y -0.520
surprised: width 0.105, height 0.105, y -0.525
```

How mouth animation works:

- Mic code sets `audioState.targetMouthLevel`.
- `updateMouthGeometry()` looks up `mouthStates[targetMouthLevel]`.
- Width, height, and Y position lerp toward target.

To make the mouth smaller:

- Reduce widths/heights in `mouthStates`.

To move the mouth lower:

- Make each `y` more negative.

To move mouth closer into the face:

- Lower Z position in `buildAvatar()` from `0.47`.

### Arms

Build location:

- Arm groups created in `buildAvatar()`: lines 453-458.
- `makeArm()`: line 642.
- Arm pose animation: `updateArmPose()`, line 1972.

Shoulder positions:

- Left: `(-0.28, 2, 0)`.
- Right: `(0.28, 2, 0)`.

These place the arms near the shoulder/neck/torso junction.

Arm lengths:

- Upper arm length: `0.72`.
- Forearm length: `0.69`.

Arm segment radii:

- Upper arm radius: `0.064`.
- Forearm radius: `0.058`.

Hierarchy:

```text
shoulder group
  upperArm mesh
  elbow group
    forearm mesh
    hand group
```

Important:

- Rotating the shoulder moves the entire arm.
- Rotating the elbow moves forearm and hand.
- The hand is attached to the elbow group at the end of the forearm.

To make arms longer:

- Increase `upperLength` and/or `forearmLength` in `makeArm()`.
- Also check `toolSocket` and hand placement.

To move shoulders outward:

- Increase absolute X in shoulder positions.

To move shoulders higher/lower:

- Change Y in shoulder positions.

### Hands And Fingers

Build location:

- `makeHand()`: line 713.
- `makeFinger()`: line 738.

Hand:

- Palm is a small sphere.
- Palm scale: `(0.095, 0.11, 0.075)`.
- Hand position: `(0, -forearmLength, 0.04)`.

Fingers:

- Three fingers per hand.
- Finger offsets: `[-0.055, 0, 0.055]`.
- Finger geometry: `THREE.CapsuleGeometry(0.022, 0.2, 10, 16)`.
- Finger rotation X: `0.18`.
- Side fingers are angled using `finger.rotation.z = -offset * 1.8`.

To make fingers longer:

- Increase capsule length `0.2`.

To spread fingers more:

- Increase offsets or multiplier `1.8`.

### Legs

Build location:

- Leg groups created in `buildAvatar()`: lines 460-464.
- `makeLeg()`: line 674.
- Leg pose animation: `updateLegPose()`, line 1967.

Hip positions:

- Left: `(-0.15, 0.78, 0)`.
- Right: `(0.15, 0.78, 0)`.

Leg segment lengths:

- Thigh: `0.76`.
- Shin: `0.72`.

Leg segment radii:

- Thigh: `0.07`.
- Shin: `0.062`.

Foot:

- Geometry: sphere.
- Position: `(0, -0.73, 0.1)`.
- Scale: `(0.14, 0.062, 0.25)`.

### Chalkboard

Build location:

- `buildChalkboard()`: line 754.

Main group:

- Hidden by default.
- Position comes from `CHALKBOARD_SEQUENCE.boardPosition`: `(0, 2.42, -5.66)`.

Board:

- `THREE.BoxGeometry(3.95, 1.72, 0.14)`.
- Material: `#274c43`.

Lip:

- `THREE.BoxGeometry(4.05, 0.08, 0.18)`.
- Position: `(0, -0.9, 0.08)`.
- Color: `#1b3832`.

Text:

- Canvas size: `1024 x 512`.
- Plane geometry: `3.56 x 1.24`.
- Text material uses canvas texture.

Text drawing:

- `drawChalkboardText()`: line 833.
- Revealed text computed by `getRevealedChalkText()`: line 866.

### Held Tools

Build location:

- `buildHeldTools()`: line 810.

Chalk:

- `THREE.CylinderGeometry(0.026, 0.026, 0.36, 14)`.
- Material: `#e0dcdc`.
- Attached to `avatar.parts.rightArm.toolSocket`.

Eraser:

- `THREE.BoxGeometry(0.18, 0.08, 0.12)`.
- Material: `#b7b7b7`.
- Also attached to right-hand tool socket.

Tool display:

- `showHeldTool(toolName)`: line 880.
- Accepts `"chalk"`, `"eraser"`, or `null`.

### Keyboard Effect Sprites

Build location:

- `buildEffectSprites()`: line 918.
- Texture crop helper: `makeCroppedSpriteTexture()`, line 958.
- Alpha bounds finder: `findAlphaBounds()`, line 1015.

Effects:

- `hearts`: height `0.56`, position `(-0.72, 3.46, 0.72)`.
- `stars`: height `0.62`, position `(0.78, 3.46, 0.72)`.
- `thoughtBubble`: height `0.78`, position `(0.78, 3.42, 0.72)`.

Why crop texture:

- Original PNGs are mostly transparent 800x683 artboards.
- Cropping makes the sprite scale to visible art, not the empty canvas.

### Ghost Spheres

Build location:

- `buildGhostSpheres(count)`: line 1043.
- Position generator: `makeGhostSpherePosition()`: line 1085.

Count:

- Built with `buildGhostSpheres(120)`.

Geometry:

- Base sphere geometry: `THREE.SphereGeometry(1, 14, 10)`.
- Each sphere has:
  - wireframe mesh.
  - larger faint glow mesh.

Radius:

- `0.012 + Math.random() * 0.028`.

Movement:

- Stored `basePosition`.
- Each frame applies sinusoidal drift.
- Each frame increments rotation.

Keep-away logic:

- Avoids avatar center/head space.
- Prefers walls and ceiling.

Animation function:

- `updateGhostSphereMotion(elapsed)`: line 2023.

## Animation Control Guide

## Main Animation Loop

Location:

- `animate(currentTime)`: line 1272.

Order each frame:

1. Compute `delta` from `THREE.Clock`.
2. Convert timestamp to seconds as `elapsed`.
3. Run blink controller.
4. Run chalkboard state machine.
5. Read keyboard movement / scripted movement.
6. Update jump height.
7. Update torso breathing.
8. Update mouth geometry.
9. Update avatar opacity.
10. Update sprite effects.
11. Update ghost sphere drift.
12. Update camera.
13. Render scene.
14. Request next animation frame.

Why order matters:

- Chalkboard can temporarily own movement before keyboard motion runs.
- Walk cycle sets `avatar.body.userData.walkBob`.
- Breathing later reads walk bob and applies it to `avatar.body.position.y`.
- Camera follows after root movement is complete.

## Keyboard Controls

Location:

- `handleKeyDown()`: line 1733.
- `handleKeyUp()`: line 1791.
- `isHandledControl()`: line 1795.

Current controls:

- `W` / `S`: walk forward/backward.
- `A` / `D`: turn avatar.
- Arrow left/right: orbit camera.
- Arrow up/down: zoom camera.
- Page up/down: raise/lower camera.
- `Z`: toggle left arm up/down.
- `X`: toggle right arm up/down.
- `H`: toggle both hands half-high.
- `J`: jump.
- `Space`: wave both arms briefly.
- `1`: hearts.
- `2`: stars.
- `3`: thought bubble.
- `B`: chalkboard routine.
- `Escape`: cancel chalkboard routine and restore pre-routine state.

How key state works:

- Held keys are stored in `controlState.keys`.
- `handleKeyDown()` adds key code.
- `handleKeyUp()` removes key code.
- Continuous movement checks the set every frame in `updateKeyboardMotion()`.
- One-shot actions ignore repeats.

To add a new key:

1. Add its code to `isHandledControl()`.
2. Add logic in `handleKeyDown()`.
3. Add any persistent state to `controlState` or `avatarState`.

## Avatar Movement

Location:

- `updateKeyboardMotion(delta, currentTime)`: line 1869.

Forward/back:

- `W` gives `+1`.
- `S` gives `-1`.
- Direction uses avatar yaw:

```js
new THREE.Vector3(
  Math.sin(controlState.avatarYaw),
  0,
  Math.cos(controlState.avatarYaw)
)
```

Speed:

- `moveSpeed = 1.55`.

Bounds:

- Root X/Z are clamped to `+/-ROOM.avatarTravelLimit`.

Turning:

- `A` / `D` modify `controlState.avatarYaw`.
- Avatar root Y rotation is set from `avatarYaw`.

## Camera Controls

Location:

- Camera input in `updateKeyboardMotion()`: line 1869.
- Camera follow function: `updateCamera(delta)`: line 2039.

Camera state:

- `controlState.cameraYaw`.
- `controlState.cameraDistance`.
- `controlState.cameraHeight`.

Limits:

- Distance: `4.2` to `9.4`.
- Height: `1.4` to `4.3`.

Camera target:

- Avatar root position plus `(0, 1.65, 0)`.

Motion smoothing:

- Camera position lerps toward desired position using delta-based damping.

## Walking

Location:

- `updateWalkCycle(delta, isWalking, currentTime)`: line 1927.
- `updateLegPose()`: line 1967.
- `updateArmPose()`: line 1972.

Walk blend:

- Stored in `avatar.root.userData.walkBlend`.
- Damped toward `1` when walking.
- Damped toward `0` when idle.

Walk phase:

- `controlState.walkPhase += delta * 6.4`.

Bob:

- `abs(sin(walkPhase * 2)) * 0.035 * walkBlend`.
- Stored as `avatar.body.userData.walkBob`.

Leg swing:

- Left leg uses `sin(walkPhase)`.
- Right leg uses `sin(walkPhase + PI)`.

Arm swing:

- Arms counter-swing against legs.

Important:

- The walk bob is not assigned directly to the root.
- Breathing reads it and applies it to `avatar.body.position.y`.

## Arm Pose System

Location:

- `updateArmPose()`: line 1972.

Inputs:

- `arm`: left or right arm object from `makeArm()`.
- `stateKey`: `"leftArm"` or `"rightArm"`.
- `walkSwing`: swing value from walk cycle.
- `delta`, `currentTime`.

Pose states:

- `"down"`:
  - Shoulder Z near `side * 0.2`.
  - Uses walk swing on X.
- `"up"`:
  - Shoulder Z near `side * 2.28`.
- `"half"`:
  - Shoulder Z near `side * 1.12`.
  - Slight elbow bend.
- `"write"`:
  - Right arm scribble pose.
  - Uses fast sinusoidal micro-motion.
- `"erase"`:
  - Similar to write, faster scribble.
- Wave:
  - Overrides other pose while `currentTime < controlState.waveUntil`.

Smoothing:

- Uses `THREE.MathUtils.damp()`.
- This avoids snapping between arm states.

To make poses faster:

- Increase damping lambda, currently `8`.

To make poses slower:

- Decrease damping lambda.

## Jump

Location:

- `startJump()`: line 1425.
- `updateJump()`: line 1437.

Parameters:

- `jumpDuration`: `520` ms.
- `jumpHeight`: `0.32`.

Formula:

```js
avatar.root.position.y =
  AVATAR_FLOOR_OFFSET +
  Math.sin(progress * Math.PI) * controlState.jumpHeight;
```

Meaning:

- Starts at floor offset.
- Rises to peak at half duration.
- Returns to floor offset.

Jump is disabled during chalkboard routine.

## Blinking

Location:

- Blink constants: lines 261-264.
- `scheduleNextBlink()`: line 1291.
- `runBlinkController()`: line 1299.
- `startBlink()`: line 1311.
- `endBlink()`: line 1320.

Parameters:

- Blink duration base: `150` ms.
- Minimum interval: `1000` ms.
- Mean Poisson delay: `4200` ms.

Important:

- `BLINK_CHANCE` remains from older code but current scheduling uses exponential delay.
- `scheduleNextBlink()` computes:

```js
MIN_INTERVAL - Math.log(randomValue) * BLINK_MEAN_INTERVAL
```

How visibility changes:

- `eyesClosed = true/false`.
- `updateAvatarImage()` hides open-eye groups and shows closed capsules.

## Mouth And Microphone Speech

Mic setup:

- `requestMicStart()`: line 1136.
- `startMic()`: line 1150.
- `checkVolume()`: line 1199.

Audio settings:

```js
echoCancellation: true
noiseSuppression: true
autoGainControl: true
```

Volume detection:

- Uses time-domain RMS from `getFloatTimeDomainData()`.
- Calibrates adaptive noise floor for first 72 frames.
- Tracks `audioState.voiceLevel`.
- Converts voice level to mouth level `0-4`.

Mouth animation:

- `audioState.targetMouthLevel` indexes `mouthStates`.
- `updateMouthGeometry()` lerps mouth scale and Y position.

To make mouth more reactive:

- Increase normalized multiplier in `checkVolume()`, currently `voiceAboveFloor * 24`.
- Increase attack value, currently `0.38` rising, `0.16` falling.

To make mouth calmer:

- Decrease the multiplier or attack values.

## Breathing

Location:

- State: `breathingState`, line 331.
- Per-frame update: `updateBreathingMotion()`, line 1361.
- Geometry mutation: `updateTorsoBreathingGeometry()`, line 531.

Formula:

```js
const breathing = Math.sin(elapsed * 1.5) * 0.018;
const jitter = isTalking ? Math.sin(elapsed * 40) * 0.008 : 0;
breathingState.baseExpansion = breathing + jitter;
```

What it affects:

- Only lower torso X/Z diameter.

What it does not affect:

- Head.
- Limbs.
- Feet.
- Root transform.
- Camera.

Talking state:

- True when mic mouth level is open.
- Also true during chalkboard writing/erasing.

## Avatar Opacity

Location:

- `visualState`: line 326.
- `setAvatarOpacityTarget()`: line 1376.
- `updateAvatarOpacity()`: line 1385.
- `applyAvatarOpacity()`: line 1396.

Purpose:

- Fades avatar during chalkboard routine so board text remains readable.

How it works:

- Traverses `avatar.root`.
- Stores each material's original opacity and transparency in `material.userData`.
- Multiplies material opacity by current avatar opacity.
- Uses damping toward target.

Current chalkboard fade:

- `CHALKBOARD_SEQUENCE.avatarFadeOpacity = 0.1`.

## Chalkboard Routine

Start:

- Press `B`.
- `handleKeyDown()` calls `startChalkboardEvent()`.

State machine:

- `startChalkboardEvent()`: line 1456.
- `updateChalkboardEvent()`: line 1502.
- `setChalkboardPhase()`: line 1620.
- `finishChalkboardEvent()`: line 1706.

Phases:

1. `approach`
   - Walks to board.
   - Faces board.
2. `write`
   - Shows chalk.
   - Right arm uses `"write"` pose.
   - Reveals text over `6200` ms.
   - Plays `write.mp3`.
3. `present`
   - Moves aside.
   - Faces camera.
   - Keeps board visible.
4. `hold`
   - Waits `5000` ms.
   - Text remains visible.
5. `eraseApproach`
   - Walks back to board.
   - Shows eraser.
6. `erase`
   - Right arm uses `"erase"` pose.
   - Erases text over `3200` ms.
   - Plays `erase.mp3`.
7. Finish
   - Hides board.
   - Hides tools.
   - Returns control in place.

Cancel:

- Press `Escape`.
- Calls `cancelChalkboardEvent()`.
- Calls `finishChalkboardEvent(true)`.
- Restores saved pre-routine position, yaw, camera, arms, effect, prop.

Important distinction:

- Normal finish does not restore old position.
- Escape cancel does restore old state.

## Scripted Movement

Location:

- `moveAvatarToward()`: line 1637.
- `dampAngle()`: line 1665.

How it works:

- Computes X/Z vector to target.
- Moves root by `speed * delta`.
- Damp-rotates toward target yaw.
- Returns `true` while still moving.

Used by:

- Chalkboard approach.
- Presentation move.
- Erase approach.

## Sound Effects

Build location:

- `soundEffects`: line 303.

Playback:

- `playSound(name, loop)`: line 891.
- `stopSound(name)`: line 906.

Sounds:

- `write`: `assets/write.mp3`.
- `erase`: `assets/erase.mp3`.

Browser note:

- Sounds may not play until the user interacts with the page because browsers block autoplay.
- Keyboard/pointer interaction unlocks audio in normal use.

## How To Safely Modify The Rig

### Add A New Body Part

Recommended pattern:

1. Create geometry and mesh in `buildAvatar()` or a helper.
2. Attach it to the correct group.
3. Store it in `parts`.
4. Animate it from an update function.

Example:

```js
const antenna = makeAlienMesh(new THREE.CapsuleGeometry(0.02, 0.4, 8, 12), {
  position: [0, 3.2, 0],
  scale: [1, 1, 1],
});
head.add(antenna);
parts.antenna = antenna;
```

### Add A New Pose

Recommended pattern:

1. Add a new symbolic value to `avatarState.leftArm` or `avatarState.rightArm`.
2. Add behavior inside `updateArmPose()`.
3. Add a key in `handleKeyDown()` if needed.

### Add A New Full-Body Routine

Recommended pattern:

1. Create a new state object similar to `chalkboardEvent`.
2. Save current control state with `captureControlSnapshot()`.
3. In `animate()`, update the routine before keyboard movement.
4. Temporarily ignore keyboard motion while active.
5. Provide an Escape/cancel path.

### Add A New Facial State

Mouth:

- Add to `mouthStates`.
- Adjust microphone mapping if you need more than 5 states.

Eyes:

- For visibility changes, use the existing open/closed groups.
- For new geometry, edit `makeAlmondEyeGeometry()` or `makeEye()`.

## Quick Search Map

Use these commands from the project folder:

```powershell
rg -n "function buildAvatar" main.js
rg -n "function makeSlenderTorsoGeometry" main.js
rg -n "function updateBreathingMotion" main.js
rg -n "function updateArmPose" main.js
rg -n "function updateKeyboardMotion" main.js
rg -n "function updateChalkboardEvent" main.js
rg -n "const mouthStates" main.js
rg -n "const controlState" main.js
```

## Practical Editing Checklist

Before changing shape:

- Identify which function creates the mesh.
- Identify which group owns it.
- Check whether any animation code assumes its position.

Before changing movement:

- Check `controlState`.
- Check `avatarState`.
- Check `updateKeyboardMotion()`.
- Check `updateWalkCycle()`.
- Check `updateArmPose()`.

Before changing the chalkboard routine:

- Check `CHALKBOARD_SEQUENCE`.
- Check `updateChalkboardEvent()`.
- Check `finishChalkboardEvent()`.
- Check `Escape` behavior.

Before changing mouth/mic:

- Check `mouthStates`.
- Check `checkVolume()`.
- Check `updateMouthGeometry()`.

After changing anything:

- Run a syntax check:

```powershell
Get-Content -Raw -LiteralPath .\main.js | node --input-type=module --check
```

- Reload `http://127.0.0.1:5173/`.
- Check console warnings/errors.
- Test at least:
  - blink idle.
  - `W`/`S` movement.
  - `A`/`D` turning.
  - `J` jump.
  - `H` half hands.
  - `Space` wave.
  - `B` chalkboard routine.
  - `Escape` cancel.
