import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import FontFaceObserver from "fontfaceobserver";
import imagesLoaded from "imagesloaded";
import Scroll from "./scroll";
import { fragment } from "./shaders/fragment";
import { vertex } from "./shaders/vertex";
import Mainimg from "./john-wick-background-image.jpg";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";
import { noise } from "./shaders/noise";

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
  private prevScroll: number;
  private scroll: Scroll = new Scroll();
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private composer: any;
  private renderPass: any;
  private customPass: any;
  private myEffect: any;
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

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    this.prevScroll = 1;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    Promise.all([fontOpen, preloadImages])
      .then(() => {
        this.scroll = new Scroll();
        this.addImages();
        this.setPosition();
        this.resize();
        this.setupResize();
        this.composerPass();
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
          let obj = intersects[0].object;

          (obj as any).material.uniforms.hover.value = intersects[0].uv;
        }
      },
      false,
    );
  }

  addImages() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uImage: { value: 0 },
        hover: { value: new THREE.Vector2(0.5, 0.5) },
        hoverState: { value: 0 },
        oceanTexture: { value: new THREE.TextureLoader().load(Mainimg.src) },
      },
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      // wireframe: true
    });

    this.materials = [];

    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      const texture = new THREE.TextureLoader().load(img.src);
      texture.needsUpdate = true;
      let geometry = new THREE.PlaneGeometry(
        bounds.width,
        bounds.height,
        10,
        10,
      );

      let material = this.material.clone();

      img.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 1,
          ease: "power3.out",
        });
      });
      img.addEventListener("mouseout", () => {
        gsap.to(material.uniforms.hoverState, {
          duration: 1,
          value: 0,
          ease: "power3.out",
        });
      });

      this.materials.push(material);

      material.uniforms.oceanTexture.value = texture;
      material.uniforms.uImage.value = texture;

      let mesh = new THREE.Mesh(geometry, material);

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
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.time += 0.05;

    this.scroll.render();

    this.prevScroll = this.currentScroll;
    this.currentScroll = this.scroll.scrollToRender;

    const shouldRender =
      Math.round(this.currentScroll) !== Math.round(this.prevScroll) ||
      this.currentScroll === 0;

    // if (shouldRender) {
    console.log("should render");

    this.setPosition();

    // 💡 Safe check before setting values (optional but recommended)
    if (this.customPass && this.customPass.uniforms) {
      this.customPass.uniforms.scrollSpeed.value = this.scroll.speedTarget;
      this.customPass.uniforms.time.value = this.time;
    }

    this.materials.forEach((m) => {
      if (m.uniforms?.time) {
        m.uniforms.time.value = this.time;
      }
    });

    this.composer.render();
    // }

    requestAnimationFrame(this.render.bind(this));
  }

  composerPass() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.myEffect = {
      uniforms: {
        tDiffuse: { value: null },
        scrollSpeed: { value: 0.0 },
        time: { value: 0.0 },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix 
          * modelViewMatrix 
          * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        uniform float scrollSpeed;
        void main(){
          vec2 newUV = vUv;
          float area = smoothstep(0.4,0.,vUv.y);
          area = pow(area,4.);
          newUV.x -= (vUv.x - 0.5)*0.1*area*scrollSpeed;
          gl_FragColor = texture2D( tDiffuse, newUV);
        //   gl_FragColor = vec4(area,0.,0.,1.);
        }
        `,
    };

    this.customPass = new ShaderPass(this.myEffect);
    this.customPass.renderToScreen = true;

    this.composer.addPass(this.customPass);
  }
}

// init

// animation

function animate(time: number) {}
