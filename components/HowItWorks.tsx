import React from 'react';
import { FileTextIcon } from './icons/FileTextIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { LockIcon } from './icons/LockIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { TrophyIcon } from './icons/TrophyIcon';

export const HowItWorks: React.FC = () => {
  return (
    <div className="w-full py-16 bg-background-primary dark:bg-background-primary animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-content-primary mb-4 uppercase tracking-wide">
            Ein Coach, der dich kennt
          </h2>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
            Die meisten KIs vergessen dich, sobald das Fenster geschlossen wird. 
            <span className="text-accent-primary font-semibold"> Meaningful Conversations</span> baut ein Gedächtnis auf – sicher, privat und transparent.
          </p>
        </div>

        {/* Core Cycle Diagram */}
        <div className="relative mb-20">
          {/* Connecting Lines (Desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-border-secondary -z-1 transform -translate-y-1/2" />
          <div className="hidden md:block absolute left-1/2 top-0 w-1 h-full bg-border-secondary -z-1 transform -translate-x-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
            
            {/* Center Piece: Life Context - Hidden on small screens in grid flow, shown via absolute position on MD */}
            <div className="order-first md:absolute md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-10 mb-8 md:mb-0 pointer-events-none flex justify-center">
              <div className="bg-accent-primary text-white p-6 rounded-full shadow-xl w-32 h-32 flex flex-col items-center justify-center border-4 border-background-primary">
                <FileTextIcon className="w-10 h-10 mb-1 text-white" />
                <span className="text-xs font-bold uppercase text-center leading-tight text-white">Life<br/>Context</span>
              </div>
            </div>

            {/* Step 1: Selection */}
            <div className="order-1 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">1</div>
              <div className="flex items-center gap-3 mb-3">
                <UsersIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">Wähle deinen Coach</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Stoische Ruhe, strategische Analyse oder empathisches Zuhören? Wähle den Stil, der zu deiner Stimmung passt. Das Wissen kommt aus deinem Life Context.
              </p>
            </div>

            {/* Step 2: Reflection */}
            <div className="order-2 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">2</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <ChatBubbleIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">Reflektiere & Sprich</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Nutze den <strong>Voice Mode</strong> für natürliche Gespräche oder schreibe im Chat. Dein Coach stellt Zusammenhänge her, die dir vielleicht entgangen sind.
              </p>
            </div>

            {/* Step 3: Action (Step 4 in visual Grid flow for Desktop, but Step 3 logically) */}
             {/* We need Step 3 ("Erkenntnisse sichern") to be 3rd on mobile. 
                 On Desktop (md), it was in the bottom-right slot.
                 On Mobile, we use order-3.
             */}
            <div className="order-3 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:text-right md:flex md:flex-col md:items-end md:mt-12">
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">3</div>
              <div className="flex items-center gap-3 mb-3 md:flex-row-reverse">
                <ClipboardIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">Erkenntnisse sichern</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Erhalte eine Zusammenfassung und exportiere <strong>Action Items</strong> direkt in deinen Kalender. Lass Vorsätze nicht verpuffen.
              </p>
            </div>

             {/* Step 4: Growth (Step 3 in visual Grid flow for Desktop, but Step 4 logically) */}
             {/* We need Step 4 ("Das Wachstum") to be 4th on mobile. 
                 On Desktop (md), it was in the bottom-left slot.
                 On Mobile, we use order-4.
             */}
             <div className="order-4 bg-background-secondary p-6 rounded-lg shadow-lg border border-border-secondary hover:border-accent-primary transition-colors relative group md:mt-12">
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-accent-secondary rounded-full flex items-center justify-center text-white font-bold shadow-md">4</div>
              <div className="flex items-center gap-3 mb-3">
                <TrendingUpIcon className="w-6 h-6 text-accent-primary" />
                <h3 className="text-xl font-bold text-content-primary">Das Wachstum</h3>
              </div>
              <p className="text-content-secondary text-sm leading-relaxed">
                Die App schlägt Updates für deinen Life Context vor. Neue Erkenntnisse werden gespeichert – du musst dich beim nächsten Mal nicht wiederholen.
              </p>
            </div>

          </div>
        </div>

        {/* Trust Factors Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 border-t border-border-secondary pt-12">
          <div className="text-center px-4 flex flex-col items-center">
            <LockIcon className="w-10 h-10 text-status-success-foreground mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">Privacy First</h4>
            <p className="text-sm text-content-secondary">
              End-to-End Verschlüsselung oder kompletter Gast-Modus. Deine Gedanken gehören dir.
            </p>
          </div>
          <div className="text-center px-4 flex flex-col items-center">
            <SoundWaveIcon className="w-10 h-10 text-accent-tertiary mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">Bilingual & Natürlich</h4>
            <p className="text-sm text-content-secondary">
              Nahtloser Wechsel zwischen DE/EN mit sorgfältig ausgewählten Premium-Stimmen.
            </p>
          </div>
          <div className="text-center px-4 flex flex-col items-center">
            <TrophyIcon className="w-10 h-10 text-accent-secondary mx-auto mb-4" />
            <h4 className="font-bold text-content-primary mb-2">Gamification</h4>
            <p className="text-sm text-content-secondary">
              Bleib am Ball mit XP, Streaks und Achievements für deine mentale Arbeit.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
