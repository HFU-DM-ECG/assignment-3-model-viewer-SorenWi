import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import Stats from 'three/addons/libs/stats.module.js';


const shadowMapResolution = 4096;
let light, lightHelper; //directional light

const stats = new Stats();

//Scenes + Cameras
let scene, depthScene, shadowScene;
let camera;

let renderer, controls;

//Render targets
let depthRenderTarget;

//Materials + Shaders
let crystalMaterial, crystalVertexShader, crystalFragmentShader;
let riverMaterial, lakeMaterial, waterVertexShader, waterFragmentShader;
let terrainMaterial, terrainVertexShader, terrainFragmentShader;

//Textures
let noiseDetailedTexture, noiseRoughTexture;

init();

async function init() {
	initThree();

	//Load resources
	await loadShaders();
	await loadTextures();
	createMaterials();
	await loadObjects();

	initGui();
	
	requestAnimationFrame(animate);
}

//Creates gui and exposes light settings and shader uniforms in it
function initGui() {
	const gui = new GUI({ width: 310});

	//Object to store the colors in rgb values, because the gui doesnt take THREE.Vector3 as color 
	const colors = {
		lakeShallowWater: vector3ToRgb(lakeMaterial.uniforms.waterShallowColor.value),
		lakeDeepWater: vector3ToRgb(lakeMaterial.uniforms.waterDeepColor.value),
		riverShallowWater: vector3ToRgb(riverMaterial.uniforms.waterShallowColor.value),
		riverDeepWater: vector3ToRgb(riverMaterial.uniforms.waterDeepColor.value),
		crystalBaseColor: vector3ToRgb(crystalMaterial.uniforms.crystalColor.value),
		crystalFresnelColor: vector3ToRgb(crystalMaterial.uniforms.fresnelColor.value),
	}

	const lightFolder = gui.addFolder("Directional Light");
	lightFolder.add(light.position, "x", -10, 10).onChange(updateLight);
	lightFolder.add(light.position, "y", -10, 10).onChange(updateLight);
	lightFolder.add(light.position, "z", -10, 10).onChange(updateLight);
	lightFolder.add(lightHelper, "visible").name("Helper visible");

	const lakeFolder = gui.addFolder("Lake");
	createWaterGuiFolderContents(lakeFolder, lakeMaterial.uniforms, colors);
	
	const riverFolder = gui.addFolder("River");
	createWaterGuiFolderContents(riverFolder, riverMaterial.uniforms, colors);

	const crystalFolder = gui.addFolder("Crystals");
	
	crystalFolder.addColor(colors, "crystalBaseColor").name("Base color").onChange(color => changeColor(color, crystalMaterial.uniforms.crystalColor.value));
	crystalFolder.addColor(colors, "crystalFresnelColor").name("Fresnel color").onChange(color => changeColor(color, crystalMaterial.uniforms.fresnelColor.value));
	crystalFolder.add(crystalMaterial.uniforms.fresnelIntensity, "value", 0.0, 5.0).name("Fresnel intensity");
	crystalFolder.add(crystalMaterial.uniforms.fresnelPower, "value", 0.0, 5.0).name("Fresnel power");

}

//Adds all the wanted water shader uniforms to the folder 
function createWaterGuiFolderContents(folder, waterUniforms, colorsObject) {
	folder.addColor(colorsObject, "lakeShallowWater").name("Shallow water color").onChange(color => changeColor(color, waterUniforms.waterShallowColor.value));
	folder.addColor(colorsObject, "lakeDeepWater").name("Deep water color").onChange(color => changeColor(color, waterUniforms.waterDeepColor.value));
	folder.add(waterUniforms.shallowWaterAlpha, "value", 0.0, 1.0, 0.05).name("Shallow water alpha");
	folder.add(waterUniforms.deepWaterAlpha, "value", 0.0, 1.0, 0.05).name("Deep water alpha");
	folder.add(waterUniforms.shallowToDeepDistance, "value", 0.0, 0.04, 0.001).name("Shallow to deep distance");
	folder.add(waterUniforms.intersectionWidth, "value", 0.0, 0.01, 0.0001).name("Intersection width");
	folder.add(waterUniforms.waterSpeed, "value", 0.0, 2.0, 0.05).name("Water speed");
}

//Takes an rgb color (value) and sets the components of a vector 3 (colorToChange) to it 
function changeColor(value, colorToChange) {
	colorToChange.set(value.r, value.g, value.b);
}

//Takes a vector 3 and returns an rbg object
function vector3ToRgb(vector3) {
	return { r: vector3.x, g: vector3.y, b: vector3.z };
}

//Called when the light position updates through the gui
//Updates the shadow camera and the light helper to fit the new light values
function updateLight() {
	light.shadow.camera.position.copy(light.position);
	light.shadow.camera.lookAt(new THREE.Vector3(0,0,0));
	lightHelper.update();
}

