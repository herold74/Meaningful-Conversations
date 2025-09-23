import React from 'react';
import Spinner from './shared/Spinner';

const AnalyzingView: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fadeIn">
            <Spinner />
            <h1 className="mt-6 text-2xl font-bold text-gray-200">Analyzing Session...</h1>
            <p className="mt-2 text-lg text-gray-400">Please wait a moment.</p>
        </div>
    );
};

export default AnalyzingView;
