const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
app.use(formidable());

//connexion à la BDD
mongoose.connect(process.env.MONGODB_URI);

//Config de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

//import des routes
const userRouter = require("./routes/user");
const offerRouter = require("./routes/offer");

app.use(userRouter);
app.use(offerRouter);

app.all("*", (req, res) => {
    res.status(404).json({ message: "Page not found." });
});

app.listen(process.env.PORT, () => {
    console.log(`Server Started on port : ${process.env.PORT}`);
});
