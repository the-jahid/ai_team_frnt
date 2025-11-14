import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"

/* ---------------------------- API base URL ---------------------------- */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://ai-team-server.onrender.com"

/* ------------------------------ Types ------------------------------ */

// /admin/selected-agents -> string[] (["NIKO", "ALADINO", ...])
type AssignedAgentName = string

// /admin/group-assignments -> array di assegnazioni con dentro il group
interface AgentGroup {
  id: string
  name: string
  description?: string | null
  // se un giorno aggiungi "slug" nel backend lo puoi usare qui
  slug?: string | null
}

interface GroupAssignment {
  id: string
  email: string
  groupId: string
  isActive: boolean
  group?: AgentGroup
}

type UiAgent = {
  key: string // deve combaciare con l'enum (ALEX, MIKE, NIKO, ...)
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
    key: "ALADINO", // usa esattamente il valore che hai in enum
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
  // Test agents – collegati alle pagine che hai nello screenshot
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

/* ------------------------- Helpers ------------------------- */

// Se nel futuro hai un campo slug nel group, usalo; altrimenti
// creiamo uno slug dal nome: "Test Alex AI" -> "test-alex-ai"
function getGroupHref(group: AgentGroup): string {
  if (group.slug) {
    return `/dashboard/${group.slug}`
  }

  const slug = group.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `/dashboard/${slug}`
}

/* ------------------------- Fetch helpers (server) ------------------------- */

// /admin/selected-agents?email=...
async function fetchAssignedAgents(email: string): Promise<AssignedAgentName[]> {
  const url = `${API_BASE}/admin/selected-agents?email=${encodeURIComponent(
    email,
  )}`

  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    console.error("Failed to fetch assigned agents", res.status, await res.text())
    return []
  }

  return res.json()
}

// /admin/group-assignments?email=...&activeOnly=true
async function fetchAssignedGroups(email: string): Promise<GroupAssignment[]> {
  const url = `${API_BASE}/admin/group-assignments?email=${encodeURIComponent(
    email,
  )}&activeOnly=true`

  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    console.error("Failed to fetch assigned groups", res.status, await res.text())
    return []
  }

  return res.json()
}

/* -------------------------------- Page -------------------------------- */

export default async function HomePage() {
  const user = await currentUser()

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress

  if (!user || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-base text-muted-foreground">
          Devi effettuare il login per vedere i tuoi agenti assegnati.
        </p>
      </div>
    )
  }

  const [assignedAgentNames, assignedGroups] = await Promise.all([
    fetchAssignedAgents(email),
    fetchAssignedGroups(email),
  ])

  // Mostra solo gli agenti il cui "key" è presente nell'array di stringhe ricevuto dall'API
  const visibleAgents = agents.filter((agent) =>
    assignedAgentNames.includes(agent.key),
  )

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto w-[90%] max-w-[1200px] py-10">
        {/* Header Section */}
        <header className="relative mb-12 rounded-xl bg-[#235E84] px-5 py-[30px] text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          {user && (
            <div className="absolute right-5 top-5">
              <UserButton />
            </div>
          )}
          <h1 className="mb-2 font-sans text-[36px] font-bold leading-tight text-white">
            Incontra i tuoi Specialisti AI
          </h1>
          <p className="text-lg text-white/90">
            Qui trovi solo gli agenti AI e i gruppi che ti sono stati assegnati.
          </p>
        </header>

        {/* Groups Section (assigned groups) */}
        {assignedGroups.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 font-sans text-2xl font-semibold text-slate-800">
              I tuoi Gruppi di Agenti
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {assignedGroups.map((assigned) => {
                if (!assigned.group) return null

                const group = assigned.group
                const href = getGroupHref(group)

                return (
                  <Link key={assigned.id} href={href} className="group">
                    <Card className="flex h-full flex-col justify-between border border-border bg-card p-6 text-left shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.04)]">
                      <div>
                        <h3 className="mb-2 font-sans text-[20px] font-semibold text-card-foreground">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-wide text-[#235E84]">
                        Gruppo di agenti AI
                      </p>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Agents Grid (assigned agents) */}
        <section>
          <h2 className="mb-4 font-sans text-2xl font-semibold text-slate-800">
            I tuoi Agenti AI assegnati
          </h2>

          {visibleAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun agente AI ti è stato ancora assegnato.
            </p>
          ) : (
            <main className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleAgents.map((agent) => (
                <Link key={agent.key} href={agent.href} className="group">
                  <Card className="overflow-hidden border border-border bg-card shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[5px] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.04)]">
                    {/* Agent Avatar */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
                      <Image
                        src={agent.image || "/placeholder.svg"}
                        alt={agent.name}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Agent Info */}
                    <div className="p-6">
                      <h3 className="mb-2 font-sans text-[20px] font-semibold text-card-foreground">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
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
    </div>
  )
}
