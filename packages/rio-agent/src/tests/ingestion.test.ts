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
        vi.mocked(supabaseLib.claimDocument).mockResolvedValue(mockDocMetadata as any);
        vi.mocked(supabaseLib.downloadDocument).mockResolvedValue(Buffer.from('mock-pdf-content'));
        vi.mocked(llamaLib.parseToMarkdown).mockResolvedValue('# Mock Markdown Output');

        // Mock supabaseAdmin for the bridge query
        const mockSupabaseAdmin = {
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { document_type: 'pdf', file_url: 'folder/test.pdf' },
                            error: null
                        })
                    })
                })
            })
        };
        (supabaseLib as any).supabaseAdmin = mockSupabaseAdmin;

        // Execute workflow
        const run = await (ingestionWorkflow as any).createRun();
        const result = await run.start({
            inputData: { documentId: mockDocumentId }
        });

        // Verify status updates
        expect(supabaseLib.claimDocument).toHaveBeenCalledWith(mockDocumentId);
        expect(supabaseLib.downloadDocument).toHaveBeenCalledWith('folder/test.pdf');

        // Verify parsing
        expect(llamaLib.parseToMarkdown).toHaveBeenCalled();

        // Verify final status update (Step 5 calls updateDocStatus to 'processed')
        expect(supabaseLib.updateDocStatus).toHaveBeenCalledWith(mockDocumentId, 'processed');
    });

    it('should handle fetch failures gracefully', async () => {
        vi.mocked(supabaseLib.claimDocument).mockResolvedValue(null);

        const run = await (ingestionWorkflow as any).createRun();
        const result = await run.start({
            inputData: { documentId: mockDocumentId }
        });

        expect(result.status).toBe('failed');
        expect((result as any).error?.message).toMatch(/already being processed/);
    });
});
