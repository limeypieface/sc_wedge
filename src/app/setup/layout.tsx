/**
 * Setup Layout
 *
 * Wraps the setup flow with the ConfigurationProvider.
 */

import { ConfigurationProvider } from "@/lib/contexts";

interface SetupLayoutProps {
  children: React.ReactNode;
}

export default function SetupLayout({ children }: SetupLayoutProps) {
  return <ConfigurationProvider>{children}</ConfigurationProvider>;
}
