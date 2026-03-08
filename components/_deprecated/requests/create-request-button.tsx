"use client"

import { useState } from "react"
import { CreateRequestModal } from "../../requests/create-request-modal"
import type { RequestType } from "@/types/requests"

interface CreateRequestButtonProps {
  tenantSlug: string
  tenantId: string
  requestType: RequestType
  children: React.ReactNode
}

export function CreateRequestButton({
  tenantSlug,
  tenantId,
  requestType,
  children,
}: CreateRequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsModalOpen(true)}>
        {children}
      </div>
      <CreateRequestModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        tenantSlug={tenantSlug}
        tenantId={tenantId}
        defaultType={requestType}
      />
    </>
  )
}
