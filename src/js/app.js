if (module.hot) {
  module.hot.accept();
}

import * as THREE from 'three';
import { TweenMax } from 'gsap/gsap-core';
import { Elastic, Power1 } from 'gsap/all';
import * as dat from 'dat.gui';
import { OrbitControls } from './OrbitControls';

// const control = new function () {
//   this.setcolor = 0xF02050;
//   // this.scale = 1;
// };


const projectColorParams = {
  fog: "#FF6F48",
  buildings: "#020205",
  buildingsLineColor: "#8382AB",
  buildingsLineOpacity: 0.02,
  snowParticleColor: '#FFFFFF',
  groundColor: '#020205',
  lineParticlesColor: '#FFFFFF',
  buildingsGrowSpeed: 15,
  uSpeed: 0.001
};


// Three JS Template
//----------------------------------------------------------------- BASIC parameters
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

if (window.innerWidth > 800) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.needsUpdate = true;
  //renderer.toneMapping = THREE.ReinhardToneMapping;
  //console.log(window.innerWidth);
};
//---

document.body.appendChild(renderer.domElement);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);

camera.position.set(0, 2, 14);

const scene = new THREE.Scene();
const city = new THREE.Object3D();
const smoke = new THREE.Object3D();
const town = new THREE.Object3D();

const controls = new OrbitControls(camera, renderer.domElement);

let createCarPos = true;

//----------------------------------------------------------------- FOG background

// let setcolor = 0xF02050;
//var setcolor = 0xF2F111;
//var setcolor = 0xFF6347;

scene.background = new THREE.Color(projectColorParams.fog);
scene.fog = new THREE.Fog(projectColorParams.fog, 10, 16);
//scene.fog = new THREE.FogExp2(setcolor, 0.05);
//----------------------------------------------------------------- RANDOM Function
function mathRandom(num = 8) {
  var numValue = - Math.random() * num + Math.random() * num;
  return numValue;
};
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

//----------------------------------------------------------------- CREATE City
const buildingsMaterial = new THREE.MeshStandardMaterial({
  color: projectColorParams.buildings,
  wireframe: false,
  //opacity:0.9,
  //transparent:true,
  //roughness: 0.3,
  //metalness: 1,
  shading: THREE.SmoothShading,
  //shading:THREE.FlatShading,
  side: THREE.DoubleSide
});
const buildingsLineMaterial = new THREE.MeshLambertMaterial({
  color: projectColorParams.buildingsLineColor,
  wireframe: true,
  transparent: true,
  opacity: projectColorParams.buildingsLineOpacity,
  side: THREE.DoubleSide/*,
  shading:THREE.FlatShading*/});
const gmaterial = new THREE.MeshToonMaterial({ color: projectColorParams.snowParticleColor, side: THREE.DoubleSide });
const pmaterial = new THREE.MeshPhongMaterial({
  color: projectColorParams.groundColor,
  side: THREE.DoubleSide,
  roughness: 10,
  metalness: 0.6,
  opacity: 0.9,
  transparent: true
});

function init() {
  let segments = 2;
  for (let i = 1; i < 100; i++) {
    const geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);

    const cube = new THREE.Mesh(geometry, buildingsMaterial);
    const wire = new THREE.Mesh(geometry, buildingsLineMaterial);
    const floor = new THREE.Mesh(geometry, buildingsMaterial);
    const wfloor = new THREE.Mesh(geometry, buildingsLineMaterial);

    cube.add(wfloor);
    cube.castShadow = true;
    cube.receiveShadow = true;
    cube.rotationValue = 0.1 + Math.abs(mathRandom(8));

    //floor.scale.x = floor.scale.z = 1+mathRandom(0.33);
    floor.scale.y = 0.05;//+mathRandom(0.5);
    cube.scale.y = 0.1 + Math.abs(mathRandom(8));
    TweenMax.to(cube.scale, projectColorParams.buildingsGrowSpeed, { y: cube.rotationValue, repeat: -1, yoyo: true, delay: i * 0.005, ease: Power1.easeInOut });
    /*  cube.setScale = 0.1+Math.abs(mathRandom());
     
     TweenMax.to(cube.scale, 4, {y:cube.setScale, ease:Elastic.easeInOut, delay:0.2*i, yoyo:true, repeat:-1});
     TweenMax.to(cube.position, 4, {y:cube.setScale / 2, ease:Elastic.easeInOut, delay:0.2*i, yoyo:true, repeat:-1}); */

    const cubeWidth = 0.9;
    cube.scale.x = cube.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
    //cube.position.y = cube.scale.y / 2;
    cube.position.x = Math.round(mathRandom());
    cube.position.z = Math.round(mathRandom());

    floor.position.set(cube.position.x, 0/*floor.scale.y / 2*/, cube.position.z);

    town.add(floor);
    town.add(cube);
  };
  //----------------------------------------------------------------- Particular

  const gparticular = new THREE.CircleGeometry(0.01, 3);
  const aparticular = 5;

  for (let h = 1; h < 300; h++) {
    const particular = new THREE.Mesh(gparticular, gmaterial);
    particular.position.set(mathRandom(aparticular), mathRandom(aparticular), mathRandom(aparticular));
    particular.rotation.set(mathRandom(), mathRandom(), mathRandom());
    smoke.add(particular);
  };

  const pgeometry = new THREE.PlaneGeometry(60, 60);
  const pelement = new THREE.Mesh(pgeometry, pmaterial);
  pelement.rotation.x = -90 * Math.PI / 180;
  pelement.position.y = -0.001;
  pelement.receiveShadow = true;
  //pelement.material.emissive.setHex(0xFFFFFF + Math.random() * 100000);

  city.add(pelement);
  addVariableControls();
};

