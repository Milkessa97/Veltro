'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [animationMode, setAnimationMode] = useState<'scroll' | 'auto' | 'static'>('scroll');

  useEffect(() => {
    const checkPreferences = () => {
      if (typeof window === 'undefined') return;

      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const sizeQuery = window.matchMedia('(max-width: 1023px)');

      if (motionQuery.matches) {
        setAnimationMode('static');
      } else if (sizeQuery.matches) {
        setAnimationMode('auto');
      } else {
        setAnimationMode('scroll');
      }
    };

    checkPreferences();

    const mediaQueryList = window.matchMedia('(max-width: 1023px)');
    const motionQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');

    const listener = () => checkPreferences();

    mediaQueryList.addEventListener('change', listener);
    motionQueryList.addEventListener('change', listener);

    return () => {
      mediaQueryList.removeEventListener('change', listener);
      motionQueryList.removeEventListener('change', listener);
    };
  }, []);

  useEffect(() => {
    if (animationMode !== 'scroll') return;

    const ctx = gsap.context(() => {
      if (!containerRef.current || !logoWrapperRef.current) return;

      // 3D Y-axis rotation tied to scroll (Desktop only)
      gsap.to(logoWrapperRef.current, {
        rotateY: ROTATION_AMOUNT,
        scale: 1.08,
        ease: 'none',
        force3D: true, // Force hardware acceleration
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
        }
      });
    });

    return () => ctx.revert();
  }, [animationMode]);

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
        {/* Glow background behind the logo (replaces heavy blur filters) */}
        <div className="veltro-logo-glow" />

        <div
          ref={logoWrapperRef}
          className={`veltro-logo-wrapper ${
            animationMode === 'auto' ? 'veltro-logo-auto-rotate' : ''
          }`}
        >
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
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }

        /* Beautiful radial glow behind the logo that doesn't rotate (high performance) */
        .veltro-logo-glow {
          position: absolute;
          width: min(650px, 85vw);
          height: min(650px, 85vw);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
          pointer-events: none;
          z-index: -1;
          will-change: transform;
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

        /* Smooth hardware-accelerated auto-rotation for mobile/tablet fallback */
        .veltro-logo-auto-rotate {
          animation: veltro-spin-animation 30s linear infinite;
        }

        @keyframes veltro-spin-animation {
          from {
            transform: rotateY(0deg) scale(1.08);
          }
          to {
            transform: rotateY(360deg) scale(1.08);
          }
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
        }

        .veltro-logo-filled {
          opacity: 1;
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
