"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/app/shared/lib/utils"
import { Bot, Brain, Cpu, Database, MessageSquare, Power, Search } from "lucide-react"
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
    color: "from-cyan-400 to-blue-600",
    description: "Chain-based AI workflows",
  },
  {
    id: "autogen",
    name: "AutoGen",
    icon: MessageSquare,
    color: "from-violet-400 to-purple-600",
    description: "Multi-agent conversations",
  },
  {
    id: "crewai",
    name: "CrewAI",
    icon: Brain,
    color: "from-emerald-400 to-green-600",
    description: "Collaborative AI crews",
  },
  {
    id: "semantic",
    name: "Semantic",
    icon: Search,
    color: "from-amber-400 to-orange-600",
    description: "Semantic kernel framework",
  },
  {
    id: "haystack",
    name: "Haystack",
    icon: Database,
    color: "from-rose-400 to-red-600",
    description: "NLP pipeline framework",
  },
  {
    id: "llamaindex",
    name: "LlamaIndex",
    icon: Cpu,
    color: "from-indigo-400 to-blue-600",
    description: "Data framework for LLMs",
  },
]

export function AgentDockOrbital() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string>("langchain")
  const [isExpanded, setIsExpanded] = useState(false)
  const [rotation, setRotation] = useState(0)
  const dockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2))
        setIsExpanded(distance < 150)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleItemClick = (id: string) => {
    setActiveItem(id)
    if ("vibrate" in navigator) {
      navigator.vibrate([30, 10, 30])
    }
  }

  return (
    <>
      <div
        ref={dockRef}
        className={cn(
          "fixed right-8 top-1/2 -translate-y-1/2 z-50",
          "transition-all duration-700 ease-out",
          isExpanded ? "scale-125" : "scale-100",
        )}
      >
        <div className="relative w-32 h-32">
          {/* Rotating outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-spin"
            style={{ animationDuration: "20s" }}
          />
          <div
            className="absolute inset-2 rounded-full border border-purple-500/20 animate-spin"
            style={{ animationDuration: "15s", animationDirection: "reverse" }}
          />

          {/* Central core */}
          <div
            className={cn(
              "absolute inset-4 rounded-full",
              "bg-gradient-to-br from-slate-900/90 to-black/90",
              "border border-white/20 backdrop-blur-xl",
              "flex items-center justify-center",
              "shadow-2xl shadow-cyan-500/20",
              "transition-all duration-500",
              isExpanded ? "shadow-cyan-500/40 border-white/30" : "",
            )}
          >
            <Power
              className={cn(
                "w-8 h-8 transition-all duration-500",
                activeItem ? "text-cyan-400" : "text-gray-500",
                isExpanded ? "scale-110" : "",
              )}
            />
          </div>

          {agentFrameworks.map((agent, index) => {
            const angle = index * 60 + rotation
            const radius = isExpanded ? 80 : 70
            const x = Math.cos((angle * Math.PI) / 180) * radius
            const y = Math.sin((angle * Math.PI) / 180) * radius
            const isHovered = hoveredItem === agent.id
            const isActive = activeItem === agent.id
            const Icon = agent.icon

            return (
              <div
                key={agent.id}
                className={cn(
                  "absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2",
                  "transition-all duration-500 ease-out cursor-pointer",
                  isHovered ? "scale-125 z-20" : "scale-100",
                  isActive ? "z-10" : "",
                )}
                style={{
                  left: `50%`,
                  top: `50%`,
                  transform: `translate(${x - 24}px, ${y - 24}px)`,
                  transitionDelay: `${index * 100}ms`,
                }}
                onMouseEnter={() => setHoveredItem(agent.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleItemClick(agent.id)}
              >
                <div
                  className={cn(
                    "relative w-full h-full rounded-full",
                    "bg-gradient-to-br from-slate-800/90 to-slate-900/90",
                    "border-2 transition-all duration-300",
                    isActive ? "border-cyan-400 shadow-lg shadow-cyan-400/50" : "border-white/20 hover:border-white/40",
                    isHovered ? "shadow-xl shadow-white/30" : "shadow-md shadow-black/50",
                  )}
                >
                  {/* Energy pulse for active item */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
                  )}

                  {/* Gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
                      `bg-gradient-to-br ${agent.color}`,
                      isHovered || isActive ? "opacity-30" : "",
                    )}
                  />

                  {/* Icon */}
                  <div className="relative flex items-center justify-center w-full h-full">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-300",
                        isActive ? "text-cyan-300" : "text-gray-300",
                        isHovered ? "text-white scale-110" : "",
                      )}
                    />
                  </div>

                  {/* Connection line to center */}
                  <div
                    className={cn(
                      "absolute w-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent",
                      "transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      height: `${radius - 24}px`,
                      left: "50%",
                      top: "50%",
                      transformOrigin: "top center",
                      transform: `rotate(${angle + 180}deg) translateX(-0.5px)`,
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2",
                    "px-3 py-2 rounded-lg backdrop-blur-xl",
                    "bg-black/90 border border-cyan-500/30",
                    "text-white text-sm font-medium whitespace-nowrap",
                    "opacity-0 scale-95 pointer-events-none",
                    "transition-all duration-300",
                    isHovered ? "opacity-100 scale-100" : "",
                    y < 0 ? "top-full mt-2" : "bottom-full mb-2",
                  )}
                >
                  <div className="font-semibold text-cyan-300">{agent.name}</div>
                  <div className="text-xs text-gray-300 mt-1">{agent.description}</div>
                </div>
              </div>
            )
          })}

          <div
            className={cn(
              "absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2",
              "transition-all duration-500 ease-out cursor-pointer",
              "hover:scale-110",
            )}
            style={{
              left: `50%`,
              top: `50%`,
              transform: `translate(${Math.cos((rotation * Math.PI) / 180) * (isExpanded ? 100 : 90) - 20}px, ${Math.sin((rotation * Math.PI) / 180) * (isExpanded ? 100 : 90) - 20}px)`,
            }}
          >
            <div
              className={cn(
                "w-full h-full rounded-full",
                "bg-gradient-to-br from-slate-700/80 to-slate-800/80",
                "border border-white/20 hover:border-white/40",
                "flex items-center justify-center",
                "backdrop-blur-sm transition-all duration-300",
                "hover:shadow-lg hover:shadow-white/20",
              )}
            >
              <PlusIcon className="w-4 h-4 text-gray-400 hover:text-white transition-colors duration-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed right-8 bottom-8 z-50">
        <div
          className={cn(
            "w-14 h-14 rounded-full",
            "bg-gradient-to-br from-slate-900/90 to-black/90",
            "border border-white/20 backdrop-blur-xl",
            "flex items-center justify-center cursor-pointer",
            "hover:border-white/40 transition-all duration-300",
            "shadow-xl shadow-black/50 hover:shadow-cyan-500/20",
            "group",
          )}
        >
          <GearIcon
            className={cn(
              "w-6 h-6 text-gray-400 transition-all duration-300",
              "group-hover:text-cyan-300 group-hover:rotate-90",
            )}
          />
        </div>
      </div>
    </>
  )
}
