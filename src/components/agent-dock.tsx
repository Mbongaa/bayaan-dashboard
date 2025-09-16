/* eslint-disable @typescript-eslint/no-unused-vars */
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/app/shared/lib/utils"
import { Bot, Brain, Cpu, Database, MessageSquare, Zap, Search } from "lucide-react"
import { MagnifyingGlassIcon, GearIcon, PlusIcon } from "@radix-ui/react-icons"

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
    id: "langchain",
    name: "LangChain",
    icon: Bot,
    color: "from-blue-500 to-cyan-500",
    description: "Chain-based AI workflows",
  },
  {
    id: "autogen",
    name: "AutoGen",
    icon: MessageSquare,
    color: "from-purple-500 to-pink-500",
    description: "Multi-agent conversations",
  },
  {
    id: "crewai",
    name: "CrewAI",
    icon: Brain,
    color: "from-green-500 to-emerald-500",
    description: "Collaborative AI crews",
  },
  {
    id: "semantic",
    name: "Semantic",
    icon: Search,
    color: "from-orange-500 to-red-500",
    description: "Semantic kernel framework",
  },
  {
    id: "haystack",
    name: "Haystack",
    icon: Database,
    color: "from-yellow-500 to-orange-500",
    description: "NLP pipeline framework",
  },
  {
    id: "llamaindex",
    name: "LlamaIndex",
    icon: Cpu,
    color: "from-indigo-500 to-purple-500",
    description: "Data framework for LLMs",
  },
  {
    id: "custom",
    name: "Custom",
    icon: Zap,
    color: "from-teal-500 to-blue-500",
    description: "Custom agent framework",
  },
]

export function AgentDock() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string>("langchain")
  const [isExpanded, setIsExpanded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const dockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const distance = Math.abs(e.clientY - centerY)
        setIsExpanded(distance < 200)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleItemClick = (id: string) => {
    setActiveItem(id)
    // Add haptic feedback for mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }

  return (
    <>
      {/* Dock Container */}
      <div
        ref={dockRef}
        className={cn(
          "fixed right-6 top-1/2 -translate-y-1/2 z-50",
          "transition-all duration-500 ease-out",
          isExpanded ? "scale-110" : "scale-100",
        )}
      >
        {/* Dock Background */}
        <div
          className={cn(
            "relative backdrop-blur-xl bg-black/20 border border-white/10",
            "rounded-2xl p-3 shadow-2xl",
            "transition-all duration-300",
            isExpanded ? "bg-black/30 border-white/20" : "",
          )}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-50" />

          {/* Agent Items */}
          <div className="relative flex flex-col gap-2">
            {agentFrameworks.map((agent, index) => {
              const isHovered = hoveredItem === agent.id
              const isActive = activeItem === agent.id
              const Icon = agent.icon

              return (
                <div
                  key={agent.id}
                  className={cn(
                    "relative group cursor-pointer",
                    "transition-all duration-300 ease-out",
                    isHovered ? "scale-125 z-10" : "scale-100",
                    isActive ? "scale-110" : "",
                  )}
                  onMouseEnter={() => setHoveredItem(agent.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleItemClick(agent.id)}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Item Background */}
                  <div
                    className={cn(
                      "relative w-12 h-12 rounded-xl",
                      "backdrop-blur-sm border transition-all duration-300",
                      isActive
                        ? "bg-white/20 border-white/30 shadow-lg"
                        : "bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/20",
                      isHovered ? "shadow-2xl" : "shadow-md",
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
                    )}

                    {/* Gradient background for active/hovered state */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
                        `bg-gradient-to-br ${agent.color}`,
                        isHovered || isActive ? "opacity-20" : "",
                      )}
                    />

                    {/* Icon */}
                    <div className="relative flex items-center justify-center w-full h-full">
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-all duration-300",
                          isActive ? "text-white" : "text-gray-300",
                          isHovered ? "text-white scale-110" : "",
                        )}
                      />
                    </div>

                    {/* Ripple effect on click */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl",
                        "bg-white/20 scale-0 transition-transform duration-200",
                        "group-active:scale-100 group-active:animate-ping",
                      )}
                    />
                  </div>

                  {/* Tooltip */}
                  <div
                    className={cn(
                      "absolute right-full mr-3 top-1/2 -translate-y-1/2",
                      "px-3 py-2 rounded-lg backdrop-blur-xl bg-black/80 border border-white/20",
                      "text-white text-sm font-medium whitespace-nowrap",
                      "opacity-0 scale-95 pointer-events-none",
                      "transition-all duration-200",
                      isHovered ? "opacity-100 scale-100" : "",
                    )}
                  >
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs text-gray-300 mt-1">{agent.description}</div>

                    {/* Arrow */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-black/80" />
                  </div>
                </div>
              )
            })}

            {/* Add new agent button */}
            <div className="mt-2 pt-2 border-t border-white/10">
              <div
                className={cn(
                  "relative group cursor-pointer",
                  "w-12 h-12 rounded-xl",
                  "backdrop-blur-sm bg-white/5 border border-white/10",
                  "hover:bg-white/15 hover:border-white/20",
                  "transition-all duration-300",
                  "flex items-center justify-center",
                )}
              >
                <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings button */}
      <div className="fixed right-6 bottom-6 z-50">
        <div
          className={cn(
            "w-12 h-12 rounded-full backdrop-blur-xl bg-black/20 border border-white/10",
            "flex items-center justify-center cursor-pointer",
            "hover:bg-black/30 hover:border-white/20 transition-all duration-300",
            "shadow-lg hover:shadow-xl",
          )}
        >
          <GearIcon className="w-5 h-5 text-gray-300 hover:text-white transition-colors duration-300" />
        </div>
      </div>
    </>
  )
}
