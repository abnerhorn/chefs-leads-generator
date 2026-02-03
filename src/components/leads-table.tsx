"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Search,
  Loader2,
} from "lucide-react"

interface Lead {
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
  city: string | null
  state: string | null
  distanceMiles: number | null
  distanceDisplay: string | null
  facebookLink: string | null
  rating: number | null
  reviewCount: number | null
  isChain: boolean
  chainFlagged: boolean
  cuisineFlagged: boolean
  flagReason: string | null
  googlePlaceId: string | null
}

interface LeadsTableProps {
  leads: Lead[]
  schoolName?: string
  onExport: () => void
  isExporting: boolean
  onSearchMore?: (expandRadius: boolean) => void
  isSearchingMore?: boolean
  currentRadius?: number
  maxRadius?: number
}

export function LeadsTable({ 
  leads, 
  schoolName, 
  onExport, 
  isExporting,
  onSearchMore,
  isSearchingMore = false,
  currentRadius = 15,
  maxRadius = 50,
}: LeadsTableProps) {
  const [showFlagged, setShowFlagged] = useState(true)
  const [showExpandRadiusDialog, setShowExpandRadiusDialog] = useState(false)

  const filteredLeads = showFlagged
    ? leads
    : leads.filter((lead) => !lead.chainFlagged && !lead.cuisineFlagged)

  const flaggedCount = leads.filter(
    (lead) => lead.chainFlagged || lead.cuisineFlagged
  ).length

  const canExpandRadius = currentRadius < maxRadius
  const nextRadius = Math.min(currentRadius + 10, maxRadius)

  const handleSearchMoreClick = () => {
    if (canExpandRadius) {
      setShowExpandRadiusDialog(true)
    } else if (onSearchMore) {
      onSearchMore(false)
    }
  }

  const handleSearchSameRadius = () => {
    setShowExpandRadiusDialog(false)
    if (onSearchMore) {
      onSearchMore(false)
    }
  }

  const handleSearchExpandedRadius = () => {
    setShowExpandRadiusDialog(false)
    if (onSearchMore) {
      onSearchMore(true)
    }
  }

  return (
    <>
      <Dialog open={showExpandRadiusDialog} onOpenChange={setShowExpandRadiusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search for More Leads</DialogTitle>
            <DialogDescription>
              Current search radius is {currentRadius} miles. Would you like to expand the search area to find more leads?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={handleSearchSameRadius}>
              <div className="flex-1">
                <p className="font-medium">Search same area</p>
                <p className="text-sm text-muted-foreground">
                  Look for additional results within {currentRadius} miles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer border-blue-200 bg-blue-50" onClick={handleSearchExpandedRadius}>
              <div className="flex-1">
                <p className="font-medium text-blue-900">Expand to {nextRadius} miles</p>
                <p className="text-sm text-blue-700">
                  Search a wider area for more potential leads
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpandRadiusDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Leads</CardTitle>
              <CardDescription>
                {leads.length} leads found
                {flaggedCount > 0 && ` (${flaggedCount} flagged for review)`}
                {currentRadius && ` • ${currentRadius} mile radius`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {flaggedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFlagged(!showFlagged)}
                >
                  {showFlagged ? "Hide" : "Show"} Flagged ({flaggedCount})
                </Button>
              )}
              {onSearchMore && (
                <Button 
                  variant="outline"
                  onClick={handleSearchMoreClick}
                  disabled={isSearchingMore}
                >
                  {isSearchingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search More
                    </>
                  )}
                </Button>
              )}
              <Button onClick={onExport} disabled={isExporting || leads.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export to Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads to display
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead, index) => (
                  <TableRow
                    key={index}
                    className={
                      lead.chainFlagged
                        ? "bg-red-50"
                        : lead.cuisineFlagged
                          ? "bg-yellow-50"
                          : ""
                    }
                  >
                    <TableCell>
                      <div className="font-medium">{lead.company}</div>
                      {lead.companyDescription && (
                        <div className="text-xs text-muted-foreground line-clamp-2 max-w-[230px]">
                          {lead.companyDescription}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.googlePlaceId ? (
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${lead.googlePlaceId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <MapPin className="h-3 w-3 mt-1 shrink-0" />
                          <div>
                            {lead.address && <div>{lead.address}</div>}
                            <div>
                              {[lead.city, lead.state].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-start gap-1 text-sm">
                          <MapPin className="h-3 w-3 mt-1 shrink-0 text-muted-foreground" />
                          <div>
                            {lead.address && <div>{lead.address}</div>}
                            <div>
                              {[lead.city, lead.state].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {(lead.contactFirstName || lead.contactLastName) && (
                          <div className="font-medium">
                            {[lead.contactFirstName, lead.contactLastName]
                              .filter(Boolean)
                              .join(" ")}
                            {lead.contactTitle && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({lead.contactTitle})
                              </span>
                            )}
                          </div>
                        )}
                        {lead.contactEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={`mailto:${lead.contactEmail}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lead.contactEmail}
                            </a>
                          </div>
                        )}
                        {lead.contactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={`tel:${lead.contactPhone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {lead.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{lead.rating}</span>
                          {lead.reviewCount && (
                            <span className="text-muted-foreground text-xs">
                              ({lead.reviewCount})
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lead.distanceDisplay}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.urlValid === true && (
                          <Badge variant="success" className="w-fit">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            URL Valid
                          </Badge>
                        )}
                        {lead.urlValid === false && (
                          <Badge variant="destructive" className="w-fit">
                            <XCircle className="h-3 w-3 mr-1" />
                            URL Invalid
                          </Badge>
                        )}
                        {lead.chainFlagged && (
                          <Badge variant="destructive" className="w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Chain
                          </Badge>
                        )}
                        {lead.cuisineFlagged && (
                          <Badge variant="warning" className="w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cuisine Limited
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {lead.url && (
                          <a
                            href={lead.url.startsWith("http") ? lead.url : `https://${lead.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {lead.facebookLink && (
                          <a
                            href={lead.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
