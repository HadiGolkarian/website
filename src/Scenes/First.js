
import { Elastic, Power1 } from 'gsap/all';
import { TweenMax } from 'gsap/gsap-core';
import * as THREE from 'three';
import { OrbitControls } from '../js/three/OrbitControls';
import { mathRandom } from '../js/utils/number';

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


// const spotLightHelper = new THREE.SpotLightHelper(lightFront);



class CityEnvironment {

  constructor() {

    this.container = window;
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.camera = new THREE.PerspectiveCamera(20, this.container.innerWidth / this.container.innerHeight, 1, 200);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.city = new THREE.Object3D();
    this.snow = new THREE.Object3D();
    this.lines = new THREE.Object3D();
    this.buildings = new THREE.Object3D();

    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
    this.lightFront = new THREE.SpotLight(0xFFFFFF, 20, 10);
    this.lightBack = new THREE.PointLight(0xFFFFFF, 0.5);


    this.buildingsColorMaterial = new THREE.MeshStandardMaterial({
      color: projectVariables.buildingsColor,
      wireframe: false,
      shading: THREE.SmoothShading,
      side: THREE.DoubleSide
      //opacity:0.9,
      //transparent:true,
      //roughness: 0.3,
      //metalness: 1,
      //shading:THREE.FlatShading,
    });
    this.buildingsWireframeMaterial = new THREE.MeshLambertMaterial({
      color: projectVariables.buildingsWireframeColor,
      wireframe: true,
      transparent: true,
      opacity: projectVariables.buildingsWireframeOpacity,
      side: THREE.DoubleSide,
      // shading:THREE.FlatShading,
    });
    this.groundMaterial = new THREE.MeshPhongMaterial({
      color: projectVariables.groundColor,
      side: THREE.DoubleSide,
      roughness: 10,
      metalness: 0.6,
      opacity: 0.9,
      transparent: true
    });
    this.snowMaterial = new THREE.MeshToonMaterial({
      color: projectVariables.snowParticleColor,
      side: THREE.DoubleSide
    });
    this.lineMaterial = new THREE.MeshToonMaterial({ color: projectVariables.lineParticlesColor, side: THREE.DoubleSide });


    this.setupCamera();
    this.setupRenderer();
    this.setupScene();
    this.generateCity();
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setupCamera() {
    this.camera.position.set(0, 10, 20);
  }
  setupScene() {
    this.scene.background = new THREE.Color(projectVariables.fogColor);
    this.scene.fog = new THREE.Fog(projectVariables.fogColor, 10, 30);
    // this.scene.fog = new THREE.FogExp2(projectVariables.fogColor, 0.05);
    // this.scene.add(spotLightHelper);
    this.scene.add(this.ambientLight);
    this.scene.add(this.lightBack);
    this.scene.add(this.city);
  }
  setupRenderer() {
    this.renderer.setSize(this.container.innerWidth, this.container.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    if (this.container.innerWidth > 800) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.shadowMap.needsUpdate = true;
      // renderer.toneMapping = THREE.ReinhardToneMapping;
    };

    document.body.appendChild(this.renderer.domElement);

    this.renderer.setAnimationLoop(() => { this.render(); });
  }

  generateCity() {
    this.generateBuildings();
    this.generateSnowParticles();
    this.generateLineParticles();
    this.generateGround();
    // this.generateLights();
    // this.generateGrid();
  }
  generateBuildings() {
    for (let i = 1; i < 100; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1, buildingSegments, buildingSegments, buildingSegments);

      const buildingMesh = new THREE.Mesh(geometry, this.buildingsColorMaterial);
      const buildingFloorMesh = new THREE.Mesh(geometry, this.buildingsColorMaterial);

      const buildingWireMesh = new THREE.Mesh(geometry, this.buildingsWireframeMaterial);
      const buildingWireFloorMesh = new THREE.Mesh(geometry, this.buildingsWireframeMaterial);

      buildingMesh.add(buildingWireFloorMesh);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      buildingMesh.rotationValue = 0.1 + Math.abs(mathRandom());

      // cubeFloorMesh.scale.x = floor.scale.z = 1+mathRandom(0.33);
      buildingFloorMesh.scale.y = 0.05;//+mathRandom(0.5);
      buildingMesh.scale.y = 0.1 + Math.abs(mathRandom());

      TweenMax.to(buildingMesh.scale, projectVariables.buildingsGrowSpeed, { y: buildingMesh.rotationValue, repeat: -1, yoyo: true, delay: i * 0.005, ease: Power1.easeInOut });
      
      /* 
      buildingMesh.setScale = 0.1 + Math.abs(mathRandom());
      TweenMax.to(buildingMesh.scale, 4, { y: buildingMesh.setScale, ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
      TweenMax.to(buildingMesh.position, 4, { y: buildingMesh.setScale / 2, ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
      */

      const cubeWidth = 0.9;
      buildingMesh.scale.x = buildingMesh.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
      //buildingMesh.position.y = buildingMesh.scale.y / 2;
      buildingMesh.position.x = Math.round(mathRandom());
      buildingMesh.position.z = Math.round(mathRandom());

      buildingFloorMesh.position.set(buildingMesh.position.x, 0/*cubeFloorMesh.scale.y / 2*/, buildingMesh.position.z);

      this.city.add(buildingFloorMesh);
      this.city.add(buildingMesh);
    };
  };
  generateSnowParticles() {
    const snowGeometry = new THREE.CircleGeometry(0.01, 3);

    for (let h = 1; h < snowParticles; h++) {
      const snowPartices = new THREE.Mesh(snowGeometry, this.snowMaterial);
      snowPartices.position.set(mathRandom(snowParticlesSpread), mathRandom(snowParticlesSpread), mathRandom(snowParticlesSpread));
      snowPartices.rotation.set(mathRandom(), mathRandom(), mathRandom());
      this.snow.add(snowPartices);
    };

    this.snow.position.y = 2;
    this.city.add(this.snow);

  };
  generateLineParticles() {
    const cScale = 0.1;
    const cPos = 20;
    for (let i = 0; i < 60; i++) {
      const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
      const cElem = new THREE.Mesh(cGeo, this.lineMaterial);
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
      this.lines.add(cElem);
    };

    this.city.add(this.lines);
  };
  generateGround() {
    const groundGeometry = new THREE.PlaneGeometry(60, 60);
    const groundMesh = new THREE.Mesh(groundGeometry, this.groundMaterial);

    groundMesh.rotation.x = -90 * Math.PI / 180;
    groundMesh.position.y = -0.001;
    groundMesh.receiveShadow = true;
    // groundMesh.material.emissive.setHex(0xFFFFFF + Math.random() * 100000);

    this.city.add(groundMesh);
  }

  render() {
    // this.scene.background = new THREE.Color(projectVariables.fogColor);
    // // scene.fog = new THREE.Fog(projectVariables.fogColor, 10, 30);

    // this.buildingsColorMaterial.color = new THREE.Color(projectVariables.buildingsColor);
    // this.buildingsWireframeMaterial.color = new THREE.Color(projectVariables.buildingsWireframeColor);
    // this.buildingsWireframeMaterial.opacity = projectVariables.buildingsWireframeOpacity;

    // this.snowMaterial.color = new THREE.Color(projectVariables.snowParticleColor);
    // this.groundMaterial.color = new THREE.Color(projectVariables.groundColor);
    // this.lineMaterial.color = new THREE.Color(projectVariables.lineParticlesColor);

    // snow.rotation.y += 0.01;
    // snow.rotation.x += 0.01;

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = this.container.innerWidth / this.container.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.innerWidth, this.container.innerHeight);
  }
}

export default CityEnvironment;