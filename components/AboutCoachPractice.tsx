import React from 'react';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ClockIcon } from './icons/ClockIcon';
import { useLocalization } from '../context/LocalizationContext';

export const AboutCoachPractice: React.FC = () => {
  const { t } = useLocalization();

  const centerLabel = t('about_practice_center').split('\n');

  return (
    <div className="w-full pb-16 bg-background-primary dark:bg-background-primary animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4 uppercase tracking-wide">
            {t('about_practice_title')}
          </h2>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
            {t('about_practice_subtitle_1')}
            <span className="text-accent-primary font-semibold"> {t('about_practice_subtitle_highlight')}</span>
            {t('about_practice_subtitle_2')}
          </p>
        </div>

        {/* Core Cycle Diagram */}
        <div className="relative mb-12">
          {/* Center Piece — desktop */}
          <div className="hidden md:flex absolute inset-0 m-auto w-32 h-32 z-10 pointer-events-none justify-center items-center">
            <div className="gradient-accent p-6 rounded-full shadow-xl w-32 h-32 flex flex-col items-center justify-center border-4 border-background-primary">
              <ClockIcon className="w-10 h-10 mb-1 text-white" />
              <span className="text-xs font-bold uppercase text-center leading-tight text-white">
                {centerLabel.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>

          {/* Center Piece — mobile */}
          <div className="md:hidden flex justify-center mb-8">
            <div className="gradient-accent p-6 rounded-full shadow-xl w-32 h-32 flex flex-col items-center justify-center border-4 border-background-primary">
              <ClockIcon className="w-10 h-10 mb-1 text-white" />
              <span className="text-xs font-bold uppercase text-center leading-tight text-white">
                {centerLabel.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-8 md:gap-12 relative md:auto-rows-fr">
            {/* Connecting Lines (Desktop only) */}
            <div className="hidden md:block absolute inset-x-0 top-1/2 h-1 bg-border-secondary -z-1 -translate-y-1/2" />
            <div className="hidden md:block absolute inset-y-0 left-1/2 w-1 bg-border-secondary -z-1 -translate-x-1/2" />

            {/* Step 1 */}
            <div className="order-1 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:flex md:flex-col">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">1</div>
              <div className="flex items-center gap-3 mb-3">
                <UsersIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('about_practice_step1_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('about_practice_step1_desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="order-2 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">2</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <ChatBubbleIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('about_practice_step2_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('about_practice_step2_desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="order-3 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:flex md:flex-col">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">3</div>
              <div className="flex items-center gap-3 mb-3">
                <ClipboardIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('about_practice_step3_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('about_practice_step3_desc')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="order-4 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">4</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <TrendingUpIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">{t('about_practice_step4_title')}</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                {t('about_practice_step4_desc')}
              </p>
            </div>
          </div>
        </div>

        {/* Access info */}
        <div className="border-t border-border-secondary pt-8">
          <div className="not-prose p-4 bg-accent-primary/10 dark:bg-accent-primary/15 border-2 border-accent-primary/50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5 shrink-0" aria-hidden="true">ℹ️</div>
              <p className="text-sm text-content-secondary m-0">{t('about_practice_access')}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
