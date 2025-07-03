"use client";
import { handleRedirect } from "@farcaster/auth-kit";
import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    handleRedirect();
  }, []);
  return null;
}
