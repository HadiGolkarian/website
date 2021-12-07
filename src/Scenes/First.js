
import * as dat from 'dat.gui';
import { Power4, Power1, gsap } from 'gsap/gsap-core';
import * as THREE from 'three';
import { OrbitControls } from '../js/three/OrbitControls';
import buildingsSpec from '../utils/generateBuildings';
import { mathRandom } from '../utils/number';

console.log(THREE);

const projectVariables = {
  Background: {
    Color: "#FF6F48",
  },
  Fog: {
    Color: "#FF6F48",
    Near: 12,
    Far: 16
  },
  Buildings: {
    Color: "#020205",
    Opacity: 1,
    // Wireframe: false,
    // Transparent: false,
    WireframeColor: "#8382AB",
    WireframeOpacity: 0.02,
    Roughness: 0,
    Metalness: 0,
    GrowSpeed: 15,
  },
  Snow: {
    Color: '#FFFFFF',
    RotationSpeedX: 0.01,
    RotationSpeedY: 0.01
  },
  Lines: {
    Color: '#FFFFFF',
    TravelTimeX: 3,
    TravelTimeY: 5,
  },
  Ground: {
    Color: '#020205',
    Roughness: 10,
    Metalness: 0.6,
    Opacity: 0.9,
    Transparent: true
  },
  Lights: {
    ambientLightColor: '#FFFFFF',
    ambientLightIntensity: 4,
    frontLightColor: '#FFFFFF',
    frontLightIntensity: 20,
    frontLightDistance: 10,
    backLightColor: '#FFFFFF',
    backLightIntensity: 0.5,
    cameraLightColor: '#FFFFFF',
    cameraLightIntensity: 8,
    cameraLightDistance: 15,
  }
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

    this.backgroundColor = new THREE.Color(projectVariables.Background.Color);
    this.fog = new THREE.Fog(projectVariables.Fog.Color, projectVariables.Fog.Near, projectVariables.Fog.Far);

    this.city = new THREE.Object3D();
    this.snow = new THREE.Object3D();
    this.lines = new THREE.Object3D();
    this.buildings = new THREE.Object3D();

    this.ambientLight = new THREE.AmbientLight(projectVariables.Lights.ambientLightColor, projectVariables.Lights.ambientLightIntensity);
    this.frontLight = new THREE.SpotLight(projectVariables.Lights.frontLightColor, projectVariables.Lights.frontLightIntensity, projectVariables.Lights.frontLightDistance);
    this.backLight = new THREE.PointLight(projectVariables.Lights.backLightColor, projectVariables.Lights.backLightIntensity);
    this.cameraLight = new THREE.PointLight(projectVariables.Lights.cameraLightColor, projectVariables.Lights.cameraLightIntensity, projectVariables.Lights.cameraLightDistance);
    // this.spotLightHelper = new THREE.SpotLightHelper(this.lightFront);


    this.buildingsColorMaterial = new THREE.MeshStandardMaterial({
      color: projectVariables.Buildings.Color,
      wireframe: false,
      shading: THREE.SmoothShading, // THREE.FlatShading,
      side: THREE.DoubleSide,
      opacity: projectVariables.Buildings.Opacity,
      transparent: false,
      roughness: projectVariables.Buildings.Roughness, // 0.3
      metalness: projectVariables.Buildings.Metalness, // 1
    });
    this.buildingsWireframeMaterial = new THREE.MeshLambertMaterial({
      color: projectVariables.Buildings.WireframeColor,
      wireframe: true,
      transparent: true,
      opacity: projectVariables.Buildings.WireframeOpacity,
      side: THREE.DoubleSide,
      // shading:THREE.FlatShading,
    });
    this.groundMaterial = new THREE.MeshPhongMaterial({
      color: projectVariables.Ground.Color,
      side: THREE.DoubleSide,
      roughness: projectVariables.Ground.Roughness,
      metalness: projectVariables.Ground.Metalness,
      opacity: projectVariables.Ground.Opacity,
      transparent: projectVariables.Ground.Transparent,
    });
    this.snowMaterial = new THREE.MeshToonMaterial({
      color: projectVariables.Snow.Color,
      side: THREE.DoubleSide
    });
    this.lineMaterial = new THREE.MeshToonMaterial({
      color: projectVariables.Lines.Color,
      side: THREE.DoubleSide
    });

    this.setupCamera();
    this.setupRenderer();
    this.setupScene();
    this.setupLights();
    this.setupVariableControls();
    this.generateCity();
    this.bindEvents();

    console.log(this, gsap);
  }

  bindEvents() {
    this.container.addEventListener('resize', this.onWindowResize.bind(this));
    this.controls.addEventListener('change', this.onControlsChange.bind(this));

    document.getElementById('exploreBtn').addEventListener('click', this.startCameraTour.bind(this));
    document.getElementById('logBtn').addEventListener('click', this.logCamera.bind(this));
  }


  setupCamera() {
    this.camera.position.set(-22, 25, 20);
  }
  setupScene() {
    this.scene.background = this.backgroundColor;
    this.scene.fog = this.fog;
    // this.scene.fog = new THREE.FogExp2(projectVariables.fogColor, 0.05);
    // this.scene.add(this.spotLightHelper);
    this.scene.add(this.ambientLight);
    this.scene.add(this.backLight);
    this.scene.add(this.cameraLight);
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
  setupLights() {
    this.frontLight.rotation.x = 45 * Math.PI / 180;
    this.frontLight.rotation.z = -45 * Math.PI / 180;
    this.frontLight.position.set(5, 5, 5);
    this.frontLight.castShadow = true;
    this.frontLight.shadow.mapSize.width = 6000;
    this.frontLight.shadow.mapSize.height = this.frontLight.shadow.mapSize.width;
    this.frontLight.penumbra = 0.1;
    this.backLight.position.set(0, 6, 0);
  };
  setupVariableControls() {
    this.gui = new dat.GUI();

    // const background = this.gui.addFolder('Background');
    // background.addColor(projectVariables.Background, 'Color');

    const fog = this.gui.addFolder('Fog');
    fog.addColor(projectVariables.Fog, 'Color');
    fog.add(projectVariables.Fog, 'Near', 0, 50);
    fog.add(projectVariables.Fog, 'Far', 0, 300);
    fog.open();

    const snow = this.gui.addFolder('Snow');
    snow.addColor(projectVariables.Snow, 'Color');
    snow.add(projectVariables.Snow, 'RotationSpeedX', -0.1, 0.1);
    snow.add(projectVariables.Snow, 'RotationSpeedY', -0.1, 0.1);
    snow.open();

    const lines = this.gui.addFolder('Lines');
    lines.addColor(projectVariables.Lines, 'Color');
    lines.add(projectVariables.Lines, 'TravelTimeX', 0, 1000);
    lines.add(projectVariables.Lines, 'TravelTimeY', 0, 1000);
    lines.open();


    // this.gui.addColor(projectVariables, 'fogColor');

    // this.gui.addColor(projectVariables, 'buildingsColor');

    // this.gui.addColor(projectVariables, 'buildingsWireframeColor');
    // this.gui.add(projectVariables, 'buildingsWireframeOpacity', 0, 1, 0.01);

    // this.gui.addColor(projectVariables, 'snowParticleColor');
    // this.gui.addColor(projectVariables, 'lineParticlesColor');

    // this.gui.addColor(projectVariables, 'groundColor');
  };


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

      gsap.to(
        buildingMesh.scale,
        {
          y: buildingSpec.transform.scale.y,
          repeat: -1,
          yoyo: true,
          duration: projectVariables.Buildings.GrowSpeed,
          delay: buildingSpec.transform.delay,
          ease: Power1.easeInOut
        });

      /* 
      buildingMesh.setScale = 0.1 + Math.abs(mathRandom());
      gsap.to(buildingMesh.scale,  { y: buildingMesh.setScale, duration:4 , ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
      gsap.to(buildingMesh.position,  { y: buildingMesh.setScale / 2, duration:4 ,ease: Elastic.easeInOut, delay: 0.2 * i, yoyo: true, repeat: -1 });
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

        this.lineTweenX = gsap.to(cElem.position, {
          x: cPos, repeat: -1,
          duration: projectVariables.Lines.TravelTimeX,
          yoyo: true,
          delay: mathRandom(3),
          ease: Power1.easeInOut
        });
      } else {
        createCarPos = true;
        cElem.position.x = (mathRandom(cAmp));
        cElem.position.z = -cPos;
        cElem.rotation.y = 90 * Math.PI / 180;

        this.lineTweenY = gsap.to(cElem.position, {
          z: cPos, repeat: -1,
          duration: projectVariables.Lines.TravelTimeX,
          yoyo: true,
          delay: mathRandom(3),
          ease: Power1.easeInOut
        });
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
    this.updateVariables();

    this.snow.rotation.y += projectVariables.Snow.RotationSpeedX;
    this.snow.rotation.x += projectVariables.Snow.RotationSpeedY;

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  }


  updateVariables() {
    // this.backgroundColor.set(new THREE.Color(projectVariables.Background.Color));
    this.backgroundColor.set(new THREE.Color(projectVariables.Fog.Color));
    this.fog.color = new THREE.Color(projectVariables.Fog.Color);
    this.fog.near = projectVariables.Fog.Near;
    this.fog.far = projectVariables.Fog.Far;

    this.buildingsColorMaterial.color = new THREE.Color(projectVariables.Buildings.Color);
    this.buildingsWireframeMaterial.color = new THREE.Color(projectVariables.Buildings.WireframeColor);
    this.buildingsWireframeMaterial.opacity = projectVariables.Buildings.WireframeOpacity;

    this.snowMaterial.color = new THREE.Color(projectVariables.Snow.Color);
    this.groundMaterial.color = new THREE.Color(projectVariables.Ground.Color);
    this.lineMaterial.color = new THREE.Color(projectVariables.Lines.Color);

    // this.lineTweenX.d
    this.lineTweenX.duration(0);
    this.lineTweenY.duration(1000);
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

    gsap.to(this.camera.position,
      {
        ...angels[0],
        yoyo: true,
        delay: 0.05,
        duration: 1,
        ease: Power4.easeInOut
      });
    // this.controls.target = new THREE.Vector3(targets[i].x, targets[i].y, targets[i].z);
    gsap.to(this.controls.target,
      {
        ...targets[0],
        yoyo: true,
        delay: 0.05,
        duration: 1,
        ease: Power4.easeInOut
      });

    // let i = 1;
    // setInterval(() => {
    //   gsap.to(this.camera.position, 
    //     {
    //       ...angels[i],
    //       yoyo: true,
    //       delay: 0.05,
    //       duration: 1,
    //       ease: Power4.easeInOut
    //     });
    //   // this.controls.target = new THREE.Vector3(targets[i].x, targets[i].y, targets[i].z);
    //   gsap.to(this.controls.target, 
    //     {
    //       ...targets[i],
    //       yoyo: true,
    //       delay: 0.05,
    //       duration: 1,
    //       ease: Power4.easeInOut
    //     });
    //   // this.camera.lookAt(new THREE.Vector3(targets[i].x , targets[i].y ,targets[i].z));
    //   i++;
    //   if (i === 5) { i = 0; }
    // }, 2000);
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

  onWindowResize() {
    this.camera.aspect = this.container.innerWidth / this.container.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.innerWidth, this.container.innerHeight);
  }
  onControlsChange() {
    this.cameraLight.position.copy(this.camera.position);
  }
}

export default CityEnvironment;