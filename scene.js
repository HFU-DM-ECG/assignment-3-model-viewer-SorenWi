import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';


const gui = new GUI();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x111111);
document.body.appendChild( renderer.domElement );

//Controls
const controls = new OrbitControls(camera, renderer.domElement);

//Grid helper
const size = 10;
const divisions = 10;

const gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );

//GLTF Loader
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();


let glassMaterial;
let liquidMaterial;


init()

async function init() {

    //Load shaders
	const glassVertexShader = await fetch('./shaders/glass.vert').then(response => response.text());
    const glassFragmentShader = await fetch('./shaders/glass.frag').then(response => response.text());

    const liquidVertexShader = await fetch('./shaders/liquid.vert').then(response => response.text());
    const liquidFragmentShader = await fetch('./shaders/liquid.frag').then(response => response.text());

    //Load objects
    const potionBottle = await loadObject("./models/Potion.glb").then(response => response.scene.children[0]);
    const potionCork = potionBottle.children[0];
    const potionFill = potionBottle.children[1];
    console.log(potionBottle);

    const fillBoundingBox = new THREE.Box3().setFromObject(potionFill);


    //Create shader materials
    glassMaterial = new THREE.ShaderMaterial({
        uniforms: {
            //Alpha value of the colors is used
            tintColor: { value: new THREE.Vector4(0, .8, 0, .1) },
            rimColor: { value: new THREE.Vector4(0, 1, 0, .6) },
            //tintAlpha: { value: 0.5 },
            //rimAlpha: { value: 0.8 },
            rimWidth: { value: 1.0 },
            rimSmoothness: { value: 1.0 },
            viewDir: { value: new THREE.Vector3() },
        },
        transparent: true,
        vertexShader: glassVertexShader,
        fragmentShader: glassFragmentShader,
    });
    

    liquidMaterial = new THREE.ShaderMaterial({
        uniforms: {
            fillAmount: { value: 0.0 },
            liquidColorGradient1: { value: new THREE.Vector3(.02, .2, .03) },
            liquidColorGradient2: { value: new THREE.Vector3(.1, .2, .05) },
            liquidTopColor: { value: new THREE.Vector3(.1, .4, .1) },
            fresnelColor: { value: new THREE.Vector3(0, .08, .01)},
            fresnelIntensity: { value: 1.0 },
            fresnelPower: { value: .3 },
            edgeWidth: { value: 0.01 },
            edgeColor: { value: new THREE.Vector3(1, 1, 1) },
            viewDir: { value: new THREE.Vector3() },
            heightBounds: { value: new THREE.Vector2(fillBoundingBox.min.y, fillBoundingBox.max.y) },
            objectPosition: { value: new THREE.Vector3(0, 0, 0) }, //TODO set in update
        },
        side: THREE.DoubleSide,
        vertexShader: liquidVertexShader,
        fragmentShader: liquidFragmentShader,
    });

    gui.add(potionBottle.rotation, "x", 0, Math.PI * 2);
    gui.add(potionBottle.rotation, "y", 0, Math.PI * 2);
    gui.add(potionBottle.rotation, "z", 0, Math.PI * 2);

    gui.add(liquidMaterial.uniforms.fillAmount, "value", 0, 1);

    //Apply materials
    potionBottle.material = glassMaterial;
    potionFill.material = liquidMaterial;



    scene.add(potionBottle);

    requestAnimationFrame(animate);
}

function animate(time) {
	requestAnimationFrame( animate );

	time *= 0.001;

    const viewDir = getViewDir();

    liquidMaterial.uniforms.viewDir.value = viewDir;
    glassMaterial.uniforms.viewDir.value = viewDir;

	controls.update();
	renderer.render( scene, camera );
}


async function loadObject(path) {
	return new Promise((resolve) => {
		loader.load(path, (loadedObject) => {
			resolve(loadedObject);
		});
	});
}

//https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
function getViewDir() {
	let vector = new THREE.Vector3( 0, 0, - 1 );
	vector.applyQuaternion( camera.quaternion );
	return camera.getWorldDirection( vector );
}
