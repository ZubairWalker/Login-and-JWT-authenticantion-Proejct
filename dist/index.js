import express from 'express';
import {} from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());
// important Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});
app.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server is running smoothly on port ${PORT}`);
});
//# sourceMappingURL=index.js.map