# Neuralis - Stalis's AI & Robotics

App tự học AI và Robotics từ con số 0, cùng robot Bit. Cùng khung với Stalong, Catalis, Calculis.

- 6 nhánh: Python (32 bài), Math for AI (14), Machine Learning (20), LLM & GenAI (26), Robotics (26), Career (8). Giải thích tiếng Việt, thuật ngữ tiếng Anh.
- Mỗi bài: nội dung, thuật ngữ, quiz 4 câu, bài code Python chấm tự động (76 bài), lab gắn kèm.
- Python chạy trong trình duyệt bằng Pyodide (Web Worker, dừng sau 12 giây nếu lặp vô hạn).
- 17 lab mô phỏng: tokenizer, sampling, embedding, attention, RAG, prompt lab, linear regression, gradient descent, neural net, overfitting, precision/recall, robot arm, PID, A*/BFS, Q-learning, Kalman, lidar.
- 220 thẻ thuật ngữ (lặp lại ngắt quãng), 14 hồ sơ nghề, trợ lý Bit (Groq), XP, streak, danh hiệu Newbie -> Pioneer, đồng bộ tên + PIN, bảng bạn học.

## Cấu trúc
- `src/` + `build.py` -> `index.html`. `python3 tools/build_data.py` đóng gói `content/out` vào `data/`.
- `content/CONTENT_SPEC.md`, `content/check.py` (chạy lời giải và test của mọi bài code).
- `api/`: `ai.js`, `sync.js` (khóa `neuralis:`), `board.js`, `status.js`.

## Biến môi trường trên Vercel
`APP_PASSWORD`, `GROQ_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` (dùng chung Upstash với các app khác được).
