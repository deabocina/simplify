import { Timestamp } from "firebase/firestore";

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

export const formatDateTime = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (hours === "00" && minutes === "00") {
    return `${day}.${month}.${year}.`;
  } else {
    return `${day}.${month}.${year}. ${hours}:${minutes}`;
  }
};

export const checkDate = (date: Date | Timestamp) => {
  const dbDate = date instanceof Timestamp ? date.toDate() : date;
  const today = new Date();

  const todayStart = new Date(
    today.getDate(),
    today.getMonth(),
    today.getFullYear()
  );
  const tomorrowStart = new Date(
    today.getDate() + 1,
    today.getMonth(),
    today.getFullYear()
  );

  if (dbDate.getHours() === 0 && dbDate.getMinutes() === 0) {
    if (
      dbDate.getDate() === todayStart.getDate() &&
      dbDate.getMonth() === todayStart.getMonth() &&
      dbDate.getFullYear() === todayStart.getFullYear()
    ) {
      return `Today`;
    } else if (
      dbDate.getDate() === tomorrowStart.getDate() &&
      dbDate.getMonth() === tomorrowStart.getMonth() &&
      dbDate.getFullYear() === tomorrowStart.getFullYear()
    ) {
      return `Tomorrow`;
    } else {
      return formatDateTime(dbDate);
    }
  }

  if (
    dbDate.getDate() === todayStart.getDate() &&
    dbDate.getMonth() === todayStart.getMonth() &&
    dbDate.getFullYear() === todayStart.getFullYear()
  ) {
    return `Today, ${dbDate.getHours().toString().padStart(2, "0")}:${dbDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else if (
    dbDate.getDate() === tomorrowStart.getDate() &&
    dbDate.getMonth() === tomorrowStart.getMonth() &&
    dbDate.getFullYear() === tomorrowStart.getFullYear()
  ) {
    return `Tomorrow, ${dbDate.getHours().toString().padStart(2, "0")}:${dbDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else {
    return formatDateTime(dbDate);
  }
};
