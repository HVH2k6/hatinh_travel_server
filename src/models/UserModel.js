const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
 username: String,
 email: String,
 password: String,
 roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
 avatar: {
    type:String,
    default: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
 },
 phoneNumber: String,
 description: String,
 status: { type: Boolean, default: true },
 createdAt: { type: Date, default: Date.now },
 updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
