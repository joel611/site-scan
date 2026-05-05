import { test, expect, describe } from "bun:test"
import { DEFAULT_EXCLUDE_PATTERNS, isExcluded } from "./exclude-patterns"

describe("isExcluded", () => {
  test("exact path match", () => {
    expect(isExcluded("/cdn-cgi/rum", ["/cdn-cgi/rum"])).toBe(true)
  })

  test("/** matches any depth under prefix", () => {
    expect(isExcluded("/wp-admin/edit.php", ["/wp-admin/**"])).toBe(true)
    expect(isExcluded("/wp-admin/", ["/wp-admin/**"])).toBe(true)
    expect(isExcluded("/wp-json/wp/v2/posts", ["/wp-json/**"])).toBe(true)
  })

  test("/** does not match sibling paths", () => {
    expect(isExcluded("/cdn-cgi-info", ["/cdn-cgi/**"])).toBe(false)
    expect(isExcluded("/about", ["/cdn-cgi/**"])).toBe(false)
  })

  test("no match returns false", () => {
    expect(isExcluded("/blog/post-1", ["/cdn-cgi/**", "/wp-admin/**"])).toBe(false)
  })

  test("multiple patterns — first match wins", () => {
    expect(isExcluded("/api/users", ["/blog/**", "/api/**", "/static/**"])).toBe(true)
  })

  test("empty pattern list never excludes", () => {
    expect(isExcluded("/cdn-cgi/rum", [])).toBe(false)
  })

  test("DEFAULT_EXCLUDE_PATTERNS contains expected entries", () => {
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("/cdn-cgi/**")
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("/.well-known/**")
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("/wp-json/**")
    expect(DEFAULT_EXCLUDE_PATTERNS).toContain("/wp-admin/**")
  })
})
