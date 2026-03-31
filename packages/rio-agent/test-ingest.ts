import { mastra } from "./src/index";
import { supabaseAdmin } from "./src/lib/supabase";

async function testIngest() {
    console.log("Waiting 2s for Mastra pools to initialize and free libuv threads...");
    await new Promise(r => setTimeout(r, 2000));

    const sourceDocumentId = "532ddb53-5f08-435a-b714-9e8d620e81b4";
    console.log(`Fetching source document: ${sourceDocumentId}`);

    // 1. Fetch Source Document
    const { data: sourceDoc, error: sourceError } = await supabaseAdmin
        .from("documents")
        .select("id, tenant_id, title")
        .eq("id", sourceDocumentId)
        .single();

    if (sourceError || !sourceDoc) {
        console.error("Failed to find source document:", sourceError);
        return;
    }

    console.log(`Pushing to rio_documents via RPC for: ${sourceDoc.title}...`);

    // 2. Call RPC to Bridge Document
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("upsert_rio_document_if_not_processing", {
        p_source_document_id: sourceDoc.id,
        p_tenant_id: sourceDoc.tenant_id,
        p_name: sourceDoc.title
    });

    if (rpcError || !rpcData || rpcData.length === 0) {
        console.error("RPC failed:", rpcError);
        return;
    }

    const rioDoc = rpcData[0];
    const documentId = rioDoc.id;
    console.log(`Bridged to rio_documents with ID: ${documentId}`);

    // Force pending if it says processing from previous tests
    await supabaseAdmin.from("rio_documents").update({ status: "pending", error_message: null }).eq("id", documentId);

    console.log("Fetching workflow...");
    const workflow = mastra.getWorkflow("ingest");
    if (!workflow) {
        console.error("Workflow not found!");
        return;
    }

    console.log(`Starting ingest run for ${documentId}...`);
    try {
        const run = await workflow.createRun();
        console.log("Run created. Starting...");
        const result = await run.start({ inputData: { documentId } });
        console.log("Run Finished successfully!");
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("Run Failed:", e.message);
        console.error(e.stack);
    }
}

testIngest().then(() => {
    console.log("Script completed.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});
