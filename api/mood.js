// Vercel Serverless Function for mood data storage
// This allows multiple users to share mood information

// Note: This uses in-memory storage which works within the same runtime.
// For production with multiple serverless instances, use Vercel KV, MongoDB, or Supabase

// Global data store (persists within the same Node.js runtime)
if (typeof global.dataStore === 'undefined') {
  global.dataStore = new Map();
}

// Helper function to get or create room data
function getRoomData(roomId) {
  if (!global.dataStore.has(roomId)) {
    global.dataStore.set(roomId, {
      moodHistory: [],
      stats: {
        messages: 0,
        hugs: 0,
        kisses: 0,
        moodCounts: {}
      },
      lastUpdated: new Date().toISOString()
    });
  }
  return global.dataStore.get(roomId);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get roomId and userId from query or body
  const roomId = req.query.roomId || req.body?.roomId || 'default-room';
  const userId = req.query.userId || req.body?.userId || 'user1';

  if (req.method === 'GET') {
    // Get mood data for the room
    const roomData = getRoomData(roomId);
    
    // Get partner's latest mood (latest entry from the other user)
    const partnerMood = roomData.moodHistory.find(entry => entry.sender !== userId) || null;
    
    return res.status(200).json({
      success: true,
      data: {
        moodHistory: roomData.moodHistory,
        stats: roomData.stats,
        lastUpdated: roomData.lastUpdated,
        partnerMood: partnerMood
      }
    });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      // Handle different body formats
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }
      if (!body || typeof body !== 'object') {
        body = {};
      }
      
      const { mood, message, type, responseType, emoji, label, sender } = body;
      
      if (!mood && !responseType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const roomData = getRoomData(roomId);
      
      // Create mood entry
      const moodEntry = {
        mood: mood || null,
        emoji: emoji || '😊',
        label: label || '情绪',
        message: message || '',
        type: type || 'mood',
        responseType: responseType || null,
        timestamp: new Date().toISOString(),
        sender: sender || userId
      };

      // Add to history
      roomData.moodHistory.unshift(moodEntry);
      
      // Keep only last 100 entries to prevent memory issues
      if (roomData.moodHistory.length > 100) {
        roomData.moodHistory = roomData.moodHistory.slice(0, 100);
      }

      // Update stats
      if (type === 'mood' && mood) {
        roomData.stats.messages++;
        if (roomData.stats.moodCounts[mood]) {
          roomData.stats.moodCounts[mood]++;
        } else {
          roomData.stats.moodCounts[mood] = 1;
        }
      } else if (responseType === 'hug') {
        roomData.stats.hugs++;
      } else if (responseType === 'kiss') {
        roomData.stats.kisses++;
      }

      roomData.lastUpdated = new Date().toISOString();
      global.dataStore.set(roomId, roomData);

      return res.status(200).json({
        success: true,
        data: moodEntry,
        message: 'Mood saved successfully'
      });
    } catch (error) {
      console.error('Error saving mood:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save mood: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

