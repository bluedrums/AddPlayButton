"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, ChevronDown, ChevronUp } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const debugInfo = {
    environment: process.env.NODE_ENV,
    forceRealAuth: process.env.NEXT_PUBLIC_FORCE_REAL_AUTH,
    appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hostname: typeof window !== "undefined" ? window.location.hostname : "N/A",
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full p-0"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Debug Info</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <Badge variant="outline" className="text-xs">
                  {value || "undefined"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p className="font-medium mb-1">Expected for Real Auth:</p>
            <ul className="text-gray-600 space-y-1">
              <li>• NEXT_PUBLIC_FORCE_REAL_AUTH = "true"</li>
              <li>• NEXT_PUBLIC_APP_DOMAIN = your-domain.com</li>
              <li>• NEXT_PUBLIC_APP_URL = https://your-domain.com</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
