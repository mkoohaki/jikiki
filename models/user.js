const mongoose = require('mongoose');

//Create the user schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    image: {
        data: Buffer,
        contentType: String
    },
    imageName: {
        type: String
    },
    active: {
        type: Boolean
    },
    activationCode: {
        type: String
    }

});

//Create, instantiate and export model with schema
const Users = mongoose.model("User", UserSchema);
module.exports = Users;
