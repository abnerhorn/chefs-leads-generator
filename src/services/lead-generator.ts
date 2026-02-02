// Lead Generator Service
// Orchestrates discovery, enrichment, and filtering of leads

import {
  searchPlaces,
  geocodeAddress,
  parseAddressComponents,
  calculateDistanceMiles,
  type PlaceResult,
} from "./google-places"
import { detectChain, hasFranchiseIndicators } from "./chain-detector"
import { scrapeWebsite, validateUrl } from "./website-scraper"

export type SearchType = "catering" | "pizza_diner" | "meal_prep" | "custom"

export interface GenerateLeadsParams {
  schoolAddress: string
  schoolName?: string
  radiusMiles: number
  searchType: SearchType
  customSearchTerms?: string[]
}

export interface GeneratedLead {
  // Company Info
  company: string
  url: string | null
  urlValid: boolean | null
  companyDescription: string | null

  // Contact Info
  contactFirstName: string | null
  contactLastName: string | null
  contactTitle: string | null
  contactEmail: string | null
  contactPhone: string | null

  // Address
  address: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  country: string

  // Calculated
  distanceMiles: number | null
  distanceDisplay: string | null

  // Social
  facebookLink: string | null
  instagramLink: string | null

  // Metadata
  source: string
  googlePlaceId: string | null
  rating: number | null
  reviewCount: number | null
  isChain: boolean
  chainFlagged: boolean
  cuisineFlagged: boolean
  flagReason: string | null
}

export interface GenerateLeadsResult {
  success: boolean
  leads: GeneratedLead[]
  schoolLocation: {
    lat: number
    lng: number
    formattedAddress: string
  } | null
  searchTermsUsed: string[]
  error?: string
}

// Get search terms based on type
function getSearchTerms(
  searchType: SearchType,
  customTerms?: string[]
): string[] {
  switch (searchType) {
    case "catering":
      return ["catering", "catering company", "food catering", "meal prep catering"]
    case "pizza_diner":
      return ["pizza restaurant", "diner", "local pizza"]
    case "meal_prep":
      return ["meal prep", "meal delivery", "prepared meals"]
    case "custom":
      return customTerms || ["catering"]
    default:
      return ["catering"]
  }
}

