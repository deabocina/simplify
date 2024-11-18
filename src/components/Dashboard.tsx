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
import { noTasksMessages } from "../utils/taskUtils";
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
  const [listColour, setlistColour] = useState<string>("");
  const [listData, setListData] = useState<
    Array<{ id: string; name: string; colour?: string }>
  >([]);
  const [isOptionsVisible, setIsOptionsVisible] = useState<string | null>(null);
  const [updateListName, setUpdateListName] = useState<string>("");
  const [updateListColour, setUpdateListColour] = useState<string>("");
  const [tasks, setTasks] = useState<{
    [listId: string]: Array<{
      id: string;
      name: string;
      startDate: Timestamp;
      startTime?: Timestamp;
    }>;
  }>({});
  const [taskName, setTaskName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [updateTaskName, setUpdateTaskName] = useState<string>("");
  const [updateStartDate, setUpdateStartDate] = useState<string>("");
  const [updateStartTime, setUpdateStartTime] = useState<string>("");
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

  const handleAddTask = async () => {
    if (!taskName || !startDate || !selectedListId) {
      return;
    }
    try {
      const startDateTime = startTime
        ? new Date(`${startDate}T${startTime}`)
        : new Date(`${startDate}T00:00`);

      const newTask = {
        name: taskName,
        startDate: Timestamp.fromDate(new Date(startDate)),
        startTime: Timestamp.fromDate(startDateTime),
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
      setStartDate("");
      setStartTime("");
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
        })) as Array<{ id: string; name: string; colour: string }>;

        const listsWithTasks: {
          [listId: string]: {
            id: string;
            name: string;
            startDate: Timestamp;
            startTime: Timestamp;
          }[];
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
              startDate:
                task.data().startDate instanceof Timestamp
                  ? task.data().startDate.toDate().toLocaleString()
                  : new Date(task.data().startDate).toLocaleString(),
              startTime:
                task.data().startTime instanceof Timestamp
                  ? task.data().startTime.toDate().toLocaleTimeString()
                  : new Date(task.data().startTime).toLocaleTimeString(),
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
                    Edit
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
                      handleUpdateList(
                        list.id,
                        updateListName,
                        updateListColour
                      );
                      setUpdateListName("");
                    }
                  }}
                />
              </div>
            ) : (
              <div className="list-details">
                <div
                  className="colour-square"
                  style={{ backgroundColor: list.colour }}
                  title={list.colour}
                ></div>
                <p>{list.name}</p>
                <p className="counter-style">{getTaskCountByList(list.id)}</p>
                <img
                  src="/close.png"
                  onClick={() => handleDeleteList(list.id)}
                />
              </div>
            )}
          </p>
        ))}
        <div className="new-list">
          <img src="/add.png" onClick={handleAddList}></img>

          <input
            type="color"
            defaultValue="#5b42f3"
            onChange={(e) => setlistColour(e.target.value)}
          ></input>
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

        <div className={`new-task ${toggleAddTaskInfo ? "active" : null}`}>
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
                  placeholder="Create new task.."
                  onChange={(e) => setTaskName(e.target.value)}
                  className="register-input"
                  required
                ></input>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                  className="register-input"
                  required
                />

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="register-input"
                ></input>

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

        <div className="tasks-container">
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
              <div
                key={list.id}
                className="tasks-by-list"
                style={{ border: `5px solid ${list.colour}` }}
              >
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
                            <input type="checkbox"></input>

                            {isOptionsVisible === task.id ? (
                              <ul className="options-button">
                                <li>
                                  <button
                                    onClick={() => {
                                      setUpdateTaskName(task.name);
                                      setIsOptionsVisible(task.id);
                                    }}
                                  >
                                    Edit
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
                              <p className="task-name-style">{task.name}</p>
                            )}

                            {/* <p
                              className={`task-end-date ${
                                checkDate(task.startDate).startsWith("Today")
                                  ? "today"
                                  : checkDate(task.startDate).startsWith(
                                      "Tomorrow"
                                    )
                                  ? "tomorrow"
                                  : "other"
                              }`}
                            >
                              {checkDate(task.startDate)}
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
