const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
     title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    video_url: {
        type: String,
        required: true
    },
    video_id: {
        type: String,
        required: true
    },
    thumbnail_url: {
        type: String,
        required: true
    },
    thumbnail_id: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
   /* viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
*/
    likeBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikeBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

}, { timestamps: true });


module.exports = mongoose.model('Video', videoSchema);