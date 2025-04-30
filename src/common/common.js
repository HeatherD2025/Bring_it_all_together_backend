const express = require("express");
const app = express();
const router = require("express").Router();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../../generated/prisma/client"); // Import PrismaClient from the Prisma client library
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

module.exports = { app, router, bcrypt, prisma, jwt };
