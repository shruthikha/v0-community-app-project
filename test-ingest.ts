import { mastra } from "./packages/rio-agent/src/index";
import { config } from "dotenv";
config();

async function testIngest() {
    console.log("Fetching workflow...");
    const workflow = mastra.getWorkflow("ingest");
    if (!workflow) {
        console.error("Workflow not found!");
        return;
    }

    // We need a valid documentId that is 'ready' or 'pending' or 'error' 
    // Let's query one from DB directly or allow the user to provide one.
    // For now, let's just trigger it with a hardcoded one or let the script accept it via CLI args.
    const documentId = process.argv[2];
    if (!documentId) {
        console.error("Please provide a documentId");
        process.exit(1);
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
