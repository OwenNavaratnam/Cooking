//ALLER VOIR SUR MONGO ATLAS POUR VOIR LE CLOUD QUI NOUS EST ATTRIBUEE POUR LE PROJET

// --------------------- REQUIREMENT FOR DEPLOYMENT ----------------- \\

const dotenv = require('dotenv').config();
//Créer le fichier : .env pour mettre les variables d'environnemnts (variables qu'on veut cacher dans les fichiers)

// ------------ REQUIREMENTS AND APP ------------ \\

const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
//Flash est un packet permettant l'envoi de messages
const flash = require('connect-flash');

//bcrypt permet de crypter un mot de passe
const bcrypt = require("bcrypt");

//INSTALLATION POUR CREATION DE TOKEN ALEATOIRE POUR RECUP DE MDP

const randToken = require('rand-token');

//INSTALLATION DU PACKAGE PERMETTANT L'ENVOI DE MAIL
const nodemailer = require('nodemailer');


//INSTALLATIONS POUR PASSPORT
//Pour les sessions
const session = require("express-session");

//Pour l'authentification
const passport = require("passport");

//Pour gérer une stratégie
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.set('view engine','ejs');
app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended: false}));

//Initialisations pour passport, session, etc
//Il faut faire attention à bien placer session avant mongoose.connect
app.use(session({
    secret: "mysecret",
    //Les deux paramètres suivants nous permettent de faire en sorte que si une session n'a pas été initialisée, on ne l'enregistre pas
    resave: false,
    saveUninitialized: false,
}));

//Bien placer passport après session et avant mongoose.connect
app.use(passport.initialize());
//Le lien entre passport et les sessions
app.use(passport.session());





//L'url pour la connection se trouve sur Mongo Atlas, il faut aller sur le projet, puis Database puis Connect
//Le /cooking dans l'url correspond à la database
mongoose.connect("mongodb+srv://OwenNvr:OY02JP8vIqazWrYm@cluster0.pnjwdhc.mongodb.net/cooking?retryWrites=true&w=majority");

// ---------------------- MODELE EXPORTS ----------------------- \\

const User = require("./models/user.js");
const Reset = require("./models/reset.js");
const Receipe = require("./models/receipe.js");
const Favourite = require("./models/favourite.js");
const Ingredient = require("./models/ingredient.js");
const Schedule = require("./models/schedule.js");

// -------------------------------------------------------------- \\

//Gestion du lien entre passport et la base de données
//Toujours après placer après le mongoose.connect
//Aller voir dans les fichiers models ce qui a été ajouté pour l'utilisation de passport

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Pour l'utilisation de flash
app.use(flash());
app.use(function(req,res,next){
    res.locals.currentUser = req.user; //On travaille avec des variables locales d'environnement, ici on prend le user actuel de la session et on pourra accéder à currentUser depuis n'importe quel fichier
    
    //Pour avoir accès aux messages d'erreurs et de succès dans n'importe quel fichier grâce à flash
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next(); //La fonction next va demander l'exécution de la prochaine route 
});


//Pour l'utilisation de l'override de methodes (Methodes DELETE, UPDATE, etc)
app.use(methodOverride('_method'));



//Aller voir dans le dossier models pour voir tous les modèles mongoose créés




// ------------------- PREMIERE ROUTE --------------------- \\

app.get('/',function(req,res){
    res.render('index');
});


// -------------- DEUXIEME ROUTE ------------------- \\


app.get("/signup",function(req,res){
    res.render("signup");
});

//On récupère ce qui a été envoyé en POST sur le forms
app.post("/signup",async function(req,res){
    //METHODE AVEC BCRYPT POUR CRYPTER MDP
    /*
    //Partie hachage du mot de passe
    
    //Nombre de fois qu'on hache le mot de passe
    const saltRounds = 10;
    
    //Fonction pour hasher le mot de passe
    bcrypt.hash(req.body.password, saltRounds, async function(err,hash){
        const user = {
        username: req.body.username,
        password: hash
        }
        
        //On créé la ligne dans la collection
        await User.create(user);
    });
    
    //Une fois le user créé on le redirige vers la page d'accueil
    res.render("index");
    */
    
    //METHODE AVEC PASSPORTJS
    
    //On récupère le username mis par le client en méthode POST
    const newUser = new User({
       username: req.body.username,
    });
    //Ajout dans la base de données avec PASSPORTJS et hachage du mdp
    User.register(newUser,req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.render("signup");
        }
        else{
            //Création de l'authentification avec passport, session, etc
            passport.authenticate("local")(req,res,function(){
                //On redirige vers signup si l'authentification est un succès
                res.redirect("signup");
            });
        }
    });
});

