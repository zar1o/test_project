import type { QueryClient } from "@tanstack/react-query"
import type { Scenario } from "@/lib/scenario"
import { fetchHub, fetchRegister } from "./api"
import { queryFromParams } from "./register-logic"

/**
 * Start loading what the destination page will ask for, before it mounts.
 * Keys and stale times mirror the pages' own queries (useHubQuery,
 * useRegisterData), so the page picks the result up instead of refetching.
 */
export function prefetchDestination(
  queryClient: QueryClient,
  to: { pathname: string; search: string },
  scenario: Scenario,
) {
  if (to.pathname === "/") {
    void queryClient.prefetchQuery({
      queryKey: ["hub", scenario],
      queryFn: ({ signal }) => fetchHub(scenario, signal),
      staleTime: 60_000,
    })
  } else if (to.pathname === "/rejestry-vat") {
    void import("@/pages/register/register-page")
    const query = queryFromParams(new URLSearchParams(to.search))
    void queryClient.prefetchQuery({
      queryKey: ["register", query, scenario],
      queryFn: ({ signal }) => fetchRegister(query, scenario, signal),
      staleTime: 30_000,
    })
  }
}
