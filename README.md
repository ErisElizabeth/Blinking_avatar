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
- Basic timing system using requestAnimationFrame.

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

- Avatar build: 0.0.4-alpha
- Original backup preserved at: `C:\Users\S. Jones\Desktop\avatar_original_backup_20260508-184800`

### Changes Made In This Build

- Replaced the visible layered sprite puppet with a simple grey-alien geometry rig.
- Used #639464 as the avatar color, with a subtle vertical gradient texture and soft additive glow.
- Added a black 3D room using #000000 walls.
- Added many ghostly wireframe spheres in #7f827f, placed near the walls and ceiling so they stay away from the avatar.
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

The old updateAvatarImage() function name is still present for continuity. It no longer swaps layered PNGs; it now synchronizes the avatar state with Three.js eye visibility and procedural mouth shape.

The microphone animation now measures time-domain RMS instead of averaging raw frequency bins. This tends to react more naturally to speech volume, avoids some low-level room noise, and gives the mouth enough signal detail to move through multiple states instead of snapping between two images.

The app now uses ES modules, so it should be opened from a local web server instead of directly from the file system.

## V0.0.5 Alpha Dev Build

Chalkboard Routine And Extra Body Controls

This build adds a small performance sequence while keeping the avatar primitive and geometry-driven.

### Version Numbers

- Avatar build: 0.0.5-alpha
- Three.js: 0.164.1

### Changes Made In This Build

- Added a little hop mechanic for the avatar.
- Added a both-hands-half-high pose.
- Added a spawned floating chalkboard in #274c43 with simple box depth.
- Added a primitive chalk cylinder in #e0dcdc.
- Added a primitive eraser box in #b7b7b7.
- Added write.mp3 and erase.mp3 as sequence sound effects.
- Added a scripted chalkboard routine that walks the avatar to the board, writes text, presents it, erases it, despawns the board, and returns control.
- Added an emergency cancel key that stops the routine, clears the board, hides tools, stops sound, and restores the avatar to the pre-routine state.
- Added Caveat Brush as the chalkboard font for the written text.

### New Keyboard Controls

- `J`: small hop.
- `H`: toggle both hands half high.
- `B`: start the chalkboard routine.
- `Escape`: cancel the chalkboard routine and restore the original state.

### Chalkboard Routine Text

```text
Like, comment, and subscribe!
www.eriselizabeth.com
```

### Technical Notes

The chalkboard text is drawn to a canvas texture so it can be progressively revealed and erased inside the Three.js scene. The routine temporarily owns avatar movement and arm posing; normal keyboard control returns when it finishes or when Escape cancels it.

## V0.0.6 Alpha Dev Build

Lab Coat And Chalkboard Visibility Polish

This build tightens the avatar's physical placement and improves the chalkboard read.

### Version Numbers

- Avatar build: 0.0.6-alpha
- Three.js: 0.164.1

### Changes Made In This Build

- Raised the avatar rig so the feet sit on the floor instead of clipping below it.
- Kept the jump as a true hop above the corrected floor height.
- Added a primitive white lab coat at 80% opacity.
- Built the coat from simple panels and capsule sleeves.
- Attached the sleeve geometry to the arm segments so the coat sleeves move with the arms.
- Expanded the avatar movement bounds so wall collisions happen much closer to the visible room walls.
- Added a fade during the chalkboard writing/presentation beat so the avatar becomes very translucent and the board text remains readable.
- Restored full avatar opacity after the five-second presentation hold and on animation cancel.

## V0.0.7 Alpha Dev Build

Tiny Coat And Routine Polish

### Version Numbers

- Avatar build: 0.0.7-alpha
- Three.js: 0.164.1

### Changes Made In This Build

- Moved and angled the lab coat back panel away from the avatar body to reduce geometry poking through it.
- Changed the chalkboard routine ending so the avatar stays near the board after erasing instead of walking back across the room.
- Kept Escape behavior unchanged: cancel still restores the pre-routine state.

## V0.0.8 Alpha Dev Build

More Defined Classic Grey Alien Rig

### Version Numbers

- Avatar build: `0.0.8-alpha`
- Three.js: `0.164.1`

### Changes Made In This Build

- Increased geometry segment counts across the avatar so the body reads smoother and more defined.
- Replaced the separate cranium/chin head with one continuous inverted pyriform head surface.
- Made the head larger at the top and tapered toward the chin for a more classic grey alien silhouette.
- Made the body slimmer and the limbs slightly longer.
- Added three long primitive fingers to each hand.
- Rebuilt the eyes as large beveled almond-shaped black solids.
- Added small light reflections to the eyes so the face feels more alive.
- Moved the eyes lower on the head and angled them inward toward the chin.
- Changed the mouth to a shallow solid ellipsoid instead of a flat circle.
- Added a subtle breathing scale pulse, with a faster tiny jitter while talking or during chalkboard writing/erasing.

## V0.0.9 Alpha Dev Build

Cleaner Usable Alien Rig Pass

### Version Numbers

- Avatar build: `0.0.9-alpha`
- Three.js: `0.164.1`

### Changes Made In This Build

- Removed the lab coat so the whole rig reads as one alien body again.
- Restored arms to the same `#639464` alien material as the rest of the rig.
- Removed the center hip/ring form so the body is one long, slender torso.
- Rebuilt the torso as a custom lathed geometry with stored original vertex positions.
- Changed breathing so it only expands the lower torso diameter instead of scaling the full avatar.
- Moved the arm attachment points higher, near the neck/shoulder/torso junction.
- Shrunk and lowered the mouth so it fits the face more naturally.
- Rebuilt the eyes as imported `ParametricGeometry` almond surfaces.
- Set the eye patches into the face area instead of placing them far in front of the head.
- Increased inward eye slant and kept the black material plus small reflections.

### Technical Notes

The torso breathing now works by rewriting the torso geometry's X/Z vertex positions from stored originals. The strongest expansion happens at the base of the torso and fades out toward the shoulders, so limb posing and head placement remain stable.

## V0.0.10 Alpha Dev Build

Modeling And Animation Guide

### Version Numbers

- Avatar build: `0.0.10-alpha`
- Three.js: `0.164.1`

### Changes Made In This Build

- Added `MODELING_AND_ANIMATION_GUIDE.md`.
- Documented the avatar hierarchy, scene setup, materials, geometry construction, movement controls, animation loops, microphone mouth states, breathing geometry, chalkboard routine, and practical editing checkpoints.
- Kept runtime behavior unchanged except for the version label.

### Guide

Use `MODELING_AND_ANIMATION_GUIDE.md` as the main field manual for editing the alien model and animation controls.
