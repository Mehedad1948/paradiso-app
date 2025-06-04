import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import FontFaceObserver from "fontfaceobserver";
import imagesLoaded from "imagesloaded";
import Scroll from "./scroll";
import { fragment } from "./shaders/fragment";
import { vertex } from "./shaders/vertex";
import img from "./john-wick-background-image.jpg";
import { text } from "stream/consumers";

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
  private materials: THREE.ShaderMaterial[] = [];
  private mesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);
  private time: number;
  private controls: OrbitControls;
  private images: HTMLImageElement[];
  private currentScroll: number;
  private scroll: Scroll = new Scroll();
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;

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

    this.images = Array.from(document.querySelectorAll(".img"));

    const fontOpen: Promise<void> = new Promise((resolve) => {
      new FontFaceObserver("Montserrat").load().then(() => {
        resolve();
      });
    });

    // Preload images
    const preloadImages: Promise<void> = new Promise((resolve, reject) => {
      imagesLoaded(document.querySelectorAll("img"), { background: true }, () =>
        resolve(),
      );
    });

    this.currentScroll = 0;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    Promise.all([fontOpen, preloadImages])
      .then(() => {
        this.scroll = new Scroll();
        this.addImages();
        this.setPosition();
        this.resize();
        this.setupResize();
        this.addObjects();
        this.render();

        this.mouseMovement();

        window.addEventListener("scroll", () => {
          this.currentScroll = window.scrollY;
        });
      })
      .catch((error) => {
        console.error("Error loading resources:", error);
      });
  }

  mouseMovement() {
    window.addEventListener(
      "pointermove",
      (event) => {
        this.pointer.x = (event.clientX / this.width) * 2 - 1;
        this.pointer.y = -(event.clientY / this.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
          console.log("❌❌❌❌", intersects[0]);
        }
      },
      false,
    );
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
    // this.scene.add(this.mesh);
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: 0 },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
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

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      const texture = new THREE.TextureLoader().load(img.src, () => {
        texture.needsUpdate = true;
      });
      texture.needsUpdate = true;
      let geometry = new THREE.PlaneGeometry(
        bounds.width,
        bounds.height,
        10,
        10,
      );

      let material = this.material.clone();

      material.uniforms.uImage.value = texture;

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
    this.imageStore.forEach(({ img, mesh, left, top, width, height }) => {
      mesh.position.y =
        this.currentScroll + -top + this.height / 2 - height / 2;
      mesh.position.x = left - this.width / 2 + width / 2;
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
    // this.mesh.rotation.x = this.time / 2000;
    // this.mesh.rotation.y = this.time / 1000;

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();

    this.materials.forEach((m) => {
      m.uniforms.time.value = this.time;
    });

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
