import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">A</div>
          <span className="font-bold">Industrial Alignment Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app"><Button variant="ghost">Entrar al demo</Button></Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
