// Soft spotlight wash shared by the lobby chat and the room page.
export const wallpaperGlow = (strength = 1) =>
  `radial-gradient(circle at 12% 8%, hsl(var(--heroui-primary-500) / ${0.13 * strength}), transparent 42%), radial-gradient(circle at 92% 88%, hsl(var(--heroui-warning-500) / ${0.11 * strength}), transparent 48%), radial-gradient(circle at 70% 30%, hsl(var(--heroui-success-500) / ${0.06 * strength}), transparent 40%)`;
