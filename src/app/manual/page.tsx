import { redirect } from 'next/navigation';

export default function ManualLandingPage() {
  // Redirect to the proprietary maintenance landing page
  redirect('/maintenance');
}
