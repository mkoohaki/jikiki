'use strict';
var express = require('express');
var router = express.Router();
var passport = require('passport');
var userModel = require('../models/user');
var userGoogleModel = require('../models/user-google');
var itemModel = require('../models/item');
var bcrypt = require('bcryptjs');
var multer = require('multer');
var fs = require('fs');
var path = require('path')
var nodemailer = require('nodemailer');
var randomstring = require("randomstring");



/* GET index page. */
router.get('/', function (req, res) {
    res.render('index', { user: req.user, title: 'Index' });
});

/* GET home page. */
router.get('/home', function (req, res, next) {
    itemModel.find({}, function (err, items) {
        if (err) {
            res.send('Something in fetching went wrong!');
            next()
        } else {
            res.render("home", { user: req.user, items: items, item: req.item });
        }
    });
});


/*POST for login*/
//Try to login with passport  - It uses authenticat checking to avoid getting/display page withought logging in */
router.post('/login', passport.authenticate('local', {
    successRedirect: '/main',
    failureRedirect: '/home',
    failureMessage: 'Invalid Login'
}));

/*GET for Logout*/
router.get('/logout', function (req, res) {

    req.session.destroy();
    res.redirect('/home');
});

/*GET for register in signup page*/
router.get('/signup', function (req, res) {
    res.render('signup');
});

/*POST for register - It uses authenticat checking to avoid posting withought logging in */
router.post('/signup', function (req, res) {

    if (req.body.username && req.body.password && req.body.repassword &&
        req.body.email && req.body.password == req.body.repassword) {
        //Insert user
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            var registerUser = new userModel();
            registerUser.username = req.body.username;
            registerUser.password = hash;
            registerUser.email = req.body.email;
            registerUser.active = false;
            registerUser.activationCode = randomstring.generate({
                length: 100,
                charset: 'alphabetic'
            });
            registerUser.image.data = null;
            registerUser.image.contenttype = '';
            registerUser.imageName = null;

            //Check if user already exists
            userModel.find({ username: registerUser.username }, function (err, username) {
                if (err) console.log(err);
                if (!username.length) {
                    userModel.find({ email: registerUser.email }, function (err, email) {
                        if (err) console.log(err);
                        if (!email.length) {
                            userGoogleModel.find({ email: req.body.email }, function (err, user) {
                                if (err) console.log(err);
                                if (!user.length) {
                                    const newUser = new userModel(registerUser);
                                    newUser.save(function (err) {
                                        if (err) console.log(err);
                                        userModel.findOne({ username: registerUser.username, email: registerUser.email }, function (err, user) {
                                            if (err) console.log(err);
                                            if (user) {
                                                try {
                                                    const output = `
                                                    <p>ACCOUNT ACTIVATION</p>
                                                    <h3>This email sent you because of your registration in JIKIKI</h3>
                                                    <h>For activate your account click on the below link</h4>
                                                    <p>https://jikiki.herokuapp.com/activation/api/auth/verification/verify-account/${user._id}/${user.activationCode}</p>
                                                    `;

                                                    // create reusable transporter object using the default SMTP transport / I have an account in Hostinger, then I used that.
                                                    let transporter = nodemailer.createTransport({
                                                        host: 'smtp.hostinger.com',
                                                        port: 587,
                                                        secure: false,
                                                        auth: {
                                                            user: 'mkoohaki.online@mkoohaki.online', // generated ethereal user
                                                            pass: 'hostMK64656465'  // generated ethereal password
                                                        },
                                                        tls: {
                                                            rejectUnauthorized: true
                                                        }
                                                    });

                                                    // setup email data with unicode symbols
                                                    let mailOptions = {
                                                        from: '"JIKIKI web application" <mkoohaki.online@mkoohaki.online>', // sender address
                                                        to: registerUser.email, // email of receiver
                                                        subject: 'Activation account on JIKIKI', // Subject line
                                                        html: output // html body
                                                    };

                                                    // send mail with defined transport object
                                                    transporter.sendMail(mailOptions, function (err, info) {
                                                        if (err) console.log(err);
                                                        if (info) res.render('signup', { success_message: 'For activate your account check your email' });
                                                    });
                                                } catch (err) {
                                                    console.log(err);
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    res.render('signup', { message: 'You already signed up with Google account' });
                                }
                            });
                        } else { 
                            res.render('signup', { message: 'Email already exists' });
                        }
                    });
                } else {
                    res.render('signup', { message: 'Username already exists' });
                }
            });
        });
    } else if (req.body.password != req.body.repassword) {
        res.render('signup', { message: 'Password and repassword are not match' });
    } else { //never get this because of the form requirements
        res.render('signup', { message: 'All fields must be filled out' });
    }
});

//Creating the file name and destination directory when called
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const newDirectorySeller = './public/imageStorage/' + req.body.seller + '-' + req.body.userId + '/';
        const newDirectoryUsername = './public/imageStorage/' + req.body.username + '-' + req.body.userId + '/';
        if (!fs.existsSync(newDirectorySeller) && !fs.existsSync(newDirectoryUsername)) {
            if (req.body.seller) {
                fs.mkdir('./public/imageStorage/' + req.body.seller + '-' + req.body.userId + '/', function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("New directory successfully created.")
                    }
                });
            } else {
                fs.mkdir('./public/imageStorage/' + req.body.username + '-' + req.body.userId + '/', function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("New directory successfully created.")
                    }
                });
            }
        }
        if (req.body.seller) {
            cb(null, './public/imageStorage/' + req.body.seller + '-' + req.body.userId + '/')
        } else {
            cb(null, './public/imageStorage/' + req.body.username + '-' + req.body.userId + '/')
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
});

