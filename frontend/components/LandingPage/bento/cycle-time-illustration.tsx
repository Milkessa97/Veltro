export function CycleTimeIllustration() {
  const points = [
    [10, 80],
    [45, 60],
    [80, 68],
    [115, 40],
    [150, 48],
    [185, 26],
    [220, 30],
  ]
  const line = points.map((p) => p.join(",")).join(" ")
  const area = `${line} 220,110 10,110`

  return (
    <div className="w-full h-full flex items-end px-6 pb-6">
      <svg viewBox="0 0 230 120" className="w-full h-full" role="img" aria-label="Cycle time trending down">
        <defs>
          <linearGradient id="ct-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 55, 80, 105].map((y) => (
          <line key={y} x1="10" y1={y} x2="220" y2={y} stroke="hsl(var(--foreground))" strokeOpacity="0.08" strokeWidth="1" />
        ))}
        <polygon points={area} fill="url(#ct-fill)" />
        <polyline points={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4 : 2.5} fill="hsl(var(--primary))" />
        ))}
      </svg>
    </div>
  )
}
