uniform vec3 viewDir;

uniform vec3 crystalColor;

uniform vec3 fresnelColor;
uniform float fresnelIntensity;
uniform float fresnelPower;

uniform sampler2D shadowMap;

varying vec4 vShadowCoord;
varying vec3 vNormal;

float fresnel() {
    return pow(1.0 - dot(-vNormal, viewDir), fresnelPower);;
}

void main() {
    //Add fresnel effect to base color
    vec3 color = crystalColor + fresnel() * fresnelIntensity * fresnelColor;
    
    //Shadow
    vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;
    float shadowDepth = shadowCoord.z;
    vec2 shadowMapUv = shadowCoord.xy;
    float shadowValue = texture2D(shadowMap, shadowMapUv).x;
    float bias = 0.0001; 
    float shadow = step(shadowValue + bias, shadowDepth);

    float shadowMultiplier = 0.7;
    color = mix(color, color * shadowMultiplier, shadow);

    gl_FragColor = vec4(color, 1);
}