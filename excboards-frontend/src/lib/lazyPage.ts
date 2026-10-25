import { lazy, type ComponentType } from "react";

const RELOAD_FLAG = "excboards-chunk-reload";

/** React.lazy for a named page export. If the chunk is gone (a deploy replaced the
 * hashed files while this tab was open), reload once to pick up the new index.html. */
export function lazyPage<T extends Record<string, unknown>, K extends keyof T>(
  load: () => Promise<T>,
  name: K,
) {
  return lazy(async () => {
    try {
      const module = await load();
      sessionStorage.removeItem(RELOAD_FLAG);
      return { default: module[name] as ComponentType };
    } catch (error) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw error;
    }
  });
}
