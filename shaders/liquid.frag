
uniform float fillAmount;
uniform vec3 liquidColorGradient1;
uniform vec3 liquidColorGradient2;
uniform vec3 liquidTopColor;

uniform float edgeWidth;
uniform vec3 edgeColor;

uniform vec3 fresnelColor;
uniform float fresnelIntensity;
uniform float fresnelPower;

uniform vec2 heightBounds;
uniform vec3 viewDir;
uniform vec3 objectPosition;

varying vec3 vWorldPosition;
varying vec3 vObjectSpacePosition;
varying vec3 vNormal;



float fresnel() {
    return pow(1.0 - dot(vNormal, -viewDir), fresnelPower);
}

float inverseLerp(float a, float b, float v) {
    return (v-a)/(b-a);
}

vec3 getLiquidColor(float localHeight, float fillMask) {
    //Edge Mask
    float edgeMask = step(fillAmount - edgeWidth, localHeight) * fillMask;

    //Gradient only takes up the part where there is no edge;
    float gradientMask = fillMask - edgeMask; 

    //Gradient (Starts at bottom, ends at current fill height)
    vec3 color = mix(liquidColorGradient1, liquidColorGradient2, inverseLerp(0.0, fillAmount, localHeight)) ;
    //Apply mask
    color *= gradientMask;
    //Fresnel
    color += fresnel() * fresnelIntensity * fresnelColor;
   
    //Edge color
    color += edgeColor * edgeMask;

    return color;
}

void main() {
    //Position in world space as if object would be at (0,0,0)
    //This doesn't rotate when the object does while ObjectSpacePosition would 
    float localHeight = (vWorldPosition - objectPosition).y;
    //Remap to be between 0 and 1
    localHeight = inverseLerp(heightBounds.x, heightBounds.y, localHeight);
    //Mask the fill
    float fillMask = step(localHeight, fillAmount);

    //Clip everything above the fill amount
    if (fillMask == 0.0)
        discard;


    vec3 col;

    if (gl_FrontFacing) {
        col = getLiquidColor(localHeight, fillMask);
    } else {
        col = liquidTopColor;
    }

    gl_FragColor = vec4(vec3(col), 1.0);
}