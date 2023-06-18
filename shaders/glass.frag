uniform vec4 tintColor;
uniform vec4 rimColor;
uniform float rimWidth;
uniform float rimSmoothness;

uniform vec3 viewDir;

varying vec3 vNormal;

float fresnel() {
    return 1.0 - dot(-vNormal, viewDir);
}

void main() {
    float rimMask = smoothstep(rimWidth - rimSmoothness, rimWidth, fresnel());
    //Apply the rim color to the rim, and the tint to the rest
    vec4 col = rimMask * rimColor + (1.0-rimMask) * tintColor;

    gl_FragColor = col;
}