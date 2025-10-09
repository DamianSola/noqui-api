// tests/userController.test.ts
// import { Request, Response } from "express";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { register } from "../controllers/userController";
// import User from "../models/User"; // tu modelo sequelize

// // Mock de librerías externas
// const myMockFn = jest.fn(cb => cb(null, true));

// jest.mock("bcrypt");
// jest.mock("jsonwebtoken");
// jest.mock("../models/User");

// describe("User Controller", () => {
//   let req: Partial<Request>;
//   let res: Partial<Response>;
//   let jsonMock: jest.Mock;
//   let statusMock: jest.Mock;

//   beforeEach(() => {
//     jsonMock = jest.fn();
//     statusMock = jest.fn().mockReturnValue({ json: jsonMock });

//     req = { body: {} };
//     res = { status: statusMock } as Partial<Response>;
//   });

//   describe("register", () => {
//     it("should register a user successfully", async () => {
//       // Mock data
//       req.body = { name: "John", email: "john@test.com", password: "123456", role: "user" };

//       // Mock bcrypt y jwt
//       (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
//       (jwt.sign as jest.Mock).mockReturnValue("fakeToken");

//       // Mock User.save
//       const saveMock = jest.fn().mockResolvedValue(true);
//       (User as jest.Mock).mockImplementation(() => ({
//         save: saveMock,
//         _id: "123",
//         name: "John",
//         email: "john@test.com",
//         role: "user",
//         password: "hashedPassword",
//       }));

//       await register(req as Request, res as Response);

//       expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
//       expect(jwt.sign).toHaveBeenCalledWith(
//         { id: "123" },
//         process.env.JWT_SECRET || "secret",
//         { expiresIn: "5h" }
//       );

//       expect(statusMock).toHaveBeenCalledWith(201);
//       expect(jsonMock).toHaveBeenCalledWith({
//         message: "User registered successfully",
//         user: expect.objectContaining({ name: "John", email: "john@test.com" }),
//         token: "fakeToken",
//       });
//     });

//     it("should return 500 if error occurs", async () => {
//       req.body = { name: "John", email: "john@test.com", password: "123456", role: "user" };

//       (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Hash error"));

//       await register(req as Request, res as Response);

//       expect(statusMock).toHaveBeenCalledWith(500);
//       expect(jsonMock).toHaveBeenCalledWith({
//         message: "Server error",
//         error: expect.any(Error),
//       });
//     });
//   });
// });
