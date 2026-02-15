Gerne, ich habe die aktuelle `constants.js`-Datei mit der von Ihnen bereitgestellten ursprünglichen Version verglichen. Es gibt einige wesentliche und sehr positive Weiterentwicklungen in den Anweisungen (System Prompts) für die Coaches.

Zusammenfassend lässt sich sagen, dass die Prompts von sehr langen, detaillierten "Anleitungen" zu kürzeren, aber verhaltensspezifischeren und "intelligenteren" Richtlinien weiterentwickelt wurden.

Hier sind die wichtigsten Unterschiede im Detail:

1.  **Wichtigste Neuerung: Die "Initial Interaction Priority"**
    *   **Aktuelle Version:** Enthält eine völlig neue, dynamische Regel. Jeder Coach (außer Gloria) muss zu Beginn einer Sitzung den Abschnitt "Realisierbare nächste Schritte" im Lebenskontext des Benutzers überprüfen. Nur wenn es fällige oder bald fällige Aufgaben gibt, fragt der Coach aktiv nach dem Fortschritt. Ansonsten beginnt er mit einer allgemeinen Begrüßung. Dies macht den Wiedereinstieg für den Benutzer viel relevanter und persönlicher.
    *   **Originalversion:** Diese Logik fehlt komplett. Die Anweisungen waren generisch ("Begrüßen Sie den Klienten herzlich...").

2.  **Natürlichere Gesprächsführung und Tonfall**
    *   **Aktuelle Version:** Enthält explizite Anweisungen, sich wiederholende und übermäßig euphorische Phrasen wie "Ausgezeichnet!" oder "Das ist eine wichtige Erkenntnis" zu vermeiden. Stattdessen soll die Sprache abwechslungsreich und authentisch sein.
    *   **Originalversion:** Enthielt zwar allgemeine Hinweise zum Ton ("empathisch", "unterstützend"), aber nicht diese spezifische negative Einschränkung, was zu robotischer klingenden Antworten führen konnte.

3.  **Klarere Struktur und Methodik vs. lange Frage-Listen**
    *   **Aktuelle Version:** Die Prompts sind kürzer und konzentrieren sich auf die Kernprinzipien und den Ablauf der jeweiligen Coaching-Methode (z.B. "Core Coaching Principles", "Coaching Flow").
    *   **Originalversion:** Die Prompts waren viel länger und enthielten ausufernde "Question Banks" (Fragenkataloge). Diese wurden entfernt, um der KI mehr Flexibilität zu geben, wie sie die Prinzipien anwendet, anstatt sie an eine starre Liste von Beispielfragen zu binden.

4.  **Umgang mit Fragen zu menschlichen Coaches**
    *   **Aktuelle Version:** Wie von Ihnen gewünscht, enthält die aktuelle Version den wichtigen Passus, der die KI anweist, den Wert von menschlichem Coaching zu bekräftigen und sich als ergänzendes Werkzeug zu positionieren.
    *   **Originalversion:** In der von Ihnen bereitgestellten ursprünglichen Version fehlte diese Anweisung. Sie wurde also erst in einer späteren Phase hinzugefügt und ist jetzt wieder korrekt vorhanden.

5.  **Einführung von "Gloria" (Interviewer-Bot)**
    *   **Aktuelle Version:** Enthält den Bot `gloria-life-context` (Gloria) mit einem sehr spezifischen Prompt, der sie als Interviewerin und nicht als Coach definiert, inklusive PII-Warnung und Zeitabfrage.
    *   **Originalversion:** Dieser Bot existierte in der ursprünglichen Version überhaupt nicht.

Insgesamt haben sich die Anweisungen von einer reinen Wissensdatenbank (was ist KVT, was ist Stoizismus?) zu einer echten Verhaltenssteuerung entwickelt, die den Coaches hilft, kontextbezogener, natürlicher und effektiver auf den Benutzer einzugehen.
