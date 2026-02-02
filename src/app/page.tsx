"use client"

import { useState } from "react"
import { LeadGeneratorForm, SearchParams } from "@/components/lead-generator-form"
import { LeadsTable } from "@/components/leads-table"
import { RecentSearches } from "@/components/recent-searches"
import { useRecentSearches, RecentSearch, Lead } from "@/hooks/use-recent-searches"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [schoolName, setSchoolName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [activeSearchId, setActiveSearchId] = useState<string | undefined>()
  const { toast } = useToast()
  const { recentSearches, addSearch, removeSearch, clearAllSearches } = useRecentSearches()

  const handleGenerate = async (params: SearchParams) => {
    setIsLoading(true)
    setSchoolName(params.schoolName)
    setActiveSearchId(undefined) // Clear active search when running new search

    try {
      const response = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate leads")
      }

      setLeads(data.leads)

      // Save to recent searches with the actual leads data
      addSearch({
        schoolAddress: params.schoolAddress,
        schoolName: params.schoolName,
        radiusMiles: params.radiusMiles,
        searchType: params.searchType,
        enrichLeads: params.enrichLeads,
        leads: data.leads,
      })

      toast({
        title: "Leads Generated",
        description: `Found ${data.leads.length} leads near the school address.`,
      })
    } catch (error) {
      console.error("Error generating leads:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate leads",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRecentSearch = (search: RecentSearch) => {
    // Restore the saved leads from this search
    setLeads(search.leads)
    setSchoolName(search.schoolName)
    setActiveSearchId(search.id)
  }

  const handleRemoveSearch = (id: string) => {
    removeSearch(id)
    // If we're viewing this search's results, clear them
    if (activeSearchId === id) {
      setLeads([])
      setSchoolName("")
      setActiveSearchId(undefined)
    }
  }

  const handleClearAll = () => {
    clearAllSearches()
    // Clear current results if viewing a saved search
    if (activeSearchId) {
      setLeads([])
      setSchoolName("")
      setActiveSearchId(undefined)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch("/api/leads/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads, schoolName }),
      })

      if (!response.ok) {
        throw new Error("Failed to export leads")
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `leads_${schoolName || "export"}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Complete",
        description: "Leads have been exported to Excel.",
      })
    } catch (error) {
      console.error("Error exporting leads:", error)
      toast({
        title: "Error",
        description: "Failed to export leads",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ordo Lead Generator</h1>
          <p className="text-gray-600 mt-2">
            Find catering partners for schools quickly and efficiently
          </p>
        </div>

        <LeadGeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />

        <RecentSearches
          searches={recentSearches}
          activeSearchId={activeSearchId}
          onSelectSearch={handleSelectRecentSearch}
          onRemoveSearch={handleRemoveSearch}
          onClearAll={handleClearAll}
        />

        {(leads.length > 0 || isLoading) && (
          <LeadsTable
            leads={leads}
            schoolName={schoolName}
            onExport={handleExport}
            isExporting={isExporting}
          />
        )}
      </div>
    </main>
  )
}
