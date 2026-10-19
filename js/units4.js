/* Lớp 4 — 20 Unit theo bảng tổng hợp anh gửi (Unit_1-20_Grammar_Vocabulary).
   Cấu trúc + danh sách từ: theo file gốc. Nghĩa tiếng Việt, câu ví dụ, mẹo ghi nhớ, hình minh hoạ: bản nháp do Claude soạn.
   vocab: [từ, nghĩa, hình]  — hình là emoji, hoặc chữ ngắn đặt trong ô màu (bắt đầu bằng '#').
   patterns: [{q: 'mẫu hỏi', a: 'mẫu trả lời', ex: [[hỏi, đáp], ...]}]
*/
window.UNITS4 = [
  {
    n: 1, title: 'My friends', vi: 'Bạn bè của em', icon: '🧒', topic: 'wh',
    patterns: [
      { q: 'Where are you from?', a: "I'm from …", ex: [['Where are you from?', "I'm from Viet Nam."], ['Where are you from?', "I'm from Australia."]] },
      { q: "Where's he / she from?", a: "He's / She's from …", ex: [["Where's he from?", "He's from Japan."], ["Where's she from?", "She's from Thailand."]] }
    ],
    tips: ['Tên nước luôn viết hoa chữ cái đầu: Japan, Viet Nam.', "He's = He is · She's = She is · I'm = I am"],
    vocab: [['America', 'nước Mỹ', '🇺🇸'], ['Australia', 'nước Úc', '🇦🇺'], ['Britain', 'nước Anh', '🇬🇧'], ['Japan', 'nước Nhật Bản', '🇯🇵'], ['Malaysia', 'nước Ma-lai-xi-a', '🇲🇾'], ['Singapore', 'nước Xin-ga-po', '🇸🇬'], ['Thailand', 'nước Thái Lan', '🇹🇭'], ['Viet Nam', 'nước Việt Nam', '🇻🇳']]
  },
  {
    n: 2, title: 'Time and daily routines', vi: 'Giờ giấc và sinh hoạt', icon: '⏰', topic: 'time',
    patterns: [
      { q: 'What time is it?', a: "It's …", ex: [['What time is it?', "It's seven o'clock."], ['What time is it?', "It's nine fifteen."]] },
      { q: 'What time do you …?', a: 'I … at …', ex: [['What time do you get up?', 'I get up at six thirty.'], ['What time do you go to bed?', 'I go to bed at nine forty-five.']] }
    ],
    tips: ["Trước giờ dùng at: at six o'clock.", '6:30 đọc là six thirty · 6:45 đọc là six forty-five.'],
    vocab: [['at', 'lúc (+ giờ)', '#at'], ['fifteen', 'mười lăm (phút)', '#15'], ['thirty', 'ba mươi (phút)', '#30'], ['forty-five', 'bốn mươi lăm (phút)', '#45'], ["o'clock", 'giờ đúng', '🕖'], ['get up', 'thức dậy', '⏰'], ['have breakfast', 'ăn sáng', '🍳'], ['go to school', 'đi học', '🏫'], ['go to bed', 'đi ngủ', '🛌']]
  },
  {
    n: 3, title: 'My week', vi: 'Tuần của em', icon: '📅', topic: 'prep',
    patterns: [
      { q: 'What day is it today?', a: "It's …", ex: [['What day is it today?', "It's Monday."], ['What day is it today?', "It's Friday."]] },
      { q: 'What do you do on …?', a: 'I …', ex: [['What do you do on Saturdays?', 'I do housework.'], ['What do you do on Sundays?', 'I listen to music.']] }
    ],
    tips: ['Trước thứ trong tuần dùng on: on Monday, on Sundays.', 'Thứ trong tuần luôn viết hoa: Monday, Tuesday…'],
    vocab: [['Monday', 'thứ Hai', '#T2'], ['Tuesday', 'thứ Ba', '#T3'], ['Wednesday', 'thứ Tư', '#T4'], ['Thursday', 'thứ Năm', '#T5'], ['Friday', 'thứ Sáu', '#T6'], ['Saturday', 'thứ Bảy', '#T7'], ['Sunday', 'Chủ nhật', '#CN'], ['do housework', 'làm việc nhà', '🧹'], ['listen to music', 'nghe nhạc', '🎧'], ['study at school', 'học ở trường', '📚']]
  },
  {
    n: 4, title: 'My birthday party', vi: 'Tiệc sinh nhật', icon: '🎂', topic: 'article',
    patterns: [
      { q: "When's your birthday?", a: "It's in …", ex: [["When's your birthday?", "It's in March."], ["When's your birthday?", "It's in January."]] },
      { q: 'What do you want to eat / drink?', a: 'I want …', ex: [['What do you want to eat?', 'I want some grapes.'], ['What do you want to drink?', 'I want some lemonade.']] }
    ],
    tips: ['Trước tháng dùng in: in April.', "When's = When is."],
    vocab: [['January', 'tháng Một', '#1'], ['February', 'tháng Hai', '#2'], ['March', 'tháng Ba', '#3'], ['April', 'tháng Tư', '#4'], ['birthday', 'sinh nhật', '🎂'], ['party', 'bữa tiệc', '🎉'], ['chips', 'khoai tây chiên', '🍟'], ['grapes', 'quả nho', '🍇'], ['jam', 'mứt', '🍓'], ['juice', 'nước ép', '🧃'], ['lemonade', 'nước chanh', '🍋'], ['water', 'nước', '💧']]
  },
  {
    n: 5, title: 'Things we can do', vi: 'Những việc em làm được', icon: '🎸', topic: 'can',
    patterns: [
      { q: 'Can you …?', a: "Yes, I can. / No, I can't.", ex: [['Can you swim?', 'Yes, I can.'], ['Can you play the piano?', "No, I can't."]] },
      { q: 'Can he / she …?', a: "Yes, he / she can. / No, he / she can't, but he / she can …", ex: [['Can he ride a horse?', 'Yes, he can.'], ['Can she cook?', "No, she can't, but she can draw."]] }
    ],
    tips: ['Sau can là động từ nguyên mẫu: She can swim (không viết can swims).', "can't = cannot (không thể)."],
    vocab: [['can', 'có thể', '💪'], ['cook', 'nấu ăn', '🍳'], ['draw', 'vẽ', '🎨'], ['play the guitar', 'chơi đàn ghi-ta', '🎸'], ['play the piano', 'chơi đàn piano', '🎹'], ['ride a bike', 'đi xe đạp', '🚲'], ['ride a horse', 'cưỡi ngựa', '🏇'], ['roller skate', 'trượt pa-tanh', '🛼'], ['swim', 'bơi', '🏊'], ['but', 'nhưng', '#but']]
  },
  {
    n: 6, title: 'Our school facilities', vi: 'Trường em có gì', icon: '🏫', topic: 'there',
    patterns: [
      { q: "Where's your school?", a: "It's in the …", ex: [["Where's your school?", "It's in the village."], ["Where's your school?", "It's in the city."]] },
      { q: 'How many … are there at your school?', a: 'There is / are …', ex: [['How many buildings are there at your school?', 'There are two buildings.'], ['How many gardens are there at your school?', 'There is one garden.']] }
    ],
    tips: ['1 cái: There is … · nhiều cái: There are …', 'How many luôn đi với are there.'],
    vocab: [['city', 'thành phố', '🏙️'], ['town', 'thị trấn', '🏘️'], ['village', 'làng', '🛖'], ['mountains', 'vùng núi', '⛰️'], ['building', 'toà nhà', '🏢'], ['computer room', 'phòng máy tính', '💻'], ['garden', 'khu vườn', '🌷'], ['playground', 'sân chơi', '🛝']]
  },
  {
    n: 7, title: 'Our timetables', vi: 'Thời khoá biểu', icon: '🗓️', topic: 'present',
    patterns: [
      { q: 'What subjects do you have today?', a: 'I have …', ex: [['What subjects do you have today?', 'I have maths and English.'], ['What subjects do you have today?', 'I have music and art.']] },
      { q: 'When do you have …?', a: 'I have it on …', ex: [['When do you have science?', 'I have it on Tuesdays.'], ['When do you have Vietnamese?', 'I have it on Mondays and Fridays.']] }
    ],
    tips: ['"it" thay cho tên môn học: I have it on Mondays.', 'Tên môn học không cần a / the phía trước.'],
    vocab: [['art', 'môn Mĩ thuật', '🎨'], ['English', 'môn Tiếng Anh', '🔤'], ['history and geography', 'môn Lịch sử và Địa lí', '🌏'], ['maths', 'môn Toán', '➗'], ['music', 'môn Âm nhạc', '🎵'], ['science', 'môn Khoa học', '🔬'], ['Vietnamese', 'môn Tiếng Việt', '📖']]
  },
  {
    n: 8, title: 'My favourite subjects', vi: 'Môn học em thích', icon: '💖', topic: 'wh',
    patterns: [
      { q: "What's your favourite subject?", a: "It's …", ex: [["What's your favourite subject?", "It's art."], ["What's your favourite subject?", "It's PE."]] },
      { q: 'Why do you like …?', a: 'Because I want to be …', ex: [['Why do you like art?', 'Because I want to be a painter.'], ['Why do you like English?', 'Because I want to be an English teacher.']] }
    ],
    tips: ['Trước nghề bắt đầu bằng a, e, i, o, u dùng an: an English teacher.', 'Hỏi lý do: Why…? — trả lời: Because…'],
    vocab: [['IT', 'môn Tin học', '💻'], ['PE', 'môn Thể dục', '⚽'], ['English teacher', 'giáo viên Tiếng Anh', '👩‍🏫'], ['maths teacher', 'giáo viên Toán', '🧮'], ['painter', 'hoạ sĩ', '🧑‍🎨'], ['because', 'bởi vì', '#vì'], ['why', 'tại sao', '❓']]
  },
  {
    n: 9, title: 'Our sports day', vi: 'Ngày hội thể thao', icon: '🏅', topic: 'prep',
    patterns: [
      { q: 'Is your sports day in …?', a: "Yes, it is. / No, it isn't. It's in …", ex: [['Is your sports day in May?', 'Yes, it is.'], ['Is your sports day in June?', "No, it isn't. It's in July."]] },
      { q: "When's your sports day?", a: "It's in …", ex: [["When's your sports day?", "It's in October."], ["When's your sports day?", "It's in December."]] }
    ],
    tips: ['Trước tháng dùng in: in September.', "Is … ? → Yes, it is. / No, it isn't."],
    vocab: [['May', 'tháng Năm', '#5'], ['June', 'tháng Sáu', '#6'], ['July', 'tháng Bảy', '#7'], ['August', 'tháng Tám', '#8'], ['September', 'tháng Chín', '#9'], ['October', 'tháng Mười', '#10'], ['November', 'tháng Mười Một', '#11'], ['December', 'tháng Mười Hai', '#12'], ['sports day', 'ngày hội thể thao', '🏅']]
  },
  {
    n: 10, title: 'Our summer holidays', vi: 'Kỳ nghỉ hè', icon: '🏖️', topic: 'past',
    patterns: [
      { q: 'Were you … last weekend?', a: "Yes, I was. / No, I wasn't.", ex: [['Were you at the beach last weekend?', 'Yes, I was.'], ['Were you in the countryside last weekend?', "No, I wasn't."]] },
      { q: 'Where were you last summer?', a: 'I was in …', ex: [['Where were you last summer?', 'I was in Tokyo.'], ['Where were you last summer?', 'I was at the campsite.']] }
    ],
    tips: ['Chuyện đã qua (last weekend, yesterday) dùng was / were.', 'in London · at the campsite · on the beach'],
    vocab: [['beach', 'bãi biển', '🏖️'], ['campsite', 'khu cắm trại', '⛺'], ['countryside', 'vùng nông thôn', '🌾'], ['Bangkok', 'Băng Cốc', '🇹🇭'], ['London', 'Luân Đôn', '🇬🇧'], ['Sydney', 'Xít-ni', '🇦🇺'], ['Tokyo', 'Tô-ky-ô', '🗼'], ['last', 'trước, vừa qua', '#last'], ['yesterday', 'hôm qua', '#hôm qua'], ['at', 'ở, tại (một điểm)', '#at'], ['on', 'ở trên', '#on'], ['in', 'ở trong', '#in']]
  },
  {
    n: 11, title: 'My home', vi: 'Nhà của em', icon: '🏠', topic: 'present',
    patterns: [
      { q: 'Where do you live?', a: 'I live …', ex: [['Where do you live?', 'I live in a big city.'], ['Where do you live?', 'I live at 15 Tran Phu Street.']] },
      { q: "What's the … like?", a: "It's …", ex: [["What's the street like?", "It's busy and noisy."], ["What's the road like?", "It's big and quiet."]] }
    ],
    tips: ['Số nhà dùng at: at 15 Tran Phu Street.', 'Tên đường dùng in: in Tran Phu Street.'],
    vocab: [['road', 'con đường', '🛣️'], ['street', 'đường phố', '🚏'], ['big', 'to, lớn', '🐘'], ['busy', 'đông đúc', '🚦'], ['noisy', 'ồn ào', '📢'], ['quiet', 'yên tĩnh', '🤫'], ['live', 'sống', '🏠']]
  },
  {
    n: 12, title: 'Jobs', vi: 'Nghề nghiệp', icon: '👩‍⚕️', topic: 'present',
    patterns: [
      { q: 'What does he / she do?', a: "He's / She's …", ex: [['What does he do?', "He's a farmer."], ['What does your mother do?', "She's a nurse."]] },
      { q: 'Where does he / she work?', a: 'He / She works …', ex: [['Where does she work?', 'She works in a hospital.'], ['Where does he work?', 'He works in a factory.']] }
    ],
    tips: ['He / She thì động từ thêm s: work → works, do → does.', 'a nurse · an actor · an office worker'],
    vocab: [['actor', 'diễn viên', '🎭'], ['farmer', 'nông dân', '🧑‍🌾'], ['nurse', 'y tá', '🧑‍⚕️'], ['office worker', 'nhân viên văn phòng', '🧑‍💼'], ['policeman', 'cảnh sát', '👮'], ['factory', 'nhà máy', '🏭'], ['farm', 'nông trại', '🚜'], ['hospital', 'bệnh viện', '🏥'], ['nursing home', 'viện dưỡng lão', '👵']]
  },
  {
    n: 13, title: 'Appearance', vi: 'Ngoại hình', icon: '👀', topic: 'present',
    patterns: [
      { q: 'What does he / she look like?', a: "He's / She's …", ex: [['What does he look like?', "He's tall and slim."], ['What does your father look like?', "He's big."]] },
      { q: 'What does he / she look like?', a: 'He / She has …', ex: [['What does she look like?', 'She has long hair.'], ['What does he look like?', 'He has a round face and big eyes.']] }
    ],
    tips: ["He's + tính từ: He's tall.", 'He has + bộ phận cơ thể: He has big eyes.'],
    vocab: [['big', 'to, lớn', '🐘'], ['short', 'thấp, ngắn', '🐭'], ['slim', 'mảnh khảnh', '🧍'], ['tall', 'cao', '🦒'], ['eyes', 'đôi mắt', '👀'], ['face', 'khuôn mặt', '🙂'], ['hair', 'tóc', '💇'], ['long', 'dài', '#dài'], ['round', 'tròn', '⚪']]
  },
  {
    n: 14, title: 'Daily activities', vi: 'Việc làm hằng ngày', icon: '🧹', topic: 'prep',
    patterns: [
      { q: 'When do you watch TV?', a: 'I watch TV …', ex: [['When do you watch TV?', 'I watch TV in the evening.'], ['When do you watch TV?', 'I watch TV at noon.']] },
      { q: 'What do you do in the morning?', a: 'I …', ex: [['What do you do in the morning?', 'I wash the dishes.'], ['What do you do in the afternoon?', 'I help with the cooking.']] }
    ],
    tips: ['in the morning · in the afternoon · in the evening', 'Riêng buổi trưa: at noon.'],
    vocab: [['in the morning', 'vào buổi sáng', '🌅'], ['at noon', 'vào buổi trưa', '🕛'], ['in the afternoon', 'vào buổi chiều', '🌤️'], ['in the evening', 'vào buổi tối', '🌆'], ['clean the floor', 'lau nhà', '🧽'], ['help with the cooking', 'giúp nấu ăn', '🍲'], ['wash the clothes', 'giặt quần áo', '👕'], ['wash the dishes', 'rửa bát', '🍽️']]
  },
  {
    n: 15, title: "My family's weekends", vi: 'Cuối tuần của gia đình', icon: '🎬', topic: 'present',
    patterns: [
      { q: 'Where does he / she go on Saturdays?', a: 'He / She goes to the …', ex: [['Where does he go on Saturdays?', 'He goes to the sports centre.'], ['Where does she go on Saturdays?', 'She goes to the cinema.']] },
      { q: 'What does he / she do on Sundays?', a: 'He / She …', ex: [['What does she do on Sundays?', 'She does yoga.'], ['What does he do on Sundays?', 'He plays tennis.']] }
    ],
    tips: ['He / She: go → goes, do → does, watch → watches.', 'Câu hỏi dùng does, động từ sau does giữ nguyên.'],
    vocab: [['cinema', 'rạp chiếu phim', '🎬'], ['shopping centre', 'trung tâm mua sắm', '🛍️'], ['sports centre', 'trung tâm thể thao', '🏟️'], ['swimming pool', 'bể bơi', '🏊'], ['cook meals', 'nấu các bữa ăn', '🍳'], ['do yoga', 'tập yoga', '🧘'], ['play tennis', 'chơi quần vợt', '🎾'], ['watch films', 'xem phim', '📺']]
  },
  {
    n: 16, title: 'Weather', vi: 'Thời tiết', icon: '🌦️', topic: 'past',
    patterns: [
      { q: 'What was the weather like last weekend?', a: 'It was …', ex: [['What was the weather like last weekend?', 'It was sunny.'], ['What was the weather like yesterday?', 'It was rainy and windy.']] },
      { q: 'Do you want to go to the …?', a: "Great! Let's go. / Sorry, I can't.", ex: [['Do you want to go to the water park?', "Great! Let's go."], ['Do you want to go to the bookshop?', "Sorry, I can't."]] }
    ],
    tips: ['Thời tiết đã qua dùng was: It was cloudy.', "Let's go = Chúng mình đi thôi!"],
    vocab: [['weather', 'thời tiết', '🌦️'], ['sunny', 'nắng', '☀️'], ['cloudy', 'nhiều mây', '☁️'], ['rainy', 'có mưa', '🌧️'], ['windy', 'có gió', '💨'], ['bakery', 'tiệm bánh', '🥐'], ['bookshop', 'hiệu sách', '📚'], ['food stall', 'quầy đồ ăn', '🍜'], ['water park', 'công viên nước', '🌊']]
  },
  {
    n: 17, title: 'In the city', vi: 'Trong thành phố', icon: '🏙️', topic: 'wh',
    patterns: [
      { q: 'What does it say?', a: "It says '…'.", ex: [['What does it say?', "It says 'Stop'."], ['What does it say?', "It says 'Turn left'."]] },
      { q: 'How can I get to the …?', a: 'Go straight / Turn left / Turn right …', ex: [['How can I get to the bakery?', 'Go straight and turn left.'], ['How can I get to the bookshop?', 'Turn right.']] }
    ],
    tips: ['turn left = rẽ trái · turn right = rẽ phải', 'go straight = đi thẳng · turn round = quay lại'],
    vocab: [['get', 'đi đến', '#get'], ['go straight', 'đi thẳng', '⬆️'], ['left', 'bên trái', '⬅️'], ['right', 'bên phải', '➡️'], ['stop', 'dừng lại', '🛑'], ['turn', 'rẽ', '↪️'], ['turn left', 'rẽ trái', '⬅️'], ['turn right', 'rẽ phải', '➡️'], ['turn round', 'quay lại', '🔄']]
  },
  {
    n: 18, title: 'At the shopping centre', vi: 'Ở trung tâm mua sắm', icon: '🛍️', topic: 'position',
    patterns: [
      { q: "Where's the bookshop?", a: "It's …", ex: [["Where's the bookshop?", "It's opposite the bakery."], ["Where's the gift shop?", "It's between the cinema and the food stall."]] },
      { q: 'How much is the …?', a: "It's …", ex: [['How much is the T-shirt?', "It's seventy thousand dong."], ['How much is the skirt?', "It's ninety thousand dong."]] }
    ],
    tips: ['between A and B = ở giữa A và B', 'opposite = đối diện · near = gần · behind = phía sau'],
    vocab: [['behind', 'phía sau', '#sau'], ['between', 'ở giữa', '#giữa'], ['near', 'gần', '#gần'], ['opposite', 'đối diện', '#đối diện'], ['gift shop', 'cửa hàng quà tặng', '🎁'], ['skirt', 'chân váy', '👗'], ['T-shirt', 'áo phông', '👕'], ['dong', 'đồng (tiền)', '💵'], ['thousand', 'nghìn', '#1000']]
  },
  {
    n: 19, title: 'The animal world', vi: 'Thế giới động vật', icon: '🦁', topic: 'adverb',
    patterns: [
      { q: 'What are these animals?', a: "They're …", ex: [['What are these animals?', "They're giraffes."], ['What are these animals?', "They're hippos."]] },
      { q: 'Why do you like …?', a: 'Because they …', ex: [['Why do you like lions?', 'Because they roar loudly.'], ['Why do you like birds?', 'Because they sing merrily.']] }
    ],
    tips: ['Nhiều con vật thêm s: lion → lions.', 'Động từ + trạng từ đuôi -ly: run quickly, dance beautifully.'],
    vocab: [['crocodiles', 'những con cá sấu', '🐊'], ['giraffes', 'những con hươu cao cổ', '🦒'], ['hippos', 'những con hà mã', '🦛'], ['lions', 'những con sư tử', '🦁'], ['dance beautifully', 'nhảy đẹp', '💃'], ['roar loudly', 'gầm to', '📣'], ['run quickly', 'chạy nhanh', '🏃'], ['sing merrily', 'hót vui vẻ', '🎤']]
  },
  {
    n: 20, title: 'At summer camp', vi: 'Trại hè', icon: '⛺', topic: 'continuous',
    patterns: [
      { q: "What's he / she doing?", a: "He's / She's …", ex: [["What's he doing?", "He's taking a photo."], ["What's she doing?", "She's singing songs."]] },
      { q: 'What are they doing?', a: "They're …", ex: [['What are they doing?', "They're putting up a tent."], ['What are they doing?', "They're playing tug of war."]] }
    ],
    tips: ['Đang làm gì: is / are + động từ thêm -ing.', "He's = He is · They're = They are"],
    vocab: [['building a campfire', 'đốt lửa trại', '🔥'], ['dancing around the campfire', 'nhảy quanh lửa trại', '💃'], ['playing card games', 'chơi bài', '🃏'], ['playing tug of war', 'chơi kéo co', '🪢'], ['putting up a tent', 'dựng lều', '⛺'], ['singing songs', 'hát', '🎶'], ['taking a photo', 'chụp ảnh', '📸'], ['telling a story', 'kể chuyện', '📖']]
  }
];

