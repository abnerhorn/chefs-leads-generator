// Website Scraper Service
// Extracts contact information, emails, and social links from business websites

export interface WebsiteData {
  isValid: boolean
  emails: string[]
  phones: string[]
  contactName?: string
  contactTitle?: string
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  description?: string
}

// Email regex pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Phone patterns (US-focused)
const PHONE_PATTERN =
  /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook:
    /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?/gi,
  instagram:
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?/gi,
  linkedin:
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._-]+\/?/gi,
}

// Validate if a URL is reachable
export async function validateUrl(url: string): Promise<boolean> {
  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith("http") ? url : `https://${url}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(fullUrl, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    // Try with http if https failed
    if (!url.startsWith("http://")) {
      try {
        const httpUrl = url.startsWith("https://")
          ? url.replace("https://", "http://")
          : `http://${url}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(httpUrl, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        })

        clearTimeout(timeoutId)
        return response.ok
      } catch {
        return false
      }
    }
    return false
  }
}

// Scrape website for contact information
export async function scrapeWebsite(url: string): Promise<WebsiteData> {
  const result: WebsiteData = {
    isValid: false,
    emails: [],
    phones: [],
  }

  try {
    // Ensure URL has protocol
    const fullUrl = url.startsWith("http") ? url : `https://${url}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OrdoLeadGen/1.0; +https://ordo.com)",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return result
    }

    result.isValid = true

    const html = await response.text()

    // Extract emails (deduplicate)
    const emailMatches = html.match(EMAIL_PATTERN) || []
    const uniqueEmails = [...new Set(emailMatches)]
      .filter(
        (email) =>
          !email.includes("example") &&
          !email.includes("domain") &&
          !email.includes("email@") &&
          !email.includes("@sentry") &&
          !email.includes(".png") &&
          !email.includes(".jpg")
      )
      .slice(0, 5)
    result.emails = uniqueEmails

    // Extract phone numbers (deduplicate)
    const phoneMatches = html.match(PHONE_PATTERN) || []
    const uniquePhones = [...new Set(phoneMatches)]
      .map((p) => p.replace(/\D/g, ""))
      .filter((p) => p.length >= 10 && p.length <= 11)
      .map((p) => {
        // Format as (XXX) XXX-XXXX
        const cleaned = p.length === 11 ? p.slice(1) : p
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      })
      .slice(0, 3)
    result.phones = [...new Set(uniquePhones)]

    // Extract social media links
    const facebookMatch = html.match(SOCIAL_PATTERNS.facebook)
    if (facebookMatch) {
      result.facebookUrl = facebookMatch[0]
      if (!result.facebookUrl.startsWith("http")) {
        result.facebookUrl = `https://${result.facebookUrl}`
      }
    }

    const instagramMatch = html.match(SOCIAL_PATTERNS.instagram)
    if (instagramMatch) {
      result.instagramUrl = instagramMatch[0]
      if (!result.instagramUrl.startsWith("http")) {
        result.instagramUrl = `https://${result.instagramUrl}`
      }
    }

    const linkedinMatch = html.match(SOCIAL_PATTERNS.linkedin)
    if (linkedinMatch) {
      result.linkedinUrl = linkedinMatch[0]
      if (!result.linkedinUrl.startsWith("http")) {
        result.linkedinUrl = `https://${result.linkedinUrl}`
      }
    }

    // Try to extract meta description
    const metaDescMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    )
    if (metaDescMatch) {
      result.description = metaDescMatch[1].slice(0, 500)
    }

    // Contact name lookup via Hunter.io API
    // See HUNTER_IO_IMPLEMENTATION.md for setup instructions
    // TODO: Uncomment once HUNTER_API_KEY is configured in .env.local
    // if (process.env.HUNTER_API_KEY) {
    //   const { findContactByDomain } = await import("./hunter")
    //   const hunterResult = await findContactByDomain(url)
    //   if (hunterResult.success && hunterResult.contact) {
    //     result.contactName = `${hunterResult.contact.firstName} ${hunterResult.contact.lastName}`.trim()
    //     result.contactTitle = hunterResult.contact.position || undefined
    //   }
    // }

    return result
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return result
  }
}

// Try common contact page paths
export async function findContactPage(baseUrl: string): Promise<string | null> {
  const paths = ["/contact", "/contact-us", "/about", "/about-us", "/team"]

  const base = baseUrl.replace(/\/$/, "")

  for (const path of paths) {
    try {
      const url = `${base}${path}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return url
      }
    } catch {
      continue
    }
  }

  return null
}
