"use client"

import { useState, useEffect } from "react"
import {
  Settings2,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FolderGit2,
  LayoutTemplate,
  Check,
} from "lucide-react"
import { Panel, PanelHeader } from "@/components/dashboard/panel"
import { getPreferences, updatePreferences, type UserPreferences } from "@/lib/api/preferences"
import { getRepositories, type Repository } from "@/lib/api/repositories"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [defaultRepoId, setDefaultRepoId] = useState<string | null>(null)
  const [defaultDateRange, setDefaultDateRange] = useState<number>(30)
  const [digestPanelExpanded, setDigestPanelExpanded] = useState<boolean>(true)
  const [geminiApiKey, setGeminiApiKey] = useState<string>("")

  // UI state
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | null; msg: string }>({
    type: null,
    msg: "",
  })

  // Load preferences and repositories
  useEffect(() => {
    async function loadData() {
      try {
        const [prefs, repos] = await Promise.all([getPreferences(), getRepositories()])
        setPreferences(prefs)
        setRepositories(repos)

        // Initialize form states
        setDefaultRepoId(prefs.default_repository_id)
        setDefaultDateRange(prefs.default_date_range_days)
        setDigestPanelExpanded(prefs.digest_panel_expanded)
      } catch (err) {
        setStatus({
          type: "error",
          msg: "Failed to load settings. Please refresh the page.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatus({ type: null, msg: "" })

    try {
      const payload: Parameters<typeof updatePreferences>[0] = {
        default_repository_id: defaultRepoId,
        default_date_range_days: defaultDateRange,
        digest_panel_expanded: digestPanelExpanded,
      }

      // Only send the Gemini key if the user typed something in it
      if (geminiApiKey.trim() !== "" || geminiApiKey === "") {
        payload.gemini_api_key = geminiApiKey === "" ? "" : geminiApiKey
      }

      const updatedPrefs = await updatePreferences(payload)
      setPreferences(updatedPrefs)
      
      // Clear key input after success to keep it write-only
      setGeminiApiKey("")

      setStatus({
        type: "success",
        msg: "Your settings have been saved successfully.",
      })
      setTimeout(() => setStatus({ type: null, msg: "" }), 5000)
    } catch (err: any) {
      setStatus({
        type: "error",
        msg: err.message || "Failed to update preferences.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-950 dark:border-zinc-50"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <Panel className="p-6">
        <PanelHeader icon={Settings2} title="User Settings" />

        <form onSubmit={handleSave} className="space-y-6 mt-6">
          {/* Default Repository Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <FolderGit2 className="w-3.5 h-3.5" />
              Default Repository
            </label>
            <div className="relative">
              <select
                value={defaultRepoId || ""}
                onChange={(e) => setDefaultRepoId(e.target.value || null)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 appearance-none"
              >
                <option value="" className="bg-white dark:bg-[#0F0F12]">None (Select a Repository)</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id} className="bg-white dark:bg-[#0F0F12]">
                    {repo.full_name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Choose the repository that will be loaded automatically when you open the dashboard.
            </p>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Date Range Selection Block */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              Default Analysis Period
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDefaultDateRange(days)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    defaultDateRange === days
                      ? "bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-900"
                      : "bg-transparent border-zinc-200 text-gray-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-gray-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {days === 7 ? "7 Days" : days === 30 ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Sets the rolling window used to aggregate commit history, PR latency metrics, and team distributions.
            </p>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Toggles */}
          <div className="space-y-4">
            {/* Digest Expanded Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Expand Digest Panel
                </label>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Always keep the AI digest side drawer expanded on load.
                </p>
              </div>
              <Switch
                checked={digestPanelExpanded}
                onCheckedChange={setDigestPanelExpanded}
              />
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Gemini API Key Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <KeyRound className="w-3.5 h-3.5" />
                Gemini API Key
              </label>
              {preferences?.gemini_api_key_set ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                  <Check className="w-2.5 h-2.5" /> Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-zinc-900 dark:text-gray-400 dark:border-zinc-800">
                  Not Configured
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder={preferences?.gemini_api_key_set ? "••••••••••••••••••••••••••••••••" : "AIzaSy..."}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Used securely to generate your daily developer summaries and reviews. To change the key, enter a new one. To clear the saved key, empty the field and save.
            </p>
          </div>

          {/* Status Feedback Notice Banner */}
          {status.type && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold transition-all ${
                status.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                  : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50"
              }`}
            >
              {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status.msg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2 px-4 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
