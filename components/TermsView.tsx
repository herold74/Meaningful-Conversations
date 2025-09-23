import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface InfoViewProps {
    onBack: () => void;
}

const TermsView: React.FC<InfoViewProps> = ({ onBack }) => {
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-transparent border border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1 p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-200 uppercase">Terms & Conditions</h1>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 space-y-4 leading-relaxed">
                <p>Welcome to Meaningful Conversations. By using our application, you agree to these terms. This service is provided for personal, non-commercial use to facilitate self-reflection through AI-powered coaching.</p>
                <h2 className="text-xl font-semibold text-gray-200">User Conduct</h2>
                <p>You agree to use the service responsibly. Do not input any illegal, harmful, or sensitive personal information that you would not want to be processed. The conversations are processed in-memory and not stored, but responsible usage is paramount.</p>
                <h2 className="text-xl font-semibold text-gray-200">Service Availability</h2>
                <p>We strive to ensure the service is available, but we do not guarantee uninterrupted access. The service is provided "as is" without warranties of any kind.</p>
                 <h2 className="text-xl font-semibold text-gray-200">Limitation of Liability</h2>
                <p>Meaningful Conversations is not liable for any direct or indirect damages arising from your use of the service. The AI's advice is not a substitute for professional guidance.</p>
            </div>
        </div>
    );
};

export default TermsView;