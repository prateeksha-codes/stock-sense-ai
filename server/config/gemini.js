const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found. AI features will be disabled.');
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }
  return genAI.getGenerativeModel({ model: "gemini-pro" });
};

const isGeminiAvailable = () => genAI !== null;

module.exports = { getGeminiModel, isGeminiAvailable };