//Creating uploader
var upload = multer({ storage: storage });

/*post for submit the item info/image in database and image in local folder - It uses authenticat checking to avoid posting withought logging in */
router.post('/submit', upload.single('image'), function Create(req, res) {
    if (req.isAuthenticated()) {      
        if (req.body.name && req.body.description && req.body.price) {

            var registerItem = new itemModel();
            registerItem.name = req.body.name;
            registerItem.description = req.body.description;
            registerItem.price = req.body.price;
            registerItem.userId = req.body.userId
            registerItem.seller = req.body.seller

            // Checking for submition with/withought image - It is avoiding errors
            if (req.file !== undefined) {
                console.log('1');
                registerItem.image.data = fs.readFileSync(path.join('./public/imageStorage/' + registerItem.seller + '-' +
                                            registerItem.userId + '/' + req.file.filename));
                registerItem.image.contenttype = 'image/png';
                registerItem.imageName = req.file.filename;
            } else {

                registerItem.image.data = null;
                registerItem.image.contenttype = '';
                registerItem.imageName = null;
            }

            registerItem.save(function (err) {
                if (err) console.log(err);

                res.redirect('/personal');
            });

        } else {
            console.log('---------------------some fields are not completed---------------------');
            res.redirect('/personal');
        }
    } else {
        res.redirect('/')
    }
});

/* GET show page - It uses authenticat checking to avoid getting/display page withought logging in */
router.get('/show/:id', function (req, res) {
    if (req.isAuthenticated()) {
        var itemId = req.params.id;

        itemModel.findById(itemId, function (err, foundItem) {
            if (err) console.log(err);
            //Render show page with specific article
            res.render('show', { title: 'Show', user: req.user, item: foundItem });
        });
    } else {
        res.redirect('/')
    }
});

