# Configuring Río AI: Document Ingestion

To make Río an expert on your community, you can upload official documents directly into its knowledge base. This uses **RAG (Retrieval-Augmented Generation)** to provide accurate, ground-truth answers.

## The Ingestion Portal

![Document Ingestion Portal](/screenshots/rio_admin_document_ingestion_step_1.png)
_Screenshot: Administrative Ingestion Portal_

### How to Ingest Documents:

1.  **Navigate**: Go to the **AI Ingestion** section in the Admin Dashboard.
2.  **Upload**: You can ingest rich-text pages or PDF files from the [Official Documents](../documents.md) repository (such as HOA bylaws, facility guides, move-in manuals, or amenity rules).
3.  **Process**: The system uses **LlamaParse** to extract structured information and **PgVector** to store it as searchable "embeddings."
4.  **Verify**: Monitor the status badge. Once it turns green ("Completed"), Río is ready to answer questions using that document.

## Feature Flags

Río's knowledge features can be toggled per community:

- **Río Enabled**: Master switch for the assistant.
- **RAG Enabled**: When off, Río won't search through community documents (answers only via general knowledge).
- **Memory Enabled**: When off, Río won't learn or recall resident-specific facts.

> [!TIP]
> For best results, ensure documents have clear text and hierarchical headings. Avoid scans of low-quality photocopies if possible.
