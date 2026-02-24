import { ForgotPasswordForm } from "./forgot-password-form"

export default async function ForgotPasswordPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
            <ForgotPasswordForm tenantSlug={slug} />
        </div>
    )
}
