import "../styles/dashboard.css";
import "../styles/dashboard-list.css";
import { useState, useEffect } from "react";
import { icons } from "../assets/assets";
import { auth, db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

interface DashboardListProps {
  onLogout: () => void;
  userData: { name: string; surname: string } | null;
  listData: Array<{ id: string; name: string; colour?: string }>;
  tasks: {
    [listId: string]: Array<{
      id: string;
      name: string;
      startDate: Timestamp;
      startTime?: Timestamp | null;
    }>;
  };
  setListData: React.Dispatch<
    React.SetStateAction<Array<{ id: string; name: string; colour?: string }>>
  >;
  setTasks: React.Dispatch<
    React.SetStateAction<{
      [listId: string]: Array<{
        id: string;
        name: string;
        startDate: Timestamp;
        startTime?: Timestamp | null;
      }>;
    }>
  >;
  fetchUserData: () => void;
  fetchListsAndTasks: () => void;
  getTaskCountByList: (listId: string) => number;
}

const DashboardList = ({
  onLogout,
  listData,
  tasks,
  setListData,
  setTasks,
  fetchUserData,
  fetchListsAndTasks,
  getTaskCountByList,
}: DashboardListProps) => {
  const [listName, setListName] = useState<string>("");
  const [listColour, setlistColour] = useState<string>("#602d8b");

  useEffect(() => {
    fetchUserData();
    fetchListsAndTasks();
  }, []);

  const handleAddList = async () => {
    if (!listName || !listColour) {
      return;
    }
    try {
      const addListDoc = await addDoc(
        collection(db, "users", auth.currentUser!.uid, "lists"),
        {
          name: listName,
          colour: listColour,
        }
      );
      setListData([
        ...listData,
        { id: addListDoc.id, name: listName, colour: listColour },
      ]);
      setListName("");
    } catch (error) {
      console.log(`Error adding new list: ${error}`);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const tasksDoc = await getDocs(
        collection(db, "users", auth.currentUser!.uid, "lists", listId, "tasks")
      );
      const deleteTasks = tasksDoc.docs.map((task) => deleteDoc(task.ref));
      await Promise.all(deleteTasks);

      await deleteDoc(doc(db, "users", auth.currentUser!.uid, "lists", listId));
      setListData(listData.filter((list) => list.id !== listId));

      const updatedTasks = { ...tasks };
      delete updatedTasks[listId]; // Delete list tasks from local state
      setTasks(updatedTasks);
    } catch (error) {
      console.log(`Error deleting list: ${error}`);
    }
  };

  const getTaskOverview = () => {
    const totalLists = listData.length;
    const totalTasks = Object.values(tasks).reduce(
      (count, taskList) => count + taskList.length,
      0
    );
    const avgTasks = totalLists > 0 ? (totalTasks / totalLists).toFixed(1) : 0;

    return { totalLists, totalTasks, avgTasks };
  };

  const { totalLists, totalTasks, avgTasks } = getTaskOverview();

  return (
    <div className="task-options">
      <div className="user-profile">
        <img src={icons.logo} id="logo-img" />
        <img src={icons.logout} id="logout-img" onClick={onLogout}></img>
      </div>

      <h3>My Lists</h3>
      <p className="dashboard-note">
        Every great plan starts with a list — make yours below
      </p>

      {listData.map((list) => (
        <p key={list.id} className="list-info">
          <div className="list-details">
            <div
              className="colour-icon"
              style={{ backgroundColor: list.colour }}
              title={list.colour}
            ></div>
            <p>{list.name}</p>
            <p className="counter-style">{getTaskCountByList(list.id)}</p>
            <img
              src={icons.close}
              className="option-icon"
              onClick={() => handleDeleteList(list.id)}
            />
          </div>
        </p>
      ))}
      <div className="new-list">
        <img
          src={icons.add}
          onClick={handleAddList}
          className="option-icon"
        ></img>

        <input
          type="color"
          value={listColour}
          onChange={(e) => setlistColour(e.target.value)}
        ></input>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (listName.trim()) {
                handleAddList();
                setListName("");
              }
            }
          }}
          className="register-input"
          placeholder="Create new list.."
        />
      </div>

      <div className="task-overview">
        <h3>Task Overview</h3>
        <div className="overview-stats">
          <div className="overview-box">
            <span className="overview-number">{totalLists}</span>
            <span className="overview-label">Lists</span>
          </div>
          <div className="overview-box">
            <span className="overview-number">{totalTasks}</span>
            <span className="overview-label">Total Tasks</span>
          </div>
          <div className="overview-box">
            <span className="overview-number">{avgTasks}</span>
            <span className="overview-label">Avg. per List</span>
          </div>
        </div>

        <p className="overview-text">
          {totalTasks === 0
            ? "You don’t have any tasks yet — time to get started!"
            : totalTasks < 5
            ? "Nice and light workload — keep up the balance"
            : totalTasks < 15
            ? "You're managing quite a few tasks, stay focused"
            : "Whoa! You’re in productivity overdrive"}
        </p>
      </div>
    </div>
  );
};

export default DashboardList;
