// utils/sessionCleanup.js
import Session from '../models/Session.js';

export const updateSessionStatuses = async () => {
  try {
    const now = new Date();
    const today = new Date(now.toDateString());
    
    // Update past confirmed sessions to completed
    await Session.updateMany(
      {
        status: 'confirmed',
        sessionDate: { $lt: today }
      },
      {
        status: 'completed'
      }
    );
    
    console.log('Session statuses updated successfully');
  } catch (error) {
    console.error('Error updating session statuses:', error);
  }
};

// Run on server start and schedule daily
updateSessionStatuses();
setInterval(updateSessionStatuses, 24 * 60 * 60 * 1000); // Daily

