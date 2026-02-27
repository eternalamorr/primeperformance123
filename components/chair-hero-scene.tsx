"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { supportsWebGL } from "@/lib/webgl";
import Image from "next/image";

const MODEL_URL = "/api/chair-model?v=20260213";
const MODEL_OFFSET_X = 0.86;
const ENABLE_HDRI = process.env.NODE_ENV === "production";

type ModelBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type ModelBoundaryState = {
  hasError: boolean;
};

class ModelBoundary extends Component<ModelBoundaryProps, ModelBoundaryState> {
  state: ModelBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Chair model render failed:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function getResponsiveSettings(width: number) {
  if (width < 640) {
    return {
      offsetX: 0.18,
      yStart: -0.22,
      yTarget: 0.02,
      rotStart: -0.18,
      scaleMult: 1.32,
      cameraPos: [0, 1.3, 3.05] as [number, number, number],
    };
  }
  if (width < 1024) {
    return {
      offsetX: 0.48,
      yStart: -0.28,
      yTarget: 0.0,
      rotStart: -0.24,
      scaleMult: 0.92,
      cameraPos: [0, 1.45, 3.2] as [number, number, number],
    };
  }
  return {
    offsetX: MODEL_OFFSET_X,
    yStart: -0.35,
    yTarget: 0,
    rotStart: -0.35,
    scaleMult: 0.10,
    cameraPos: [0, 1.6, 3.7] as [number, number, number],
  };
}

function ResponsiveCamera() {
  const { size, camera } = useThree();

  useEffect(() => {
    const width = size?.width || 1024;
    const settings = getResponsiveSettings(width);
    camera.position.set(...settings.cameraPos);
    camera.lookAt(settings.offsetX, -0.05, 0);
  }, [camera, size?.width]);

  return null;
}

function ChairModel({ animateIn }: { animateIn: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const introStartRef = useRef<number | null>(null);
  const { size } = useThree();
  const { scene } = useGLTF(MODEL_URL) as unknown as { scene: THREE.Group };

  const baseScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return 1.8 / maxDim;
  }, [scene]);

  useEffect(() => {
    const boostRedMaterials = (material: THREE.Material) => {
      const withColor = material as THREE.MeshStandardMaterial;
      if (!withColor.color) return;

      if (!withColor.userData.originalColor) {
        withColor.userData.originalColor = withColor.color.clone();
      }

      const baseColor = withColor.userData.originalColor as THREE.Color;
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      const isRed = hsl.s > 0.25 && (hsl.h < 0.04 || hsl.h > 0.96);
      if (!isRed) return;

      const boostedS = Math.min(1, hsl.s * 1.25);
      const loweredL = Math.max(0, hsl.l * 0.82);
      withColor.color.setHSL(hsl.h, boostedS, loweredL);
      withColor.needsUpdate = true;
    };

    scene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      const { material } = child;
      if (Array.isArray(material)) {
        material.forEach(boostRedMaterials);
      } else if (material) {
        boostRedMaterials(material);
      }
    });
  }, [scene]);

  const responsive = useMemo(() => {
    const width = size?.width || 1024;
    return getResponsiveSettings(width);
  }, [size?.width]);

  useEffect(() => {
    if (animateIn) {
      introStartRef.current = performance.now();
    } else {
      introStartRef.current = null;
      if (groupRef.current) {
        groupRef.current.position.set(responsive.offsetX, responsive.yStart, 0);
        groupRef.current.rotation.set(0, responsive.rotStart, 0);
        groupRef.current.scale.setScalar(baseScale * responsive.scaleMult);
      }
    }
  }, [animateIn, baseScale, responsive]);

  useFrame(() => {
    if (!groupRef.current || !animateIn || introStartRef.current === null) return;
    const elapsed = (performance.now() - introStartRef.current) / 1000;
    const time = performance.now() / 1000;
    const duration = 1.25;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const autoAngle = (time * 0.22) % (Math.PI * 2);

    groupRef.current.position.x = responsive.offsetX;
    groupRef.current.position.y = THREE.MathUtils.lerp(responsive.yStart, responsive.yTarget, eased);
    groupRef.current.rotation.y =
      THREE.MathUtils.lerp(responsive.rotStart, 0, eased) + autoAngle;

    const scale = THREE.MathUtils.lerp(
      baseScale * responsive.scaleMult,
      baseScale,
      eased
    );
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={groupRef}
      position={[responsive.offsetX, responsive.yStart, 0]}
      rotation={[0, responsive.rotStart, 0]}
      scale={baseScale * responsive.scaleMult}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export function ChairHeroScene({ animateIn = true }: { animateIn?: boolean }) {
  const [canRender, setCanRender] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    setCanRender(supportsWebGL());
  }, []);

  if (!canRender || modelFailed) {
    return (
      <div className="h-full w-full rounded-3xl bg-foreground/[0.02] border border-foreground/10 overflow-hidden">
        <div className="relative h-full w-full">
          <Image
            src="/videos/hero-chair-poster.png"
            alt="Chair preview"
            fill
            className="object-contain p-8 opacity-90"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-4 text-center text-[11px] uppercase tracking-[0.18em] text-foreground/45">
            3D preview unavailable
          </div>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ fov: 45, position: [0, 1.55, 3.4], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      style={{ width: "100%", height: "100%", background: "transparent", touchAction: "pan-y" }}
      onCreated={({ gl, camera }) => {
        gl.toneMappingExposure = 1.08;
        camera.lookAt(MODEL_OFFSET_X, -0.05, 0);
      }}
    >
      <Suspense fallback={null}>
        <ResponsiveCamera />
        <ambientLight intensity={1.4} color="#f4f7ff" />
        <spotLight
          position={[-8.5, 2.6, 0.6]}
          intensity={4.2}
          angle={0.32}
          penumbra={0.95}
          color="#c7b8a6"
        />
        <spotLight
          position={[-2.8, 2.1, 2.5]}
          intensity={2.4}
          angle={0.28}
          penumbra={0.85}
          color="#ffffff"
          castShadow={false}
        />
        <directionalLight position={[-7.2, 0.8, -1.8]} intensity={1.2} color="#e6f0ff" />
        <directionalLight position={[4.5, 2.2, 3.5]} intensity={1.6} color="#ffffff" />
        <pointLight position={[0, 1.8, 2.2]} intensity={1.5} color="#ffffff" />
        {ENABLE_HDRI ? (
          <Environment preset="studio" environmentIntensity={0.6} />
        ) : (
          <Environment environmentIntensity={0.6}>
            <Lightformer
              intensity={2}
              rotation-x={Math.PI / 2}
              position={[0, 3, 0]}
              scale={[6, 6, 1]}
            />
            <Lightformer
              intensity={1.2}
              position={[-4, 1.5, -2]}
              scale={[3, 2, 1]}
            />
            <Lightformer
              intensity={0.9}
              position={[4, 1, 2]}
              scale={[2.5, 2, 1]}
            />
          </Environment>
        )}
        <ModelBoundary onError={() => setModelFailed(true)}>
          <ChairModel animateIn={animateIn} />
        </ModelBoundary>
      </Suspense>
    </Canvas>
  );
}
