import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface InfoViewProps {
    onBack: () => void;
}

const AboutView: React.FC<InfoViewProps> = ({ onBack }) => {
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-transparent border border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1 p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-200 uppercase">About Meaningful Conversations</h1>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 space-y-4 leading-relaxed">
                <p>Meaningful Conversations is an application included with your manualmode.at subscription, designed to enhance your coaching experience. It provides a private, reflective space for personal growth, serving as a state-of-the-art, user-friendly tool to help you easily initiate and track your personal development.</p>
                <h2 className="text-xl font-semibold text-gray-200">Our Mission</h2>
                <p>Our mission is to leverage technology to make self-coaching more accessible and dynamic. We believe that structured conversation can be a powerful tool for clarity and self-discovery. This application serves as a digital journal and a conversational partner that evolves with you. We carefully select and maintain our coaching profiles to support effective outcomes and a great user experience.</p>
                <h2 className="text-xl font-semibold text-gray-200">How It Works</h2>
                <p>The application uses Google's Gemini API to power the AI coaches. Each coach is given a distinct personality and a set of instructions based on established coaching methodologies. Your "Life Context" file acts as the AI's long-term memory, allowing for personalized and continuous conversations. At the end of each session, the AI suggests updates to this context, creating a living document of your personal journey.</p>
            </div>
        </div>
    );
};

export default AboutView;