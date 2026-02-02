import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateLeads, enrichLeads, type SearchType } from "@/services/lead-generator"

const GenerateLeadsSchema = z.object({
  schoolAddress: z.string().min(1, "School address is required"),
  schoolName: z.string().optional(),
  radiusMiles: z.number().min(1).max(50).default(15),
  searchType: z.enum(["catering", "pizza_diner", "meal_prep", "custom"]).default("catering"),
  customSearchTerms: z.array(z.string()).optional(),
  enrichLeads: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = GenerateLeadsSchema.parse(body)

    // Generate leads
    const result = await generateLeads({
      schoolAddress: validatedData.schoolAddress,
      schoolName: validatedData.schoolName,
      radiusMiles: validatedData.radiusMiles,
      searchType: validatedData.searchType as SearchType,
      customSearchTerms: validatedData.customSearchTerms,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Optionally enrich leads with website data
    let leads = result.leads
    if (validatedData.enrichLeads && leads.length > 0) {
      // Limit enrichment to first 20 leads to avoid long wait times
      const leadsToEnrich = leads.slice(0, 20)
      const remainingLeads = leads.slice(20)
      
      const enrichedLeads = await enrichLeads(leadsToEnrich)
      leads = [...enrichedLeads, ...remainingLeads]
    }

    return NextResponse.json({
      success: true,
      leads,
      totalCount: leads.length,
      schoolLocation: result.schoolLocation,
      searchTermsUsed: result.searchTermsUsed,
      enriched: validatedData.enrichLeads,
    })
  } catch (error) {
    console.error("Error generating leads:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
