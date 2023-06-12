uniform vec3 viewDir;

uniform vec3 crystalColor;

uniform vec3 fresnelColor;
uniform float fresnelIntensity;
uniform float fresnelPower;

varying vec3 vNormal;

float fresnel() {
    return pow(1.0 - dot(-vNormal, viewDir), fresnelPower);;
}

void main() {
    vec3 color = fresnel() * fresnelIntensity * fresnelColor;
    color += crystalColor;
    gl_FragColor = vec4(color, 1);
}