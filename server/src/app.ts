import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// 1. Health check
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// 2. API routes
app.use('/api', routes);

// 3. Carpeta de archivos subidos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 4. Servir archivos estáticos del frontend compilado (Vite build)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// 5. Manejar cualquier otra ruta GET devolviendo el index.html de React
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 6. 404 handler (Solo para rutas POST/PUT/DELETE inexistentes o endpoints de la API que fallaron)
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Recurso no encontrado' });
});

// 7. Error handler global
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Error no controlado');
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;