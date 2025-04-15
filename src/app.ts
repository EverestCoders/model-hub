import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { serializeBigInt } from './utils/serialization'
import authRoutes from './routes/auth.routes';
import modelRoutes from './routes/model.routes';
import verificationRoutes from './routes/verification.routes';
import chatbotRoutes from './routes/chatbot.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    return originalJson.call(this, serializeBigInt(body));
  };
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/verification', verificationRoutes);


app.get('/', (req, res) => {
  res.send('FileCoin Model Hub API');
});

app.use('/api/chatbot', chatbotRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;