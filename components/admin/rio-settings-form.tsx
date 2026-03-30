"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Save, Loader2 } from "lucide-react"
import { updateRioSettings, type RioSettingsPayload } from "@/app/actions/rio-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RailwayStatus } from "./railway-status"

const formSchema = z.object({
    persona: z.string().max(5000).optional(),
    tone: z.string().optional(),
    community_policies: z.string().max(5000).optional(),
    sign_off_message: z.string().max(200).optional(),
    emergency_contacts: z.array(z.any()).optional(),
})

interface RioSettingsFormProps {
    slug: string
    tenantId: string
    initialData: RioSettingsPayload
}

export function RioSettingsForm({ slug, tenantId, initialData }: RioSettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...initialData,
            persona: (initialData as any).prompt_persona || (initialData as any).persona || (initialData as any).prompt_tone,
        } as any,
    })

    const { fields, append, remove } = useFieldArray({
        name: "emergency_contacts",
        control: form.control,
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const result = await updateRioSettings(slug, tenantId, values as any)
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Río settings saved and published",
                })
                router.refresh()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update settings",
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            toast({
                title: "Unexpected Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const personaCount = form.watch("persona")?.length || 0
    const policiesCount = form.watch("community_policies")?.length || 0

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Community Agent</h2>
                        <p className="text-muted-foreground">Configure Río's personality and knowledge base behavioral patterns.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <RailwayStatus />
                        <Button type="submit" disabled={isLoading} aria-label="Save and publish settings">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save & Publish
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Persona & Tone</CardTitle>
                            <CardDescription>How Río introduces itself and interacts with residents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="tone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tone</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a tone" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="friendly">Friendly</SelectItem>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="casual">Casual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Determines the base behavioral pattern.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="persona"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Persona Prompt</FormLabel>
                                            <span className={`text-[10px] ${personaCount > 4500 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                                {personaCount}/5,000
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g. You are a helpful assistant for the Alegria community..."
                                                className="min-h-[150px]"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormDescription>Define the agent's identity and specific context.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sign_off_message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sign-off Message</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Always here to help, Río."
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormDescription>Optional signature for every response.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Community Policies</CardTitle>
                            <CardDescription>Crucial information and constraints the AI must always respect.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="community_policies"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Policy Details</FormLabel>
                                            <span className={`text-[10px] ${policiesCount > 4500 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                                                {policiesCount}/5,000
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Define key rules, bylaw highlights, or security protocols..."
                                                className="min-h-[200px]"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormDescription>Río will prioritize these rules over general knowledge.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Emergency Contacts</CardTitle>
                        <CardDescription>Río will provide these numbers when it detects critical or hazardous situations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`emergency_contacts.${index}.label`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Label (e.g. Security Gate)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`emergency_contacts.${index}.phone`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input placeholder="Phone Number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => remove(index)}
                                        aria-label={`Remove emergency contact ${index + 1}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ label: "", phone: "" })}
                            aria-label="Add new emergency contact"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </Form>
    )
}
