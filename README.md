# Blinking Avatar Prototype

## V0.0.1 Alpha Dev Build

First Blink

This build establishes the first working version of the avatar system.

The project now includes a basic scene, a simple avatar, and procedural blink logic driven by JavaScript. The goal of this build was not polish, but proof: the avatar can exist on screen, hold a pose, and change expression through code.

## Changes Made Since Project Start

- Worked out the basic timing logic for a procedural blink controller.
- Built a simple forest background for the scene.
- Created a stick figure avatar as the first placeholder character.
- Created matching open-eye and closed-eye avatar states.
- Made the avatar blink using code instead of a pre-rendered animation.

## Current Features

- Static forest background.
- Stick figure avatar displayed over the scene.
- JavaScript-controlled blinking behavior.
- Separate image states for open eyes and closed eyes.
- Basic timing system using `requestAnimationFrame`.

## Technical Notes

The blink is controlled procedurally rather than through a video, GIF, or rendered animation sequence.

The logic tracks whether the avatar is currently blinking, how long the eyes have been closed, and when enough time has passed to allow another blink. This makes the avatar feel more alive without requiring a full animation pipeline.

## Current Status

This is a bare-bones alpha prototype.

The avatar blinks.

That is the whole victory.

## Next Goals

- Improve avatar proportions.
- Replace or refine placeholder art.
- Clean up image transparency and alignment.
- Add more natural idle behavior.
- Experiment with additional expressions or motion states.
- Decide whether the avatar system should remain code-driven, become asset-driven, or use a hybrid workflow.

## Version Summary

V0.0.1 proves the core concept:

You can create a reusable avatar scene where a character changes expression through code.

The little thing blinked.

## V0.0.2 Alpha Dev Build

- Added microphone-reactive mouth movement while preserving the independent blink controller.
- Confirmed the mouth state responds to live mic input by accidentally making the avatar lip-sync to techno.

## V0.0.3 Alpha Dev Build

- Rebuilt the avatar as a layered puppet rig.
- Separated body, arms, eyes, mouth, props, and effects into independent transparent PNG layers.
- Confirmed the avatar can assemble on screen as a modular character.
- Experienced immediate spiritual consequences.

## V0.0.4 Alpha Dev Build

Three.js Geometry Avatar Conversion

This build keeps the original 2D puppet assets as project vocabulary, but changes the live avatar from stacked PNG layers into a simple Three.js scene made from basic geometry.

### Version Numbers

- Avatar build: `0.0.4-alpha`
- Three.js: `0.164.1`
- Original backup preserved at: `C:\Users\S. Jones\Desktop\avatar_original_backup_20260508-184800`

### Changes Made In This Build

- Replaced the visible layered sprite puppet with a simple grey-alien geometry rig.
- Used `#639464` as the avatar color, with a subtle vertical gradient texture and soft additive glow.
- Added a black 3D room using `#000000` walls.
- Added many ghostly wireframe spheres in `#7f827f`, placed near the walls and ceiling so they stay away from the avatar.
- Converted blink timing to an exponential-delay Poisson-style scheduler while keeping the original blink state structure.
- Tightened microphone capture with echo cancellation, noise suppression, auto gain control, RMS volume tracking, adaptive noise floor calibration, and smoother attack/release response.
- Expanded speech animation from simple closed/open switching into five procedural mouth states: closed, small, medium, open, and surprised.
- Added keyboard-driven movement, camera control, arm posing, waving, and effect triggering.
- Kept the hearts, stars, and thought bubble art as transparent Three.js sprites triggered from the keyboard.

### Keyboard Controls

- `W` / `S`: walk forward and backward.
- `A` / `D`: turn the avatar.
- `Arrow Left` / `Arrow Right`: orbit the camera.
- `Arrow Up` / `Arrow Down`: zoom the camera in and out.
- `Page Up` / `Page Down`: raise and lower the camera.
- `Z`: toggle the left arm up or down.
- `X`: toggle the right arm up or down.
- `Space`: wave both arms briefly.
- `1`: trigger hearts.
- `2`: trigger stars.
- `3`: trigger thought bubble.

### Technical Notes

The old `updateAvatarImage()` function name is still present for continuity. It no longer swaps layered PNGs; it now synchronizes the avatar state with Three.js eye visibility and procedural mouth shape.

The microphone animation now measures time-domain RMS instead of averaging raw frequency bins. This tends to react more naturally to speech volume, avoids some low-level room noise, and gives the mouth enough signal detail to move through multiple states instead of snapping between two images.

The app now uses ES modules, so it should be opened from a local web server instead of directly from the file system.
