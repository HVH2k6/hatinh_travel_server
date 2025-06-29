const Role = require('../models/RoleModel');

// Hàm lấy role theo tên
const getRolesByNames = async (roleNames) => {
    try {
        const roles = await Role.find({ name: { $in: roleNames } }).exec();
        const roleMap = {};
        roles.forEach(role => {
            roleMap[role.name] = role;
        });
        return roleMap;
    } catch (err) {
        console.error('Error fetching roles:', err);
        throw new Error('Error fetching roles');
    }
};

module.exports = {
    getRolesByNames
};
