// MongoDB connection and schema setup for user registration, call data, and profile data
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/peapleDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  avatarUrl: String,
});

const callDataSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  callTime: Date,
  duration: Number,
  details: String,
});

const profileSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  bio: String,
  avatarUrl: String,
  otherInfo: String,
});

const User = mongoose.model('User', userSchema);
const CallData = mongoose.model('CallData', callDataSchema);
const Profile = mongoose.model('Profile', profileSchema);

module.exports = { User, CallData, Profile };
