import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiService, { getToken } from '../services/api';
import { Badge, Card, CardBody, CardHeader, EmptyState, Spinner } from '../components/ui';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const formatMoney = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
};

const AnalyticsPage = () => {
  const { language } = useLanguage();
  const text = (en, km) => (language === 'km' ? km : en);
  const openNativeDatePicker = (event) => {
    if (typeof event.currentTarget.showPicker === 'function') {
      event.currentTarget.showPicker();
    }
  };

  const { user } = useAuth();
  const role = user?.role;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.get('/analytics/overview', { from: fromDate, to: toDate });
      setData(res.data || null);
    } catch (err) {
      setError(err?.error || text('Failed to load analytics', 'មិនអាចផ្ទុកស្ថិតិបានទេ'));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const status = data?.bookingsByStatus || data?.summary?.bookingsByStatus || {};
  const statusRows = useMemo(
    () => [
      { key: 'pending', label: text('Pending', 'កំពុងរង់ចាំ'), tone: 'yellow' },
      { key: 'confirmed', label: text('Confirmed', 'បានបញ្ជាក់'), tone: 'green' },
      { key: 'completed', label: text('Completed', 'បានបញ្ចប់'), tone: 'blue' },
      { key: 'cancelled', label: text('Cancelled', 'បានបោះបង់'), tone: 'red' }
    ],
    [language]
  );

  const revenueSeries = Array.isArray(data?.revenueTrend) ? data.revenueTrend : data?.revenueByMonth || [];
  const maxRevenue = Math.max(1, ...revenueSeries.map((r) => Number(r.revenue || 0)));

  const topFields = Array.isArray(data?.fieldPerformance) ? data.fieldPerformance : data?.topFields || [];

  const downloadReport = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/analytics/report.csv?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(text('Unable to download report', 'មិនអាចទាញយករបាយការណ៍បានទេ'));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `analytics-report-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || text('Failed to download report', 'មិនអាចទាញយករបាយការណ៍បានទេ'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text('Analytics', 'ស្ថិតិ')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {role === 'admin'
              ? text('Platform overview.', 'ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធ។')
              : role === 'field_owner'
                ? text('Your fields and bookings performance.', 'ការអនុវត្តន៍របស់ទីលាន និងការកក់របស់អ្នក។')
                : text('Your booking activity.', 'សកម្មភាពកក់របស់អ្នក។')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="gray">{role || text('unknown', 'មិនស្គាល់')}</Badge>
          <input type="date" className="h-9 rounded-md border border-slate-300 px-2 text-sm" value={fromDate} onChange={(event) => setFromDate(event.target.value)} onClick={openNativeDatePicker} />
          <input type="date" className="h-9 rounded-md border border-slate-300 px-2 text-sm" value={toDate} onChange={(event) => setToDate(event.target.value)} onClick={openNativeDatePicker} />
          <button className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50" onClick={loadAnalytics}>{text('Apply', 'អនុវត្ត')}</button>
          <button className="h-9 rounded-md border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50" onClick={downloadReport}>{text('Export CSV', 'នាំចេញ CSV')}</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {statusRows.map((r) => (
          <Card key={r.key}>
            <CardBody className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{r.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{Number(status[r.key] || 0)}</div>
                </div>
                <Badge tone={r.tone}>{r.key}</Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{text('Revenue (last 6 months)', 'ចំណូល (៦ ខែចុងក្រោយ)')}</div>
              <div className="text-xs text-gray-500">{text('Confirmed + completed bookings', 'ការកក់ដែលបានបញ្ជាក់ និងបានបញ្ចប់')}</div>
            </div>
            <Badge tone="green">
              {formatMoney(revenueSeries.reduce((sum, r) => sum + Number(r.revenue || 0), 0))}
            </Badge>
          </CardHeader>
          <div className="border-t border-gray-200">
            {revenueSeries.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={ChartBarIcon} title={text('No revenue yet', 'មិនទាន់មានចំណូល')} description={text('Revenue will appear after bookings are confirmed or completed.', 'ចំណូលនឹងបង្ហាញបន្ទាប់ពីការកក់ត្រូវបានបញ្ជាក់ ឬបានបញ្ចប់។')} />
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {revenueSeries.map((r) => {
                  const v = Number(r.revenue || 0);
                  const w = Math.round((v / maxRevenue) * 100);
                  return (
                    <div key={r.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{r.month}</span>
                        <span className="font-medium text-gray-900">{formatMoney(v)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{text('Top fields', 'ទីលានពេញនិយម')}</div>
              <div className="text-xs text-gray-500">{text('Most booked', 'ត្រូវបានកក់ច្រើនជាងគេ')}</div>
            </div>
            <Badge tone="gray">{text(`${topFields.length} fields`, `${topFields.length} ទីលាន`)}</Badge>
          </CardHeader>
          <div className="border-t border-gray-200">
            {topFields.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={ChartBarIcon} title={text('No data yet', 'មិនទាន់មានទិន្នន័យ')} description={text('Top fields will appear once you have bookings.', 'ទីលានពេញនិយមនឹងបង្ហាញនៅពេលមានការកក់។')} />
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {topFields.map((f) => (
                  <div key={f.fieldId} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{f.field?.name || `Field #${f.fieldId}`}</div>
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {f.field?.city}
                        {f.field?.province ? `, ${f.field.province}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-gray-900">{text(`${Number(f.bookingCount || 0)} bookings`, `${Number(f.bookingCount || 0)} ការកក់`)}</div>
                      <div className="text-xs text-gray-600">{formatMoney(f.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
