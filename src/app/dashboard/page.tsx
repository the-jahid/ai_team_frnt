"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUser } from "@clerk/nextjs"

/* ---------------------------- API base URL ---------------------------- */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://ai-team-server.onrender.com"

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

interface GroupAgent {
  id: string
  groupId: string
  agentName: string
  isActive: boolean
}

type UiAgent = {
  key: string
  name: string
  role: string
  image: string
  href: string
}

/* ------------------------- Static UI config ------------------------- */

const agents: UiAgent[] = [
  {
    key: "ALEX",
    name: "Alex AI",
    role: "Cross-Platform ADs Manager",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/03/David-AI-Ai-Specialist-social-ads.png",
    href: "/dashboard/alex-ai",
  },
  {
    key: "TONY",
    name: "Tony AI",
    role: "Direttore Commerciale",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Tony-AI-strategiest.png",
    href: "/dashboard/tony-ai",
  },
  {
    key: "ALADINO",
    name: "Aladino AI",
    role: "Creatore di nuove offerte e prodotti",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Aladdin-AI-consultant.png",
    href: "/dashboard/aladino-ai",
  },
  {
    key: "LARA",
    name: "Lara AI",
    role: "Social Media Manager",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Lara-AI-social-strategiest.png",
    href: "/dashboard/lara-ai",
  },
  {
    key: "SIMONE",
    name: "Simone AI",
    role: "SEO Copywriter",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Simone-AI-seo-copy.png",
    href: "/dashboard/simone-ai",
  },
  {
    key: "MIKE",
    name: "Mike AI",
    role: "Direttore Marketing",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Mike-AI-digital-marketing-mg.png",
    href: "/dashboard/mike-ai",
  },
  {
    key: "VALENTINA",
    name: "Valentina AI",
    role: "SEO Optimizer",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/03/Valentina-AI-AI-SEO-optimizer.png",
    href: "/dashboard/valentina-ai",
  },
  {
    key: "NIKO",
    name: "Niko AI",
    role: "SEO Manager",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Niko-AI.png",
    href: "/dashboard/niko-ai",
  },
  {
    key: "JIM",
    name: "Jim AI",
    role: "Coach di Vendite",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Jim-AI-%E2%80%93-AI-Coach.png",
    href: "/dashboard/jim-ai",
  },
  {
    key: "DANIELE",
    name: "Daniele AI",
    role: "Copywriter per Vendere (Direct Response)",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/11/daniele_ai_direct_response_copywriter.png",
    href: "/dashboard/daniele-ai",
  },
  {
    key: "TEST_MIKE",
    name: "Test Mike AI",
    role: "Test Marketing Director",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Mike-AI-digital-marketing-mg.png",
    href: "/dashboard/test-mike-ai",
  },
  {
    key: "TEST_ALEX",
    name: "Test Alex AI",
    role: "Test ADs Manager",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/03/David-AI-Ai-Specialist-social-ads.png",
    href: "/dashboard/test-alex-ai",
  },
  {
    key: "TEST_TONY",
    name: "Test Tony AI",
    role: "Test Sales Director",
    image:
      "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Tony-AI-strategiest.png",
    href: "/dashboard/test-tony-ai",
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

        // Fetch assigned agents
        const agentsRes = await fetch(
          `${API_BASE}/admin/selected-agents?email=${encodeURIComponent(userEmail)}`,
          { cache: "no-store" }
        )
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          console.log("[v0] Assigned agents:", agentsData)
          setAssignedAgentNames(agentsData)
        }

        // Fetch assigned groups
        const groupsRes = await fetch(
          `${API_BASE}/admin/group-assignments?email=${encodeURIComponent(
            userEmail
          )}&activeOnly=true`,
          { cache: "no-store" }
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
        
        // Update the selected group with the name from the API
        setSelectedGroup({
          ...group,
          name: groupData.group.name,
        })
        
        // Map agent IDs to full agent objects
        const agentIds = groupData.agents
        const matchedAgents = agents.filter((agent) =>
          agentIds.includes(agent.key)
        )
        
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

  const visibleAgents = agents.filter((agent) =>
    assignedAgentNames.includes(agent.key)
  )

  if (isLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          Devi effettuare il login per vedere i tuoi agenti assegnati.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header Section */}
        <header className="relative mb-8 rounded-lg bg-[#235E84] px-4 py-6 text-center shadow-sm sm:mb-10 sm:rounded-xl sm:px-6 sm:py-8 md:mb-12 md:px-8 md:py-10 lg:px-10">
          <h1 className="mb-2 font-sans text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-[36px]">
            Incontra i tuoi Specialisti AI
          </h1>
          <p className="text-sm text-white/90 sm:text-base md:text-lg">
            Qui trovi solo gli agenti AI e i gruppi che ti sono stati assegnati.
          </p>
        </header>

        {assignedGroups.length > 0 && (
          <section className="mb-8 sm:mb-10">
            <h2 className="mb-3 font-sans text-xl font-semibold text-slate-800 sm:mb-4 sm:text-2xl">
              I tuoi Gruppi di Agenti
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
              {assignedGroups.map((assigned) => {
                if (!assigned.group) return null

                const group = assigned.group

                return (
                  <button
                    key={assigned.id}
                    onClick={() => handleGroupClick(group)}
                    className="group text-left"
                  >
                    <Card className="flex h-full flex-col justify-between border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5 md:p-6 md:hover:-translate-y-[5px] md:hover:shadow-lg">
                      <div>
                        <h3 className="mb-1.5 font-sans text-lg font-semibold text-card-foreground sm:mb-2 sm:text-xl md:text-[20px]">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <p className="mt-3 text-[10px] uppercase tracking-wide text-[#235E84] sm:mt-4 sm:text-xs">
                        Gruppo di agenti AI
                      </p>
                    </Card>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Agents Grid */}
        <section>
          <h2 className="mb-3 font-sans text-xl font-semibold text-slate-800 sm:mb-4 sm:text-2xl">
            I tuoi Agenti AI assegnati
          </h2>

          {visibleAgents.length === 0 ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              Nessun agente AI ti è stato ancora assegnato.
            </p>
          ) : (
            <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4 2xl:grid-cols-5">
              {visibleAgents.map((agent) => (
                <Link key={agent.key} href={agent.href} className="group">
                  <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:hover:-translate-y-[5px] md:hover:shadow-lg">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
                      <Image
                        src={agent.image || "/placeholder.svg"}
                        alt={agent.name}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4 sm:p-5 md:p-6">
                      <h3 className="mb-1.5 font-sans text-lg font-semibold text-card-foreground sm:mb-2 sm:text-xl md:text-[20px]">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {agent.role}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </main>
          )}
        </section>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold sm:text-2xl">
              {selectedGroup?.name}
            </DialogTitle>
            {selectedGroup?.description && (
              <p className="text-xs text-muted-foreground sm:text-sm">
                {selectedGroup.description}
              </p>
            )}
          </DialogHeader>

          <div className="mt-4 sm:mt-6">
            {isModalLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : groupAgents.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground sm:py-8 sm:text-sm">
                Nessun agente trovato in questo gruppo.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                {groupAgents.map((agent) => (
                  <Link
                    key={agent.key}
                    href={agent.href}
                    className="group"
                    onClick={handleCloseModal}
                  >
                    <Card className="overflow-hidden border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:hover:-translate-y-[5px] md:hover:shadow-lg">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
                        <Image
                          src={agent.image || "/placeholder.svg"}
                          alt={agent.name}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-3 sm:p-4">
                        <h3 className="mb-1 font-sans text-base font-semibold text-card-foreground sm:text-lg md:text-[18px]">
                          {agent.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                          {agent.role}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
