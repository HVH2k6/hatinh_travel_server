const userRouter = require('./api/userRouter');
const categoryRouter = require('./api/categoryRouter');
const typeRouter = require('./api/typeRouter');
const attractionsRouter = require('./api/attractionsRouter');
const addressRouter = require('./api/addressApi');

module.exports = (app) => {
  app.use('/api/user', userRouter);
  app.use('/api/category', categoryRouter);
  app.use('/api/type', typeRouter);
  app.use('/api/attractions', attractionsRouter);
  app.use('/api/address', addressRouter);
};
