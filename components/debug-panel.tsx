"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Server,
  Globe,
  User,
  Smartphone,
} from "lucide-react"
import { useFarcaster } from "@/components/farcaster-provider"

interface ApiKeyVerification {
  success: boolean
  error?: string
  details?: string | any
  recommendations?: string[]
  message?: string
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyVerification | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const { user, isAuthenticated } = useFarcaster()

  const verifyApiKey = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/verify-api-key")
      const result = await response.json()
      setApiKeyStatus(result)
    } catch (error) {
      setApiKeyStatus({
        success: false,
        error: "Failed to verify API key",
        details: "Network error or server unavailable",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (isOpen && !apiKeyStatus) {
      verifyApiKey()
    }
  }, [isOpen])

  const getStatusIcon = (status: ApiKeyVerification | null) => {
    if (!status) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    if (status.success) return <CheckCircle className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = (status: ApiKeyVerification | null) => {
    if (!status) return "yellow"
    return status.success ? "green" : "red"
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg bg-transparent">
          <Info className="w-4 h-4 mr-2" />
          Debug Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Debug Information
          </DialogTitle>
          <DialogDescription>System status and configuration details</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* API Key Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Neynar API Key
                  </div>
                  <Button variant="ghost" size="sm" onClick={verifyApiKey} disabled={isVerifying}>
                    {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiKeyStatus)}
                  <Badge variant={getStatusColor(apiKeyStatus) === "green" ? "default" : "destructive"}>
                    {apiKeyStatus?.success ? "Valid" : "Invalid"}
                  </Badge>
                  {apiKeyStatus?.message && <span className="text-sm text-gray-600">{apiKeyStatus.message}</span>}
                </div>

                {apiKeyStatus?.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{apiKeyStatus.error}</strong>
                      {apiKeyStatus.details && <div className="mt-1 text-sm">{apiKeyStatus.details}</div>}
                    </AlertDescription>
                  </Alert>
                )}

                {apiKeyStatus?.details && typeof apiKeyStatus.details === "object" && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {apiKeyStatus.details.keyType}
                    </div>
                    <div>
                      <span className="font-medium">Length:</span> {apiKeyStatus.details.keyLength}
                    </div>
                    <div>
                      <span className="font-medium">Prefix:</span> {apiKeyStatus.details.keyPrefix}
                    </div>
                    <div>
                      <span className="font-medium">Format:</span> {apiKeyStatus.details.isValidFormat ? "✓" : "✗"}
                    </div>
                  </div>
                )}

                {apiKeyStatus?.recommendations && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommendations:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      {apiKeyStatus.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authentication Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Badge variant={isAuthenticated ? "default" : "secondary"}>
                    {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                </div>

                {user && (
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Display Name:</span> {user.displayName}
                    </div>
                    <div>
                      <span className="font-medium">Username:</span> @{user.username}
                    </div>
                    <div>
                      <span className="font-medium">FID:</span> {user.fid}
                    </div>
                    {user.fid === 12345 && (
                      <Badge variant="outline" className="w-fit">
                        Demo Mode
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="w-4 h-4" />
                  Environment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-medium">App URL:</span>{" "}
                    {process.env.NEXT_PUBLIC_APP_URL || window.location.origin}
                  </div>
                  <div>
                    <span className="font-medium">Domain:</span>{" "}
                    {process.env.NEXT_PUBLIC_APP_DOMAIN || window.location.hostname}
                  </div>
                  <div>
                    <span className="font-medium">User Agent:</span>{" "}
                    <span className="text-xs break-all">{navigator.userAgent}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Frame Context */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="w-4 h-4" />
                  Frame Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">In Frame:</span> {window.parent !== window ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-medium">Screen Width:</span> {window.screen.width}px
                  </div>
                  <div>
                    <span className="font-medium">Window Width:</span> {window.innerWidth}px
                  </div>
                  <div>
                    <span className="font-medium">Window Height:</span> {window.innerHeight}px
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
