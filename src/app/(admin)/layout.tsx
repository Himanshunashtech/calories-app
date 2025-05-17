
'use client';
// This layout was for an admin panel that has been removed.
// It now serves as a basic pass-through layout.
import '../globals.css'; // Global styles

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The outer div or fragment should allow children to render within the main app structure.
    // No admin-specific UI or authentication checks remain here.
    <>
      {children}
    </>
  );
}
