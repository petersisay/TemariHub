import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import { OpportunityReport } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ReportsManagementPage: React.FC = () => {
  const [reports, setReports] = useState<OpportunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    setIsLoading(true);
    const data = await adminService.getReports();
    setReports(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (reportId: string) => {
    await adminService.resolveReport(reportId);
    await loadReports();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
          <span>User Reports & Inaccuracy Flags</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Investigate reports submitted by Ethiopian students regarding broken links, expired
          listings, or fraudulent claims.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading user reports..." />
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-slate-800">No open reports</p>
          <p className="text-slate-400 mt-1">The opportunity feed is currently clean of user flags.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Opportunity Title</th>
                  <th className="px-4 py-3">Reported Reason</th>
                  <th className="px-4 py-3">Student Details & Evidence</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {rep.opportunityTitle}
                    </td>
                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      {rep.reason.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 max-w-sm text-slate-600 leading-relaxed">
                      {rep.details}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={rep.status === 'resolved' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {rep.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rep.status === 'pending' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(rep.id)}
                        >
                          Mark Resolved
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