export async function generateLeads(
  params: GenerateLeadsParams
): Promise<GenerateLeadsResult> {
  // Step 1: Geocode the school address
  const schoolLocation = await geocodeAddress(params.schoolAddress)

  if (!schoolLocation) {
    return {
      success: false,
      leads: [],
      schoolLocation: null,
      searchTermsUsed: [],
      error: "Could not geocode school address",
    }
  }

  const searchTerms = getSearchTerms(params.searchType, params.customSearchTerms)
  const allPlaces: Map<string, PlaceResult> = new Map()

  // Step 2: Search for places using each search term
  for (const term of searchTerms) {
    const query = `${term} near ${params.schoolAddress}`
    const result = await searchPlaces({
      query,
      latitude: schoolLocation.lat,
      longitude: schoolLocation.lng,
      radiusMiles: params.radiusMiles,
    })

    if (result.places) {
      for (const place of result.places) {
        // Deduplicate by place ID
        if (!allPlaces.has(place.id)) {
          allPlaces.set(place.id, place)
        }
      }
    }
  }

  // Step 3: Process each place into a lead
  const leads: GeneratedLead[] = []

  for (const place of allPlaces.values()) {
    // Calculate distance
    const distanceMiles = calculateDistanceMiles(
      schoolLocation.lat,
      schoolLocation.lng,
      place.location.latitude,
      place.location.longitude
    )

    // Skip if outside radius
    if (distanceMiles > params.radiusMiles) {
      continue
    }

    // Check for chains
    const chainResult = detectChain(place.displayName)
    const franchiseIndicators = hasFranchiseIndicators(
      place.displayName,
      place.websiteUri
    )

    // Parse address
    const addressParts = parseAddressComponents(place.addressComponents)

    // If no parsed address, try to extract from formatted address
    if (!addressParts.city && place.formattedAddress) {
      const parts = place.formattedAddress.split(",").map((p) => p.trim())
      if (parts.length >= 3) {
        addressParts.address = parts[0]
        addressParts.city = parts[1]
        const stateZip = parts[2].split(" ")
        addressParts.state = stateZip[0]
        addressParts.zipcode = stateZip[1] || ""
      }
    }

    const lead: GeneratedLead = {
      company: place.displayName,
      url: place.websiteUri || null,
      urlValid: null,
      companyDescription: null,

      contactFirstName: null,
      contactLastName: null,
      contactTitle: null,
      contactEmail: null,
      contactPhone: place.nationalPhoneNumber || null,

      address: addressParts.address || null,
      addressLine2: addressParts.addressLine2 || null,
      city: addressParts.city || null,
      state: addressParts.state || null,
      zipcode: addressParts.zipcode || null,
      country: addressParts.country || "USA",

      distanceMiles: Math.round(distanceMiles * 10) / 10,
      distanceDisplay: `${Math.round(distanceMiles * 10) / 10} miles`,

      facebookLink: null,
      instagramLink: null,

      source: "google_places",
      googlePlaceId: place.id,
      rating: place.rating || null,
      reviewCount: place.userRatingCount || null,
      isChain: chainResult.isChain || franchiseIndicators,
      chainFlagged: chainResult.isChain || franchiseIndicators,
      cuisineFlagged: chainResult.isCuisineLimited,
      flagReason: chainResult.isChain
        ? `Known chain: ${chainResult.matchedChain}`
        : chainResult.isCuisineLimited
          ? `Cuisine-limited: ${chainResult.matchedCuisine}`
          : franchiseIndicators
            ? "Possible franchise"
            : null,
    }

    leads.push(lead)
  }

  // Sort by distance
  leads.sort((a, b) => (a.distanceMiles || 999) - (b.distanceMiles || 999))

  return {
    success: true,
    leads,
    schoolLocation: {
      lat: schoolLocation.lat,
      lng: schoolLocation.lng,
      formattedAddress: schoolLocation.formattedAddress,
    },
    searchTermsUsed: searchTerms,
  }
}

// Enrich a single lead with website data
export async function enrichLead(lead: GeneratedLead): Promise<GeneratedLead> {
  if (!lead.url) {
    return lead
  }

  // Validate URL
  lead.urlValid = await validateUrl(lead.url)

  if (!lead.urlValid) {
    return lead
  }

  // Scrape website
  const websiteData = await scrapeWebsite(lead.url)

  if (websiteData.isValid) {
    // Get first email found
    if (websiteData.emails.length > 0) {
      lead.contactEmail = websiteData.emails[0]
    }

    // Get phone if we don't have one
    if (!lead.contactPhone && websiteData.phones.length > 0) {
      lead.contactPhone = websiteData.phones[0]
    }

    // Get contact name
    if (websiteData.contactName) {
      const nameParts = websiteData.contactName.split(" ")
      lead.contactFirstName = nameParts[0] || null
      lead.contactLastName = nameParts.slice(1).join(" ") || null
      lead.contactTitle = websiteData.contactTitle || null
    }

    // Get social links
    lead.facebookLink = websiteData.facebookUrl || null
    lead.instagramLink = websiteData.instagramUrl || null

    // Get description
    lead.companyDescription = websiteData.description || null
  }

  return lead
}

// Enrich multiple leads (with rate limiting)
export async function enrichLeads(
  leads: GeneratedLead[],
  onProgress?: (current: number, total: number) => void
): Promise<GeneratedLead[]> {
  const enrichedLeads: GeneratedLead[] = []

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]

    if (onProgress) {
      onProgress(i + 1, leads.length)
    }

    const enrichedLead = await enrichLead(lead)
    enrichedLeads.push(enrichedLead)

    // Rate limit: wait 500ms between requests to be respectful
    if (i < leads.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return enrichedLeads
}
