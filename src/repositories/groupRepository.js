const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createGroup = async (name) => {
  return prisma.group.create({
    data: { name },
  });
};

const findGroupByName = async (name) => {
  return prisma.group.findUnique({
    where: { name },
  });
};

const addMemberToGroup = async (groupId, userId) => {
  return prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        connect: { id: userId },
      },
    },
  });
};

const removeMemberFromGroup = async (groupId, userId) => {
  return prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        disconnect: { id: userId },
      },
    },
  });
};

const getGroupMembers = async (groupId) => {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
  return group?.members || [];
};

const getUserGroups = async (userId) => {
  return prisma.group.findMany({
    where: {
      members: {
        some: { id: userId },
      },
    },
  });
};

module.exports = {
  createGroup,
  findGroupByName,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupMembers,
  getUserGroups,
};