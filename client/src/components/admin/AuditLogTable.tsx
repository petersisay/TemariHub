import React from 'react';
import { AuditLogItem } from '../../types';
import { Badge } from '../common/Badge';

interface AuditLogTableProps {
  logs: AuditLogItem[];
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const getActionBadge = (action: AuditLogItem['action']) => {
    switch (action) {
      case 'opportunity_approve':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'opportunity_reject':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'opportunity_expire':
        return <Badge variant="warning" size="sm">Expired</Badge>;
      case 'opportunity_delete':
        return <Badge variant="danger" size="sm">Deleted</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{action}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Administrator</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target Entity</th>
            <th className="px-4 py-3">Details / Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                {log.actorName}
                <span className="text-[10px] text-slate-400 block font-normal">
                  Role: {log.actorRole}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
              <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                {log.targetTitle || log.targetId}
              </td>
              <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                {log.metadata
                  ? JSON.stringify(log.metadata).replace(/[{"}]/g, ' ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
