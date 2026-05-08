import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | AllOEMManuals',
  description:
    'Sign in or create your free AllOEMManuals account to save vehicles, track repair history, and get personalized diagnostic guides for your car or truck.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://alloemmanuals.com/auth',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
