import "../styles/dashboard.css";
import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getCurrentDate } from "../utils/dateUtils";
import { Timestamp } from "firebase/firestore";

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const [userData, setUserData] = useState<{
    name: string;
    surname: string;
  } | null>(null);
  const [listName, setListName] = useState<string>("");
  const [isOptionsVisible, setIsOptionsVisible] = useState<string | null>(null);
  const [updateListName, setUpdateListName] = useState<string>("");
  // const [updateListNames, setUpdateListNames] = useState<{
  //   [key: string]: string;
  // }>({});
  const [listData, setListData] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [tasks, setTasks] = useState<{
    [listId: string]: Array<{ id: string; name: string; endDateTime: Date }>;
  }>({});
  const [taskName, setTaskName] = useState<string>("");
  const [updateTaskName, setUpdateTaskName] = useState<string>("");
  const [startDateTime, setStartDateTime] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [endDateTime, setEndDateTime] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [toggleAddTaskInfo, setToggleAddTaskInfo] = useState<boolean>(false);
  const [toggleTasks, setToggleTasks] = useState<{ [listId: string]: boolean }>(
    {}
  );

  useEffect(() => {
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
    fetchUserData();
  }, []); // Runs once because of []

  useEffect(() => {
    const toggleTaskState: { [listId: string]: boolean } = {};
    listData.forEach((list) => {
      toggleTaskState[list.id] = true;
    });
    setToggleTasks(toggleTaskState);
  }, [listData]);

  const toggleTaskVisibility = (listId: string) => {
    setToggleTasks((prevState) => ({
      ...prevState,
      [listId]: !prevState[listId],
    }));
  };

  const handleAddList = async () => {
    if (!listName) {
      return;
    }
    try {
      const addListDoc = await addDoc(
        collection(db, "users", auth.currentUser!.uid, "lists"),
        {
          name: listName,
        }
      );
      setListData([...listData, { id: addListDoc.id, name: listName }]);
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

  const handleUpdateList = async (listId: string, newName: string) => {
    try {
      await updateDoc(
        doc(db, "users", auth.currentUser!.uid, "lists", listId),
        {
          name: newName,
        }
      );
      setListData(
        listData.map((list) =>
          list.id === listId ? { ...list, name: newName } : list
        )
      );
    } catch (error) {
      console.log(`Error updating list: ${error}`);
    }
  };

  const handleAddTask = async () => {
    if (!taskName || !startDateTime || !endDateTime || !selectedListId) {
      return;
    }
    try {
      const newTask = {
        name: taskName,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        listType: selectedListId,
      };

      const taskDoc = await addDoc(
        collection(
          db,
          "users",
          auth.currentUser!.uid,
          "lists",
          selectedListId,
          "tasks"
        ),
        newTask
      );

      setTasks((allTasks) => {
        const updatedTasks = { ...allTasks };
        const selectedListTasks = updatedTasks[selectedListId] || [];
        updatedTasks[selectedListId] = [
          ...selectedListTasks,
          { ...newTask, id: taskDoc.id },
        ];
        return updatedTasks;
      });

      setTaskName("");
      setStartDateTime("");
      setEndDateTime("");
    } catch (error) {
      console.log(`Error adding new task: ${error}`);
    }
  };

  const handleDeleteTask = async (listId: string, taskId: string) => {
    try {
      await deleteDoc(
        doc(
          db,
          "users",
          auth.currentUser!.uid,
          "lists",
          listId,
          "tasks",
          taskId
        )
      );
      const updatedTasks = { ...tasks };
      updatedTasks[listId] = updatedTasks[listId].filter(
        (task) => task.id !== taskId
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.log(`Error deleting task: ${error}`);
    }
  };

  const handleUpdateTask = async (
    listId: string,
    taskId: string,
    newName: string
  ) => {
    try {
      await updateDoc(
        doc(
          db,
          "users",
          auth.currentUser!.uid,
          "lists",
          listId,
          "tasks",
          taskId
        ),
        {
          name: newName,
        }
      );

      setTasks((updatedTasks) => ({
        ...updatedTasks,
        [listId]: updatedTasks[listId].map((task) =>
          task.id === taskId ? { ...task, name: newName } : task
        ),
      }));
      setTaskName("");
    } catch (error) {
      console.log(`Error updating task: ${error}`);
    }
  };

  const getTaskCountByList = (listId: string): number => {
    return tasks[listId]?.length || 0;
  };

  useEffect(() => {
    const fetchListsAndTasks = async () => {
      try {
        const listDocs = await getDocs(
          collection(db, "users", auth.currentUser!.uid, "lists")
        );
        const fetchedLists = listDocs.docs.map((list) => ({
          id: list.id,
          ...list.data(),
        })) as Array<{ id: string; name: string }>;

        const listsWithTasks: {
          [listId: string]: { id: string; name: string; endDateTime: Date }[];
        } = {}; // Create an empty object for tasks by listId

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
            const fetchedTasks = taskDoc.docs.map((task) => ({
              id: task.id,
              name: task.data().name,
              endDateTime:
                task.data().endDateTime instanceof Timestamp
                  ? task.data().endDateTime.toDate().toLocaleString()
                  : new Date(task.data().endDateTime).toLocaleString(),
            }));

            // Add tasks to object
            listsWithTasks[list.id] = fetchedTasks;
          })
        );

        setListData(fetchedLists);
        setTasks(listsWithTasks);
      } catch (error) {
        console.log(`Error fetching lists: ${error}`);
      }
    };
    fetchListsAndTasks();
  }, []);

  // const isToday = (date: Date) => {
  //   const dbDate = date instanceof Date ? date : new Date(date);
  //   const today = new Date();
  //   return (
  //     dbDate.getDate() === today.getDate() &&
  //     dbDate.getMonth() === today.getMonth() &&
  //     dbDate.getFullYear() === today.getFullYear()
  //   );
  // };

  const toggleDatePicker = () => setShowDatePicker(!showDatePicker);

  const noTasksMessages = [
    "Task-free zone! Is this intentional, or are you living the dream?",
    "So empty, so zen. Are you secretly a productivity guru?",
    "Task list is clear! Off to adventure, or time to make some new plans?",
    "No tasks in sight! Are you on a secret mission?",
    "Congratulations! You’ve reached peak relaxation with no tasks in sight!",
    "No tasks found! Did you solve the mystery of productivity?",
    "No tasks here! Maybe it's your lucky day?",
  ];

  return (
    <div className="task-container">
      <div className="task-options">
        <div className="user-profile">
          <img src="/list.png"></img>
          <div className="user-info">
            <h2>Simplify</h2>
            {userData && (
              <p className="text-colour">
                {userData.name} {userData.surname}
              </p>
            )}
          </div>
          <img src="/logout.png" id="logout-img" onClick={onLogout}></img>
        </div>
        <div className="line-style"></div>

        <h3>My Lists</h3>
        {listData.map((list) => (
          <p key={list.id} className="list-info">
            <img
              src="/options.png"
              onClick={() =>
                setIsOptionsVisible(
                  isOptionsVisible === list.id ? null : list.id
                )
              }
            />
            {isOptionsVisible === list.id ? (
              <ul className="options-button">
                <li>
                  <button onClick={() => setUpdateListName(list.name)}>
                    Rename
                  </button>
                </li>
                <li>
                  <button onClick={() => handleDeleteList(list.id)}>
                    Delete
                  </button>
                </li>
              </ul>
            ) : null}

            {updateListName && isOptionsVisible === list.id ? (
              <div>
                <input
                  type="text"
                  value={updateListName}
                  onChange={(e) => setUpdateListName(e.target.value)}
                  className="register-input"
                  onBlur={() => {
                    handleUpdateList(list.id, updateListName);
                    setUpdateListName("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUpdateList(list.id, updateListName);
                      setUpdateListName("");
                    }
                  }}
                />
              </div>
            ) : (
              <div className="list-details">
                <img src="/list-icon.png" />
                <p>{list.name}</p>
                <p className="counter-style">{getTaskCountByList(list.id)}</p>
              </div>
            )}
          </p>
        ))}
        <div className="line-style"></div>

        <div className="new-list">
          <img src="/add.png" onClick={handleAddList}></img>

          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="register-input"
            placeholder="Create new list.."
          />
        </div>
      </div>
      <div className="task-list">
        {userData && <h1>Hello, {userData.name}!</h1>}
        <p className="text-colour">It's {getCurrentDate()}</p>

        <div className="new-task">
          <img
            src={!toggleAddTaskInfo ? "/add.png" : "/minus.png"}
            onClick={() => setToggleAddTaskInfo(!toggleAddTaskInfo)}
          ></img>
          {!toggleAddTaskInfo && <p>New Task</p>}
          {toggleAddTaskInfo && (
            <>
              <div className="new-task-info">
                <input
                  type="text"
                  value={taskName}
                  placeholder="Create new task"
                  onChange={(e) => setTaskName(e.target.value)}
                  className="register-input"
                  required
                ></input>

                <div className="calendar-container">
                  <img src="/calendar.png" onClick={toggleDatePicker}></img>
                  {showDatePicker && (
                    <div className="calendar-picker">
                      <label>Start:</label>
                      <input
                        type="datetime-local"
                        value={startDateTime}
                        onChange={(e) => setStartDateTime(e.target.value)}
                        className="register-input"
                        required
                      />
                      <br />
                      <label id="end-date-style">End:</label>
                      <input
                        type="datetime-local"
                        value={endDateTime}
                        onChange={(e) => setEndDateTime(e.target.value)}
                        className="register-input"
                        required
                      />
                      <br />
                    </div>
                  )}
                </div>

                <select
                  onChange={(e) => setSelectedListId(e.target.value)}
                  value={selectedListId}
                  className="register-input"
                  required
                >
                  {listData.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>

                <img src="add-icon.png" onClick={handleAddTask}></img>
              </div>
            </>
          )}
        </div>
        <div className="line-style"></div>

        <div className="tasks-by-lists">
          {listData.length === 0 ||
          Object.values(tasks).every((task) => task.length === 0) ? (
            <p>
              {
                noTasksMessages[
                  Math.floor(Math.random() * noTasksMessages.length)
                ]
              }
            </p>
          ) : (
            listData.map((list) => (
              <div key={list.id}>
                {tasks[list.id] && tasks[list.id].length > 0 ? (
                  <>
                    <div className="toggle-tasks">
                      <img
                        src="arrow-down.png"
                        className={`task-arrow ${
                          toggleTasks[list.id] ? "rotate-task-arrow" : ""
                        }`}
                        onClick={() => toggleTaskVisibility(list.id)}
                      ></img>
                      <h3>{list.name}</h3>
                      <h3 className="counter-style">
                        {getTaskCountByList(list.id)}
                      </h3>
                    </div>
                    {toggleTasks[list.id] && (
                      <>
                        {tasks[list.id].map((task) => (
                          <p key={task.id} className="list-info">
                            <img
                              src="/options.png"
                              id="task-options"
                              onClick={() =>
                                setIsOptionsVisible(
                                  isOptionsVisible === task.id ? null : task.id
                                )
                              }
                            ></img>

                            {isOptionsVisible === task.id ? (
                              <ul className="options-button">
                                <li>
                                  <button
                                    onClick={() => {
                                      setUpdateTaskName(task.name);
                                      setIsOptionsVisible(task.id);
                                    }}
                                  >
                                    Rename
                                  </button>
                                </li>
                                <li>
                                  <button
                                    onClick={() =>
                                      handleDeleteTask(list.id, task.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            ) : null}

                            {updateTaskName && isOptionsVisible === task.id ? (
                              <input
                                type="text"
                                value={updateTaskName}
                                className="register-input"
                                onChange={(e) =>
                                  setUpdateTaskName(e.target.value)
                                }
                                onBlur={() => {
                                  handleUpdateTask(
                                    list.id,
                                    task.id,
                                    updateTaskName
                                  );
                                  setUpdateTaskName("");
                                  setIsOptionsVisible(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key == "Enter") {
                                    handleUpdateTask(
                                      list.id,
                                      task.id,
                                      updateTaskName
                                    );
                                    setUpdateTaskName("");
                                    setIsOptionsVisible(null);
                                  }
                                }}
                              />
                            ) : (
                              <p>{task.name}</p>
                            )}
                            {/* <p>
                              {isToday(task.endDateTime)
                                ? "Today"
                                : String(task.endDateTime)}
                            </p> */}
                          </p>
                        ))}
                      </>
                    )}
                  </>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
