export function ReviewFlowIllustration() {
  const stages = ["Open", "Review", "Approved", "Merged"]
  return (
    <div className="w-full h-full flex items-center justify-center px-6 pb-6">
      <svg viewBox="0 0 240 120" className="w-full h-full" role="img" aria-label="Review flow between stages">
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={40 + i * 60}
            y1="40"
            x2={70 + i * 60}
            y2="40"
            stroke="hsl(var(--primary))"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        ))}
        {stages.map((s, i) => (
          <g key={s}>
            <circle
              cx={30 + i * 60}
              cy="40"
              r="14"
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeOpacity={i === stages.length - 1 ? "1" : "0.5"}
              strokeWidth="2"
            />
            <circle cx={30 + i * 60} cy="40" r="4" fill="hsl(var(--primary))" fillOpacity={i === stages.length - 1 ? "1" : "0.6"} />
            <text x={30 + i * 60} y="72" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {s}
            </text>
          </g>
        ))}
        <rect x="14" y="92" width="212" height="14" rx="7" fill="hsl(var(--foreground))" fillOpacity="0.08" />
        <rect x="14" y="92" width="150" height="14" rx="7" fill="hsl(var(--primary))" fillOpacity="0.5" />
      </svg>
    </div>
  )
}
