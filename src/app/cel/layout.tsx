/**
 * CEL landing page layout - strips header/footer for ad traffic.
 * No nav links = no exit points = higher conversion.
 */
export default function CELLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
