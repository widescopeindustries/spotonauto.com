import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | SpotOnAuto',
  description:
    'Sign in or create your free SpotOnAuto account for personalized repair guides and diagnostics.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
