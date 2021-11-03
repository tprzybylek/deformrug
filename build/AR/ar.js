/*
the following code uses functionality provided by three.js and webxr api
licenses for those libraries/apis are:
THREE.js is licensed under the MIT license. Further reading: https://github.com/mrdoob/three.js/blob/dev/LICENSE
WebXR is licensed under the W3C license. Further reading: https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/

let mesh_object = null;
let mesh_reticle = null;
let clone = null; //declaring clone as null globally fixes the issue of animations not working in the game loop

const loader = new THREE.GLTFLoader(); //using glb (gltf binary), since it has texture data hardcoded
loader.load('./3D/untitled.glb', function(mesh) { //loading the same object twice, so we can aim the reticle looking like the final object
  mesh_object = mesh.scene; // the mesh can't have unassigned materials(in blender for example). It won't open correctly
});
loader.load('./3D/untitled.glb', function(mesh2) { //mesh_reticle is loaded separately, so the opacity can be set independent of the mesh_object
  mesh_reticle = mesh2.scene;
});

async function activateXR() {
  // Add a canvas element and initialize a WebGL context that is compatible with WebXR.
  const gameLoop_canvas = document.createElement("canvas");
  document.body.appendChild(gameLoop_canvas);
  const gl = gameLoop_canvas.getContext("webgl", {xrCompatible: true});

  // Create three.js scene
  const scene = new THREE.Scene();

  // Setting up a light source
  let light = new THREE.PointLight(0xFFFFFF, 2);
  light.position.set(-10, 15, 50);
  scene.add(light);
  
  let light2 = new THREE.PointLight(0xFFFFFF, 2);
  light.position.set(10, 15, 50);
  scene.add(light2);

  // Set up the WebGLRenderer, which handles rendering to the session's base layer.
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: false,
    antialias: true,
    canvas: gameLoop_canvas,
    context: gl
  });
  renderer.autoClear = false;

  // The API directly updates the camera matrices.
  // Disable matrix auto updates so three.js doesn't attempt
  // To handle the matrices independently.
  const camera = new THREE.PerspectiveCamera();
  camera.matrixAutoUpdate = false;

  // This section creates the UI
  // Create a div to store the UI
  const _dom_overlay = document.getElementById("domOverlay");
  _dom_overlay.style.display = "flex";
  _dom_overlay.style.flexDirection = "column";
  // Adding a exit button
  const exitButton = document.createElement("button");
  _dom_overlay.appendChild(exitButton);
  exitButton.classList.toggle("domOverlay__exitButton");
  exitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 0 24 24" width="48px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" opacity=".87"/><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z"/></svg>';
  exitButton.addEventListener('click', exitButtonClicked);
  // Adding an "place 3D model" button
  const addButton = document.createElement("button");
  _dom_overlay.appendChild(addButton);
  addButton.classList.toggle("domOverlay__addButton");
  addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="48px" viewBox="0 0 24 24" width="48px" fill="#FFFFFF"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z"/></g></g></svg>'
  // Adding a reset button
  const resetButton = document.createElement("div");
  resetButton.classList.toggle("domOverlay__resetButton");
  resetButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 0 24 24" width="48px" fill="#ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';
  _dom_overlay.appendChild(resetButton);
  resetButton.addEventListener('click', resetButtonClicked);
  // Adding a "rotate" slider
  const rotateInput = document.createElement("div");
  rotateInput.classList.toggle("domOverlay__rotateInput");
  rotateInput.innerHTML = '<div class="domOverlay__rotateInput__text"><div class="domOverlay__rotateInput__text__Rotation">Rotation:&nbsp;</div><div class="domOverlay__rotateInput__text__Value">0°</div></div>'
  rotateInput.innerHTML += '<input type="range" min="0" max="360" value="0" class="domOverlay__rotateInput__slider"></input>';
  _dom_overlay.appendChild(rotateInput);
  degrees = document.getElementsByClassName("domOverlay__rotateInput__slider")[0];
  // Adding a div to store instructions
  const instructionDiv = document.createElement("div");
  _dom_overlay.appendChild(instructionDiv);
  instructionDiv.classList.toggle("domOverlay__instructionDiv");
  instructionDiv.innerHTML = '<div class="domOverlay__instructionDiv__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg></div><div class="domOverlay__instructionDiv__text">Move your phone to help us understand your surroundings</div>'

  // Function to handle slider output values
  rotateInput.oninput = function() {
    degrees.value;
    document.getElementsByClassName("domOverlay__rotateInput__text__Value")[0].innerText = degrees.value + "°";
  }

  // Initialize a WebXR session using "immersive-ar".
  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ['hit-test'], //learn more about ['depth', 'light-estimation'] in the future, once this API is out of beta https://storage.googleapis.com/chromium-webxr-test/r914571/proposals/index.html
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: _dom_overlay },
  });
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl)
  });

  // A 'local' reference space has a native origin that is located
  // near the viewer's position at the time the session was created.
  const referenceSpace = await session.requestReferenceSpace('local');

  // Create another XRReferenceSpace that has the viewer as the origin.
  const viewerSpace = await session.requestReferenceSpace('viewer');
  // Perform hit testing using the viewer as origin.
  let hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  // Exit button functionality
  function exitButtonClicked() {
    session.end();
    document.body.removeChild(gameLoop_canvas); // All assets generated in the session are deleted
    _dom_overlay.removeChild(exitButton);
    _dom_overlay.removeChild(instructionDiv);
    _dom_overlay.removeChild(rotateInput);
    _dom_overlay.removeChild(resetButton);
    _dom_overlay.removeChild(addButton);
    _dom_overlay.style.display = "none";
  } // The following code deals with the issue of clicking the back button on mobile chrome... Unsolved.
  // if (performance.getEntriesByType("navigation")[0].type === "back_forward") {
  //   session.end();
  //   document.body.removeChild(gameLoop_canvas); // All assets generated in the session are deleted
  //   _dom_overlay.removeChild(exitButton);
  //   _dom_overlay.removeChild(instructionDiv);
  //   _dom_overlay.removeChild(rotateInput);
  //   _dom_overlay.removeChild(addButton);
  //   _dom_overlay.removeChild(resetButton);
  //   _dom_overlay.removeChild(addButton);
  //   _dom_overlay.style.display = "none";
  // }

  // Reset button functionality
  let models = [];
  function resetButtonClicked() {
    rotateInput.style.setProperty('display', 'flex'); // After the reset button is clicked, we show the add and rotate inputs and hide the reset button, since it's not needed any more
    addButton.style.setProperty('display', 'flex');
    resetButton.style.setProperty('display', 'none');
    for (let i = 0; i < models.length; i++) {
      scene.remove(models[i]); // we need to create a clean slate, a tabula rasa to say the least - for new models to be added. We delete every mesh that's present in our array, that's why we need to use a loop
    }
    models = [];
  }

  // Reticle helps the user with placing the 3D object in the scene
  console.log(mesh_reticle);
  for (let i = 0; i < mesh_reticle.children.length; i++) { // the mesh can have a lot of children elements, so we need to iterate over them
    mesh_reticle.children[i].material.transparent = true;
    mesh_reticle.children[i].material.opacity = 0.5;
  };
  let reticle = mesh_reticle;
  reticle.visible = false;
  scene.add(reticle);

  const MAX_MODELS_COUNT = 1; // Setting the max amount of models to 1

  addButton.addEventListener("click", (event) => {
    if (reticle.visible) {
      if (mesh_object) {
        clone = mesh_object.clone();
        clone.visible = true;
        clone.position.copy(reticle.position);
        scene.add(clone);
        models.push(clone);
        if (models.length > MAX_MODELS_COUNT) { // Reducing max amount of models for sustainable performance
          let oldClone = models[0];
          scene.remove(oldClone);
          models.shift(); // Deleting the oldest model first
        }
        resetButton.style.setProperty('display', 'flex'); // After the model is added, we make the necessary UI changes - hidind the rotate slider and add button once again
        addButton.style.setProperty('display', 'none');
        rotateInput.style.setProperty('display', 'none');
      }   
    }
    reticle.visible = false;
  });

  // Create a render loop that allows us to draw on the AR view.
  const onXRFrame = (time, frame) => {

    // Queue up the next draw request.
    session.requestAnimationFrame(onXRFrame);

    // Bind the graphics framebuffer to the baseLayer's framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)

    // Retrieve the pose of the device.
    // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      // In mobile AR, we only have one view.
      const view = pose.views[0];

      const viewport = session.renderState.baseLayer.getViewport(view);
      renderer.setSize(viewport.width, viewport.height)

      // When the pose of the device is retrieved, we can stop displaying the instruction div
      instructionDiv.style.opacity = "0%";

      // Use the view's transform matrix and projection matrix to configure the THREE.camera.
      camera.matrix.fromArray(view.transform.matrix)
      camera.projectionMatrix.fromArray(view.projectionMatrix);
      camera.updateMatrixWorld(true);

      // Rotation value is being checked on every frame
      animated_rotation = degrees.value * (Math.PI/180); // Since three.js accepts only radians, we need to convert the value from degrees to rad

      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0 && reticle !== null) {
        const hitPose = hitTestResults[0].getPose(referenceSpace);
        if (models.length >= 1) {
          reticle.visible = false;
        } else {
          reticle.visible = true;
          reticle.rotation.y = animated_rotation; // Applying rotation to the reticle. The same rotation will be applied to the models[i] in the next "if" statement
        }
        reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
        reticle.updateMatrixWorld(true);
      }

      if (clone !== null && models.length >= 1) {
        for (let i = 0; i < models.length; i++) {
          if (models[i] !== null) {
            models[i].rotation.y = animated_rotation;
            models[i].updateMatrixWorld(true);
          }
        }
      }

      // Render the scene with THREE.WebGLRenderer.
      renderer.render(scene, camera);
    }

  }
  session.requestAnimationFrame(onXRFrame);
}