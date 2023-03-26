const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
    image: String,
    title: String, ///Le nom
    description: String,
    user: String,
    date: {
        type: Date,
        default: Date.now() //Date actuelle par défault
    }
});


module.exports = mongoose.model('Favourite',favouriteSchema);