import { permanentRedirect } from 'next/navigation';

export default function RepairIndexRedirectPage() {
  permanentRedirect('/repairs');
}
