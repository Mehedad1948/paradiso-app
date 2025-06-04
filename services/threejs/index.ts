import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { fragment } from "./shaders/fragment";
import { vertex } from "./shaders/vertex";

import img from "./john-wick-background-image.jpg";

export default class Sketch {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private width: number;
  private height: number;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.BoxGeometry | THREE.PlaneGeometry =
    new THREE.BoxGeometry(0.2, 0.2, 0.2);
  private material: THREE.ShaderMaterial = new THREE.ShaderMaterial();
  private mesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);
  private time: number;
  private controls: OrbitControls;
  private images: HTMLImageElement[];
  private imageStore: {
    img: HTMLImageElement;
    top: number;
    left: number;
    width: number;
    height: number;
    material?: THREE.Material;
    mesh: THREE.Mesh;
  }[] = [];
  constructor(option: { dom: any }) {
    this.time = 0;

    this.container = option.dom;

    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      100,
      2000,
    );
    this.camera.position.z = 600;

    this.camera.fov =
      2 * Math.atan(this.height / 2 / this.camera.position.z) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setAnimationLoop(animate);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.images = [...document.querySelectorAll(".img")];

    this.addImages();
    this.setPosition();
    this.resize();
    this.setupResize();
    this.addObjects();
    this.render();
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(100, 100, 10, 10);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        oceanTexture: { value: new THREE.TextureLoader().load(img.src) },
        time: {
          value: 0,
        },
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      wireframe: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  addImages() {
    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      //   const texture = new THREE.TextureLoader().load(img.src);
      let geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      return {
        img,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        // texture,
        // material,
        mesh,
      };
    });

    console.log("🚀🚀", this.imageStore);
  }

  setPosition() {
    this.imageStore.forEach(({ img, mesh , left, top, width, height}) => {

        mesh.position.y = -top + this.height /2 - height/2;
        mesh.position.x = left - this.width /2 + width/2;

    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    console.log("Resize");

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.time += 0.05;
    this.mesh.rotation.x = this.time / 2000;
    this.mesh.rotation.y = this.time / 1000;

    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.hover.value.set(mouseX, mouseY); // normalized UV coords
    // this.material.uniforms.hoverState.value = 1;

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

// init

// animation

function animate(time: number) {}
