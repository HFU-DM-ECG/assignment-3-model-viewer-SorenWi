uniform sampler2D shadowMap;
uniform vec3 lightPosition; //Always looks towards (0,0,0) so it is the same as -look direction of the light

varying vec4 vShadowCoord;
varying vec3 vNormal;

void main() {
    vec3 color;

    //Base color
    float terrainValue = dot(vNormal, vec3(0,1,0));

    if (terrainValue > 0.6) {
        color = vec3(.3, .6, .05); //Grass 
    } else if (terrainValue > 0.3) {
        color = vec3(.25, .35, .0); //Grass 2
    } else if (terrainValue > 0.0) {
        color = vec3(.35, .25, .23); //Rock 1
    } else {
        color = vec3(.3, .2, .18); //Rock 2
    }

    //Shading 
    //shadow coord calculation from https://mofu-dev.com/en/blog/threejs-shadow-map/
    vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;
    float shadowDepth = shadowCoord.z;
    vec2 shadowMapUv = shadowCoord.xy;
    float shadowValue = texture2D(shadowMap, shadowMapUv).x;
    float bias = 0.0001; 
    float shadow = step(shadowDepth, shadowValue + bias);
    
    float diffuseLight = max(0.0, dot(normalize(lightPosition), vNormal));
    float shading =  shadow * diffuseLight;

    color = mix(color * 0.4, color * 1.3, shading);


    gl_FragColor = vec4(color , 1.0);
}