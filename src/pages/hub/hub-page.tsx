import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchHub } from "@/data/api"
import { useScenario } from "@/lib/scenario"
import { AreaPills } from "./area-pills"
import { GlobalSearch } from "./global-search"
import { OverviewCards } from "./overview-cards"

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

export function useHubQuery() {
  const { scenario } = useScenario()
  return useQuery({
    queryKey: ["hub", scenario],
    queryFn: ({ signal }) => fetchHub(scenario, signal),
    retry: false,
    staleTime: 60_000,
  })
}

function DemoNotice() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-warn-tint px-3 text-xs font-semibold text-warn outline-none transition-colors hover:bg-warn-tint/80 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Info className="size-3.5" strokeWidth={2.2} />
          Mapa zakresu · DEMO
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-80 text-sm">
        <p className="font-semibold">To jest mapa zakresu, a nie uruchomienie księgowania.</p>
        <p className="mt-1 text-mute">Dane pozostają demonstracyjne.</p>
      </PopoverContent>
    </Popover>
  )
}

export function HubPage() {
  const hub = useHubQuery()

  useEffect(() => {
    document.title = "Obszary księgowe"
  }, [])

  return (
    <div className="pt-[clamp(2.5rem,1rem+7vh,6.5rem)]">
      <section className="mx-auto flex max-w-[760px] flex-col items-center text-center">
        <motion.div {...rise(0)} className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-accent">Ewidencje</span>
          <span aria-hidden className="h-3.5 w-px bg-hairline-strong" />
          <DemoNotice />
        </motion.div>
        <motion.h1
          {...rise(0.05)}
          className="mt-4 font-display text-[clamp(2.4rem,1.7rem+3.2vw,4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-balance"
        >
          Obszary księgowe
        </motion.h1>
        <motion.p {...rise(0.1)} className="mt-4 max-w-[54ch] text-[15px] text-mute text-pretty sm:text-base">
          Mapa dostępnych obszarów księgowych dla aktywnej organizacji.
        </motion.p>
        <motion.div {...rise(0.15)} className="mt-8 w-full sm:mt-10">
          <GlobalSearch />
        </motion.div>
        <div className="mt-5 w-full sm:mt-6">
          <AreaPills areas={hub.data?.areas} />
        </div>
      </section>

      <div className="mt-[clamp(3rem,2rem+5vh,5.5rem)]">
        <OverviewCards
          data={hub.data}
          isPending={hub.isPending}
          error={hub.error}
          onRetry={() => hub.refetch()}
          retrying={hub.isFetching}
        />
      </div>
    </div>
  )
}
