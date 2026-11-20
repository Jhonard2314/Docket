import prisma from '../config/db';

export async function getAllDepartments(q?: string) {
  return prisma.department.findMany({
    where:   q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    select:  { id: true, name: true },
  });
}

export async function createDepartment(name: string) {
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) throw Object.assign(new Error('Department name already exists.'), { code: 'CONFLICT' });
  return prisma.department.create({ data: { name }, select: { id: true, name: true } });
}

export async function updateDepartment(id: string, name: string) {
  return prisma.department.update({ where: { id }, data: { name }, select: { id: true, name: true } });
}

export async function deleteDepartment(id: string) {
  const hasUsers = await prisma.user.findFirst({ where: { departmentId: id } });
  if (hasUsers) throw Object.assign(new Error('Department still has members.'), { code: 'CONFLICT' });
  const hasDocs = await prisma.document.findFirst({ where: { departmentId: id } });
  if (hasDocs) throw Object.assign(new Error('Department still has documents.'), { code: 'CONFLICT' });
  await prisma.department.delete({ where: { id } });
}
