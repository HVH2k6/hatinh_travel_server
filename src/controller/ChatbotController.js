const OpenAI = require('openai');
const Attraction = require('../models/AttractionsModel');
const Food = require('../models/FoodModel');
const Art = require('../models/ArtModel');
const WeatherService= require('../helper/weather');
// Config OpenAI
const openai = new OpenAI({
  apiKey: "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",
});
// --- 1. TOOL: TÌM KIẾM DỮ LIỆU TỪ DB ---
const tools = [
  {
    type: "function",
    function: {
      name: "search_travel_data",
      description: "Tìm kiếm địa điểm du lịch, món ăn từ Database của website.",
      parameters: {
        type: "object",
        properties: {
          keyword: { 
            type: "string", 
            description: "Từ khóa tìm kiếm (Ví dụ: 'Biển', 'Núi', 'Chùa', 'Đặc sản', 'Nổi tiếng')" 
          },
          type: {
            type: "string",
            enum: ["Attraction", "Food", "Art"],
            description: "Loại dữ liệu cần tìm"
          },
          budget_level: {
            type: "string",
            enum: ["low", "medium", "high", "any"],
            description: "Mức giá: low (<100k), medium (<500k), high (>500k). Dựa vào ngân sách chia đầu người để chọn."
          }
        },
        required: ["keyword", "type"],
      },
    },
  },
];

