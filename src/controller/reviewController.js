const Review = require('../models/ReviewModel');
const Shop = require('../models/ShopModel');
const Product = require('../models/ProductModel');
const { default: mongoose } = require('mongoose');

// --- Hàm phụ: Check chủ sở hữu (Giữ nguyên từ code của bạn) ---
const isOwnerOfTarget = async (userId, targetId, targetType) => {

  if (targetType === 'Shop') {
    const shop = await Shop.findOne({ _id: targetId, sellerId: userId });
    return !!shop;
  }
  if (targetType === 'Product') {
    const product = await Product.findById(targetId);
    if (!product) return false;
    const shop = await Shop.findOne({ _id: product.shopId, sellerId: userId });
    return !!shop;
  }
  return false;
};

const getAll = async (req, res) => {
  try {
    const { 
      targetId, 
      targetType, 
      page = 1, 
      limit = 10, 
      sort = 'newest', 
      rating 
    } = req.query;

    // --- 1. Tạo bộ lọc (Filter) ---
    const filter = {};

    // Chỉ lọc nếu client có gửi lên
    if (targetId) filter.targetId = targetId;
    
    // Nếu client gửi targetType='all' (từ dropdown Admin) thì ta không lọc
    if (targetType && targetType !== 'all') {
      filter.targetType = targetType;
    }
    
    // Lọc theo sao (nếu có)
    if (rating && rating !== 'all') {
      filter.rating = parseInt(rating);
    }

    // --- 2. Xử lý sắp xếp ---
    let sortOption = { createdAt: -1 }; // Mặc định mới nhất
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'rating_desc') sortOption = { rating: -1 };
    if (sort === 'rating_asc') sortOption = { rating: 1 };

    // --- 3. Query DB với Phân trang ---
    const skip = (page - 1) * limit;

    // Populate cả UserId (người viết) và Reply.UserId (người trả lời)
    const reviews = await Review.find(filter)
      .populate('userId', 'name avatar email') 
      .populate('reply.userId', 'name avatar')
      // Nếu cần hiển thị tên sản phẩm trong trang Admin, populate thêm targetId
      // Lưu ý: targetId là dynamic ref (Product/Shop/Attraction) nên cần config refPath trong Model hoặc populate từng cái
      .populate('targetId', 'name image') 
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // --- 4. Tính điểm trung bình (Chỉ tính khi đang xem 1 đối tượng cụ thể) ---
    // Nếu Admin đang xem tất cả review thì không cần tính trung bình cộng gộp
    let averageRating = 0;
    
    if (targetId) {
      const stats = await Review.aggregate([
        {
          $match: {
            targetId: new mongoose.Types.ObjectId(targetId),
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
          },
        },
      ]);
      averageRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    }

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating, // Nếu là trang Admin xem tất cả, giá trị này sẽ là 0
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDetailById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('userId', 'name avatar email')
      .populate('targetId', 'name image') // Populate ngược lại sản phẩm/shop nếu cần
      .populate('reply.userId', 'name avatar');

    if (!review) {
      return res.status(404).json({ message: 'Review không tồn tại' });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Lấy thông tin từ Middleware attachRole
    const userRole = req.userRole;
    const userId = req.userId;

    const review = await Review.findById(id);
    if (!review)
      return res.status(404).json({ message: 'Review không tồn tại' });

    // 1. ADMIN: Xóa bài nào cũng được (để dọn dẹp spam, vi phạm)
    if (userRole === 'Admin') {
      await Review.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ message: 'Admin đã xóa đánh giá thành công' });
    }

    // 2. USER: Chỉ được xóa bài CỦA CHÍNH MÌNH
    if (userRole === 'User') {
      if (!review.userId.equals(userId)) {
        return res
          .status(403)
          .json({ message: 'Bạn không có quyền xóa đánh giá của người khác' });
      }

      await Review.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Đã xóa đánh giá của bạn' });
    }

    if (userRole === 'Seller') {
      return res.status(403).json({
        message: 'Chủ shop không có quyền xóa đánh giá của khách hàng',
      });
    }

    return res.status(403).json({ message: 'Quyền truy cập không hợp lệ' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const create = async (req, res) => {
  try {
    const { targetId, targetType, rating, content, images } = req.body;

    // Lấy userId từ middleware xác thực (verifyToken)
    // Lưu ý: create thường không cần checkRole, ai login rồi đều được review
    const userId = req.userId || req.user.id;

    // --- Validate Input ---
    if (!['Product', 'Shop', 'Attraction'].includes(targetType)) {
      return res
        .status(400)
        .json({ message: 'Loại đối tượng đánh giá không hợp lệ' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Số sao phải từ 1 đến 5' });
    }

    // --- Validate Logic: Chống Spam ---
    // Kiểm tra xem User này đã review đối tượng này chưa?
    const existReview = await Review.findOne({ userId, targetId });
    if (existReview) {
      return res.status(400).json({
        message:
          'Bạn đã đánh giá đối tượng này rồi. Vui lòng chỉnh sửa đánh giá cũ.',
      });
    }

    // --- Tạo Review ---
    // Lưu ý: Ta không lấy field 'reply' từ req.body để tránh User tự tạo reply fake
    const newReview = new Review({
      userId,
      targetId,
      targetType,
      rating,
      content,
      images: images || [],
      reply: null, // Mặc định khi mới tạo chưa có phản hồi
    });

    await newReview.save();

    // (Optional) TODO: Tại đây bạn có thể gọi hàm tính toán lại số sao trung bình
    // cho Product/Shop và lưu vào bảng Product/Shop để query cho nhanh.

    return res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      data: newReview,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// --- CONTROLLER UPDATE ---
const update = async (req, res) => {
  try {
    const { id } = req.params;
    // Lấy các trường dữ liệu từ body
    const { content, rating, images, reply } = req.body;
    
    const userRole = req.userRole; // Lấy từ Middleware
    const userId = req.userId;     // Lấy từ Middleware
    
    // 1. Tìm bài review gốc
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Đánh giá không tồn tại' });
    }
    
    // ======================================================
    // CASE 1: ADMIN (Quyền cao nhất)
    // ======================================================
    console.log("role",userRole)
    if (userRole === 'Admin') {
      // Tạo object dữ liệu để update
      const updateData = {};

      // Nếu Admin sửa nội dung đánh giá của khách
      if (content !== undefined) updateData.content = content;
      if (rating !== undefined) updateData.rating = rating;
      if (images !== undefined) updateData.images = images;

      // --- QUAN TRỌNG: SỬA LỖI CAST ERROR ---
      // Nếu Admin gửi phản hồi (dạng string), ta phải đóng gói thành Object
      if (reply) {
        updateData.reply = {
          userId: userId, // ID của Admin
          content: reply, // Nội dung string (VD: "Cảm ơn bạn")
          createdAt: new Date(),
        };
      }

      // Thực hiện update
      const updatedReview = await Review.findByIdAndUpdate(id, updateData, {
        new: true, // Trả về dữ liệu mới sau khi update
        runValidators: true,
      });

      return res.status(200).json({
        success: true,
        message: 'Admin đã cập nhật đánh giá thành công',
        data: updatedReview,
      });
    }

    // ======================================================
    // CASE 2: SELLER (Chủ Shop / Sản phẩm)
    // ======================================================
    if (userRole == 'Seller') {
      // A. Chặn địa điểm du lịch (Seller không sở hữu địa điểm công cộng)
      if (review.targetType === 'Attraction') {
        return res.status(403).json({ 
            message: 'Địa điểm du lịch không hỗ trợ Seller phản hồi' 
        });
      }

      // B. Check quyền sở hữu
      const isOwner = await isOwnerOfTarget(
        userId,
        review.targetId,
        review.targetType
      );
      
      if (!isOwner) {
        return res.status(403).json({ 
            message: 'Bạn không có quyền phản hồi (Không phải chủ sở hữu)' 
        });
      }
      
      // C. Validate nội dung reply
      if (!reply || reply.trim() === '') {
        return res.status(400).json({ 
            message: 'Nội dung phản hồi không được để trống' 
        });
      }

      // D. Cập nhật Reply (Ghi đè thủ công để đảm bảo đúng cấu trúc)
      review.reply = {
        userId: userId,
        content: reply,
        createdAt: new Date(),
      };

      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Đã gửi phản hồi thành công',
        data: review,
      });
    }

    // ======================================================
    // CASE 3: USER (Người viết đánh giá)
    // ======================================================
    if (userRole === 'User') {
      // A. Check chính chủ
      if (!review.userId.equals(userId)) {
        return res.status(403).json({ 
            message: 'Bạn không được sửa đánh giá của người khác' 
        });
      }

      // B. Chặn User fake reply (User không được phép gửi field 'reply')
      if (reply) {
        return res.status(400).json({ 
            message: 'Người dùng không có quyền tạo phản hồi' 
        });
      }

      // C. Update nội dung (Chỉ những field cho phép)
      if (content) review.content = content;
      if (rating) review.rating = rating;
      if (images) review.images = images;

      await review.save();
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật đánh giá thành công',
        data: review,
      });
    }

    // Nếu không lọt vào case nào (Lỗi Role)
    return res.status(403).json({ message: 'Quyền truy cập không hợp lệ' });

  } catch (error) {
    console.error('Update Review Error:', error);
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {
  create,
  update,
  remove,
  getAll,
  getDetailById,

};
