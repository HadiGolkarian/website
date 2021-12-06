import { init, animate } from './Scenes/first';
import initSecondScene from './Scenes/second';
import SceneTransition from './three/SceneTransition';
import * as THREE from 'three';


const scene1 = init();
animate();
let scene2;
initSecondScene().then((value) => scene2 = value);


const clock = new THREE.Clock();


setTimeout(() => {
  const transition = new SceneTransition(scene1,scene2);

  transition.render(clock.getDelta());

}, 2000);


