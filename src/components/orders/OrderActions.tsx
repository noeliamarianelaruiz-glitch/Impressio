"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { updateOrderStatus, addOrderHistory } from "@/auth/actions"
import { useRouter } from "next/navigation"
import { type OrderStatus } from "@prisma/client"

interface OrderActionsProps {
  orderId: string
  currentStatus: string
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setLoading(true)
    const res = await updateOrderStatus(orderId, newStatus)
    setLoading(false)
    if (res.success) {
      router.refresh()
    }
  }

  const handleAddHistoryEvent = async () => {
    setLoading(true)
    const res = await addOrderHistory(orderId, currentStatus as OrderStatus, "Manual checkpoint logged")
    setLoading(false)
    if (res.success) {
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Actions & Workflow</h3>
      <div className="flex flex-col gap-2">
        {currentStatus !== "IN_PRODUCTION" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("IN_PRODUCTION")}
          >
            Move to Production
          </Button>
        )}
        {currentStatus !== "PRINTING" && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("PRINTING")}
          >
            Mark Printing
          </Button>
        )}
        {currentStatus !== "READY" && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("READY")}
          >
            Mark Ready
          </Button>
        )}
        {currentStatus !== "DELIVERED" && (
          <Button
            variant="default"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("DELIVERED")}
          >
            Mark Completed / Delivered
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleAddHistoryEvent}
        >
          Add History Checkpoint Event
        </Button>
        {currentStatus !== "CANCELLED" && (
          <Button
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={() => handleStatusChange("CANCELLED")}
          >
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  )
}
