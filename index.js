const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const morgan = require("morgan");

const app = express();
//Cette ligne fait bénéficier de CORS à toutes les requêtes de notre serveur
app.use(cors());
app.use(formidable());
app.use(morgan("dev"));

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
const paymentRouter = require("./routes/payment");

app.use(userRouter);
app.use(offerRouter);
app.use(paymentRouter);

app.all("*", (req, res) => {
    res.status(404).json({ message: "Page not found." });
});

app.listen(process.env.PORT, () => {
    console.log(`Server Started on port : ${process.env.PORT}`);
});
