
uniform mat4 shadowCameraInverseWorldMatrix;
uniform mat4 shadowCameraProjectionMatrix;

varying vec4 vShadowCoord;
varying vec2 vUv;

void main() {
    vUv = uv;
    vShadowCoord = shadowCameraProjectionMatrix * shadowCameraInverseWorldMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}