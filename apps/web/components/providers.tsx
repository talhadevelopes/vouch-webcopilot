"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const SafeGoogleOAuthProvider = GoogleOAuthProvider as unknown as (props: any) => any;

export function AppProviders({ children }: { children: any }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const content = <QueryClientProvider client={queryClient}>{children as any}</QueryClientProvider>;
  if (!googleClientId) {
    return content;
  }
  return <SafeGoogleOAuthProvider clientId={googleClientId}>{content}</SafeGoogleOAuthProvider>;
}
