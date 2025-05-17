
import { Header } from '@/components/layout/Header';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { ChatFAB } from '@/components/layout/ChatFAB'; // Import ChatFAB

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto max-w-2xl px-4 py-8 pb-24">
        {children}
      </main>
      <ChatFAB /> {/* Add ChatFAB here */}
      <BottomNavigationBar />
    </div>
  );
}
