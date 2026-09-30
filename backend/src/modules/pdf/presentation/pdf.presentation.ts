import type { Express } from 'express';
import pdfRouter from './routes/pdf.routes';

const pdf = {
  addRoutes: (app: Express) => {
    app.use('/api/pdf', pdfRouter);
  },
};

export default pdf;
