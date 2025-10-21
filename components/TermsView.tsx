import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
    onBack: () => void;
}

const de_markdown = `Diese Nutzungsbedingungen ("Bedingungen") regeln Ihre Nutzung der Anwendung "Sinnstiftende Gespräche" (der "Dienst"). Durch den Zugriff auf oder die Nutzung des Dienstes erklären Sie sich mit diesen Bedingungen einverstanden.

## 1. Leistungsbeschreibung
Der Dienst bietet Zugang zu KI-gesteuerten Coaching-Gesprächen, die zur Selbstreflexion und persönlichen Weiterentwicklung dienen. Benutzer können ihre Gespräche mithilfe einer "Lebenskontext"-Datei personalisieren. Der Dienst ist in zwei Modi verfügbar:

- **Gastmodus:** Die Datenverarbeitung erfolgt ausschließlich lokal im Browser des Nutzers. Der Nutzer ist für das Speichern und Verwalten seiner Daten verantwortlich.
- **Registrierter Modus:** Bietet zusätzliche Funktionen wie die automatische Speicherung des Lebenskontextes, der Ende-zu-Ende-verschlüsselt wird.

## 2. Benutzerkonten und Datensicherheit
**Registrierte Benutzer:** Sie sind für die Geheimhaltung Ihres Passworts verantwortlich. Aufgrund der Ende-zu-Ende-Verschlüsselung haben wir keinen Zugriff auf Ihr Passwort oder Ihre verschlüsselten "Lebenskontext"-Daten. **Wenn Sie Ihr Passwort verlieren oder zurücksetzen, gehen Ihre verschlüsselten Daten dauerhaft und unwiederbringlich verloren.** Es liegt in Ihrer Verantwortung, regelmäßig Sicherungskopien Ihrer Daten zu erstellen, indem Sie die Datei herunterladen.

**Gastbenutzer:** Sie sind allein für das Sichern und Verwalten Ihrer "Lebenskontext"-Datei verantwortlich, da keine Daten auf unseren Servern gespeichert werden.

## 3. Verantwortlichkeiten des Benutzers
Sie stimmen zu, den Dienst nicht für rechtswidrige Zwecke zu nutzen. Sie sind während und außerhalb der Coaching-Einheiten in jeder Phase der Arbeit mit der Anwendung **eigenverantwortlich**. Sie sind für Ihre körperliche und geistige Gesundheit sowie Ihr Wohlbefinden in vollem Umfang selbst verantwortlich. Sämtliche Maßnahmen, die Sie aufgrund des Coachings durchführen, liegen in Ihrem alleinigen Verantwortungsbereich.

## 4. Dienstverfügbarkeit und Änderungen
Wir behalten uns das Recht vor, den Dienst oder einzelne Funktionen jederzeit ohne Vorankündigung zu ändern oder einzustellen. Die gesetzliche Gewährleistung für die **Funktionalität der Anwendung** (wie im Handbuch beschrieben) bleibt hiervon unberührt.

## 5. Änderungen der Bedingungen
Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern. Wir werden Sie über alle Änderungen informieren, indem wir die neuen Bedingungen innerhalb des Dienstes veröffentlichen.
`;

const en_markdown = `These Terms of Service ("Terms") govern your use of the "Meaningful Conversations" application (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.

## 1. Description of Service
The Service provides access to AI-powered coaching conversations intended for self-reflection and personal development. Users can personalize their sessions using a "Life Context" file. The service is available in two modes:

- **Guest Mode:** Data processing occurs entirely locally in the user's browser. The user is responsible for saving and managing their data.
- **Registered Mode:** Offers additional features, including automatic saving of the Life Context, which is end-to-end encrypted.

## 2. User Accounts and Data Security
**Registered Users:** You are responsible for maintaining the confidentiality of your password. Due to end-to-end encryption, we have no access to your password or your encrypted "Life Context" data. **If you lose or reset your password, your encrypted data will be permanently and irrecoverably lost.** It is your responsibility to make regular backups of your data by downloading the file.

**Guest Users:** You are solely responsible for saving and managing your "Life Context" file, as no data is stored on our servers.

## 3. User Responsibilities
You agree not to use the Service for any unlawful purpose. You act **on your own responsibility** during and outside of coaching sessions at every stage of working with the application. You are fully responsible for your physical and mental health and well-being. All measures taken as a result of the coaching are solely your responsibility.

## 4. Service Availability and Modifications
We reserve the right to modify or discontinue the Service, or any feature thereof, at any time without notice. The statutory warranty for the **functionality of the application** (as described in the user manual) remains unaffected.

## 5. Changes to Terms
We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms within the Service.
`;

const TermsView: React.FC<InfoViewProps> = ({ onBack }) => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-700 my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="relative text-center">
                <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 uppercase">{t('terms_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4 not-prose" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

export default TermsView;