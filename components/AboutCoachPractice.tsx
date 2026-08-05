import React from 'react';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { ClockIcon } from './icons/ClockIcon';
import { useLocalization } from '../context/LocalizationContext';

export const AboutCoachPractice: React.FC = () => {
  const { t } = useLocalization();

  const steps = [
    {
      icon: UsersIcon,
      title: t('about_practice_step1_title'),
      desc: t('about_practice_step1_desc'),
    },
    {
      icon: ChatBubbleIcon,
      title: t('about_practice_step2_title'),
      desc: t('about_practice_step2_desc'),
    },
    {
      icon: ClipboardCheckIcon,
      title: t('about_practice_step3_title'),
      desc: t('about_practice_step3_desc'),
    },
    {
      icon: TrendingUpIcon,
      title: t('about_practice_step4_title'),
      desc: t('about_practice_step4_desc'),
    },
  ];

  return (
    <div className="w-full pb-8 animate-fadeIn">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-semibold uppercase tracking-wide">
          <ClockIcon className="w-4 h-4" />
          {t('about_practice_badge')}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-content-primary mb-3">
          {t('about_practice_title')}
        </h2>
        <p className="text-base text-content-secondary max-w-2xl mx-auto leading-relaxed">
          {t('about_practice_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="bg-background-tertiary/40 p-5 rounded-lg border border-border-secondary hover:border-accent-primary/50 transition-colors relative"
            >
              <div className="absolute -top-3 -left-3 w-7 h-7 bg-accent-secondary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                {index + 1}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-6 h-6 text-accent-primary shrink-0" />
                <h3 className="text-lg font-bold text-content-primary">{step.title}</h3>
              </div>
              <p className="text-sm text-content-secondary leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-accent-primary/10 border-2 border-accent-primary/40 rounded-lg not-prose">
        <p className="text-sm text-content-secondary m-0">{t('about_practice_access')}</p>
      </div>
    </div>
  );
};
