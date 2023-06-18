uniform float time;

uniform float waterSpeed;

uniform vec3 waterShallowColor;
uniform vec3 waterDeepColor;
uniform float shallowWaterAlpha;
uniform float deepWaterAlpha;
uniform float shallowToDeepDistance;

uniform float intersectionWidth;

uniform sampler2D noiseDetailed;
uniform sampler2D noiseRough;
uniform vec2 noiseTextureStretch;

uniform sampler2D depth;
uniform vec2 resolution;

uniform sampler2D shadowMap;
varying vec4 vShadowCoord;

varying vec2 vUv;

float inverseLerp(float a, float b, float v) {
    return (b-a) / (v-a);
}

void main() {
    //Get depth values
    vec2 sceneDepthUV = gl_FragCoord.xy / resolution.xy;
    float sceneDepth = texture2D(depth, sceneDepthUV).r / gl_FragCoord.w;
    float fragDepth = gl_FragCoord.z / gl_FragCoord.w;
    float waterDepth = (sceneDepth - fragDepth) / gl_FragCoord.w;
    
    //Intersections 
    float intersection = 1.0 - smoothstep(0.0, intersectionWidth, waterDepth);
    vec2 noiseSamplingCoord = vUv * noiseTextureStretch + vec2(0, -time * waterSpeed * 0.5);
    float intersectionNoise = (texture2D(noiseDetailed, noiseSamplingCoord).x);
    intersection += intersectionNoise;
    intersection = step(1.3, intersection);

    //Depth tinting
    float t = clamp(inverseLerp(0.0, shallowToDeepDistance, waterDepth), 0.0, 1.0);
    vec3 tintColor = mix(waterDeepColor, waterShallowColor, t);
    float waterDepthAlpha = mix(deepWaterAlpha, shallowWaterAlpha, t); 

    //Noise
    float noiseRoughValue = texture2D(noiseRough, noiseSamplingCoord).x;
    noiseSamplingCoord = vUv * noiseTextureStretch + vec2(0, -time * waterSpeed);
    float noiseDetailed = (texture2D(noiseDetailed, noiseSamplingCoord).x);
    float noise = (noiseDetailed + noiseRoughValue) * 0.5 * 0.1;

    //If there is an intersection display without transparency
    float alpha = waterDepthAlpha;
    if (intersection == 1.0)
        alpha = 1.0;

    vec3 color = tintColor + vec3(intersection) + noise;

    //Shadows
    vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;
    float shadowDepth = shadowCoord.z;
    vec2 shadowMapUv = shadowCoord.xy;
    float shadowValue = texture2D(shadowMap, shadowMapUv).x;
    float bias = 0.0001; 
    float shadow = step(shadowValue + bias, shadowDepth);
    float shadowDarkness = 0.2;

    color = mix(color, color - vec3(shadowDarkness), shadow); 

    gl_FragColor = vec4(color, alpha);

}