/* POST update in show page - It uses authenticat checking to avoid posting withought logging in */
router.post('/update', upload.single('image'), function Create(req, res) {
    if (req.isAuthenticated()) {
        if (req.body.name && req.body.description && req.body.price) {

            //Now I found what our instructor said in HTML course, what the value is for in fomrs!
            var seller = req.body.seller
            var newName = req.body.name;
            var newDescription = req.body.description;
            var newPrice = req.body.price;
            var newImageData = req.body.iamge;
            var newImageContent = 'image/png';
            var newImageName = req.body.imageName;
            var itemId = req.body.id;
            var picture = req.body.deletePic;
            var userId = req.body.userId;

            // Checking for submition if the new item is with image - It is avoiding errors
            if (req.file !== undefined) {

                newImageData = fs.readFileSync(path.join('./public/imageStorage/' + seller + '-' + userId + '/' + req.file.filename));
                newImageContent = 'image/png';
                newImageName = req.file.filename;

                //Remove the local image in imageStorage if user check the delete image
                itemModel.findById(itemId, function (err, foundItem) {
                    if (err) console.log(err);

                    //Remove the local image (from imageStorage folder)
                    fs.unlink(path.join('./public/imageStorage/' + foundItem.seller + '-' + foundItem.userId + '/' + foundItem.imageName), function (err) {
                        if (err) console.log(err);
                    });
                });

                itemModel.findOneAndUpdate({ _id: itemId }, {
                    seller: seller, name: newName, description: newDescription, price: newPrice,
                    image: { data: newImageData, contenttype: newImageContent },
                    imageName: newImageName, userId: userId
                }, function (err, model) {
                    if (err) console.log(err);
                    res.redirect('/personal');
                });

              // New item is withought image - It is avoiding errors
            } else {
                itemModel.findById({ _id: itemId }, function (err, foundItem) {
                    if (err) console.log(err);
                    if (foundItem !== null && picture != 'on') {
                        newImageData = foundItem.image.data;
                        newImageContent = foundItem.image.contenttype;
                        newImageName = foundItem.imageName;

                    } else if (foundItem !== null && picture == 'on') {
                        //Remove the local image in imageStorage
                        itemModel.findById(itemId, function (err, foundItem) {
                            if (err) console.log(err);

                            //Remove the local image in imageStorage
                            fs.unlink(path.join('./public/imageStorage/' + foundItem.seller + '-' + foundItem.userId + '/' +
                                                    foundItem.imageName), function (err) {
                                if (err) console.log(err);
                                const localImageFolder = './public/imageStorage/' + foundItem.seller + '-' + foundItem.userId;
                                if (fs.existsSync(localImageFolder)) {
                                    fs.readdir(localImageFolder, function (err, file) {
                                        if (err) console.log(err);
                                        if (!file.length) {
                                            try {
                                                fs.rmdirSync(localImageFolder, { recursive: true });
                                                console.log(` Direcrory ${localImageFolder} is deleted!`);
                                            } catch (err) {
                                                console.error(`Error while deleting ${localImageFolder}.`);
                                            }
                                        }
                                    });
                                }
                            });
                        });

                    } else {

                        newImageData = null;
                        newImageContent = null;
                        newImageName = null;
                    }

                    itemModel.findOneAndUpdate({ _id: itemId }, {
                        seller: seller, name: newName, description: newDescription, price: newPrice,
                        image: { data: newImageData, contenttype: newImageContent },
                        imageName: newImageName, userId: userId
                    }, function (err, model) {

                        if (err) console.log(err);
                        res.redirect('/personal');
                    });
                });
            }
        } else {
            itemModel.findById(req.body.id, function (err, foundItem) {
                if (err) console.log(err);
                //Render show page with specific article
                res.render('show', { title: 'Show', user: req.user, item: foundItem, message: 'All Name, Price, and Description fields must be filled out' });
            });
        }
    } else {
        res.redirect('/')
    }
});

