import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from "express";
import User from '../models/User';

interface RegisterProps {
    name: string;
    email: string;
    password: string;
    role: string;
}

const findUser = async (req:Request, res: Response) : Promise<void>=> {

}

const getAllUser = async (req:Request, res: Response) : Promise<void>=> {

}

const register = async (req:Request, res: Response) : Promise<void>=> {
     const { name, email, password, role } = req.body as RegisterProps;

  try {
    const hashedPassword : string = await bcrypt.hash(password, 10);
    const newUser:any = new User({ name, email, password: hashedPassword, role });

    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '5h' });

    console.log(newUser)
    res.status(201).json({ message: 'User registered successfully', user: newUser, token });
  } catch (error: unknown) {
    res.status(500).json({ message: 'Server error', error });
  }
}

const login = async (req:Request, res: Response) : Promise<void>=> {

}

const logout = async (req:Request, res: Response) : Promise<void>=> {

}

const deleteUser = async (req:Request, res: Response) : Promise<void>=> {

}

const upDateUser = async (req:Request, res: Response) : Promise<void>=> {

}


export {
    findUser,
    deleteUser,
    upDateUser,
    login,
    register,
    getAllUser,
    logout
}