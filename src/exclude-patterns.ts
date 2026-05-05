import { minimatch } from "minimatch"

export const DEFAULT_EXCLUDE_PATTERNS: string[] = [
  "/cdn-cgi/**",
  "/.well-known/**",
  "/wp-json/**",
  "/wp-admin/**",
]

export function isExcluded(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3)
      return pathname === prefix || pathname.startsWith(prefix + "/")
    }
    return minimatch(pathname, pattern)
  })
}
