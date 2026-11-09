import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app/app-shell"
import { HubPage } from "@/pages/hub/hub-page"
import { NotFound } from "@/pages/not-found"
import { ThemeProvider } from "@/lib/theme"
import { ScenarioProvider } from "@/lib/scenario"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

const router = createBrowserRouter([
  {
    element: <AppShell />,
    // Shown for the instant the lazy register chunk loads on a direct visit.
    hydrateFallbackElement: <div className="min-h-[100dvh]" />,
    children: [
      { index: true, element: <HubPage /> },
      {
        path: "rejestry-vat",
        // The register (table, drag-and-drop, filters) loads as its own chunk.
        lazy: async () => ({ Component: (await import("@/pages/register/register-page")).RegisterPage }),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ScenarioProvider>
          <MotionConfig reducedMotion="user">
            <TooltipProvider delayDuration={250}>
              <RouterProvider router={router} />
            </TooltipProvider>
          </MotionConfig>
        </ScenarioProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
