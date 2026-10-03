
'use client'

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Avatar } from '@heroui/avatar';
import { ArrowUpRight } from 'lucide-react';
import { posters } from '@/config/posters';

const InvitationCard = ({
  roomImage = posters.fellowship,
  roomName = 'Your screening room',
  inviterName = 'A fellow film lover',
  inviterAvatar = '',
  isValidToken = true,
  onAccept = () => {},
  onDecline = () => {},
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth mouse tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 20, 100);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Cinema-themed lighting setup
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    scene.add(ambientLight);

    // Spotlight like cinema projector
    const spotLight = new THREE.SpotLight(0xffd700, 1, 100, Math.PI / 6, 0.5, 2);
    spotLight.position.set(0, 20, 30);
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Cinema screen particles (like dust in projector light)
    const dustGeometry = new THREE.BufferGeometry();
    const dustCount = 400;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    const dustVelocities = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 60;
      dustPositions[i + 1] = (Math.random() - 0.5) * 40;
      dustPositions[i + 2] = (Math.random() - 0.5) * 40;

      // Golden/cinema colors
      const intensity = Math.random() * 0.5 + 0.5;
      dustColors[i] = 1 * intensity;     // Red
      dustColors[i + 1] = 0.8 * intensity; // Green  
      dustColors[i + 2] = 0.2 * intensity; // Blue (golden tone)

      dustSizes[i / 3] = Math.random() * 0.2 + 0.05;
      
      // Slow floating velocities
      dustVelocities[i] = (Math.random() - 0.5) * 0.02;
      dustVelocities[i + 1] = Math.random() * 0.01;
      dustVelocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    dustGeometry.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);

    // Film strip rings
    const filmStrips: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
    for (let i = 0; i < 4; i++) {
      const stripGeometry = new THREE.RingGeometry(4 + i * 1.5, 4.3 + i * 1.5, 8, 1);
      const stripMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x333333 : 0x666666,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -15 - i * 5
      );
      strip.rotation.x = Math.random() * Math.PI;
      filmStrips.push(strip);
      scene.add(strip);
    }

    // Movie camera models (simplified geometric representation)
    const cameras: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const cameraGroup = new THREE.Group();
      
      // Camera body
      const bodyGeometry = new THREE.BoxGeometry(1, 0.8, 1.5);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      
      // Camera lens
      const lensGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8);
      const lensMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.rotation.z = Math.PI / 2;
      lens.position.z = 0.8;
      
      cameraGroup.add(body);
      cameraGroup.add(lens);
      
      cameraGroup.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 30
      );
      cameraGroup.scale.setScalar(0.5 + Math.random() * 0.5);
      
      cameras.push(cameraGroup);
      scene.add(cameraGroup);
    }

    // Film reels
    const filmReels: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const reelGroup = new THREE.Group();
      
      // Reel disc
      const discGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16);
      const discMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      const disc = new THREE.Mesh(discGeometry, discMaterial);
      
      // Center hub
      const hubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8);
      const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const hub = new THREE.Mesh(hubGeometry, hubMaterial);
      
      // Spokes
      for (let j = 0; j < 6; j++) {
        const spokeGeometry = new THREE.BoxGeometry(0.6, 0.02, 0.02);
        const spokeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
        spoke.rotation.z = (j / 6) * Math.PI * 2;
        spoke.position.y = 0.05;
        reelGroup.add(spoke);
      }
      
      reelGroup.add(disc);
      reelGroup.add(hub);
      
      reelGroup.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 35
      );
      
      filmReels.push(reelGroup);
      scene.add(reelGroup);
    }

    // Floating film frames
    const filmFrames: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>[] = [];
    for (let i = 0; i < 6; i++) {
      const frameGeometry = new THREE.PlaneGeometry(0.8, 1.2);
      const frameMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const frame = new THREE.Mesh(frameGeometry, frameMaterial);
      
      frame.position.set(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 25
      );
      frame.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      filmFrames.push(frame);
      scene.add(frame);
    }

    camera.position.set(0, 0, 20);


    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Smooth mouse interpolation
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.02;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.02;

      // Update dust particles with floating motion
      const positions = dustParticles.geometry.attributes.position.array;
      for (let i = 0; i < dustCount * 3; i += 3) {
        positions[i] += dustVelocities[i];
        positions[i + 1] += dustVelocities[i + 1];
        positions[i + 2] += dustVelocities[i + 2];

        // Boundary wrapping
        if (positions[i] > 30) positions[i] = -30;
        if (positions[i] < -30) positions[i] = 30;
        if (positions[i + 1] > 20) positions[i + 1] = -20;
        if (positions[i + 2] > 20) positions[i + 2] = -20;
        if (positions[i + 2] < -20) positions[i + 2] = 20;
      }
      dustParticles.geometry.attributes.position.needsUpdate = true;

      // Animate film strips
      filmStrips.forEach((strip, index) => {
        strip.rotation.z += 0.003 * (index + 1);
        strip.position.y += Math.sin(time + index) * 0.01;
      });

      // Animate cameras
      cameras.forEach((camera, index) => {
        camera.rotation.y += 0.005 * (index + 1);
        camera.position.y += Math.sin(time * 0.5 + index) * 0.02;
        camera.position.x += Math.cos(time * 0.3 + index) * 0.01;
      });

      // Animate film reels
      filmReels.forEach((reel, index) => {
        reel.rotation.y += 0.01 * (index + 1);
        reel.position.z += Math.sin(time + index * 2) * 0.02;
      });

      // Animate film frames
      filmFrames.forEach((frame, index) => {
        frame.rotation.x += 0.002 * (index + 1);
        frame.rotation.y += 0.003 * (index + 1);
        frame.position.y += Math.sin(time * 1.5 + index) * 0.015;
      });

      // Smooth camera movement based on mouse with reduced intensity
      const mouseInfluence = 0.5;
      camera.position.x += (mouseRef.current.x * mouseInfluence - camera.position.x) * 0.02;
      camera.position.y += (mouseRef.current.y * mouseInfluence - camera.position.y) * 0.02;

      // Gentle camera sway
      camera.position.x += Math.sin(time * 0.2) * 0.1;
      camera.position.y += Math.cos(time * 0.15) * 0.05;

      // Hover effects with smooth transitions
      const targetOpacity = isHovered ? 0.9 : 0.6;
      dustParticles.material.opacity += (targetOpacity - dustParticles.material.opacity) * 0.03;
      
      filmStrips.forEach((strip) => {
        const targetStripOpacity = isHovered ? 0.6 : 0.4;
        strip.material.opacity += (targetStripOpacity - strip.material.opacity) * 0.03;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []); // Removed isHovered dependency to prevent recreation

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center bg-canvas px-[4.5vw] pb-12 pt-32 text-ink max-[480px]:px-[5vw] max-[480px]:pb-8 max-[480px]:pt-36">
      <div className="pointer-events-none fixed inset-0 z-[1] h-svh w-full opacity-70" ref={mountRef} aria-hidden="true" />
      <div className="relative z-[2] w-full max-w-[960px] overflow-hidden rounded-xl border border-line bg-elevated/95 shadow-[0_24px_60px_rgb(0_0_0_/_12%)] backdrop-blur-[20px] transition-[transform,border-color] duration-[400ms] hover:-translate-y-1 hover:border-accent motion-reduce:transform-none motion-reduce:transition-none" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {isValidToken ? (
          <div className="grid grid-cols-[1fr_1.1fr] gap-9 p-7 max-md:grid-cols-1 max-md:gap-6 max-md:p-6 max-[480px]:p-5">
            <div className="min-h-[440px] overflow-hidden rounded-md bg-surface max-md:h-60 max-md:min-h-0">
              <img src={roomImage} alt={roomName} className="h-full w-full object-cover" onError={(event) => {
                if (event.currentTarget.getAttribute("src") !== posters.fellowship) event.currentTarget.src = posters.fellowship;
              }} />
            </div>
            <div className="flex min-w-0 flex-col items-start justify-center py-3.5 max-md:py-0">
              <p className="mb-5 text-sm font-semibold text-accent">A seat has your name on it</p>
              <h1 className="mb-5 break-words text-[clamp(32px,4.2vw,52px)] font-semibold tracking-[-0.055em]">{roomName}</h1>
              <p className="mb-7 text-base leading-[1.7] text-muted">Great stories deserve good company. You’re invited to join the circle.</p>
              <div className="mb-8 flex w-full items-center gap-4 rounded-lg border border-line bg-surface p-4">
                <Avatar src={inviterAvatar} name={inviterName} className="size-12 shrink-0" />
                <div><p className="text-sm text-muted">Invited by</p><p className="break-words text-[17px] font-semibold text-ink">{inviterName}</p></div>
              </div>
              <div className="flex w-full flex-wrap gap-3 max-[480px]:flex-col">
                <button type="button" className="inline-flex flex-1 cursor-pointer items-center justify-center gap-4 rounded-md bg-ink px-4.5 py-3.5 text-[15px] font-semibold text-canvas hover:bg-accent hover:text-on-accent" onClick={onAccept}>Accept and join <ArrowUpRight size={19} aria-hidden="true" /></button>
                <button type="button" className="inline-flex cursor-pointer items-center justify-center gap-4 rounded-md border border-line bg-surface px-4.5 py-3.5 text-[15px] font-semibold text-ink" onClick={onDecline}>Decline</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 [&>h1]:mb-6 [&>h1]:text-4xl [&>p]:text-base [&>p]:text-muted" role="alert"><h1>This invitation has ended.</h1><p>Request a fresh invitation from the room’s host and we’ll save you a seat.</p></div>
        )}
      </div>
    </div>
  );
};

export default InvitationCard;
