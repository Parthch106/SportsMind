import Sidebar from '@/components/layout/Sidebar';
import AICopilot from '@/components/layout/AICopilot';
import { AnalysisProvider } from '@/contexts/AnalysisContext';
import PlayerProfileHeader from '@/components/PlayerProfileHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AnalysisProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* 
          ml-64 accounts for left sidebar (w-64)
          mr-96 accounts for right AI copilot (w-96)
        */}
        <main className="flex-1 ml-64 mr-96 relative flex flex-col">
          <PlayerProfileHeader />
          {children}
        </main>
        <AICopilot />
      </div>
    </AnalysisProvider>
  );
}
