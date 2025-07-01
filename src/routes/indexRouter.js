const UserRouter = require('./api/userRouter');
const CategoryRouter = require('./api/categoryRouter');
module.exports = (app) => {
  app.use('/api/user', UserRouter);
  app.use('/api/category', CategoryRouter);

 
};
