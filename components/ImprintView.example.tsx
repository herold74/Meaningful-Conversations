import React from 'react';
import { useLocalization } from '../context/LocalizationContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ImprintViewProps {
    onBack?: () => void;
}

const de_markdown = `Angaben gemäß § 5 ECG (E-Commerce-Gesetz), § 25 MedienG (Mediengesetz) und Art. 13 DSGVO

## Medieninhaber und Diensteanbieter

**Max Mustermann, MSc**  
Lebens- und Sozialberatung  
Musterstrasse 123  
1010 Wien  
Österreich

Gewerbe: Lebens- und Sozialberatung  
Berufsbezeichnung: Lebens- und Sozialberater  
Aufsichtsbehörde: Magistrat der Stadt Wien  
Gewerbeland: Österreich

## Kontakt

**E-Mail:** example@example.com  
**Telefon:** +43 123 4567890  
**Website:** www.example.com

---

## Umsatzsteuer

Als Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet.

---

## Haftungsausschluss

### Haftung für Inhalte

Die Inhalte dieser Webseite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 16 ECG für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich. Nach § 18 ECG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

### Haftung für Links

Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

### Urheberrecht

Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.

---

## Hinweis zur KI-Nutzung

Diese Anwendung nutzt künstliche Intelligenz (Google Gemini API) zur Bereitstellung von Coaching-Funktionen. Die KI-generierten Antworten ersetzen keine professionelle psychologische oder medizinische Beratung. Bei ernsthaften psychischen Problemen wenden Sie sich bitte an qualifizierte Fachkräfte.

---

## EU-Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:  
**https://ec.europa.eu/consumers/odr**

Unsere E-Mail-Adresse finden Sie oben im Impressum.`;

const en_markdown = `Information in accordance with § 5 ECG (Austrian E-Commerce Act), § 25 MedienG (Austrian Media Act) and Art. 13 GDPR

## Media Owner and Service Provider

**Max Mustermann, MSc**  
Life and Social Counseling  
Musterstrasse 123  
1010 Vienna  
Austria

Business: Life and Social Counseling  
Professional Title: Life and Social Counselor  
Supervisory Authority: City of Vienna Magistrate  
Country of Business: Austria

## Contact

**Email:** example@example.com  
**Phone:** +43 123 4567890  
**Website:** www.example.com

---

## VAT

As a small business owner according to § 6 para. 1 Z 27 UStG (Austrian VAT Act), no VAT is charged.

---

## Disclaimer

### Liability for Content

The contents of this website have been created with the greatest care. However, we cannot guarantee the accuracy, completeness, and timeliness of the content. As a service provider, we are responsible for our own content in accordance with § 16 ECG (Austrian E-Commerce Act) under general law. According to § 18 ECG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.

### Liability for Links

Our offer contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for this third-party content. The respective provider or operator of the pages is always responsible for the content of the linked pages.

### Copyright

The content and works created by the site operators on these pages are subject to Austrian copyright law. The reproduction, editing, distribution, and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.

---

## Notice Regarding AI Usage

This application uses artificial intelligence (Google Gemini API) to provide coaching functions. AI-generated responses do not replace professional psychological or medical advice. If you have serious mental health issues, please consult qualified professionals.

---

## EU Dispute Resolution

The European Commission provides a platform for online dispute resolution (ODR):  
**https://ec.europa.eu/consumers/odr**

You can find our email address in the imprint above.`;

const ImprintView: React.FC<ImprintViewProps> = ({ onBack }) => {
    const { t, language } = useLocalization();
    const markdownContent = language === 'de' ? de_markdown : en_markdown;

    return (
        <div className="w-full max-w-4xl mx-auto p-8 space-y-6 bg-background-secondary dark:bg-transparent border border-border-secondary dark:border-border-primary my-10 animate-fadeIn rounded-lg shadow-lg">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-content-primary uppercase">{t('imprint_title')}</h1>
            </div>
            
            <div className="prose dark:prose-invert max-w-none text-content-secondary space-y-4 leading-relaxed">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-content-primary mt-8 mb-4 not-prose" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3 not-prose" {...props} />,
                    }}
                >
                    {markdownContent}
                </ReactMarkdown>
            </div>

            {onBack && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 text-base font-bold text-white bg-accent-primary uppercase hover:bg-accent-primary-hover disabled:bg-accent-disabled rounded-lg shadow-md"
                    >
                        {t('back')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImprintView;
