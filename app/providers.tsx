"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="paradiso-theme"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <ToastProvider />
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
