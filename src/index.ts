import express from 'express';
import { type Request,type Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express()

// using JSON middleware
app.use(express.json())

// important Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' })
})

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Hello World' })
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`server is running smoothly on port ${PORT}`)
})