/* POST delete in show and personal pages - It uses authenticat checking to avoid posting withought logging in */
router.post('/delete/:id', (function (req, res) {
    if (req.isAuthenticated()) {
        var itemId = req.params.id;

        try {
            itemModel.findById({ _id: itemId }, function (err, foundItem) {
                if (err) console.log(err);
                const localImageFolder = './public/imageStorage/' + foundItem.seller + '-' + foundItem.userId;
                // This condition avoid error when the item does not contain image
                if (foundItem.imageName) {
                    //Remove the local image in imageStorage
                    fs.unlink(path.join(localImageFolder + '/' + foundItem.imageName), function (err) {
                        if (err) console.log(err);
                    });
                } else {
                    console.log('---------------------Item does not contain picture---------------------');
                }

                if (fs.existsSync(localImageFolder)) {
                    fs.readdir(localImageFolder, function (err, file) {
                        if (err) console.log(err);
                        if (!file.length) {
                            try {
                                fs.rmdirSync(localImageFolder, { recursive: true });
                                console.log(` Direcrory ${localImageFolder} is deleted!`);
                            } catch (err) {
                                console.error(`Error while deleting ${localImageFolder}.`);
                            }
                        }
                    });
                }

                itemModel.findByIdAndDelete(itemId, function (err, result) {
                    if (err) console.log(err);
                    res.redirect('/personal');
                });
            });

        } catch (err) {
            console.log(err);
            res.redirect('/personal');
        }
    } else {
        res.redirect('/')
    }
}));

/* GET personal page - It uses authenticat checking to avoid from showing the page withought logging in */
router.get('/personal', function (req, res) {
    if (req.isAuthenticated()) {
        itemModel.find({ userId: req.user.id}, function (err, items) {

            if (err) console.log('---------------------Something in fetching went wrong!---------------------');
            res.render("personal", { user: req.user, items: items });
        });
    } else {
        res.redirect('/')
    }
});

/* GET main page - It uses authenticat checking to avoid from showing the page withought logging in */
router.get('/main', function (req, res, next) {
    if (req.isAuthenticated()) {
        userModel.find({}, function (err, users) {
            var user = req.user;
            itemModel.find({}, function (err, items) {
                if (err) {
                    console.log('---------------------Something in fetching went wrong!---------------------');
                    next()
                }
                if (user.active == true) {
                    res.render("main", { user: user, items: items, item: req.item });
                }
            });
        });
    } else {
        res.render("/", { items: items, item: req.item });
    }
});

/* GET retrieving page. */
router.get('/retrieving', function (req, res) {
    res.render('retrieving', { title: 'Retrieving' });
});

/* Post retrieving username in retrieving page - If user provide correct information it will send the username to the email */
router.post('/retrieving_username', function (req, response) {

    var passwordTry = req.body.password;
    var emailTry = req.body.email;

    userModel.findOne({ email: emailTry }, function (err, user) {
        if (user) {
            if (bcrypt.compare(passwordTry, user.password, function (err, isMatch) {
                if (isMatch) {

                    const output = `
                    <p>USERNAME RETRIEVING</p>
                    <h3>This email sent you because of your request for retrieving your username in JIKIKI</h3>
                    <ul>  
                        <li>Username: ${user.username}</li>
                    </ul>
                    `;

                    // create reusable transporter object using the default SMTP transport / I have an account in Hostinger, then I used that.
                    let transporter = nodemailer.createTransport({
                        host: 'smtp.hostinger.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: 'mkoohaki.online@mkoohaki.online', // generated ethereal user
                            pass: 'hostMK64656465'  // generated ethereal password
                        },
                        tls: {
                            rejectUnauthorized: true
                        }
                    });

                    // setup email data with unicode symbols
                    let mailOptions = {
                        from: '"JIKIKI web application" <mkoohaki.online@mkoohaki.online>', // sender address
                        to: user.email, // email of receiver
                        subject: 'Retrieving Password on JIKIKI', // Subject line
                        text: 'Hello world?', // plain text body
                        html: output // html body
                    };

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            return console.log(err);
                        }
                        //I created render to show the messages, it was working well, but after creating google acount(or something else) it cannot render anymore
                        response.render('retrieving', { success_message: 'Usernamesent to your email' });
                    });
                } else {
                    response.render('retrieving', { message: 'Email/password are not match' });
                }
            }));
        } else {
            response.render('retrieving', { message: 'Email/password are not match' });
        }
    });
});


