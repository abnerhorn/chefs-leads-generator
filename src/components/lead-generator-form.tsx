"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Sparkles } from "lucide-react"

export interface SearchParams {
  schoolAddress: string
  schoolName: string
  radiusMiles: number
  searchType: string
  enrichLeads: boolean
}

interface LeadGeneratorFormProps {
  onGenerate: (params: SearchParams) => Promise<void>
  isLoading: boolean
}

export function LeadGeneratorForm({ onGenerate, isLoading }: LeadGeneratorFormProps) {
  const [schoolAddress, setSchoolAddress] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [radiusMiles, setRadiusMiles] = useState("15")
  const [searchType, setSearchType] = useState("catering")
  const [enrichLeads, setEnrichLeads] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onGenerate({
      schoolAddress,
      schoolName,
      radiusMiles: parseInt(radiusMiles),
      searchType,
      enrichLeads,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find Catering Partners
        </CardTitle>
        <CardDescription>
          Enter a school address to discover local catering companies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schoolAddress">School Address *</Label>
              <Input
                id="schoolAddress"
                placeholder="123 Main St, City, State ZIP"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name (optional)</Label>
              <Input
                id="schoolName"
                placeholder="Example Elementary School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select
                value={searchType}
                onValueChange={setSearchType}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catering">Catering Companies</SelectItem>
                  <SelectItem value="pizza_diner">Pizza & Diners</SelectItem>
                  <SelectItem value="meal_prep">Meal Prep Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Search Radius</Label>
              <Select
                value={radiusMiles}
                onValueChange={setRadiusMiles}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="15">15 miles</SelectItem>
                  <SelectItem value="20">20 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="30">30 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enrichment</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="enrichLeads"
                  checked={enrichLeads}
                  onChange={(e) => setEnrichLeads(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="enrichLeads" className="text-sm font-normal cursor-pointer">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Scrape emails & contacts
                  </span>
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading || !schoolAddress} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Generate Leads
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
