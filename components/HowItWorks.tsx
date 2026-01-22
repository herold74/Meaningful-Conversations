import React from 'react';
import { FileTextIcon } from './icons/FileTextIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { LockIcon } from './icons/LockIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { useLocalization } from '../context/LocalizationContext';

export const HowItWorks: React.FC = () => {
  const { t } = useLocalization();
  
  return (
    <div className="w-full pb-16 bg-background-primary dark:bg-background-primary animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4 uppercase tracking-wide">
            {t('how_it_works_title')}
          </h2>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
            {t('how_it_works_subtitle_1')}
            <span className="text-accent-primary font-semibold"> Meaningful Conversations</span> {t('how_it_works_subtitle_2')}
          </p>
        </div>

        {/* Core Cycle Diagram */}
        <div className="relative mb-20">
          {/* Center Piece: Life Context - positioned relative to outer container, NOT the grid */}
          <div className="hidden md:flex absolute inset-0 m-auto w-32 h-32 z-10 pointer-events-none justify-center items-center">
            <div className="bg-accent-primary text-white p-6 rounded-full shadow-xl w-32 h-32 flex flex-col items-center justify-center border-4 border-background-primary">
              <FileTextIcon className="w-10 h-10 mb-1 text-white" />
              <span className="text-xs font-bold uppercase text-center leading-tight text-white">Life<br/>Context</span>
            </div>
          </div>
          
          {/* Mobile version of Life Context - shown at top on mobile */}
          <div className="md:hidden flex justify-center mb-8">
            <div className="bg-accent-primary text-white p-6 rounded-full shadow-xl w-32 h-32 flex flex-col items-center justify-center border-4 border-background-primary">
              <FileTextIcon className="w-10 h-10 mb-1 text-white" />
              <span className="text-xs font-bold uppercase text-center leading-tight text-white">Life<br/>Context</span>
            </div>
          </div>

          {/* Grid with equal row heights to ensure consistent line positioning */}
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-8 md:gap-12 relative md:auto-rows-fr">
            
            {/* Connecting Lines (Desktop only) - positioned relative to grid */}
            <div className="hidden md:block absolute inset-x-0 top-1/2 h-1 bg-border-secondary -z-1 -translate-y-1/2" />
            <div className="hidden md:block absolute inset-y-0 left-1/2 w-1 bg-border-secondary -z-1 -translate-x-1/2" />

            {/* Step 1: Selection */}
            <div className="order-1 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:flex md:flex-col">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">1</div>
              <div className="flex items-center gap-3 mb-3">
                <UsersIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('how_it_works_step1_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('how_it_works_step1_desc')}
              </p>
            </div>

            {/* Step 2: Reflection */}
            <div className="order-2 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">2</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <ChatBubbleIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('how_it_works_step2_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('how_it_works_step2_desc')}
              </p>
            </div>

            {/* Step 3: Action */}
            <div className="order-3 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:flex md:flex-col">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">3</div>
              <div className="flex items-center gap-3 mb-3">
                <ClipboardIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('how_it_works_step3_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('how_it_works_step3_desc')}
              </p>
            </div>

             {/* Step 4: Growth */}
             <div className="order-4 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">4</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <TrendingUpIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('how_it_works_step4_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('how_it_works_step4_desc')}
              </p>
            </div>

          </div>
        </div>

        {/* Trust Factors Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 border-t border-border-secondary pt-12">
          <div className="text-center px-4 flex flex-col items-center">
            <LockIcon className="w-10 h-10 text-status-success-foreground mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">{t('how_it_works_trust1_title')}</h4>
            <p className="text-sm text-content-secondary">
              {t('how_it_works_trust1_desc')}
            </p>
          </div>
          <div className="text-center px-4 flex flex-col items-center">
            <SoundWaveIcon className="w-10 h-10 text-accent-tertiary mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">{t('how_it_works_trust2_title')}</h4>
            <p className="text-sm text-content-secondary">
              {t('how_it_works_trust2_desc')}
            </p>
          </div>
          <div className="text-center px-4 flex flex-col items-center">
            <TrophyIcon className="w-10 h-10 text-accent-secondary mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">{t('how_it_works_trust3_title')}</h4>
            <p className="text-sm text-content-secondary">
              {t('how_it_works_trust3_desc')}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
