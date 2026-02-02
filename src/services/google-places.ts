// Google Places API (New) Service
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

export interface PlaceResult {
  id: string
  displayName: string
  formattedAddress: string
  addressComponents?: {
    longText: string
    shortText: string
    types: string[]
  }[]
  location: {
    latitude: number
    longitude: number
  }
  rating?: number
  userRatingCount?: number
  websiteUri?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  googleMapsUri?: string
  businessStatus?: string
  types?: string[]
}

export interface SearchPlacesParams {
  query: string
  latitude: number
  longitude: number
  radiusMiles: number
}

export interface SearchPlacesResult {
  places: PlaceResult[]
  error?: string
}

// Convert miles to meters for Google API
function milesToMeters(miles: number): number {
  return miles * 1609.34
}

// Calculate distance between two points using Haversine formula
export function calculateDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function searchPlaces(
  params: SearchPlacesParams
): Promise<SearchPlacesResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { places: [], error: "GOOGLE_MAPS_API_KEY not configured" }
  }

  const radiusMeters = milesToMeters(params.radiusMiles)

  // Using Places API (New) Text Search
  const url = "https://places.googleapis.com/v1/places:searchText"

  const requestBody = {
    textQuery: params.query,
    locationBias: {
      circle: {
        center: {
          latitude: params.latitude,
          longitude: params.longitude,
        },
        radius: radiusMeters,
      },
    },
    maxResultCount: 20,
    languageCode: "en",
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.types",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google Places API error:", errorText)
      return { places: [], error: `API error: ${response.status}` }
    }

    const data = await response.json()

    const places: PlaceResult[] = (data.places || []).map((place: any) => ({
      id: place.id,
      displayName: place.displayName?.text || "",
      formattedAddress: place.formattedAddress || "",
      addressComponents: place.addressComponents,
      location: place.location,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      websiteUri: place.websiteUri,
      nationalPhoneNumber: place.nationalPhoneNumber,
      internationalPhoneNumber: place.internationalPhoneNumber,
      googleMapsUri: place.googleMapsUri,
      businessStatus: place.businessStatus,
      types: place.types,
    }))

    return { places }
  } catch (error) {
    console.error("Error searching places:", error)
    return { places: [], error: String(error) }
  }
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY not configured")
    return null
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK" || !data.results?.[0]) {
      console.error("Geocoding failed:", data.status)
      return null
    }

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

// Parse address components into structured fields
export function parseAddressComponents(
  components?: PlaceResult["addressComponents"]
): {
  address: string
  addressLine2: string
  city: string
  state: string
  zipcode: string
  country: string
} {
  const result = {
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zipcode: "",
    country: "USA",
  }

  if (!components) return result

  let streetNumber = ""
  let route = ""

  for (const component of components) {
    const types = component.types || []

    if (types.includes("street_number")) {
      streetNumber = component.longText
    } else if (types.includes("route")) {
      route = component.longText
    } else if (types.includes("subpremise")) {
      result.addressLine2 = component.longText
    } else if (types.includes("locality")) {
      result.city = component.longText
    } else if (types.includes("administrative_area_level_1")) {
      result.state = component.shortText
    } else if (types.includes("postal_code")) {
      result.zipcode = component.longText
    } else if (types.includes("country")) {
      result.country = component.shortText
    }
  }

  result.address = [streetNumber, route].filter(Boolean).join(" ")

  return result
}
