# Aurora English — bản đưa lên Vercel

## Trong thư mục này
| Tệp | Là gì |
|---|---|
| `index.html` | Trang app (nhẹ, ~0,3 MB) |
| `js/` | Bài học, hình, file nghe, trò chơi… (trình duyệt tự lưu đệm, lần sau mở nhanh) |
| `api/ai.js` | Máy chủ nhỏ của **Trợ lý AI Chíp** (gọi Gemini – Google AI Studio) |
| `lib/ai_prompts.js` | Câu lệnh cho AI (an toàn cho trẻ em, chỉ nói chuyện học tiếng Anh) |
| `vercel.json`, `package.json` | Cấu hình Vercel (không cần cài thêm gì) |

## Cách 1 — qua GitHub (dễ nhất)
1. Vào github.com → **New repository** (đặt tên ví dụ `aurora-english`, để Private cũng được).
2. Bấm **uploading an existing file** → kéo **toàn bộ nội dung** thư mục này (cả 3 thư mục `api`, `js`, `lib` và các tệp) vào → **Commit**.
3. Vào vercel.com → **Add New… → Project** → chọn repo vừa tạo → Framework Preset: **Other** → **Deploy**.

## Cách 2 — bằng lệnh (nếu máy có Node.js)
```
cd thu-muc-nay
npx vercel --prod
```

## Bật Trợ lý AI Chíp (chỉ cô làm 1 lần, học sinh không cần làm gì)
1. Vào **aistudio.google.com/apikey** → đăng nhập Gmail → **Create API key** → sao chép khoá (dạng `AIza…`).
2. Vercel → dự án → **Settings → Environment Variables** → thêm:
   - Name: `GEMINI_API_KEY` — Value: khoá vừa chép → **Save**.
   - (Không bắt buộc) `GEMINI_MODEL` — ví dụ `gemini-2.5-flash`. Để trống thì app tự chọn.
3. **Deployments** → bấm ⋯ ở bản mới nhất → **Redeploy**.
4. Kiểm tra: đăng nhập Khu giáo viên → **Trợ lý AI Chíp** → bấm **Thử Chíp AI**.

Khoá chỉ nằm trên máy chủ Vercel, không lộ ra trình duyệt của học sinh. Gói miễn phí có giới hạn lượt dùng
mỗi phút/ngày; khi hết lượt, app tự quay về cách chấm phát âm cũ của trình duyệt.

## Chíp AI làm gì trong app
- **Thẻ nói**: chấm phát âm từng từ (từ nào đúng xanh, sai đỏ) + mẹo sửa bằng tiếng Việt.
- **Cô hỏi – em trả lời**: chấm câu trả lời (đúng ý, đúng ngữ pháp, phát âm) + câu mẫu nên nói.
- **Hỏi Chíp** (mục mới trên thanh menu): trò chuyện tiếng Anh bằng chữ hoặc giọng nói, theo chủ đề Unit đang học.
- **Làm bài sai**: nút **🤖 Hỏi Chíp vì sao?** giải thích dễ hiểu kèm ví dụ.

## Bật lưu dữ liệu chung trên mạng (tài khoản, tiến độ, điểm danh, học phí)
1. Vercel → mở dự án → tab **Storage** → **Create Database** (hoặc **Browse Marketplace**).
2. Chọn **Upstash** → **Upstash for Redis** → **Continue**. Chọn vùng gần Việt Nam (**Singapore**), gói **Free** → **Create**.
3. Ở bước **Connect Project**: chọn dự án Aurora English → **Connect**. Vercel tự thêm biến `KV_REST_API_URL`, `KV_REST_API_TOKEN`.
4. **Deployments** → ⋯ → **Redeploy**.
5. Mở trang → **Khu giáo viên** → đăng nhập. Lần đầu, dữ liệu đang có trên máy cô sẽ tự được đưa lên mạng.

Khi chưa bật bước này, app vẫn chạy như cũ (chỉ lưu trên từng máy).
