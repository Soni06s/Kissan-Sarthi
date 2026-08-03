import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { applySecurityMiddleware } from './middlewares/security.middleware.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

applySecurityMiddleware(app);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
