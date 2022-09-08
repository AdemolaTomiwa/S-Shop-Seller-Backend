import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
   const token = req.header('x-auth-token');

   // Check for token
   if (!token) {
      return res
         .status(401)
         .json({ msg: 'Authorization denied! Please login' });
   }

   try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      //   Add user from payload
      req.user = decoded;

      next();
   } catch (error) {
      res.status(400).json({ msg: 'Invalid token!' });
   }
};

export { auth };
