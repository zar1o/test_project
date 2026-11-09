import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchRegister } from "@/data/api"
import { paramsFromQuery, queryFromParams } from "@/data/register-logic"
import type { RegisterQuery } from "@/data/types"
import { useScenario } from "@/lib/scenario"

/** Register state lives in the URL: every view is linkable and survives reload. */
export function useRegisterParams() {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => queryFromParams(params), [params])
  const docId = params.get("dok")

  const update = useCallback(
    (patch: Partial<RegisterQuery>) => {
      setParams(
        (prev) => {
          const next = { ...queryFromParams(prev), ...patch }
          // Any change other than paging starts again from page one.
          if (!("page" in patch)) next.page = 1
          return paramsFromQuery(next)
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setDoc = useCallback(
    (id: string | null) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (id) p.set("dok", id)
          else p.delete("dok")
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { query, docId, update, setDoc }
}

export function useRegisterData(query: RegisterQuery) {
  const { scenario } = useScenario()
  return useQuery({
    queryKey: ["register", query, scenario],
    queryFn: ({ signal }) => fetchRegister(query, scenario, signal),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 30_000,
  })
}

export type RegisterData = ReturnType<typeof useRegisterData>
