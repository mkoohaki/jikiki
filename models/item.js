const mongoose = require('mongoose');

//Create the user schema
const ItemSchema = new mongoose.Schema({
    seller: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        max: 64
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    },
    imageName: {
        type: String
    },
    userId: {
        type: String,
        required: true
    }
});

//Create, instantiate and export model with schema
const Items = mongoose.model("Item", ItemSchema);
module.exports = Items;
