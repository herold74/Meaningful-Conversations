import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface InfoViewProps {
    onBack: () => void;
}

const FAQView: React.FC<InfoViewProps> = ({ onBack }) => {
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-transparent border border-gray-700 my-10 animate-fadeIn">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1 p-2 rounded-full hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-200 uppercase">Frequently Asked Questions</h1>
            </div>
            <div className="space-y-6 text-gray-300">
                <div>
                    <h2 className="text-lg font-semibold text-gray-200">Is my data saved?</h2>
                    <p className="mt-2 leading-relaxed">No. We prioritize your privacy. All conversations and the 'Life Context' you provide are processed in your browser's memory and are permanently gone when you end the session or close the browser tab. You must download your updated context file at the end of a session to save your progress.</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-200">How is my privacy protected with the 'Life Context' file?</h2>
                    <p className="mt-2 leading-relaxed">To ensure your privacy, the username is intentionally not saved or mentioned in your "Life Context" file. This file acts as the long-term memory for your coaching sessions, allowing a variety of bots to provide continuous, personalized support. The design of the system is tuned to prevent storing any personally identifiable information, such as names or personal identification numbers, so your coaching conversations remain anonymized and secure. For the same reasons the life context file needs to be stored and provided by the user.</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-200">Can the AI diagnose me or provide therapy?</h2>
                    <p className="mt-2 leading-relaxed">Absolutely not. The AI coaches are not medical professionals and cannot provide diagnoses, therapy, or any form of medical advice. This tool is for self-reflection and personal growth only. Please seek help from a qualified professional for any mental health concerns.</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-200">Who are the different coaches?</h2>
                    <p className="mt-2 leading-relaxed">Each coach is an AI persona powered by the same advanced language model but guided by a unique "system prompt." This prompt defines their personality, coaching style (like Stoicism or CBT), and area of focus, allowing you to choose the approach that best suits your needs for a particular session.</p>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-200">How do the XP work?</h2>
                    <p className="mt-2 leading-relaxed">
                        The Experience Points (XP) system is designed to reward you for engaging in meaningful conversations. Here’s how you can earn XP:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                        <li><strong>+10 XP</strong> for every message you send.</li>
                        <li><strong>+50 XP Bonus</strong> for completing a session where you define at least one concrete next step with a timeframe or deadline. This encourages turning insights into action.</li>
                    </ul>
                    <p className="mt-2 leading-relaxed">
                        You advance to the next level for every <strong>100 XP</strong> you accumulate.
                    </p>
                </div>
                 <div>
                    <h2 className="text-lg font-semibold text-gray-200">How does the voice feature work?</h2>
                    <p className="mt-2 leading-relaxed">For coaches with voice enabled (like Rob), we use your browser's built-in Web Speech API for both speech-to-text and text-to-speech. This means your voice data is processed by your browser (e.g., Google Chrome, Safari) and not by our application servers, further protecting your privacy.</p>
                </div>
            </div>
        </div>
    );
};

export default FAQView;