
'use client'

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const InvitationCard = ({
  roomImage = '/default-room.jpg',
  roomName = 'Meeting Room',
  inviterName = 'John Doe',
  inviterAvatar = '/default-avatar.jpg',
  isValidToken = true,
  onAccept = () => {},
  onDecline = () => {},
  theme = 'dark' // 'dark' or 'light'
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth mouse tracking
  useEffect(() => {
    const handleMouseMove = (event) => {
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
    const filmStrips = [];
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
    const cameras = [];
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
    const filmReels = [];
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
    const filmFrames = [];
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
    sceneRef.current = { 
      scene, camera, renderer, dustParticles, filmStrips, cameras, filmReels, filmFrames,
      dustPositions, dustVelocities 
    };

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
      
      filmStrips.forEach((strip, index) => {
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

  const styles = {
    pageContainer: {
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    },
    threejsBackground: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1,
      pointerEvents: 'none',
    },
    cardContainer: {
      position: 'relative',
      zIndex: 10,
      width: '400px',
      minHeight: '500px',
      borderRadius: '24px',
      overflow: 'hidden',
      background: theme === 'dark' 
        ? 'rgba(15, 15, 23, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(25px)',
      border: theme === 'dark' 
        ? '1px solid rgba(255, 215, 0, 0.3)'
        : '1px solid rgba(255, 215, 0, 0.4)',
      boxShadow: theme === 'dark'
        ? '0 25px 50px -12px rgba(255, 215, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        : '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
    },
    content: {
      padding: '32px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 2,
    },
    roomImageContainer: {
      position: 'relative',
      width: '100%',
      height: '200px',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '24px',
      background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF6347)',
      padding: '2px',
    },
    roomImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '14px',
    },
    roomName: {
      fontSize: '28px',
      fontWeight: '700',
      color: theme === 'dark' ? '#ffffff' : '#171717',
      marginBottom: '20px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6347)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: theme === 'dark' ? '0 0 20px rgba(255, 215, 0, 0.3)' : 'none',
    },
    inviterSection: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '32px',
      padding: '20px',
      borderRadius: '16px',
      background: theme === 'dark'
        ? 'rgba(255, 215, 0, 0.1)'
        : 'rgba(255, 215, 0, 0.08)',
      border: `1px solid ${theme === 'dark' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.2)'}`,
      backdropFilter: 'blur(10px)',
    },
    avatar: {
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      objectFit: 'cover',
      marginRight: '16px',
      border: '3px solid #FFD700',
      boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
    },
    inviterText: {
      fontSize: '14px',
      color: theme === 'dark' ? '#a1a1aa' : '#71717a',
      marginBottom: '4px',
    },
    inviterName: {
      fontSize: '20px',
      fontWeight: '600',
      color: theme === 'dark' ? '#ffffff' : '#171717',
    },
    buttonContainer: {
      display: 'flex',
      gap: '16px',
      marginTop: 'auto',
    },
    button: {
      flex: 1,
      padding: '16px',
      borderRadius: '14px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    acceptButton: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      color: '#000000',
      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
    },
    declineButton: {
      background: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.4)',
    },
    errorMessage: {
      textAlign: 'center',
      padding: '32px',
      borderRadius: '16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444',
      fontSize: '16px',
      fontWeight: '500',
      backdropFilter: 'blur(10px)',
    },
  };

  return (
    <div style={styles.pageContainer}>
      {/* Full-screen Three.js Background */}
      <div style={styles.threejsBackground} ref={mountRef} />
      
      {/* Floating Card */}
      <div 
        style={styles.cardContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={styles.content}>
          {isValidToken ? (
            <>
              {/* Room Image */}
              <div style={styles.roomImageContainer}>
                <img 
                  src={roomImage} 
                  alt={roomName}
                  style={styles.roomImage}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRkQ3MDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTTEwMCA4MEM5NC40NzcgODAgOTAgODQuNDc3IDkwIDkwQzkwIDk1LjUyMyA5NC40NzcgMTAwIDEwMCAxMDBDMTA1LjUyMyAxMDAgMTEwIDk1LjUyMyAxMTAgOTBDMTEwIDg0LjQ3NyAxMDUuNTIzIDgwIDEwMCA4MFoiIGZpbGw9IiNGRkQ3MDAiLz48cGF0aCBkPSJNNzAgMTIwQzc1LjUyMyAxMjAgODAgMTE1LjUyMyA4MCAxMTBDODAgMTA0LjQ3NyA3NS41MjMgMTAwIDcwIDEwMEM2NC40NzcgMTAwIDYwIDEwNC40NzcgNjAgMTEwQzYwIDExNS41MjMgNjQuNDc3IDEyMCA3MCAxMjBaIiBmaWxsPSIjRkZBNTAwIi8+PHBhdGggZD0iTTEzMCAxMjBDMTM1LjUyMyAxMjAgMTQwIDExNS41MjMgMTQwIDExMEMxNDAgMTA0LjQ3NyAxMzUuNTIzIDEwMCAxMzAgMTAwQzEyNC40NzcgMTAwIDEyMCAxMDQuNDc3IDEyMCAxMTBDMTIwIDExNS41MjMgMTI0LjQ3NyAxMjAgMTMwIDEyMFoiIGZpbGw9IiNGRjYzNDciLz48L3N2Zz4=';
                  }}
                />
              </div>

              {/* Room Name */}
              <h2 style={styles.roomName}>{roomName}</h2>

              {/* Inviter Section */}
              <div style={styles.inviterSection}>
                <img 
                  src={inviterAvatar} 
                  alt={inviterName}
                  style={styles.avatar}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIyNCIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9IjI0IiBjeT0iMjAiIHI9IjgiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTggMzZDOCAyOC4yNjggMTUuMjY4IDIyIDI0IDIyQzMyLjczMiAyMiA0MCAyOC4yNjggNDAgMzYiIGZpbGw9IndoaXRlIi8+PC9zdmc+';
                  }}
                />
                <div>
                  <p style={styles.inviterText}>You're invited by</p>
                  <p style={styles.inviterName}>{inviterName}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.buttonContainer}>
                <button 
                  style={{...styles.button, ...styles.acceptButton}}
                  onClick={onAccept}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 15px 35px rgba(255, 215, 0, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                  }}
                >
                  Accept and Join
                </button>
                <button 
                  style={{...styles.button, ...styles.declineButton}}
                  onClick={onDecline}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = '0 15px 35px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Decline
                </button>
              </div>
            </>
          ) : (
            // Invalid Token Message
            <div style={styles.errorMessage}>
              <h3 style={{ marginBottom: '16px', fontSize: '24px' }}>🎭 Invalid Invitation</h3>
              <p>This invitation token is no longer valid or has expired. Please request a new invitation from the room administrator.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationCard;
