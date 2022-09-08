import express from 'express';
import bcrypt from 'bcryptjs';
import cloudinary from '../middeware/cloudinary.js';

const router = express.Router();

import User from '../model/userModel.js';
import generateToken from '../utils/generateToken.js';

// Login a User
// POST @/api/auth
// Public
router.post('/', async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password)
         return res.status(409).json({ msg: 'Please enter all fields!' });

      const user = await User.findOne({ email });

      if (!user)
         return res.status(409).json({
            msg: 'Seller does not exist! Please create an account now!',
         });

      // Compare password
      bcrypt.compare(password, user.password).then((isMatch) => {
         if (!isMatch)
            return res.status(409).json({ msg: 'Invalid password!' });

         // Generate JWT Tokem
         const token = generateToken(user);

         res.status(201).json({
            token,
            user: {
               id: user._id,
               firstName: user.firstName,
               lastName: user.lastName,
               email: user.email,
               phoneNumber: user.phoneNumber,
               additionalPhoneNumber: user.additionalPhoneNumber,
               isAdmin: user.isAdmin,
               brandName: user.brandName,
               brandLogo: user.brandLogo,
               brandLogoId: user.brandLogoId,
               accountNumber: user.accountNumber,
               bankName: user.bankName,
               nameOfAccountHolder: user.nameOfAccountHolder,
            },
         });
      });
   } catch (err) {
      res.status(500).json({ msg: 'An error occured!' });
   }
});

export default router;