window.REVIEWS4 = [
  { id: 'review-1', after: 5, title: 'Ôn tập 1', from: 1, to: 5 },
  { id: 'review-2', after: 10, title: 'Ôn tập 2', from: 6, to: 10 },
  { id: 'review-3', after: 15, title: 'Ôn tập 3', from: 11, to: 15 }
];

/* Ngữ pháp tổng hợp — nội dung mặc định. Admin sửa được trong app (lưu đè lên bản này). */
window.GRAMMAR_DEFAULT = [
  { id: 'be', group: 'Động từ', title: 'Động từ to be: am / is / are',
    explain: 'To be nghĩa là "là, thì, ở". Chọn am / is / are theo người đứng trước.',
    table: [['I', 'am', "I am ten. (I'm)"], ['He / She / It · 1 người', 'is', "She is from Japan. (She's)"], ['You / We / They · nhiều người', 'are', "We are friends. (We're)"], ['Câu hỏi', 'đảo to be lên đầu', 'Is she from Britain? — Yes, she is.'], ['Phủ định', 'thêm not', "He isn't from Thailand."]],
    examples: ["I'm from Viet Nam.", 'They are from Australia.'] },
  { id: 'present', group: 'Thì', title: 'Hiện tại đơn',
    explain: 'Nói thói quen, việc lặp lại. Với He / She / 1 người, động từ thêm s hoặc es. Câu hỏi và phủ định mượn do / does.',
    table: [['I / You / We / They', 'I live in a big city.', 'Do you have art today? — Yes, I do.'], ['He / She / 1 người', 'She works in a hospital.', 'Where does he work?'], ['Thêm es', 'go → goes, watch → watches', 'He goes to the cinema.'], ['Phủ định', "I don't …", "She doesn't like science."]],
    examples: ['He works on a farm.', 'She goes to the sports centre on Saturdays.'] },
  { id: 'continuous', group: 'Thì', title: 'Hiện tại tiếp diễn',
    explain: 'Nói việc đang xảy ra ngay lúc này: am / is / are + động từ thêm -ing.',
    table: [['I', "I'm reading.", ''], ['He / She', "She's taking a photo.", ''], ['We / They', "They're putting up a tent.", ''], ['Hỏi', 'What are they doing?', "They're singing songs."]],
    examples: ["He's building a campfire.", "They're playing tug of war."] },
  { id: 'past', group: 'Thì', title: 'Quá khứ của to be: was / were',
    explain: 'Dùng khi nói chuyện đã qua: yesterday, last weekend, last summer.',
    table: [['I / He / She / It', "was / wasn't", 'I was at the zoo.'], ['You / We / They', "were / weren't", 'They were in London.'], ['Hỏi', 'Were you … ?', "Yes, I was. / No, I wasn't."], ['Thời tiết', 'It was …', 'It was sunny last weekend.']],
    examples: ['Where were you last summer?', 'It was rainy yesterday.'] },
  { id: 'can', group: 'Động từ', title: 'Động từ can',
    explain: 'can + động từ nguyên mẫu, để nói việc mình làm được. Giống nhau với mọi người.',
    table: [['Khẳng định', 'She can swim.', ''], ['Phủ định', "He can't draw.", "can't = cannot"], ['Hỏi', 'Can you sing?', "Yes, I can. / No, I can't."]],
    examples: ['I can ride a bike.', "She can't cook, but she can draw."] },
  { id: 'there', group: 'Mẫu câu', title: 'There is / There are',
    explain: 'Dùng để nói "có cái gì".',
    table: [['1 vật', 'There is a library.', ''], ['Nhiều vật', 'There are two gardens.', ''], ['Hỏi số lượng', 'How many … are there?', 'There are three.']],
    examples: ['There is a computer room at my school.'] },
  { id: 'wh', group: 'Mẫu câu', title: 'Từ để hỏi',
    explain: 'Mỗi từ để hỏi dùng cho một loại thông tin.',
    table: [['What', 'cái gì', 'What can you do?'], ['What time', 'mấy giờ', 'What time do you get up?'], ['Where', 'ở đâu', 'Where is your school?'], ['When', 'khi nào', "When's your birthday?"], ['Who', 'ai', 'Who is your best friend?'], ['How many', 'bao nhiêu', 'How many books are there?'], ['How much', 'giá bao nhiêu', 'How much is the skirt?'], ['Why', 'tại sao', 'Why do you like art?']],
    examples: ['How can I get to the bakery?'] },
  { id: 'prep', group: 'Từ loại', title: 'Giới từ chỉ thời gian: at / on / in',
    explain: 'Ba giới từ hay gặp nhất khi nói về thời gian.',
    table: [['at + giờ', "at seven o'clock", 'at noon'], ['on + thứ', 'on Monday(s)', ''], ['in + tháng / buổi', 'in May', 'in the morning, in the evening']],
    examples: ['I have English on Mondays.', 'My birthday is in March.'] },
  { id: 'position', group: 'Từ loại', title: 'Giới từ chỉ vị trí',
    explain: 'Nói đồ vật, cửa hàng ở đâu so với chỗ khác.',
    table: [['near', 'gần', "It's near the cinema."], ['behind', 'phía sau', "It's behind the bakery."], ['opposite', 'đối diện', "It's opposite the bookshop."], ['between … and …', 'ở giữa', "It's between the bakery and the cinema."]],
    examples: ["Where's the gift shop? — It's near the food stall."] },
  { id: 'article', group: 'Từ loại', title: 'a / an / some',
    explain: 'a / an cho 1 vật đếm được; some cho nhiều vật hoặc thứ không đếm được.',
    table: [['a', 'a cake, a farmer', 'âm đầu là phụ âm'], ['an', 'an apple, an actor', 'âm đầu là nguyên âm'], ['some', 'some grapes, some juice', 'nhiều vật / không đếm được']],
    examples: ['I want some lemonade.', 'She is an English teacher.'] },
  { id: 'adverb', group: 'Từ loại', title: 'Trạng từ chỉ cách thức (-ly)',
    explain: 'Trạng từ đứng sau động từ, nói làm việc đó như thế nào. Thường thêm -ly vào tính từ.',
    table: [['quick → quickly', 'nhanh', 'They run quickly.'], ['loud → loudly', 'to', 'Lions roar loudly.'], ['beautiful → beautifully', 'đẹp', 'She dances beautifully.']],
    examples: ['Birds sing merrily.'] }
];
;
(window.LN_V=window.LN_V||{})["units4.js"]="87455823";
