'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Configurable rotation amount (in degrees)
const ROTATION_AMOUNT = 360;

// Reduced layer count for optimal scroll rendering performance
const THICKNESS_LAYERS = 0;

interface VeltroLogoAnimationProps {
  logoSrc?: string;
  className?: string;
}

export default function VeltroLogoAnimation({
  logoSrc = '/veltro-v-mark.svg',
  className = '',
}: VeltroLogoAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current || !logoWrapperRef.current) return;

      // 3D Y-axis rotation tied to scroll
      gsap.to(logoWrapperRef.current, {
        rotateY: ROTATION_AMOUNT,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        }
      });

    });

    return () => ctx.revert();
  }, []);

  // Generate thickness layers for 3D extrusion
  const thicknessLayers = Array.from({ length: THICKNESS_LAYERS }, (_, i) => {
    const offset = (i + 1) * 2;
    const opacity = 0.15 - (i * 0.025);
    return { offset, opacity, key: i };
  });

  return (
    <div
      ref={containerRef}
      className={`veltro-logo-container ${className}`}
    >
      {/* Fixed Logo Overlay */}
      <div className="veltro-logo-viewport">
        <div ref={logoWrapperRef} className="veltro-logo-wrapper">
          {/* Thickness layers (3D extrusion) */}
          {thicknessLayers.map(({ offset, opacity, key }) => (
            <div
              key={key}
              className="veltro-logo-layer"
              style={{
                transform: `translateZ(-${offset}px) translate3d(0,0,0)`,
                opacity,
              }}
            >
              <img src={logoSrc} alt="" className="veltro-logo-image" draggable={false} />
            </div>
          ))}

          {/* Outline (empty state) */}
          <div className="veltro-logo-outline">
            <img src={logoSrc} alt="" className="veltro-logo-image" draggable={false} />
          </div>

          {/* Filled version kept in initial state */}
          <div className="veltro-logo-filled">
            <img src={logoSrc} alt="Veltro" className="veltro-logo-image" draggable={false} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .veltro-logo-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          will-change: transform;
        }

        .veltro-logo-viewport {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1400px;
          opacity: 0.45;
          filter: blur(3px);
          will-change: transform, filter;
          transform: translate3d(0, 0, 0);
        }

        .veltro-logo-wrapper {
          position: relative;
          width: clamp(320px, 45vw, 760px);
          height: clamp(288px, 40.5vw, 684px);
          transform-style: preserve-3d;
          transform: scale(1.08);
          will-change: transform;
        }

        .veltro-logo-layer,
        .veltro-logo-outline,
        .veltro-logo-filled {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          transform: translate3d(0, 0, 0);
        }

        .veltro-logo-outline {
          opacity: 0.08;
          filter: blur(2px);
        }

        .veltro-logo-filled {
          filter: blur(1px);
        }

        .veltro-logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}
