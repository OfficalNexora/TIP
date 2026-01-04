import React from 'react';
import Icons from '../../ui/Icons';

const BillingHistory = ({ invoices, isLoading }) => {
    // 1. Loading State
    if (isLoading && !invoices) {
        return (
            <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50 mt-8 animate-pulse">
                <div className="h-6 w-32 bg-slate-700 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 w-full bg-slate-700/30 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Data State
    const hasInvoices = invoices && invoices.length > 0;

    return (
        <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50 mt-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Icons.FileText size={20} className="text-blue-400" />
                Billing History
            </h3>

            {hasInvoices ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="pb-3 pl-2">Date</th>
                                <th className="pb-3 hidden md:table-cell">Invoice ID</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 text-slate-300 transition-colors">
                                    <td className="py-4 pl-2 font-medium text-white">
                                        {new Date((invoice.created || invoice.created_at) * (invoice.created ? 1000 : 1)).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 hidden md:table-cell font-mono text-xs text-slate-500">
                                        {invoice.number || invoice.id}
                                    </td>
                                    <td className="py-4 font-semibold">
                                        P{invoice.total / 100}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            invoice.status === 'open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        {invoice.invoice_pdf ? (
                                            <a
                                                href={invoice.invoice_pdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 text-xs"
                                            >
                                                <Icons.Download size={14} /> Only PDF
                                            </a>
                                        ) : (
                                            <span className="text-slate-600 text-xs cursor-not-allowed">
                                                Unavailable
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-800/20 rounded-lg border border-dashed border-slate-700">
                    <div className="inline-flex p-4 bg-slate-800 rounded-full mb-3 text-slate-500">
                        <Icons.FileText size={24} />
                    </div>
                    <p className="text-slate-400 font-medium">No invoices available</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Invoices will appear here once you make a payment.
                    </p>
                </div>
            )}

            <p className="mt-4 text-[10px] text-slate-500 text-center">
                Need help with a charge? <button className="text-blue-400 hover:underline">Contact Support</button>
            </p>
        </div>
    );
};

export default BillingHistory;
