import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { useLocalization } from '../context/LocalizationContext';

interface InfoViewProps {
}

const de_markdown = `
## Allgemein

### Was ist die "Lebenskontext"-Datei?
Die Lebenskontext-Datei (.md) ist ein zentrales Dokument, das als Gedächtnis Ihres Coaches dient. Sie enthält Ihre Ziele, Herausforderungen, Routinen und wichtige Hintergrundinformationen. Nach jeder Sitzung analysiert die KI Ihr Gespräch und schlägt Aktualisierungen vor, um diese Datei auf dem neuesten Stand zu halten und ein kontinuierliches und kontextbezogenes Coaching zu ermöglichen. Sie haben die volle Kontrolle darüber, was gespeichert wird.

### Kann ich die App kostenlos nutzen?
Ja! Die App bietet einen Gastmodus mit Zugang zu einer Auswahl von Coaches. Im Gastmodus werden alle Ihre Daten, einschließlich Ihrer Lebenskontext-Datei, lokal in Ihrem Browser verarbeitet und niemals an unsere Server gesendet. Sie sind dafür verantwortlich, Ihre Datei für jede Sitzung zu speichern und zu laden. Registrierte Benutzer erhalten Zugang zu mehr Coaches und Funktionen wie verschlüsseltem Cloud-Speicher.

### Was ist "Gamification"?
Gamification-Elemente wie XP, Level und Serien sollen Sie motivieren, sich regelmäßig mit Selbstreflexion zu beschäftigen. Sie verdienen XP für die Teilnahme an Gesprächen und können spezielle Boni erhalten. Ein **50-XP-Bonus** wird für das Führen einer Sitzung zu einem natürlichen Abschluss vergeben, und ein **25-XP-Bonus** wird vergeben, wenn Sie berichten, ein bereits bestehendes Ziel erreicht zu haben. Das Abschließen von Sitzungen und das Erreichen von Meilensteinen schaltet Erfolge frei und belohnt Ihr Engagement für persönliches Wachstum.

---

## Registrierte Benutzer

### Wie werden meine Daten geschützt?
Wir verwenden eine Ende-zu-Ende-Verschlüsselung (E2EE) für Ihre Lebenskontext-Datei. Bei der Registrierung wird aus Ihrem Passwort ein Verschlüsselungsschlüssel erstellt, den NUR Sie haben. Ihre Daten werden auf Ihrem Gerät verschlüsselt, bevor sie an unsere Server gesendet werden, und können nur auf Ihrem Gerät mit Ihrem Passwort entschlüsselt werden. **Wir können Ihre Daten nicht lesen und Ihr Passwort nicht wiederherstellen.**

### Was passiert, wenn ich mein Passwort vergesse?
Aufgrund unseres E2EE-Sicherheitsmodells ist **Ihre verschlüsselte Lebenskontext-Datei dauerhaft verloren, wenn Sie Ihr Passwort vergessen.** Wenn Sie Ihr Passwort zurücksetzen, wird ein neuer Verschlüsselungsschlüssel erstellt und Ihre alten, unlesbaren Daten werden von unseren Servern gelöscht. Wir empfehlen dringend, regelmäßig eine Sicherungskopie Ihrer Lebenskontext-Datei herunterzuladen.

---

## Coaching & KI

### Die Antwort des Coaches ist nicht hilfreich. Was kann ich tun?
KI ist ein mächtiges Werkzeug, aber sie ist nicht perfekt. Wenn eine Antwort nicht hilfreich ist, versuchen Sie, Ihre Aussage umzuformulieren oder mehr Kontext zu geben. Sie können den Coach auch sanft wieder auf den richtigen Weg bringen, indem Sie etwas sagen wie: "Lassen Sie uns zurückkehren zu..." oder "Ich möchte mich auf... konzentrieren". Sie können bestimmte problematische Antworten direkt im Chat über das Flaggensymbol melden, das neben der Nachricht des Coaches erscheint. Zusätzlich können Sie nach der Sitzung das allgemeine Feedback- und Bewertungssystem nutzen, um Probleme zu melden, was uns hilft, das System zu verbessern.

### Kann ich während einer Sitzung den Coach wechseln?
Sie wählen zu Beginn jeder Sitzung einen Coach aus. Wenn Sie das Gefühl haben, dass der Stil eines anderen Coaches vorteilhafter wäre, können Sie die aktuelle Sitzung beenden. Nach der Sitzungsüberprüfung haben Sie die Möglichkeit, "Coach wechseln" auszuwählen, was Sie mit Ihrem aktualisierten Lebenskontext zurück zum Coach-Auswahlbildschirm bringt.
`;

