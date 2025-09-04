import moment from 'moment-timezone';

// Test configuration - runs every 2 minutes for quick testing
export const testNotificationJobs = [
  {
    jobName: 'StartOfDay',
    type: 'device',
    cronExpr: '*/2 * * * *', // Every 2 minutes for testing
    targetLocalHour: new Date().getHours(), // Current hour for immediate testing
    message: {
      title: '🔥 TEST: Keep your streak!',
      body: `Test notification - Don't forget to log today!`,
    },
    checkCondition: (token, localNow) => {
      // For testing: send if current minute is even (0, 2, 4, 6...)
      return localNow.minute() % 2 === 0;
    },
  },

  {
    jobName: 'EndOfDay',
    type: 'device',
    cronExpr: '*/2 * * * *', // Every 2 minutes for testing
    targetLocalHour: new Date().getHours(), // Current hour for immediate testing
    message: {
      title: 'TEST: Missed something today?',
      body: "Test notification - Check new updates now! 💡",
    },
    checkCondition: (token, localNow) => {
      // For testing: send if current minute is odd (1, 3, 5, 7...)
      const isOddMinute = localNow.minute() % 2 === 1;
      
      // if (!isOddMinute) return false;
      
      if (!token.lastOpenedAppAt) return true; // never opened before
      const startOfDay = localNow.clone().startOf('day');
      
      return moment(token.lastOpenedAppAt).isBefore(startOfDay); // hasn't opened today
    },
  },
];
