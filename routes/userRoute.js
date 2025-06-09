const express = require('express');
const Router = express.Router();
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const User = require('../models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// User signup route
// This route allows a new user to sign up by providing their channel name, email, password, phone number, and logo image.
Router.post('/signup', async (req, res) => {
    try {
        const usersExist = await User.find({ email: req.body.email })
        if (usersExist.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const uploadedImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath)

        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            channelName: req.body.channelName,
            email: req.body.email,
            password: hashedPassword,
            phone: req.body.phone,
            logoUrl: uploadedImage.secure_url,
            logoId: uploadedImage.public_id
        })

        const user = await newUser.save();
        res.status(201).json({
            newUser: user
        })

    } catch (error) {
        console.log("Error in signup", error);
        res.status(500).json({ message: "Internal Server Error" });

    }

})

// User login route
// This route allows an existing user to log in by providing their email and password.
Router.post('/login', async (req, res) => {

    try {
        // console.log(req.body);
        const users = await User.find({ email: req.body.email })
        //console.log(users);
        if (users.length == 0) {
            return res.status(500).json({
                message: "email not registered"
            })
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, users[0].password,);
        //console.log(isPasswordValid)
        if (!isPasswordValid) {
            return res.status(500).json({
                message: "Invalid Password"
            })
        }

        const token = jwt.sign({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logoId: users[0].logoId
        },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRATION }
        );
        res.status(200).json({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logoUrl: users[0].logoUrl,
            logoId: users[0].logoId,
            token: token,
            subscribers: users[0].subscribers,
            subscribedChannels: users[0].subscribedChannels,
            message: "Login Successful"
        });

    } catch (error) {
        console.log("Error in login", error);
        res.status(500).json({ message: "Internal Server Error" });

    }

})

//subscribe to channel
Router.put('/subscribe/:userBId', checkAuth, async (req, res) =>{
try{
     const userA = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
     console.log('User A:', userA);

    const userB = await User.findById(req.params.userBId);
     console.log('User B:', userB);

     if(userB.subscribedBy.includes(userA._id)) {
         return res.status(400).json({ message: 'You are already subscribed to this channel' });
     }
     userB.subscribers += 1;
        userB.subscribedBy.push(userA._id);
        await userB.save();
        const userAFullInformation = await User.findById(userA._id)
        userAFullInformation.subscribedChannels.push(userB._id);
        await userAFullInformation.save();
        return res.status(200).json({
            message: 'Subscription successful',
            userB: userB
        });

    } catch (error) {
        console.log("Error in subscription", error);
        res.status(500).json({ message: "Internal Server Error" });

    }
})

//unsubscribe to channel
Router.put('/unsubscribe/:userBId', checkAuth, async (req, res) =>{
    try{
         const userA = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
         console.log('User A:', userA);

        const userB = await User.findById(req.params.userBId);
         console.log('User B:', userB);

         if(userB.subscribedBy.includes(userA._id)) {
             userB.subscribers -= 1;
          userB.subscribedBy = userB.subscribedBy.filter(userId => userId.toString() !== userA._id);
            await userB.save();
         const userAFullInformation = await User.findById(userA._id);
            userAFullInformation.subscribedChannels = userAFullInformation.subscribedChannels.filter(userId => userId.toString() !== userB._id);
            await userAFullInformation.save();

            return res.status(200).json({
                message: 'Unsubscription successful',
                userB: userB
            });
         }
         else{
            return res.status(400).json({ message: 'You are not subscribed to this channel' });
         }
         

        } catch (error) {
            console.log("Error in unsubscription", error);
            res.status(500).json({ message: "Internal Server Error" });

        }
    })

    

module.exports = Router;