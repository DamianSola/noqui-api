import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import dotenv from 'dotenv';

import { config } from './config/environment';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { authRoutes } from './routes/auth.routes';
import { companyRouter } from './routes/business.routes';
import customerRoutes from './routes/customer.routes';
import productsRoutes from './routes/products.routes';
import inventoryRoutes from './routes/inventory.routes';
import stockMovementsRoutes from './routes/stockMovements.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import expensesRoutes from './routes/expenses.routes';
import suppliersRoutes from './routes/suppliers.routes';
import supplyOrdersRoutes from './routes/supplyOrders.routes';
import tagsRoutes from './routes/tags.routes';
import calendarRoutes from './routes/calendar.routes';
import notificationsRoutes from './routes/notifications.routes';
import reportsRoutes from './routes/reports.routes';
import auditLogsRoutes from './routes/auditLogs.routes';


dotenv.config()

const app = express();

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/business`, companyRouter);
app.use(`${config.apiPrefix}/customers`, customerRoutes);
app.use(`${config.apiPrefix}/products`, productsRoutes);
app.use(`${config.apiPrefix}/inventory`, inventoryRoutes);
app.use(`${config.apiPrefix}/stock-movements`, stockMovementsRoutes);
app.use(`${config.apiPrefix}/orders`, ordersRoutes);
app.use(`${config.apiPrefix}/payments`, paymentsRoutes);
app.use(`${config.apiPrefix}/expenses`, expensesRoutes);
app.use(`${config.apiPrefix}/suppliers`, suppliersRoutes);
app.use(`${config.apiPrefix}/supply-orders`, supplyOrdersRoutes);
app.use(`${config.apiPrefix}/tags`, tagsRoutes);
app.use(`${config.apiPrefix}/calendar`, calendarRoutes);
app.use(`${config.apiPrefix}/notifications`, notificationsRoutes);
app.use(`${config.apiPrefix}/reports`, reportsRoutes);
app.use(`${config.apiPrefix}/audit-logs`, auditLogsRoutes);


// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${config.nodeEnv} mode
📍 Port: ${PORT}
📅 Started at: ${new Date().toISOString()}
🔗 Health check: http://localhost:${PORT}/health
  `);
});

export default app;