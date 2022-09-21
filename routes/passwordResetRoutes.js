import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { MAIL_JET_API_KEY, MAIL_JET_SECRET_KEY } from '../config/keys.js';
import MailJet from 'node-mailjet';
const mailjet = MailJet.apiConnect(
   `${MAIL_JET_API_KEY}`,
   `${MAIL_JET_SECRET_KEY}`
);

import User from '../model/userModel.js';
import Token from '../model/tokenModel.js';

const router = express.Router();

// Get email address in which password reset link would be sent to
// POST @/api/password-reset
// Public
router.post('/', async (req, res) => {
   try {
      const { email } = req.body;
      if (!email)
         return res.status(409).json({ msg: 'Please enter your email!' });

      const user = await User.findOne({ email });

      if (!user)
         return res.status(409).json({
            msg: 'Seller with the given email does not exist! Please register now!',
         });

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
         token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex'),
         }).save();

         const url = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;

         const request = mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
               {
                  From: {
                     Email: 'adelaetomiwa6@gmail.com',
                     Name: 'S-Shop',
                  },
                  To: [
                     {
                        Email: `${email}`,
                        Name: `${user.firstName}`,
                     },
                  ],
                  Subject: 'Reset your password',
                  TextPart: `Your password reset link is: ${url}`,
                  HTMLPart: `
                  <div
                     style="text-align: center;
                     font-weight: lighter;
                     font-family: Arial, Helvetica, sans-serif;
                     line-height: 1.5;
                     background: #6c757d;
                     color: #000000;
                     padding: 2rem 1rem;"
                  >
                     <div
                        style="background-color: #ffffff;
                        margin: auto;
                        width: 70%;
                        padding: 1rem 2rem;
                        text-align: left;"
         
                     >
                        <h1
                        style="color: #71ce71;"
                        >S-Shop</h1>
                        <p>Dear ${user.firstName},</p>
                        <p>We received a request for your S-Shop seller account. Click on the link below to reset your password</p>
                        <a
                           style="text-decoration: none;
                           background-color: #71ce71;
                           border: 2px solid #71ce71;
                           color: #ffffff;
                           padding: 0.5rem 1rem;
                           margin: 0.5rem 0;
                           display: inline-block;
                           font-size: 0.9rem;"
                           href=${url}
                        >
                           RESET PASSWORD
                        </a>
                        <p>If you ignore this message, your password won't be changed.</p>
                        <p>If you didn't initiate this process, you can safely ignore this message. We take your privacy very seriously at S-Shop. </p>
                        <br />
                        <footer>S-Shop seller</footer>
                     </div>
                  </div>
               `,
               },
            ],
         });

         request
            .then(() => {
               res.status(201).json({
                  msg: 'Password reset link sent to your email account! Check your span if not in your inbox',
               });
            })
            .catch((err) => {
               return err;
            });
      } else {
         res.status(409).json({
            msg: 'Password reset link already sent to your email!',
         });
      }
   } catch (err) {
      res.status(409).json({ msg: 'An error occured!' });
   }
});

// Verify link from email address to verify password reset link
// GET @/api/password-reset/:id/:token
// Public
router.get('/:id/:token', async (req, res) => {
   try {
      const user = await User.findOne({ _id: req.params.id });

      if (!user)
         return res.status(404).json({ msg: 'Invalid password reset link!' });

      const token = await Token.findOne({
         userId: user._id,
         token: req.params.token,
      });

      if (!token)
         return res.status(409).json({ msg: 'Invalid password reset link!' });

      res.status(200).json({ msg: 'Valid Up' });
   } catch (err) {
      res.status(409).json({ msg: 'An error occured!' });
   }
});

// Reset user password
// POST @/api/password-reset/:id/:token
// Public
router.post('/:id/:token', async (req, res) => {
   try {
      const { password } = req.body;

      if (!password)
         return res.status(409).json({ msg: 'Please enter new password!' });

      if (password.length <= 5)
         return res
            .status(409)
            .json({ msg: 'Password character must be at least 6 characters!' });

      const user = await User.findOne({ _id: req.params.id });
      if (!user)
         return res
            .status(409)
            .json({ msg: 'An error occured! Please try again!' });

      const token = await Token.findOne({
         userId: user._id,
         token: req.params.token,
      });

      if (!token)
         return res
            .status(409)
            .json({ msg: 'Invalid password reset link! Please try again!' });

      const salt = await bcrypt.genSalt(Number(14));
      const hashPassword = await bcrypt.hash(password, salt);

      user.password = hashPassword;

      await user.save();
      await token.remove();

      res.status(201).json({
         msg: 'Password reset successfully! Please login with your new password!',
      });
   } catch (err) {
      res.status(409).json({ msg: 'An error occured!' });
   }
});

export default router;
