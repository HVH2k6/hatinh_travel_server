const axios = require('axios');

const API_KEY = "7661635c59c50e7792f15e0e3aab9663";
// Tọa độ Hà Tĩnh (Để dự báo chính xác nhất)
const LAT = 18.3436; 
const LON = 105.9058;

const getForecast = async (startDateStr, days) => {
  try {
    // 1. Gọi API (Dự báo 5 ngày / 3 giờ)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&lang=vi&appid=${API_KEY}`;
    const response = await axios.get(url);
    const list = response.data.list;

    // 2. Xử lý ngày bắt đầu của khách
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(days));

    // Kiểm tra nếu ngày đi quá xa so với dự báo (API Free chỉ cho 5 ngày tới)
    const now = new Date();
    const maxForecastDate = new Date();
    maxForecastDate.setDate(now.getDate() + 5);

    if (start > maxForecastDate) {
      return "Thời gian chuyến đi quá xa so với dự báo chính xác (trên 5 ngày). Dựa theo khí hậu Hà Tĩnh: Mùa hè thường nắng nóng, chiều có thể dông. Mùa đông lạnh và mưa phùn.";
    }

    // 3. Lọc và tổng hợp dữ liệu theo ngày
    let weatherSummary = [];
    let currentProcessDate = new Date(start);

    for (let i = 0; i < days; i++) {
      // Format ngày so sánh (YYYY-MM-DD)
      const dateString = currentProcessDate.toISOString().split('T')[0];
      
      // Lấy các mốc dự báo trong ngày đó (API trả về nhiều mốc: 09:00, 12:00, 15:00...)
      // Ta lấy mốc 12:00 trưa để đại diện cho ban ngày
      const forecast = list.find(item => item.dt_txt.includes(`${dateString} 12:00:00`));

      if (forecast) {
        const temp = Math.round(forecast.main.temp);
        const desc = forecast.weather[0].description; // "mưa nhẹ", "bầu trời quang đãng"
        weatherSummary.push(`Ngày ${dateString}: ${temp}°C, ${desc}.`);
      } else {
        // Nếu không tìm thấy mốc 12h (có thể do hết dữ liệu API), fallback
        weatherSummary.push(`Ngày ${dateString}: Nhiệt độ khoảng 28-32°C.`);
      }

      // Tăng ngày lên
      currentProcessDate.setDate(currentProcessDate.getDate() + 1);
    }

    return weatherSummary.join(" ");

  } catch (error) {
    console.error("Weather API Error:", error.message);
    return "Hiện tại không lấy được dữ liệu thời tiết thực tế. Giả định thời tiết đẹp, nắng nhẹ.";
  }
};

module.exports = { getForecast };