function initThree() {
	//Three js setup
	scene = new THREE.Scene();
	depthScene = new THREE.Scene();
	shadowScene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.set(4, 3, 2);
	light = new THREE.DirectionalLight();
	light.position.set(6, 2, 10);
	light.shadow.mapSize.width = shadowMapResolution;
	light.shadow.mapSize.height = shadowMapResolution;
	light.shadow.camera.position.copy(light.position);
	light.shadow.camera.lookAt(new THREE.Vector3(0,0,0));
	scene.add(light);
	scene.add(light.shadow.camera); 
	lightHelper = new THREE.DirectionalLightHelper( light, 3 );
	lightHelper.visible = false;
	scene.add( lightHelper );

	document.body.appendChild(stats.dom);

	renderer = new THREE.WebGLRenderer();
	controls = new OrbitControls(camera, renderer.domElement);
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
	setupDepthRenderTarget(depthRenderTarget);
	light.shadow.map = new THREE.WebGLRenderTarget( shadowMapResolution, shadowMapResolution);
	setupDepthRenderTarget(light.shadow.map);
}


function animate(time) {
	requestAnimationFrame( animate );

	//Convert time to seconds
	time *= 0.001;

	//Depth render pass
	renderer.setRenderTarget(depthRenderTarget);
	renderer.render( depthScene, camera );

	//Shadow pass
	renderer.setRenderTarget(light.shadow.map);
	renderer.render(shadowScene, light.shadow.camera);

	//Update shader uniforms
	riverMaterial.uniforms.depth.value = depthRenderTarget.depthTexture;
	riverMaterial.uniforms.time.value = time;

	lakeMaterial.uniforms.depth.value = depthRenderTarget.depthTexture;
	lakeMaterial.uniforms.time.value = time;

	crystalMaterial.uniforms.viewDir.value = getViewDir();

	//Set uniforms for shadow
	const shadowMap = light.shadow.map.depthTexture;
	const shadowCameraMatrixWorldInverse = light.shadow.camera.matrixWorldInverse;
	const shadowCameraProjectionMatrix = light.shadow.camera.projectionMatrix;
	const materialsReceivingShadows = [terrainMaterial, lakeMaterial, crystalMaterial, riverMaterial]
	setShadowUniforms(materialsReceivingShadows, shadowMap, shadowCameraMatrixWorldInverse, shadowCameraProjectionMatrix);

	//Set uniforms for diffuse light
	terrainMaterial.uniforms.lightPosition.value = light.position;

	//Controls
	controls.update();

	//Stats
	stats.update();

	//Normal render pass
	renderer.setRenderTarget(null);
	renderer.render( scene, camera );
}

function setShadowUniforms(materials, shadowMap, matrixWorldInverse, projectionMatrix) {
	materials.forEach( material => {
		material.uniforms.shadowMap.value = shadowMap;
		material.uniforms.shadowCameraInverseWorldMatrix.value = matrixWorldInverse;
		material.uniforms.shadowCameraProjectionMatrix.value = projectionMatrix;
	});
}

// ----- SETUP -----

async function loadShaders() {
	crystalFragmentShader = await fetch('./shaders/crystal.frag').then(response => response.text());
	crystalVertexShader = await fetch('./shaders/crystal.vert').then(response => response.text());

	waterFragmentShader = await fetch('./shaders/water.frag').then(response => response.text());
	waterVertexShader = await fetch('./shaders/water.vert').then(response => response.text());

	terrainFragmentShader = await fetch('./shaders/terrain.frag').then(response => response.text());
	terrainVertexShader = await fetch('./shaders/terrain.vert').then(response => response.text());
}

async function loadTextures() {
	const textureLoader = new THREE.TextureLoader();
	noiseDetailedTexture = await loadTexture('./textures/noise_detailed.png', textureLoader);
	noiseRoughTexture = await loadTexture("./textures/noise_rough.png", textureLoader);
}

async function loadObjects() {
	//Load models
	const gltfLoader = new GLTFLoader();
	const island = await loadObject("./models/Island.glb", gltfLoader);
	const crystals = await loadObject("./models/Crystals.glb", gltfLoader);
	const river = await loadObject("./models/River.glb", gltfLoader);
	const lake = await loadObject("./models/Lake.glb", gltfLoader);
	//https://www.cgtrader.com/items/4381654/download-page
	const skybox = await loadObject("./models/Skybox.glb", gltfLoader);
	//https://www.cgtrader.com/free-3d-models/various/various-models/skybox-green-blue-sky
	//const skybox = await loadObject("./models/Skybox2.glb", gltfLoader);
	
	//Add objects to standard scene
	scene.add(island);
	scene.add(river);
	scene.add(crystals);
	scene.add(lake);
	scene.add(skybox);

	//Add some of the objects to the scene for rendering the depth
	depthScene.add(island.clone());
	depthScene.add(crystals.clone());

	//Add objects that cast shadows to the shadow scene
	shadowScene.add(island.clone());
	shadowScene.add(crystals.clone());

	//Assign materials
	crystals.material = crystalMaterial;
	lake.material = lakeMaterial;
	island.material = terrainMaterial;
	river.material = riverMaterial;
}

