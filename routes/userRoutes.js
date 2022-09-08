import express from 'express';
import bcrypt from 'bcryptjs';
import cloudinary from '../middeware/cloudinary.js';
import { auth } from '../middeware/auth.js';

const router = express.Router();

import User from '../model/userModel.js';
import generateToken from '../utils/generateToken.js';

// Create a new User
// POST @/api/users
// Public
router.post('/', async (req, res) => {
   try {
      const {
         firstName,
         lastName,
         email,
         phoneNumber,
         brandName,
         brandLogo,
         accountNumber,
         bankName,
         nameOfAccountHolder,
         retypePassword,
         password,
      } = req.body;

      if (
         !firstName ||
         !lastName ||
         !email ||
         !phoneNumber ||
         !accountNumber ||
         !bankName ||
         !nameOfAccountHolder ||
         !password ||
         !retypePassword
      )
         return res
            .status(400)
            .json({ msg: 'Please enter all asterisked fields!' });

      if (phoneNumber.length !== 11 || phoneNumber.charAt(0) !== '0')
         return res
            .status(409)
            .json({ msg: 'Please enter a valid phone number!' });

      if (accountNumber.length !== 10)
         return res
            .status(409)
            .json({ msg: 'Please enter a vaild account number!' });

      if (password !== retypePassword)
         return res.status(409).json({ msg: 'Password does not match!' });

      if (password.length <= 5)
         return res.status(409).json({
            msg: 'Password should be at least 6 character long!',
         });

      //   Check is user exist
      const userExist = await User.findOne({ email });

      if (userExist)
         return res.status(409).json({
            msg: 'user already exist! Please login to your S-Shop seller account!',
         });

      const uploadResponse = await cloudinary.v2.uploader.upload(brandLogo, {
         upload_preset: 'sshop',
      });

      const newUser = new User({
         firstName,
         lastName,
         email,
         phoneNumber,
         brandName,
         accountNumber,
         bankName,
         nameOfAccountHolder,
         password,
         retypePassword,
         brandLogo: uploadResponse.url,
         brandLogoId: uploadResponse.public_id,
      });

      // Hash password
      bcrypt.genSalt(14, (err, salt) => {
         bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            // Set new user's password to hash
            newUser.password = hash;

            // Save new user
            newUser.save().then((user) => {
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
         });
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Update user
// PUT /@api/users
// private
router.put('/', auth, async (req, res) => {
   try {
      const {
         firstName,
         lastName,
         phoneNumber,
         brandName,
         brandLogo,
         accountNumber,
         bankName,
         nameOfAccountHolder,
      } = req.body;

      const user = await User.findById(req.user.id);

      if (!user)
         return res
            .status(404)
            .json({ msg: 'Seller does not exist! An error occured!' });

      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phoneNumber = phoneNumber || user.phoneNumber;
      user.brandName = brandName || user.brandName;
      user.accountNumber = accountNumber || user.accountNumber;
      user.bankName = bankName || user.bankName;
      user.nameOfAccountHolder =
         nameOfAccountHolder || user.nameOfAccountHolder;

      if (phoneNumber.length !== 11 || phoneNumber.charAt(0) !== '0')
         return res
            .status(409)
            .json({ msg: 'Please enter a valid phone number!' });

      if (accountNumber.length !== 10)
         return res
            .status(409)
            .json({ msg: 'Please enter a vaild account number!' });

      const uploadResponse = await cloudinary.v2.uploader.upload(brandLogo, {
         upload_preset: 'sshop',
      });

      await cloudinary.uploader.destroy(
         user.brandLogoId,
         { invalidate: true },
         {
            upload_preset: 'sshop',
         }
      );

      user.brandLogo = uploadResponse.url || user.brandLogo;
      user.brandLogoId = uploadResponse.public_id || user.brandLogoId;

      const savedUser = await user.save();

      const token = generateToken(savedUser);

      res.status(201).json({
         token,
         user: {
            id: savedUser._id,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            phoneNumber: savedUser.phoneNumber,
            isAdmin: savedUser.isAdmin,
            brandName: savedUser.brandName,
            brandLogo: savedUser.brandLogo,
            brandLogoId: savedUser.brandLogoId,
            accountNumber: savedUser.accountNumber,
            bankName: savedUser.bankName,
            nameOfAccountHolder: savedUser.nameOfAccountHolder,
         },
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'An error occured!' });
   }
});

// Update user login details
// PUT /@api/users/passwords
// Private
router.put('/passwords', auth, async (req, res) => {
   try {
      const { newPassword, currentPassword, retypePassword } = req.body;

      const user = await User.findById(req.user.id);

      if (!user)
         return res
            .status(404)
            .json({ msg: 'Seller does not exist! An error occured!' });

      if (!currentPassword || !newPassword || !retypePassword)
         return res.status(409).json({ msg: 'Please enter all fields!' });

      bcrypt.compare(currentPassword, user.password).then((isMatch) => {
         if (!isMatch)
            return res.status(409).json({ msg: 'Invalid current password!' });

         if (newPassword.length <= 5)
            return res.status(400).json({
               msg: 'New password should be at least 6 character long!',
            });

         if (newPassword !== retypePassword)
            return res.status(409).json({ msg: 'Passwords do not match!' });

         user.password = newPassword;

         //   Hash user password
         bcrypt.genSalt(14, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
               if (err) throw err;

               // Setting newUser password to the hash password
               user.password = hash;

               // Save new user to DB
               user
                  .save()
                  .then((savedUser) => {
                     // Generate JWT Tokem
                     const token = generateToken(savedUser);
                     res.status(201).json({
                        token,
                        user: {
                           id: savedUser._id,
                           firstName: savedUser.firstName,
                           lastName: savedUser.lastName,
                           email: savedUser.email,
                           phoneNumber: savedUser.phoneNumber,
                           isAdmin: savedUser.isAdmin,
                           brandName: savedUser.brandName,
                           brandLogo: savedUser.brandLogo,
                           brandLogoId: savedUser.brandLogoId,
                           accountNumber: savedUser.accountNumber,
                           bankName: savedUser.bankName,
                           nameOfAccountHolder: savedUser.nameOfAccountHolder,
                        },
                     });
                  })
                  .catch((err) =>
                     res
                        .status(500)
                        .json({ msg: 'An error occured! Please try again!' })
                  );
            });
         });
      });
   } catch (err) {
      console.log(err);
      res.status(500).json({ msg: 'An error occured!' });
   }
});

export default router;
