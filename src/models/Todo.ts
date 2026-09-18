import mongoose, { type HydratedDocument } from 'mongoose';

export interface ITodo {
  title: string;
  description?: string;
  completed: boolean;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new mongoose.Schema<ITodo>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    completed: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export type TodoDocument = HydratedDocument<ITodo>;
export const Todo = mongoose.model<ITodo>('Todo', todoSchema);
