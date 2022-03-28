import {PointerLockControls} from './build/Three.js/PointerLockControls.js';

// variables
let camera, scene, renderer, controls;

// container
const container = document.getElementsByClassName( 'modelView' )[0];

// scene
scene = new THREE.Scene();

// camera
camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.0001, 10000 );
camera.position.y = 0;
camera.position.z = 2;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// spherical panorama
// const texture = new THREE.TextureLoader().load( './3D/bg.jpg', render );
// texture.mapping = THREE.EquirectangularReflectionMapping; // using this method reduces of the noise near the poles
// scene.background = texture; // neat trick, the scene is textured as the spherical panorama

// mesh
const loader = new THREE.GLTFLoader(); //using gltf, since it has texture data hardcoded
loader.load('./3D/place_roiale.glb', function(logo_mesh) {
	const logo_mesh_scene = logo_mesh.scene;
	logo_mesh_scene.position.set(0,-0.5,0); //the player's head is set to a meter above the ground. Though with the scaling in the next line I fear that it's closer to 10 meters than one...
	logo_mesh_scene.scale.set(0.1,0.1,0.1); //scale is set to 10% of original, the movement feels natural this way
	scene.add(logo_mesh_scene);
	render();
});

const box = new THREE.Box3();

const mesh = new THREE.Mesh(
	new THREE.SphereGeometry( 1, 3, 16 ),
	new THREE.MeshBasicMaterial( { color: 0xffff00 } )
);
scene.add(mesh);
console.log(mesh);

// ensure the bounding box is computed for its geometry
// this should be done only once (assuming static geometries)
mesh.geometry.computeBoundingBox();

// light
const light = new THREE.HemisphereLight( 0xffffff, 0x999999, 1 ); //we get natural light decay (from white to black) using this light
scene.add( light );

// renderer
renderer = new THREE.WebGLRenderer( {antialias: true, logarithmicDepthBuffer: true, alpha: true} );
renderer.setClearColor( 0xdad1b6, 1 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

// controls
controls = new PointerLockControls( camera, renderer.domElement );

// start game on click
const startButton = document.getElementById( 'start__button' );

startButton.addEventListener( 'click', function () {
	controls.lock();
	[].forEach.call(document.querySelectorAll('.instructions__container'), function (el) {
		el.style.visibility = 'hidden';
	});
} );

document.addEventListener( 'click', function () {
	if (controls.isLocked) {
		controls.unlock();
		[].forEach.call(document.querySelectorAll('.instructions__container'), function (el) {
			el.style.visibility = 'visible';
		});
	}
} );

scene.add( controls.getObject() );
const onKeyDown = function ( event ) {

	switch ( event.code ) {
		case 'ArrowUp':
		case 'KeyW':
			moveForward = true;
			break;
		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = true;
			break;
		case 'ArrowDown':
		case 'KeyS':
			moveBackward = true;
			break;
		case 'ArrowRight':
		case 'KeyD':
			moveRight = true;
			break;
		case 'Space':
			if ( canJump === true ) velocity.y += 350;
			canJump = false;
			break;
	}
};

const onKeyUp = function ( event ) {
	switch ( event.code ) {
		case 'ArrowUp':
		case 'KeyW':
			moveForward = false;
			break;
		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = false;
			break;
		case 'ArrowDown':
		case 'KeyS':
			moveBackward = false;
			break;
		case 'ArrowRight':
		case 'KeyD':
			moveRight = false;
			break;
	}
};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

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

function animate() {
	requestAnimationFrame( animate );

	const time = performance.now();

	if ( controls.isLocked === true ) {
		const delta = ( time - prevTime ) / 1000;

		// camera decceleration
		velocity.x -= velocity.x * 5.5 * delta;
		velocity.z -= velocity.z * 5.5 * delta;

		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions

		// camera movement
		if ( moveForward || moveBackward ) velocity.z -= direction.z * 10.0 * delta;
		if ( moveLeft || moveRight ) velocity.x -= direction.x * 10.0 * delta;

		controls.moveRight( - velocity.x * delta );
		controls.moveForward( - velocity.z * delta );
	}
	prevTime = time;
	renderer.render( scene, camera );

	box.copy( mesh.geometry.boundingBox ).applyMatrix4( mesh.matrixWorld );
}

animate();
