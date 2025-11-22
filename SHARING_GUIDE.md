# Sharing Guide - Love Pulse 💕

## How to Share with Friends

Your Love Pulse app now supports real-time sharing! Multiple users can see each other's moods and messages when they use the same **Room ID**.

### Quick Start

1. **Open the app** on your device
2. **Go to Settings** (scroll down to the settings section)
3. **Find "房间ID (与朋友共享此ID)"** (Room ID - Share with Friends)
4. **Set a Room ID** - Choose any name (e.g., "love-room-2024")
5. **Share this Room ID** with your friend
6. **Your friend should enter the same Room ID** in their settings
7. **Start sharing!** - Your moods and messages will now sync in real-time

### How It Works

- **Room ID**: A shared identifier that connects you and your friend. Both users must use the same Room ID.
- **User ID**: Automatically assigned to distinguish between you and your friend. This is read-only.
- **Real-time Sync**: The app automatically fetches updates every 5 seconds from the server.
- **Offline Support**: Your data is still saved locally, so you can use the app offline. When you come back online, it will sync automatically.

### Important Notes

⚠️ **Current Storage**: The app uses in-memory storage on the server. This means:
- Data persists while the server is running
- If the server restarts, data may be lost
- For production use, consider upgrading to a database (Vercel KV, MongoDB, or Supabase)

✅ **Best Practices**:
- Use a unique Room ID that only you and your friend know
- Make sure both users are using the same Room ID
- Check your internet connection if sync fails
- Your local data is always saved as a backup

### Troubleshooting

**Problem**: Can't see friend's moods
- **Solution**: Make sure both users have the same Room ID in settings
- **Solution**: Check internet connection
- **Solution**: Refresh the page

**Problem**: Data not syncing
- **Solution**: Check browser console for errors
- **Solution**: Verify the API endpoint is accessible
- **Solution**: Try changing the Room ID and setting it again

### Technical Details

- **API Endpoint**: `/api/mood`
- **Sync Interval**: 5 seconds
- **Storage**: In-memory (server-side) + localStorage (client-side backup)
- **CORS**: Enabled for all origins

---

Enjoy sharing your love with your friends! 💕

