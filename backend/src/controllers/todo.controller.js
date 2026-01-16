import { Todo } from "../models/todo.model.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const AddTodo = asyncHandler(async (req, res) => {
  const { todo } = req.body;

  if (!todo || !todo.trim()) {
    throw new ApiErrorHandle(400, "Todo text is required.");
  }

  const existedTodo = await Todo.findOne({ todo: todo.trim() });
  if (existedTodo) {
    throw new ApiErrorHandle(409, "Todo already exists.");
  }

  const createdTodo = await Todo.create({
    todo: todo.trim(),
  });

  if (!createdTodo) {
    throw new ApiErrorHandle(500, "Failed to add todo.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdTodo, "Todo added successfully."));
});

const getAllTodo = asyncHandler(async (req, res) => {
  const getTodo = req.query.type;
  if (!getTodo || !getTodo.trim().toLowerCase()) {
    throw new ApiErrorHandle(400, "Failed to fetch todo.");
  }
  let todo;
  if (getTodo.toLowerCase() == "all") {
    todo = await Todo.find();
  } else if (getTodo.toLowerCase() == "completed") {
    todo = await Todo.find({ completed: true });
  } else if (getTodo.toLowerCase() == "active") {
    todo = await Todo.find({ completed: false });
  }
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error");
  }
  return res.status(201).json(new ApiResponse(201, todo));
});

const getOneTodo = asyncHandler(async (req, res) => {
  const id = req.query.type;
  if (!id) {
    throw new ApiErrorHandle(400, "Failed to get request!");
  }
  const todo = await Todo.findOne({ _id: id });

  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res.status(200).json(new ApiResponse(200, todo));
});

const editTodo = asyncHandler(async (req, res) => {
  const { id, editTodo } = req.body;
  if (!id || !editTodo.trim()) {
    throw new ApiErrorHandle(400, "Failed to get request!");
  }

  const old_todo = await Todo.find();
  const isExisted = old_todo.some((item) => {
    return item.todo == editTodo;
  });
 
  if (isExisted) {
    throw new ApiErrorHandle(400, "Todo already existed!");
  }
  const updated_todo = await Todo.findByIdAndUpdate(
    { _id: id },
    { todo: editTodo },
    { new: true }
  );
  if (!updated_todo) {
    throw new ApiErrorHandle(500, "Failed to complete this task.");
  }
  const todo = await Todo.find();
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, todo, "Todo Updated Successfully."));
});

const completeTodo = asyncHandler(async (req, res) => {
  const id = req.query.type;
  if (!id) {
    throw new ApiErrorHandle(400, "Failed to fetch request!");
  }
  const updated_todo = await Todo.findByIdAndUpdate(
    { _id: id },
    { completed: true },
    { new: true }
  );
  if (!updated_todo) {
    throw new ApiErrorHandle(500, "Failed to complete this task.");
  }
  const todo = await Todo.find();
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Task Completed Successfully."));
});

const deleteTodo = asyncHandler(async (req, res) => {
  const id = req.query.type;
  if (!id) {
    throw new ApiErrorHandle(400, "Failed to fetch request!");
  }
  const delete_todo = await Todo.findByIdAndDelete({ _id: id });
  if (!delete_todo) {
    throw new ApiErrorHandle(500, "Failed to delete this task.");
  }
  const todo = await Todo.find();
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo Deleted Successfully."));
});

const deleteAllTodo = asyncHandler(async (req, res) => {
  const del_todo = await Todo.deleteMany({});
  if (!del_todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, [], "All Todo Deleted Successfully."));
});

const deleteCompletedTodo = asyncHandler(async (req, res) => {
  const { completed } = req.body;
  if (!completed) {
    throw new ApiErrorHandle(400, "Failed to fetch request!");
  }
  const completedTodos = await Todo.find({ completed: true });

  if (completedTodos.deletedCount === 0) {
    throw new ApiErrorHandle(500, "No completed todo found to delete.");
  }
  const delete_complete_todo = await Todo.deleteMany({ completed: true });
  if (!delete_complete_todo) {
    throw new ApiErrorHandle(500, "Failed to delete these task.");
  }
  const todo = await Todo.find();
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo Deleted Successfully."));
});

const completedAllTodo = asyncHandler(async (req, res) => {
  const { completedAll } = req.body;
  if (!completedAll) {
    throw new ApiErrorHandle(400, "Failed to fetch request!");
  }
  const updateResult = await Todo.find({ completed: false });

  if (!updateResult) {
    throw new ApiErrorHandle(500, "No incompleted todo found to complete.");
  }
  const complete_all_todo = await Todo.updateMany(
    { completed: false },
    { $set: { completed: true } }
  );
  if (!complete_all_todo) {
    throw new ApiErrorHandle(500, "Failed to complete these task.");
  }
  const todo = await Todo.find();
  if (!todo) {
    throw new ApiErrorHandle(500, "Failed to fetch todo due to server error.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, todo, "All Todo Completed Successfully."));
});

export {
  AddTodo,
  getAllTodo,
  completeTodo,
  getOneTodo,
  editTodo,
  deleteTodo,
  deleteAllTodo,
  deleteCompletedTodo,
  completedAllTodo,
};
