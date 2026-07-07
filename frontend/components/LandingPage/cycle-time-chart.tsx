"use client"

import { useState } from "react"

export function CycleTimeChart({ data, labels }: { data: number[]; labels: string[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const w = 640
  const h = 240
  const padX = 32
  const padY = 28
  const max = Math.max(...data) * 1.1
  const min = Math.min(...data) * 0.85
  const range = max - min || 1

  const x = (i: number) => padX + (i * (w - padX * 2)) / (data.length - 1)
  const y = (v: number) => padY + (h - padY * 2) * (1 - (v - min) / range)

  const linePts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const areaPts = `${linePts} ${x(data.length - 1)},${h - padY} ${x(0)},${h - padY}`

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full font-sans"
        role="img"
        aria-label="Cycle time over the last eight weeks"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const gy = padY + (h - padY * 2) * t
          return (
            <line
              key={t}
              x1={padX}
              y1={gy}
              x2={w - padX}
              y2={gy}
              stroke="hsl(var(--foreground))"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          )
        })}

        <polygon points={areaPts} fill="url(#chart-fill)" />
        <polyline
          points={linePts}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((v, i) => (
          <g key={i}>
            <rect
              x={x(i) - (w - padX * 2) / (data.length - 1) / 2}
              y={0}
              width={(w - padX * 2) / (data.length - 1)}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            <circle
              cx={x(i)}
              cy={y(v)}
              r={hover === i ? 5 : 3}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
            />
            <text x={x(i)} y={h - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
              {labels[i]}
            </text>
          </g>
        ))}

        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              y1={padY}
              x2={x(hover)}
              y2={h - padY}
              stroke="hsl(var(--primary))"
              strokeOpacity="0.35"
              strokeDasharray="3 3"
            />
            <rect x={x(hover) - 26} y={y(data[hover]) - 32} width="52" height="22" rx="6" fill="hsl(var(--foreground))" />
            <text
              x={x(hover)}
              y={y(data[hover]) - 17}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="hsl(var(--background))"
            >
              {data[hover]}h
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
