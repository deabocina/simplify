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
  updateDoc,
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
  userData,
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
  const [isOptionsVisible, setIsOptionsVisible] = useState<string | null>(null);
  const [updateListName, setUpdateListName] = useState<string>("");
  const [updateListColour, setUpdateListColour] = useState<string>("");

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

  const handleUpdateList = async (
    listId: string,
    newName?: string,
    newColour?: string
  ) => {
    const currentList = listData.find((list) => listId === list.id);
    if (!currentList) {
      console.error(`List not found.`);
      return;
    }

    // Check current values
    const updatedName = newName || currentList.name;
    const updatedColour = newColour || currentList.colour;

    try {
      await updateDoc(
        doc(db, "users", auth.currentUser!.uid, "lists", listId),
        {
          name: updatedName,
          colour: updatedColour,
        }
      );
      setListData(
        listData.map((list) =>
          list.id === listId
            ? { ...list, name: updatedName, colour: updatedColour }
            : list
        )
      );
    } catch (error) {
      console.log(`Error updating list: ${error}`);
    }
  };

  return (
    <div className="task-options">
      <div className="user-profile">
        <img src={icons.logo} id="logo-img" />
        <div className="user-info">
          <h2>Simplify</h2>
          {userData && (
            <p className="text-colour">
              {userData.name} {userData.surname}
            </p>
          )}
        </div>
        <img src={icons.logout} id="logout-img" onClick={onLogout}></img>
      </div>
      <div className="line-style"></div>

      <h3>My Lists</h3>
      {listData.map((list) => (
        <p key={list.id} className="list-info">
          <img
            src={icons.options}
            onClick={() =>
              setIsOptionsVisible(isOptionsVisible === list.id ? null : list.id)
            }
          />
          {isOptionsVisible === list.id ? (
            <ul className="options-button">
              <li>
                <img
                  src={icons.edit}
                  className="option-icon"
                  onClick={() => setUpdateListName(list.name)}
                />
                <button onClick={() => setUpdateListName(list.name)}>
                  Edit
                </button>
              </li>
              <li>
                <img
                  src={icons.close}
                  className="option-icon"
                  onClick={() => handleDeleteList(list.id)}
                />
                <button onClick={() => handleDeleteList(list.id)}>
                  Delete
                </button>
              </li>
            </ul>
          ) : null}

          {updateListName && isOptionsVisible === list.id ? (
            <div>
              <input
                type="color"
                value={updateListColour || list.colour}
                onChange={(e) => setUpdateListColour(e.target.value)}
                onBlur={() => {
                  handleUpdateList(list.id, updateListName, updateListColour);
                  setUpdateListColour("");
                }}
              />
              <input
                type="text"
                value={updateListName || list.name}
                onChange={(e) => setUpdateListName(e.target.value)}
                className="register-input"
                onBlur={() => {
                  handleUpdateList(list.id, updateListName, updateListColour);
                  setUpdateListName("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateList(list.id, updateListName, updateListColour);
                    setUpdateListName("");
                    setIsOptionsVisible(null);
                  }
                }}
              />
            </div>
          ) : (
            <div className="list-details">
              <div
                className="colour-icon"
                style={{ backgroundColor: list.colour }}
                title={list.colour}
              ></div>
              <p>{list.name}</p>
              <p className="counter-style">{getTaskCountByList(list.id)}</p>
            </div>
          )}
        </p>
      ))}
      <div className="new-list">
        <img src={icons.add} onClick={handleAddList}></img>

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
    </div>
  );
};

export default DashboardList;
