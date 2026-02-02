import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { leads, schoolName } = await request.json()

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: "Leads array is required" },
        { status: 400 }
      )
    }

    // Transform leads to match the spreadsheet format
    const excelData = leads.map((lead: any) => ({
      "Company": lead.company || "",
      "URL": lead.url || "",
      "Company Description": lead.companyDescription || "",
      "Lead Status": lead.leadStatus || "",
      "Contact First Name": lead.contactFirstName || "",
      "Contact Last Name": lead.contactLastName || "",
      "Contact Title": lead.contactTitle || "",
      "Contact Email": lead.contactEmail || "",
      "Contact Phone Number": lead.contactPhone || "",
      "Address": lead.address || "",
      "Address Line 2": lead.addressLine2 || "",
      "City": lead.city || "",
      "State": lead.state || "",
      "Zipcode": lead.zipcode || "",
      "Country": lead.country || "",
      "Distance to campus": lead.distanceDisplay || "",
      "Facebook Link": lead.facebookLink || "",
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Company
      { wch: 40 }, // URL
      { wch: 50 }, // Company Description
      { wch: 12 }, // Lead Status
      { wch: 15 }, // Contact First Name
      { wch: 15 }, // Contact Last Name
      { wch: 20 }, // Contact Title
      { wch: 35 }, // Contact Email
      { wch: 18 }, // Contact Phone Number
      { wch: 30 }, // Address
      { wch: 15 }, // Address Line 2
      { wch: 18 }, // City
      { wch: 8 },  // State
      { wch: 10 }, // Zipcode
      { wch: 10 }, // Country
      { wch: 20 }, // Distance to campus
      { wch: 50 }, // Facebook Link
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Create filename
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = schoolName
      ? `leads_${schoolName.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.xlsx`
      : `leads_${timestamp}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting leads:", error)
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    )
  }
}
