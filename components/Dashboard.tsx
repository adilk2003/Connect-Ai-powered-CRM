
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SparklesIcon } from './icons/SparklesIcon';
import { generatePipelineSummary } from '../services/geminiService';
import { Task, Lead } from '../types';
import { dataService } from '../services/dataService';

const StatCard: React.FC<{ title: string; value: string; icon: any; trend?: string; positive?: boolean }> = ({ title, value, icon: Icon, trend, positive }) => (
    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
                <Icon className="w-6 h-6 text-primary-600" />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-sm">
                <span className={`font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                </span>
                <span className="text-gray-400 ml-2">vs last month</span>
            </div>
        )}
    </div>
);

const Dashboard: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [aiSummary, setAiSummary] = useState('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const [fetchedTasks, fetchedLeads] = await Promise.all([
                dataService.getTasks(),
                dataService.getLeads()
            ]);
            setTasks(fetchedTasks);
            setLeads(fetchedLeads);
        };
        loadData();
    }, []);

    const handleGenerateSummary = async () => {
        setIsLoadingSummary(true);
        setAiSummary('');
        try {
            const summary = await generatePipelineSummary();
            setAiSummary(summary);
        } catch (error) {
            console.error(error);
            setAiSummary('Failed to generate summary. Please try again.');
        } finally {
            setIsLoadingSummary(false);
        }
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-50 text-green-700 border border-green-100';
            case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-100';
            case 'Overdue': return 'bg-red-50 text-red-700 border border-red-100';
            default: return 'bg-gray-50 text-gray-700 border border-gray-100';
        }
    };

    // --- DATA CALCULATIONS ---

    // 1. Real Stats
    const activeDealsCount = leads.filter(l => l.status !== 'Closed Lost' && l.status !== 'Closed Won').length;
    const totalRevenue = leads.reduce((acc, l) => acc + l.value, 0).toLocaleString();
    const dueTasksCount = tasks.filter(t => t.status !== 'Completed').length;

    // 2. Deals by Stage (Bar Chart)
    const dealsByStage = leads.reduce((acc: Record<string, number>, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {});
    const dealsData = Object.entries(dealsByStage).map(([name, value]) => ({ name, value }));

    // 3. Revenue Forecast (Line Chart) - Group by Created Month
    // Initialize last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short' }));
    }

    const forecastData = months.map(month => {
        // Filter leads created in this month
        const revenue = leads
            .filter(l => {
                if (!l.createdAt) return false;
                const leadDate = new Date(l.createdAt);
                return leadDate.toLocaleString('default', { month: 'short' }) === month;
            })
            .reduce((sum, l) => sum + l.value, 0);
        
        // Simple fake projection for "forecast" line
        return {
            name: month,
            revenue: revenue,
            forecast: revenue * 1.1 + 5000 // Mock projection logic
        };
    });

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, Demo User!</h2>
                    <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        Download Report
                    </button>
                    <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm disabled:opacity-70">
                        <SparklesIcon className="w-4 h-4 mr-2 text-yellow-400" />
                        {isLoadingSummary ? 'Analyzing...' : 'AI Insight'}
                    </button>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Pipeline Value" 
                    value={`$${totalRevenue}`} 
                    icon={(props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    trend="+12.5%"
                    positive={true}
                />
                <StatCard 
                    title="Active Deals" 
                    value={activeDealsCount.toString()} 
                    icon={(props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    trend="+4"
                    positive={true}
                />
                <StatCard 
                    title="Pending Tasks" 
                    value={dueTasksCount.toString()} 
                    icon={(props: any) => <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    trend="-2"
                    positive={true}
                />
            </div>

            {/* AI Insight Box */}
             {aiSummary && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-indigo-900 flex items-center mb-2">
                        <SparklesIcon className="w-5 h-5 mr-2 text-indigo-600" />
                        AI Analysis
                    </h3>
                    <p className="text-indigo-800 text-sm leading-relaxed">{aiSummary}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column (Charts) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">Revenue Forecast (Real Data)</h3>
                        <div className="h-[300px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={forecastData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#FF3B30" strokeWidth={3} dot={{ r: 4, fill: '#FF3B30', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="forecast" stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100">
                         <h3 className="font-bold text-lg text-gray-900 mb-6">Deals by Stage</h3>
                         <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dealsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} interval={0} height={40} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                    <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="value" fill="#FF807A" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column (Tasks) */}
                <div className="bg-white p-6 rounded-xl shadow-card border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900">Upcoming Tasks</h3>
                        <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</a>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <ul className="space-y-4">
                            {tasks.slice(0, 6).map(task => (
                                <li key={task.id} className="group p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                                        </div>
                                        <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded-full ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {tasks.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No tasks due soon.
                            </div>
                        )}
                    </div>
                     <button className="w-full mt-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        Create New Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
