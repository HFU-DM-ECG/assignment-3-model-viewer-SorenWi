[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/XkwgRVff)

## Github-Pages
https://hfu-dm-ecg.github.io/assignment-3-model-viewer-SorenWi/

## Explanation
The scene contains 3 different material types (Water, Crystals, Terrain), with a vertex and fragment shader each.
All materials use shadow mapping to display received shadows. Shadows are applied by lerping to a darker version of the color based on the shadow value. The terrain material also uses diffused lighting. A directional light, that can be moved in the gui, is used as a light source. 

Crystals have a base color, with an additive fresnel effect.

The terrain uses the dot product of the normal and the up vector, to determine the color.

For the water, a depth texture excluding the water is rendered. This depth texture is used to compare the scene depth to the (fragments) depth of the water, to calculate intersections and apply a different color and alpha value based on the depth. Two noise textures with a different scale are used, to give the water more detail. The UVs of the water objects are set up and used as a flow map, where -y is the flow direction. 

## How to run locally
- run npm install
- run npx vite
- click on the local host link that appears in the console
