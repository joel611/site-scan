import { test, expect, describe } from "bun:test"
import { extractLinks } from "./crawler"

const BASE = "https://example.com/page"

function html(body: string) {
  return `<html><body>${body}</body></html>`
}

describe("extractLinks - header/footer/nav filtering (default: on)", () => {
  test("1.2 excludes links inside <header>", () => {
    const result = extractLinks(
      html(`<header><a href="/about">About</a></header><main><a href="/blog">Blog</a></main>`),
      BASE,
      false,
      false
    )
    expect(result).not.toContain("https://example.com/about")
    expect(result).toContain("https://example.com/blog")
  })

  test("1.3 excludes links inside <footer>", () => {
    const result = extractLinks(
      html(`<footer><a href="/contact">Contact</a></footer><main><a href="/blog">Blog</a></main>`),
      BASE,
      false,
      false
    )
    expect(result).not.toContain("https://example.com/contact")
    expect(result).toContain("https://example.com/blog")
  })

  test("1.4 excludes links inside <nav>", () => {
    const result = extractLinks(
      html(`<nav><a href="/products">Products</a></nav><article><a href="/blog">Blog</a></article>`),
      BASE,
      false,
      false
    )
    expect(result).not.toContain("https://example.com/products")
    expect(result).toContain("https://example.com/blog")
  })

  test("1.5 retains links in <main> and <article>", () => {
    const result = extractLinks(
      html(`<main><article><a href="/related">Related</a></article></main>`),
      BASE,
      false,
      false
    )
    expect(result).toContain("https://example.com/related")
  })

  test("1.6 --no-filter-nav includes all links", () => {
    const result = extractLinks(
      html(`<header><a href="/about">About</a></header><footer><a href="/contact">Contact</a></footer>`),
      BASE,
      false,
      true
    )
    expect(result).toContain("https://example.com/about")
    expect(result).toContain("https://example.com/contact")
  })
})
