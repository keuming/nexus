/**
 * PDF Export Utility for Manifests
 * Generates professional PDF documents with company logo and formatting
 */

import html2pdf from "html2pdf.js";

export interface ManifestPDFData {
  company: {
    name: string;
    logo?: string;
  };
  departure: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    departureTime: string;
    driverName?: string;
    busNumber?: string;
  };
  passengers: Array<{
    seatNumber: number;
    lastName: string;
    firstName: string;
    idType: string;
    idNumber: string;
    nationality?: string;
    dropOffCity?: string;
    boardingStatus?: string;
  }>;
  generatedAt: string;
}

export function generateManifestPDF(data: ManifestPDFData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Manifeste de Passagers</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 210mm;
          height: 297mm;
          padding: 20px;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 3px solid #E8751A;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-logo {
          max-width: 80px;
          height: auto;
          margin-right: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #E8751A;
          margin-bottom: 5px;
        }
        
        .document-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          text-align: center;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .trip-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
          padding: 15px;
          background-color: #f8f8f8;
          border-radius: 5px;
        }
        
        .trip-info-item {
          display: flex;
          flex-direction: column;
        }
        
        .trip-info-label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        
        .trip-info-value {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .trip-route {
          font-size: 16px;
          font-weight: bold;
          color: #E8751A;
        }
        
        .summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .summary-card {
          padding: 12px;
          background-color: #f0f0f0;
          border-left: 4px solid #E8751A;
          border-radius: 3px;
        }
        
        .summary-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        
        thead {
          background-color: #E8751A;
          color: white;
        }
        
        th {
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #ddd;
        }
        
        td {
          padding: 8px 10px;
          border: 1px solid #ddd;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tbody tr:hover {
          background-color: #f0f0f0;
        }
        
        .seat-number {
          font-weight: bold;
          color: #E8751A;
          text-align: center;
          font-size: 12px;
        }
        
        .boarded-yes {
          color: #22c55e;
          font-weight: 600;
        }
        
        .boarded-no {
          color: #ef4444;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        
        .footer-item {
          margin-bottom: 5px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
          padding-top: 20px;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          padding-top: 5px;
          text-align: center;
          font-size: 10px;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 100%;
            height: auto;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-info">
            <div class="company-name">${data.company.name}</div>
            <div style="font-size: 12px; color: #666;">Manifeste de Passagers</div>
          </div>
        </div>
        
        <div class="document-title">Manifeste de Passagers</div>
        
        <div class="trip-info">
          <div class="trip-info-item">
            <span class="trip-info-label">Trajet</span>
            <span class="trip-info-value trip-route">${data.departure.departureCity} → ${data.departure.arrivalCity}</span>
          </div>
          <div class="trip-info-item">
            <span class="trip-info-label">Date de Départ</span>
            <span class="trip-info-value">${new Date(data.departure.departureDate).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div class="trip-info-item">
            <span class="trip-info-label">Heure de Départ</span>
            <span class="trip-info-value">${data.departure.departureTime}</span>
          </div>
          <div class="trip-info-item">
            <span class="trip-info-label">Chauffeur</span>
            <span class="trip-info-value">${data.departure.driverName || "—"}</span>
          </div>
          ${data.departure.busNumber ? `
          <div class="trip-info-item">
            <span class="trip-info-label">Numéro Bus</span>
            <span class="trip-info-value">${data.departure.busNumber}</span>
          </div>
          ` : ""}
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Total Passagers</div>
            <div class="summary-value">${data.passengers.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Embarqués</div>
            <div class="summary-value">${data.passengers.filter((p) => p.boardingStatus === "embarque").length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Non Embarqués</div>
            <div class="summary-value">${data.passengers.filter((p) => p.boardingStatus !== "embarque").length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">% Embarquement</div>
            <div class="summary-value">${Math.round(
              (data.passengers.filter((p) => p.boardingStatus === "embarque").length / data.passengers.length) * 100
            )}%</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Siège</th>
              <th style="width: 15%;">Nom</th>
              <th style="width: 15%;">Prénom</th>
              <th style="width: 10%;">Type ID</th>
              <th style="width: 15%;">N° ID</th>
              <th style="width: 12%;">Nationalité</th>
              <th style="width: 15%;">Destination</th>
              <th style="width: 10%;">Embarqué</th>
            </tr>
          </thead>
          <tbody>
            ${data.passengers
              .map(
                (p) => `
              <tr>
                <td class="seat-number">${p.seatNumber}</td>
                <td>${p.lastName}</td>
                <td>${p.firstName}</td>
                <td>${p.idType}</td>
                <td>${p.idNumber}</td>
                <td>${p.nationality || "—"}</td>
                <td>${p.dropOffCity || "—"}</td>
                <td class="${p.boardingStatus === "embarque" ? "boarded-yes" : "boarded-no"}">
                  ${p.boardingStatus === "embarque" ? "✓ OUI" : "✗ NON"}
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="footer">
          <div class="footer-item">Généré le: ${new Date(data.generatedAt).toLocaleString("fr-FR")}</div>
          <div class="footer-item">Total Passagers: ${data.passengers.length}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-line">
            <strong>Chauffeur</strong>
          </div>
          <div class="signature-line">
            <strong>Chef de Station</strong>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const element = document.createElement("div");
  element.innerHTML = html;

  const opt = {
    margin: 10,
    filename: `manifeste-${data.departure.departureCity}-${new Date(data.departure.departureDate).toISOString().split("T")[0]}.pdf`,
    image: { type: "png" as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait" as const, unit: "mm", format: "a4" },
  };

  html2pdf().set(opt).from(element).save();
}
