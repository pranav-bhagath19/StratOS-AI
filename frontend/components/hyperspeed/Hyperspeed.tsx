"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { HyperspeedOptions, hyperspeedPresets } from "./HyperSpeedPresets";

interface HyperspeedProps {
  effectOptions?: HyperspeedOptions;
  className?: string;
}

export function Hyperspeed({
  effectOptions = hyperspeedPresets.six,
  className = "",
}: HyperspeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const fov = effectOptions.fov ?? 80;
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    camera.position.set(0, 4, 15);
    camera.lookAt(0, 0, -100);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Clear previous children
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Create Hyperspeed Particle / Light Streak Tunnel System
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xe4e4e7),
      new THREE.Color(0xa1a1aa),
      new THREE.Color(0x71717a),
      new THREE.Color(0x52525b),
    ];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 35;
      const y = (Math.random() - 0.5) * 20;
      const z = -Math.random() * 400;
      const streakLength = 5 + Math.random() * 15;

      const idx = i * 6;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      positions[idx + 3] = x;
      positions[idx + 4] = y;
      positions[idx + 5] = z - streakLength;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
      colors[idx + 3] = color.r * 0.2;
      colors[idx + 4] = color.g * 0.2;
      colors[idx + 5] = color.b * 0.2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    // Road Grid / Velocity Lines
    const gridHelper = new THREE.GridHelper(400, 40, 0x52525b, 0x18181b);
    gridHelper.position.set(0, -3, -200);
    scene.add(gridHelper);

    let speed = (effectOptions.speedUp ?? 2) * 1.8;

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const idx = i * 6;
        pos[idx + 2] += speed;
        pos[idx + 5] += speed;

        // Reset positions if past camera
        if (pos[idx + 2] > 20) {
          const x = (Math.random() - 0.5) * 35;
          const y = (Math.random() - 0.5) * 20;
          const z = -380 - Math.random() * 50;
          const streakLength = 5 + Math.random() * 15;

          pos[idx] = x;
          pos[idx + 1] = y;
          pos[idx + 2] = z;
          pos[idx + 3] = x;
          pos[idx + 4] = y;
          pos[idx + 5] = z - streakLength;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Animate road grid movement
      gridHelper.position.z += speed * 0.5;
      if (gridHelper.position.z > 0) {
        gridHelper.position.z = -200;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [effectOptions]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      style={{ opacity: 0.7 }}
    />
  );
}

export default Hyperspeed;
