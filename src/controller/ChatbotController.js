const OpenAI = require('openai');
const Attraction = require('../models/AttractionsModel');
const Food = require('../models/FoodModel');
const Art = require('../models/ArtModel');
// Giả sử WeatherService có hàm getForecast(location, days)
const WeatherService = require('../helper/weather'); 

require('dotenv').config(); // Cần cài npm install dotenv

// Config OpenAI an toàn
const openai = new OpenAI({
  apiKey: "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", // Hãy đặt key trong file .env
});

// --- 1. TOOLS DEFINITION ---
const tools = [
  {
    type: "function",
    function: {
      name: "search_travel_data",
      description: "Tìm kiếm địa điểm du lịch, món ăn, văn hóa từ Database.",
      parameters: {
        type: "object",
        properties: {
          keyword: { 
            type: "string", 
            description: "Từ khóa chính (Ví dụ: 'Biển', 'Chùa', 'Hải sản', 'Bánh cu đơ')" 
          },
          type: {
            type: "string",
            enum: ["Attraction", "Food", "Art"],
            description: "Loại dữ liệu cần tìm"
          },
          budget_level: {
            type: "string",
            enum: ["low", "medium", "high", "any"],
            description: "Mức giá dựa trên ngân sách khách đưa ra."
          }
        },
        required: ["keyword", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather_forecast",
      description: "Lấy dự báo thời tiết tại Hà Tĩnh để lên lịch trình phù hợp.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Số ngày dự báo (mặc định 1-3 ngày)" }
        }
      }
    }
  }
];

// --- 2. HÀM QUERY DB ---
const queryDatabase = async (keyword, type, budget_level) => {
  console.log(`🔍 DB Query: Type=${type} | Key=${keyword} | Budget=${budget_level}`);
  
  let model;
  let query = {};
  
  // 1. Xử lý từ khóa tìm kiếm
  // Nếu từ khóa quá chung chung, ta tìm tất cả (query rỗng) để lấy ngẫu nhiên top rated
  const genericKeywords = ["nổi tiếng", "gợi ý", "bất kỳ", "đẹp", "vui chơi", "tham quan"];
  if (!genericKeywords.includes(keyword.toLowerCase())) {
     query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
     ];
  }

  // 2. Chọn Model & Xử lý giá
  if (type === 'Attraction') {
      model = Attraction;
      // Logic giá vé
      if (budget_level === 'low') query.$or = [{ isFree: true }, { minPrice: { $lte: 100000 } }];
      if (budget_level === 'medium') query.minPrice = { $lte: 500000 };
      // High thì lấy all
  } else if (type === 'Food') {
      model = Food;
      if (budget_level === 'low') query.price = { $lte: 100000 };
      if (budget_level === 'medium') query.price = { $lte: 500000 };
  } else if (type === 'Art') {
      model = Art;
  }

  try {
    // Lấy nhiều kết quả hơn (8) để AI có không gian chọn lựa
    let queryBuilder = model.find(query).limit(8);

    // Populate thông tin cần thiết
    queryBuilder.populate([
        { path: 'address.provinceId', select: 'name' }, // Chỉ cần tên Tỉnh
        { path: 'address.wardId', select: 'name' },     // Tên Xã/Phường
        { path: 'categoryId', select: 'name' }
    ]);

    if (type === 'Attraction') {
        queryBuilder.select('name description minPrice maxPrice isFree openTime closeTime address image slug typeId')
                    .populate('typeId', 'name');
    } else if (type === 'Food') {
        queryBuilder.select('name description price address image slug');
    } else if (type === 'Art') {
        queryBuilder.select('name description video_url address image slug');
    }

    const results = await queryBuilder.lean(); // .lean() giúp query nhanh hơn

    if (!results || results.length === 0) {
      // Fallback: Nếu tìm theo keyword thất bại, thử tìm top 3 item bất kỳ của loại đó
      const fallbackResults = await model.find().limit(3).lean();
      return JSON.stringify({ 
          message: `Không tìm thấy chính xác '${keyword}', đây là một số gợi ý khác:`, 
          data: fallbackResults.map(i => ({ name: i.name })) 
      });
    }

    // Format dữ liệu nhỏ gọn để tiết kiệm Token OpenAI
    const cleanData = results.map(item => {
        const location = item.address ? `${item.address.wardId?.name || ''}, ${item.address.provinceId?.name || ''}` : "Hà Tĩnh";
        
        let priceInfo = "N/A";
        if (type === 'Food') priceInfo = item.price ? `${item.price.toLocaleString()}đ` : "Menu";
        if (type === 'Attraction') priceInfo = item.isFree ? "Miễn phí" : `${(item.minPrice||0).toLocaleString()}đ - ${(item.maxPrice||0).toLocaleString()}đ`;

        return {
            name: item.name,
            desc: item.description?.substring(0, 150), // Lấy 150 ký tự đầu
            loc: location,
            price: priceInfo,
            open: item.openTime ? `${new Date(item.openTime).getHours()}h` : null,
            close: item.closeTime ? `${new Date(item.closeTime).getHours()}h` : null
        };
    });

    return JSON.stringify(cleanData);

  } catch (err) {
    console.error("❌ DB Error:", err);
    return JSON.stringify({ error: "Lỗi truy xuất dữ liệu nội bộ." });
  }
};

