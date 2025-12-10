export function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card/20 to-muted/10" />

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-accent/5 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-primary/3 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* New CSS-based jumping dots loader */}
        <div className="loader">
          <div className="loader__circle"></div>
          <div className="loader__circle"></div>
          <div className="loader__circle"></div>
          <div className="loader__circle"></div>
          <div className="loader__circle"></div>
        </div>
      </div>

      <style>{`
        .loader {
          position: relative;
          display: flex;
          gap: 0.3em;
        }

        .loader::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 2em;
          filter: blur(45px);
          background-color: #e299ff;
          background-image: radial-gradient(at 52% 57%, hsla(11,83%,72%,1) 0px, transparent 50%),
            radial-gradient(at 37% 57%, hsla(175,78%,66%,1) 0px, transparent 50%);
        }

        .loader__circle {
          --size__loader: 0.6em;
          width: var(--size__loader);
          height: var(--size__loader);
          border-radius: 50%;
          animation: loader__circle__jumping 2s infinite;
          background-color: #b499ff;
        }

        .loader__circle:nth-child(2n) {
          animation-delay: 300ms;
          background-color: #e499ff;
        }

        .loader__circle:nth-child(3n) {
          animation-delay: 600ms;
        }

        @keyframes loader__circle__jumping {
          0%, 100% {
            transform: translateY(0px);
          }
          25% {
            transform: translateY(-15px) scale(0.5);
          }
          50% {
            transform: translateY(0px);
          }
          75% {
            transform: translateY(5px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}
