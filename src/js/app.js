if (module.hot) {
  module.hot.accept();
}

import * as dat from 'dat.gui';
import { Power1 } from 'gsap/all';
import { TweenMax } from 'gsap/gsap-core';
import * as THREE from 'three';
import { OrbitControls } from './OrbitControls';
import { mathRandom } from './utils/number';

// CONSTANTS ---------------------------------------------------------------------------------
const projectVariables = {
  fogColor: "#FF6F48",
  buildingsColor: "#020205",
  buildingsWireframeColor: "#8382AB",
  buildingsWireframeOpacity: 0.02,
  snowParticleColor: '#FFFFFF',
  lineParticlesColor: '#FFFFFF',
  groundColor: '#020205',
  buildingsGrowSpeed: 15,
  uSpeed: 0.001
};
const buildingSegments = 2;
const snowParticles = 300;
const snowParticlesSpread = 5;
let createCarPos = true;
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let INTERSECTED;
let intersected;

// BASE OBJECTS ------------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
const controls = new OrbitControls(camera, renderer.domElement);

// OBJECTS -----------------------------------------------------------------------------------
const scene = new THREE.Scene();
const city = new THREE.Object3D();
const snow = new THREE.Object3D();
const lines = new THREE.Object3D();
const town = new THREE.Object3D();

const gridHelper = new THREE.GridHelper(60, 120, 0x000000, 0x000000);

// LIGHTS  -----------------------------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
const lightFront = new THREE.SpotLight(0xFFFFFF, 20, 10);
const lightBack = new THREE.PointLight(0xFFFFFF, 0.5);
const spotLightHelper = new THREE.SpotLightHelper(lightFront);

// MATERIAL AND MESHES  ----------------------------------------------------------------------
// buildings  --------------------------------------------------------------------------------
const buildingsColorMaterial = new THREE.MeshStandardMaterial({
  color: projectVariables.buildingsColor,
  wireframe: false,
  //opacity:0.9,
  //transparent:true,
  //roughness: 0.3,
  //metalness: 1,
  shading: THREE.SmoothShading,
  //shading:THREE.FlatShading,
  side: THREE.DoubleSide
});
const buildingsWireframeMaterial = new THREE.MeshLambertMaterial({
  color: projectVariables.buildingsWireframeColor,
  wireframe: true,
  transparent: true,
  opacity: projectVariables.buildingsWireframeOpacity,
  // shading:THREE.FlatShading,
  side: THREE.DoubleSide
});
// ground ------------------------------------------------------------------------------------
const groundMaterial = new THREE.MeshPhongMaterial({
  color: projectVariables.groundColor,
  side: THREE.DoubleSide,
  roughness: 10,
  metalness: 0.6,
  opacity: 0.9,
  transparent: true
});
const groundGeometry = new THREE.PlaneGeometry(60, 60);
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
// snow --------------------------------------------------------------------------------------
const snowMaterial = new THREE.MeshToonMaterial({
  color: projectVariables.snowParticleColor,
  side: THREE.DoubleSide
});
const snowGeometry = new THREE.CircleGeometry(0.01, 3);
// lines -------------------------------------------------------------------------------------
const lineMaterial = new THREE.MeshToonMaterial({ color: projectVariables.lineParticlesColor, side: THREE.DoubleSide });


