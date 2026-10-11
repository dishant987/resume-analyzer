export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-card/95 text-card-foreground border border-border shadow-xl rounded-xl p-3 text-xs backdrop-blur-md z-50 min-w-[140px]">
      {label && <p className="font-bold text-foreground mb-1.5 pb-1 border-b border-border/50">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const color = entry.color || entry.fill || entry.payload?.fill || 'var(--primary)'
          const value = entry.value
          const name = entry.name || entry.dataKey

          return (
            <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground font-medium truncate">{name}</span>
              </div>
              <span className="font-bold text-foreground shrink-0">{value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
