import prisma              from '../config/db';
import { deleteS3Object }  from '../utils/deleteS3Object';
import { getPresignedUrl } from '../utils/presignedUrl';

interface CreateDocumentInput {
  filename:    string;
  s3Key:       string;
  mimeType:    string;
  sizeBytes:   number;
  categoryId:  string;
  uploadedById: string;
}

interface ListDocumentsInput {
  role:       string;
  userId:     string;
  search?:    string;
  categoryId?: string;
}

export async function createDocument(input: CreateDocumentInput) {
  return prisma.document.create({
    data: input,
    include: { category: true, uploadedBy: true },
  });
}

export async function getDocuments({ role, userId, search, categoryId }: ListDocumentsInput) {
  return prisma.document.findMany({
    where: {
      ...(role !== 'ADMIN' && { uploadedById: userId }),
      ...(search    && { filename: { contains: search, mode: 'insensitive' } }),
      ...(categoryId && { categoryId }),
    },
    include: { category: true, uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocumentById(id: string, userId: string, role: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { category: true, uploadedBy: { select: { id: true, name: true } } },
  });
  if (!doc) throw new Error('Document not found.');
  if (role !== 'ADMIN' && doc.uploadedById !== userId) throw new Error('Access denied.');
  return doc;
}

export async function renameDocument(id: string, filename: string, userId: string, role: string) {
  await getDocumentById(id, userId, role);
  return prisma.document.update({ where: { id }, data: { filename } });
}

export async function deleteDocument(id: string, userId: string, role: string) {
  const doc = await getDocumentById(id, userId, role);
  await deleteS3Object(doc.s3Key);
  await prisma.document.delete({ where: { id } });
}

export async function getDownloadUrl(id: string, userId: string, role: string) {
  const doc = await getDocumentById(id, userId, role);
  const url = await getPresignedUrl(doc.s3Key);
  return { url, filename: doc.filename };
}
