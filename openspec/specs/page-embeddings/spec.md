# Page Embeddings

## Purpose

Extracts visible text from each crawled page and computes 384-dimensional embedding vectors using a local transformer model, enabling semantic subclustering. Embeddings are internal and stripped before serialization.

## Requirements

### Requirement: Text extraction per crawled page
During graph construction post-processing, the system SHALL extract visible text from each crawled page's HTML. Extraction SHALL strip HTML tags, navigation/header/footer elements (matching existing high-indegree/header-footer detection), and script/style blocks. The extracted text SHALL be truncated to 512 tokens for embedding.

#### Scenario: Text extracted from body
- **WHEN** a page has a `<main>` or `<article>` element
- **THEN** extracted text is taken from that element's inner text content

#### Scenario: Fallback to body
- **WHEN** no `<main>` or `<article>` element exists
- **THEN** extracted text is the full `<body>` inner text, with script/style stripped

#### Scenario: Text truncated to 512 tokens
- **WHEN** extracted text exceeds 512 tokens
- **THEN** only the first 512 tokens are used for embedding

### Requirement: Vector embedding generation
The system SHALL compute a 384-dimensional embedding vector for each page using the `all-MiniLM-L6-v2` model loaded via `@xenova/transformers`. Embeddings SHALL be computed after all pages are crawled, in a single batch pass.

#### Scenario: Embedding generated
- **WHEN** page text is non-empty
- **THEN** node receives a `_embedding: number[]` field (internal, not serialized)

#### Scenario: Empty page skipped
- **WHEN** page text extraction yields an empty string
- **THEN** node `_embedding` is `null`; `subcluster` will be `null`

### Requirement: Embedding stripped before serialization
The `_embedding` field SHALL be deleted from all nodes before the graph data is serialized to JSON output.

#### Scenario: Output contains no embeddings
- **WHEN** the HTML report is generated
- **THEN** no node in the JSON payload contains an `_embedding` field

### Requirement: Embeddings skippable via flag
When the `--no-embeddings` flag is passed to the CLI, the system SHALL skip text extraction and embedding computation entirely. All nodes receive `subcluster: null`.

#### Scenario: Skip flag disables embeddings
- **WHEN** CLI is invoked with `--no-embeddings`
- **THEN** `subcluster` is `null` for all nodes and no model is loaded
