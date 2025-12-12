const Attractions = require('../models/AttractionsModel');
const Food = require('../models/FoodModel');
const Art = require('../models/ArtModel');
const Product = require('../models/ProductModel');
const Shop = require('../models/ShopModel');

const search = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        
        // Validate query
        if (!q || q.length < 2) {
            return res.status(400).json({ 
                message: 'Vui lòng nhập từ khóa tìm kiếm (tối thiểu 2 ký tự)' 
            });
        }

        // Tạo regex pattern một lần
        const searchPattern = { name: { $regex: q, $options: 'i' } };
        
        // Select chỉ các field cần thiết để giảm dữ liệu trả về
        const result = await Promise.all([
            Attractions.find(searchPattern).select('-description -list_image -createdBy').lean(),
            Food.find(searchPattern).select('-description -list_image -createdBy').lean(),
            Art.find(searchPattern).select('-description -list_image -createdBy').lean(),
            Product.find(searchPattern).select('-description -list_image -createdBy').lean(),
            Shop.find(searchPattern).select('-description -list_image -createdBy').lean(),
        ]);

        // Format kết quả rõ ràng hơn
        const formattedResult = {
            attractions: result[0],
            food: result[1],
            art: result[2],
            products: result[3],
            shops: result[4],
            total: result.reduce((sum, arr) => sum + arr.length, 0)
        };

        res.status(200).json(formattedResult);
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            message: 'Lỗi khi tìm kiếm', 
            error: error.message 
        });
    }
};

module.exports = { search };