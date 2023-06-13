uniform float time;
uniform vec3 viewDir;

uniform vec3 waterBaseColor;
uniform float waterAlpha;
uniform float waterSpeed;

uniform sampler2D noiseDetailed;
uniform sampler2D noiseRough;

uniform sampler2D depth;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {

    //vec2 depthUV = gl_FragCoord.xy / resolution.xy;
    //float sceneDepth = texture2D(depth, depthUV).r;

    //WATERFALL
    vec2 waterfallUV = vWorldPosition.xz + vec2( -time * (waterSpeed) + vUv.y, 0);
    float waterfallNoise = texture2D(noiseDetailed, waterfallUV).r;
    waterfallNoise = step(0.6, waterfallNoise);
    waterfallNoise *= step(dot(vNormal, vec3(0,1,0)), 0.75);

    vec2 sampleFlat = vUv * vec2(20, 12) + vec2(0, -time * waterSpeed * 0.5);
    float noiseDetailed = texture2D(noiseDetailed, sampleFlat).r;

    //float noise = texture2D(noiseDetailed, vUv).r;

    //Bit faster 
    //samplePosition = vec2(0, vUv.y) + vec2(0, time * (waterSpeed + 0.1));
    //float noiseRough = texture2D(noiseRough, samplePosition * 0.01).r;
    
    //float noise = (noiseDetailed + noiseRough) * 0.5;
    //noise = step(noise, 0.3);

    //vec3 waterColor = waterBaseColor + noise * 0.4f;

    noiseDetailed = step(noiseDetailed, 0.4) * 0.1;

    vec3 finalColor = waterBaseColor + vec3(waterfallNoise) + vec3(noiseDetailed);

    gl_FragColor = vec4(finalColor, 1);
}