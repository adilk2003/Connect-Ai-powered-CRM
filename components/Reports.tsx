
import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { SparklesIcon } from './icons/SparklesIcon';
import { dataService } from '../services/dataService';
import { Lead, Task, Email } from '../types';

const COLORS = ['#FF3B30', '#FF807A', '#FFB3B0', '#FFD2D1', '#A1130B'];

const StatCard: React.FC<{ title: string; value: string; change: string; positive: boolean }> = ({ title, value, change, positive }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-black">{value}</p>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {change}
            </span>
        </div>
    </div>
);

const Reports: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [emails, setEmails] = useState<Email[]>([]);
    const [activityLog, setActivityLog] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const [fetchedLeads, fetchedTasks, fetchedEmails] = await Promise.all([
                dataService.getLeads(),
                dataService.getTasks(),
                dataService.getEmails()
            ]);
            setLeads(fetchedLeads);
            setTasks(fetchedTasks);
            setEmails(fetchedEmails);

            // Combine into activity log
            const activities = [
                ...fetchedLeads.map(l => ({ type: 'Deal', subject: `New Deal: ${l.dealName}`, date: l.createdAt })),
                ...fetchedTasks.map(t => ({ type: 'Task', subject: `Task Created: ${t.title}`, date: undefined })), // Tasks missing createdAt in type def currently, can update later
                ...fetchedEmails.map(e => ({ type: 'Email', subject: `Email Sent: ${e.subject}`, date: e.timestamp }))
            ].sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }).slice(0, 10);
            
            setActivityLog(activities);
        };
        loadData();
    }, []);

    // --- KPI Calculations ---
    const totalRevenue = leads.reduce((acc, lead) => acc + lead.value, 0);
    const newLeadsCount = leads.filter(l => l.status === 'New').length;
    const wonLeadsCount = leads.filter(l => l.status === 'Closed Won').length;
    const conversionRate = leads.length > 0 ? ((wonLeadsCount / leads.length) * 100).toFixed(1) : '0';
    const avgDealSize = leads.length > 0 ? (totalRevenue / leads.length).toFixed(0) : '0';

    // --- Chart Calculations ---

    // Lead Sources for Pie Chart
    const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
        const source = lead.source || 'Other';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});
    const leadSourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

    // Monthly Revenue based on createdAt
    const monthlyRevenueData = [
        { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 }
    ];

    leads.forEach(lead => {
        if(lead.createdAt) {
            const date = new Date(lead.createdAt);
            const monthIdx = date.getMonth();
            // Simple mapping for first 6 months of year for demo purposes
            // In production you'd map relative to current date
            if (monthIdx >= 0 && monthIdx < 6) {
                 monthlyRevenueData[monthIdx].value += lead.value;
            }
        }
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Reports & Analytics</h2>
        <div className="flex items-center space-x-3">
            <select className="bg-white border border-gray-300 text-black py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
                <option>Year to Date</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition shadow-sm">
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Insights
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Value" value={`$${totalRevenue.toLocaleString()}`} change="+12.5%" positive={true} />
          <StatCard title="New Leads" value={newLeadsCount.toString()} change="+8.2%" positive={true} />
          <StatCard title="Conversion Rate" value={`${conversionRate}%`} change="-2.1%" positive={false} />
          <StatCard title="Avg Deal Size" value={`$${Number(avgDealSize).toLocaleString()}`} change="+5.4%" positive={true} />
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Estimated Revenue Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="value" stroke="#FF3B30" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Sources</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                      <Pie
                          data={leadSourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                      >
                          {leadSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
              </ResponsiveContainer>
          </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity Log (Real-time)</h3>
          <div className="space-y-6">
            {activityLog.length > 0 ? activityLog.map((activity, idx) => (
                <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-semibold text-xs ${
                            activity.type === 'Deal' ? 'bg-green-100 text-green-600' : 
                            activity.type === 'Email' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {activity.type[0]}
                        </span>
                    </div>
                    <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                        <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                    <div className="ml-auto">
                        <p className="text-xs text-gray-400">
                            {activity.date ? new Date(activity.date).toLocaleDateString() : 'Just now'}
                        </p>
                    </div>
                </div>
            )) : (
                <p className="text-gray-500 text-center py-4">No recent activity found.</p>
            )}
          </div>
      </div>
    </div>
  );
};

export default Reports;
