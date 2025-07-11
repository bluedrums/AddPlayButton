"use client";

import { useSignIn, useProfile } from "@farcaster/auth-kit";
import { getFarcasterFromMiniApp } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

export default function AuthTest() {
  const [lastAttempt, setLastAttempt] = useState<number>(0);
  
  const signIn = useSignIn({
    onSuccess: (data) => console.log("✅ Auth success:", data),
    onError: (error) => console.error("❌ Auth error:", error),
    onStatusResponse: (status) => console.log("📡 Status:", status)
  });
  
  const profile = useProfile({ 
    fid: signIn.data?.fid,
    onSuccess: (data) => console.log("👤 Profile loaded:", data),
    onError: (error) => console.error("❌ Profile error:", error) 
  });

  // Expose auth objects to window for debugging
  useEffect(() => {
    (window as any).__testAuth = { 
      signIn, 
      profile,
      lastAttempt,
      // Helper for console
      status: () => ({
        signInLoading: signIn.isLoading,
        signInError: signIn.error?.message,
        signInData: signIn.data,
        profileLoading: profile.isLoading,
        profileError: profile.error?.message,
        profileData: profile.data
      })
    };

    // Notify Frames preview that the app is ready
    getFarcasterFromMiniApp()
      .then((fc) => fc.setFrameReady(true))
      .catch(console.error);
  }, [signIn, profile, lastAttempt]);

  const handleSignIn = () => {
    setLastAttempt(Date.now());
    
    signIn.signIn?.({
      method: "window",
      flow: "oauth",
      redirectUri: typeof window !== "undefined" 
        ? `${window.location.origin}/auth/callback` 
        : undefined,
    });
  };

  // Status indicator
  const getStatusColor = () => {
    if (signIn.error) return "#f44336"; // Error - red
    if (signIn.isLoading) return "#ff9800"; // Loading - orange
    if (signIn.data) return "#4caf50"; // Success - green
    return "#9e9e9e"; // Idle - gray
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>Farcaster Auth Test</h1>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          transition: 'background-color 0.3s'
        }} />
        <span>
          {signIn.isLoading ? 'Connecting...' : 
           signIn.error ? 'Error' :
           signIn.data ? 'Connected' : 'Ready'}
        </span>
      </div>

      <button
        style={{
          padding: '12px 24px',
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: '#9333ea',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
        onClick={handleSignIn}
        disabled={signIn.isLoading}
      >
        Connect Farcaster (Test)
      </button>

      {signIn.error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: 8,
          color: '#b71c1c',
          maxWidth: 400
        }}>
          <strong>Error:</strong> {signIn.error.message || "Unknown error"}
        </div>
      )}

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '16px',
        borderRadius: 8,
        width: '100%',
        maxWidth: 500,
        overflow: 'auto'
      }}>
        <h3 style={{margin: '0 0 8px 0'}}>Auth State</h3>
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap',
          fontSize: 14
        }}>
          {JSON.stringify({
            signIn: {
              loading: signIn.isLoading,
              error: signIn.error?.message,
              data: signIn.data
            },
            profile: {
              loading: profile.isLoading,
              error: profile.error?.message,
              data: profile.data
            },
            lastAttempt: lastAttempt ? new Date(lastAttempt).toISOString() : null
          }, null, 2)}
        </pre>
      </div>
      
      <div style={{fontSize: 12, color: '#666', marginTop: 20}}>
        <p>Run <code>console.table(window.__testAuth.status())</code> to see detailed state</p>
      </div>
    </div>
  );
}
