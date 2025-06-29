const brypt = require('bcryptjs');

const User = require('../models/UserModel');
const { getRolesByNames } = require('../config/constant');

const signUp =async (req, res) => {
    const { username, email,phoneNumber, password } = req.body;
    const hashPassword = brypt.hashSync(password, 10);
    const roleUser = await getRolesByNames(['User']);
    const roleUserId = roleUser.User._id


    await User.create({
        username,
        email,
        phoneNumber,
        password: hashPassword,
        roleId: roleUserId
    })
    
};

module.exports = {
    signUp
}