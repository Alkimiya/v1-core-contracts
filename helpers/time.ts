// function getCurrentDateInUtc() {
//     var now: Date = new Date();
//     var utc = new Date(now.getTime());
//     return utc;
// };

// function getCurrentDay() {
//     return  Math.floor(getTimestamp() / (24 * 60 * 60));
// };

/// Return X days after today, using days unit (time since epoch in days)
function getXDaysAfterToday(numDays: number) {
  const date: Date = new Date();
  return Math.floor(date.getTime() / 8.64e7) + numDays;

  // @TODO: INVESTIGATE WHY setDate SOMETIMES JUMPS AN HOUR
  // EX:
  // 2021-11-06T23:33:00.521Z (DAY3)
  // 2021-11-08T00:33:00.523Z (DAY4)
  // Translates to 18937 (correct) and 18939 (wrong - should be 18938)

  // date.setDate(date.getDate() + numDays);
  // return Math.floor(date.getTime() / 8.64e7);
}

/// Return time since epoch in seconds X days after today
function getTimestampXDaysAfterToday(numDays: number) {
  var date: Date = new Date();
  date.setDate(date.getDate() + numDays);
  return Math.floor(date.getTime() / 1000);
}

/// Returns time since epoch in seconds. Blocktime is handled in seconds
// function getTimestamp() {
//     return Math.floor(Date.now() / 1000);
// }

export { getXDaysAfterToday, getTimestampXDaysAfterToday };
