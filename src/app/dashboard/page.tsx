"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUser, UserButton } from "@clerk/nextjs"
import { Moon, Sun } from "lucide-react"

/* ---------------------------- API base URL ---------------------------- */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai-team-server.onrender.com"

/* ------------------------------ Types ------------------------------ */

interface AgentGroup {
  id: string
  name: string
  description?: string | null
  slug?: string | null
}

interface GroupAssignment {
  id: string
  email: string
  groupId: string
  isActive: boolean
  group?: AgentGroup
}

interface GroupAgentsResponse {
  group: {
    id: string
    name: string
    isActive: boolean
  }
  agents: string[]
  count: number
}

type UiAgent = {
  key: string
  name: string
  role: string
  image: string
  href: string
}

const agents: UiAgent[] = [
  {
    key: "ALEX",
    name: "Alex AI",
    role: "Cross-Platform ADs Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/David-AI-Ai-Specialist-social-ads.png",
    href: "/dashboard/alex-ai",
  },
  {
    key: "TONY",
    name: "Tony AI",
    role: "Direttore Commerciale",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Tony-AI-strategiest.png",
    href: "/dashboard/tony-ai",
  },
  {
    key: "ALADINO",
    name: "Aladino AI",
    role: "Creatore di nuove offerte e prodotti",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Aladdin-AI-consultant.png",
    href: "/dashboard/aladino-ai",
  },
  {
    key: "LARA",
    name: "Lara AI",
    role: "Social Media Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Lara-AI-social-strategiest.png",
    href: "/dashboard/lara-ai",
  },
  {
    key: "SIMONE",
    name: "Simone AI",
    role: "SEO Copywriter",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Simone-AI-seo-copy.png",
    href: "/dashboard/simone-ai",
  },
  {
    key: "MIKE",
    name: "Mike AI",
    role: "Direttore Marketing",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Mike-AI-digital-marketing-mg.png",
    href: "/dashboard/mike-ai",
  },
  {
    key: "VALENTINA",
    name: "Valentina AI",
    role: "SEO Optimizer",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/Valentina-AI-AI-SEO-optimizer.png",
    href: "/dashboard/valentina-ai",
  },
  {
    key: "NIKO",
    name: "Niko AI",
    role: "SEO Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Niko-AI.png",
    href: "/dashboard/niko-ai",
  },
  {
    key: "JIM",
    name: "Jim AI",
    role: "Coach di Vendite",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Jim-AI-%E2%80%93-AI-Coach.png",
    href: "/dashboard/jim-ai",
  },
  {
    key: "DANIELE",
    name: "Daniele AI",
    role: "Copywriter per Vendere (Direct Response)",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/11/daniele_ai_direct_response_copywriter.png",
    href: "/dashboard/daniele-ai",
  },
  {
    key: "TEST_MIKE",
    name: "Test Mike AI",
    role: "Test Direttore Marketing",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Mike-AI-digital-marketing-mg.png",
    href: "/dashboard/test-mike-ai",
  },
  {
    key: "TEST_ALEX",
    name: "Test Alex AI",
    role: "Test Cross-Platform ADs Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/David-AI-Ai-Specialist-social-ads.png",
    href: "/dashboard/test-alex-ai",
  },
  {
    key: "TEST_TONY",
    name: "Test Tony AI",
    role: "Test Direttore Commerciale",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Tony-AI-strategiest.png",
    href: "/dashboard/test-tony-ai",
  },
  {
    key: "TEST_JIM",
    name: "Test Jim AI",
    role: "Test Coach di Vendite",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Jim-AI-%E2%80%93-AI-Coach.png",
    href: "/dashboard/test-jim-ai",
  },
  {
    key: "TEST_LARA",
    name: "Test Lara AI",
    role: "Test Social Media Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Lara-AI-social-strategiest.png",
    href: "/dashboard/test-lara-ai",
  },
  {
    key: "TEST_VALENTINA",
    name: "Test Valentina AI",
    role: "Test SEO Optimizer",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/Valentina-AI-AI-SEO-optimizer.png",
    href: "/dashboard/test-valentina-ai",
  },
  {
    key: "TEST_DANIELE",
    name: "Test Daniele AI",
    role: "Test Copywriter per Vendere (Direct Response)",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/11/daniele_ai_direct_response_copywriter.png",
    href: "/dashboard/test-daniele-ai",
  },
  {
    key: "TEST_SIMONE",
    name: "Test Simone AI",
    role: "Test SEO Copywriter",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Simone-AI-seo-copy.png",
    href: "/dashboard/test-simone-ai",
  },
  {
    key: "TEST_NIKO",
    name: "Test Niko AI",
    role: "Test SEO Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Niko-AI.png",
    href: "/dashboard/test-niko-ai",
  },
  {
    key: "TEST_ALADINO",
    name: "Test Aladino AI",
    role: "Test Creatore di nuove offerte e prodotti",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Aladdin-AI-consultant.png",
    href: "/dashboard/test-aladino-ai",
  },
]

