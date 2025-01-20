//import { loadGLTF, loadAudio } from "../../libs/loader.js";
import { loadGLTF, loadAudio } from "https://cdn.jsdelivr.net/gh/Chronos000324/artest2/libs/loader.js";

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
  const scaleFactor = 1 / maxSize; // Adjust this factor based on desired scale
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
      '../assets/sounds/en1.mp3',
      '../assets/sounds/en2.mp3',
      '../assets/sounds/en3.mp3',
      '../assets/sounds/en4.mp3',
      '../assets/sounds/en5.mp3',
      '../assets/sounds/en6.mp3',
      '../assets/sounds/en7.mp3',
      '../assets/sounds/en8.mp3',
      '../assets/sounds/en9.mp3',
      '../assets/sounds/en10.mp3',
      '../assets/sounds/en11.mp3',
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
      addModelAndAudioToAnchor(mindarThree, model, audio, i);
      mixers.push(model.mixer); // Push each mixer to the array
    }

    await mindarThree.start(); // Start MindAR tracking
    console.log("MindAR started.");

    startRenderingLoop(renderer, scene, camera, mixers); // Start the rendering loop
  };

  start();
});
