## ADDED Requirements

### Requirement: Exclude pattern filtering before enqueue
The crawler SHALL check every candidate URL against the merged exclude pattern list before adding it to the crawl queue. Any URL whose pathname matches at least one pattern SHALL be silently skipped — not fetched, not recorded in the page list.

#### Scenario: Excluded URL not crawled
- **WHEN** crawler extracts link `https://example.com/cdn-cgi/rum` from a page
- **THEN** the URL is not enqueued and does not appear in crawl output

#### Scenario: Non-excluded URL crawled normally
- **WHEN** crawler extracts link `https://example.com/about`
- **THEN** the URL is enqueued and crawled as normal

#### Scenario: Exclusion applied before depth and limit checks
- **WHEN** URL matches an exclude pattern but crawl has not reached depth or page limit
- **THEN** URL is still skipped (exclude takes priority)
