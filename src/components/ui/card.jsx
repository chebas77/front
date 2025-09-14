export function Card({ className = "", ...props }) {
  return <div className={`rounded-lg border border-border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
}
export function CardHeader({ className = "", ...props }) {
  return <div className={`p-4 border-b border-border ${className}`} {...props} />
}
export function CardTitle({ className = "", ...props }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
}
export function CardDescription({ className = "", ...props }) {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props} />
}
export function CardContent({ className = "", ...props }) {
  return <div className={`p-4 ${className}`} {...props} />
}
