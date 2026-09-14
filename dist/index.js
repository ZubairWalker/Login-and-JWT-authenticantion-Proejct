import express from 'express';
import connectDB from './config/database.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
const app = express();
app.use(express.json({ limit: '10kb' }));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ message: 'Welcome to Login and JWT Authentication' }));
app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/admin', adminRouter);
app.use(errorHandler);
async function startServer() {
    await connectDB();
    app.listen(env.port, () => console.log(`Server is running on port ${env.port}`));
}
startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exitCode = 1;
});
export { app };
//# sourceMappingURL=index.js.map