const express = require('express');
const app = express();
// const port = 3001; // Vercel không quan tâm port này
const connection = require('./config/database');
const route = require('./routes/indexRouter');
const cors = require('cors');

app.use(express.urlencoded({ extended: true }));
// Sửa cors: Cụ thể domain frontend để bảo mật hơn (hoặc để true nếu test)
app.use(cors({ 
    origin: ["https://hatinhtravel.net", "https://www.hatinhtravel.net"], 
    credentials: true 
}));

app.use(express.json());

// Kết nối DB (Lưu ý: Trên Vercel nên dùng connection pool thay vì connect đơn lẻ nếu traffic cao)
connection.connect(); 

route(app);

// --- PHẦN QUAN TRỌNG NHẤT CẦN SỬA ---

// 1. Chỉ chạy app.listen khi ở máy local (để bạn code và test)
if (require.main === module) {
    const port = 3001;
    app.listen(port, () => console.log(`Listening on port ${port}`));
}

// 2. Xuất app ra để Vercel điều khiển (BẮT BUỘC)
module.exports = app;