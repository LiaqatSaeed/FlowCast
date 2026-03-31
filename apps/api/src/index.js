require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Routes
app.use('/api/channels', require('./routes/channels'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/analytics', require('./routes/analytics'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FlowCast API running on :${PORT}`));
