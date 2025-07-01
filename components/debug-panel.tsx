"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, ChevronDown, ChevronUp, Copy, AlertTriangle } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const debugInfo = {
    environment: process.env.NODE_ENV,
    forceRealAuth: process.env.NEXT_PUBLIC_FORCE_REAL_AUTH,
    appDomain: process.env.NEXT_PUBLIC_APP_DOMAIN,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hostname: typeof window !== "undefined" ? window.location.hostname : "N/A",
    origin: typeof window !== "undefined" ? window.location.origin : "N/A",
    userAgent: typeof window !== "undefined" ? navigator.userAgent.substring(0, 50) + "..." : "N/A",
    timestamp: new Date().toISOString(),
    popupBlocked: "Unknown - Check manually",
  }

  const copyDebugInfo = () => {
    const debugText = Object.entries(debugInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")

    navigator.clipboard
      .writeText(debugText)
      .then(() => {
        alert("Debug info copied to clipboard!")
      })
      .catch(() => {
        console.log("Debug info:", debugText)
        alert("Debug info logged to console")
      })
  }

  const testPopup = () => {
    try {
      const popup = window.open("about:blank", "_blank", "width=400,height=600")
      if (popup) {
        popup.close()
        alert("✅ Popups are working! The Auth Kit should be able to open authentication windows.")
      } else {
        alert("❌ Popup blocked! Please allow popups for this site and try again.")
      }
    } catch (error) {
      alert("❌ Popup test failed: " + error)
    }
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
                <Badge variant="outline" className="text-xs max-w-[200px] truncate">
                  {value || "undefined"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={copyDebugInfo}
              className="flex items-center gap-1 bg-transparent"
            >
              <Copy className="h-3 w-3" />
              Copy Debug Info
            </Button>

            <Button variant="outline" size="sm" onClick={testPopup} className="flex items-center gap-1 bg-transparent">
              <AlertTriangle className="h-3 w-3" />
              Test Popups
            </Button>
          </div>

          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="font-medium mb-1 text-yellow-800">Troubleshooting Steps:</p>
            <ul className="text-yellow-700 space-y-1">
              <li>1. Click "Test Popups" to check if popups are blocked</li>
              <li>2. Try in an incognito/private window</li>
              <li>3. Disable browser extensions temporarily</li>
              <li>4. Check if your domain matches exactly in Vercel env vars</li>
            </ul>
          </div>

          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p className="font-medium mb-1">Expected for Real Auth:</p>
            <ul className="text-gray-600 space-y-1">
              <li>• NEXT_PUBLIC_FORCE_REAL_AUTH = "true"</li>
              <li>• NEXT_PUBLIC_APP_DOMAIN = www.addplaybutton.xyz</li>
              <li>• NEXT_PUBLIC_APP_URL = https://www.addplaybutton.xyz</li>
              <li>• WARPCAST_API_KEY = wck_...</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
