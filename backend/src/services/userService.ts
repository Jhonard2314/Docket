import prisma    from '../config/db';
import { Role }  from '@prisma/client';

export async function getAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new Error('User not found.');
  return user;
}

export async function updateUserRole(id: string, role: Role) {
  if (!Object.values(Role).includes(role)) throw new Error('Invalid role.');
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function deleteUser(id: string) {
  await prisma.document.deleteMany({ where: { uploadedById: id } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.account.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}