// ----------------- TROISIEME ROUTE -------------------- \\

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",async function(req,res){
    //METHODE AVEC BCRYPT POUR DECRYPTER MDP
    /*
   const foundUser = await User.findOne({username: req.body.username}); 
   if(foundUser){
       //Si les passwords correspondent, pour cela il faut décrypter le password qui a été haché dans le sign up
       bcrypt.compare(req.body.password,foundUser.password,function(err,result){
           //Si le décryptage indique que c'est le bon password
           if(result==true){
               res.render("index");
           }
           //sinon
           else{
               res.render("login");
           }
       });
   }
    else{
        res.render("login");
    }
    */
    //METHODE AVEC PASSPORTJS
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    
    //Pour le décryptage du mdp et pour connecter le user et démarrer sa session
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                //Pour l'affichage du message de succès
                req.flash("success","Congratulations you are connected");
                res.redirect("dashboard");
            });
        }
    });
    
});


// ------------------- QUATRIEME ROUTE ------------------ \\

//Fonction isLoggedIn permet de passer du dashboard à une autre page si on est bien connecté, sinon ça renvoie vers la page de log in
app.get("/dashboard",isLoggedIn,function(req,res){
    console.log(req.user); //Affichage dans la console du user courant
    res.render("dashboard"); 
});


// ------------------- CINQUIEME ROUTE ------------------- \\

app.get("/logout",function(req,res){
    //Pour déconnecter et détruire la session du user
   req.logout(function(err){
       if(err){
           console.log(err);
       }
       else{
            req.flash("success","You are now logged out!");
            res.redirect("login"); 
       }
   });
});

// ------------------- SIXIEME ROUTE ------------------- \\

app.get("/forgot",function(req,res){
   res.render("forgot"); 
});

//Methode POST pour récupérer la valeur de l'adresse mail sur l'input
app.post("/forgot",async function(req,res){
    const userFound = await User.findOne({username: req.body.username});
    //Si le username n'existe pas dans la base de données
    if(!userFound){
        res.redirect("/login");
    }
    //Sinon on créé le token avec date d'expiration
    else{
        const token = randToken.generate(16);
        Reset.create({
            username: userFound.username,
            resetPasswordToken: token,
            resetPasswordExpires: Date.now()+3600000 //C'est en millisecondes
        });
        //Création du transporteur pour l'envoi de mail
        const transporter = nodemailer.createTransport({
            service: 'gmail', //On utilise nodemailer que pour gmail ici
            auth: {
                type: "OAuth2",
                user: 'cooking@gmail.com',
                pass: process.env.PWD //Mdp caché grâce à dotenv, voir dans .env le mdp
            }
        });
        
        //Options du mail et ce qui apparaîtra dedans
        const mailOptions = {
            from: 'cooking@gmail.com',
            to: req.body.username,
            subject: 'link to reset your password',
            text: 'Click on this link to reset your password : http://localhost:3000/reset/'+token
        }
        console.log("Le mail est prêt à être envoyé");
        
        transporter.sendMail(mailOptions, function(err,response){
           if(err){
               console.log(err);
           } 
            else{
                res.redirect('login');
            }
        });
    }
});


// ------------------ SEPTIEME ROUTE -------------------- \\

//La route sur la page du reset pour un user avec son token
app.get('/reset/:token',async function(req,res){
    var date = Date.now();
    
    const found = await Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: date} //Il vérifier si le token n'a pas déjà expiré
    });
    //Si les conditions ne matchent pas
    if(!found){
        console.log("token expired");
        res.redirect('/login');
    }
    //Sinon, on renvoie sur la page du reset avec token comme valeur
    else{
        res.render("/reset", {token : req.params.token});
    }
});


