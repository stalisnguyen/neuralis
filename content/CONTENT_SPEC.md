# Neuralis content spec

App: Neuralis (neural + Stalis), a self-study web app on AI and Robotics for a Vietnamese learner (and later a small study group) who wants to understand the field out of curiosity first and then work in it (AI engineer, Forward-Deployed AI Engineer, ML engineer, robotics, AI product roles). Mascot: Bit, a small friendly robot. She is learning Python from zero. She has a finance/marketing background, no engineering background, strong in product and lifecycle/CRM work.

## Language rule (important)
- Explanations, quiz questions and answers are written in VIETNAMESE, natural and plain, like a good Vietnamese tutor talking to a smart adult.
- Technical terms stay in ENGLISH (token, embedding, gradient descent, overfitting, inverse kinematics, PID controller...). The first time a term appears in a lesson, add a short Vietnamese gloss in brackets: "overfitting (mô hình học thuộc lòng dữ liệu cũ, gặp dữ liệu mới thì kém)".
- Titles are English (short), with a Vietnamese subtitle field.
- Code, code comments and variable names are English.
- Explain jargon with concrete everyday examples and analogies (shop, bank, Grab, Shopee, cooking, traffic in Saigon...). No analyst shorthand without saying what it means in practice.
- Never use the em dash character or unicode arrows (→ ← ↔); write "->" if needed. No LaTeX: write formulas in plain Unicode (x², Σ, √, θ, ∂L/∂w, ≤).
- Facts must be correct and current as of mid-2026 in general terms; avoid precise claims you are not sure of (exact benchmark numbers, exact prices, release dates). When something changes fast, say so ("tính đến 2026", "các con số thay đổi nhanh").
- Original writing only.

## Tracks and ids
- py: Python từ số 0 (ids py-01..)
- math: Toán cho AI (math-01..)
- ml: Machine Learning (ml-01..)
- llm: LLM và GenAI (llm-01..)
- robo: Robotics (robo-01..)
- career: Nghề nghiệp AI và Robotics (career-01..)

## kind=lesson   file: array (one file per task)
{
 "id":"llm-03", "track":"llm", "unit":"short unit name in English (lessons with the same unit form a chapter)", "order":3,
 "title":"Embeddings", "title_vi":"Biến chữ thành toạ độ ý nghĩa", "level":1|2|3 (1 beginner, 3 advanced), "minutes":6-15,
 "body":"lesson text in Vietnamese, 350-800 words. Plain paragraphs; lines starting with '- ' are bullets; a line starting with '## ' is a small heading; code blocks between lines containing only ``` (Python). Use **bold** sparingly for key ideas.",
 "terms":[{"en":"embedding","vi":"vector biểu diễn ý nghĩa"}] (3-8 key terms of this lesson),
 "lab":"optional lab id from the LAB LIST below when the lesson clearly matches one, else omit",
 "quiz":[{"q":"câu hỏi tiếng Việt","choices":["4 options"],"answer":0-3,"why":"giải thích 1-3 câu"}] (exactly 4 questions; test understanding, not memorising; answer positions balanced),
 "code":{ ... } (REQUIRED for every py lesson, optional elsewhere, see below),
 "takeaway":"one sentence the learner should remember"
}
code exercise:
{"prompt":"đề bài tiếng Việt, cụ thể, có ví dụ input/output","starter":"Python starter code with a function signature and TODO comment","solution":"a correct reference solution","tests":"Python code with assert statements that test the learner's function(s), at least 4 asserts incl. edge cases, each assert with a message string in Vietnamese, e.g. assert add(2,3)==5, 'add(2,3) phải bằng 5'","hint":"gợi ý tiếng Việt, không lộ lời giải"}
Code runs in Pyodide (Python 3.12 in the browser): standard library only, plus numpy where the lesson needs it (only in math/ml tracks). No input(), no files, no network. The checker runs starter+tests (must FAIL) and solution+tests (must PASS) with python3, so write solutions that really pass.

## LAB LIST (interactive simulations built into the app; reference them by id)
tokenizer (cắt chữ thành token), embedding-map (bản đồ 2D các từ gần nghĩa), sampling (temperature/top-p), attention (xem từ nào chú ý từ nào), rag (RAG mini: tìm đoạn liên quan rồi mới trả lời), prompt-lab (so sánh prompt), linear-regression (kéo điểm, xem đường hồi quy), gradient-descent (quả bóng lăn xuống dốc), neural-net (train mạng nhỏ phân loại điểm 2D), overfitting (độ phức tạp mô hình vs lỗi), confusion-matrix (precision/recall), robot-arm (cánh tay 2 khớp, forward/inverse kinematics), pid (giữ độ cao drone), pathfinding (A* và BFS trên lưới), q-learning (agent học đi trong lưới), kalman (lọc nhiễu cảm biến 1D), sensors (lidar quét phòng)

## kind=terms   file: array
{"id":"t-001","en":"overfitting","vi":"học thuộc lòng (mô hình khớp quá sát dữ liệu huấn luyện)","track":"ml","explain":"1-2 câu tiếng Việt giải thích bằng ví dụ đời thường"}

## kind=job   file: array
{"id":"job-fde","title":"Forward-Deployed AI Engineer","vi":"Kỹ sư AI triển khai tại khách hàng","what":"làm gì, 2-4 câu","day":"một ngày làm việc điển hình, 3-5 bullet lines '- '","skills":["..."],"tools":["..."],"start":"lộ trình bắt đầu từ nền của người học (không background kỹ thuật, mạnh product/CRM), 4-6 bullet lines","portfolio":["3 ý tưởng project portfolio cụ thể"],"interview":["4 câu hỏi phỏng vấn hay gặp"],"fit":"vì sao role này hợp hoặc không hợp với người có background product/lifecycle marketing, 2-3 câu"}

Validate: python3 /home/claude/neuralis/content/check.py <kind> <file>  until it prints OK.
Reply when done with only: file, counts, anything unsure (max 5 lines).
