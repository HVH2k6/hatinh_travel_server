const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 username: String,
 email: String,
 password: String,
 roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
 avatar: String,
 phoneNumber: String,
 description: String,
 status: { type: Boolean, default: true },
 createdAt: { type: Date, default: Date.now },
 updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