//Récupération en méthode POST du token pour une autre vérification de l'expiration
app.post("/reset/:token",async function(req,res){
    var date = Date.now();
    
    const found = await Reset.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: date} //Il faut vérifier si le token n'a pas déjà expiré
    });
    //Si les conditions ne matchent pas
    if(!found){
        console.log("token expired");
        res.redirect('/login');
    }
    //Sinon modificaiton du mdp
    else{
        //On vérifie si les mdp concordent
        if(req.body.password == req.body.password2){
            //On recherche le user en question pour modifier le mdp
            const userFound = await User.findOne({
               username: found.username 
            });
            //Modification du mdp avec PASSPORTJS
            userFound.setPassword(req.body.password, async function(err){
                if(err){
                    console.log(err);
                }
                else{
                    //On enregistre le user avec son nouveau mdp dans la collection
                    await userFound.save();
                    //On remet les variables temporaires à null
                    const updatedReset = {
                        resetPasswordToken: null,
                        resetPasswordExpires: null
                    }
                    //On retrouve l'objet reset et on l'update pour la remise à 0 des valeurs pour le token
                    await Reset.findOneAndUpdate({
                        resetPasswordToken: req.params.token
                    }, updatedReset);
                    
                    //on renvoie sur la page de login une fois le mdp mis à jour
                    res.redirect("/login");
                }
            });
            
        }
    }
});




// ----------------- ROUTE RECEIPE ------------------------ \\

app.get("/dashboard/myreceipes",isLoggedIn, async function(req,res){
    const userFound = await Receipe.find({ 
       user: req.user.id //Pour voir si l'id du usser courant match avec l'id  du user dans la collection Receipe
    });
    if(!userFound){
        console.log('not found');
    }
    else{
        //On affiche le template receipe en lui envoyant le userFound
        res.render("receipe",{receipe: userFound});
    }
});


// ---------------- ROUTE NEW RECEIPE ------------------- \\

app.get("/dashboard/newreceipe",isLoggedIn, async function(req,res){
   res.render("newreceipe"); 
});


app.post("/dashboard/newreceipe",async function(req,res){
    //Fonction de création d'une recette dans la base de données
    
    const newReceipe = {
        name: req.body.receipe,
        image: req.body.logo,
        user: req.user.id //Récupération de l'id du user
    }
    await Receipe.create(newReceipe);
    console.log("Receipe created");
    res.redirect("/dashboard/myreceipes");
});

// ------------------ ROUTE RECEIPE SPECIFIQUE ---------------- \\

app.get("/dashboard/myreceipes/:id",isLoggedIn, async function(req,res){
    //On vérifie si l'id de la recette correspond à celui dans le lien url de la page et si l'id du user est celui du user courant
    const receipeFound = await Receipe.findOne({user: req.user.id, _id: req.params.id});
    
    if(!receipeFound){
        console.log("Not Found");
    }
    else{
        //On retrouve les ingrédients pour la recette, même si rien n'est trouvé, ça retournera un tableau vide et affichera la page ingrédient contrairement à findOne qui bloquera le processus
        const ingFound = await Ingredient.find({
            user: req.user.id,
            receipe: req.params.id
        });
        console.log(ingFound);
        if(!ingFound){
            console.log("Not found ingredient");
        }
        else{
            //On renvoie la page des ingrédients avec certains éléments pour la page EJS
            res.render("ingredients",{ingredient: ingFound, receipe: receipeFound});
        }
    }
});


//L'AJOUT d'INGREDIENTS SUR LA PAGE 

app.post("/dashboard/myreceipes/:id",async function(req,res){
   const newIngredient = {
       name: req.body.name,
       bestDish: req.body.dish,
       user: req.user.id,
       quantity: req.body.quantity,
       receipe: req.params.id
   } 
    await Ingredient.create(newIngredient);
    req.flash("success","Ingredient added");
    res.redirect("/dashboard/myreceipes/"+req.params.id);
});

//SUPPRESSION D'UNE RECETTE 

app.delete("/dashboard/myreceipes", isLoggedIn, async function(req,res){
    await Receipe.deleteOne({_id: req.params.id});
    req.flash("success","Successfully deleted the receipe");
    res.redirect("/dashboard/myreceipes/:id");
});


// ---------------- ROUTE VERS UN L'AJOUT D'INGREDIENTS ----------------- \\


app.get("/dashboard/myreceipes/:id/newingredient",isLoggedIn, async function(req,res){
    const receipeFound = await Receipe.findById({_id: req.params.id}); 
    if(!receipeFound){
        console.log("Receipe not found");
    }
    else{
        res.render("newingredient",{receipe: receipeFound});
    }
});


// ------------------ SUPPRESSION D'UN INGREDIENT ----------------- \\


app.delete("/dashboard/myreceipes/:id/:ingredientid", isLoggedIn, async function(req,res){
    //Suppression de l'ingrédient en fonction du paramètre dans l'url
    await Ingredient.deleteOne({_id: req.params.ingredientid});
    req.flash("success","your ingredient has been deleted!");
    res.redirect("/dashboard/myreceipes/"+req.params.id);
});


