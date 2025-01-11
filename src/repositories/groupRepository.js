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

const addMemberToGroup = async (groupId, username) => {

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error(`User "${username}" does not exist`);
  }

  return prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        connect: { id: user.id },
      },
    },
  });
};

const removeMemberFromGroup = async (groupId, username) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error(`User "${username}" does not exist`);
  }

  return prisma.group.update({
    where: { id: groupId },
    data: {
      members: {
        disconnect: { id: user.id },
      },
    },
  });
};

const getGroupMembers = async (groupName) => {
  const group = await prisma.group.findUnique({
    where: { name: groupName },
    include: { members: true },
  });
  return group?.members || [];
};

const getUserGroups = async (username) => {
  return prisma.group.findMany({
    where: {
      members: {
        some: { username },
      },
    },
    select: {
      name: true,
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