/* Post delete account in retrieving page _ automatically brings user to the signup page */
router.post('/delete_account', function (req, response) {

    var usernameTry = req.body.username;
    var emailTry = req.body.email;

    if (req.body.username && req.body.email) {

        userModel.findOne({ username: usernameTry, email: emailTry }, function (err, user) {
            if (err) console.log(err);
            if (user) {
                var uId = user.id.toString();
                try {
                    const localImageFolder = './public/imageStorage/' + user.username + '-' + uId;
                    if (fs.existsSync(localImageFolder)) {
                        try {
                            fs.rmdirSync(localImageFolder, { recursive: true });
                            console.log(` Direcrory ${localImageFolder} is deleted!`);
                        } catch (err) {
                            console.error(`Error while deleting ${localImageFolder}.`);
                        }
                    }
                    itemModel.deleteMany({ seller: user.username }, function (err, result) {
                        if (err) console.log(err);
                    });

                } catch (err) {
                    res.render('retrieving', { message: 'username or email is wrong' });
                }

                userModel.deleteOne({ _id: uId }, function (err, result) {
                    if (err) Console.log(err);
                    response.render('retrieving', { success_message: 'Account successfully deleted' });
                });
            } else {
                userGoogleModel.findOne({ username: usernameTry, email: emailTry }, function (err, googleUser) {
                    if (err) console.log(err);
                    if (googleUser) {
                        var uId = googleUser.id.toString();
                        try {
                            const localImageFolder = './public/imageStorage/' + googleUser.username + '-' + uId;
                            if (fs.existsSync(localImageFolder)) {
                                try {
                                    fs.rmdirSync(localImageFolder, { recursive: true });
                                    console.log(` Direcrory ${localImageFolder} is deleted!`);
                                } catch (err) {
                                    console.error(`Error while deleting ${localImageFolder}.`);
                                }
                            }

                            itemModel.deleteMany({ seller: googleUser.username }, function (err, result) {
                                if (err) console.log(err);
                            });
                        } catch (err) {
                            response.render('retrieving', { message: 'username or email is wrong' });
                        }

                        userGoogleModel.deleteOne({ _id: uId }, function (err, result) {
                            if (err) Console.log(err);
                            response.render('retrieving', { success_message: 'Account successfully deleted' });
                        });
                    } else {
                        response.render('retrieving', { message: 'username or email is wrong' });
                    }
                });
            }
        });
    } else {
        response.render('retrieving', { message: 'Fill out all fields' });
    }
});

/* GET password page - It will bring user to password page */
router.post('/update_password', function (req, res) {

    var usernameTry = req.body.username;
    var emailTry = req.body.email;


    userModel.findOne({ username: usernameTry, email: emailTry }, function (err, user) {
        if (err) console.log(err);
        if (user) {
            res.render('password', { user: user });
        } else {
            res.render('retrieving', { message: 'username or email is wrong' });
        }
    });
});

/* POST password page - It will bring user to password page */
router.post('/change_password', function (req, res) {

    var username = req.body.username;
    var email = req.body.email;
    var userId = req.body.id;
    var newPassword = req.body.password;

    userModel.findOne({ username: username, email: email }, function (err, user) {
        if (err) console.log(err);
        if (user) {
            if (req.body.password && req.body.repassword && req.body.password == req.body.repassword) {

                //Insert user
                bcrypt.hash(newPassword, 10, function (err, hash) {
                    var updateUser = {
                        username: username,
                        password: hash,
                        email: email
                    }
                    userModel.findOneAndUpdate({ _id: userId }, {
                        username: updateUser.username, email: updateUser.email, password: updateUser.password
                    }, function (err, model) {

                        if (err) console.log(err);
                            res.render('retrieving', { success_message: 'Password changed successfully' });
                    });
                });
            } else if (req.body.password != req.body.repassword) {
                res.render('password', { user: user, message: 'Password and repassword are not match' });
            } else {
                res.render('password', { user: user, message: 'Fill out all fields' });
            }
        } else { //never get this
            res.render('retrieving', { message: 'Fill out all fields' });
        }
    });
});

