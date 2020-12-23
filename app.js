'use strict';
var debug = require('debug');
var express = require('express');
var session = require('express-session');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var cookieSession = require('cookie-session');

const uri = "mongodb+srv://meisam:6465@cluster0-qjiac.mongodb.net/jikiki_seperate_users_final";

try {
    mongoose.connect(uri, { iseNewUrlParser: true });
    var db = mongoose.connection;
    db.on('error', function (err) {
        console.log(err);
    });
    db.once('open', function (callback) {

        console.log("Connected");
        console.log("-----------------------------------------");
    });
} catch (err) {
    console.log("Error : " + err);
}



var routes = require('./routes/index');
var userModel = require('./models/user');
var userGoogleModel = require('./models/user-google');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secrettexthere',
    saveUninitialized: true,
    resave: true
}));


//Init passport auth
app.use(passport.initialize());
app.use(passport.session());
app.use('/', routes);

//Serialize user
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

//deserialize user try to find username
passport.deserializeUser(function (id, done) {
    userModel.findById(id, function (err, user) {
        if (err) console.log(err);
        if (user) {
            done(err, user);
        } else {
            userGoogleModel.findById(id, function (err, user) {
                if (err) console.log(err);
                done(err, user);
            })
        }
    });
});

//Local strategy used for logging users
passport.use(new LocalStrategy(
    function (username, password, done) {
        userModel.findOne({ username: username }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            //Compare hashed passwords
            if (!bcrypt.compareSync(password, user.password)) {
                return done(null, false);
            }

            if (!user.active) {
                return done(null, false);
            }

            return done(null, user);
        });
    }
));

//Startegy for google accounts
passport.use(new GoogleStrategy({
    clientID: '666388657629-op2tb225or4co9o4cas8adarkpee28be.apps.googleusercontent.com',
    clientSecret: 'LAial6nMu9TuZkKwYNR-omTE',
    callbackURL: "https://jikiki.herokuapp.com/google/callback"
},
    function (accessToken, refreshToken, profile, done) {

        var emailArray = new Array();
        profile.emails.forEach((email) => {
            emailArray.push(email.value);
        })

        var photoArray = new Array();
        profile.photos.forEach((photo) => {
            photoArray.push(photo.value);
        })

        userGoogleModel.findOne({ $or: [{ oauthID: profile.id }, { email: { $in: emailArray } }] }, function (err, user) {
            if (err) {
                return console.log(err);
            }
            if (!err && user !== null) {
                console.log('---------------------Already user exists in userGoogleModel---------------------');
                return done(null, user);
            } else {

                userModel.findOne({ email: { $in: emailArray } }, function (err, user) {
                    if (err) {
                        return console.log(err);
                    }
                    if (!err && user !== null) {
                        console.log('---------------------Already user exists in userModel---------------------');
                       // return done(err);
                        done(null, false)
                    } else {

                        console.log('---------------------Creating a new user---------------------');

                        const user = new userGoogleModel({

                            username: profile.name.givenName,
                            oauthID: profile.id,
                            email: emailArray[0],
                            active: true,
                            imageAddress: photoArray[0]
                        });
                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                return done(null, user);
                            }
                        });
                    }
                });
            }
        });
    }
));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