function createMaterials() {
	crystalMaterial = new THREE.ShaderMaterial( {
		uniforms: {
			viewDir: { value: new THREE.Vector3() },
			shadowMap: { value: null},
			shadowCameraProjectionMatrix: { value: light.shadow.camera.projectionMatrix },
			shadowCameraInverseWorldMatrix: { value: light.shadow.camera.matrixWorldInverse },
			crystalColor: { value: new THREE.Vector3(.2,0,.5) },
			fresnelColor: { value: new THREE.Vector3(.9,.4,.8) },
			fresnelIntensity: { value: .7 },
			fresnelPower: { value: 0.8 },
		},
		vertexShader: crystalVertexShader,
		fragmentShader: crystalFragmentShader
	
	} );

	riverMaterial = createWaterMaterial(.6, .003, .75, .85, new THREE.Vector3(0.56, 0.88, 0.94), new THREE.Vector3(0.0, 0.47, 0.7));

	lakeMaterial = createWaterMaterial(.3, .02, .6, .9, new THREE.Vector3(0.0, 0.47, 0.7), new THREE.Vector3(0.0, 0.1, .35));

	terrainMaterial = new THREE.ShaderMaterial({
		uniforms: {
			lightPosition: { value: new THREE.Vector3() },
			shadowMap: { value: null },
			shadowCameraProjectionMatrix: { value: light.shadow.camera.projectionMatrix },
			shadowCameraInverseWorldMatrix: { value: light.shadow.camera.matrixWorldInverse },
		},
		vertexShader: terrainVertexShader,
		fragmentShader: terrainFragmentShader,
	});
}

//Requires water shaders, noise textures to be loaded and the directional light to be set
//Parameters are the uniforms that are different by default for the river and lake water material
function createWaterMaterial(waterSpeed, shallowToDeepDistance, shallowAlpha, deepAlpha, shallowColor, deepColor) {
	return new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 0.0 },
			depth: { value: null },
			resolution: { value: new THREE.Vector2( window.innerWidth, window.innerHeight) },
			shadowMap: { value: null},
			shadowCameraProjectionMatrix: { value: light.shadow.camera.projectionMatrix },
			shadowCameraInverseWorldMatrix: { value: light.shadow.camera.matrixWorldInverse },
			noiseTextureStretch: { value: new THREE.Vector2(40,24) },
			noiseDetailed: { type: "t", value: noiseDetailedTexture },
			noiseRough: { type: "t", value: noiseRoughTexture },
			waterSpeed: { value: waterSpeed },
			intersectionWidth: { value: 0.005 },
			shallowToDeepDistance: { value: shallowToDeepDistance },
			shallowWaterAlpha: { value: shallowAlpha },
			deepWaterAlpha: { value: deepAlpha },
			waterShallowColor: { value: shallowColor },
			waterDeepColor: { value: deepColor },
		},
		transparent: true,
		vertexShader: waterVertexShader,
		fragmentShader: waterFragmentShader,
	});
}

// ----- HELPERS -----

async function loadObject(path, gltfLoader) {
	return new Promise((resolve) => {
		gltfLoader.load(path, (loadedObject) => {
			//All objects have the same structure, the models are always the first child of the scene 
			resolve(loadedObject.scene.children[0]);
		});
	});
}

//Loads texture async and enables repeat wrapping
async function loadTexture(path, textureLoader) {
	return new Promise((resolve) => {
		textureLoader.load(path, (loadedTexture) => {
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			resolve(loadedTexture);
		});
	});
}

//https://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
function getViewDir() {
	let vector = new THREE.Vector3( 0, 0, - 1 );
	vector.applyQuaternion( camera.quaternion );
	return camera.getWorldDirection( vector );
}

function setupDepthRenderTarget(renderTarget) {
	renderTarget.texture.minFilter = THREE.NearestFilter;
	renderTarget.texture.magFilter = THREE.NearestFilter;
	renderTarget.stencilBuffer = false;
	renderTarget.depthTexture = new THREE.DepthTexture();
	renderTarget.depthTexture.format = THREE.DepthFormat;
	renderTarget.depthTexture.type = THREE.UnsignedShortType;
	renderTarget.texture.generateMipmaps = false;
	renderTarget.depthBuffer = true;
}

