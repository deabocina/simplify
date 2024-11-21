import "../styles/dashboard.css";
import "../styles/dashboard-list.css";
import "../styles/dashboard-task.css";
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
import { getCurrentDate, checkDate } from "../utils/dateUtils";
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

  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [isMessageGenerated, setIsMessageGenerated] = useState<boolean>(false);
  const [tasks, setTasks] = useState<{
    [listId: string]: Array<{
      id: string;
      name: string;
      startDate: Timestamp;
      startTime?: Timestamp | null;
    }>;
  }>({});
  const [taskName, setTaskName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [updateTaskName, setUpdateTaskName] = useState<string>("");
  // const [updateStartDate, setUpdateStartDate] = useState<string>("");
  // const [updateStartTime, setUpdateStartTime] = useState<string>("");
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

  useEffect(() => {
    const noTasks =
      listData.length === 0 ||
      Object.keys(tasks).length === 0 ||
      Object.values(tasks).every((taskList) => taskList.length === 0);

    if (!isMessageGenerated && noTasks) {
      const randomMessage =
        noTasksMessages[Math.floor(Math.random() * noTasksMessages.length)];
      setGeneratedMessage(randomMessage);
      setIsMessageGenerated(true);
    } else if (isMessageGenerated && !noTasks) {
      setGeneratedMessage(null);
      setIsMessageGenerated(false);
    }
  }, [listData, tasks, isMessageGenerated]);

  const handleAddTask = async () => {
    if (!taskName || !startDate || !selectedListId) {
      return;
    }
    try {
      const parsedStartDate = Timestamp.fromDate(new Date(startDate));
      const parsedStartTime = startTime
        ? Timestamp.fromDate(new Date(`${startDate}T${startTime}`))
        : null;

      const formattedDate = checkDate(parsedStartDate, parsedStartTime);

      const newTask = {
        name: taskName,
        startDate: parsedStartDate,
        startTime: parsedStartTime,
        listType: selectedListId,
        formattedDate,
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
            startTime: Timestamp | null;
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
                  <img
                    src="/edit.png"
                    className="option-icon"
                    onClick={() => setUpdateListName(list.name)}
                  />
                  <button onClick={() => setUpdateListName(list.name)}>
                    Edit
                  </button>
                </li>
                <li>
                  <img
                    src="/close.png"
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
      <div className="task-list">
        <div className="greetings">
          {userData && <h1>Hello, {userData.name}!</h1>}
          <p className="text-colour">It's {getCurrentDate()}</p>
        </div>

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
                ></input>{" "}
                <span className="required">*</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                  className="register-input"
                  required
                />{" "}
                <span className="required">*</span>
                <input
                  type="time"
                  value={startTime}
                  pattern="[0-9]{2}:[0-9]{2}"
                  onChange={(e) => setStartTime(e.target.value)}
                  className="register-input"
                ></input>
                <select
                  onChange={(e) => setSelectedListId(e.target.value)}
                  value={selectedListId}
                  className="register-input"
                  required
                >
                  <option value="" disabled>
                    Choose a list
                  </option>
                  {listData.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>{" "}
                <span className="required">*</span>
                <img src="add-icon.png" onClick={handleAddTask}></img>
                {/* <button className="home-button" onClick={handleAddTask}>
                  <span className="text">Add</span>
                </button> */}
              </div>
            </>
          )}
        </div>

        <div className="all-tasks">
          {generatedMessage ? (
            <p id="no-tasks-message">{generatedMessage}</p>
          ) : (
            listData.map((list) => (
              <div
                key={list.id}
                className="tasks-by-lists"
                style={
                  tasks[list.id] && tasks[list.id].length > 0
                    ? { border: `3px solid ${list.colour}` }
                    : {}
                }
              >
                {tasks[list.id] && tasks[list.id].length > 0 ? (
                  <>
                    <div
                      className="toggle-tasks"
                      style={{ backgroundColor: list.colour }}
                    >
                      <img
                        src="arrow-down.png"
                        className={`task-arrow ${
                          toggleTasks[list.id] ? "rotate-task-arrow" : ""
                        }`}
                        onClick={() => toggleTaskVisibility(list.id)}
                      ></img>
                      <h2>{list.name}</h2>
                      <h2 className="counter-style">
                        {getTaskCountByList(list.id)}
                      </h2>
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
                                  <img
                                    src="/edit.png"
                                    onClick={() => {
                                      setUpdateTaskName(task.name);
                                      setIsOptionsVisible(task.id);
                                    }}
                                  ></img>
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
                                  <img
                                    src="/close.png"
                                    onClick={() =>
                                      handleDeleteTask(list.id, task.id)
                                    }
                                  ></img>
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

                            <p
                              className={`task-start ${
                                checkDate(
                                  task.startDate,
                                  task.startTime
                                ).startsWith("Today")
                                  ? "today"
                                  : checkDate(
                                      task.startDate,
                                      task.startTime
                                    ).startsWith("Tomorrow")
                                  ? "tomorrow"
                                  : "other"
                              }`}
                            >
                              {checkDate(task.startDate, task.startTime)}
                            </p>
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
