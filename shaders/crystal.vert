uniform mat4 shadowCameraProjectionMatrix;
uniform mat4 shadowCameraInverseWorldMatrix;

varying vec4 vShadowCoord;
varying vec3 vNormal;

void main() {
    vNormal = normal;
    vShadowCoord = shadowCameraProjectionMatrix * shadowCameraInverseWorldMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}