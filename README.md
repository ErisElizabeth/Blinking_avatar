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
