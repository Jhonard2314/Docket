const pool = require('../config/db');

/** Returns all categories. */
async function getAllCategories() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY category_name ASC');
  return rows;
}

/** Creates a new category. Returns the created record. */
async function createCategory(categoryName) {
  const [existing] = await pool.query(
    'SELECT id FROM categories WHERE category_name = ?',
    [categoryName]
  );
  if (existing.length > 0) {
    throw new Error('Category already exists.');
  }
  const [result] = await pool.query(
    'INSERT INTO categories (category_name) VALUES (?)',
    [categoryName]
  );
  return { id: result.insertId, category_name: categoryName };
}

/** Deletes a category by ID. Throws if it still has documents referencing it. */
async function deleteCategory(categoryId) {
  const [docs] = await pool.query(
    'SELECT id FROM documents WHERE category_id = ? LIMIT 1',
    [categoryId]
  );
  if (docs.length > 0) {
    throw new Error('Cannot delete a category that still has documents.');
  }
  await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
}

module.exports = { getAllCategories, createCategory, deleteCategory };
