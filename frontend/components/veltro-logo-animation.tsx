'use client';

interface VeltroLogoAnimationProps {
  logoSrc?: string;
  className?: string;
}

export default function VeltroLogoAnimation({
  logoSrc = '/veltro-v-mark.svg',
  className = '',
}: VeltroLogoAnimationProps) {
  return (
    <div className={`veltro-logo-container ${className}`}>
      <div className="veltro-logo-viewport">
        {/* Glow background behind the logo */}
        <div className="veltro-logo-glow" />

        <div className="veltro-logo-wrapper">
          <img src={logoSrc} alt="Veltro" className="veltro-logo-image" draggable={false} />
        </div>
      </div>

      <style jsx>{`
        .veltro-logo-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .veltro-logo-viewport {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }

        /* Radial glow behind the logo */
        .veltro-logo-glow {
          position: absolute;
          width: min(700px, 90vw);
          height: min(700px, 90vw);
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(99, 102, 241, 0) 70%);
          pointer-events: none;
          z-index: -1;
          filter: blur(50px);
        }

        .veltro-logo-wrapper {
          position: relative;
          width: clamp(320px, 45vw, 760px);
          height: clamp(288px, 40.5vw, 684px);
          filter: blur(4px) drop-shadow(0 0 25px rgba(99, 102, 241, 0.2));
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

