import { loadGLTF, loadAudio } from "../../libs/loader.js";
const THREE = window.MINDAR.IMAGE.THREE;

const initializeMindAR = () => {
  return new window.MINDAR.IMAGE.MindARThree({
    container: document.body,
    imageTargetSrc: '../assets/targets/arp.mind',
  });
};

const addLighting = (scene) => {
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);
};

const loadAndConfigureModel = async (modelPath) => {
  try {
    const gltf = await loadGLTF(modelPath);
    // Call autoResizeModel function to adjust the scale based on model size
    autoResizeModel(gltf);  // Auto resize model after loading
    gltf.scene.position.set(0, -0.4, 0); // Set initial position
    return gltf;
  } catch (error) {
    console.error("Error loading model:", error);
  }
};

const loadAndConfigureAudio = async (camera, audioPath) => {
  try {
    const audioClip = await loadAudio(audioPath);
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const audio = new THREE.PositionalAudio(listener);
    audio.setBuffer(audioClip);
    audio.setRefDistance(1000);
    audio.setLoop(true);

    return audio;
  } catch (error) {
    console.error("Error loading audio:", error);
  }
};

const autoResizeModel = (model) => {
  const bbox = new THREE.Box3().setFromObject(model.scene);
  const size = bbox.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  const scaleFactor = 2 / maxSize; // Adjust this factor based on desired scale
  model.scene.scale.set(scaleFactor, scaleFactor, scaleFactor); // Automatically scale the model
};

const startAnimation = (gltf) => {
  const mixer = new THREE.AnimationMixer(gltf.scene);
  if (gltf.animations && gltf.animations.length > 0) {
    const action = mixer.clipAction(gltf.animations[0]);
    action.play(); // Start the animation
  } else {
    console.error("No animations found in the model.");
  }
  return mixer;
};

const addModelAndAudioToAnchor = (mindarThree, model, audio, anchorIndex) => {
  const anchor = mindarThree.addAnchor(anchorIndex);
  anchor.group.add(model.scene);
  anchor.group.add(audio);

  anchor.onTargetFound = () => {
    console.log(`Anchor ${anchorIndex} found: Playing animation and audio.`);
    audio.play();
    model.mixer.update(0); // Update the animation for this anchor
  };

  anchor.onTargetLost = () => {
    console.log(`Anchor ${anchorIndex} lost: Pausing animation and audio.`);
    audio.pause();
  };
};

const startRenderingLoop = (renderer, scene, camera, mixers) => {
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    mixers.forEach((mixer) => mixer.update(delta)); // Update all mixers
    renderer.render(scene, camera); // Render the scene
  });
};
//addzoom
const addZoomInteractionToPage5 = (model) => {
  let zoomedIn = false; // Track whether the model is zoomed in

  const toggleZoom = () => {
    if (!zoomedIn) {
      model.scene.scale.multiplyScalar(1.5); // Zoom in by increasing scale
      zoomedIn = true;
    } else {
      model.scene.scale.multiplyScalar(1 / 1.5); // Zoom out by resetting scale
      zoomedIn = false;
    }
  };

  // Add event listeners for click/tap interactions
  document.body.addEventListener('click', toggleZoom);
  document.body.addEventListener('touchstart', toggleZoom);
};
// Add interaction for page 4 model to rotate on click or tap
const addInteractionToPage4 = (model) => {
  let rotating = false; // Track if the model is currently rotating

  const rotateModel = () => {
    if (!rotating) return; // Exit if not rotating
    const rotationSpeed = 0.01; // Adjust rotation speed
    model.scene.rotation.y += rotationSpeed; // Rotate the model

    // Stop rotation after completing 360 degrees
    if (model.scene.rotation.y >= 2 * Math.PI) {
      model.scene.rotation.y = 0; // Reset to 0
      rotating = false; // Stop rotation
    } else {
      requestAnimationFrame(rotateModel); // Continue rotating
    }
  };

  const startRotation = () => {
    if (!rotating) {
      rotating = true;
      rotateModel(); // Start the rotation animation
    }
  };


  // Add event listeners for click/tap interactions
  document.body.addEventListener('click', startRotation);
  document.body.addEventListener('touchstart', startRotation);
};

document.addEventListener('DOMContentLoaded', () => {
  const start = async () => {
    const mindarThree = initializeMindAR();
    const { renderer, scene, camera } = mindarThree;

    addLighting(scene);

    // Load the 11 models and their respective audio files
    const models = [];
    const audios = [];
    const mixers = [];

    // Model paths (the same for both languages)
    const modelPaths = [
      '../assets/models/page1.glb',
      '../assets/models/page2.glb',
      '../assets/models/page3.glb',
      '../assets/models/page4.glb',
      '../assets/models/page5.glb',
      '../assets/models/page6.glb',
      '../assets/models/page7.glb',
      '../assets/models/page8.glb',
      '../assets/models/page9.glb',
      '../assets/models/page10.glb',
      '../assets/models/page11.glb',
    ];

    // English audio paths (adjust for your English audio files)
    const audioPaths = [
      '../assets/sounds/ib1.MP3',
      '../assets/sounds/ib2.MP3',
      '../assets/sounds/ib3.MP3',
      '../assets/sounds/ib4.MP3',
      '../assets/sounds/ib5.MP3',
      '../assets/sounds/ib6.MP3',
      '../assets/sounds/ib7.MP3',
      '../assets/sounds/ib8.MP3',
      '../assets/sounds/ib9.MP3',
      '../assets/sounds/ib10.MP3',
      '../assets/sounds/ib11.MP3',
    ];

    // Loop through and load each model and audio
    for (let i = 0; i < 11; i++) {
      const model = await loadAndConfigureModel(modelPaths[i]);
      const audio = await loadAndConfigureAudio(camera, audioPaths[i]);

      if (!model || !audio) {
        console.error(`Failed to load model ${i + 1} or audio ${i + 1}. Exiting.`);
        return;
      }

      model.mixer = startAnimation(model); // Start animation for each model
      models.push(model);
      audios.push(audio);

      // Add model and audio to each anchor
        if (i === 4) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 5);
        addInteractionToPage4(model); // Add interaction to page 4 model
      } else if (i === 3) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 4);
        addZoomInteractionToPage5(model); // Add zoom interaction to page 5 model
      } else if (i === 5) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 6);
      } else if (i === 6) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 7);
      } else if (i === 7) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 9);
      } else if (i === 8) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 8);
      } else if (i === 9) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 10);
      } else if (i === 10) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 11);
      } else if (i === 11) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 12);
      } else if (i === 2) {
        addModelAndAudioToAnchor(mindarThree, model, audio, 3);
      } else {
        addModelAndAudioToAnchor(mindarThree, model, audio, i);
      }

      mixers.push(model.mixer); // Push each mixer to the array
    }

    await mindarThree.start(); // Start MindAR tracking
    console.log("MindAR started.");

    startRenderingLoop(renderer, scene, camera, mixers); // Start the rendering loop
  };

  start();
});
