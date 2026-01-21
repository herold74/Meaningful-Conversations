import html2pdf from 'html2pdf.js';

/**
 * Generates a PDF from HTML content and triggers download
 * Uses html2pdf.js for consistent quality across all browsers
 * @param htmlContent - The HTML string to convert to PDF
 * @param filename - The desired filename (without extension)
 */
export async function generatePDF(htmlContent: string, filename: string): Promise<void> {
  // Use html2pdf.js for all browsers
  const options = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      foreignObjectRendering: false
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const
    }
  };

  try {
    await html2pdf().set(options).from(htmlContent).save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generates filename for personality survey PDF
 * @param testType - 'RIEMANN' or 'BIG5'
 * @param language - 'de' or 'en'
 */
export function generateSurveyPdfFilename(testType: string, language: 'de' | 'en'): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const type = testType === 'RIEMANN' ? 'riemann' : 'big5';
  const label = language === 'de' ? 'persoenlichkeitsanalyse' : 'personality-analysis';
  
  return `${label}-${type}-${dateStr}`;
}

