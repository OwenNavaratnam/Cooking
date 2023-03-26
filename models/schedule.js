const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    ReceipeName: String,
    scheduleDate: {type: Date}, //Rentrer la date à la main pour programmer
    user: String,
    time: String, //Durée
    date: {
        type: Date,
        default: Date.now() //Date par défaut à celle du moment de création
    }
});


module.exports = mongoose.model('Schedule',scheduleSchema);