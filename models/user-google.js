const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//Create the google user schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    oauthID: {
        type: Number,
        required: true,
        unique: true
    }, 
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    imageAddress: {
        type: String,
        trim: true
    },
    active: {
        type: Boolean
    }
});

UserSchema.plugin(passportLocalMongoose);

//Create, instantiate and export model with schema
const UsersGoogle = mongoose.model("UserGoogle", UserSchema);
module.exports = UsersGoogle;
