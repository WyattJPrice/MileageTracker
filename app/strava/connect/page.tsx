import { redirect } from "next/navigation"
import { isConnected } from "@/lib/strava"

interface Props {
  searchParams: Promise<{ secret?: string; success?: string; error?: string }>
}

export default async function StravaConnectPage({ searchParams }: Props) {
  const params = await searchParams

  if (params.secret !== process.env.STRAVA_ADMIN_SECRET) {
    redirect("/")
  }

  const connected = await isConnected()

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://miles.wyattprice.dev"}/api/strava/callback`
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read&approval_prompt=auto`

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
        Strava Connection
      </h1>

      {params.success && (
        <div className="mt-4 rounded-md border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
          Connected successfully. New runs will sync automatically once the webhook is configured.
        </div>
      )}

      {params.error && (
        <div className="mt-4 rounded-md border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          Connection failed. Try again.
        </div>
      )}

      <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
          <span className="text-sm text-zinc-300">
            {connected ? "Connected to Strava" : "Not connected"}
          </span>
        </div>

        <a
          href={authUrl}
          className="mt-5 flex w-full items-center justify-center rounded-md bg-[#fc4c02] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {connected ? "Reconnect" : "Connect to Strava"}
        </a>
      </div>
    </div>
  )
}
