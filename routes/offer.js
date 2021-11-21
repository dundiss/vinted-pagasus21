const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

// Import des models
const Offer = require("../models/Offer");
const User = require("../models/User");

// Import du middleware
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
    try {
        //console.log(req.fields);
        //console.log(req.user.account);
        const fields = req.fields;

        const newOffer = new Offer({
            product_name: fields.title,
            product_description: fields.description,
            product_price: fields.price,
            product_details: [{ brand: fields.brand }, { size: fields.size }, { condition: fields.condition }, { color: fields.color }, { city: fields.city }],
            product_image: { /*type: mongoose.Schema.Types.Mixed*/ },
            owner: req.user
        });

        const result = await cloudinary.uploader.upload(req.files.picture.path, ({
            folder: `/vinted/offers/${newOffer._id}`
        }));

        console.log(result);

        newOffer.product_image = result.secure_url;

        await newOffer.save();

        //console.log(newOffer);
        //res.json({ message: populatedNewOffer });
        res.json({
            message: {
                "_id": newOffer._id,
                "product_name": newOffer.product_name,
                "product_description": newOffer.product_description,
                "product_price": newOffer.product_price,
                "product_details": [
                    {
                        "MARQUE": newOffer.product_details[0].brand
                    },
                    {
                        "TAILLE": newOffer.product_details[1].size
                    },
                    {
                        "ÉTAT": newOffer.product_details[2].condition
                    },
                    {
                        "COULEUR": newOffer.product_details[3].color
                    },
                    {
                        "EMPLACEMENT": newOffer.product_details[4].city
                    }
                ],
                "owner": {
                    "account": {
                        "username": newOffer.owner.account.username,
                        "phone": newOffer.owner.account.phone,
                        "avatar": newOffer.owner.account.avatar
                    },
                    "_id": newOffer.owner._id
                },
                "product_image": newOffer.product_image
            }
        });
    } catch (error) {
        res.status(400).json(error.message);
    }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {

});

router.get("/offers", async (req, res) => {
    try {
        const { title, priceMin, priceMax, sort, page, limit } = req.query;
        const filterObj = {};
        console.log(req.query);
        if (title) {
            filterObj.product_name = new RegExp(title, "i");
        }

        if (priceMin) {
            filterObj.product_price = {
                $gte: Number(priceMin)
            }
        }

        if (priceMax) {
            if (filterObj.product_price) {
                filterObj.product_price.$lte = Number(priceMax);
            }
            else {
                filterObj.product_price = {
                    $lte: Number(priceMax)
                }
            }
        }

        const sortObject = {};
        if (sort) {
            let sortParamStr = req.query.sort;
            sortParamStr = sortParamStr.replace(new RegExp("price-", "i"), "");
            //console.log("str: " + sortParamStr);
            let sortParamValue = 1;
            const regex = new RegExp("desc", "i")
            if (regex.test(sortParamStr)) {
                sortParamValue = -1;
            }

            sortObject.product_price = sortParamValue
        }

        const count = await Offer.countDocuments(filterObj);

        let pageLimit = Number(limit);
        if (!pageLimit || pageLimit <= 0) {
            pageLimit = count;
        }

        let pageNum = Number(page);
        if (!pageNum || (pageNum < 1)) {
            pageNum = 0;
        } else {
            pageNum = pageNum - 1;
        }

        const offers = await Offer.find(filterObj).sort(sortObject).limit(pageLimit).skip(pageNum * pageLimit).populate({
            path: "owner",
            select: "account"
        });

        if (offers.length > 0) {

            res.json({ "count": count, "offers": offers });
        }
        else {
            res.status(409).json({ message: "No offer found" });
        }
    } catch (error) {
        res.status(400).json(error.message);
    }
});

router.get("/offer/:id", async (req, res) => {
    try {
        if (req.params.id) {
            res.json(await Offer.find({ _id: req.params.id }));
        }
        else {
            res.status(400).json({ message: "Bad request!" });
        }

    } catch (error) {
        res.status(400).json(error.message);
    }
});

module.exports = router;
