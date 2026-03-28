import { redirect, notFound } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import Link from 'next/link'
import { ChevronLeft, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default async function DocumentDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/t/${slug}/login`)

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).single()
    if (!tenant) redirect("/backoffice/login")

    const { data: document } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenant.id)
        .eq("status", "published")
        .single()

    if (!document) notFound()

    // --- Supabase Storage Signed URL Hardening ---
    // Generate signed URL for private bucket access if it's a file
    let fileUrl = document.file_url;
    if (document.document_type !== 'page' && fileUrl) {
        try {
            // Robust path extraction that handles various Supabase URL formats
            // Format: .../storage/v1/object/public/bucketName/path/to/file
            const pathMatch = fileUrl.match(/\/object\/(?:public\/)?documents\/(.+)$/);
            const storagePath = pathMatch ? decodeURIComponent(pathMatch[1]) : null;

            if (storagePath) {
                const { data: signedData, error } = await supabase.storage
                    .from('documents')
                    .createSignedUrl(storagePath, 3600); // 1-hour expiry for stability

                if (error) {
                    console.error("[Document] Failed to generate signed URL:", error);
                } else if (signedData?.signedUrl) {
                    fileUrl = signedData.signedUrl;
                }
            } else {
                console.warn("[Document] Could not resolve storage path for signing. Using raw URL.");
            }
        } catch (err) {
            console.error("[Document] Error during URL signing process:", err);
        }
    }
    // --- End Signed URL logic ---

    // Mark as read immediately on visit
    try {
        await supabase.from("document_reads").insert({
            document_id: document.id,
            user_id: user.id,
            tenant_id: tenant.id
        })
    } catch (error) {
        // Ignore unique constraint violation (already read)
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/t/${slug}/dashboard/official?tab=documents`}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Documents
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {document.category && (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                                {document.category}
                            </div>
                        )}
                        {document.is_featured && (
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-yellow-100 text-yellow-800">
                                Featured
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{document.title}</h1>

                    {document.description && (
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {document.description}
                        </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-6">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Updated {format(new Date(document.updated_at), 'MMMM d, yyyy')}</span>
                        </div>
                    </div>
                </div>

                {document.cover_image_url && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={document.cover_image_url}
                            alt={document.title}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                {document.document_type === 'page' ? (
                    <div className="prose dark:prose-invert max-w-none py-4">
                        <div dangerouslySetInnerHTML={{ __html: document.content || <p>No content available.</p> }} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {fileUrl ? (
                            <div className="space-y-4">
                                <div className="w-full h-[800px] border rounded-xl overflow-hidden bg-muted shadow-sm">
                                    <iframe
                                        src={fileUrl}
                                        className="w-full h-full"
                                        title={document.title}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <Button asChild size="lg" className="gap-2">
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-5 w-5" />
                                            Download PDF
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 border rounded-xl bg-muted/20 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>PDF file is not available.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
