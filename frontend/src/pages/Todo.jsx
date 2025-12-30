import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LoadingScreen from "../components/LoadingScreen.jsx";
import axios from "axios";
import { AlertBox, ConfirmBox } from "../components/AlertBox.jsx";

export default function Todo() {
  const [todos, setTodos] = useState([]); //todo collection
  const navigate = useNavigate();
  const [newTodo, setNewTodo] = useState(""); // input collection
  const [addBtnTodo, setAddBtnTodo] = useState(false); //btn text handle
  const [isLoading, setIsLoading] = useState(true); //loader handle
  const [editTodo, setEditTodo] = useState(false); //edit handle
  const [editTodoId, setEditTodoId] = useState(""); //edit ID handle
  const [editBtnTodo, setEditBtnTodo] = useState(false); //btn text handle
  const [taskBtn, setTaskBtn] = useState("all");
  const handleAddNewTodo = async () => {
    if (!newTodo.trim()) {
      AlertBox("error", "Please enter a task before adding it.");
      return;
    }
    setAddBtnTodo(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/p1/add-todo`,
        { todo: newTodo },
        { withCredentials: true }
      );

      if (response?.data?.data) {
        AlertBox("success", response.data.message);
        setTodos((prev) => [...prev, response.data.data]);
        setNewTodo("");
      }
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || error.message,
        error.response?.status
      );
    } finally {
      setAddBtnTodo(false);
    }
  };
  const handleCompleteTodo = async (id, condition) => {
    if (!id) {
      AlertBox("error", "There is an error occure!");
      return;
    }
    if (id && condition == false) {
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.post(
          `${backend}/api/p1/complete-todo`,
          {},
          {
            params: { type: id },
            withCredentials: true,
          }
        );

        if (response?.data?.data) {
          setTodos(response.data.data);
          AlertBox("success", response.data.message);
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
      } finally {
        setTaskBtn("all");
        setIsLoading(false);
      }
    }
  };
  const cancelUpdate = () => {
    setEditTodo(false);
    setNewTodo("");
  };
  const getEditTodo = async (id) => {
    setEditTodo(true);
    if (!id) {
      AlertBox("error", "There is an error occure!");
      return;
    }
    if (id) {
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.get(`${backend}/api/p1/get-one-todo`, {
          params: { type: id },
          withCredentials: true,
        });

        if (response && response?.data?.data) {
          setNewTodo(response.data.data.todo);
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
      } finally {
        setIsLoading(false);
        setEditTodoId(id);
      }
    }
  };
  const handleEditTodo = async () => {
    const id = editTodoId;
    setEditBtnTodo(true);
    if (!id) {
      AlertBox("error", "There is an error occure!");
      return;
    }
    if (id) {
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.post(
          `${backend}/api/p1/edit-todo`,
          { id, editTodo: newTodo },
          {
            withCredentials: true,
          }
        );

        if (response?.data?.data) {
          AlertBox("success", response.data.message);
          setTodos(response.data.data);
          setNewTodo("");
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
        setEditBtnTodo(false);
        setAddBtnTodo(true);
        setNewTodo("");
      } finally {
        setNewTodo("");
        setIsLoading(false);
        setEditBtnTodo(false);
        setAddBtnTodo(false);
        setEditTodo(false);
        setTaskBtn("all");
      }
    }
  };
  const get_Todos = async (condition) => {
    setTaskBtn(condition);
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;

      const response = await axios.get(`${backend}/api/p1/get-todos`, {
        params: { type: condition },
        withCredentials: true,
      });

      if (response?.data?.data) {
        setTodos(response.data.data);
      }
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || error.message,
        error.response?.status
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteTodo = async (id) => {
    const isConfirm = await ConfirmBox(
      "Delete Todo?",
      "Are you sure you want to delete this todo?",
      "Yes, delete"
    );
    if (!isConfirm) return;
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/p1/delete-todo`,
        {},
        {
          params: { type: id },
          withCredentials: true,
        }
      );

      if (response?.data?.data) {
        AlertBox("success", response.data.message);
        setTodos(response.data.data);
        setNewTodo("");
      }
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || error.message,
        error.response?.status
      );
    } finally {
      setTaskBtn("all");
      setNewTodo("");
    }
  };
  const handleDeleteForCompleteTodo = async (count) => {
    if (count == 0) {
      AlertBox("error", "No completed todo found to delete.");
      return;
    } else {
      const isConfirm = await ConfirmBox(
        "Delete all Completed Todo?",
        "Are you sure you want to delete these todo?",
        "Yes, delete"
      );
      if (!isConfirm) return;
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.post(
          `${backend}/api/p1/delete-completed-todo`,
          { completed: true },
          {
            withCredentials: true,
          }
        );

        if (response?.data?.data) {
          AlertBox("success", response.data.message);
          setTodos(response.data.data);
          setNewTodo("");
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
      } finally {
        setTaskBtn("all");
        setNewTodo("");
      }
    }
  };
  const handleAllComplete = async (incompleteTask) => {
    if (incompleteTask == 0) {
      AlertBox("error", "All Task already completed.");
      return;
    } else {
      const isConfirm = await ConfirmBox(
        "Complete all Todo?",
        "Are you sure you want to complete all todo?",
        "Yes, complete"
      );
      if (!isConfirm) return;
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
        const response = await axios.post(
          `${backend}/api/p1/completed-All-todo`,
          { completedAll: true },
          {
            withCredentials: true,
          }
        );

        if (response?.data?.data) {
          AlertBox("success", response.data.message);
          setTodos(response.data.data);
          setNewTodo("");
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
      } finally {
        setTaskBtn("all");
        setNewTodo("");
      }
    }
  };
  const deleteAllTodo = async () => {
    if (todos == "") {
      AlertBox("error", "No Todo added.");
      return;
    }
    try {
      const backend = import.meta.env.VITE_BACKEND_PORT_LINK;
      const response = await axios.post(
        `${backend}/api/p1/delete-all-todo`,
        {},
        { withCredentials: true }
      );

      if (response?.data?.data) {
        AlertBox("success", response.data.message);
        setTodos([]);
        setNewTodo("");
      }
    } catch (error) {
      AlertBox(
        "error",
        error.response?.data?.message || error.message,
        error.response?.status
      );
    } finally {
      setAddBtnTodo(false);
      setTodos([]);
    }
  };
  useEffect(() => {
    const get_All_Todos = async () => {
      try {
        const backend = import.meta.env.VITE_BACKEND_PORT_LINK;

        const response = await axios.get(`${backend}/api/p1/get-todos`, {
          params: { type: "all" },
          withCredentials: true,
        });

        if (response?.data?.data) {
          setTodos(response.data.data);
        }
      } catch (error) {
        AlertBox(
          "error",
          error.response?.data?.message || error.message,
          error.response?.status
        );
      } finally {
        setIsLoading(false);
      }
    };

    get_All_Todos();
  }, []);

  if (isLoading) {
    // return <LoadingScreen />;
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-4 px-2">
      <div className="max-w-7xl mx-auto px-2">
        <div className=" flex justify-center mb-10 text-center relative">
          <button
            onClick={() => navigate(-1)}
            className=" absolute left-0 mb-6 cursor-pointer px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ⟵
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo App</h1>
            <p className="text-gray-600">Organize your tasks efficiently</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Add Todo Section */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Add New Task
              </h2>

              <div className="mb-6">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                {editTodo ? (
                  <div className="w-full">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <button
                        onClick={handleEditTodo}
                        className="w-full sm:w-[80%] cursor-pointer px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        {editBtnTodo ? "Editing new task..." : "Update Task"}
                      </button>

                      <button
                        onClick={cancelUpdate}
                        className="w-full sm:w-[20%] cursor-pointer px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAddNewTodo}
                    className=" cursor-pointer w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {addBtnTodo ? "Adding new task..." : "Add Task"}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Quick Actions</h3>
                <button
                  onClick={deleteAllTodo}
                  className="cursor-pointer w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear All Tasks
                </button>
                <button
                  onClick={() =>
                    handleAllComplete(
                      todos.length - todos.filter((t) => t.completed).length
                    )
                  }
                  className="cursor-pointer w-full px-4 py-3 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Mark All Complete
                </button>
              </div>

              {/* Stats in Left Column */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-700 mb-3">
                  Task Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {todos.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {todos.filter((t) => t.completed).length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Todo List */}
          <div className="lg:w-2/3">
            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => get_Todos("all")}
                className={
                  taskBtn == "all"
                    ? "cursor-pointer px-4 py-2 bg-blue-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "cursor-pointer px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                }
              >
                All Tasks
              </button>
              <button
                onClick={() => get_Todos("active")}
                className={
                  taskBtn == "active"
                    ? "cursor-pointer px-4 py-2 bg-blue-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "cursor-pointer px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                }
              >
                Active
              </button>
              <button
                onClick={() => get_Todos("completed")}
                className={
                  taskBtn == "completed"
                    ? "cursor-pointer px-4 py-2 bg-blue-600 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "cursor-pointer px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                }
              >
                Completed
              </button>
            </div>

            {/* Todo List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {todos.map((todo) => (
                  <div
                    key={todo._id}
                    className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 ${
                      todo.completed ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          handleCompleteTodo(todo._id, todo.completed)
                        }
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          todo.completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {todo.completed && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <span
                          className={`text-lg wrap-break-word whitespace-pre-wrap ${
                            todo.completed
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {todo.todo}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {todo.completed == true ? (
                        ""
                      ) : (
                        <button
                          onClick={() => getEditTodo(todo._id)}
                          className="cursor-pointer p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors duration-200 outline-none ring-2 ring-blue-500 "
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTodo(todo._id)}
                        className=" ms-3 cursor-pointer p-2 text-red-600 hover:bg-red-200 rounded-lg transition-colors duration-200 outline-none ring-2 ring-red-500 "
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Todo Stats Footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <div className="text-gray-600">
                  <span className="font-medium">
                    {todos.filter((t) => !t.completed).length}
                  </span>{" "}
                  tasks remaining
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() =>
                      handleDeleteForCompleteTodo(
                        todos.filter((t) => t.completed).length
                      )
                    }
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium outline-none ring-2 ring-gray-400 rounded px-2 py-1"
                  >
                    Clear Completed
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {todos.length === 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No tasks yet
                </h3>
                <p className="text-gray-500">
                  Add your first task using the form on the left
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
