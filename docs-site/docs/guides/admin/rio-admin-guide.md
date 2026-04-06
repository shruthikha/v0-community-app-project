# Administrator Guide: Configuring Río AI

Río AI's behavior and knowledge can be customized for each community. This guide explains how Administrators can manage Río's persona, community-specific policies, and document-based knowledge (RAG).

## 1. Persona and Tone Configuration

Administrators can tailor Río's "voice" to match the community's culture. These settings form **Tier 2** of the 3-Tier Prompt Model, overriding or supplementing Río's base instructions.

![Río Persona Config Part 1](/screenshots/rio_admin_agent_persona_step_1.png)
_Screenshot: Persona and Tone Settings_

### Configuration Fields:
- **Prompt Persona**: Define Río's specific character traits (e.g., "A formal concierge" vs. "A laid-back neighbor").
- **Community Policies**: Highlight important local rules (e.g., "Quiet hours are 10 PM - 7 AM").
- **Emergency Contacts**: Provide local numbers that Río should surface in urgent situations.
- **Sign-off Message**: A mandatory phrase that Río will include at the end of its responses.

![Río Persona Config Part 2](/screenshots/rio_admin_agent_persona_step_2.png)
_Screenshot: Policies and Emergency Contacts_

---

## 2. Document Ingestion (RAG)

To make Río an expert on your community, you can upload official documents directly into its knowledge base. This is managed via the **Administrative Document Ingestion** portal.

![Document Ingestion Portal](/screenshots/rio_admin_document_ingestion_step_1.png)
_Screenshot: Administrative Ingestion Portal_

### How to Ingest Documents:
1.  Navigate to the **AI Ingestion** section in the Backoffice.
2.  Upload PDFs or text documents (e.g., HOA bylaws, facility guides, move-in manuals).
3.  The system will automatically parse and embed these documents into the **Vector Store**.
4.  Once ingested, Río will be able to provide accurate, cited answers based on these sources.

> [!TIP]
> Documents should be well-structured with clear headings for best retrieval results.

---

## 3. Monitoring & Feature Flags

Río can be enabled or disabled per tenant via the **Feature Flags** section.

- **Río Enabled**: Toggle the entire AI assistant.
- **RAG Enabled**: Toggle the ability for Río to search through community-uploaded documents.
- **Memory Enabled**: Toggle the ability for Río to remember resident-specific facts.
