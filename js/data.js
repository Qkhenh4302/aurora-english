/* Nội dung Tiếng Anh lớp 4 — dựng từ bộ bài tập anh gửi (Unit 1–10).
   Đáp án, từ vựng, phần giải thích ngữ pháp là BẢN NHÁP do Claude soạn — cần giáo viên duyệt.
   Kiểu bài tập:
     mcq   : chọn 1 đáp án            items:[{q, o:[...], a:index}]
     fill  : gõ từ vào chỗ trống       items:[{q:'... ___ ...', a:['đáp án', ...]}]
     order : sắp xếp từ thành câu      items:[{w:'từ/từ/từ', a:['câu đúng', ...]}]
     fix   : viết lại câu đúng         items:[{q:'câu sai hoặc gợi ý', a:['câu đúng', ...]}]
     match : nối                       left:[...], right:[...], a:[chỉ số right cho từng left]
*/
window.CURRICULUM = {
  levels: [
    { id: 'th', name: 'Tiểu học', grades: [1, 2, 3, 4, 5] },
    { id: 'thcs', name: 'THCS', grades: [6, 7, 8, 9] }
  ],
  book: 'Global Success'
};

window.GRADE_CONTENT = {};

window.GRADE_CONTENT[4] = {
  grade: 4,
  units: [
  /* ============================ UNIT 1 ============================ */
  {
    n: 1, title: 'My friends', vi: 'Bạn bè của em',
    vocab: [
      ['Britain', '/ˈbrɪtn/', 'nước Anh'],
      ['British', '/ˈbrɪtɪʃ/', 'người Anh'],
      ['America', '/əˈmerɪkə/', 'nước Mỹ'],
      ['American', '/əˈmerɪkən/', 'người Mỹ'],
      ['Australia', '/ɒˈstreɪliə/', 'nước Úc'],
      ['Australian', '/ɒˈstreɪliən/', 'người Úc'],
      ['Japan', '/dʒəˈpæn/', 'nước Nhật Bản'],
      ['Japanese', '/ˌdʒæpəˈniːz/', 'người Nhật'],
      ['Malaysia', '/məˈleɪʒə/', 'nước Ma-lai-xi-a'],
      ['Singapore', '/ˌsɪŋəˈpɔː/', 'nước Xin-ga-po'],
      ['Thailand', '/ˈtaɪlænd/', 'nước Thái Lan'],
      ['Thai', '/taɪ/', 'người Thái Lan'],
      ['Viet Nam', '/ˌvjetˈnæm/', 'nước Việt Nam'],
      ['Vietnamese', '/ˌvjetnəˈmiːz/', 'người Việt Nam'],
      ['friend', '/frend/', 'bạn bè'],
      ['nationality', '/ˌnæʃəˈnæləti/', 'quốc tịch']
    ],
    grammar: [
      {
        title: 'Hỏi ai đó đến từ đâu',
        topic: 'wh',
        explain: 'Dùng "Where … from?" để hỏi một người đến từ nước nào. Câu trả lời dùng "from" + tên nước.',
        table: [
          ['Hỏi bạn', 'Where are you from?', "I'm from Viet Nam."],
          ['Hỏi về bạn nam', "Where's he from?", "He's from Japan."],
          ['Hỏi về bạn nữ', "Where's she from?", "She's from Australia."],
          ['Hỏi về nhiều người', 'Where are they from?', "They're from America."]
        ]
      },
      {
        title: 'Động từ to be: am / is / are',
        topic: 'be',
        explain: 'Chọn am, is hoặc are theo chủ ngữ đứng trước nó.',
        table: [
          ['I', 'am', "I am from Viet Nam. (I'm)"],
          ['He / She / It / 1 người', 'is', "She is from Thailand. (She's)"],
          ['You / We / They / 2 người trở lên', 'are', "They are from Britain. (They're)"]
        ],
        mistakes: [
          ['We is from Viet Nam.', 'We are from Viet Nam.', 'We luôn đi với are.'],
          ['Where she is from?', 'Where is she from?', 'Câu hỏi: đảo is lên trước chủ ngữ.']
        ]
      },
      {
        title: 'Hỏi quốc tịch',
        topic: 'wh',
        explain: 'Tên nước khác tên người của nước đó: Japan → Japanese, Thailand → Thai.',
        table: [
          ['Hỏi', 'What nationality are you?', "I'm Vietnamese."],
          ['Trả lời bằng nước', 'Where are you from?', "I'm from Viet Nam."]
        ]
      }
    ],
    lesson: {
      patterns: [
        ['Where are you from?', "I'm from Viet Nam."],
        ["Where's he from?", "He's from Singapore."],
        ["Where's she from?", "She's from Malaysia."],
        ['What nationality are you?', "I'm Vietnamese."]
      ],
      readings: [
        {
          title: 'Hai bạn mới',
          text: 'Name: Nguyen Thi Lan. Hometown: Ho Chi Minh City, Viet Nam. School: Nguyen Hue Primary School. Class: 4A5.\n\nName: John. Hometown: London, England. School: International Primary School. Class: 4A1.'
        }
      ]
    },
    exercises: [
      {
        id: 'g4u1e1', type: 'fill', title: 'Điền am, is hoặc are', topic: 'be',
        bank: ['am', 'is', 'are'],
        items: [
          { q: 'I ___ from England.', a: ['am'] },
          { q: 'He ___ from Japan.', a: ['is'] },
          { q: 'They ___ from Australia.', a: ['are'] },
          { q: 'I ___ from America.', a: ['am'] },
          { q: 'They ___ from Viet Nam.', a: ['are'] },
          { q: 'She ___ from Thailand.', a: ['is'] }
        ]
      },
      {
        id: 'g4u1e2', type: 'mcq', title: 'Chọn từ đúng', topic: 'be',
        items: [
          { q: "Tony is seven years old. ___ from Britain.", o: ["He's", "She's", "We're", "They're"], a: 0 },
          { q: "Lily is nine years old. ___ from Australia.", o: ["He's", "She's", "We're", "They're"], a: 1 },
          { q: "Nam and I are friends. ___ from Viet Nam.", o: ["He's", "She's", "We're", "They're"], a: 2 },
          { q: "Anna and Lily are sisters. ___ from America.", o: ["He's", "She's", "We're", "They're"], a: 3 },
          { q: 'They ___ from Korea.', o: ['is', 'are', "isn't", 'am'], a: 1 },
          { q: 'Anna ___ from Japan.', o: ['is', 'are', 'am', "aren't"], a: 0 },
          { q: 'She ___ from Brazil.', o: ['is', 'are', 'am', 'am not'], a: 0 },
          { q: 'There ___ four seasons.', o: ['are', 'is', 'am', "isn't"], a: 0 },
          { q: 'His name ___ Anna.', o: ['are', 'am', "aren't", 'is'], a: 3 },
          { q: '___ she from Britain?', o: ['Is', 'Are', 'Am', "Aren't"], a: 0 },
          { q: '___ you from Thailand?', o: ["Isn't", 'Is', 'Am', 'Are'], a: 3 },
          { q: 'I ___ from Viet Nam.', o: ['am', 'is', "isn't", "aren't"], a: 0 }
        ]
      },
      {
        id: 'g4u1e3', type: 'mcq', title: 'Where ___ … from?', topic: 'be',
        items: [
          { q: 'Where ___ you from?', o: ['am', 'is', 'are'], a: 2 },
          { q: 'Where ___ he from?', o: ['am', 'is', 'are'], a: 1 },
          { q: 'Where ___ Julia and Ana from?', o: ['am', 'is', 'are'], a: 2 },
          { q: 'Where ___ Helena from?', o: ['am', 'is', 'are'], a: 1 },
          { q: 'Where ___ they from?', o: ['am', 'is', 'are'], a: 2 },
          { q: 'Where ___ I from?', o: ['am', 'is', 'are'], a: 0 },
          { q: 'Where ___ she from?', o: ['am', 'is', 'are'], a: 1 },
          { q: 'Where ___ your friend from?', o: ['am', 'is', 'are'], a: 1 },
          { q: '___ you from Thailand?', o: ['Am', 'Is', 'Are'], a: 2 },
          { q: '___ she from Malaysia?', o: ['Am', 'Is', 'Are'], a: 1 }
        ]
      },
      {
        id: 'g4u1e4', type: 'order', title: 'Sắp xếp thành câu hỏi và câu trả lời', topic: 'wh',
        items: [
          { w: 'is/Where/Anna/from/?', a: ['Where is Anna from?'] },
          { w: 'from/She/is/Thailand/.', a: ['She is from Thailand.'] },
          { w: 'is/Where/John/from/?', a: ['Where is John from?'] },
          { w: 'from/He/is/Britain/.', a: ['He is from Britain.'] },
          { w: 'they/Where/are/from/?', a: ['Where are they from?'] },
          { w: 'They/are/Brazil/from/.', a: ['They are from Brazil.'] },
          { w: 'is/Where/Lucas/from/?', a: ['Where is Lucas from?'] },
          { w: 'Where/Jeong/from/is/?', a: ['Where is Jeong from?'] }
        ]
      },
      {
        id: 'g4u1e5', type: 'fill', title: 'Viết quốc tịch', topic: 'vocab',
        items: [
          { q: 'She is from Britain, so she is ___.', a: ['British', 'English'] },
          { q: 'He is from Korea, so he is ___.', a: ['Korean'] },
          { q: 'They are from Australia, so they are ___.', a: ['Australian'] },
          { q: 'We are from Thailand, so we are ___.', a: ['Thai'] },
          { q: 'Helen and Sam are from England, so they are ___.', a: ['English', 'British'] },
          { q: 'Helmut is from Brazil, so he is ___.', a: ['Brazilian'] },
          { q: 'Bruce is from Japan, so he is ___.', a: ['Japanese'] }
        ]
      },
      {
        id: 'g4u1e6', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'wh',
        left: ["What's your name?", 'How old are you?', 'Where are you from?', 'What nationality are you?', 'Do you like summer?', 'Where is she from?', 'Are they from England?', 'Is she from Viet Nam?'],
        right: ["I'm nine years old.", 'My name is Lisa.', "I'm from the U.S.A.", "I'm Korean.", 'Yes, I do.', 'She is from Brazil.', "No, they aren't.", 'Yes, she is.'],
        a: [1, 0, 2, 3, 4, 5, 6, 7]
      },
      {
        id: 'g4u1e7', type: 'mcq', title: 'Đọc hiểu: Lan và John', topic: 'reading', reading: 0,
        items: [
          { q: "What is the girl's name?", o: ['Nguyen Thi Lan', 'Nguyen Hue', 'John'], a: 0 },
          { q: 'Where is she from?', o: ['London, England', 'Ho Chi Minh City, Viet Nam', 'Ha Noi, Viet Nam'], a: 1 },
          { q: "What is her school's name?", o: ['International Primary School', 'Nguyen Hue Primary School', 'Le Loi Primary School'], a: 1 },
          { q: 'What nationality is she?', o: ['Vietnamese', 'English', 'Thai'], a: 0 },
          { q: "What is the boy's name?", o: ['Lan', 'Tony', 'John'], a: 2 },
          { q: 'Where is he from?', o: ['London, England', 'Sydney, Australia', 'Tokyo, Japan'], a: 0 },
          { q: 'What class is he in?', o: ['4A5', '4A1', '5A1'], a: 1 }
        ]
      }
    ]
  },

  /* ============================ UNIT 2 ============================ */
  {
    n: 2, title: 'Time and daily routines', vi: 'Giờ giấc và sinh hoạt hằng ngày',
    vocab: [
      ['get up', '/ɡet ʌp/', 'thức dậy'],
      ['wash my face', '/wɒʃ maɪ feɪs/', 'rửa mặt'],
      ['clean my teeth', '/kliːn maɪ tiːθ/', 'đánh răng'],
      ['have breakfast', '/hæv ˈbrekfəst/', 'ăn sáng'],
      ['go to school', '/ɡəʊ tə skuːl/', 'đi học'],
      ['have lunch', '/hæv lʌntʃ/', 'ăn trưa'],
      ['go home', '/ɡəʊ həʊm/', 'về nhà'],
      ['have dinner', '/hæv ˈdɪnə/', 'ăn tối'],
      ['do homework', '/duː ˈhəʊmwɜːk/', 'làm bài tập về nhà'],
      ['go to bed', '/ɡəʊ tə bed/', 'đi ngủ'],
      ["o'clock", '/əˈklɒk/', 'giờ đúng'],
      ['fifteen', '/ˌfɪfˈtiːn/', 'mười lăm (phút)'],
      ['thirty', '/ˈθɜːti/', 'ba mươi (phút)'],
      ['forty-five', '/ˌfɔːti ˈfaɪv/', 'bốn mươi lăm (phút)']
    ],
    grammar: [
      {
        title: 'Hỏi và nói giờ',
        topic: 'time',
        explain: 'Giờ đúng dùng "o\'clock". Giờ lẻ: nói giờ trước, phút sau.',
        table: [
          ['Hỏi', 'What time is it?', "It's seven o'clock. (7:00)"],
          ['Giờ lẻ', '', "It's six fifteen. (6:15)"],
          ['', '', "It's five thirty. (5:30)"],
          ['', '', "It's six forty-five. (6:45)"]
        ]
      },
      {
        title: 'Hỏi bạn làm gì lúc mấy giờ',
        topic: 'time',
        explain: 'Dùng "at" trước giờ cụ thể.',
        table: [
          ['Hỏi', 'What time do you get up?', "I get up at six o'clock."],
          ['', 'What time do you go to bed?', 'I go to bed at ten thirty.']
        ],
        mistakes: [
          ["I get up on six o'clock.", "I get up at six o'clock.", 'Trước giờ dùng at, không dùng on.'],
          ["What time you get up?", 'What time do you get up?', 'Câu hỏi cần có do.'],
          ["I go to home at five o'clock.", "I go home at five o'clock.", 'go home không có to.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ['What time is it?', "It's seven o'clock."],
        ['What time do you get up?', 'I get up at six thirty.'],
        ['What time do you go to school?', "I go to school at seven o'clock."],
        ['What time do you go to bed?', 'I go to bed at ten thirty.']
      ],
      readings: [
        {
          title: 'Một ngày của John',
          text: "Good morning everyone! My name's John. I get up at six o'clock. I have breakfast at seven o'clock. I go to school by bike and have lunch in my school canteen at eleven thirty. After school, I go home at five o'clock in the afternoon. I play badminton with my sister at five fifteen then I have a bath. I have dinner at six forty-five and do my homework at eight o'clock. I go to bed at ten thirty."
        }
      ]
    },
    exercises: [
      {
        id: 'g4u2e1', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'time',
        items: [
          { w: "I/at/7 o'clock/in/the/morning/get/up/.", a: ["I get up at 7 o'clock in the morning."] },
          { w: "I/to/go/school/at/8 o'clock/in/the/morning/.", a: ["I go to school at 8 o'clock in the morning."] },
          { w: "bed/to/I/at/10 o'clock/at night/go/.", a: ["I go to bed at 10 o'clock at night."] },
          { w: "I/at/5 o'clock/in/the/afternoon/watch/TV/.", a: ["I watch TV at 5 o'clock in the afternoon."] },
          { w: 'What/do/you/time/get/up/?', a: ['What time do you get up?'] },
          { w: 'you/have/in/the/Do/morning/breakfast/?', a: ['Do you have breakfast in the morning?'] },
          { w: 'I/to/school/by/car/go/.', a: ['I go to school by car.'] },
          { w: 'Do/go/to/school/by/bike/you/?', a: ['Do you go to school by bike?'] },
          { w: "have/dinner/I/at/seven/o'clock/.", a: ["I have dinner at seven o'clock."] },
          { w: 'What/do/to/school/go/time/you/?', a: ['What time do you go to school?'] }
        ]
      },
      {
        id: 'g4u2e2', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'time',
        left: ['What time do you get up?', 'What time do you have breakfast?', 'Do you go to bed at ten o\'clock?', 'What time do you have dinner?', "Do you get up at six o'clock?", 'What time do you go to bed?', 'What time do you have lunch?', "Do you go home at five o'clock?"],
        right: ["I get up at five o'clock.", "I have breakfast at six o'clock.", 'Yes, I do.', "I have dinner at seven o'clock.", "No, I don't. I get up at seven o'clock.", "I go to bed at ten o'clock.", "I have lunch at eleven o'clock.", "No, I don't. I go home at five thirty."],
        a: [0, 1, 2, 3, 4, 5, 6, 7]
      },
      {
        id: 'g4u2e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'time',
        items: [
          { q: 'I goes to school by bus.', a: ['I go to school by bus.'] },
          { q: 'What time you get up every day?', a: ['What time do you get up every day?'] },
          { q: "I has breakfast at seven o'clock.", a: ["I have breakfast at seven o'clock."] },
          { q: "I go school at eight o'clock.", a: ["I go to school at eight o'clock."] },
          { q: 'What time it is?', a: ['What time is it?'] },
          { q: "I go to home at five o'clock.", a: ["I go home at five o'clock."] },
          { q: "I go to the bed at ten o'clock.", a: ["I go to bed at ten o'clock."] },
          { q: "I watching TV at nine o'clock.", a: ["I watch TV at nine o'clock.", "I am watching TV at nine o'clock."] }
        ]
      },
      {
        id: 'g4u2e4', type: 'fill', title: 'Điền từ vào đoạn văn của Lucy', topic: 'time',
        intro: "Hi! My name is Lucy. I (1) ___ up at seven o'clock and I (2) ___ breakfast with my parents and my younger sister Linda. I (3) ___ rice and fish but I don't like pizza and eggs. My Mom and Dad (4) ___ bread and coffee for breakfast. We go to school (5) ___ bus. I (6) ___ home at five o'clock. I have dinner (7) ___ six thirty. I (8) ___ my homework at seven fifteen and go (9) ___ bed at ten.",
        items: [
          { q: "(1) I ___ up at seven o'clock.", a: ['get'] },
          { q: '(2) I ___ breakfast with my parents.', a: ['have', 'eat'] },
          { q: "(3) I ___ rice and fish but I don't like pizza.", a: ['like', 'love', 'eat'] },
          { q: '(4) My Mom and Dad ___ bread and coffee for breakfast.', a: ['have', 'like', 'eat'] },
          { q: '(5) We go to school ___ bus.', a: ['by'] },
          { q: "(6) I ___ home at five o'clock.", a: ['go'] },
          { q: '(7) I have dinner ___ six thirty.', a: ['at'] },
          { q: '(8) I ___ my homework at seven fifteen.', a: ['do'] },
          { q: '(9) … and go ___ bed at ten.', a: ['to'] }
        ]
      },
      {
        id: 'g4u2e5', type: 'mcq', title: 'Đọc hiểu: Một ngày của John', topic: 'reading', reading: 0,
        items: [
          { q: 'What time does John get up?', o: ["six o'clock", "seven o'clock", "five o'clock"], a: 0 },
          { q: 'What time does he have breakfast?', o: ["six o'clock", "seven o'clock", "eight o'clock"], a: 1 },
          { q: 'How does he go to school?', o: ['by bus', 'by bike', 'on foot'], a: 1 },
          { q: 'Where does he have lunch?', o: ['at home', 'in the school canteen', 'in the park'], a: 1 },
          { q: 'What time does he go home?', o: ['four thirty', "five o'clock", "six o'clock"], a: 1 },
          { q: 'What does he do at five fifteen?', o: ['He plays badminton.', 'He does his homework.', 'He has dinner.'], a: 0 },
          { q: 'What time does he have dinner?', o: ['six forty-five', "seven o'clock", 'eight fifteen'], a: 0 },
          { q: 'What time does he go to bed?', o: ["ten o'clock", 'ten thirty', 'nine thirty'], a: 1 }
        ]
      },
      {
        id: 'g4u2e6', type: 'mcq', title: 'Chọn từ khác loại', topic: 'vocab',
        items: [
          { q: 'Từ nào khác loại?', o: ['table tennis', 'football', 'play', 'volleyball'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['teacher', 'doctor', 'nurse', 'parrot'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['school', 'wash', 'clean', 'go'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['America', 'from', 'Thailand', 'Britain'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['Saturday', 'Friday', 'morning', 'Sunday'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['breakfast', 'dinner', 'lunch', 'have'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['ruler', 'mother', 'rubber', 'pencil'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['he', 'she', 'his', 'they'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['singing', 'dancing', 'playing', 'paint'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['in', 'on', 'pillow', 'under'], a: 2 }
        ]
      }
    ]
  },

  /* ============================ UNIT 3 ============================ */
  {
    n: 3, title: 'My week', vi: 'Tuần của em',
    vocab: [
      ['Monday', '/ˈmʌndeɪ/', 'thứ Hai'],
      ['Tuesday', '/ˈtjuːzdeɪ/', 'thứ Ba'],
      ['Wednesday', '/ˈwenzdeɪ/', 'thứ Tư'],
      ['Thursday', '/ˈθɜːzdeɪ/', 'thứ Năm'],
      ['Friday', '/ˈfraɪdeɪ/', 'thứ Sáu'],
      ['Saturday', '/ˈsætədeɪ/', 'thứ Bảy'],
      ['Sunday', '/ˈsʌndeɪ/', 'Chủ nhật'],
      ['study at school', '/ˈstʌdi ət skuːl/', 'học ở trường'],
      ['do housework', '/duː ˈhaʊswɜːk/', 'làm việc nhà'],
      ['listen to music', '/ˈlɪsn tə ˈmjuːzɪk/', 'nghe nhạc'],
      ['watch TV', '/wɒtʃ ˌtiːˈviː/', 'xem ti vi'],
      ['play football', '/pleɪ ˈfʊtbɔːl/', 'chơi bóng đá']
    ],
    grammar: [
      {
        title: 'Hỏi hôm nay là thứ mấy',
        topic: 'wh',
        explain: 'Tên các thứ trong tuần luôn viết hoa chữ cái đầu.',
        table: [
          ['Hỏi', 'What day is it today?', "It's Monday."]
        ],
        mistakes: [
          ["It's Mondays.", "It's Monday.", 'Nói về một ngày cụ thể thì không thêm s.']
        ]
      },
      {
        title: 'Hỏi bạn làm gì vào các ngày trong tuần',
        topic: 'prep',
        explain: 'Dùng "on" trước thứ trong tuần. Thêm s (on Mondays) khi nói việc lặp lại mỗi tuần.',
        table: [
          ['Hỏi', 'What do you do on Mondays?', 'I study at school.'],
          ['Trả lời', '', 'I do housework on Sundays.'],
          ['Phủ định', '', "I don't go to school on Sundays."]
        ],
        mistakes: [
          ['I listen to music in Thursdays.', 'I listen to music on Thursdays.', 'Trước thứ dùng on.'],
          ['What do you doing on Saturdays?', 'What do you do on Saturdays?', 'Sau do dùng động từ nguyên mẫu.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ['What day is it today?', "It's Tuesday."],
        ['What do you do on Mondays?', 'I study at school.'],
        ['What do you do on Saturdays?', 'I do housework.'],
        ['What do you do on Sundays?', 'I listen to music.']
      ],
      readings: []
    },
    exercises: [
      {
        id: 'g4u3e1', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'prep',
        items: [
          { w: 'go/I/school/Mondays/on/to/.', a: ['I go to school on Mondays.'] },
          { w: 'books/on/Mondays/read/and/I/Tuesdays/.', a: ['I read books on Mondays and Tuesdays.'] },
          { w: 'to/I/music/on/Fridays/listen/.', a: ['I listen to music on Fridays.'] },
          { w: 'do/Thursdays/I/housework/on/.', a: ['I do housework on Thursdays.'] },
          { w: 'kites/Peter/and/Tony/on/Fridays/fly/.', a: ['Peter and Tony fly kites on Fridays.', 'Tony and Peter fly kites on Fridays.'] },
          { w: 'play/I/Mondays/on/football/.', a: ['I play football on Mondays.'] },
          { w: 'a/draw/I/Sundays/picture/on/.', a: ['I draw a picture on Sundays.'] },
          { w: 'watch/I/Thursdays/on/TV/.', a: ['I watch TV on Thursdays.'] },
          { w: 'for/on/cook/family/I/Saturdays/my/.', a: ['I cook for my family on Saturdays.'] },
          { w: 'my/I/ride/on/Tuesdays/bike/.', a: ['I ride my bike on Tuesdays.'] }
        ]
      },
      {
        id: 'g4u3e2', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'wh',
        left: ['What time do you get up?', 'How do you go to school?', 'Do you have breakfast every day?', 'What do you do on Tuesdays?', 'What time do you go to bed?', 'What do you do on Saturdays?', 'What do you like doing?', 'What time do you go home after school?', 'Where is she from?', 'What time is it?', 'What day is it today?'],
        right: ["I get up at 7 o'clock.", 'I walk to school.', 'Yes, I do. I have bread and eggs for breakfast.', 'I do housework.', "I go to bed at 10 o'clock.", 'I visit my grandmother on Saturdays.', 'I like dancing.', "I go home at five o'clock.", "She's from Malaysia.", "It's nine fifteen.", "It's Friday."],
        a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      },
      {
        id: 'g4u3e3', type: 'fix', title: 'Hoàn thành câu hỏi từ gợi ý', topic: 'wh',
        items: [
          { q: 'What time / have / lunch?', a: ['What time do you have lunch?'] },
          { q: 'What / day / today?', a: ['What day is it today?'] },
          { q: 'What / time?', a: ['What time is it?'] },
          { q: 'Where / pen?', a: ['Where is the pen?', 'Where is my pen?', 'Where is your pen?'] },
          { q: 'What time / go / bed / Saturdays?', a: ['What time do you go to bed on Saturdays?'] },
          { q: 'What / she / doing?', a: ['What is she doing?'] },
          { q: 'Where / books?', a: ['Where are the books?', 'Where are my books?', 'Where are your books?'] },
          { q: 'What / do / Thursdays?', a: ['What do you do on Thursdays?'] },
          { q: 'Where / he / from?', a: ['Where is he from?'] },
          { q: 'What / they / doing?', a: ['What are they doing?'] }
        ]
      },
      {
        id: 'g4u3e4', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'prep',
        items: [
          { q: 'Where she is from?', a: ['Where is she from?'] },
          { q: 'He are from Japan.', a: ['He is from Japan.'] },
          { q: "What time is it? It's on 10 o'clock.", a: ["What time is it? It's 10 o'clock."] },
          { q: 'Where time do you go to bed?', a: ['What time do you go to bed?'] },
          { q: "What day is it today? It's Mondays.", a: ["What day is it today? It's Monday."] },
          { q: 'What are you do on Wednesdays?', a: ['What do you do on Wednesdays?'] },
          { q: 'I do houseworks on Sundays.', a: ['I do housework on Sundays.'] },
          { q: 'I listen to music in Thursdays.', a: ['I listen to music on Thursdays.'] },
          { q: 'I study on school on Mondays.', a: ['I study at school on Mondays.'] },
          { q: 'What do you doing on Saturdays?', a: ['What do you do on Saturdays?'] }
        ]
      },
      {
        id: 'g4u3e5', type: 'mcq', title: 'Chọn từ khác loại', topic: 'vocab',
        items: [
          { q: 'Từ nào khác loại?', o: ['black', 'grey', 'pink', 'eraser'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['art room', 'music room', 'school', 'classroom'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['bus', 'kitchen', 'bedroom', 'dining room'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['bird', 'kite', 'cat', 'dog'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['football', 'tennis', 'basketball', 'water'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['swimming', 'cycling', 'face', 'climbing'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['bus', 'bike', 'car', 'red'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['run', 'picture', 'cook', 'draw'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['sit', 'speak', 'stand', 'teacher'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['farmer', 'nurse', 'sister', 'doctor'], a: 2 }
        ]
      }
    ]
  },

  /* ============================ UNIT 4 ============================ */
  {
    n: 4, title: 'My birthday party', vi: 'Tiệc sinh nhật của em',
    vocab: [
      ['birthday', '/ˈbɜːθdeɪ/', 'sinh nhật'],
      ['party', '/ˈpɑːti/', 'bữa tiệc'],
      ['juice', '/dʒuːs/', 'nước ép'],
      ['lemonade', '/ˌleməˈneɪd/', 'nước chanh'],
      ['water', '/ˈwɔːtə/', 'nước'],
      ['grapes', '/ɡreɪps/', 'quả nho'],
      ['chips', '/tʃɪps/', 'khoai tây chiên'],
      ['jam', '/dʒæm/', 'mứt'],
      ['January', '/ˈdʒænjuəri/', 'tháng Một'],
      ['February', '/ˈfebruəri/', 'tháng Hai'],
      ['March', '/mɑːtʃ/', 'tháng Ba'],
      ['April', '/ˈeɪprəl/', 'tháng Tư'],
      ['May', '/meɪ/', 'tháng Năm'],
      ['June', '/dʒuːn/', 'tháng Sáu'],
      ['July', '/dʒuˈlaɪ/', 'tháng Bảy'],
      ['August', '/ˈɔːɡəst/', 'tháng Tám'],
      ['September', '/sepˈtembə/', 'tháng Chín'],
      ['October', '/ɒkˈtəʊbə/', 'tháng Mười'],
      ['November', '/nəʊˈvembə/', 'tháng Mười Một'],
      ['December', '/dɪˈsembə/', 'tháng Mười Hai']
    ],
    grammar: [
      {
        title: 'Hỏi sinh nhật vào tháng nào',
        topic: 'prep',
        explain: 'Trước tên tháng dùng "in". Tên tháng luôn viết hoa.',
        table: [
          ['Hỏi', "When's your birthday?", "It's in October."]
        ],
        mistakes: [
          ["It's on May.", "It's in May.", 'Trước tháng dùng in, không dùng on.']
        ]
      },
      {
        title: 'Hỏi muốn ăn / uống gì',
        topic: 'wh',
        explain: '"some" dùng cho nhiều thứ hoặc thứ không đếm được (some grapes, some juice).',
        table: [
          ['Hỏi ăn', 'What do you want to eat?', 'I want some chips.'],
          ['Hỏi uống', 'What do you want to drink?', 'I want some lemonade.'],
          ['Mời', 'Would you like some grapes?', 'Yes, please.']
        ]
      },
      {
        title: 'a / an / some',
        topic: 'article',
        explain: 'a + 1 vật bắt đầu bằng phụ âm; an + 1 vật bắt đầu bằng nguyên âm (a, e, i, o, u); some + nhiều vật hoặc thứ không đếm được.',
        table: [
          ['a', 'a sandwich, a cake', 'Một vật, âm đầu là phụ âm'],
          ['an', 'an apple, an orange', 'Một vật, âm đầu là nguyên âm'],
          ['some', 'some grapes, some milk, some rice', 'Nhiều vật, hoặc không đếm được']
        ]
      }
    ],
    lesson: {
      patterns: [
        ["When's your birthday?", "It's in June."],
        ['What do you want to eat?', 'I want some grapes.'],
        ['What do you want to drink?', 'I want some juice.'],
        ['Would you like some chips?', 'Yes, please.']
      ],
      readings: [
        {
          title: 'Sinh nhật của Jane',
          text: 'My name is Jane. My birthday is in October. It\'s coming tomorrow. I want some hamburgers for my birthday party. My father wants some lemonade. My mother wants some grapes. My brother wants some chips and apples. My father can make cake, he is making a big birthday cake for me. My mother is cooking jam. My brother is blowing balloons for my birthday party tomorrow.'
        }
      ]
    },
    exercises: [
      {
        id: 'g4u4e1', type: 'fill', title: 'Điền chữ còn thiếu để được tên tháng', topic: 'vocab',
        items: [
          { q: 'J_n_', a: ['June'] },
          { q: 'O_tob_r', a: ['October'] },
          { q: 'Jul_', a: ['July'] },
          { q: '_anu_r_', a: ['January'] },
          { q: 'A_ri_', a: ['April'] },
          { q: '_ug_st', a: ['August'] },
          { q: 'F_b_ua_y', a: ['February'] },
          { q: '_o_em_er', a: ['November'] },
          { q: 'M_r_h', a: ['March'] },
          { q: 'D_cem_e_', a: ['December'] },
          { q: 'Se_te_b_r', a: ['September'] }
        ]
      },
      {
        id: 'g4u4e2', type: 'mcq', title: 'Đoán từ', topic: 'vocab',
        items: [
          { q: "I'm sweet, soft food, made by cooking fruit with sugar. You can eat me with bread.", o: ['jam', 'grapes', 'chips', 'water'], a: 0 },
          { q: "I'm small, round, purple or green fruit.", o: ['juice', 'grapes', 'jam', 'party'], a: 1 },
          { q: "I'm the liquid that comes from fruit or vegetables.", o: ['water', 'lemonade', 'juice', 'chips'], a: 2 },
          { q: "I'm from potatoes, thin or long.", o: ['chips', 'jam', 'grapes', 'birthday'], a: 0 },
          { q: 'The day a person was born.', o: ['party', 'birthday', 'Sunday', 'holiday'], a: 1 },
          { q: "I'm a drink made with the juice of lemons, water, and sugar.", o: ['water', 'juice', 'lemonade', 'milk'], a: 2 },
          { q: 'People meet to talk, eat, drink and dance to celebrate a special day.', o: ['school', 'party', 'zoo', 'birthday'], a: 1 },
          { q: "I'm a clear liquid, without colour or taste.", o: ['lemonade', 'juice', 'milk', 'water'], a: 3 }
        ]
      },
      {
        id: 'g4u4e3', type: 'mcq', title: 'Chọn a, an hoặc some', topic: 'article',
        items: [
          { q: 'Do you want ___ fish?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ noodles?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ chicken?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ orange?', o: ['a', 'an', 'some'], a: 1 },
          { q: 'Do you want ___ grapes?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ rice?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ milk?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ bread?', o: ['a', 'an', 'some'], a: 2 },
          { q: 'Do you want ___ apple?', o: ['a', 'an', 'some'], a: 1 },
          { q: 'Would you like ___ sandwich?', o: ['a', 'an', 'some'], a: 0 }
        ]
      },
      {
        id: 'g4u4e4', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'wh',
        items: [
          { w: 'you/sandwich/like/Would/a/?', a: ['Would you like a sandwich?'] },
          { w: 'want/do/What/eat/you/to/?', a: ['What do you want to eat?'] },
          { w: 'some/I/grapes/want/.', a: ['I want some grapes.'] },
          { w: 'juice/want/some/I/.', a: ['I want some juice.'] },
          { w: 'to/you/What/want/drink/do/?', a: ['What do you want to drink?'] },
          { w: 'some/you/Would/like/strawberries/?', a: ['Would you like some strawberries?'] },
          { w: 'you/chips/some/like/Would/?', a: ['Would you like some chips?'] },
          { w: 'lemonade/Do/some/want/you/?', a: ['Do you want some lemonade?'] }
        ]
      },
      {
        id: 'g4u4e5', type: 'mcq', title: 'Đọc hiểu: Đúng hay sai?', topic: 'reading', reading: 0,
        items: [
          { q: 'Her name is Jane.', o: ['True', 'False'], a: 0 },
          { q: 'Her birthday is in September.', o: ['True', 'False'], a: 1 },
          { q: 'She wants some sandwiches for her birthday.', o: ['True', 'False'], a: 1 },
          { q: 'Her father wants some lemonade.', o: ['True', 'False'], a: 0 },
          { q: 'Her mother wants some oranges.', o: ['True', 'False'], a: 1 },
          { q: 'Her brother wants some chips and strawberries.', o: ['True', 'False'], a: 1 },
          { q: 'Her father is making a birthday cake.', o: ['True', 'False'], a: 0 },
          { q: 'Her mother is cooking fish.', o: ['True', 'False'], a: 1 },
          { q: 'Her brother is doing housework.', o: ['True', 'False'], a: 1 }
        ]
      }
    ]
  },

  /* ============================ UNIT 5 ============================ */
  {
    n: 5, title: 'Things we can do', vi: 'Những việc chúng ta làm được',
    vocab: [
      ['ride a horse', '/raɪd ə hɔːs/', 'cưỡi ngựa'],
      ['ride a bike', '/raɪd ə baɪk/', 'đi xe đạp'],
      ['play the guitar', '/pleɪ ðə ɡɪˈtɑː/', 'chơi đàn ghi-ta'],
      ['play the piano', '/pleɪ ðə piˈænəʊ/', 'chơi đàn piano'],
      ['cook', '/kʊk/', 'nấu ăn'],
      ['roller skate', '/ˈrəʊlə skeɪt/', 'trượt pa-tanh'],
      ['draw', '/drɔː/', 'vẽ'],
      ['swim', '/swɪm/', 'bơi'],
      ['sing', '/sɪŋ/', 'hát'],
      ['dance', '/dɑːns/', 'nhảy, múa']
    ],
    grammar: [
      {
        title: 'Can — nói khả năng',
        topic: 'can',
        explain: 'can + động từ nguyên mẫu, dùng giống nhau cho mọi chủ ngữ. Không thêm s vào can hay động từ phía sau.',
        table: [
          ['Khẳng định', 'I / He / She can swim.', ''],
          ['Phủ định', "I can't ride a horse.", "can't = cannot"],
          ['Hỏi', 'Can you sing?', "Yes, I can. / No, I can't."],
          ['Hỏi việc làm được', 'What can you do?', 'I can play the piano.']
        ],
        mistakes: [
          ['My brother can drawing.', 'My brother can draw.', 'Sau can là động từ nguyên mẫu.'],
          ['She cans write.', 'She can write.', 'can không bao giờ thêm s.'],
          ['She not can ride a bike.', "She can't ride a bike.", "Phủ định: can't / cannot."],
          ["Can you swim? Yes, I can't.", 'Can you swim? Yes, I can.', 'Yes đi với can, No đi với can\'t.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ['What can you do?', 'I can play the guitar.'],
        ['Can you swim?', 'Yes, I can.'],
        ['Can she ride a horse?', "No, she can't."],
        ['What can he do?', 'He can roller skate.']
      ],
      readings: [
        {
          title: 'Gia đình của Tony',
          text: "This is Tony. He's ten years old. He is from Britain. He can play badminton and roller skate, but he can't swim. His sister can dance and sing, but she can't draw. His father can play the guitar. His mother can't play the piano but she can cook. He has a friend. His name is Jack. Jack is from America, he can ride a horse and play football but he can't ride a bike."
        }
      ]
    },
    exercises: [
      {
        id: 'g4u5e1', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'can',
        left: ['What can you do?', 'Can you play volleyball?', 'Can your sister roller skate?', 'Can he ride a bike?', 'What can your brother do?', 'Can she cook?', 'What do you like doing?', 'Do you like drawing?', 'What time do you go to bed?'],
        right: ['I can play the guitar.', 'Yes, I can.', 'Yes, she can.', "No, he can't.", 'He can play the piano.', "No, she can't, but my sister can swim.", 'I like reading books.', 'Yes, I do.', 'I go to bed at 10:00 p.m.'],
        a: [0, 1, 2, 3, 4, 5, 6, 7, 8]
      },
      {
        id: 'g4u5e2', type: 'fill', title: 'Hoàn thành câu', topic: 'can',
        items: [
          { q: 'I can play ___ piano.', a: ['the'] },
          { q: '___ can he do? He can ride a bike.', a: ['What'] },
          { q: 'What can you do? I ___ cook.', a: ['can'] },
          { q: 'What can she do? ___ can play the piano.', a: ['She'] },
          { q: 'Can he ___ the guitar?', a: ['play'] },
          { q: 'Can she swim? ___, she can.', a: ['Yes'] },
          { q: 'Can he ride a horse? No, he ___.', a: ["can't", 'cannot'] },
          { q: 'This is my brother. He can ___ a bike.', a: ['ride'] },
          { q: '___ your brother roller skate? Yes, he can.', a: ['Can'] },
          { q: 'My mother is in the kitchen. ___ can cook.', a: ['She'] }
        ]
      },
      {
        id: 'g4u5e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'can',
        items: [
          { q: 'My brother can drawing.', a: ['My brother can draw.'] },
          { q: 'This is my sister. He can dance.', a: ['This is my sister. She can dance.'] },
          { q: 'She not can ride a bike.', a: ["She can't ride a bike.", 'She cannot ride a bike.'] },
          { q: 'My Mom run can.', a: ['My Mom can run.', 'My Mum can run.'] },
          { q: 'Can she cook? No, she can.', a: ["Can she cook? No, she can't.", 'Can she cook? Yes, she can.'] },
          { q: "Can you swim? Yes, I can't.", a: ['Can you swim? Yes, I can.', "Can you swim? No, I can't."] },
          { q: 'Can you play guitar?', a: ['Can you play the guitar?'] },
          { q: 'Tom can reads.', a: ['Tom can read.'] },
          { q: 'She cans write.', a: ['She can write.'] },
          { q: 'Can you riding a horse?', a: ['Can you ride a horse?'] }
        ]
      },
      {
        id: 'g4u5e4', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'can',
        items: [
          { w: "roller/can't/I/skate/.", a: ["I can't roller skate."] },
          { w: "swim/My/can't/he/guitar/can/father/play/but/the/.", a: ["My father can play the guitar but he can't swim."] },
          { w: 'Can/the/she/play/piano/?', a: ['Can she play the piano?'] },
          { w: 'Lucy/horse/ride/can/a/.', a: ['Lucy can ride a horse.'] },
          { w: 'My/sister/draw/can/.', a: ['My sister can draw.'] },
          { w: 'your/Can/mother/cook/?', a: ['Can your mother cook?'] },
          { w: 'she/What/do/can/?', a: ['What can she do?'] }
        ]
      },
      {
        id: 'g4u5e5', type: 'mcq', title: 'Đọc hiểu: Gia đình của Tony', topic: 'reading', reading: 0,
        items: [
          { q: 'How old is Tony?', o: ['nine', 'ten', 'eleven'], a: 1 },
          { q: 'Where is he from?', o: ['Britain', 'America', 'Australia'], a: 0 },
          { q: 'What can Tony do?', o: ['play badminton and roller skate', 'swim and dance', 'play the guitar'], a: 0 },
          { q: 'Can Tony swim?', o: ['Yes, he can.', "No, he can't."], a: 1 },
          { q: 'What can his sister do?', o: ['draw', 'dance and sing', 'cook'], a: 1 },
          { q: 'What can his father do?', o: ['play the guitar', 'play the piano', 'ride a horse'], a: 0 },
          { q: 'Can his mother play the piano?', o: ['Yes, she can.', "No, she can't."], a: 1 },
          { q: 'Where is Jack from?', o: ['Britain', 'America', 'Japan'], a: 1 },
          { q: 'Can Jack ride a bike?', o: ['Yes, he can.', "No, he can't."], a: 1 }
        ]
      }
    ]
  },

  /* ============================ UNIT 6 ============================ */
  {
    n: 6, title: 'Our school facilities', vi: 'Cơ sở vật chất trường em',
    vocab: [
      ['city', '/ˈsɪti/', 'thành phố'],
      ['town', '/taʊn/', 'thị trấn'],
      ['village', '/ˈvɪlɪdʒ/', 'làng, xã'],
      ['mountains', '/ˈmaʊntənz/', 'vùng núi'],
      ['building', '/ˈbɪldɪŋ/', 'toà nhà'],
      ['playground', '/ˈpleɪɡraʊnd/', 'sân chơi'],
      ['garden', '/ˈɡɑːdn/', 'vườn'],
      ['computer room', '/kəmˈpjuːtə ruːm/', 'phòng máy tính'],
      ['art room', '/ɑːt ruːm/', 'phòng mĩ thuật'],
      ['music room', '/ˈmjuːzɪk ruːm/', 'phòng âm nhạc'],
      ['library', '/ˈlaɪbrəri/', 'thư viện'],
      ['classroom', '/ˈklɑːsruːm/', 'lớp học'],
      ['student', '/ˈstjuːdnt/', 'học sinh']
    ],
    grammar: [
      {
        title: 'Hỏi trường ở đâu',
        topic: 'prep',
        explain: 'Dùng "in the" trước city, town, village, mountains.',
        table: [
          ['Hỏi', "Where's your school?", "It's in the village."],
          ['', '', 'My school is in the mountains.']
        ]
      },
      {
        title: 'There is / There are',
        topic: 'there',
        explain: 'There is + 1 vật. There are + 2 vật trở lên. Hỏi số lượng dùng How many + danh từ số nhiều + are there.',
        table: [
          ['1 vật', 'There is a garden.', "There's one library."],
          ['Nhiều vật', 'There are two playgrounds.', ''],
          ['Hỏi số lượng', 'How many buildings are there?', 'There are three buildings.'],
          ['Hỏi có không', 'Is there a computer room?', "Yes, there is. / No, there isn't."]
        ],
        mistakes: [
          ['How many buildings is there?', 'How many buildings are there?', 'How many luôn đi với are there.'],
          ['There are two playground.', 'There are two playgrounds.', 'Hai vật trở lên thì danh từ thêm s.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ["Where's your school?", "It's in the town."],
        ['How many playgrounds are there at your school?', 'There are two playgrounds.'],
        ['Is there a library at your school?', 'Yes, there is.'],
        ['What can you see?', 'I can see the buildings.']
      ],
      readings: []
    },
    exercises: [
      {
        id: 'g4u6e1', type: 'mcq', title: 'There is hay There are?', topic: 'there',
        items: [
          { q: 'How many playgrounds are there at your school? — ___ two playgrounds.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many gardens are there at your school? — ___ one garden.', o: ['There is', 'There are'], a: 0 },
          { q: 'How many chairs are there? — ___ four chairs.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many computer rooms are there? — ___ two computer rooms.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many buildings are there at your school? — ___ three buildings.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many art rooms are there at your school? — ___ one art room.', o: ['There is', 'There are'], a: 0 },
          { q: 'How many students are there in the art room? — ___ ten students.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many libraries are there at your school? — ___ one library.', o: ['There is', 'There are'], a: 0 },
          { q: 'How many books are there? — ___ four books.', o: ['There is', 'There are'], a: 1 },
          { q: 'How many computers are there on the table? — ___ one computer.', o: ['There is', 'There are'], a: 0 },
          { q: 'How many music rooms are there at your school? — ___ two music rooms.', o: ['There is', 'There are'], a: 1 }
        ]
      },
      {
        id: 'g4u6e2', type: 'fix', title: 'Đặt câu hỏi cho câu trả lời', topic: 'there',
        items: [
          { q: 'There is a computer room at my school.', a: ['Is there a computer room at your school?', 'How many computer rooms are there at your school?'] },
          { q: 'There are two playgrounds at my school.', a: ['How many playgrounds are there at your school?'] },
          { q: 'My school is in the town.', a: ['Where is your school?'] },
          { q: 'There is a garden at my school.', a: ['Is there a garden at your school?', 'How many gardens are there at your school?'] },
          { q: 'There are four buildings at my school.', a: ['How many buildings are there at your school?'] },
          { q: 'There are five books in the bag.', a: ['How many books are there in the bag?', 'How many books are there in your bag?'] },
          { q: 'There is a library at my school.', a: ['Is there a library at your school?', 'How many libraries are there at your school?'] },
          { q: 'There are thirty-five classrooms at my school.', a: ['How many classrooms are there at your school?'] }
        ]
      },
      {
        id: 'g4u6e3', type: 'mcq', title: 'Chọn đáp án đúng', topic: 'there',
        items: [
          { q: 'How many chairs ___? — There are twenty chairs.', o: ['are there', 'is there', 'there are'], a: 0 },
          { q: 'How many computer rooms ___? — There is one computer room.', o: ['are there', 'is there', 'there is'], a: 0 },
          { q: 'My school is ___ the mountains.', o: ['on', 'in', 'at'], a: 1 },
          { q: 'There ___ a big garden at my school.', o: ['is', 'are', 'am'], a: 0 },
          { q: 'There are two ___ at my school.', o: ['playground', 'playgrounds'], a: 1 },
          { q: '___ there a library at your school? — Yes, there is.', o: ['Is', 'Are', 'Do'], a: 0 },
          { q: "Where's your school? — It's in the ___.", o: ['village', 'garden', 'library'], a: 0 }
        ]
      }
    ]
  },

  /* ============================ UNIT 7 ============================ */
  {
    n: 7, title: 'Our timetables', vi: 'Thời khoá biểu của chúng em',
    vocab: [
      ['subject', '/ˈsʌbdʒɪkt/', 'môn học'],
      ['timetable', '/ˈtaɪmteɪbl/', 'thời khoá biểu'],
      ['English', '/ˈɪŋɡlɪʃ/', 'môn Tiếng Anh'],
      ['maths', '/mæθs/', 'môn Toán'],
      ['Vietnamese', '/ˌvjetnəˈmiːz/', 'môn Tiếng Việt'],
      ['science', '/ˈsaɪəns/', 'môn Khoa học'],
      ['history and geography', '/ˈhɪstri ənd dʒiˈɒɡrəfi/', 'môn Lịch sử và Địa lí'],
      ['music', '/ˈmjuːzɪk/', 'môn Âm nhạc'],
      ['art', '/ɑːt/', 'môn Mĩ thuật'],
      ['today', '/təˈdeɪ/', 'hôm nay']
    ],
    grammar: [
      {
        title: 'Hỏi hôm nay học môn gì',
        topic: 'wh',
        explain: 'Tên môn học không cần "a" hay "the" phía trước.',
        table: [
          ['Hỏi', 'What subjects do you have today?', 'I have English and maths.'],
          ['Hỏi khi nào học', 'When do you have English?', 'I have it on Mondays.'],
          ['Hỏi có học không', 'Do you have music on Fridays?', "Yes, I do. / No, I don't."]
        ]
      },
      {
        title: 'have / has',
        topic: 'present',
        explain: 'I / You / We / They / 2 người trở lên + have. He / She / 1 người + has.',
        table: [
          ['have', 'I have English on Mondays.', 'They have music on Wednesdays.'],
          ['has', 'She has Vietnamese on Thursdays.', 'Lucas has art and science.'],
          ['Phủ định', "I don't have art on Mondays.", "She doesn't have maths today."]
        ],
        mistakes: [
          ['What subjects are you have on Mondays?', 'What subjects do you have on Mondays?', 'Câu hỏi với have dùng do, không dùng are.'],
          ['I have not history on Mondays.', "I don't have history on Mondays.", "Phủ định dùng don't + have."],
          ['Do you have music on Saturdays? No, I do.', "No, I don't.", "No đi với don't."]
        ]
      }
    ],
    lesson: {
      patterns: [
        ['What subjects do you have today?', 'I have maths and English.'],
        ['When do you have science?', 'I have it on Tuesdays and Thursdays.'],
        ['Do you have art on Fridays?', "No, I don't. I have it on Mondays."]
      ],
      readings: [
        {
          title: 'Lớp học của chúng em',
          text: 'At our class we have one big whiteboard. In our classroom there are twelve chairs and thirteen tables. There is a small bin at the corner. There are three pictures on the wall and they look so beautiful.\n\nIn our classroom we learn and play. The pupils learn many subjects such as maths, art, English and Vietnamese. I have maths on Mondays and English on Thursdays. I love music, I have it on Saturdays.'
        }
      ]
    },
    exercises: [
      {
        id: 'g4u7e1', type: 'mcq', title: 'Chọn have hoặc has', topic: 'present',
        items: [
          { q: 'I ___ English on Mondays.', o: ['have', 'has'], a: 0 },
          { q: 'They ___ music on Wednesdays.', o: ['have', 'has'], a: 0 },
          { q: 'Lily and Anna ___ maths on Mondays and Fridays.', o: ['have', 'has'], a: 0 },
          { q: 'She ___ Vietnamese on Thursdays.', o: ['have', 'has'], a: 1 },
          { q: 'We ___ English on Tuesdays and Fridays.', o: ['have', 'has'], a: 0 },
          { q: 'Lucas ___ art and science on Thursdays.', o: ['have', 'has'], a: 1 },
          { q: 'We ___ history and geography on Fridays.', o: ['have', 'has'], a: 0 },
          { q: 'My brother ___ English on Wednesdays.', o: ['have', 'has'], a: 1 },
          { q: 'My sister ___ maths and art on Mondays.', o: ['have', 'has'], a: 1 },
          { q: 'Lily and Peter ___ art on Mondays and Thursdays.', o: ['have', 'has'], a: 0 },
          { q: 'Anna ___ English and music on Fridays.', o: ['have', 'has'], a: 1 }
        ]
      },
      {
        id: 'g4u7e2', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'present',
        items: [
          { w: 'I/have/English/Mondays/on/.', a: ['I have English on Mondays.'] },
          { w: 'We/have/maths/Mondays/on/and/Tuesdays/.', a: ['We have maths on Mondays and Tuesdays.'] },
          { w: 'They/Thursdays/have/art/on/.', a: ['They have art on Thursdays.'] },
          { w: 'Do/have/you/science/on/Wednesdays/?', a: ['Do you have science on Wednesdays?'] },
          { w: 'Peter/and/Tony/maths/have/on/Fridays/.', a: ['Peter and Tony have maths on Fridays.', 'Tony and Peter have maths on Fridays.'] },
          { w: 'Do/Vietnamese/have/you/on/Thursdays/?', a: ['Do you have Vietnamese on Thursdays?'] },
          { w: "and/Peter/Tony/English/don't/on/have/Mondays/.", a: ["Peter and Tony don't have English on Mondays.", "Tony and Peter don't have English on Mondays."] }
        ]
      },
      {
        id: 'g4u7e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'present',
        items: [
          { q: 'What subjects are you have on Mondays?', a: ['What subjects do you have on Mondays?'] },
          { q: 'I have English in Fridays.', a: ['I have English on Fridays.'] },
          { q: 'When you have Vietnamese?', a: ['When do you have Vietnamese?'] },
          { q: 'Are you have science on Thursdays?', a: ['Do you have science on Thursdays?'] },
          { q: 'Do you having art on Wednesdays?', a: ['Do you have art on Wednesdays?'] },
          { q: "What day is it today? It's on Tuesday.", a: ["What day is it today? It's Tuesday."] },
          { q: "When is your birthday? It's on May.", a: ["When is your birthday? It's in May."] },
          { q: 'I have not history and geography on Mondays.', a: ["I don't have history and geography on Mondays."] },
          { q: 'How many buildings is there at your school?', a: ['How many buildings are there at your school?'] },
          { q: 'There are two playground at my school.', a: ['There are two playgrounds at my school.'] }
        ]
      },
      {
        id: 'g4u7e4', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'wh',
        left: ['What time is it?', 'What subjects do you have today?', 'What time do you have dinner?', "When is Toby's birthday?", 'When do you have science?', 'Do you have music on Thursdays?', 'How many gardens are there at your school?', 'Where is your school?'],
        right: ["It's ten fifteen.", 'I have Vietnamese and English.', 'I have dinner at 7:00 p.m.', "Toby's birthday is in April.", 'I have it on Fridays.', "No, I don't. I have it on Mondays.", 'There is one.', "It's in the city."],
        a: [0, 1, 2, 3, 4, 5, 6, 7]
      },
      {
        id: 'g4u7e5', type: 'mcq', title: 'Chọn từ để hỏi', topic: 'wh',
        items: [
          { q: '___ is your father? — He is thirty years old.', o: ['What', 'How old', 'Where', 'Who', 'When'], a: 1 },
          { q: '___ time do you get up?', o: ['What', 'How old', 'Where', 'Who', 'When'], a: 0 },
          { q: '___ is your best friend? — Tony is my best friend.', o: ['What', 'How old', 'Where', 'Who', 'When'], a: 3 },
          { q: "___ is Peter from? — He's from Thailand.", o: ['What', 'How old', 'Where', 'Who', 'When'], a: 2 },
          { q: '___ is she wearing? — She is wearing a blue dress.', o: ['What', 'How old', 'Where', 'Who', 'When'], a: 0 },
          { q: '___ do you want to eat?', o: ['What', 'How old', 'Where', 'Who', 'When'], a: 0 },
          { q: "___ is Lucy's birthday? — It's in April.", o: ['What', 'How old', 'Where', 'Who', 'When'], a: 4 },
          { q: "___ is your school? — It's in the mountains.", o: ['What', 'How old', 'Where', 'Who', 'When'], a: 2 }
        ]
      },
      {
        id: 'g4u7e6', type: 'mcq', title: 'Đọc hiểu: Lớp học của chúng em', topic: 'reading', reading: 0,
        items: [
          { q: 'In this class, there is one big ___.', o: ['whiteboard', 'bin', 'picture'], a: 0 },
          { q: 'How many chairs are there in the classroom?', o: ['twelve', 'thirteen', 'three'], a: 0 },
          { q: 'At the corner, there is a small ___.', o: ['table', 'bin', 'chair'], a: 1 },
          { q: 'How many pictures are there on the wall?', o: ['two', 'three', 'twelve'], a: 1 },
          { q: 'When does the writer have maths?', o: ['on Mondays', 'on Thursdays', 'on Saturdays'], a: 0 },
          { q: 'When does the writer have English?', o: ['on Mondays', 'on Thursdays', 'on Saturdays'], a: 1 },
          { q: 'What subject does the writer love?', o: ['art', 'music', 'maths'], a: 1 }
        ]
      }
    ]
  },

  /* ============================ UNIT 8 ============================ */
  {
    n: 8, title: 'My favourite subjects', vi: 'Môn học yêu thích của em',
    vocab: [
      ['favourite', '/ˈfeɪvərɪt/', 'yêu thích nhất'],
      ['PE', '/ˌpiː ˈiː/', 'môn Thể dục'],
      ['IT', '/ˌaɪ ˈtiː/', 'môn Tin học'],
      ['English teacher', '/ˈɪŋɡlɪʃ ˈtiːtʃə/', 'giáo viên Tiếng Anh'],
      ['maths teacher', '/mæθs ˈtiːtʃə/', 'giáo viên Toán'],
      ['IT teacher', '/ˌaɪ ˈtiː ˈtiːtʃə/', 'giáo viên Tin học'],
      ['painter', '/ˈpeɪntə/', 'hoạ sĩ'],
      ['scientist', '/ˈsaɪəntɪst/', 'nhà khoa học'],
      ['singer', '/ˈsɪŋə/', 'ca sĩ'],
      ['because', '/bɪˈkɒz/', 'bởi vì']
    ],
    grammar: [
      {
        title: 'Hỏi môn học yêu thích',
        topic: 'wh',
        explain: 'Một môn: "subject is". Hai môn trở lên: "subjects are".',
        table: [
          ['Hỏi', "What's your favourite subject?", "It's English."],
          ['Hai môn', '', 'My favourite subjects are art and PE.'],
          ['Hỏi có phải không', 'Is your favourite subject music?', "Yes, it is. / No, it isn't."]
        ],
        mistakes: [
          ['My favourite subjects is maths and science.', 'My favourite subjects are maths and science.', 'Hai môn đi với are.']
        ]
      },
      {
        title: 'Hỏi lý do: Why … ? — Because …',
        topic: 'wh',
        explain: 'want to be + a / an + nghề nghiệp. Dùng "an" trước nghề bắt đầu bằng nguyên âm (an English teacher, an IT teacher).',
        table: [
          ['Hỏi', 'Why do you like maths?', 'Because I want to be a maths teacher.'],
          ['', 'Why do you like art?', 'Because I want to be a painter.'],
          ['an', '', 'I want to be an English teacher.']
        ],
        mistakes: [
          ['I want be a PE teacher.', 'I want to be a PE teacher.', 'want + to + động từ.'],
          ['I want to be a English teacher.', 'I want to be an English teacher.', 'English bắt đầu bằng nguyên âm → an.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ["What's your favourite subject?", "It's science."],
        ['Why do you like science?', 'Because I want to be a scientist.'],
        ['Why do you like music?', 'Because I want to be a singer.']
      ],
      readings: [
        {
          title: 'Môn học yêu thích của Trang',
          text: "My name is Trang. I'm ten years old. I am studying at a school in the mountains. My favourite subjects are English and art. I don't like science because I am not good at it. I like English because I want to be an English teacher. I can draw, so I love art. I also want to be a painter in the future. I have English on Mondays and art on Thursdays. There is a big art room at my school. I like to go there after lessons to draw pictures and talk about them in English. My best friend Minh likes computers very much. His favourite subject is IT because he wants to be an IT teacher when he grows up."
        }
      ]
    },
    exercises: [
      {
        id: 'g4u8e1', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'wh',
        left: ["What is your mother's job?", "What's your favourite subject?", 'Is your favourite subject music?', 'Why do you like maths?', 'What subjects do you have today?', "What's your dream job?", 'When do you have English?', 'Do you like IT?', 'Why do you like art?', 'Do you have PE on Thursdays?'],
        right: ['She is a teacher.', "It's English.", "No, it isn't. I like science.", 'Because I want to be a maths teacher.', 'I have Vietnamese and IT.', 'I want to be a cook.', 'I have English on Mondays.', 'Yes, I do.', 'Because I want to be a painter.', 'No, I have it on Tuesdays.'],
        a: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      },
      {
        id: 'g4u8e2', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'wh',
        items: [
          { w: 'science/My/subject/favourite/is/.', a: ['My favourite subject is science.'] },
          { w: 'like/want/because/I/maths/teacher/a/to/maths/be/I/.', a: ['I like maths because I want to be a maths teacher.'] },
          { w: 'favourite/is/What/subject/your/?', a: ['What is your favourite subject?'] },
          { w: 'subject/your/Is/music/favourite/?', a: ['Is music your favourite subject?', 'Is your favourite subject music?'] },
          { w: 'do/Why/like/you/art/?', a: ['Why do you like art?'] },
          { w: 'not/my/IT/subject/is/favourite/.', a: ['IT is not my favourite subject.'] },
          { w: 'a/like/want/science/I/be/scientist/I/to/because/.', a: ['I like science because I want to be a scientist.'] },
          { w: 'you/What/do/have/Fridays/subjects/on/?', a: ['What subjects do you have on Fridays?'] },
          { w: "music/can't/don't/because/I/sing/like/I/.", a: ["I don't like music because I can't sing."] }
        ]
      },
      {
        id: 'g4u8e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'wh',
        items: [
          { q: 'My favourite subjects is maths and science.', a: ['My favourite subjects are maths and science.'] },
          { q: "What's his favourite subject? She likes English.", a: ["What's his favourite subject? He likes English.", "What's her favourite subject? She likes English."] },
          { q: 'When subjects do you have today?', a: ['What subjects do you have today?'] },
          { q: 'I like PE because I want be a PE teacher.', a: ['I like PE because I want to be a PE teacher.'] },
          { q: 'Is your favourite subject art? No, I am.', a: ["Is your favourite subject art? No, it isn't.", 'Is your favourite subject art? Yes, it is.'] },
          { q: 'I like English because I want to be a English teacher.', a: ['I like English because I want to be an English teacher.'] },
          { q: 'Do you like IT? No, I am not.', a: ["Do you like IT? No, I don't."] },
          { q: 'What you want to be when you grow up?', a: ['What do you want to be when you grow up?'] },
          { q: 'He like cooking. He wants to be a cook.', a: ['He likes cooking. He wants to be a cook.'] },
          { q: 'PE not is my favourite subject.', a: ['PE is not my favourite subject.', "PE isn't my favourite subject."] }
        ]
      },
      {
        id: 'g4u8e4', type: 'mcq', title: 'Chọn từ khác loại', topic: 'vocab',
        items: [
          { q: 'Từ nào khác loại?', o: ['teacher', 'want', 'painter', 'singer'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['PE', 'IT', 'art', 'favourite'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['May', 'Monday', 'Friday', 'Thursday'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['city', 'village', 'town', 'school'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['birthday', 'chips', 'grapes', 'jam'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['cook', 'draw', 'paint', 'horse'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['building', 'garden', 'big', 'computer room'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['mountains', 'Thailand', 'America', 'Malaysia'], a: 0 }
        ]
      },
      {
        id: 'g4u8e5', type: 'mcq', title: 'Đọc hiểu: Môn học yêu thích của Trang', topic: 'reading', reading: 0,
        items: [
          { q: 'How old is Trang?', o: ['nine', 'ten', 'eleven'], a: 1 },
          { q: 'Where is her school?', o: ['in the city', 'in the mountains', 'in the village'], a: 1 },
          { q: 'What are her favourite subjects?', o: ['English and art', 'maths and science', 'music and IT'], a: 0 },
          { q: 'Does she like science?', o: ['Yes, she does.', "No, she doesn't."], a: 1 },
          { q: 'Why does she like English?', o: ['Because she wants to be an English teacher.', 'Because she wants to be a singer.', 'Because she can draw.'], a: 0 },
          { q: 'What can she do?', o: ['She can sing.', 'She can draw.', 'She can swim.'], a: 1 },
          { q: 'Is the art room small or big?', o: ['small', 'big'], a: 1 },
          { q: 'When does she have art?', o: ['on Mondays', 'on Thursdays', 'on Fridays'], a: 1 },
          { q: "What is Minh's favourite subject?", o: ['art', 'English', 'IT'], a: 2 },
          { q: 'Why does Minh like IT?', o: ['Because he wants to be an IT teacher.', 'Because he wants to be a painter.', 'Because he can sing.'], a: 0 }
        ]
      }
    ]
  },

  /* ============================ UNIT 9 ============================ */
  {
    n: 9, title: 'Our sports day', vi: 'Ngày hội thể thao',
    vocab: [
      ['sports day', '/ˈspɔːts deɪ/', 'ngày hội thể thao'],
      ['run', '/rʌn/', 'chạy'],
      ['swim', '/swɪm/', 'bơi'],
      ['football', '/ˈfʊtbɔːl/', 'bóng đá'],
      ['basketball', '/ˈbɑːskɪtbɔːl/', 'bóng rổ'],
      ['badminton', '/ˈbædmɪntən/', 'cầu lông'],
      ['volleyball', '/ˈvɒlibɔːl/', 'bóng chuyền'],
      ['table tennis', '/ˈteɪbl tenɪs/', 'bóng bàn'],
      ['skip', '/skɪp/', 'nhảy dây'],
      ['fly a kite', '/flaɪ ə kaɪt/', 'thả diều']
    ],
    grammar: [
      {
        title: 'Hỏi ngày hội thể thao vào tháng nào',
        topic: 'prep',
        explain: 'Trước tháng dùng "in".',
        table: [
          ['Hỏi', "When's your sports day?", "It's in May."],
          ['Hỏi có phải không', 'Is your sports day in June?', "Yes, it is. / No, it isn't. It's in July."]
        ],
        mistakes: [
          ['Our sports day is on September.', 'Our sports day is in September.', 'Tháng đi với in.'],
          ['When are your sports day?', 'When is your sports day?', 'sports day là 1 ngày → is.']
        ]
      },
      {
        title: 'Thì hiện tại tiếp diễn: is / are + V-ing',
        topic: 'continuous',
        explain: 'Nói việc đang xảy ra ngay lúc này. He / She / It / 1 người + is; They / 2 người trở lên + are; động từ thêm -ing.',
        table: [
          ['1 người', 'My sister is flying a kite.', ''],
          ['Nhiều người', 'The boys are playing football.', ''],
          ['Hỏi', "What's your sister doing?", 'She is riding a bike.']
        ],
        mistakes: [
          ['The girls is running.', 'The girls are running.', 'Nhiều người đi với are.'],
          ['My brother is play football.', 'My brother is playing football.', 'Sau is/are, động từ thêm -ing.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ["When's your sports day?", "It's in October."],
        ['Is your sports day in July?', "No, it isn't. It's in April."],
        ['What sports do you play in your sports day?', 'We run and play football.'],
        ['What are they doing?', 'They are playing badminton.']
      ],
      readings: []
    },
    exercises: [
      {
        id: 'g4u9e1', type: 'mcq', title: 'Chọn is hoặc are', topic: 'continuous',
        items: [
          { q: 'My sister ___ flying a kite.', o: ['is', 'are'], a: 0 },
          { q: 'The boys ___ playing football.', o: ['is', 'are'], a: 1 },
          { q: 'The cat ___ climbing.', o: ['is', 'are'], a: 0 },
          { q: 'The birds ___ singing.', o: ['is', 'are'], a: 1 },
          { q: 'The girls ___ skipping.', o: ['is', 'are'], a: 1 },
          { q: 'The parrot ___ counting.', o: ['is', 'are'], a: 0 },
          { q: '___ the bird flying?', o: ['Is', 'Are'], a: 0 },
          { q: 'The horse ___ running.', o: ['is', 'are'], a: 0 },
          { q: 'The teachers ___ playing badminton.', o: ['is', 'are'], a: 1 },
          { q: 'The monkeys ___ climbing the tree.', o: ['is', 'are'], a: 1 },
          { q: 'The students ___ swimming.', o: ['is', 'are'], a: 1 },
          { q: '___ our teacher playing the guitar?', o: ['Is', 'Are'], a: 0 }
        ]
      },
      {
        id: 'g4u9e2', type: 'order', title: 'Sắp xếp từ thành câu', topic: 'prep',
        items: [
          { w: 'your/Is/in/sports/August/day/?', a: ['Is your sports day in August?'] },
          { w: 'sports/in/day/October/Our/is/.', a: ['Our sports day is in October.'] },
          { w: 'badminton/like/I/playing/.', a: ['I like playing badminton.'] },
          { w: 'your/When/is/day/sports/?', a: ['When is your sports day?'] },
          { w: 'the/school/My/in/is/mountains/.', a: ['My school is in the mountains.'] },
          { w: 'two/are/playgrounds/There/at/school/big/our/.', a: ['There are two big playgrounds at our school.'] },
          { w: 'you/What/play/sports/do/?', a: ['What sports do you play?'] },
          { w: "sports/play/We/in/don't/our/football/day/.", a: ["We don't play football in our sports day."] },
          { w: 'like/Do/running/you/?', a: ['Do you like running?'] }
        ]
      },
      {
        id: 'g4u9e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'continuous',
        items: [
          { q: 'Our sports day is on September.', a: ['Our sports day is in September.'] },
          { q: 'When are your sports day?', a: ['When is your sports day?'] },
          { q: 'We playing football in our sports day.', a: ['We play football in our sports day.', 'We are playing football in our sports day.'] },
          { q: "Is your sports day in July? No, it is. It's in April.", a: ["Is your sports day in July? No, it isn't. It's in April."] },
          { q: 'Are you play badminton in your sports day?', a: ['Do you play badminton in your sports day?'] },
          { q: "Can you swim? Yes, I can't.", a: ['Can you swim? Yes, I can.', "Can you swim? No, I can't."] },
          { q: 'What sports can you playing?', a: ['What sports can you play?'] },
          { q: 'My brother is play football.', a: ['My brother is playing football.'] },
          { q: "What's your sister doing? He is riding a bike.", a: ["What's your sister doing? She is riding a bike."] },
          { q: 'The girls is running.', a: ['The girls are running.'] }
        ]
      },
      {
        id: 'g4u9e4', type: 'mcq', title: 'Chọn từ khác loại', topic: 'vocab',
        items: [
          { q: 'Từ nào khác loại?', o: ['England', 'American', 'Japanese', 'Vietnamese'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['January', 'October', 'December', 'Thursday'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['Good morning', 'Goodbye', 'Good evening', 'Good afternoon'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['library', 'living room', 'classroom', 'computer room'], a: 1 },
          { q: 'Từ nào khác loại?', o: ['elephant', 'rabbit', 'bird', 'chips'], a: 3 },
          { q: 'Từ nào khác loại?', o: ['zoo', 'school', 'book', 'house'], a: 2 },
          { q: 'Từ nào khác loại?', o: ['play', 'kite', 'guitar', 'piano'], a: 0 },
          { q: 'Từ nào khác loại?', o: ['when', 'September', 'where', 'what'], a: 1 }
        ]
      }
    ]
  },

  /* ============================ UNIT 10 ============================ */
  {
    n: 10, title: 'Our summer holidays', vi: 'Kỳ nghỉ hè của chúng em',
    vocab: [
      ['beach', '/biːtʃ/', 'bãi biển'],
      ['countryside', '/ˈkʌntrisaɪd/', 'vùng nông thôn'],
      ['campsite', '/ˈkæmpsaɪt/', 'khu cắm trại'],
      ['zoo', '/zuː/', 'sở thú'],
      ['London', '/ˈlʌndən/', 'Luân Đôn (Anh)'],
      ['Tokyo', '/ˈtəʊkiəʊ/', 'Tô-ky-ô (Nhật Bản)'],
      ['Bangkok', '/bæŋˈkɒk/', 'Băng Cốc (Thái Lan)'],
      ['Sydney', '/ˈsɪdni/', 'Xít-ni (Úc)'],
      ['last summer', '/lɑːst ˈsʌmə/', 'mùa hè năm ngoái'],
      ['last weekend', '/lɑːst ˌwiːkˈend/', 'cuối tuần trước'],
      ['yesterday', '/ˈjestədeɪ/', 'hôm qua']
    ],
    grammar: [
      {
        title: 'Quá khứ của to be: was / were',
        topic: 'past',
        explain: 'Nói về chuyện đã qua (last summer, last weekend, yesterday). I / He / She + was. You / We / They + were.',
        table: [
          ['Hỏi ở đâu', 'Where were you last summer?', 'I was in Tokyo.'],
          ['Hỏi có phải không', 'Were you at the zoo last weekend?', "Yes, I was. / No, I wasn't."],
          ['Phủ định', '', "I wasn't at the campsite."]
        ],
        mistakes: [
          ['Was you at school yesterday?', 'Were you at school yesterday?', 'you luôn đi với were.'],
          ['I am in the mountains last weekend.', 'I was in the mountains last weekend.', 'Có last weekend → dùng quá khứ was.']
        ]
      },
      {
        title: 'in / at / on với địa điểm',
        topic: 'prep',
        explain: 'Mỗi địa điểm đi với một giới từ cố định — nên học thuộc theo cụm.',
        table: [
          ['in', 'in the mountains, in the countryside, in London', 'vùng rộng, thành phố'],
          ['at', 'at the zoo, at the campsite, at home, at school', 'một điểm cụ thể'],
          ['on', 'on the beach', 'trên bề mặt']
        ],
        mistakes: [
          ['I was in the beach last summer.', 'I was on the beach last summer.', 'beach đi với on.'],
          ['I was at Bangkok last summer.', 'I was in Bangkok last summer.', 'Thành phố đi với in.']
        ]
      }
    ],
    lesson: {
      patterns: [
        ['Where were you last summer?', 'I was on the beach.'],
        ['Were you in the countryside last weekend?', 'Yes, I was.'],
        ['Were you at the zoo last weekend?', "No, I wasn't. I was at the campsite."]
      ],
      readings: [
        {
          title: 'Kỳ nghỉ của Linh',
          text: 'My name is Linh. Last summer, I was on holiday in London. The city was modern. The Thames river was very beautiful. Big Ben clock was very ancient. The food was delicious and the people there were very friendly and active. The weather was cold and the traffic was very busy. My trip was amazing.'
        },
        {
          title: 'Kỳ nghỉ của Nga',
          text: 'My name is Nga. Last summer I was on holiday in Bangkok. The city was busy. The weather was hot. The food was spicy and good. I can eat spicy food so I really like the food there. The people were very hospitable. The Grand Palace was huge and wonderful. It was a fun trip.'
        }
      ]
    },
    exercises: [
      {
        id: 'g4u10e1', type: 'mcq', title: 'Chọn đáp án đúng', topic: 'past',
        items: [
          { q: 'Were you on the beach last summer? — ___', o: ['Yes, I am.', "Yes, I wasn't.", 'Yes, I was.'], a: 2 },
          { q: 'I ___ in the town last weekend.', o: ['am', 'was', 'were'], a: 1 },
          { q: 'My favourite ___ is maths.', o: ['subject', 'toy', 'animal'], a: 0 },
          { q: 'This is my uncle. ___ can play the guitar.', o: ['She', 'He', 'They'], a: 1 },
          { q: 'I was ___ the campsite last weekend.', o: ['on', 'in', 'at'], a: 2 },
          { q: 'We have PE ___ Thursdays.', o: ['on', 'in', 'at'], a: 0 },
          { q: 'Were you ___ the mountains last summer?', o: ['at', 'in', 'on'], a: 1 },
          { q: 'Where ___ you last weekend?', o: ['are', 'was', 'were'], a: 2 },
          { q: 'My brother is ___ a bike.', o: ['riding', 'ride', 'rides'], a: 0 },
          { q: '___ you in Tokyo last summer?', o: ['Are', 'Were', 'Was'], a: 1 }
        ]
      },
      {
        id: 'g4u10e2', type: 'fill', title: 'Điền từ còn thiếu', topic: 'prep',
        items: [
          { q: 'I was ___ the campsite last weekend.', a: ['at'] },
          { q: '___ you in Sydney last summer? Yes, I was.', a: ['Were'] },
          { q: 'I was ___ the beach last summer.', a: ['on'] },
          { q: 'I was ___ the mountains last weekend.', a: ['in'] },
          { q: 'Where ___ you last summer?', a: ['were'] },
          { q: 'I was ___ the countryside last weekend.', a: ['in'] },
          { q: 'My birthday is ___ July.', a: ['in'] },
          { q: 'I have English ___ Mondays.', a: ['on'] },
          { q: 'Our sports day is ___ October.', a: ['in'] },
          { q: 'I ___ in Tokyo last summer.', a: ['was'] },
          { q: "I was ___ my aunt's house yesterday.", a: ['at'] }
        ]
      },
      {
        id: 'g4u10e3', type: 'fix', title: 'Tìm lỗi sai và viết lại câu đúng', topic: 'past',
        items: [
          { q: 'I am in the mountains last weekend.', a: ['I was in the mountains last weekend.'] },
          { q: 'Was you at school yesterday?', a: ['Were you at school yesterday?'] },
          { q: 'I was in the beach last summer.', a: ['I was on the beach last summer.'] },
          { q: 'I was on the zoo last weekend.', a: ['I was at the zoo last weekend.'] },
          { q: 'Where was you last summer?', a: ['Where were you last summer?'] },
          { q: 'I was at the countryside last weekend.', a: ['I was in the countryside last weekend.'] },
          { q: 'I was in the campsite last weekend.', a: ['I was at the campsite last weekend.'] },
          { q: 'I were in London last summer.', a: ['I was in London last summer.'] },
          { q: 'I was at Bangkok last summer.', a: ['I was in Bangkok last summer.'] },
          { q: 'Were you in Tokyo last summer? No, I was.', a: ["Were you in Tokyo last summer? No, I wasn't.", 'Were you in Tokyo last summer? Yes, I was.'] },
          { q: 'Where are you last weekend?', a: ['Where were you last weekend?'] },
          { q: 'Are you in the countryside last summer?', a: ['Were you in the countryside last summer?'] }
        ]
      },
      {
        id: 'g4u10e4', type: 'match', title: 'Nối câu hỏi với câu trả lời', topic: 'past',
        left: ['Were you at the zoo last weekend?', 'Where were you last summer?', 'Where were you last weekend?', 'Where were you yesterday?', 'Were you at the campsite last weekend?', "Where's your house?", 'How many buildings are there at your school?', "When's your sports day?"],
        right: ['Yes, I was.', 'I was in Tokyo last summer.', 'I was in the countryside last weekend.', 'I was at home yesterday.', "No, I wasn't at the campsite. I was on the beach.", "It's in the mountains.", 'There are three buildings.', "It's in August."],
        a: [0, 1, 2, 3, 4, 5, 6, 7]
      },
      {
        id: 'g4u10e5', type: 'mcq', title: 'Đọc hiểu: Kỳ nghỉ của Linh và Nga', topic: 'reading', reading: 'all',
        items: [
          { q: 'Where was Linh last summer?', o: ['London', 'Bangkok', 'Tokyo'], a: 0 },
          { q: 'Where was Nga last summer?', o: ['London', 'Bangkok', 'Sydney'], a: 1 },
          { q: 'What was the weather like in London?', o: ['hot', 'cold', 'rainy'], a: 1 },
          { q: 'What was the weather like in Bangkok?', o: ['hot', 'cold', 'snowy'], a: 0 },
          { q: 'What was Big Ben clock like?', o: ['very modern', 'very ancient', 'very small'], a: 1 },
          { q: 'What was the food like in Bangkok?', o: ['spicy and good', 'cold', 'sweet'], a: 0 },
          { q: 'What were the people in Bangkok like?', o: ['very busy', 'very hospitable', 'very quiet'], a: 1 },
          { q: "How was Linh's trip?", o: ['amazing', 'boring', 'bad'], a: 0 }
        ]
      }
    ]
  }
  ]
};

/* Ngữ pháp chung — chủ điểm xuyên lớp. Bài luyện của mỗi chủ điểm lấy từ các bài tập gắn cùng topic. */
window.GRAMMAR_TOPICS = [
  {
    id: 'be', group: 'Động từ', title: 'Động từ to be: am / is / are',
    explain: 'To be có nghĩa là "là, thì, ở". Chọn am / is / are theo chủ ngữ.',
    table: [
      ['I', 'am', "I am ten. (I'm)"],
      ['He / She / It / 1 người, 1 vật', 'is', "She is from Japan. (She's)"],
      ['You / We / They / nhiều người, nhiều vật', 'are', "We are friends. (We're)"],
      ['Câu hỏi', 'Đảo to be lên đầu', 'Is she from Britain? — Yes, she is.'],
      ['Phủ định', 'thêm not', "He isn't from Thailand."]
    ]
  },
  {
    id: 'present', group: 'Thì', title: 'Thì hiện tại đơn: have / has, do / don\'t',
    explain: 'Nói thói quen, việc lặp lại. Với He / She / 1 người, động từ thêm s (have → has). Câu hỏi và phủ định mượn do / does.',
    table: [
      ['I / You / We / They', 'I have English on Mondays.', 'Do you have art? — Yes, I do.'],
      ['He / She / 1 người', 'She has maths today.', 'Does she have music? — No, she doesn\'t.'],
      ['Phủ định', "I don't have PE today.", "He doesn't like science."]
    ]
  },
  {
    id: 'continuous', group: 'Thì', title: 'Thì hiện tại tiếp diễn',
    explain: 'Nói việc đang xảy ra ngay lúc nói: am / is / are + động từ thêm -ing.',
    table: [
      ['I', "I'm reading.", ''],
      ['He / She / 1 người', 'She is riding a bike.', ''],
      ['We / They / nhiều người', 'They are playing football.', ''],
      ['Hỏi', 'What are you doing?', "I'm drawing a picture."]
    ]
  },
  {
    id: 'past', group: 'Thì', title: 'Quá khứ của to be: was / were',
    explain: 'Dùng khi có mốc thời gian đã qua: yesterday, last weekend, last summer.',
    table: [
      ['I / He / She / It', 'was / wasn\'t', 'I was at the zoo.'],
      ['You / We / They', 'were / weren\'t', 'They were in London.'],
      ['Hỏi', 'Were you … ?', "Yes, I was. / No, I wasn't."]
    ]
  },
  {
    id: 'can', group: 'Động từ', title: 'Động từ khuyết thiếu: can',
    explain: 'can + động từ nguyên mẫu, dùng để nói khả năng. Giống nhau với mọi chủ ngữ.',
    table: [
      ['Khẳng định', 'She can swim.', ''],
      ['Phủ định', "He can't (cannot) draw.", ''],
      ['Hỏi', 'Can you sing?', "Yes, I can. / No, I can't."]
    ]
  },
  {
    id: 'there', group: 'Cấu trúc câu', title: 'There is / There are',
    explain: 'Dùng để nói "có cái gì ở đâu".',
    table: [
      ['1 vật', 'There is a library.', ''],
      ['Nhiều vật', 'There are two gardens.', ''],
      ['Hỏi số lượng', 'How many … are there?', 'There are three.']
    ]
  },
  {
    id: 'wh', group: 'Cấu trúc câu', title: 'Từ để hỏi: What, Where, When, Who, How old…',
    explain: 'Mỗi từ để hỏi dùng cho một loại thông tin.',
    table: [
      ['What', 'cái gì', 'What can you do?'],
      ['What time', 'mấy giờ', 'What time do you get up?'],
      ['Where', 'ở đâu', 'Where is your school?'],
      ['When', 'khi nào', "When's your birthday?"],
      ['Who', 'ai', 'Who is your best friend?'],
      ['How old', 'bao nhiêu tuổi', 'How old are you?'],
      ['How many', 'bao nhiêu (đếm được)', 'How many books are there?'],
      ['Why', 'tại sao', 'Why do you like art?']
    ]
  },
  {
    id: 'prep', group: 'Từ loại', title: 'Giới từ in / on / at',
    explain: 'Giới từ chỉ thời gian và nơi chốn hay gặp ở lớp 4.',
    table: [
      ['at + giờ', "at seven o'clock", 'at + điểm cụ thể: at school, at the zoo'],
      ['on + thứ', 'on Monday(s)', 'on the beach'],
      ['in + tháng', 'in May', 'in + vùng / thành phố: in the city, in London']
    ]
  },
  {
    id: 'article', group: 'Từ loại', title: 'Mạo từ a / an và some',
    explain: 'a / an dùng cho 1 vật đếm được; some dùng cho nhiều vật hoặc thứ không đếm được.',
    table: [
      ['a', 'a cake, a sandwich', 'âm đầu là phụ âm'],
      ['an', 'an apple, an English teacher', 'âm đầu là nguyên âm'],
      ['some', 'some grapes, some juice', 'nhiều vật / không đếm được']
    ]
  }
];
;
(window.LN_V=window.LN_V||{})["data.js"]="986158f1";