// --------------------- ROUTE DE MODIFICATION D'INGREDIENT ------------ \\


app.post("/dashboard/myreceipes/:id/:ingredientid/edit", isLoggedIn, async function(req,res){
    const receipeFound = await Receipe.findOne({user: req.user.id, _id: req.params.id});
    if(!receipeFound){
        console.log("Not found fo modif");
    }
    else{
        const ingFound = await Ingredient.findOne({
            _id: req.params.ingredientid,
            receipe: req.params.id
        });
        if(!ingFound){
            console.log("Ing not found for modif");
        }
        else{
            res.render("edit",{ingredient: ingFound, receipe: receipeFound});
        }
    }
});

//MODIFICATION DE L'INGREDIENT

app.put("/dashboard/myreceipes/:id/:ingredientid", isLoggedIn, async function(req,res){
    const ingredient_updated = {
        name: req.body.name,
        bestDish: req.body.dish,
        user: req.user.id,
        quantity: req.body.quantity,
        receipe: req.params.id
    }
    //On cherche l'ingrédient et on l'update
    await Ingredient.findByIdAndUpdate({_id: req.params.ingredientid},ingredient_updated);
    req.flash("success","Ingredient successfully modified");
    res.redirect("/dashboard/myreceipes/"+req.params.id);
    
});


// --------------- ROUTE FAVOURITES ----------------- \\


app.get("/dashboard/favourites", isLoggedIn, async function(req,res){
    const fav = await Favourite.find({user: req.user.id});
    res.render("favourites",{favourite: fav}); 
});

//AJOUT DE FAVORIS

app.post("/dashboard/favourites", isLoggedIn, async function(req,res){
   const newFav = {
       image: req.body.image,
       title: req.body.title,
       description: req.body.description,
       user: req.user.id
       
   } 
   await Favourite.create(newFav);
   req.flash("success","Successfully added a favourite!");
   res.redirect("/dashboard/favourites");
});


//SUPPRESSION DE FAVORIS

app.delete("/dashboard/favourites/:favid", isLoggedIn, async function(req,res){
    await Favourite.deleteOne({_id: req.params.favid});
    req.flash("success","successfully deleted the receipe");
    res.redirect("/dashboard/favourites");
});


// --------------------- ROUTE AJOUT DE FAVORIS --------------- \\


app.get("/dashboard/favourites/newfavourite", isLoggedIn, function(req,res){
    res.render("newfavourite");
});


// -------------- Fonction d'accès uniquement si logged in ------------- \\

function isLoggedIn(req,res,next){
    //Methode de passport pour tester si la session est toujours ouverte
    if(req.isAuthenticated()){
        //Alors on peut exécuter le reste du code, accéder à la prochaine route
        return next();
    }
    else{
        req.flash("error","Please login first");
        res.redirect("/login");
    }
}


// ----------------------- ROUTE SCHEDULE ----------------- \\

app.get("/dashboard/schedule", isLoggedIn, async function(req,res){
    const scheduleFound = await Schedule.find({user: req.user.id});
    if(!scheduleFound){
        console.log("Schedule not found");
    }
    else{
        res.render("schedule", {schedule: scheduleFound});
    }
});

//SUPPRESSION DE SCHEDULE

app.delete("/dashboard/schedule/:schedid", isLoggedIn, async function(req,res){
    await Schedule.deleteOne({_id: req.params.schedid});
    req.flash("success", "You have successfully deleted a schedule");
    res.redirect("/dashboard/schedule");
});



// ----------------- ROUTE VERS AJOUT DE SCHEDULE ------------------- \\

app.get("/dashboard/schedule/newschedule", isLoggedIn, function(req,res){
    res.render("newSchedule");
});

//AJOUT DEPUIS LE FORM
app.post("/dashboard/schedule", isLoggedIn, async function(req,res){
   const newSched = {
       ReceipeName: req.body.receipename,
       scheduleDate: req.body.scheduleDate,
       user: req.user.id,
       title: req.body.title
   } 
   await Schedule.create(newSched);
    req.flash("success","New schedule created");
    res.redirect("/dashboard/schedule");
   
});




// ------------------ SERVEUR LANCEMENT ------------------ \\

app.listen(3000,function(req,res){
    console.log("Serveur tourne sur port 3000");
});
