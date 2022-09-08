import mongoose from 'mongoose';

const db = () => {
   mongoose
      .connect(process.env.MONGO_URI)
      .then((conn) =>
         console.log(`MongoDB connected with :${conn.connection.host}`)
      )
      .catch((err) => console.log(`An error occured...`));
};

export default db;
