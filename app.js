const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();
const userRoute = require('./routes/userRoute');
const videoRoute = require('./routes/videoRoute');
const commentRoute = require('./routes/commentRoute');
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
const cors = require('cors');

const connectWithDatabase=async()=>{
    try {
        const res=await mongoose.connect(process.env.MONGO_URI);
        console.log("DB CONNECTED");
    } catch (error) {
        console.log("DB NOT CONNECTED", error);
    }
}
connectWithDatabase();
app.use(cors())
//app.use(express.json());
app.use(bodyParser.json())


app.use(fileupload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use('/user', userRoute);
app.use('/video',videoRoute)
app.use('/comment', commentRoute);

module.exports = app;
