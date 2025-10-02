// MongoDB connection and schema setup for user registration, call data, and profile data
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/peapleDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  avatarUrl: String,
  peas: { type: Number, default: 0 },
  bio: { type: String, default: 'User' },
  profession: { type: String, default: 'User' },
});

const callDataSchema = new mongoose.Schema({
  user1: { type: String, required: true },
  user2: { type: String, required: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, required: true },
}, { collection: 'callData' });

// Ensure only one record per call (participants + start time)
callDataSchema.index({ user1: 1, user2: 1, dateTime: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
// Force collection name to 'callData' to match your desired naming
const CallData = mongoose.model('CallData', callDataSchema, 'callData');

module.exports = { User, CallData};
