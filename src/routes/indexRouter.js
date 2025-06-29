const UserRouter = require('./api/userRouter');
module.exports = (app) => {
  app.use('/api/user', UserRouter);

 
};
