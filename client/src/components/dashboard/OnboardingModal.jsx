import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icons from '../ui/Icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useActions } from '../../contexts/DashboardContext';

const OnboardingModal = ({ isOpen, onComplete }) => {
    const { session, fetchProfile } = useAuth();
    const [step, setStep] = useState(1); // 1: Welcome/TOS, 2: Privacy Policy
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleAccept = async () => {
        if (step === 1) {
            setStep(2);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, {
                tos_accepted: true,
                privacy_policy_accepted: true,
                preferred_language: 'tl'
            }, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'ngrok-skip-browser-warning': '69420'
                }
            });

            await fetchProfile(session);
            onComplete();
        } catch (err) {
            console.error('Failed to accept terms:', err);
            setError('Hindi maiproseso ang iyong pagtanggap. Pakisubukang muli.');
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-8 bg-blue-600 dark:bg-blue-700 text-white relative">
                    <h2 className="text-2xl font-bold mb-2">
                        {step === 1 ? 'Mga Tuntunin ng Serbisyo' : 'Patakaran sa Privacy'}
                    </h2>
                    <p className="text-blue-100 text-sm opacity-80">
                        Hakbang {step} ng 2 • TIP AI Institutional Compliance
                    </p>
                    <div className="absolute top-8 right-8 opacity-20">
                        <Icons.Shield size={48} />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {step === 1 ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                                Tamang Integridad at Pananagutan sa Artificial Intelligence (TIP AI)
                            </h3>
                            <p className="mb-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                                Maligayang pagdating sa TIP AI. Ang aming serbisyo ay idinisenyo upang tulungan ang mga institusyong pang-akademiko at mga mananaliksik sa pagpapanatili ng integridad laban sa hindi awtorisadong paggamit ng AI.
                            </p>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">1. Paggamit ng Serbisyo</h4>
                            <p className="mb-4 text-slate-600 dark:text-slate-400">
                                Ang TIP AI ay dapat gamitin lamang para sa mga lehitimong layuning pang-akademiko at pagsusuri ng dokumento. Ipinagbabawal ang anumang pagtatangka na i-reverse engineer ang aming heuristics engine o gamitin ang system upang manlinlang.
                            </p>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">2. Pananagutan ng User</h4>
                            <p className="mb-4 text-slate-600 dark:text-slate-400">
                                Ikaw ang may ganap na pananagutan sa mga dokumentong iyong ina-upload at sa mga resulta ng pagsusuri. Ang TIP AI ay isang tool sa pagdedesisyon at hindi dapat ituring na tanging basehan para sa mga aksyong pandisiplina.
                            </p>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                                Pagprotekta sa Iyong Datos
                            </h3>
                            <p className="mb-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                                Pinahahalagahan ng TIP AI ang iyong privacy at ang seguridad ng iyong mga dokumentong pang-akademiko.
                            </p>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">1. Pagkolekta ng Datos</h4>
                            <p className="mb-4 text-slate-600 dark:text-slate-400">
                                Kolektahin lamang namin ang impormasyong kinakailangan para sa pagsusuri ng iyong dokumento, kabilang ang text content, metadata, at session logs para sa seguridad.
                            </p>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-6 mb-2">2. Pagbabahagi ng Impormasyon</h4>
                            <p className="mb-4 text-slate-600 dark:text-slate-400">
                                Hindi namin ibinebenta ang iyong personal na datos sa mga ikatlong partido. Ang iyong mga dokumento ay sinusuri gamit ang aming mga secure na server at AI nodes na sumusunod sa UNESCO ethical standards.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[60%]">
                        {error && <span className="text-red-500 font-medium">{error}</span>}
                        {!error && 'Sa pagpapatuloy, sumasang-ayon ka sa aming mga tuntunin.'}
                    </div>
                    <div className="flex gap-4">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Bumalik
                            </button>
                        )}
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>{step === 1 ? 'Sunod' : 'Simulan na'} <Icons.ArrowRight size={16} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OnboardingModal;
