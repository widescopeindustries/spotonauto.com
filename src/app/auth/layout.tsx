import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | SpotOnAuto',
  description:
    'Sign in or create your free SpotOnAuto account to save vehicles, track repair history, and get personalized diagnostic guides for your car or truck.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://spotonauto.com/auth',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
