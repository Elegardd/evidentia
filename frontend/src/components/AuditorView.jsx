// eslint-disable-next-line no-unused-vars
import React from 'react';

export default function AuditorView() {
  const systemLogs = [
    { id: 10482, timestamp: '2026-06-23 21:04:12', user: 'officer_04', action: 'CREATE_RECORD', status: 'SUCCESS', target: 'EV-2605-4911' },
    { id: 10483, timestamp: '2026-06-23 21:15:40', user: 'custodian_01', action: 'UPDATE_STATUS_TRANSITION', status: 'SUCCESS', target: 'EV-2605-4911' },
    { id: 10484, timestamp: '2026-06-23 22:01:05', user: 'admin_sys', action: 'MODIFIED_USER_PERMISSIONS', status: 'ALERT', target: 'USER_ID_88' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start space-x-3">
        <svg className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <h4 className="text-sm font-semibold text-emerald-400">Auditor Protocol Sandbox Isolation Active</h4>
          <p className="text-xs text-slate-400 mt-0.5">Primary case descriptors and evidentiary physical details are masked systematically to guarantee compliance neutrality.</p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Immutable System Audit Trails</h1>
        <p className="text-slate-400 text-sm">System-wide transactional events and permission alterations.</p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Log Event ID</th>
                <th className="px-6 py-3">Timestamp Transaction</th>
                <th className="px-6 py-3">Operator User</th>
                <th className="px-6 py-3">Action Signature</th>
                <th className="px-6 py-3">System Impact Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 font-mono text-xs text-slate-300">
              {systemLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 text-slate-500">#{log.id}</td>
                  <td className="px-6 py-4 text-slate-400">{log.timestamp}</td>
                  <td className="px-6 py-4 text-blue-400 font-semibold">{log.user}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}