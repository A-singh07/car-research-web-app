import Link from "next/link";

const NAV_LINKS = [
  { href: "/quiz", label: "Take the quiz" },
  { href: "/compare", label: "Compare" },
  { href: "/tco", label: "Cost calculator" },
];

export function SiteHeader() {
  return (
    <header className="h-14 border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-40 flex items-center px-4 sm:px-6">
      <Link href="/" className="font-bold text-navy-900 text-sm tracking-tight">
        Car<span className="text-accent-500">Research</span>
      </Link>
      <nav className="ml-auto flex items-center gap-1 sm:gap-2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs sm:text-sm text-gray-600 hover:text-navy-800 px-2 sm:px-3 py-1.5 rounded-full hover:bg-navy-50 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
