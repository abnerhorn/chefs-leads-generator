"use client"

import { useState, useEffect, useCallback } from "react"

export interface Lead {
  company: string
  url: string | null
  urlValid: boolean | null
  companyDescription: string | null
  contactFirstName: string | null
  contactLastName: string | null
  contactTitle: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  country: string
  distanceMiles: number | null
  distanceDisplay: string | null
  facebookLink: string | null
  instagramLink: string | null
  source: string
  googlePlaceId: string | null
  rating: number | null
  reviewCount: number | null
  isChain: boolean
  chainFlagged: boolean
  cuisineFlagged: boolean
  flagReason: string | null
}

export interface RecentSearch {
  id: string
  schoolAddress: string
  schoolName: string
  radiusMiles: number
  searchType: string
  enrichLeads: boolean
  timestamp: number
  leads: Lead[]
}

const STORAGE_KEY = "ordo-recent-searches"
const MAX_RECENT_SEARCHES = 5 // Lower limit since we're storing full lead data

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[]
        // Filter out old format entries that don't have leads array
        const validSearches = parsed.filter(
          (s) => Array.isArray(s.leads) && s.leads.length > 0
        )
        setRecentSearches(validSearches)
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever recentSearches changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches))
      } catch (error) {
        // If storage is full, remove oldest searches and retry
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          console.warn("Storage quota exceeded, removing oldest searches")
          setRecentSearches((prev) => prev.slice(0, Math.max(1, prev.length - 1)))
        } else {
          console.error("Failed to save recent searches:", error)
        }
      }
    }
  }, [recentSearches, isLoaded])

  const addSearch = useCallback((search: Omit<RecentSearch, "id" | "timestamp">) => {
    setRecentSearches((prev) => {
      // Check if a similar search already exists (same address and search type)
      const existingIndex = prev.findIndex(
        (s) =>
          s.schoolAddress.toLowerCase() === search.schoolAddress.toLowerCase() &&
          s.searchType === search.searchType
      )

      const newSearch: RecentSearch = {
        ...search,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }

      let updated: RecentSearch[]

      if (existingIndex !== -1) {
        // Update existing search and move to top
        updated = [newSearch, ...prev.filter((_, i) => i !== existingIndex)]
      } else {
        // Add new search at the top
        updated = [newSearch, ...prev]
      }

      // Keep only the most recent searches
      return updated.slice(0, MAX_RECENT_SEARCHES)
    })
  }, [])

  const removeSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearAllSearches = useCallback(() => {
    setRecentSearches([])
  }, [])

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearAllSearches,
    isLoaded,
  }
}
