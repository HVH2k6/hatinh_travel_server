const mongoose = require('mongoose');

const Role = require('./models/RoleModel');
require('dotenv').config();
const initializeDB = async () => {
  try {
    // Kết nối đến cơ sở dữ liệu
    await mongoose
      .connect(`${process.env.MONGODB_CONNECT}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(async () => {
        const defaultAdminRole = new Role({
          name: 'Admin',
          description: 'Có quyền truy cập tất cả dữ liệu',
        });
        const defaultManageRole = new Role({
          name: 'Seller',
          description:
            'Có quyền đăng bán 1 số sản phẩm',
        });

        const defaultClientRole = new Role({
          name: 'User',
          description: 'Không có quyền gì',
        });

        await defaultAdminRole.save();
        await defaultManageRole.save();
        await defaultClientRole.save();
      })
      .then(() => {
        console.log('Init Database success');
        mongoose.connection.close();
      })
      .catch((e) => {
        console.log('Error init data', e);
      });
  } catch (error) {
    console.log('Error init data', error);
  }
};

initializeDB();