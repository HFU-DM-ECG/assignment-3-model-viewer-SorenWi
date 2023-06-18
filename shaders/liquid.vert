varying vec3 vWorldPosition;
varying vec3 vObjectSpacePosition;
varying vec3 vNormal;

void main() {
    vNormal = normal;
    vWorldPosition = vec3(modelMatrix * vec4(position, 1.0));
    vObjectSpacePosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}