import { Router } from 'express';
import { createTodo, deleteTodo, getTodo, listMyTodos, updateTodo } from '../controllers/todo.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireTodoAccess } from '../middleware/requireTodoAccess.js';
import { requireVerified } from '../middleware/requireVerified.js';

export const todoRouter = Router();
todoRouter.use(authenticate, requireVerified);
todoRouter.route('/').post(createTodo).get(listMyTodos);
todoRouter.route('/:id').get(requireTodoAccess, getTodo).patch(requireTodoAccess, updateTodo).delete(requireTodoAccess, deleteTodo);
