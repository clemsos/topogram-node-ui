var mongoose=require("mongoose");
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt'); 
var mongodbOptions = { };
var secretToken='aMdoeb5ed87zorRdkD6greDML81DcnrzeSD648ferFejmplx';

var mongodbURL = 'mongodb://localhost/haha';
var SALT_WORK_FACTOR=10;
var INVITE_CODE="AreYouInvited";

mongoose.connect(mongodbURL, mongodbOptions, function (err, res) {
    if (err) { 
        console.log('Connection refused to ' + mongodbURL);
        console.log(err);
    } else {
        console.log('Connection successful to: ' + mongodbURL);
    }
});

var Schema = mongoose.Schema;

// User schema
var User = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true}
});
 
// Bcrypt middleware on UserSchema
User.pre('save', function(next) {
  var user = this;
 
  if (!user.isModified('password')) return next();
 
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
 
    bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
    });
  });
});
 
//Password verification
User.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(isMatch);
    });
};

var userModel = mongoose.model('User', User);

exports.login = function(req, res) {
    var username = req.body.username || '';
    var password = req.body.password || '';
    console.log(username,password);
 
    if (username == '' || password == '') {
        return res.send(401);
    }
 
    userModel.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.send(401);
        }
 
        user.comparePassword(password, function(isMatch) {
            console.log(isMatch);
            if (!isMatch) {
                console.log("Attempt failed to login with " + user.username);
                return res.send(401);
            }
 
            var token = jwt.sign(user, secretToken, { expiresInMinutes: 60 });
 
            return res.json({token:token});
        });
 
    });
};


exports.logout = function(req, res) {
    if (req.user) {
        tokenManager.expireToken(req.headers);

        delete req.user;    
        return res.send(200);
    }
    else {
        return res.send(401);
    }
}

exports.register = function(req, res) {
    var username = req.body.username || '';
    var password = req.body.password || '';
    var passwordConfirmation = req.body.passwordConfirmation || '';
    var inviteCode = req.body.password || '';

    if (username == '' || password == '' || password != passwordConfirmation || inviteCode) {
        return res.send(400);
    }

    console.log(inviteCode);
    if(inviteCode != INVITE_CODE) return res.send(400);

    var user = new userModel();
    user.username = username;
    user.password = password;
    // console.log(username,password);

    user.save(function(err) {
        if (err) {
            console.log(err);
            return res.send(500);
        }   

        userModel.count(function(err, counter) {
            if (err) {
                console.log(err);
                return res.send(500);
            }

            if (counter == 1) {
                userModel.update({username:user.username}, {is_admin:true}, function(err, nbRow) {
                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }

                    console.log('First user created as an Admin');
                    return res.send(200);
                });
            } 
            else {
                return res.send(200);
            }
        });
    });
}