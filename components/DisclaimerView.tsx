import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocalization } from '../context/LocalizationContext';

interface DisclaimerViewProps {}

const de_markdown = `Diese Anwendung und die darin enthaltenen KI-Coaches dienen nur zu Informations- und Bildungszwecken.

## Kein Ersatz für professionelle Beratung
Die KI-Coaches sind keine lizenzierten medizinischen, rechtlichen, finanziellen oder therapeutischen Fachkräfte. Die erbrachte Leistung stellt somit **ausdrücklich keine medizinische, psychologische oder psychotherapeutische Diagnose, Therapie oder Heilbehandlung dar und ersetzt diese in keiner Weise**. Laufende Behandlungen in diesen Bereichen sollen aufgrund des Coachings weder unterbrochen, abgebrochen noch unterlassen werden. Die Gespräche, die Sie führen, sind kein Ersatz für die Beratung durch einen qualifizierten Fachmann. 

## Information bei Notfällen
Bei akuten psychischen oder medizinischen Krisen oder Notfällen ist der Anwender aufgefordert, sich umgehend an qualifiziertes medizinisches oder psychiatrisches Fachpersonal (Arzt, Krankenhaus, Notruf) zu wenden und nicht die Leistungen des Anbieters in Anspruch zu nehmen.

## Eigenverantwortung
Der Anwender handelt während und außerhalb der Coaching-Einheiten in jeder Phase der Arbeit mit der Anwendung **eigenverantwortlich**. Der Klient ist für seine körperliche und geistige Gesundheit sowie sein Wohlbefinden während und nach Abschluss des Coachings in vollem Umfang selbst verantwortlich. Sämtliche Maßnahmen, die der Klient aufgrund des Coachings durchführt, liegen in seinem alleinigen Verantwortungsbereich.

## Keine Erfolgsgewähr und Haftung für Inhalte
Die Anwendung und die KI-Coaches dienen als Werkzeug zur Prozessbegleitung und Information. Der Anbieter garantiert nicht die subjektive Wirksamkeit oder den Erfolg der bereitgestellten Ratschläge oder Erkenntnisse. Die gesetzliche Gewährleistung für die **Funktionalität der Anwendung** (wie im Handbuch beschrieben) bleibt hiervon unberührt.

## Haftungsbeschränkung (Schadenersatz)
(1) Die Haftung des Anbieters für Schäden ist auf Vorsatz oder grobe Fahrlässigkeit beschränkt.   
(2) Die Haftung für **Personenschäden** (Verletzung des Lebens, des Körpers oder der Gesundheit), die auf leichter Fahrlässigkeit beruhen, wird durch diese AGB **nicht** ausgeschlossen oder beschränkt.   
(3) Im Übrigen (reine Vermögensschäden) ist die Haftung des Anbieters bei leichter Fahrlässigkeit ausgeschlossen, sofern es sich dabei nicht um die Verletzung von Kardinalpflichten handelt. In diesem Fall ist die Haftung betragsmäßig auf das vom Anwender für die konkrete Leistung tatsächlich bezahlte Honorar beschränkt.`;

const en_markdown = `This application and the AI coaches contained within are for informational and educational purposes only.

## No Substitute for Professional Advice
The AI coaches are not licensed medical, legal, financial, or therapeutic professionals. The services provided therefore **expressly do not constitute and do not replace medical, psychological, or psychotherapeutic diagnosis, therapy, or healing treatment in any way**. Ongoing treatments in these areas should not be interrupted, discontinued, or refrained from as a result of the coaching. The conversations you have are not a substitute for advice from a qualified professional.

## Information in Emergencies
In acute psychological or medical crises or emergencies, the user is urged to immediately contact qualified medical or psychiatric professionals (doctor, hospital, emergency services) and not to use the provider's services.

## Personal Responsibility
The user acts **on their own responsibility** during and outside of coaching sessions at every stage of working with the application. The client is fully responsible for their physical and mental health and well-being during and after the completion of the coaching. All measures taken by the client as a result of the coaching are solely their responsibility.

## No Guarantee of Success and Liability for Content
The application and the AI coaches serve as a tool for process support and information. The provider does not guarantee the subjective effectiveness or success of the advice or insights provided. The statutory warranty for the **functionality of the application** (as described in the manual) remains unaffected.

## Limitation of Liability (Damages)
(1) The provider's liability for damages is limited to intent or gross negligence.  
(2) Liability for **personal injury** (injury to life, body, or health) based on slight negligence is **not** excluded or limited by these terms and conditions.  
(3) In all other respects (pure financial losses), the provider's liability for slight negligence is excluded, provided that it does not involve the violation of cardinal obligations. In this case, the liability is limited to the fee actually paid by the user for the specific service.`;


const DisclaimerView: React.FC<DisclaimerViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;

    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">{t('disclaimer_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-content-secondary space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-content-primary mt-8 mb-4 not-prose" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default DisclaimerView;