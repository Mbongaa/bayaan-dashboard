import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/app/shared/lib/utils"
import { 
  Bot, 
  Brain, 
  Home, 
  Shuffle, 
  Headset, 
  MessageSquare, 
  Power, 
  Languages 
} from "lucide-react"
import { GearIcon, PlusIcon } from "@radix-ui/react-icons"

interface AgentItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
  isActive?: boolean
}

const agentFrameworks: AgentItem[] = [
  {
    id: "bayaanGeneral",
    name: "Bayaan General",
    icon: Brain,
    color: "from-purple-400 to-pink-600",
    description: "Advanced general assistant",
  },
  {
    id: "jarvisCore",
    name: "Jarvis Core",
    icon: Home,
    color: "from-blue-400 to-cyan-600",
    description: "Dashboard control system",
  },
  {
    id: "simpleHandoff",
    name: "Simple Handoff",
    icon: Shuffle,
    color: "from-green-400 to-emerald-600",
    description: "Agent transfer system",
  },
  {
    id: "customerServiceRetail",
    name: "Customer Service",
    icon: Headset,
    color: "from-orange-400 to-red-600",
    description: "Retail support agent",
  },
  {
    id: "chatSupervisor",
    name: "Chat Supervisor",
    icon: MessageSquare,
    color: "from-indigo-400 to-purple-600",
    description: "Conversation manager",
  },
  {
    id: "translationDirect",
    name: "Translation Direct",
    icon: Languages,
    color: "from-teal-400 to-blue-600",
    description: "Real-time translation",
  },
]

interface AgentDockVerticalProps {
  onConnect: () => void
  onDisconnect: () => void
  onScenarioSelect: (scenarioKey: string) => void
  selectedScenario?: string
  isConnected: boolean
  sessionStatus: string
}

export function AgentDockVertical({
  onConnect,
  onDisconnect,
  onScenarioSelect,
  selectedScenario,
  isConnected,
  sessionStatus,
}: AgentDockVerticalProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string>(selectedScenario || "bayaanGeneral")
  const [isPowerOn, setIsPowerOn] = useState(isConnected)
  const dockRef = useRef<HTMLDivElement>(null)

  // Sync active item with selected scenario
  useEffect(() => {
    if (selectedScenario) {
      setActiveItem(selectedScenario)
    }
  }, [selectedScenario])

  // Sync power state with connection status
  useEffect(() => {
    setIsPowerOn(isConnected || sessionStatus === "CONNECTING")
  }, [isConnected, sessionStatus])


  const handleItemClick = (id: string) => {
    // Select the scenario
    onScenarioSelect(id)
    setActiveItem(id)
    
    // If not connected, also trigger connection
    if (!isConnected && sessionStatus !== "CONNECTING") {
      setTimeout(() => onConnect(), 100)
    }
    
    if ("vibrate" in navigator) {
      navigator.vibrate([30, 10, 30])
    }
  }

  const handlePowerToggle = () => {
    if (isConnected || sessionStatus === "CONNECTING") {
      onDisconnect()
    } else {
      onConnect()
    }
    if ("vibrate" in navigator) {
      navigator.vibrate([50])
    }
  }

  return (
    <>
      <div
        ref={dockRef}
        className={cn(
          "fixed right-6 top-1/2 -translate-y-1/2 z-[75]",
          "flex flex-col items-center gap-2",
          "p-3",
          "bg-transparent",
          "transition-all duration-500 ease-out",
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full mb-2 cursor-pointer",
            "bg-gray-200/60 dark:bg-white/10",
            "border-2 backdrop-blur-sm",
            "flex items-center justify-center",
            "shadow-lg transition-all duration-500 pointer-events-auto",
            isPowerOn ? "border-black/60 dark:border-white/50 shadow-black/30 dark:shadow-white/40" : "border-gray-400/50 dark:border-gray-600/30 shadow-gray-400/20 dark:shadow-gray-600/20",
          )}
          onClick={handlePowerToggle}
        >
          <Power
            className={cn(
              "w-4 h-4 transition-all duration-500",
              isPowerOn ? "text-black dark:text-white drop-shadow-lg" : "text-gray-500 dark:text-white/50",
            )}
          />
          {isPowerOn && <div className="absolute inset-0 rounded-full border-2 border-black/30 dark:border-white/30 animate-ping" />}
        </div>

        <div className="w-px h-4 bg-gradient-to-b from-gray-400/30 dark:from-white/30 via-gray-300/20 dark:via-white/20 to-transparent" />

        {agentFrameworks.map((agent, index) => {
          const isHovered = hoveredItem === agent.id
          const isActive = activeItem === agent.id
          const Icon = agent.icon

          return (
            <div
              key={agent.id}
              className={cn(
                "relative group",
                "transition-all duration-300 ease-out cursor-pointer",
                isHovered ? "scale-125 z-20" : "scale-100",
                isActive ? "z-10" : "",
                !isPowerOn ? "opacity-80" : "",
              )}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
              onMouseEnter={() => setHoveredItem(agent.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleItemClick(agent.id)}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl",
                  "bg-gray-100/60 dark:bg-white/5",
                  "border-2 transition-all duration-300",
                  "flex items-center justify-center",
                  "backdrop-blur-sm pointer-events-auto",
                  isActive ? "border-black dark:border-white shadow-lg shadow-black/30 dark:shadow-white/50" : "border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40",
                  isHovered ? "shadow-xl shadow-gray-500/30 dark:shadow-white/30" : "shadow-md shadow-gray-300/30 dark:shadow-black/50",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                    `bg-gradient-to-br ${agent.color}`,
                    isHovered ? "opacity-30" : "",
                  )}
                />

                <Icon
                  className={cn(
                    "w-4 h-4 transition-all duration-300 relative z-10",
                    isActive ? "text-black dark:text-white drop-shadow-lg" : "text-gray-600 dark:text-white/80",
                    isHovered ? "text-gray-800 dark:text-white scale-110 drop-shadow-lg" : "",
                  )}
                />

                {isActive && (
                  <div
                    className="absolute w-px h-8 bg-gradient-to-t from-black/50 dark:from-white/50 to-transparent"
                    style={{
                      top: "-32px",
                      left: "50%",
                      transform: "translateX(-0.5px)",
                    }}
                  />
                )}
              </div>

              <div
                className={cn(
                  "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                  "px-3 py-2 rounded-lg backdrop-blur-xl",
                  "bg-gray-800/95 dark:bg-black/90 border border-gray-600/50 dark:border-white/30",
                  "text-white text-sm font-medium whitespace-nowrap",
                  "opacity-0 scale-95 pointer-events-none",
                  "transition-all duration-300",
                  isHovered ? "opacity-100 scale-100" : "",
                )}
              >
                <div className="font-semibold text-white">{agent.name}</div>
                <div className="text-xs text-gray-300 mt-1">{agent.description}</div>
                <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800/95 dark:border-l-white/30 border-y-4 border-y-transparent" />
              </div>
            </div>
          )
        })}

        <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-300/20 dark:via-white/20 to-gray-400/30 dark:to-white/30" />

        {/* Removed Add button as we have fixed scenarios */}
      </div>

      {/* Removed settings gear as settings are in the chatbox menu */}
    </>
  )
}
