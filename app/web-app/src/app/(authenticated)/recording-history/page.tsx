import { auth } from '~/server/auth';

export default async function RecordingHistoryPage() {
  const session = await auth();

  return (
    <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Recording History
        </h1>
        <p className="text-slate-600">
          View and manage your classroom recording sessions and analysis reports.
        </p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center text-slate-500">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            No recordings yet
          </h3>
          <p className="text-sm text-slate-600">
            Your recording history will appear here once you start creating classroom recordings.
          </p>
        </div>
      </div>
    </div>
  );
}