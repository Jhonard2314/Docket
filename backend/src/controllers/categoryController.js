const { getAllCategories, createCategory, deleteCategory } = require('../services/categoryService');

/** GET /api/categories */
async function listCategories(req, res) {
  try {
    const categories = await getAllCategories();
    return res.json({ success: true, categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/categories  (admin only) */
async function addCategory(req, res) {
  try {
    const { category_name } = req.body;
    if (!category_name) {
      return res.status(400).json({ success: false, message: 'category_name is required.' });
    }
    const category = await createCategory(category_name.trim());
    return res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/** DELETE /api/categories/:id  (admin only) */
async function removeCategory(req, res) {
  try {
    await deleteCategory(req.params.id);
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { listCategories, addCategory, removeCategory };
