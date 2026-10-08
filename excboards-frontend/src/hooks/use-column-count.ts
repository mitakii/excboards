import * as React from "react"

// Tailwind sm / lg breakpoints, matching the board grid's previous columns-* classes
const TWO_COLUMNS_QUERY = "(min-width: 640px)"
const THREE_COLUMNS_QUERY = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  const queries = [TWO_COLUMNS_QUERY, THREE_COLUMNS_QUERY].map((q) =>
    window.matchMedia(q)
  )
  queries.forEach((mql) => mql.addEventListener("change", onChange))
  return () =>
    queries.forEach((mql) => mql.removeEventListener("change", onChange))
}

function getColumnCount() {
  if (window.matchMedia(THREE_COLUMNS_QUERY).matches) return 3
  if (window.matchMedia(TWO_COLUMNS_QUERY).matches) return 2
  return 1
}

/** Board grid column count for the current viewport; read synchronously so the first render is already right. */
export function useColumnCount() {
  return React.useSyncExternalStore(subscribe, getColumnCount, () => 1)
}
