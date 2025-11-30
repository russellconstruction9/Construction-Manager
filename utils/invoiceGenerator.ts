import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { Project, TimeLog } from '../types';
import Invoice from '../components/Invoice';
import { format } from 'date-fns';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface InvoiceData {
    project: Project;
    timeLogs: TimeLog[];
}

// Helper to dynamically load scripts and wait for them to be ready.
const scriptPromises = new Map<string, Promise<void>>();

const loadScript = (url: string): Promise<void> => {
    if (scriptPromises.has(url)) {
        return scriptPromises.get(url)!;
    }
    const promise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
    scriptPromises.set(url, promise);
    return promise;
}

const checkPdfLibraries = async (): Promise<void> => {
    // @ts-ignore
    if (window.jspdf && window.html2canvas) {
        return;
    }
    try {
        await Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
        ]);
        // @ts-ignore
        if (!window.jspdf || !window.html2canvas) {
             throw new Error("Scripts loaded but were not found on the window object.");
        }
    } catch (error) {
        console.error("PDF library loading failed:", error);
        throw new Error("PDF libraries did not load correctly. Please check your network connection and ad-blockers.");
    }
};


const getInvoiceSummary = async (data: InvoiceData): Promise<string> => {
    const { project, timeLogs } = data;

    const totalLaborCost = timeLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
    const materialsAndOtherCost = project.currentSpend - totalLaborCost;
    const totalHours = timeLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);

    const prompt = `
        You are an AI assistant for a construction company. Write a brief, polite, and professional note to the client for an invoice.
        The note should summarize the work completed and express appreciation for their business.
        Keep it concise, around 2-3 sentences. Format the output as a clean HTML paragraph (<p>). Do not include markdown or a title.

        **Project & Cost Details:**
        - Client/Project Name: ${project.name}
        - Total Amount Due: $${project.currentSpend.toFixed(2)}
        - Breakdown: $${totalLaborCost.toFixed(2)} in Labor (${totalHours.toFixed(2)} hours), $${materialsAndOtherCost.toFixed(2)} in Materials & Other Costs.

        Now, write the client-facing note.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
        });
        
        return response.text || '<p>Thank you for your business. Please find the cost breakdown attached.</p>';
    } catch (error) {
        console.error("Error calling Gemini API for invoice summary:", error);
        return "<p>Thank you for your business. If you have any questions about this invoice, please don't hesitate to reach out.</p>";
    }
}

export const generateInvoice = async (data: InvoiceData) => {
    const { project } = data;

    await checkPdfLibraries();
    
    const summary = await getInvoiceSummary(data);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    
    await new Promise<void>(resolve => {
        root.render(React.createElement(Invoice, { ...data, summary, onRendered: resolve }));
    });
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    // @ts-ignore
    const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    root.unmount();
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const filename = `Invoice_${project.name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
};