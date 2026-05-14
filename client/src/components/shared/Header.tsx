import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, User } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Shop', href: '/ecommerce' },
    { label: 'Food', href: '/food' },
    { label: 'Rides', href: '/rides' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Dashboard', href: '/dashboard' },
  ];

  const notifications = [
    {
      id: 'n1',
      app: 'Biome',
      title: 'Price drop detected',
      message: 'Gaming Laptop Pro is ₹2,100 cheaper right now.',
      time: 'now',
      icon: '⚡',
      unread: true,
    },
    {
      id: 'n2',
      app: 'Deals',
      title: 'Coupon applied',
      message: 'We stacked 2 offers on your last search.',
      time: '2m',
      icon: '🎟️',
      unread: true,
    },
    {
      id: 'n3',
      app: 'Updates',
      title: 'New domain added',
      message: 'More results available for your next search.',
      time: '1h',
      icon: '🟦',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              ⚡
            </motion.div>
            <span className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Biome
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-amber-50 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[360px] rounded-2xl border border-amber-100 bg-white p-2 shadow-xl"
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold text-foreground">
                    Notifications
                  </DropdownMenuLabel>
                  <button className="text-xs font-medium text-amber-700 hover:text-amber-800">
                    Mark all read
                  </button>
                </div>
                <DropdownMenuSeparator className="bg-amber-100" />
                <div className="flex flex-col gap-2 p-2">
                  {notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="p-0 cursor-pointer focus:bg-transparent"
                    >
                      <div className="w-full rounded-xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/40 px-3 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">
                            {n.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-muted-foreground truncate">
                                {n.app}
                              </p>
                              <p className="text-[11px] text-muted-foreground shrink-0">
                                {n.time}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                              {n.title}
                            </p>
                            <p className="text-sm text-muted-foreground leading-snug mt-1 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                          {n.unread ? (
                            <span className="mt-1 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                          ) : null}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <Link
              href="/profile"
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <User className="w-5 h-5 text-muted-foreground" />
            </Link>

            {/* Auth Button */}
            <Link href="/auth">
              <Button className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                Sign In
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden pb-4 border-t border-amber-100"
          >
            <nav className="flex flex-col gap-2 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-amber-50 rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/auth">
                <Button className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  Sign In
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
