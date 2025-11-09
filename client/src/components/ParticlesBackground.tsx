import { useEffect } from "react";
import { particlesConfig } from "@/lib/particles";

export function ParticlesBackground() {
  useEffect(() => {
    // Initialize tsParticles
    if (window.tsParticles) {
      window.tsParticles.load("particles-container", particlesConfig);
    }
  }, []);

  return (
    <div
      id="particles-container"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

declare global {
  interface Window {
    tsParticles: any;
  }
}
