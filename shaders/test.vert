
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vWorldNormal = normalize(normalMatrix * vec3(normal));
    vNormal = vec3(normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}