// GENERATE OBJECTS --------------------------------------------------------------------------
const generateTown = () => {
  for (let i = 1; i < 100; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1, buildingSegments, buildingSegments, buildingSegments);

    const cubeMesh = new THREE.Mesh(geometry, buildingsColorMaterial);
    const cubeFloorMesh = new THREE.Mesh(geometry, buildingsColorMaterial);

    const wireMesh = new THREE.Mesh(geometry, buildingsWireframeMaterial);
    const wireFloorMesh = new THREE.Mesh(geometry, buildingsWireframeMaterial);

    cubeMesh.add(wireFloorMesh);
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    cubeMesh.rotationValue = 0.1 + Math.abs(mathRandom(8));

    // cubeFloorMesh.scale.x = floor.scale.z = 1+mathRandom(0.33);
    cubeFloorMesh.scale.y = 0.05;//+mathRandom(0.5);
    cubeMesh.scale.y = 0.1 + Math.abs(mathRandom(8));
    TweenMax.to(cubeMesh.scale, projectVariables.buildingsGrowSpeed, { y: cubeMesh.rotationValue, repeat: -1, yoyo: true, delay: i * 0.005, ease: Power1.easeInOut });
    /*  cubeMesh.setScale = 0.1+Math.abs(mathRandom());
     
     TweenMax.to(cubeMesh.scale, 4, {y:cubeMesh.setScale, ease:Elastic.easeInOut, delay:0.2*i, yoyo:true, repeat:-1});
     TweenMax.to(cubeMesh.position, 4, {y:cubeMesh.setScale / 2, ease:Elastic.easeInOut, delay:0.2*i, yoyo:true, repeat:-1}); */

    const cubeWidth = 0.9;
    cubeMesh.scale.x = cubeMesh.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
    //cubeMesh.position.y = cubeMesh.scale.y / 2;
    cubeMesh.position.x = Math.round(mathRandom());
    cubeMesh.position.z = Math.round(mathRandom());

    cubeFloorMesh.position.set(cubeMesh.position.x, 0/*cubeFloorMesh.scale.y / 2*/, cubeMesh.position.z);

    town.add(cubeFloorMesh);
    town.add(cubeMesh);
  };
};
const generateSnowParticles = () => {
  for (let h = 1; h < snowParticles; h++) {
    const snowPartices = new THREE.Mesh(snowGeometry, snowMaterial);
    snowPartices.position.set(mathRandom(snowParticlesSpread), mathRandom(snowParticlesSpread), mathRandom(snowParticlesSpread));
    snowPartices.rotation.set(mathRandom(), mathRandom(), mathRandom());
    snow.add(snowPartices);
  };

  snow.position.y = 2;
};

// SETUPS ------------------------------------------------------------------------------------
const setUpRenderer = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerWidth > 800) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
    // renderer.toneMapping = THREE.ReinhardToneMapping;
  };

  document.body.appendChild(renderer.domElement);
};
const setUpScene = () => {
  scene.background = new THREE.Color(projectVariables.fogColor);
  scene.fog = new THREE.Fog(projectVariables.fogColor, 10, 16);
  // scene.fog = new THREE.FogExp2(projectVariables.fogColor, 0.05);
  // scene.add(spotLightHelper);
  scene.add(ambientLight);
  scene.add(lightBack);
  scene.add(city);
};
const setUpCity = () => {
  generateTown();
  generateSnowParticles();

  city.add(groundMesh);
  city.add(lightFront);
  city.add(snow);
  city.add(town);
  city.add(gridHelper);
};
const setUpCamera = () => {
  camera.position.set(0, 5, 20);
};
const setUpGround = () => {
  groundMesh.rotation.x = -90 * Math.PI / 180;
  groundMesh.position.y = -0.001;
  groundMesh.receiveShadow = true;
  // groundMesh.material.emissive.setHex(0xFFFFFF + Math.random() * 100000);
};
const setUpLights = () => {
  lightFront.rotation.x = 45 * Math.PI / 180;
  lightFront.rotation.z = -45 * Math.PI / 180;
  lightFront.position.set(5, 5, 5);
  lightFront.castShadow = true;
  lightFront.shadow.mapSize.width = 6000;
  lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
  lightFront.penumbra = 0.1;
  lightBack.position.set(0, 6, 0);
};
const setupVariableControls = () => {
  var gui = new dat.GUI();

  gui.addColor(projectVariables, 'fogColor');

  gui.addColor(projectVariables, 'buildingsColor');

  gui.addColor(projectVariables, 'buildingsWireframeColor');
  gui.add(projectVariables, 'buildingsWireframeOpacity', 0, 1, 0.01);

  gui.addColor(projectVariables, 'snowParticleColor');
  gui.addColor(projectVariables, 'lineParticlesColor');

  gui.addColor(projectVariables, 'groundColor');
};

// EVENT HANDLERS ----------------------------------------------------------------------------
const onMouseMove = (event) => {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
const onDocumentTouchStart = (event) => {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouse.x = event.touches[0].pageX - window.innerWidth / 2;
    mouse.y = event.touches[0].pageY - window.innerHeight / 2;
  };
};
const onDocumentTouchMove = (event) => {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouse.x = event.touches[0].pageX - window.innerWidth / 2;
    mouse.y = event.touches[0].pageY - window.innerHeight / 2;
  }
};
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};


