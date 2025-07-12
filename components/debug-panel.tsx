"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Code, Globe, Key, Settings } from "lucide-react"

export function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false)

  const debugInfo = {
    environment: process.env.NODE_ENV || "development",
    domain: typeof window !== "undefined" ? window.location.hostname : "N/A",
    hasWarpcastKey: !!process.env.WARPCAST_API_KEY,
    forceRealAuth: process.env.NEXT_PUBLIC_FORCE_REAL_AUTH === "true",
    allowedDomains: process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || "localhost",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        <Settings className="h-3 w-3 mr-1" />
        Debug Info
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>
    )
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Information</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="h-6 w-6 p-0">
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs">Development and configuration details</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Code className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Environment:</span>
          </div>
          <Badge variant={debugInfo.environment === "production" ? "default" : "secondary"} className="text-xs">
            {debugInfo.environment}
          </Badge>

          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Domain:</span>
          </div>
          <span className="font-mono text-xs">{debugInfo.domain}</span>

          <div className="flex items-center gap-2">
            <Key className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Warpcast Key:</span>
          </div>
          <Badge variant={debugInfo.hasWarpcastKey ? "default" : "destructive"} className="text-xs">
            {debugInfo.hasWarpcastKey ? "Present" : "Missing"}
          </Badge>

          <div className="flex items-center gap-2">
            <Settings className="h-3 w-3 text-gray-500" />
            <span className="text-gray-600">Force Real Auth:</span>
          </div>
          <Badge variant={debugInfo.forceRealAuth ? "default" : "secondary"} className="text-xs">
            {debugInfo.forceRealAuth ? "Enabled" : "Disabled"}
          </Badge>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <span className="font-medium">App URL:</span>
              <span className="ml-2 font-mono">{debugInfo.appUrl}</span>
            </div>
            <div>
              <span className="font-medium">Allowed Domains:</span>
              <span className="ml-2 font-mono">{debugInfo.allowedDomains}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
