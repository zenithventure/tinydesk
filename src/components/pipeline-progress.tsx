import React from "react"
import { cn } from "@/lib/utils"
import { PIPELINE_STAGES } from "@/lib/constants"
import type { TicketStatus } from "@prisma/client"

interface PipelineProgressProps {
  status: TicketStatus
}

export function PipelineProgress({ status }: PipelineProgressProps) {
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.status === status)

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-start min-w-[480px]">
        {PIPELINE_STAGES.map((stage, i) => {
          const isComplete = i < currentIndex
          const isCurrent = i === currentIndex
          return (
            <React.Fragment key={stage.status}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors shrink-0",
                    isComplete && "bg-emerald-600 border-emerald-600 text-white",
                    isCurrent && "bg-emerald-100 border-emerald-600 text-emerald-700",
                    !isComplete && !isCurrent && "bg-gray-100 border-gray-300 text-gray-400"
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 text-center leading-tight max-w-[60px]",
                    isCurrent ? "text-emerald-700 font-medium" : "text-gray-400"
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mt-4 shrink-0",
                    isComplete ? "bg-emerald-600" : "bg-gray-200"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
