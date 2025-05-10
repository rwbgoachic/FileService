const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Writes a log entry for file operations
 * @param {string} user - The user performing the action
 * @param {string} filename - The name of the file being operated on
 * @param {string} action - The action being performed (e.g., 'upload', 'convert', 'download')
 */
function writeLog(user, filename, action) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | User: ${user} | File: ${filename} | Action: ${action}\n`;
  
  const logFile = path.join(logsDir, 'file-operations.log');
  
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Failed to write log entry:', error);
  }
}

/**
 * Uploads a file to S3
 * @param {Object} file - The file object to upload
 * @returns {Promise} - S3 upload promise
 */
const uploadFile = (file) => {
  return s3.upload({ 
    Bucket: "paysurity-phase1", 
    Key: file.name 
  }).promise();
};

module.exports = {
  writeLog,
  uploadFile
};