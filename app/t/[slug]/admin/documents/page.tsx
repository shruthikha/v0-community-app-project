import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from 'lucide-react'
import Link from "next/link"
import { AdminDocumentsTable } from "./admin-documents-table"

export default async function AdminDocumentsPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()
    if (!tenant) redirect("/backoffice/login")

    // Fetch documents
    const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("updated_at", { ascending: false })

    // Fetch AI statuses (bridge)
    const { data: rioDocs } = await supabase
        .from("rio_documents")
        .select("id, status, source_document_id, updated_at")
        .eq("tenant_id", tenant.id)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">Manage official documents, regulations, and files.</p>
                </div>
                <Button asChild>
                    <Link href={`/t/${slug}/admin/documents/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Document
                    </Link>
                </Button>
            </div>

            {!documents?.length ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Upload regulations, financial reports, or create rich text pages.
                    </p>
                    <Button asChild>
                        <Link href={`/t/${slug}/admin/documents/create`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Document
                        </Link>
                    </Button>
                </div>
            ) : (
                <AdminDocumentsTable documents={documents} rioDocs={rioDocs || []} slug={slug} tenantId={tenant.id} />
            )}
        </div>
    )
}
