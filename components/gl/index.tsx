import { useEffect, useMemo, useState } from "react";
import { Effects } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";
import { supportsWebGL } from "@/lib/webgl";

const PARTICLE_SETTINGS = {
  speed: 1.0,
  noiseScale: 0.6,
  noiseIntensity: 0.52,
  timeScale: 1.0,
  focus: 3.8,
  aperture: 1.79,
  pointSize: 10.0,
  opacity: 0.8,
  planeScale: 10.0,
  vignetteDarkness: 1.5,
  vignetteOffset: 0.4,
  useManualTime: false,
  manualTime: 0,
} as const;

export const GL = ({
  hovering,
  intensity = 1,
}: {
  hovering: boolean;
  intensity?: number;
}) => {
  const [canRender, setCanRender] = useState(false);
  const [particleSize, setParticleSize] = useState<256 | 512 | 1024>(512);
  const containerStyle = useMemo(() => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    return {
      filter: `brightness(${1 + clampedIntensity * 0.35}) saturate(${1 + clampedIntensity * 1.0}) contrast(${1 + clampedIntensity * 0.2}) blur(${(1 - clampedIntensity) * 4}px)`,
      opacity: 0.6 + clampedIntensity * 0.4,
      willChange: "filter, opacity",
    } as const;
  }, [intensity]);

  useEffect(() => {
    setCanRender(supportsWebGL());
  }, []);

  useEffect(() => {
    const updateParticleSize = () => {
      if (window.innerWidth < 768) {
        setParticleSize(256);
      } else {
        setParticleSize(512);
      }
    };

    updateParticleSize();
    window.addEventListener("resize", updateParticleSize);
    return () => window.removeEventListener("resize", updateParticleSize);
  }, []);

  return (
    <div id="webgl" style={containerStyle} aria-hidden="true">
      {!canRender ? (
        <div className="h-full w-full bg-[#232730]" />
      ) : (
        <Canvas
          camera={{
            position: [
              1.2629783123314589, 2.664606471394044, -1.8178993743288914,
            ],
            fov: 50,
            near: 0.01,
            far: 300,
          }}
          dpr={[1, 1.35]}
        >
          {/* <Perf position="top-left" /> */}
          <color attach="background" args={["#232730"]} />
          <Particles
            speed={PARTICLE_SETTINGS.speed}
            aperture={PARTICLE_SETTINGS.aperture}
            focus={PARTICLE_SETTINGS.focus}
            size={particleSize}
            noiseScale={PARTICLE_SETTINGS.noiseScale}
            noiseIntensity={PARTICLE_SETTINGS.noiseIntensity}
            timeScale={PARTICLE_SETTINGS.timeScale}
            pointSize={PARTICLE_SETTINGS.pointSize}
            opacity={PARTICLE_SETTINGS.opacity}
            planeScale={PARTICLE_SETTINGS.planeScale}
            useManualTime={PARTICLE_SETTINGS.useManualTime}
            manualTime={PARTICLE_SETTINGS.manualTime}
            introspect={hovering}
          />
          <Effects multisamping={0} disableGamma>
            <shaderPass
              args={[VignetteShader]}
              uniforms-darkness-value={PARTICLE_SETTINGS.vignetteDarkness}
              uniforms-offset-value={PARTICLE_SETTINGS.vignetteOffset}
            />
          </Effects>
        </Canvas>
      )}
    </div>
  );
};
