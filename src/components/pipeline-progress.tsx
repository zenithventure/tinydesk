import { cn } from "@/lib/utils"
import { PIPELINE_STAGES } from "@/lib/constants"
import type { TicketStatus } from "@prisma/client"

interface PipelineProgressProps {
  status: TicketStatus
}

export function PipelineProgress({ status }: PipelineProgressProps) {
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.status === status)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {PIPELINE_STAGES.map((stage, i) => {
          const isComplete = i < currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={stage.status} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
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
          )
        })}
      </div>
      <div className="flex items-center gap-0 mx-4">
        {PIPELINE_STAGES.slice(0, -1).map((stage, i) => {
          const isComplete = i < currentIndex
          return (
            <div
              key={stage.status}
              className={cn(
                "flex-1 h-1 rounded-full",
                isComplete ? "bg-emerald-600" : "bg-gray-200"
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
