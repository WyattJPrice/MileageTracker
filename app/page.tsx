import { Dashboard, type DashboardProps } from "@/components/dashboard"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string }>
}) {
  const params = await searchParams
  const initialView = params.view ?? null
  const initialTab = (params.tab ?? (initialView ? "detailed" : null)) as
    | DashboardProps["initialTab"]
    | null

  return (
    <main>
      <Dashboard initialTab={initialTab} initialView={initialView} />
    </main>
  )
}