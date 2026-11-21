import prisma    from '../config/db';

type Role = 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ADMIN';

const SELECT = {
  id: true, name: true, email: true, role: true,
  isActive: true, departmentId: true, createdAt: true,
  department: { select: { id: true, name: true } },
};

export async function getAllUsers(q?: string) {
  return prisma.user.findMany({
    where:   q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : undefined,
    select:  SELECT,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, select: SELECT });
  if (!u) throw Object.assign(new Error('User not found.'), { code: 'NOT_FOUND' });
  return u;
}

export async function updateUser(id: string, data: { name?: string; role?: Role; departmentId?: string | null; isActive?: boolean }) {
  // Prevent disabling or demoting the final active admin.
  if (data.isActive === false || (data.role && data.role !== 'ADMIN')) {
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (user?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1) {
        throw Object.assign(new Error('Cannot disable or demote the last active administrator.'), { code: 'CONFLICT' });
      }
    }
  }
  return prisma.user.update({ where: { id }, data, select: SELECT });
}

export async function deactivateUser(id: string) {
  return updateUser(id, { isActive: false });
}