/*Get for login with google*/
//Try to login with passport(google)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }), function (req, res) {
});

router.get('/google/callback', passport.authenticate('google', {
    successRedirect: '/main',
    failureRedirect: '/home',
    failureMessage: 'Invalid Login'
}));

/* GET account page - It uses authenticat checking to avoid from showing the page withought logging in */
router.get('/account', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('account', { user: req.user });
    } else {
        res.redirect('/')
    }
});

/* POST account page - It will update the account information and also exchange the user's directory name */
router.post('/update_account', upload.single('image'), function Create(req, response) {
    if (req.isAuthenticated()) {
        if (req.body.username && req.body.email) {

            //Now I found what our instructor said in HTML course, what the value is for in fomrs!
            var newUsername = req.body.username;
            var newEmail = req.body.email;
            var userId = req.body.userId;
            var newImageData = req.body.iamge;
            var newImageContent = 'image/png';
            var newImageName = req.body.imageName;
            var picture = req.body.deletePic;

            userModel.findOne({ _id: userId }, function (err, mainUser) {
                if (err) console.log(err);
                if (mainUser) {
                    userModel.findOne({ username: newUsername }, function (err, user) {
                        if (err) console.log(err);
                        if (!user || (user && user.userId != userId)) {
                            userModel.findOne({ email: newEmail }, function (err, user1) {
                                if (err) console.log(err);
                                if (!user1 || (user1 && user1.userId != userId)) {
                                    userModel.findOneAndUpdate({ _id: userId }, {
                                        username: newUsername, email: newEmail, userId: userId
                                    }, function (err, user2) {
                                        if (err) console.log(err);
                                        if (user2) {
                                            userModel.findOne({ _id: userId }, function (err, newUser) {
                                                if (err) console.log(err);
                                                if (newUser) {
                                                    try {
                                                        itemModel.updateMany({ userId: userId }, { username: newUsername }, function (err, res) {
                                                            if (err) console.log(err);
                                                            const mainUserDirectory = './public/imageStorage/' + mainUser.username + '-' + userId;
                                                            if (fs.existsSync(mainUserDirectory)) {
                                                                const newUserDirectory = './public/imageStorage/' + newUser.username + '-' + userId;
                                                                fs.rename(mainUserDirectory, newUserDirectory, function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                    } else {
                                                                        console.log("Successfully renamed the directory.");
                                                                    }
                                                                });
                                                            }
                                                        });

                                                        // Checking for submition with/withought image - It is avoiding errors
                                                        if (req.file !== undefined) {
                                                            newImageData = './public/imageStorage/' + newUsername + '-' + userId + '/' + req.file.filename;
                                                            newImageContent = 'image/png';
                                                            newImageName = req.file.filename;
                                                            //Remove the local image in imageStorage if user check the delete image
                                                            userModel.findById(userId, function (err, foundUser) {
                                                                if (err) console.log(err);
                                                                //Remove the local image (from imageStorage folder)
                                                                fs.unlink(path.join('./public/imageStorage/' + foundUser.username + '-' + userId + '/' + foundUser.imageName), function (err) {
                                                                    if (err) console.log(err);
                                                                });
                                                            });

                                                            userModel.findOneAndUpdate({ _id: userId }, {
                                                                image: { data: newImageData, contenttype: newImageContent }, imageName: newImageName
                                                            }, function (err, user) {
                                                                    if (err) console.log(err);
                                                                    response.redirect('/account');
                                                            });
                                                        } else {
                                                            userModel.findById({ _id: userId }, function (err, foundUser) {
                                                                if (err) console.log(err);
                                                                if (foundUser !== null && picture != 'on') {
                                                                    newImageData = foundUser.image.data;
                                                                    newImageContent = foundUser.image.contenttype;
                                                                    newImageName = foundUser.imageName;
                                                                } else if (foundUser !== null && picture == 'on') {
                                                                    //Remove the local image in imageStorage
                                                                    userModel.findById(userId, function (err, foundUser) {
                                                                        if (err) console.log(err);
                                                                        //Remove the local image in imageStorage
                                                                        fs.unlink(path.join('./public/imageStorage/' + foundUser.username + '-' + foundUser._id + '/' +
                                                                            foundUser.imageName), function (err) {
                                                                                if (err) console.log(err);
                                                                                const localImageFolder = './public/imageStorage/' + foundUser.username + '-' + foundUser._id;
                                                                                if (fs.existsSync(localImageFolder)) {
                                                                                    fs.readdir(localImageFolder, function (err, file) {
                                                                                        if (err) console.log(err);
                                                                                        if (!file.length) {
                                                                                            try {
                                                                                                fs.rmdirSync(localImageFolder, { recursive: true });
                                                                                                console.log(` Direcrory ${localImageFolder} is deleted!`);
                                                                                            } catch (err) {
                                                                                                console.error(`Error while deleting ${localImageFolder}.`);
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                    });
                                                                } else {
                                                                    newImageData = null;
                                                                    newImageContent = null;
                                                                    newImageName = null;
                                                                }
                                                                userModel.findOneAndUpdate({ _id: userId }, {
                                                                    username: newUsername, email: newEmail,
                                                                    image: { data: newImageData, contenttype: newImageContent },
                                                                    imageName: newImageName, userId: userId
                                                                }, function (err, model) {
                                                                    if (err) console.log(err);
                                                                    response.redirect('/account');
                                                                });
                                                            });
                                                        }

                                                    } catch (error) {
                                                        response.render('account', { user: mainUser, message: err, message: error });
                                                    }
                                                } else {
                                                    response.render('account', { user: mainUser, message: 'Account information updated' });
                                                }
                                            });
                                        } else {
                                            response.render('account', { user: mainUser, message: 'Username/email already created' });
                                        }
                                    });                                   
                                } else {
                                    response.render('account', { user: mainUser, message: 'Username/email already created' });
                                }
                            });
                        } else {
                            response.render('account', { user: mainUser, message: 'Username/email already created' });
                        }
                    });
                }
            });
        } else { //never get this because of the form requirements
            response.render('password', { message: 'Fill out all fields' });
        }
    } else {
        response.redirect('/');
    }
});

/* POST password page - It will bring user to password page */
router.post('/change_password_account', function (req, res) {
    if (req.isAuthenticated()) {

        var username = req.body.username;
        var email = req.body.email;
        var userId = req.body.id;
        var newPassword = req.body.password;

        userModel.findOne({ username: username, email: email }, function (err, user) {
            if (err) console.log(err);
            if (user) {
                if (req.body.password && req.body.repassword && req.body.password == req.body.repassword) {

                    //Insert user
                    bcrypt.hash(newPassword, 10, function (err, hash) {
                        var updateUser = {
                            username: username,
                            password: hash,
                            email: email
                        }

                        userModel.findOneAndUpdate({ _id: userId }, {
                            username: updateUser.username, email: updateUser.email, password: updateUser.password }, function (err, model) {
                                if (err) console.log(err);
                                if (model) {
                                    res.render('account', { user: user, success_message: 'Password changed successfully' });
                                } else {
                                    res.render('retrieving', { message: 'Something went wrong' });
                                }
                        });
                    });
                } else if (req.body.password != req.body.repassword) {
                    res.render('account', { user: user, message: 'Password and repassword are not match' });
                } else { //never get this because of the form requirements
                    res.render('account', { user: user, message: 'Fill out all fields' });
                }
            } else {
                res.render('retrieving', { message: 'Something went wrong' });
            }
        });
    } else {
        res.redirect('/');
    }
});

/* GET activation page */
router.get('/activation/api/auth/verification/verify-account/:userId/:activationCode', function (req, res) {

    userModel.findOneAndUpdate({ _id: req.params.userId, activationCode: req.params.activationCode }, { active: true }, function (err, account) {
        if (err) console.log(err);
        if (account) {
            res.render('signup', { success_message: 'Account has activated' });
        }
    });
});

module.exports = router;
