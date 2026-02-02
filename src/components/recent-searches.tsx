"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Trash2, X, Users } from "lucide-react"
import { RecentSearch } from "@/hooks/use-recent-searches"

interface RecentSearchesProps {
  searches: RecentSearch[]
  activeSearchId?: string
  onSelectSearch: (search: RecentSearch) => void
  onRemoveSearch: (id: string) => void
  onClearAll: () => void
}

const searchTypeLabels: Record<string, string> = {
  catering: "Catering",
  pizza_diner: "Pizza & Diners",
  meal_prep: "Meal Prep",
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function RecentSearches({
  searches,
  activeSearchId,
  onSelectSearch,
  onRemoveSearch,
  onClearAll,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </CardTitle>
            <CardDescription>Click to view saved leads from previous searches</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {searches.map((search) => (
            <div
              key={search.id}
              className={`group relative flex flex-col p-3 rounded-lg border transition-colors cursor-pointer ${
                activeSearchId === search.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "bg-card hover:bg-accent/50"
              }`}
              onClick={() => onSelectSearch(search)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveSearch(search.id)
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                aria-label="Remove search"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>

              <div className="flex items-start gap-2 mb-1">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {search.schoolName || "Unnamed Location"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {search.schoolAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {searchTypeLabels[search.searchType] || search.searchType}
                </span>
                <span>{search.radiusMiles} mi</span>
              </div>

              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Users className="h-3 w-3" />
                  {search.leads?.length ?? 0} leads
                </span>
                <span className="text-muted-foreground">{formatTimeAgo(search.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