// --- 3. CONTROLLER CHÍNH ---
const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message) return res.status(400).json({ message: "Vui lòng nhập nội dung." });

    // Lấy ngày hiện tại
    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN');

    // --- SYSTEM PROMPT (Bộ não của AI) ---
    const systemPrompt = `
      Bạn là Trợ lý du lịch Hà Tĩnh (AI Guide).
      Hôm nay là: ${dateStr}.

      QUY TRÌNH LÀM VIỆC:
      1. **Phân tích yêu cầu:** Xác định số người, ngân sách, sở thích, số ngày đi. (Nếu thiếu ngân sách, tự ước lượng dựa trên yêu cầu sang chảnh hay tiết kiệm).
      2. **Kiểm tra thời tiết (QUAN TRỌNG):** Dùng tool 'get_weather_forecast' để xem thời tiết. 
         - Nếu mưa: Ưu tiên gợi ý bảo tàng, quán cafe, ăn uống trong nhà, khu du lịch có mái che.
         - Nếu nắng: Ưu tiên biển, núi, hoạt động ngoài trời.
      3. **Tìm dữ liệu:** Dùng tool 'search_travel_data' để tìm địa điểm (Attraction) và quán ăn (Food) phù hợp.
      4. **Lập lịch trình:** Tổng hợp thông tin thành lịch trình chi tiết (Sáng/Trưa/Chiều/Tối).
      
      YÊU CẦU ĐẦU RA (MARKDOWN):
      - **Tiêu đề:** Hấp dẫn (VD: "Lịch trình khám phá Hà Tĩnh 2N1Đ...").
      - **Thời tiết:** Cảnh báo ngắn gọn.
      - **Lịch trình:** Chia theo khung giờ. Mỗi địa điểm phải có Tên + Địa chỉ (Huyện/Thị xã) + Giá vé ước tính.
      - **Tổng chi phí:** Ước tính cho cả chuyến đi.
      - **Giọng điệu:** Thân thiện, như một người bạn địa phương.
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // --- STEP 1: Gửi Request đầu tiên cho AI ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Hoặc gpt-3.5-turbo-0125 (tiết kiệm hơn)
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const aiMessage = completion.choices[0].message;

    // --- STEP 2: Xử lý nếu AI muốn dùng Tool ---
    if (aiMessage.tool_calls) {
      messages.push(aiMessage); // Lưu context cuộc hội thoại

      // Thực thi song song các tool (nếu AI gọi nhiều tool cùng lúc)
      await Promise.all(aiMessage.tool_calls.map(async (toolCall) => {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let toolResponse = "";

        if (fnName === "search_travel_data") {
          toolResponse = await queryDatabase(args.keyword, args.type, args.budget_level);
        } 
        else if (fnName === "get_weather_forecast") {
          // Gọi service thời tiết thật của bạn
          try {
             // Mockup nếu chưa có hàm thật: toolResponse = JSON.stringify({ temp: 28, condition: "Nắng đẹp" });
             toolResponse = JSON.stringify(await WeatherService.getForecast("Ha Tinh", args.days || 2));
          } catch (e) {
             toolResponse = JSON.stringify({ info: "Không lấy được thời tiết, cứ giả định là trời đẹp." });
          }
        }

        // Đẩy kết quả tool vào messages
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: fnName,
          content: toolResponse
        });
      }));

      // --- STEP 3: Gọi AI lần cuối để tổng hợp kết quả ---
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
      });

      return res.json({ 
        success: true, 
        message: finalResponse.choices[0].message.content 
      });
    }

    // Nếu AI không gọi tool (chỉ chém gió)
    return res.json({ 
      success: true, 
      message: aiMessage.content 
    });

  } catch (error) {
    console.error("❌ Chat Controller Error:", error);
    return res.status(500).json({ message: "Hệ thống đang bận, vui lòng thử lại sau." });
  }
};

module.exports = { handleChat };