const en_markdown = `
## General

### What is the "Life Context" file?
The Life Context file (.md) is a central document that serves as your coach's memory. It contains your goals, challenges, routines, and important background information. After each session, the AI analyzes your conversation and suggests updates to keep this file current, allowing for continuous and contextual coaching. You have full control over what gets saved.

### Can I use the app for free?
Yes! The app offers a guest mode with access to a selection of coaches. In guest mode, all your data, including your Life Context file, is processed locally in your browser and is never sent to our servers. You are responsible for saving and loading your file for each session. Registered users get access to more coaches and features like encrypted cloud storage.

### What is Gamification?
Gamification elements like XP, levels, and streaks are designed to motivate you to engage in regular self-reflection. You earn XP for participating in conversations, and you can receive special bonuses. A **50 XP bonus** is awarded for guiding a session to a natural conclusion, and a **25 XP bonus** is awarded if you report completing a pre-existing goal. Completing sessions and reaching milestones unlocks achievements and rewards your commitment to personal growth.

---

## Registered Users

### How is my data protected?
We use end-to-end encryption (E2EE) for your Life Context file. When you register, your password is used to create an encryption key that ONLY you have. Your data is encrypted on your device before it's sent to our servers and can only be decrypted on your device with your password. **We cannot read your data, and we cannot recover your password.**

### What happens if I forget my password?
Due to our E2EE security model, **if you forget your password, your encrypted Life Context file is permanently lost.** When you reset your password, a new encryption key is created, and your old, unreadable data is deleted from our servers. We strongly recommend regularly downloading a backup of your Life Context file.

---

## Coaching & AI

### The coach's response isn't helpful. What can I do?
AI is a powerful tool, but it's not perfect. If a response is unhelpful, try rephrasing your statement or providing more context. You can also gently guide the coach back on track by saying something like, "Let's go back to..." or "I'd like to focus on...". You can report specific problematic responses directly in the chat using the flag icon that appears next to the coach's message. Additionally, after the session, you can use the overall feedback and rating system to report issues, which helps us improve the system.

### Can I change coaches during a session?
You choose a coach at the start of each session. If you feel another coach's style would be more beneficial, you can end the current session. After the session review, you will have the option to "Switch Coach," which will take you back to the coach selection screen with your updated Life Context.
`;

const FAQView: React.FC<InfoViewProps> = () => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;
    
    return (
        <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary mt-4 mb-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-content-primary uppercase">{t('faq_title')}</h1>
            </div>
            <div className="prose dark:prose-invert max-w-none text-content-secondary space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-content-primary mt-8 mb-4 not-prose" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-content-primary mt-6 mb-2 not-prose" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
                
                <div className="not-prose">
                    <h3 className="text-lg font-semibold text-content-primary mt-6 mb-2">
                        {language === 'de' ? 'Warum funktioniert der Sprachmodus nicht oder warum ist die Sprachqualität schlecht?' : 'Why does voice mode not work or why is the voice quality poor?'}
                    </h3>
                     <p className="text-content-secondary leading-relaxed">
                        {language === 'de' ? 'Der Sprachmodus stützt sich auf die integrierte Web Speech API Ihres Browsers. Unterstützung und Qualität können erheblich variieren:' : 'Voice mode relies on your browser’s built-in Web Speech API. Support and quality can vary significantly:'}
                    </p>
                    <div className="space-y-3 my-4">
                        <div className="bg-background-tertiary dark:bg-background-tertiary p-3 border border-border-primary dark:border-border-primary text-sm">
                            <p className="text-content-secondary"><strong>{language === 'de' ? 'Browser:' : 'Browser:'}</strong> {language === 'de' ? 'Chrome und Edge haben im Allgemeinen die beste Unterstützung. Firefox und Safari können Einschränkungen oder Stimmen von geringerer Qualität aufweisen.' : 'Chrome and Edge generally have the best support. Firefox and Safari may have limitations or lower quality voices.'}</p>
                        </div>
                        <div className="bg-background-tertiary dark:bg-background-tertiary p-3 border border-border-primary dark:border-border-primary text-sm">
                             <p className="text-content-secondary"><strong>{language === 'de' ? 'Betriebssystem:' : 'Operating System:'}</strong> {language === 'de' ? "Ihr Betriebssystem stellt die Stimmen bereit. Einige Betriebssysteme bieten 'Premium'- oder 'erweiterte' Stimmen an, die Sie in Ihren Systemeinstellungen (Barrierefreiheit/Lesen & Sprechen) herunterladen müssen." : "Your operating system provides the voices. Some operating systems offer 'premium' or 'enhanced' voices that you may need to download in your system settings (Accessibility/Speech)."}</p>
                        </div>
                    </div>
                     <p className="text-content-secondary leading-relaxed">
                        {language === 'de' ? 'Für die beste Erfahrung empfehlen wir die Verwendung eines modernen Chromium-basierten Browsers (wie Chrome oder Edge) auf einem Desktop-Betriebssystem.' : 'For the best experience, we recommend using a modern Chromium-based browser (like Chrome or Edge) on a desktop operating system.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FAQView;