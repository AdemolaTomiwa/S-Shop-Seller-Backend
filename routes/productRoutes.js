import express from 'express';
import cloudinary from '../middeware/cloudinary.js';
import { auth } from '../middeware/auth.js';

const router = express.Router();

import Product from '../model/productModel.js';

// Get all products
// GET @/api/products
// Private
router.get('/', auth, async (req, res) => {
   try {
      const keyword = req.query.keyword
         ? {
              $or: [
                 {
                    name: {
                       $regex: req.query.keyword,
                       $options: 'i',
                    },
                 },
                 {
                    productImage: {
                       $regex: req.query.keyword,
                       $options: 'i',
                    },
                 },
                 {
                    description: {
                       $regex: req.query.keyword,
                       $options: 'i',
                    },
                 },
                 {
                    brand: {
                       $regex: req.query.keyword,
                       $options: 'i',
                    },
                 },
                 {
                    category: {
                       $regex: req.query.keyword,
                       $options: 'i',
                    },
                 },
              ],
           }
         : {};

      const sellerId = req.user.id._id;

      const products = await Product.find({
         ...keyword,
         sellerId: sellerId,
      }).sort({
         createdAt: -1,
      });

      res.status(200).json(products);
   } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Create a product
// POST @/api/products
// Private
router.post('/', auth, async (req, res) => {
   try {
      const sellerId = req.user.id._id;

      const { name, price, description, brand, category, productImage } =
         req.body;

      if (!name || !price)
         return res
            .status(409)
            .json({ msg: 'Please fill the asterisked fields!' });

      const uploadResponse = await cloudinary.v2.uploader.upload(productImage, {
         upload_preset: 'sshop',
      });

      const newProduct = new Product({
         name,
         price,
         productImage,
         category,
         brand,
         description,
         sellerId,
         productImage: uploadResponse.url,
         productImageId: uploadResponse.public_id,
      });

      // Save product to DB
      const product = await newProduct.save();

      res.status(201).json(product);
   } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'An error occured!' });
   }
});

export default router;
