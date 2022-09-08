import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      rating: {
         type: String,
         required: true,
      },
      comment: {
         type: String,
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'User',
      },
   },
   {
      timestamps: true,
   }
);

const productSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      productImage: {
         type: String,
         required: true,
         default:
            'https://thumbs.dreamstime.com/b/simple-vector-red-scratch-rubber-stamp-sample-transparent-effect-background-155834864.jpg',
      },
      productImageId: {
         type: String,
      },
      sellerId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
         ref: 'User',
      },
      description: {
         type: String,
         default: 'There is no description for this product!',
      },
      price: {
         type: Number,
         required: true,
         default: '0',
      },
      discountPrice: {
         type: Number,
         default: '0',
      },
      currentDiscount: {
         type: Number,
         default: 0,
      },
      rating: {
         type: Number,
         required: true,
         default: 0,
      },
      numReviews: {
         type: Number,
         required: true,
         default: 0,
      },
      brand: {
         type: String,
         default: 'S-Shop',
      },
      category: {
         type: String,
         default: 'all',
      },
      reviews: [reviewSchema],
   },
   {
      timestamps: true,
   }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
