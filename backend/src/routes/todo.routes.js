import { Router } from "express";
import {
  getAllTodo,
  AddTodo,
  completeTodo,
  getOneTodo,
  editTodo,
  deleteTodo,
  deleteAllTodo,
  deleteCompletedTodo,
  completedAllTodo,
} from "../controllers/todo.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const todoRouter = Router();
todoRouter.route("/add-todo").post(AddTodo);
todoRouter.route("/get-todos").get(verifyJWT, getAllTodo);
todoRouter.route("/complete-todo").post(verifyJWT, completeTodo);
todoRouter.route("/get-one-todo").get(verifyJWT, getOneTodo);
todoRouter.route("/edit-todo").post(verifyJWT, editTodo);
todoRouter.route("/delete-todo").post(verifyJWT, deleteTodo);
todoRouter.route("/delete-all-todo").post(verifyJWT, deleteAllTodo);
todoRouter.route("/delete-completed-todo").post(verifyJWT, deleteCompletedTodo);
todoRouter.route("/completed-All-todo").post(verifyJWT, completedAllTodo);
export { todoRouter };
