const userRouter = require('./api/userRouter');
const categoryRouter = require('./api/categoryRouter');
const typeRouter = require('./api/typeRouter');
const attractionsRouter = require('./api/attractionsRouter');
const addressRouter = require('./api/addressApi');
const cloudRouter = require('./api/cloudRouter');
const otpRouter = require('./api/otpRouter');
const sellerApplicationRouter = require('./api/sellerapplicationRouter');
module.exports = (app) => {
  app.use('/api/user', userRouter);
  app.use('/api/category', categoryRouter);
  app.use('/api/type', typeRouter);
  app.use('/api/attractions', attractionsRouter);
  app.use('/api/address', addressRouter);
  app.use('/api/cloud', cloudRouter);
  app.use('/api/otp', otpRouter);
  app.use('/api/sellerapplication', sellerApplicationRouter);
};
