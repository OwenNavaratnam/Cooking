const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: String,
    bestDish: String,
    user: String,
    quantity: Number,
    receipe: String,
    date: {
        type: Date,
        default: Date.now() //Date par défaut à celle du moment de création
    }
});

module.exports = mongoose.model('Ingredient',ingredientSchema);