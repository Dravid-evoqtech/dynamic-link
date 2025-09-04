import moment from 'moment-timezone';

export const notificationJobs = [
  {
    jobName: 'StartOfDay',
    type: 'device',
    cronExpr: '0 * * * *', // Every hour to cover all timezones
    targetLocalHour: 8, // 8 AM in user's local time
    message: {
      title: '🔥 Keep your streak!',
      body: `Don't forget to log today!`,
    },
    checkCondition: (token, localNow) => {
      // Only send if it's 8 AM in user's local time
      return localNow.hour() === 8;
    },
  },

  {
    jobName: 'EndOfDay',
    type: 'device',
    cronExpr: '0 * * * *', // Every hour to cover all timezones
    targetLocalHour: 20, // 8 PM in user's local time
    message: {
      title: 'Missed something today?',
      body: "You haven't opened the app today. Check new updates now! 💡",
    },
    checkCondition: (token, localNow) => {
      // Only send if it's 8 PM AND user hasn't opened app today
      if (localNow.hour() !== 20) return false;
      
      if (!token.lastOpenedAppAt) return true; // never opened before
      const startOfDay = localNow.clone().startOf('day');
      
      return moment(token.lastOpenedAppAt).isBefore(startOfDay); // hasn't opened today
    },
  },
];
