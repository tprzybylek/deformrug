import {OrbitControls} from './build/Three.js/OrbitControls.js';

// variables
let camera, scene, renderer, controls;

// container
const container = document.getElementsByClassName( 'modelView' )[0];

// scene
scene = new THREE.Scene();

// camera
camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.0001, 10000 );
camera.position.z = 2;

// spherical panorama
const texture = new THREE.TextureLoader().load( './3D/bg.jpg', render );
texture.mapping = THREE.EquirectangularReflectionMapping; // using this method reduces of the noise near the poles
scene.background = texture; // neat trick, the scene is textured as the spherical panorama

// mesh
const loader = new THREE.GLTFLoader(); //using gltf, since it has texture data hardcoded
loader.load('./3D/untitled.glb', function(logo_mesh) {
	const logo_mesh_scene = logo_mesh.scene;
	logo_mesh_scene.position.set(0,-1,0);
	scene.add(logo_mesh_scene);
	render();
});

// light
let light1 = new THREE.PointLight(0xFFFFFF, 2);
let light2 = new THREE.PointLight(0xFFFFFF, 2);
light1.position.set(-10, 15, 50);
light2.position.set(-10, 15, -50);
scene.add(light1, light2);

// renderer
renderer = new THREE.WebGLRenderer( {antialias: true, logarithmicDepthBuffer: true} );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

// controls
controls = new OrbitControls( camera, renderer.domElement );
controls.addEventListener( 'change', render );
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// responsiveness
window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

// necessary functions

function render() {
	renderer.render( scene, camera );
}

function gameLoop() {
	window.requestAnimationFrame(gameLoop);
	camera.updateProjectionMatrix();
	controls.update(); // updating the controls must happen in the game loop in order to enable movement damping
}

gameLoop();