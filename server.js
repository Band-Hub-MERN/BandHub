const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

const uploadRoot = path.join(__dirname, 'uploads');
const eventUploadDir = path.join(uploadRoot, 'events');
fs.mkdirSync(eventUploadDir, { recursive: true });
app.use('/api/uploads', express.static(uploadRoot));

/* MongoDB connection stuff. You should have your own connection string in a real app, 
 * and you should not commit that string to GitHub. 
 * I am doing it here for simplicity, 
 * but in a real app you would want to use environment variables or some other method to 
 * keep that information private.
 */
const url = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'BandHub';
const api = require('./api.js');
mongoose.connect(url, { dbName })
  .then(() => {
    console.log(`MongoDB connected (${dbName})`);
  })
  .catch((err) => {
    console.log('MongoDB connection failed. Running in temporary local mode.');
    console.log(err.message);
  });

api.setApp(app);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); // start Node + Express server