/* -------------------------------- Page Component -------------------------------- */

export default function HomePage() {
  const { user, isLoaded } = useUser()
  const [email, setEmail] = useState<string>("")
  const [assignedAgentNames, setAssignedAgentNames] = useState<string[]>([])
  const [assignedGroups, setAssignedGroups] = useState<GroupAssignment[]>([])
  const [selectedGroup, setSelectedGroup] = useState<AgentGroup | null>(null)
  const [groupAgents, setGroupAgents] = useState<UiAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  useEffect(() => {
    async function fetchData() {
      if (!isLoaded) return

      if (!user?.primaryEmailAddress?.emailAddress) {
        setIsLoading(false)
        return
      }

      try {
        const userEmail = user.primaryEmailAddress.emailAddress
        setEmail(userEmail)

        console.log("[v0] Fetching data for user:", userEmail)

        const agentsRes = await fetch(`${API_BASE}/admin/selected-agents?email=${encodeURIComponent(userEmail)}`, {
          cache: "no-store",
        })
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          console.log("[v0] Assigned agents:", agentsData)
          setAssignedAgentNames(agentsData)
        }

        const groupsRes = await fetch(
          `${API_BASE}/admin/group-assignments?email=${encodeURIComponent(userEmail)}&activeOnly=true`,
          { cache: "no-store" },
        )
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          console.log("[v0] Assigned groups:", groupsData)
          setAssignedGroups(groupsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, isLoaded])

  const handleGroupClick = async (group: AgentGroup) => {
    setSelectedGroup(group)
    setIsModalLoading(true)

    try {
      const response = await fetch(`${API_BASE}/admin/groups/${group.id}/agents`)

      if (response.ok) {
        const groupData: GroupAgentsResponse = await response.json()

        console.log("[v0] Group data:", groupData)

        setSelectedGroup({
          ...group,
          name: groupData.group.name,
        })

        const agentIds = groupData.agents
        const matchedAgents = agents.filter((agent) => agentIds.includes(agent.key))

        console.log("[v0] Matched agents:", matchedAgents)
        setGroupAgents(matchedAgents)
      } else {
        console.error("Failed to fetch group agents")
        setGroupAgents([])
      }
    } catch (error) {
      console.error("Error fetching group agents:", error)
      setGroupAgents([])
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedGroup(null)
    setGroupAgents([])
  }

  const visibleAgents = agents.filter((agent) => assignedAgentNames.includes(agent.key))

  if (isLoading || !isLoaded) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center px-4 ${theme === "dark" ? "bg-muted" : "bg-gray-100"}`}
      >
        <div
          className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-primary" : "border-blue-600"}`}
        />
      </div>
    )
  }

  if (!email) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center px-4 ${theme === "dark" ? "bg-muted" : "bg-gray-100"}`}
      >
        <p
          className={`text-center text-sm sm:text-base ${theme === "dark" ? "text-muted-foreground" : "text-gray-600"}`}
        >
          Devi effettuare il login per vedere i tuoi agenti assegnati.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#020617] bg-tech-grid" : "bg-gradient-to-br from-gray-50 to-blue-50"}`}
    >
      <style jsx global>{`
        .bg-tech-grid {
          background-image: 
            linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .glass-card {
          background: ${theme === "dark" ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.95)"};
          border: 1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"};
          box-shadow: ${theme === "dark" ? "0 4px 30px rgba(0, 0, 0, 0.3)" : "0 4px 30px rgba(0, 0, 0, 0.1)"};
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .glass-card:hover {
          box-shadow: ${theme === "dark" ? "0 0 25px rgba(14, 165, 233, 0.3), inset 0 0 0 1px rgba(14, 165, 233, 0.4)" : "0 0 25px rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(59, 130, 246, 0.4)"};
          border-color: ${theme === "dark" ? "rgba(14, 165, 233, 0.5)" : "rgba(59, 130, 246, 0.5)"};
        }

        .manager-card {
          box-shadow: 0 0 30px rgba(229, 43, 80, 0.25);
          border-color: rgba(229, 43, 80, 0.8) !important;
          animation: manager-pulse 3s infinite alternate;
        }
        .manager-card:hover {
          box-shadow: 0 0 60px rgba(229, 43, 80, 0.5), inset 0 0 0 2px rgba(229, 43, 80, 0.6);
        }

        @keyframes manager-pulse {
          0% { box-shadow: 0 0 20px rgba(229, 43, 80, 0.2); }
          100% { box-shadow: 0 0 40px rgba(229, 43, 80, 0.4); }
        }

        @keyframes pulse-green-strong {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.9); opacity: 1; }
          50% { opacity: 0.8; }
          100% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); opacity: 1; }
        }
        .status-dot-active {
          animation: pulse-green-strong 1.5s infinite ease-in-out;
        }

        .character-image {
          mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .hologram-bg {
          background-image: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%);
          background-size: 100% 4px;
        }
        .scan-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${theme === "dark" ? "linear-gradient(to bottom, transparent, rgba(14, 165, 233, 0.2), transparent)" : "linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2), transparent)"};
          animation: scanline 2s linear infinite;
          pointer-events: none;
        }
        .manager-scan-bar {
          background: linear-gradient(to bottom, transparent, rgba(229, 43, 80, 0.3), transparent);
        }

        .group-card {
          background: ${theme === "dark" ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.95)"};
          border: 1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"};
          box-shadow: ${theme === "dark" ? "0 4px 30px rgba(0, 0, 0, 0.3)" : "0 4px 30px rgba(0, 0, 0, 0.1)"};
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .group-card:hover {
          box-shadow: ${theme === "dark" ? "0 0 25px rgba(99, 102, 241, 0.3), inset 0 0 0 1px rgba(99, 102, 241, 0.4)" : "0 0 25px rgba(99, 102, 241, 0.3), inset 0 0 0 1px rgba(99, 102, 241, 0.4)"};
          border-color: ${theme === "dark" ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.5)"};
          transform: translateY(-4px);
        }

        /* Custom scrollbar for horizontal scroll */
        .agents-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .agents-scroll::-webkit-scrollbar-track {
          background: ${theme === "dark" ? "rgba(17, 24, 39, 0.5)" : "rgba(229, 231, 235, 0.5)"};
          border-radius: 4px;
        }
        .agents-scroll::-webkit-scrollbar-thumb {
          background: ${theme === "dark" ? "rgba(14, 165, 233, 0.5)" : "rgba(59, 130, 246, 0.5)"};
          border-radius: 4px;
        }
        .agents-scroll::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark" ? "rgba(14, 165, 233, 0.7)" : "rgba(59, 130, 246, 0.7)"};
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="relative mb-8 rounded-2xl glass-card px-4 py-6 text-center shadow-lg sm:mb-10 sm:px-6 sm:py-8 md:mb-12 md:px-8 md:py-10 lg:px-10">
          <button
            onClick={toggleTheme}
            className={`absolute left-4 top-4 sm:left-6 sm:top-6 p-2.5 rounded-lg transition-all duration-300 ${
              theme === "dark"
                ? "bg-white/10 hover:bg-white/20 text-yellow-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-[#0ea5e9]/30",
                },
              }}
            />
          </div>

          <h1
            className={`mb-2 font-sans text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-[36px] tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            Incontra i tuoi Specialisti AI
          </h1>
          <p className={`text-sm sm:text-base md:text-lg ${theme === "dark" ? "text-white/70" : "text-gray-600"}`}>
            Qui trovi solo gli agenti AI e i gruppi che ti sono stati assegnati.
          </p>
        </header>

        {assignedGroups.length > 0 && (
          <section className="mb-8 sm:mb-10">
            <h2
              className={`mb-3 font-sans text-xl font-semibold sm:mb-4 sm:text-2xl tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              I tuoi Gruppi di Agenti
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {assignedGroups.map((assigned) => {
                if (!assigned.group) return null

                const group = assigned.group

                return (
                  <button key={assigned.id} onClick={() => handleGroupClick(group)} className="group text-left">
                    <div className="group-card flex h-full flex-col justify-between rounded-2xl p-4 sm:p-5 md:p-6">
                      <div>
                        <h3
                          className={`mb-1.5 font-sans text-lg font-semibold sm:mb-2 sm:text-xl md:text-[20px] ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                        >
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                            {group.description}
                          </p>
                        )}
                      </div>
                      <p className="mt-3 text-[10px] uppercase tracking-widest text-[#6366f1] font-bold sm:mt-4 sm:text-xs">
                        Gruppo di agenti AI
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <h2
            className={`mb-3 font-sans text-xl font-semibold sm:mb-4 sm:text-2xl tracking-wide ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            I tuoi Agenti AI assegnati
          </h2>

          {visibleAgents.length === 0 ? (
            <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
              Nessun agente AI ti è stato ancora assegnato.
            </p>
          ) : (
            <div className="agents-scroll overflow-x-auto pb-4">
              <main className="grid grid-cols-5 gap-4 min-w-[1200px] lg:gap-5 xl:gap-6">
                {visibleAgents.map((agent) => {
                  const isManager = agent.name === "Mike AI" || agent.name === "Test Mike AI"

                  return (
                    <Link key={agent.key} href={agent.href} className="group">
                      <div
                        className={`relative w-full aspect-[3/4] glass-card rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 cursor-pointer ${isManager ? "manager-card" : ""}`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-t ${theme === "dark" ? "from-[#020617]" : "from-white"} via-transparent to-transparent opacity-90 z-10 pointer-events-none`}
                        ></div>

                        <div className="absolute inset-0 w-full h-full">
                          <Image
                            src={agent.image || "/placeholder.svg"}
                            alt={agent.name}
                            fill
                            className="object-cover object-top transition duration-700 group-hover:scale-105 character-image"
                          />
                        </div>

                        <div className="absolute top-4 right-4 z-30">
                          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 status-dot-active"></div>
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                              Active
                            </span>
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full p-4 z-20 flex flex-col justify-end h-full group-hover:opacity-0 transition-opacity duration-300">
                          <div className="transform translate-y-2">
                            <div
                              className={`border-l-4 pl-3 mb-1 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                            >
                              <h3
                                className={`text-2xl font-bold leading-none drop-shadow-md ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-white" : "text-gray-900"}`}
                              >
                                {agent.name}
                              </h3>
                              <p
                                className={`text-xs font-bold tracking-widest uppercase mt-1 ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-[#0ea5e9]" : "text-blue-600"}`}
                              >
                                {agent.role}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`absolute inset-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-5 text-center hologram-bg backdrop-blur-md ${theme === "dark" ? "bg-[#020617]/90" : "bg-white/90"}`}
                        >
                          <div className={`scan-bar ${isManager ? "manager-scan-bar" : ""}`}></div>

                          <div className="relative z-10 transform scale-95 group-hover:scale-100 transition-transform duration-500 delay-75">
                            <h3
                              className={`text-xl font-bold mb-1 ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-[#0ea5e9]" : "text-blue-600"}`}
                            >
                              {agent.name}
                            </h3>
                            <p
                              className={`text-[10px] uppercase tracking-widest mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {agent.role}
                            </p>

                            <div
                              className={`h-px w-10 mx-auto mb-3 ${isManager ? "bg-[#E52B50]" : theme === "dark" ? "bg-[#0ea5e9]" : "bg-blue-600"}`}
                            ></div>

                            <p
                              className={`text-xs font-medium leading-relaxed px-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                              Clicca per accedere alla dashboard di {agent.name}
                            </p>

                            <div
                              className={`mt-4 px-4 py-1.5 rounded border font-bold uppercase text-[10px] tracking-widest inline-block
                            ${isManager ? "border-[#E52B50] text-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9] text-[#0ea5e9]" : "border-blue-600 text-blue-600"}`}
                            >
                              Accedi
                            </div>
                          </div>

                          <div
                            className={`absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                          ></div>
                          <div
                            className={`absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                          ></div>
                          <div
                            className={`absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                          ></div>
                          <div
                            className={`absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </main>
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={handleCloseModal}>
        <DialogContent
          className={`max-w-6xl max-h-[90vh] overflow-y-auto border-[#0ea5e9]/30 ${theme === "dark" ? "bg-[#020617]" : "bg-white"}`}
        >
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {selectedGroup?.name || "Gruppo di Agenti"}
            </DialogTitle>
            {selectedGroup?.description && (
              <p className={`text-sm mt-2 ${theme === "dark" ? "text-white/70" : "text-gray-600"}`}>
                {selectedGroup.description}
              </p>
            )}
          </DialogHeader>

          {isModalLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
              />
            </div>
          ) : (
            <div className="mt-6">
              {groupAgents.length === 0 ? (
                <p className={`text-center py-8 ${theme === "dark" ? "text-white/60" : "text-gray-600"}`}>
                  Nessun agente trovato in questo gruppo.
                </p>
              ) : (
                <div className="agents-scroll overflow-x-auto pb-4">
                  <div className="grid grid-cols-5 gap-4 min-w-[900px]">
                    {groupAgents.map((agent) => {
                      const isManager = agent.name === "Mike AI" || agent.name === "Test Mike AI"

                      return (
                        <Link key={agent.key} href={agent.href} className="group">
                          <div
                            className={`relative w-full aspect-[3/4] glass-card rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-500 cursor-pointer ${isManager ? "manager-card" : ""}`}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-t ${theme === "dark" ? "from-[#020617]" : "from-white"} via-transparent to-transparent opacity-90 z-10 pointer-events-none`}
                            ></div>

                            <div className="absolute inset-0 w-full h-full">
                              <Image
                                src={agent.image || "/placeholder.svg"}
                                alt={agent.name}
                                fill
                                className="object-cover object-top transition duration-700 group-hover:scale-105 character-image"
                              />
                            </div>

                            <div className="absolute top-3 right-3 z-30">
                              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-active"></div>
                                <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">
                                  Active
                                </span>
                              </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-3 z-20 flex flex-col justify-end h-full group-hover:opacity-0 transition-opacity duration-300">
                              <div className="transform translate-y-2">
                                <div
                                  className={`border-l-4 pl-2 mb-1 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                                >
                                  <h3
                                    className={`text-lg font-bold leading-none drop-shadow-md ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-white" : "text-gray-900"}`}
                                  >
                                    {agent.name}
                                  </h3>
                                  <p
                                    className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-[#0ea5e9]" : "text-blue-600"}`}
                                  >
                                    {agent.role}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className={`absolute inset-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-4 text-center hologram-bg backdrop-blur-md ${theme === "dark" ? "bg-[#020617]/90" : "bg-white/90"}`}
                            >
                              <div className={`scan-bar ${isManager ? "manager-scan-bar" : ""}`}></div>

                              <div className="relative z-10 transform scale-95 group-hover:scale-100 transition-transform duration-500 delay-75">
                                <h3
                                  className={`text-lg font-bold mb-1 ${isManager ? "text-[#E52B50]" : theme === "dark" ? "text-[#0ea5e9]" : "text-blue-600"}`}
                                >
                                  {agent.name}
                                </h3>
                                <p
                                  className={`text-[9px] uppercase tracking-widest mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {agent.role}
                                </p>

                                <div
                                  className={`h-px w-8 mx-auto mb-2 ${isManager ? "bg-[#E52B50]" : theme === "dark" ? "bg-[#0ea5e9]" : "bg-blue-600"}`}
                                ></div>

                                <p
                                  className={`text-[10px] font-medium leading-relaxed px-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                                >
                                  Clicca per accedere
                                </p>

                                <div
                                  className={`mt-3 px-3 py-1 rounded border font-bold uppercase text-[9px] tracking-widest inline-block
                            ${isManager ? "border-[#E52B50] text-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9] text-[#0ea5e9]" : "border-blue-600 text-blue-600"}`}
                                >
                                  Accedi
                                </div>
                              </div>

                              <div
                                className={`absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                              ></div>
                              <div
                                className={`absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                              ></div>
                              <div
                                className={`absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                              ></div>
                              <div
                                className={`absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 ${isManager ? "border-[#E52B50]" : theme === "dark" ? "border-[#0ea5e9]" : "border-blue-600"}`}
                              ></div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
