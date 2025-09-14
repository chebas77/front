export default function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Industrial Alignment Pro</span>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacidad</a>
          <a href="#" className="hover:underline">Términos</a>
        </div>
      </div>
    </footer>
  )
}
