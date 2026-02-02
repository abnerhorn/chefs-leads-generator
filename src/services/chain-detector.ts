// Chain Detection Service
// Identifies known chain businesses that should be filtered out

const KNOWN_CHAINS = new Set([
  // Fast food
  "mcdonald's",
  "mcdonalds",
  "burger king",
  "wendy's",
  "wendys",
  "taco bell",
  "kfc",
  "kentucky fried chicken",
  "chick-fil-a",
  "chickfila",
  "popeyes",
  "arby's",
  "arbys",
  "sonic",
  "jack in the box",
  "carl's jr",
  "carls jr",
  "hardee's",
  "hardees",
  "whataburger",
  "in-n-out",
  "in n out",
  "five guys",
  "shake shack",
  "white castle",

  // Pizza chains
  "domino's",
  "dominos",
  "pizza hut",
  "papa john's",
  "papa johns",
  "little caesars",
  "papa murphy's",
  "papa murphys",
  "marco's pizza",
  "marcos pizza",
  "hungry howie's",

  // Fast casual
  "chipotle",
  "panera",
  "panera bread",
  "qdoba",
  "moe's",
  "moes",
  "panda express",
  "noodles & company",
  "noodles and company",
  "firehouse subs",
  "jersey mike's",
  "jersey mikes",
  "jimmy john's",
  "jimmy johns",
  "subway",
  "quiznos",
  "potbelly",
  "jason's deli",
  "jasons deli",
  "mcalister's",
  "mcalisters",
  "newk's",
  "newks",
  "zaxby's",
  "zaxbys",
  "wingstop",
  "buffalo wild wings",
  "hooters",

  // Casual dining
  "applebee's",
  "applebees",
  "chili's",
  "chilis",
  "olive garden",
  "red lobster",
  "outback steakhouse",
  "outback",
  "longhorn steakhouse",
  "texas roadhouse",
  "cracker barrel",
  "denny's",
  "dennys",
  "ihop",
  "waffle house",
  "perkins",
  "bob evans",
  "golden corral",
  "ruby tuesday",
  "tgi friday's",
  "tgi fridays",
  "red robin",
  "cheesecake factory",
  "bj's restaurant",
  "bjs restaurant",
  "buffalo wild wings",
  "dave and buster's",
  "dave and busters",

  // Coffee chains
  "starbucks",
  "dunkin",
  "dunkin donuts",

  // Catering-specific chains
  "clean eatz",
  "cleaneatz",
  "corporate catering",
])

// Cuisine-limited keywords (flag these for review)
const CUISINE_LIMITED_KEYWORDS = [
  "mexican",
  "tacos",
  "taqueria",
  "burrito",
  "asian",
  "chinese",
  "japanese",
  "sushi",
  "thai",
  "vietnamese",
  "pho",
  "korean",
  "indian",
  "curry",
  "mediterranean",
  "greek",
  "middle eastern",
  "italian",
  "pizzeria",
  "bbq",
  "barbecue",
  "soul food",
  "cajun",
  "creole",
]

export interface ChainDetectionResult {
  isChain: boolean
  isCuisineLimited: boolean
  matchedChain?: string
  matchedCuisine?: string
}

export function detectChain(businessName: string): ChainDetectionResult {
  const normalized = businessName.toLowerCase().trim()

  // Check for exact chain matches
  for (const chain of KNOWN_CHAINS) {
    if (normalized.includes(chain)) {
      return {
        isChain: true,
        isCuisineLimited: false,
        matchedChain: chain,
      }
    }
  }

  // Check for cuisine-limited keywords
  for (const keyword of CUISINE_LIMITED_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        isChain: false,
        isCuisineLimited: true,
        matchedCuisine: keyword,
      }
    }
  }

  return {
    isChain: false,
    isCuisineLimited: false,
  }
}

// Additional heuristic: check if business has franchise indicators
export function hasFranchiseIndicators(
  businessName: string,
  websiteUrl?: string
): boolean {
  const normalized = businessName.toLowerCase()

  // Check for location identifiers that suggest a chain
  const locationPatterns = [
    /#\d+/, // "Store #123"
    /\b\d{4,}\b/, // 4+ digit numbers (often store IDs)
    /\blocation\b/,
    /\bunit\b/,
  ]

  for (const pattern of locationPatterns) {
    if (pattern.test(normalized)) {
      return true
    }
  }

  // If website has city/state subdomains or paths, might be a chain
  if (websiteUrl) {
    const url = websiteUrl.toLowerCase()
    const chainDomainPatterns = [
      /\.com\/locations\//,
      /\.com\/store\//,
      /\/franchise/,
    ]

    for (const pattern of chainDomainPatterns) {
      if (pattern.test(url)) {
        return true
      }
    }
  }

  return false
}
