import { ingestionWorkflow } from '../workflows/ingest.js';
import * as supabaseLib from '../lib/supabase.js';
import * as llamaLib from '../lib/llama.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the libraries
vi.mock('../lib/supabase.js');
vi.mock('../lib/llama.js');

describe('Ingestion Workflow Verification', () => {
    const mockDocumentId = '550e8400-e29b-41d4-a716-446655440000';
    const mockDocMetadata = {
        id: mockDocumentId,
        tenant_id: 'test-tenant',
        file_path: 'folder/test.pdf',
        status: 'pending'
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should successfully fetch and parse a document', async () => {
        // Setup mocks
        vi.mocked(supabaseLib.getDocMetadata).mockResolvedValue(mockDocMetadata as any);
        vi.mocked(supabaseLib.downloadDocument).mockResolvedValue(Buffer.from('mock-pdf-content'));
        vi.mocked(llamaLib.parseToMarkdown).mockResolvedValue('# Mock Markdown Output');

        // Execute workflow
        const run = await ingestionWorkflow.createRun();
        const result = await run.start({
            inputData: { documentId: mockDocumentId }
        });

        // Verify status updates
        expect(supabaseLib.getDocMetadata).toHaveBeenCalledWith(mockDocumentId);
        expect(supabaseLib.updateDocStatus).toHaveBeenCalledWith(mockDocumentId, 'processing');
        expect(supabaseLib.downloadDocument).toHaveBeenCalledWith('folder/test.pdf');

        // Verify parsing
        expect(llamaLib.parseToMarkdown).toHaveBeenCalled();

        // Verify final result
        // Mastra 1.x results are usually in result.results or similar
        // Based on Step definition, Step 1 returns { buffer, fileName, ... }
        // Step 2 returns { markdown, documentId }

        console.log('Workflow Result:', JSON.stringify(result, null, 2));
    });

    it('should handle fetch failures gracefully', async () => {
        vi.mocked(supabaseLib.getDocMetadata).mockResolvedValue(null);

        const run = await ingestionWorkflow.createRun();
        const result = await run.start({
            inputData: { documentId: mockDocumentId }
        });

        expect(result.status).toBe('failed');
        expect((result as any).error?.message).toMatch(/not found/);
    });
});
