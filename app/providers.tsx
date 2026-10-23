"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider } from "next-themes";
import ClickSpark from "@/components/ui/ClickSpark";
import NavigationProgress from "@/components/ui/NavigationProgress";

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
          <NavigationProgress />
          <ClickSpark
            global
            sparkColor="hsl(var(--heroui-primary))"
            shape="line"
            sparkCount={8}
            sparkSize={12}
            sparkRadius={22}
            duration={450}
          />
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
