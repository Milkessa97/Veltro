export function ThroughputIllustration() {
  const bars = [40, 55, 48, 70, 62, 85, 78]
  const days = ["M", "T", "W", "T", "F", "S", "S"]
  return (
    <div className="w-full h-full flex items-end justify-center px-6 pb-6">
      <svg viewBox="0 0 230 120" className="w-full h-full" role="img" aria-label="Weekly throughput bars">
        {bars.map((h, i) => {
          const x = 12 + i * 31
          const y = 100 - h
          const highlight = i === bars.length - 2
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width="18"
                height={h}
                rx="4"
                fill="hsl(var(--primary))"
                fillOpacity={highlight ? "1" : "0.35"}
              />
              <text x={x + 9} y="114" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                {days[i]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
