import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { RealtimeDebug } from '@/components/debug/realtime-debug';

export default async function RealtimeDebugPage() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    redirect('/dashboard');
  }

  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Real-time System Debug</h1>
        <p className="text-slate-600 mt-2">
          Test and monitor the WebSocket + PostgreSQL NOTIFY system. This page is only available in development mode.
        </p>
      </div>
      
      <RealtimeDebug userId={session.user.id} />
    </div>
  );
}