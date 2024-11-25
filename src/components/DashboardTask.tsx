import "../styles/dashboard.css";
import "../styles/dashboard-task.css";
import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getCurrentDate, checkDate, getMinDate } from "../utils/dateUtils";
import { noTasksMessages, launchConfetti } from "../utils/taskUtils";
import { Timestamp } from "firebase/firestore";

interface DashboardTaskProps {
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

const DashboardTask = ({
  userData,
  listData,
  tasks,
  setTasks,
  fetchUserData,
  fetchListsAndTasks,
  getTaskCountByList,
}: DashboardTaskProps) => {
  const [isOptionsVisible, setIsOptionsVisible] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [isMessageGenerated, setIsMessageGenerated] = useState<boolean>(false);
  const [taskName, setTaskName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [updateTaskName, setUpdateTaskName] = useState<string>("");
  const [toggleAddTaskInfo, setToggleAddTaskInfo] = useState<boolean>(false);
  const [toggleTasks, setToggleTasks] = useState<{ [listId: string]: boolean }>(
    {}
  );

  useEffect(() => {
    fetchUserData();
    fetchListsAndTasks();
  }, []);

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
      launchConfetti();
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

  const handleCompleteTask = (listId: string, taskId: string) => {
    setTasks((prevTasks) => ({
      ...prevTasks,
      [listId]: prevTasks[listId].map((task) =>
        task.id === taskId ? { ...task } : task
      ),
    }));

    setTimeout(() => {
      handleDeleteTask(listId, taskId);
    }, 1000);
  };

  return (
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
                min={getMinDate()}
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
              <button
                className="home-button add-task-button"
                onClick={handleAddTask}
              >
                <span className="text">Add</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="all-tasks">
        {generatedMessage ? (
          <>
            {" "}
            <p id="no-tasks-message">{generatedMessage}</p>
            <button
              className="home-button confetti-button"
              onClick={() => launchConfetti()}
            >
              <span className="text">Success!</span>
            </button>
          </>
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
                    <h2 id="task-name">{list.name}</h2>
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

                          <div key={task.id} className="task-done">
                            <input
                              type="checkbox"
                              id={`task-${task.id}`}
                              onChange={() =>
                                handleCompleteTask(list.id, task.id)
                              }
                            ></input>
                            <label htmlFor={`task-${task.id}`}>
                              {" "}
                              {task.name}
                            </label>
                          </div>

                          {isOptionsVisible === task.id ? (
                            <ul className="options-button">
                              <li>
                                <img
                                  src="/edit.png"
                                  className="option-icon"
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
                                  className="option-icon"
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
                          ) : null}

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
  );
};

export default DashboardTask;
