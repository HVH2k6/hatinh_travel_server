const userRouter = require('./api/userRouter');
const categoryRouter = require('./api/categoryRouter');
const typeRouter = require('./api/typeRouter');
const attractionsRouter = require('./api/attractionsRouter');
const addressRouter = require('./api/addressApi');
const cloudRouter = require('./api/cloudRouter');
const otpRouter = require('./api/otpRouter');
const shopRouter = require('./api/shopRouter');
const sellerApplicationRouter = require('./api/sellerapplicationRouter');
const productRouter = require('./api/productRouter');
const unitRouter = require('./api/unitApi');
const foodRouter = require('./api/foodApiRouter');
const artRouter = require('./api/artRouter');
const reviewRouter = require('./api/reviewRouter');z
const homeRouter = require('./api/homeRouter');
module.exports = (app) => {
  app.use('/', homeRouter);
  app.use('/api/user', userRouter);
  app.use('/api/category', categoryRouter);
  app.use('/api/type', typeRouter);
  app.use('/api/attractions', attractionsRouter);
  app.use('/api/address', addressRouter);
  app.use('/api/cloud', cloudRouter);
  app.use('/api/otp', otpRouter);
  app.use('/api/shop', shopRouter);
  app.use('/api/sellerapplication', sellerApplicationRouter);
  app.use('/api/product', productRouter);
  app.use('/api/unit', unitRouter);
  app.use('/api/food', foodRouter);

  app.use('/api/art', artRouter);

  app.use('/api/review', reviewRouter);
};