// --- 2. HÀM QUERY DB (Xử lý logic tìm kiếm) ---
const queryDatabase = async (keyword, type, budget_level) => {
  console.log(`🔍 AI Tìm kiếm: Loại=${type}, Từ khóa=${keyword}, Giá=${budget_level}`);
  
  let model;
  let query = {};
  
  // Logic tìm kiếm cơ bản: Tên hoặc Mô tả chứa từ khóa
  const textSearch = [
      { name: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
  ];
  
  // Nếu từ khóa là "Nổi tiếng" hoặc "Gợi ý", ta tìm tất cả (bỏ qua regex)
  if (["nổi tiếng", "gợi ý", "bất kỳ", "đẹp"].includes(keyword.toLowerCase())) {
      query = {}; 
  } else {
      query.$or = textSearch;
  }

  // Chọn Model và Logic giá
  if (type === 'Attraction') {
      model = Attraction;
      if (budget_level !== 'any') {
          let maxPrice = 10000000;
          if (budget_level === 'low') maxPrice = 100000; // Vé rẻ
          if (budget_level === 'medium') maxPrice = 500000; // Vé vừa
          
          // Logic: Tìm chỗ Free HOẶC giá vé nằm trong khoảng
          query.$and = [
              { $or: [{ isFree: true }, { minPrice: { $lte: maxPrice } }] }
          ];
      }
  } else if (type === 'Food') {
      model = Food;
      if (budget_level !== 'any') {
          let maxPrice = 5000000;
          if (budget_level === 'low') maxPrice = 100000; // Ăn bình dân
          if (budget_level === 'medium') maxPrice = 500000; // Nhà hàng
          query.price = { $lte: maxPrice };
      }
  } else if (type === 'Art') {
      model = Art;
  }

  try {
    let queryBuilder = model.find(query).limit(5); // Lấy tối đa 5 kết quả mỗi lần tìm

    // Populate địa chỉ và danh mục để AI có đủ thông tin sắp xếp
    queryBuilder.populate([
        { path: 'address.districtId', select: 'name' },
        { path: 'address.provinceId', select: 'name' },
        { path: 'categoryId', select: 'name' }
    ]);

    if (type === 'Attraction') {
        queryBuilder.select('name description minPrice maxPrice isFree openTime closeTime address image slug typeId')
                    .populate('typeId', 'name');
    } else if (type === 'Food') {
        queryBuilder.select('name description price ingredients address image slug');
    } else if (type === 'Art') {
        queryBuilder.select('name description video_url address image slug');
    }

    const results = await queryBuilder;

    if (!results || results.length === 0) {
      return JSON.stringify({ message: "Không tìm thấy dữ liệu cụ thể, hãy gợi ý địa điểm chung chung." });
    }

    // Format dữ liệu gọn gàng cho AI đọc
    const cleanData = results.map(item => {
        const addr = `${item.address?.districtId?.name || ''}, ${item.address?.provinceId?.name || ''}`;
        let priceInfo = "Liên hệ";
        if (type === 'Food') priceInfo = `${item.price} VNĐ`;
        if (type === 'Attraction') priceInfo = item.isFree ? "Miễn phí" : `${item.minPrice} VNĐ`;

        return {
            name: item.name,
            type: type,
            desc: item.description?.substring(0, 100) + "...", // Cắt ngắn mô tả tiết kiệm token
            address: addr,
            price: priceInfo,
            category: item.categoryId?.name,
            tourismType: item.typeId?.name, // Dành cho Attraction
            slug: item.slug
        };
    });

    return JSON.stringify(cleanData);

  } catch (err) {
    console.error("DB Query Error:", err);
    return JSON.stringify({ error: "Lỗi truy vấn DB" });
  }
};

// --- 3. CONTROLLER XỬ LÝ CHAT (SMART LOGIC) ---
const handleChat = async (req, res) => {
  try {
    const { message } = req.body; // Frontend chỉ cần gửi { message: "5 người 20 triệu thích thiên nhiên" }

    // Tính ngày mai để làm mặc định nếu khách không nói ngày
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('vi-VN');

    // --- PROMPT "HƯỚNG DẪN VIÊN THÔNG MINH" ---
    const systemPrompt = `
      Bạn là Trợ lý du lịch Hà Tĩnh thông minh.
      Hôm nay là ngày: ${new Date().toLocaleDateString('vi-VN')}.

      NHIỆM VỤ CHÍNH: Lên lịch trình du lịch dựa trên câu chat của khách.

      QUY TẮC XỬ LÝ QUAN TRỌNG:
      1. **Tự động trích xuất thông tin:** - Nếu khách nói số tiền (VD: 20 triệu) và số người (5 người) -> Tự chia ra (4 triệu/người) để xác định mức chi tiêu (budget_level).
         - Nếu > 500k/người -> budget_level = 'high'.
         - Nếu < 500k/người -> budget_level = 'medium' hoặc 'low'.
      
      2. **Tự động giả định (Không hỏi lại):**
         - Nếu thiếu số ngày -> Giả định đi **2 ngày 1 đêm**.
         - Nếu thiếu ngày đi -> Giả định là **${dateStr}**.
         - Nếu thiếu sở thích -> Giả định là **"Nổi tiếng"** và **"Đặc sản"**.
      
      3. **Luồng làm việc:**
         - Bước 1: Phân tích câu nói.
         - Bước 2: Dùng tool 'search_travel_data' để tìm Địa điểm (Attraction) và Ăn uống (Food) phù hợp với ngân sách và sở thích đã phân tích.
         - Bước 3: Tổng hợp dữ liệu từ tool và viết lịch trình chi tiết.

      4. **Kết quả trả về:**
         - Trình bày dạng Markdown đẹp mắt.
         - Có tính toán tổng chi phí ước tính.
         - Giọng văn thân thiện, chuyên nghiệp.
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // --- GỌI AI VÒNG 1 (Để AI quyết định tìm gì) ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Model này thông minh và rẻ
      messages: messages,
      tools: tools,
      tool_choice: "auto", 
    });

    const aiMsg = completion.choices[0].message;

    // --- XỬ LÝ KHI AI ĐÒI GỌI TOOL (Tìm DB) ---
    if (aiMsg.tool_calls) {
      messages.push(aiMsg); // Lưu history

      // AI có thể gọi nhiều tool cùng lúc (VD: Tìm 1 cái cho 'Attraction' và 1 cái cho 'Food')
      for (const toolCall of aiMsg.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        if (fnName === "search_travel_data") {
          // Gọi hàm query DB của chúng ta
          const dbResult = await queryDatabase(args.keyword, args.type, args.budget_level);
          
          // Đẩy kết quả DB về cho AI
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: fnName,
            content: dbResult
          });
        }
      }

      // --- GỌI AI VÒNG 2 (Để AI viết lịch trình từ data DB) ---
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
      });

      return res.json({ 
        success: true, 
        message: finalResponse.choices[0].message.content 
      });
    }

    // Trường hợp AI chém gió luôn mà không cần tìm DB (ít gặp nếu prompt bắt buộc dùng tool)
    return res.json({ 
      success: true, 
      message: aiMsg.content 
    });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({ message: "Lỗi xử lý, vui lòng thử lại." });
  }
};

module.exports = { handleChat };