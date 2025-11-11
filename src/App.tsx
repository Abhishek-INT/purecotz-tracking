import { useEffect } from 'react';
import useAuth from './hooks/useAuth';
import UserSelector from './components/UserSelector';
import { DataService } from './services/DataService';
import Dashboard from './components/Dashboard';

export default function App() {
  const { user, login } = useAuth();

  useEffect(() => {
    DataService.initializeSampleData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <h1 className="text-xl font-semibold text-slate-900">
            Purecotz Manufacturing Tracking System
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <section>
            <UserSelector currentUser={user} onUserSelect={login} />
          </section>
          {!user ? (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-slate-600">Please select a user to continue.</p>
            </section>
          ) : (
            <section>
              <Dashboard user={user} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
