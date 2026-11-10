import { useState } from "react"
import { Link, useLocation } from "react-router"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCheck,
  ChevronDown,
  Info,
  LogOut,
  Moon,
  Sun,
  TriangleAlert,
} from "lucide-react"
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
import { NOTIFICATIONS, ORGANIZATION, USER } from "@/data/fixtures"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/**
 * The account picture: a white head-and-shoulders figure on a soft grey disc,
 * in the manner of the system default on Apple platforms. The figure is cut
 * off by the disc, which is what makes it read as a portrait, not an icon.
 */
export function UserAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block size-10 shrink-0 overflow-hidden rounded-full bg-[linear-gradient(180deg,#b7b4d6,#8a86b4)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35),0_1px_2px_rgb(var(--shadow-ink)/0.18)] dark:bg-[linear-gradient(180deg,#8f8ac4,#5c5796)]",
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="size-full" fill="#fff">
        <circle cx="20" cy="15.4" r="7.1" />
        <path d="M20 25.2c-7.3 0-13.2 4.9-13.2 12.2V41h26.4v-3.6c0-7.3-5.9-12.2-13.2-12.2Z" />
      </svg>
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
      title={dark ? "Motyw ciemny" : "Motyw jasny"}
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
                  {n.tone === "attention" ? (
                    <TriangleAlert
                      aria-hidden
                      className={cn("mt-0.5 size-4 shrink-0", isRead ? "text-stone" : "text-warn")}
                      strokeWidth={2.1}
                    />
                  ) : (
                    <Info
                      aria-hidden
                      className={cn("mt-0.5 size-4 shrink-0", isRead ? "text-stone" : "text-ink-2")}
                      strokeWidth={2.1}
                    />
                  )}
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

/** What the bar says on each page: its name, a line of context, and the way back. */
const PAGES: Record<string, { title: string; note: string; back?: string }> = {
  // The greeting itself is on the page (hub-page.tsx), so the bar names the organisation.
  "/": { title: "Obszary księgowe", note: ORGANIZATION },
  "/rejestry-vat": { title: "Rejestry i VAT", note: ORGANIZATION, back: "Obszary księgowe" },
}

/**
 * The left of the bar says where you are. The title here is the page's <h1>,
 * so every page can start with its content right under the navigation.
 */
function Wayfinding() {
  const { pathname } = useLocation()
  const page = PAGES[pathname]
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={page?.title ?? "elsewhere"}
        initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
        className="flex min-w-0 items-center gap-2.5"
      >
        {page ? (
          <>
            {page.back && (
              <Button variant="glass" size="icon" asChild className="-ml-1 sm:-ml-1.5">
                <Link to="/" aria-label={`Wróć do: ${page.back}`} title={page.back}>
                  <ArrowLeft strokeWidth={2} />
                </Link>
              </Button>
            )}
            <div className="min-w-0 leading-tight">
              <h1 className="truncate font-display text-[17px] font-medium tracking-[-0.01em] sm:text-xl">{page.title}</h1>
              <p className="hidden truncate text-xs text-mute sm:block">{page.note}</p>
            </div>
          </>
        ) : (
          <Link
            to="/"
            className="truncate rounded-full font-display text-[17px] font-medium tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-xl"
          >
            Obszary księgowe
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export function TopBar() {
  return (
    <header className="no-print sticky top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),10px)] sm:px-5 sm:pt-4">
      <div className="glass mx-auto flex h-16 max-w-[1200px] items-center gap-3 rounded-full pl-5 pr-2.5 sm:pl-6">
        <Wayfinding />
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
