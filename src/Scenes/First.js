
import { Elastic, Power1 } from 'gsap/all';
import { TweenMax } from 'gsap/gsap-core';
import * as THREE from 'three';
import { OrbitControls } from '../js/three/OrbitControls';
import { mathRandom } from '../utils/number';
import buildingsSpec from '../utils/generateBuildings';
import { Power4 } from 'gsap/gsap-core';
console.log(THREE);

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

class CityEnvironment {
  copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
      return window.clipboardData.setData("Text", text);

    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
      }
      catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        return false;
      }
      finally {
        document.body.removeChild(textarea);
      }
    }
  }
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
    // this.spotLightHelper = new THREE.SpotLightHelper(this.lightFront);
    this.cameraPointLight = new THREE.PointLight(0xffffff, 8, 15);

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

    console.log(this, TweenMax);
  }

  bindEvents() {
    this.container.addEventListener('resize', this.onWindowResize.bind(this));
    this.controls.addEventListener('change', this.onControlsChange.bind(this));
    document.getElementById('exploreBtn').addEventListener('click', this.startCameraTour.bind(this));
    document.getElementById('logBtn').addEventListener('click', this.logCamera.bind(this));
    document.getElementById('disableFog').addEventListener('click', () => {
      this.scene.fog.near = this.scene.fog.near == 0.1 ? 12 : 0.1;
      this.scene.fog.far = this.scene.fog.far == 0 ? 16 : 0;
    });
  }
  logCamera() {
    document.getElementById('cameraSpec').innerHTML = `location: {x: ${this.camera.position.x}, y: ${this.camera.position.y}, z: ${this.camera.position.z}}`;
    document.getElementById('cameraSpec').innerHTML += `<br></br>`;
    document.getElementById('cameraSpec').innerHTML += `looking at: {x: ${this.controls.target.x}, y: ${this.controls.target.y}, z: ${this.controls.target.z}}`;

    const data = {
      cameraLocation: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      cameraTarget: {
        x: this.controls.target.x,
        y: this.controls.target.y,
        z: this.controls.target.z,
      },

    };
    this.copyToClipboard(JSON.stringify(data));
  }
  setupCamera() {
    this.camera.position.set(-22, 25, 20);
  }
  startCameraTour() {
    document.getElementById('exploreBox').style.display = "none";
    document.getElementById('logBox').style.display = "flex";

    const angels = [
      { x: -4.727919694453478, y: 9.610596400995368, z: -4.902635459459849 },
      { x: -9.387513949808628, y: 4.361033650928754, z: -3.016824226668273 },
      { x: 4.892292649386681, y: 1.0158754255090539, z: -13.37444157625071 },
      { x: 5.041919011118039, y: 4.625301222630572, z: -13.364091819438183 },
      { x: 16.909804496215823, y: 3.684319169448478, z: 12.101808557392527 }
    ];
    const targets = [
      { x: -0.026530800744345752, y: 0.19071215594007832, z: 0.3133981088417902 },
      { x: 4.14079208500648, y: -0.22234476570269976, z: 0.44038109069180714 },
      { x: 2.1377918912910956, y: 0.12282329636523791, z: 1.250521281444583 },
      { x: 3.141701826927174, y: -0.4143356276611831, z: 1.2606705852077156 },
      { x: 2.570531488236015, y: 0.8916933410752306, z: 1.098608468993924 }

    ];

    TweenMax.to(this.camera.position, 1,
      {
        ...angels[0],
        yoyo: true,
        delay: 0.05,
        ease: Power4.easeInOut
      });
    // this.controls.target = new THREE.Vector3(targets[i].x, targets[i].y, targets[i].z);
    TweenMax.to(this.controls.target, 1,
      {
        ...targets[0],
        yoyo: true,
        delay: 0.05,
        ease: Power4.easeInOut
      });

    // let i = 1;
    // setInterval(() => {
    //   TweenMax.to(this.camera.position, 1,
    //     {
    //       ...angels[i],
    //       yoyo: true,
    //       delay: 0.05,
    //       ease: Power4.easeInOut
    //     });
    //   // this.controls.target = new THREE.Vector3(targets[i].x, targets[i].y, targets[i].z);
    //   TweenMax.to(this.controls.target, 1,
    //     {
    //       ...targets[i],
    //       yoyo: true,
    //       delay: 0.05,
    //       ease: Power4.easeInOut
    //     });
    //   // this.camera.lookAt(new THREE.Vector3(targets[i].x , targets[i].y ,targets[i].z));
    //   i++;
    //   if (i === 5) { i = 0; }
    // }, 2000);
  }

  setupScene() {
    this.scene.background = new THREE.Color(projectVariables.fogColor);
    this.scene.fog = new THREE.Fog(projectVariables.fogColor, 12, 16);
    // this.scene.fog = new THREE.FogExp2(projectVariables.fogColor, 0.05);
    // this.scene.add(this.spotLightHelper);
    this.scene.add(this.ambientLight);
    this.scene.add(this.lightBack);
    this.scene.add(this.cameraPointLight);
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
    for (const buildingSpec of buildingsSpec) {
      const geometry = new THREE.BoxGeometry(1, 1, 1, buildingSegments, buildingSegments, buildingSegments);

      const buildingMesh = new THREE.Mesh(geometry, this.buildingsColorMaterial);
      const buildingFloorMesh = new THREE.Mesh(geometry, this.buildingsColorMaterial);

      const buildingWireMesh = new THREE.Mesh(geometry, this.buildingsWireframeMaterial);
      const buildingWireFloorMesh = new THREE.Mesh(geometry, this.buildingsWireframeMaterial);

      buildingMesh.add(buildingWireFloorMesh);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;

      // cubeFloorMesh.scale.x = floor.scale.z = 1+mathRandom(0.33);
      buildingFloorMesh.scale.y = 0.05;//+mathRandom(0.5);
      buildingMesh.scale.y = buildingSpec.scale.y;

      TweenMax.to(
        buildingMesh.scale,
        projectVariables.buildingsGrowSpeed,
        {
          y: buildingSpec.transform.scale.y,
          repeat: -1,
          yoyo: true,
          delay: buildingSpec.transform.delay,
          ease: Power1.easeInOut
        });

      /* 
      buildingMesh.setScale = 0.1 + Math.abs(mathRandom());
      TweenMax.to(buildingMesh.scale, 4, { y: buildingMesh.setScale, ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
      TweenMax.to(buildingMesh.position, 4, { y: buildingMesh.setScale / 2, ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
      */


      buildingMesh.scale.x = buildingSpec.scale.x;
      buildingMesh.scale.z = buildingSpec.scale.z;
      // const cubeWidth = 0.9;
      // buildingMesh.scale.x = buildingMesh.scale.z = cubeWidth + mathRandom(1 - cubeWidth);
      //buildingMesh.position.y = buildingMesh.scale.y / 2;
      buildingMesh.position.x = buildingSpec.position.x;
      buildingMesh.position.z = buildingSpec.position.z;
      // buildingMesh.position.x = Math.round(mathRandom());
      // buildingMesh.position.z = Math.round(mathRandom());

      buildingFloorMesh.position.set(buildingMesh.position.x, 0/*cubeFloorMesh.scale.y / 2*/, buildingMesh.position.z);

      this.city.add(buildingFloorMesh);
      this.city.add(buildingMesh);
    }
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

    this.snow.rotation.y += 0.01;
    this.snow.rotation.x += 0.01;

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = this.container.innerWidth / this.container.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.innerWidth, this.container.innerHeight);
  }


  onControlsChange() {
    this.cameraPointLight.position.copy(this.camera.position);
  }
}

export default CityEnvironment;