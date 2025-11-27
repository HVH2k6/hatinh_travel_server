const { paginate } = require('../helper/pagination');
const Unit = require('../models/UnitModel');

// 1. CREATE - Tạo mới đơn vị tính
const createUnit = async (req, res) => {
  try {
    // Lấy đầy đủ các trường từ body
    const { name, symbol, type, order, isActive } = req.body;

    // Kiểm tra trùng tên hoặc symbol (nếu cần)
    const existingUnit = await Unit.findOne({
      $or: [{ name }, { symbol }],
    });
    if (existingUnit) {
      return res
        .status(400)
        .json({ message: 'Tên hoặc ký hiệu đơn vị đã tồn tại!' });
    }

    const unit = await Unit.create({
      name,
      symbol,
      type: type || 'other', // Mặc định là 'other' nếu không truyền
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      message: 'Tạo đơn vị tính thành công',
      data: unit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. GET ALL - Lấy danh sách (Thường dùng cho Dropdown chọn đơn vị)
const getAllUnits = async (req, res) => {
  try {
    const page = Number(req.query.page || 1); // Default page is 1
    const limit = Number(req.query.limit || 10); // Default limit is 10
    const status = req.query.status || true;

    const result = await paginate({
      model: Unit,
      page,
      limit,

      populate: [],
      sort: { order: 1, name: 1,isActive: -1 },
      lean: true, // Use lean() for plain JS objects
    });
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. GET BY ID - Xem chi tiết 1 đơn vị
const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id);

    if (!unit) {
      return res.status(404).json({ message: 'Không tìm thấy đơn vị tính' });
    }

    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. UPDATE - Cập nhật thông tin
const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, type, order, isActive } = req.body;

    const unit = await Unit.findByIdAndUpdate(
      id,
      { name, symbol, type, order, isActive },
      { new: true, runValidators: true } // new: true để trả về data mới sau khi update
    );

    if (!unit) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy đơn vị tính để cập nhật' });
    }

    res.status(200).json({
      message: 'Cập nhật thành công',
      data: unit,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. DELETE - Xóa đơn vị
// Lưu ý: Nếu đơn vị này đang được dùng trong Product, xóa cứng sẽ gây lỗi hiển thị bên Product.
// Khuyên dùng: Chuyển isActive = false thay vì xóa hẳn.
const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Cách 1: Xóa vĩnh viễn (Hard Delete)
    const deletedUnit = await Unit.findByIdAndDelete(id);

    if (!deletedUnit) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy đơn vị tính để xóa' });
    }

    res.status(200).json({ message: 'Đã xóa đơn vị tính thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
};
