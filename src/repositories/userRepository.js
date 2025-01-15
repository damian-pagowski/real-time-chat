const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createUser = async (username, password) => {
  return prisma.user.create({
    data: { username, password },
  });
};

const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

const deleteUserByUsername = async (username) => {
  return prisma.user.delete({
    where: { username },
  });
};

module.exports = { createUser, findUserByUsername, deleteUserByUsername };