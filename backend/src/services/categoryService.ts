import prisma from '../config/db';

export async function getAllCategories(q?: string) {
  return prisma.category.findMany({
    where:   q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    select:  { id: true, name: true },
  });
}

export async function createCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) throw Object.assign(new Error('Category already exists.'), { code: 'CONFLICT' });
  return prisma.category.create({ data: { name }, select: { id: true, name: true } });
}

export async function updateCategory(id: string, name: string) {
  return prisma.category.update({ where: { id }, data: { name }, select: { id: true, name: true } });
}

export async function deleteCategory(id: string) {
  const hasDocs = await prisma.document.findFirst({ where: { categoryId: id } });
  if (hasDocs) throw Object.assign(new Error('Category still has documents.'), { code: 'CONFLICT' });
  await prisma.category.delete({ where: { id } });
}
