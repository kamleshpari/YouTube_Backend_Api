const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    video_id: {
        type: String,
        required: true
    },
    commentText: {
        type: String,
        required: true
    },


}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);