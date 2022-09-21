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
   
      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Get a product
// GET @/api/products/:id
// Private
router.get('/:id', auth, async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product)
         return res
            .status(404)
            .json({ msg: 'Product not found! An error occured!' });

      res.status(200).json(product);
   } catch (err) {
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

      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Update a product as a seller
// PUT @/api/seller/products
// Private
router.put('/:id', auth, async (req, res) => {
   try {
      const { name, price, description, brand, productImage, category } =
         req.body;

      const product = await Product.findById(req.params.id);

      if (!product)
         return res
            .status(404)
            .json({ msg: 'Product not found! An error occured!' });

      if (!name || !price)
         return res
            .status(400)
            .json({ msg: 'Please fill the asterisked fields!' });

      const uploadResponse = await cloudinary.v2.uploader.upload(productImage, {
         upload_preset: 'sshop',
      });

      await cloudinary.uploader.destroy(
         product.productImageId,
         { invalidate: true },
         {
            upload_preset: 'sshop',
         }
      );

      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.sellerId = req.user.id._id;
      product.productImage = uploadResponse.url;
      product.productImageId = uploadResponse.public_id;

      const updatedProduct = await product.save();

      res.status(200).json(updatedProduct);
   } catch (err) {
 
      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Delete a product by id
// DELETE @/api/seller/products/:id
// Private
router.delete('/:id', auth, async (req, res) => {
   try {
      const id = req.params.id;

      const sellerId = req.user.id._id;

      const product = await Product.findById(id);

      if (!product)
         return res
            .status(400)
            .json({ msg: 'Product not found! An error occured!' });

      if (sellerId !== product.sellerId.toString())
         return res
            .status(400)
            .json({ msg: 'An error occured! Autorization denied!' });

      if (product.productImageId) {
         await cloudinary.uploader.destroy(
            product.productImageId,
            { invalidate: true },
            {
               upload_preset: 'sshop',
            }
         );

         await product.remove();

         res.status(200).json({ success: true });
      } else {
         await product.remove();

         res.status(200).json({ success: true });
      }
   } catch (err) {
    
      res.status(500).json({ msg: 'An error occured! Product not deleted!' });
   }
});

export default router;