setUpRenderer();
setUpLights();
setUpCamera();
setUpGround();
setUpCity();
setUpScene();
setupVariableControls();

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false);
window.addEventListener('touchmove', onDocumentTouchMove, false);
window.addEventListener('resize', onWindowResize, false);






//----------------------------------------------------------------- CHANGE bluilding colors
// let setTintNum = true;
// function setTintColor() {
//   let setColor;
//   if (setTintNum) {
//     setTintNum = false;
//     setColor = 0x000000;
//   } else {
//     setTintNum = true;
//     setColor = 0x000000;
//   };
//   setColor = projectColorParams.buildings;
//   return setColor;
// };










const generateCar = function () {

};


const createCars = function (cScale = 2, cPos = 20) {
  const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
  const cElem = new THREE.Mesh(cGeo, lineMaterial);
  const cAmp = 3;

  if (createCarPos) {
    createCarPos = false;
    cElem.position.x = -cPos;
    cElem.position.z = (mathRandom(cAmp));

    TweenMax.to(cElem.position, 3, { x: cPos, repeat: -1, yoyo: true, delay: mathRandom(3) });
  } else {
    createCarPos = true;
    cElem.position.x = (mathRandom(cAmp));
    cElem.position.z = -cPos;
    cElem.rotation.y = 90 * Math.PI / 180;

    TweenMax.to(cElem.position, 5, { z: cPos, repeat: -1, yoyo: true, delay: mathRandom(3), ease: Power1.easeInOut });
  };
  cElem.receiveShadow = true;
  cElem.castShadow = true;
  cElem.position.y = Math.abs(mathRandom(5));
  city.add(cElem);
};

const generateLines = function () {
  for (let i = 0; i < 60; i++) {
    createCars(0.1, 20);
  };
};

//----------------------------------------------------------------- CAMERA position

const cameraSet = function () {
  createCars(0.1, 20, 0xFFFFFF);
  //TweenMax.to(camera.position, 1, {y:1+Math.random()*4, ease:Expo.easeInOut})
};

//----------------------------------------------------------------- ANIMATE

const animate = function () {
  const time = Date.now() * 0.00005;
  requestAnimationFrame(animate);

  // city.rotation.y -= ((mouse.x * 8) - camera.rotation.y) * projectColorParams.uSpeed;
  // city.rotation.x -= (-(mouse.y * 2) - camera.rotation.x) * projectColorParams.uSpeed;
  // if (city.rotation.x < -0.05) city.rotation.x = -0.05;
  // else if (city.rotation.x > 1) city.rotation.x = 1;
  const cityRotation = Math.sin(Date.now() / 5000) * 13;
  //city.rotation.x = cityRotation * Math.PI / 180;

  //console.log(city.rotation.x);
  //camera.position.y -= (-(mouse.y * 20) - camera.rotation.y) * projectColorParams.uSpeed;;

  for (let i = 0, l = town.children.length; i < l; i++) {
    const object = town.children[i];
    //object.scale.y = Math.sin(time*50) * object.rotationValue;
    //object.rotation.y = (Math.sin((time/object.rotationValue) * Math.PI / 180) * 180);
    //object.rotation.z = (Math.cos((time/object.rotationValue) * Math.PI / 180) * 180);
  }



  scene.background = new THREE.Color(projectVariables.fogColor);
  // scene.fog = new THREE.Fog(projectVariables.fogColor, 10, 30);

  buildingsColorMaterial.color = new THREE.Color(projectVariables.buildingsColor);
  buildingsWireframeMaterial.color = new THREE.Color(projectVariables.buildingsWireframeColor);
  buildingsWireframeMaterial.opacity = projectVariables.buildingsWireframeOpacity;

  snowMaterial.color = new THREE.Color(projectVariables.snowParticleColor);
  groundMaterial.color = new THREE.Color(projectVariables.groundColor);
  lineMaterial.color = new THREE.Color(projectVariables.lineParticlesColor);

  snow.rotation.y += 0.01;
  snow.rotation.x += 0.01;

  controls.update();

  camera.lookAt(city.position);
  renderer.render(scene, camera);
};

//----------------------------------------------------------------- START functions
generateLines();
animate();