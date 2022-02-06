const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//import des models
const User = require("../models/User");

const generateSalt = (length = 16) => {
    //console.log(length);
    return uid2(length);
};

//Fonction de génération d'un Hash
const generateHash = (salt, password) => {
    return SHA256(password + salt).toString(encBase64);
};

// Fonction de génération d'un token
const generateToken = (length = 16) => {
    return uid2(length);
};

//console.log("salt " + generateSalt(32));

//Fonction de sauvegarde d'un utilisateur dans la BDD
const saveUser = async (username, email, phone, salt, hash, token) => {
    const newUser = await new User({
        "email": email,
        "account": {
            "username": username,
            "phone": phone,
            "avatar": {}
        },
        "token": token,
        "hash": hash,
        "salt": salt,
    });

    await newUser.save();
    //console.log("new User : " + newUser);
    return {
        message: {
            "_id": newUser._id,
            "token": newUser.token,
            "account": {
                "username": newUser.account.username,
                "phone": newUser.account.phone
            }
        }
    };
};

// Fonction de recherche d'un utilisateur dans la BDD à l'aide son adresse mail
const getUser = async (email) => {
    const foundUser = await User.findOne({ "email": email });
    return foundUser;
};

//Signup
router.post("/user/signup", async (req, res) => {
    try {
        const email = req.fields.email;
        const foundUser = await getUser(email);
        //console.log(foundUser);
        if (!foundUser) {
            const password = req.fields.password;
            const username = req.fields.username;
            const phone = req.fields.phone;

            if (username && password) {

                const salt = generateSalt(16);

                const hash = generateHash(password + salt);

                const token = generateToken(16);

                const newUser = await saveUser(username, email, phone, salt, hash, token);

                res.json({ data: newUser });
            }
            else {
                res.status(409).json({ error: { message: "Bad request" } });
            }
        }
        else {
            res.status(409).json({ error: { message: "email already registered!" } });
        }

    } catch (error) {
        res.status(409).json({ error: { message: error.message } });
    }

});

//Login
router.post("/user/login", async (req, res) => {
    try {
        const user = await getUser(req.fields.email);
        if (user) {
            hash = generateHash(req.fields.password + user.salt);
            if (user.hash === hash) {
                res.json({
                    data: {
                        "_id": user._id,
                        "token": user.token,
                        "account": {
                            "username": user.account.username,
                            "phone": user.account.phone
                        }
                    }
                });
            }
            else {
                res.status(409).json({ message: "acces unauthorized !" });
            }
        }
        else {
            res.status(409).json({ message: "User not registered!" });
        }
    } catch (error) {
        res.status(409).json(error.message);
    }
});

//Export du module
module.exports = router;

