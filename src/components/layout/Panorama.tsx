import { useEffect, useRef } from "react";
import * as THREE from "three";

const Panorama = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "/panorama/1.18_panorama_1.webp", // px right
      "/panorama/1.18_panorama_3.webp", // nx left
      "/panorama/1.18_panorama_4.webp", // py top
      "/panorama/1.18_panorama_5.webp", // ny bottom
      "/panorama/1.18_panorama_0.webp", // pz front
      "/panorama/1.18_panorama_2.webp", // nz back
    ]);
    scene.background = texture;

    camera.position.z = 1;

    const animate = () => {
      requestAnimationFrame(animate);
      camera.rotation.y += 0.0005; // Rotación automática
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
      }}
    />
  );
};

export default Panorama;