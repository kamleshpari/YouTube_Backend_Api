const express = require('express');
const Router = express.Router();
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const checkAuth = require('../middleware/checkAuth');
const jwt = require('jsonwebtoken');


Router.post('/new-comment/:videoId',checkAuth, async (req, res) => {
    try {
        // Here you would typically save the comment to the database
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        console.log("add comment",verifiedUser);
        const newComment= new Comment({
            _id: new mongoose.Types.ObjectId(),
            video_id: req.params.videoId,
            user_id: verifiedUser._id,
            commentText: req.body.commentText
        })

        const comment= await newComment.save();
        res.status(201).json({ message: 'Comment added successfully',
            newComment: comment });


    } catch (error) {
       
        res.status(500).json({ error: 'Failed to add comment' });
    }
});


// Get comments for a video
Router.get('/:videoId', async (req, res) => {
    try {
    const comments=  await  Comment.find({ video_id: req.params.videoId })
    .populate('user_id','channelName logoUrl') // Populate user_id with username
    res.status(200).json({
        message: 'Comments fetched successfully',
        comments: comments
    });
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
        
    }
})

//update comment

Router.put('/:commentId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        const comment = await Comment.findById(req.params.commentId);
        
        if (comment.user_id != verifiedUser._id) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        comment.commentText = req.body.commentText 
        const updatedComment = await comment.save();
        res.status(200).json({
            message: 'Comment updated successfully',
            updatedComment: updatedComment
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update comment' });
        
    }
})

// Delete comment
Router.delete('/:commentId', checkAuth, async (req, res) => {
    try {
        const verifiedUser = await jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET_KEY);
        const comment = await Comment.findById(req.params.commentId);
        
        if (comment.user_id != verifiedUser._id) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        await Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json({
            message: 'Comment deleted successfully',

        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment' });

    }
})




module.exports = Router;