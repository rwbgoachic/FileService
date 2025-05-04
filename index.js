const express = require('express');
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');
const clamd = require('clamdjs');

const app = express();
const port = 3000;

// Initialize ClamAV client
const scanner = clamd.createScanner('127.0.0.1', 3310);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    clamav: {
      enabled: true,
      host: '127.0.0.1',
      port: 3310
    }
  });
});

// File conversion endpoint with virus scanning
app.post('/convert', express.raw({type: '*/*', limit: '10mb'}), async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Scan file for viruses first
    try {
      const scanResult = await scanner.scanBuffer(req.body);
      if (scanResult.isInfected) {
        return res.status(400).json({ error: 'Virus detected in file' });
      }
    } catch (scanError) {
      console.error('Virus scan failed:', scanError);
      return res.status(500).json({ error: 'File scanning failed' });
    }

    const { targetFormat } = req.query;
    
    if (req.headers['content-type'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && targetFormat === 'pdf') {
      // Excel to PDF conversion
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.body);
      
      const pdfDoc = await PDFDocument.create();
      // Add Excel content to PDF
      // Note: This is a simplified version. Real implementation would need more formatting logic
      
      res.json({ message: 'Conversion completed' });
    } else {
      res.status(400).json({ error: 'Unsupported conversion format' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error converting file' });
  }
});

// Reports endpoint
app.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // Example report generation
    if (type === 'payroll') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payroll Report');
      
      // Add headers
      worksheet.addRow(['Employee', 'Hours', 'Rate', 'Total']);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payroll-report.xlsx');
      
      // Send the workbook
      await workbook.xlsx.write(res);
    } else {
      res.status(400).json({ error: 'Unsupported report type' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});