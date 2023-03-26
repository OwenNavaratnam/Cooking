//On créé le modèle pour le User et on l'exporte
const mongoose = require("mongoose");
const passportLocalStrategy = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
   username: String,
   password: String
});

//Permet d'enregistrer automatiquement un mot de passe haché et un salt
userSchema.plugin(passportLocalStrategy);

//Export du module
module.exports = mongoose.model("User",userSchema);