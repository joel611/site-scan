## Context

The crawler currently has no URL-path exclusion mechanism beyond robots.txt. Sites commonly expose paths like `/cdn-cgi/*` (Cloudflare), `/wp-json/*` (WordPress REST API), `/.well-known/*` (ACME/security protocols), and `/wp-admin/*` (CMS admin) that are structural noise — they inflate the site graph with irrelevant nodes and slow crawls on large sites.

## Goals / Non-Goals

**Goals:**
- Ship a hardcoded default exclude list covering the most common noise paths
- Add `--exclude <glob>` CLI flag (repeatable) to append custom patterns at runtime
- Filter happens before enqueue — excluded URLs never enter the crawl queue

**Non-Goals:**
- Regex support (glob patterns only, simpler mental model)
- Allowing users to remove default patterns (no `--no-exclude-defaults` flag in this change)
- Persisting exclude lists to config files

## Decisions

### Decision: Glob matching via `minimatch`

**Choice**: Use the `minimatch` npm package for glob-to-regex conversion.

**Rationale**: Glob syntax (`/cdn-cgi/*`, `/*.json`) is familiar from `.gitignore`. Minimatch is battle-tested, already common in JS ecosystems, and handles edge cases (trailing slashes, `**`). Rolling a custom regex-based matcher adds unnecessary complexity.

**Alternative considered**: Plain `String.startsWith()` — rejected because it can't express patterns like `/wp-*.php` or `/**/_next`.

### Decision: Match against pathname only (not full URL)

**Choice**: Strip scheme + hostname before matching. Patterns apply to the URL path.

**Rationale**: Users write patterns like `/cdn-cgi/*` not `https://example.com/cdn-cgi/*`. Keeps patterns portable across domains. Consistent with how robots.txt Disallow works.

### Decision: Default exclude list (hardcoded)

Default patterns applied to every crawl:

| Pattern | Reason |
|---|---|
| `/cdn-cgi/*` | Cloudflare CDN internal helpers |
| `/.well-known/*` | Protocol-level URIs (ACME, security.txt) |
| `/wp-json/*` | WordPress REST API endpoints |
| `/wp-admin/*` | WordPress admin panel |

These four cover the most universally noisy paths on the web. More can be added as evidence accumulates.

### Decision: `--exclude` is additive, not replacement

User-supplied patterns merge with defaults rather than replacing them. Replacing defaults via CLI adds complexity; if a user needs to crawl `/wp-admin/*`, robots.txt bypass (`--no-robots`) already exists and that's a distinct concern.

## Risks / Trade-offs

- **False exclusions**: A pattern like `/feed/*` could exclude legitimate content pages on some sites. Keeping the default list conservative (only infra-level paths) mitigates this. → Users can use `--exclude` for site-specific patterns.
- **minimatch dependency**: Adds ~10KB to the bundle. Acceptable for a CLI tool. → Could be replaced later with a zero-dep implementation if needed.
- **No way to opt out of defaults**: Power users scanning `/wp-admin` intentionally have no flag. → Out of scope for this change; can add `--no-default-excludes` later.

## Open Questions

- None blocking implementation.
