const express = require("express");
const router = express.Router();
const formidableMiddleware = require("express-formidable");
const stripe = require("stripe")(process.env.STRIPE_API_SECRET);/* Indication du Clé privée */
router.use(formidableMiddleware());

// Import des models
const Offer = require("../models/Offer");

// Réception du token créer via l'API Stripe depuis le Frontend
router.post("/payment", async (req, res) => {
    try {
        console.log(req.fields);
        const offer = await Offer.findById(req.fields.productId).populate({
            path: "owner",
            select: "account.username account.phone",
        });

        if (offer) {
            if (Number(req.fields.amount) - Number(offer.product_price) >= 3) {
                // on envoie le token a Stripe avec le montant pour créer la transaction
                const { status } = await stripe.charges.create({
                    amount: (req.fields.amount * 100).toFixed(0),
                    currency: "eur",
                    description: `Paiement vinted pour : ${req.fields.title}`,
                    source: req.fields.token,
                });
                // Le paiement a fonctionné
                // TODO : on peut mettre à jour la base de données

                // Renvoi d'une réponse au client pour afficher un message de statut
                res.json({ status });
            }
            else {
                console.log("Wrong price");
                res.status(409).json({ error: "Wrong price" });
            }           
        }
        else {
            console.log("Product non found");
            res.status(409).json({ error: "Product non found" });
        }
        
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;