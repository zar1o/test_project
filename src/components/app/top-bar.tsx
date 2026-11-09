import { useState } from "react"
import { Link } from "react-router"
import { AnimatePresence, motion } from "motion/react"
import { Bell, Building2, CheckCheck, ChevronDown, LogOut, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusDot } from "@/components/ui/chip"
import { NOTIFICATIONS, ORGANIZATION, USER } from "@/data/fixtures"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

export function AppMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[radial-gradient(circle_at_50%_15%,#7FBF9A,#B7D98E_60%,#CFE9F0)] shadow-[inset_0_1px_0_rgb(255_255_255/0.7),inset_0_0_0_1px_rgb(255_255_255/0.45)]",
        className,
      )}
    >
      <svg viewBox="0 0 20 20" className="size-[18px] text-[#191c1f]" fill="none">
        <path d="M4 6h12M4 10h12M4 14h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_210deg,#7FBF9A,#CFE9F0,#B7D98E,#7FBF9A)] text-[13px] font-semibold text-[#14301f] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.75)] dark:shadow-[inset_0_0_0_2px_rgb(255_255_255/0.2)]",
        className,
      )}
    >
      PR
    </span>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === "dark"
  return (
    <Button
      variant="glass"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
      title={dark ? "Jasny motyw" : "Ciemny motyw"}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="grid place-items-center"
        >
          {dark ? <Moon strokeWidth={1.9} /> : <Sun strokeWidth={1.9} />}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}

function Notifications() {
  const [read, setRead] = useState<Set<string>>(new Set())
  const unread = NOTIFICATIONS.filter((n) => !read.has(n.id)).length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="glass"
          size="icon"
          aria-label={unread ? `Powiadomienia, nieprzeczytane: ${unread}` : "Powiadomienia"}
        >
          <Bell strokeWidth={1.9} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                className="tnum absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger-dot px-1 text-[11px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--canvas)]"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-2">
        <div className="flex items-center justify-between px-3 pb-1 pt-2">
          <p className="font-display text-lg font-medium">Powiadomienia</p>
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => setRead(new Set(NOTIFICATIONS.map((n) => n.id)))}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-tint disabled:text-stone disabled:hover:bg-transparent"
          >
            <CheckCheck className="size-4" />
            Oznacz jako przeczytane
          </button>
        </div>
        <ul className="mt-1">
          {NOTIFICATIONS.map((n) => {
            const isRead = read.has(n.id)
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setRead((s) => new Set(s).add(n.id))}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-fill-hover"
                >
                  <StatusDot
                    tone={isRead ? "neutral" : n.tone === "attention" ? "attention" : "accent"}
                    className={cn("mt-1.5 shrink-0", isRead && "opacity-40")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-snug", isRead ? "text-mute" : "font-semibold text-ink")}>
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-mute">
                      {n.context} · {n.time}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Konto: ${USER.name}`}
          className="group flex h-11 items-center gap-3 rounded-full pl-1 pr-1 outline-none transition-colors hover:bg-fill focus-visible:ring-2 focus-visible:ring-accent md:pl-4 md:pr-1.5"
        >
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-sm font-semibold text-ink">{USER.name}</span>
            <span className="block text-xs text-mute">{USER.role}</span>
          </span>
          <UserAvatar />
          <ChevronDown className="hidden size-4 text-mute transition-transform duration-200 group-data-[state=open]:rotate-180 md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
          <UserAvatar />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{USER.name}</p>
            <p className="text-xs text-mute">{USER.role}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Aktywna organizacja</DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Building2 />
          <span className="truncate">{ORGANIZATION}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut />
          Wyloguj się
          <span className="ml-auto text-xs font-medium text-stone">demo</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBar() {
  return (
    <header className="no-print sticky top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),10px)] sm:px-5 sm:pt-4">
      <div className="glass mx-auto flex h-16 max-w-[1200px] items-center gap-3 rounded-full pl-3 pr-2.5 sm:pl-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Obszary księgowe — strona główna">
          <AppMark />
          <span className="truncate font-display text-[17px] font-medium tracking-[-0.01em] sm:text-xl">
            <span className="sm:hidden">Witaj, {USER.name.split(" ")[0]}!</span>
            <span className="hidden sm:inline">Witaj, {USER.name}!</span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Notifications />
          <span aria-hidden className="mx-1 hidden h-7 w-px bg-hairline-strong md:block" />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}
