import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
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

let crystalMaterial;
let crystalFragmentShader;
let crystalVertexShader;

camera.position.z = 5;

init();

async function init() {
	
	crystalFragmentShader = await fetch('./shaders/crystal.frag').then(response => response.text());
	crystalVertexShader = await fetch('./shaders/crystal.vert').then(response => response.text());

	crystalMaterial = new THREE.ShaderMaterial( {

		uniforms: {
			viewDir: { value: new THREE.Vector3() },
			crystalColor: { value: new THREE.Vector3(.2,0,.5) },
			fresnelColor: { value: new THREE.Vector3(.9,.4,.8) },
			fresnelIntensity: { value: .7 },
			fresnelPower: { value: 0.8 },
		},
	
		vertexShader: crystalVertexShader,
		fragmentShader: crystalFragmentShader
	
	} );

	const crystal = await loadObject("./models/Crystal.glb");
	crystal.material = crystalMaterial;
	scene.add(crystal);

	animate();
}

//Requires the crystal shaders to be loaded
function createCrystalMaterial(crystalColor, fresnelColor, fresnelIntensity, fresnelPower) {
	return new THREE.ShaderMaterial( {
		uniforms: {
			viewDir: { value: new THREE.Vector3() },
			crystalColor: { value: crystalColor },
			fresnelColor: { value: fresnelColor },
			fresnelIntensity: { value: fresnelIntensity },
			fresnelPower: { value: fresnelPower },
		},
	
		vertexShader: crystalVertexShader,
		fragmentShader: crystalFragmentShader
	} );
}

async function loadObject(path) {
	return new Promise((resolve) => {
		loader.load(path, (loadedObject) => {
			resolve(loadedObject.scene.children[0]);
		});
	});
}

function animate(time) {
	requestAnimationFrame( animate );

	time *= 0.001;


	//crystalMaterial.uniforms.time.value = time;
	crystalMaterial.uniforms.viewDir.value = getViewDir();

	controls.update();
	renderer.render( scene, camera );
}

//https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
function getViewDir() {
	let vector = new THREE.Vector3( 0, 0, - 1 );
	vector.applyQuaternion( camera.quaternion );
	return camera.getWorldDirection( vector );
}

