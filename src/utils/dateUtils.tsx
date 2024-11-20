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

  if (hours === "01" && minutes === "00") {
    return `${day}.${month}.${year}.`;
  } else {
    return `${day}.${month}.${year}. ${hours}:${minutes}`;
  }
};

export const checkDate = (
  date: Timestamp | Date,
  time?: Timestamp | Date | null
) => {
  const dbDate = date instanceof Timestamp ? date.toDate() : new Date(date);
  const dbTime = time
    ? time instanceof Timestamp
      ? time.toDate()
      : new Date(time)
    : null;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = dbDate.toDateString() === today.toDateString();
  const isTomorrow = dbDate.toDateString() === tomorrow.toDateString();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (isToday) {
    return dbTime
      ? `Today, ${dbTime.toLocaleTimeString([], timeOptions)}`
      : `Today`;
  } else if (isTomorrow) {
    return dbTime
      ? `Tomorrow, ${dbTime.toLocaleTimeString([], timeOptions)}`
      : `Tomorrow`;
  }

  return dbTime
    ? `${formatDateTime(dbDate)} ${dbTime.toLocaleTimeString([], timeOptions)}`
    : `${formatDateTime(dbDate)}`;
};