function addVariableControls() {
  var gui = new dat.GUI();
  gui.addColor(projectColorParams, 'fog');
  gui.addColor(projectColorParams, 'buildings');
  gui.addColor(projectColorParams, 'buildingsLineColor');
  gui.add(projectColorParams, 'buildingsLineOpacity', 0, 1, 0.01);

  gui.addColor(projectColorParams, 'snowParticleColor');
  gui.addColor(projectColorParams, 'groundColor');
  gui.addColor(projectColorParams, 'lineParticlesColor');
}

//----------------------------------------------------------------- MOUSE function
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let INTERSECTED;
let intersected;

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
function onDocumentTouchStart(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouse.x = event.touches[0].pageX - window.innerWidth / 2;
    mouse.y = event.touches[0].pageY - window.innerHeight / 2;
  };
};
function onDocumentTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
    mouse.x = event.touches[0].pageX - window.innerWidth / 2;
    mouse.y = event.touches[0].pageY - window.innerHeight / 2;
  }
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false);
window.addEventListener('touchmove', onDocumentTouchMove, false);

//----------------------------------------------------------------- Lights
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
const lightFront = new THREE.SpotLight(0xFFFFFF, 20, 10);
const lightBack = new THREE.PointLight(0xFFFFFF, 0.5);

const spotLightHelper = new THREE.SpotLightHelper(lightFront);
//scene.add( spotLightHelper );

lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(5, 5, 5);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;
lightBack.position.set(0, 6, 0);

smoke.position.y = 2;

scene.add(ambientLight);
city.add(lightFront);
scene.add(lightBack);
scene.add(city);
city.add(smoke);
city.add(town);

//----------------------------------------------------------------- GRID Helper
const gridHelper = new THREE.GridHelper(60, 120, 0xFF0000, 0x000000);
city.add(gridHelper);

//----------------------------------------------------------------- CAR world
const generateCar = function () {

};
//----------------------------------------------------------------- LINES world

const cMat = new THREE.MeshToonMaterial({ color: projectColorParams.lineParticlesColor, side: THREE.DoubleSide });

const createCars = function (cScale = 2, cPos = 20) {
  const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
  const cElem = new THREE.Mesh(cGeo, cMat);
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

  smoke.rotation.y += 0.01;
  smoke.rotation.x += 0.01;

  scene.background = new THREE.Color(projectColorParams.fog);
  scene.fog = new THREE.Fog(projectColorParams.fog, 10, 30);
  buildingsMaterial.color = new THREE.Color(projectColorParams.buildings);
  buildingsLineMaterial.color = new THREE.Color(projectColorParams.buildingsLineColor);
  buildingsLineMaterial.opacity = projectColorParams.buildingsLineOpacity;
  gmaterial.color = new THREE.Color(projectColorParams.snowParticleColor);
  pmaterial.color = new THREE.Color(projectColorParams.groundColor);
  cMat.color = new THREE.Color(projectColorParams.lineParticlesColor);

  camera.lookAt(city.position);
  renderer.render(scene, camera);
};

//----------------------------------------------------------------- START functions
generateLines();
init();
animate();