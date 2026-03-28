# Phaser 3 Engine & Asset Rules

## Rendering & Physics
- Use `Phaser.AUTO` for rendering. Target canvas size: 800x600.
- Enable `arcade` physics. Set default gravity to `y: 300` unless specified otherwise.
- Keep the `update()` loop lightweight. 

## Asset Pipeline & Styling
- The project contains a `/client/assets/` directory. 
- **Preloading:** Load images in the `preload()` function using relative paths (e.g., `this.load.image('player1', 'assets/player1.png');`).
- **Style Reference (Multimodal):** If the user uploads concept art or reference images in the chat, extract the core color palette (hex codes) and atmospheric "vibe". 
- If a specific sprite is missing, fallback to Phaser's built-in `Graphics` object, but style it using the exact color hex codes extracted from the reference images to maintain a cohesive aesthetic.

## Inputs
- WASD for movement. 
- Ensure input polling happens in the `update()` loop.
