const express = require('express');
const Router = express.Router();
const checkAuth = require('../middleware/checkAuth')
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Video = require('../models/Video');
const mongoose = require('mongoose');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


Router.post('/upload', checkAuth, async (req, res) => {
    // Handle video upload logic here
    try {
        const token = req.headers.authorization.split(" ")[1];
        const user = await jwt.verify(token, process.env.JWT_SECRET_KEY);

        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: 'video',
            //public_id: `videos/${user._id}/${Date.now()}`
        });
        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);

        const newVideo = new Video({
            _id: new mongoose.Types.ObjectId,
            title: req.body.title,
            description: req.body.description,
            video_url: uploadedVideo.secure_url,
            video_id: uploadedVideo.public_id,
            thumbnail_url: uploadedThumbnail.secure_url,
            thumbnail_id: uploadedThumbnail.public_id,
            user_id: user._id,
            category: req.body.category,
            tags: req.body.tags.split(','),
        });
        const newUploadedVideoData = await newVideo.save();

        return res.status(201).json({
            message: 'Video uploaded successfully',
            video: newUploadedVideoData
        });

    } catch (error) {
       
        return res.status(500).json({ message: 'Internal Server Error' });
    }

});

//update video details

Router.put('/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        //console.log('Verified User:', verifiedUser);
        const video = await Video.findById(req.params.videoId)
        //console.log('Video ID Verify:', video);

        if (video.user_id == verifiedUser._id) {
            // Update video details
            if (req.files) {
                // Handle video and thumbnail updates
                await cloudinary.uploader.destroy(video.thumbnail_id);
                const updatedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    thumbnail_url: updatedThumbnail.secure_url,
                    thumbnail_id: updatedThumbnail.public_id,
                    category: req.body.category,
                    tags: req.body.tags.split(','),
                }
                const upDatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true });
                return res.status(200).json({
                    message: 'Video details updated successfully',
                    updatedVideo: upDatedVideoDetail
                });

            } else {
                const updatedData = {
                    title: req.body.title,
                    description: req.body.description,
                    category: req.body.category,
                    tags: req.body.tags.split(','),
                }
                const upDatedVideoDetail = await Video.findByIdAndUpdate(req.params.videoId, updatedData, { new: true });
                return res.status(200).json({
                    message: 'Video details updated successfully',
                    updatedVideo: upDatedVideoDetail
                });
            }
        }
        else {
            return res.status(403).json({ message: 'You are not authorized to update this video' });
        }

    } catch (error) {
        
        return res.status(500).json({
            error: error
        });
    }
})

//delete video
Router.delete('/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        //console.log('Verified User:', verifiedUser);
        const video = await Video.findById(req.params.videoId);

        if (video.user_id == verifiedUser._id) {
            //delete video thubnail and data from database
            await cloudinary.uploader.destroy(video.video_id, { resource_type: 'video' });
            await cloudinary.uploader.destroy(video.thumbnail_id);
            const deletedResponse = await Video.findByIdAndDelete(req.params.videoId);
            return res.status(200).json({
                message: 'Video deleted successfully',
                deletedVideo: deletedResponse
            });

        } else {
            return res.status(403).json({ message: 'You are not authorized to delete this video' });
        }

    } catch (error) {
        
        return res.status(500).json({
            error: "invalid video id or user not authorized"
        });

    }
})

//like api
Router.put('/like/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        console.log('Verified User:', verifiedUser);
        const video = await Video.findById(req.params.videoId);
        console.log('Video ID Verify:', video);
        if (video.likeBy.includes(verifiedUser._id)) {
            return res.status(400).json({ message: 'You have already liked this video' });
        }

        if (video.dislikeBy.includes(verifiedUser._id)) {
            video.dislikes -= 1;
            video.dislikeBy = video.dislikeBy.filter(userId => userId.toString() !== verifiedUser._id);
        }


        video.likes += 1;
        video.likeBy.push(verifiedUser._id);
        await video.save();
        return res.status(200).json({
            message: 'Video liked successfully',
            video: video
        });

    } catch (error) {
       
        return res.status(500).json({
            error: error
        });

    }
})

//dislike api

Router.put('/dislike/:videoId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        console.log('Verified User:', verifiedUser);
        const video = await Video.findById(req.params.videoId);
        console.log('Video ID Verify:', video);
        if (video.dislikeBy.includes(verifiedUser._id)) {
            return res.status(400).json({ message: 'You have already disliked this video' });
        }


        if (video.likeBy.includes(verifiedUser._id)) {
            video.likes -= 1;
            video.likeBy = video.likeBy.filter(userId => userId.toString() !== verifiedUser._id);
        }

        video.dislikes += 1;
        video.dislikeBy.push(verifiedUser._id);
        await video.save();

        return res.status(200).json({
            message: 'Video disliked successfully',
            video: video
        });

    } catch (error) {
        
        return res.status(500).json({
            error: error
        });

    }
})

//view video api
Router.put('/view/:videoId', async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId);
        console.log('Video ID Verify:', video);
        video.views += 1;
        await video.save();
        return res.status(200).json({
            message: 'Video viewed successfully',

        });
    } catch (error) {
        
        return res.status(500).json({ message: 'Internal Server Error' });

    }
})


module.exports = Router;