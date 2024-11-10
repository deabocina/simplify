export const getCurrentDate = () => {
  const date = new Date();

  const dayOfWeek = date.getDay();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const currentDay = daysOfWeek[dayOfWeek];

  return `${currentDay}, ${day}. ${month}. ${year}.`;
};
