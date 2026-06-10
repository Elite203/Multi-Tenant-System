import MiniSupabaseDashboard from "./MiniSupabaseDashboard";
import { GlobalSyncStatus } from "./GlobalSyncStatus";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center lg:text-left">
              Admin Dashboard
            </h1>
            <GlobalSyncStatus showButton={false} className="flex-shrink-0" />
          </div>
        </header>
        <main className="w-full">
          <MiniSupabaseDashboard />
        </main>
      </div>
    </div>
  );
}
