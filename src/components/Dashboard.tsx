import "../styles/dashboard.css";
import { useState, useEffect } from "react";
import { checkDate } from "../utils/dateUtils";
import { auth, db } from "../config/firebase";
import { Timestamp } from "firebase/firestore";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import DashboardList from "./DashboardList";
import DashboardTask from "./DashboardTask";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [userData, setUserData] = useState<{
    name: string;
    surname: string;
  } | null>(null);
  const [listData, setListData] = useState<
    Array<{ id: string; name: string; colour?: string }>
  >([]);
  const [tasks, setTasks] = useState<{
    [listId: string]: Array<{
      id: string;
      name: string;
      startDate: Timestamp;
      startTime?: Timestamp | null;
    }>;
  }>({});

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as { name: string; surname: string };
          setUserData(data);
        }
      }
    } catch (error) {
      console.log(`Error fetching user data: ${error}`);
    }
  };

  const fetchListsAndTasks = async () => {
    try {
      const listDocs = await getDocs(
        collection(db, "users", auth.currentUser!.uid, "lists")
      );
      const fetchedLists = listDocs.docs.map((list) => ({
        id: list.id,
        ...list.data(),
      })) as Array<{ id: string; name: string; colour: string }>;

      const listsWithTasks: {
        [listId: string]: {
          id: string;
          name: string;
          startDate: Timestamp;
          startTime: Timestamp | null;
        }[]; // Create an empty object for tasks by listId
      } = {};

      await Promise.all(
        fetchedLists.map(async (list) => {
          const taskDoc = await getDocs(
            collection(
              db,
              "users",
              auth.currentUser!.uid,
              "lists",
              list.id,
              "tasks"
            )
          );
          const fetchedTasks = taskDoc.docs.map((task) => {
            const startDate =
              task.data().startDate instanceof Timestamp
                ? task.data().startDate.toDate()
                : new Date(task.data().startDate);
            const startTime = task.data().startTime
              ? task.data().startTime instanceof Timestamp
                ? task.data().startTime.toDate()
                : new Date(task.data().startTime)
              : null;

            return {
              id: task.id,
              name: task.data().name,
              startDate,
              startTime,
              formattedDate: checkDate(startDate, startTime),
            };
          });

          listsWithTasks[list.id] = fetchedTasks;
        })
      );

      setListData(fetchedLists);
      setTasks(listsWithTasks);
    } catch (error) {
      console.log(`Error fetching lists: ${error}`);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchListsAndTasks();
  }, []);

  const getTaskCountByList = (listId: string): number => {
    return tasks[listId]?.length || 0;
  };

  return (
    <div className="task-container">
      <DashboardList
        onLogout={onLogout}
        userData={userData}
        listData={listData}
        tasks={tasks}
        setListData={setListData}
        setTasks={setTasks}
        fetchUserData={fetchUserData}
        fetchListsAndTasks={fetchListsAndTasks}
        getTaskCountByList={getTaskCountByList}
      />
      <DashboardTask
        userData={userData}
        listData={listData}
        tasks={tasks}
        setTasks={setTasks}
        fetchUserData={fetchUserData}
        fetchListsAndTasks={fetchListsAndTasks}
        getTaskCountByList={getTaskCountByList}
      />
    </div>
  );
};

export default Dashboard;
