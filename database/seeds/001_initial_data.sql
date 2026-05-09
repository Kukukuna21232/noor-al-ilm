-- ═════════════════════════════════════════════════════════════════════════════
-- NOOR AL-ILM DATABASE SEEDING SCRIPT
-- Version: 1.0.0
-- Description: Initial data seeding for Islamic educational platform
-- ═════════════════════════════════════════════════════════════════════════════

-- ═════════════════════════════════════════════════════════════════════════════
-- QURAN DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert Quran Surahs (first 10 for demo)
INSERT INTO quran_surahs (surah_number, arabic_name, english_name, russian_name, urdu_name, revelation_type, total_verses, description) VALUES
(1, 'الفاتحة', 'Al-Fatiha', 'Открывающая', 'الفاتحہ', 'meccan', 7, 'The opening chapter of the Quran, recited in every prayer'),
(2, 'البقرة', 'Al-Baqarah', 'Корова', 'البقرۃ', 'medinan', 286, 'The longest chapter, covering various aspects of Islamic law and guidance'),
(3, 'آل عمران', 'Aal-E-Imran', 'Семейство Имрана', 'آل عمران', 'medinan', 200, 'Discusses the family of Imran and includes stories of Maryam and Isa'),
(4, 'النساء', 'An-Nisa', 'Женщины', 'النساء', 'medinan', 176, 'Covers laws related to women, marriage, inheritance, and social justice'),
(5, 'المائدة', 'Al-Maidah', 'Трапеза', 'المائدۃ', 'medinan', 120, 'Contains laws about food, pilgrimage, and treaties'),
(6, 'الأنعام', 'Al-Anam', 'Скот', 'الانعام', 'meccan', 165, 'Discusses natural signs of God and rejection of polytheism'),
(7, 'الأعراف', 'Al-Araf', 'Ограждения', 'الاعراف', 'meccan', 206, 'Stories of previous prophets and the concept of limits'),
(8, 'الأنفال', 'Al-Anfal', 'Добыча', 'الانفال', 'medinan', 75, 'Rules of warfare and the Battle of Badr'),
(9, 'التوبة', 'At-Tawbah', 'Покаяние', 'توبۃ', 'medinan', 129, 'Repentance and disavowal of pagans'),
(10, 'يونس', 'Yunus', 'Иона', 'یونس', 'meccan', 109, 'Story of Prophet Yunus and God''s mercy');

-- Insert sample Quran verses (Al-Fatiha)
INSERT INTO quran_verses (surah_id, verse_number, arabic_text, russian_translation, english_translation, transliteration) VALUES
-- Al-Fatiha verses
(1, 1, 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', 'Во имя Аллаха, Милостивого, Милостивейшего', 'In the name of Allah, the Most Gracious, the Most Merciful', 'Bismillah ir-Rahman ir-Rahim'),
(1, 2, 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Хвала Аллаху, Господу миров', 'All praise is due to Allah, Lord of the worlds', 'Alhamdulillahi Rabbil alamin'),
(1, 3, 'الرَّحْمَنِ الرَّحِيمِ', 'Милостивому, Милостивейшему', 'The Most Gracious, the Most Merciful', 'Ar-Rahman ir-Rahim'),
(1, 4, 'مَالِكِ يَوْمِ الدِّينِ', 'Властелину Дня воздаяния', 'Sovereign of the Day of Recompense', 'Maliki yawmid-din'),
(1, 5, 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'Тебе мы поклоняемся и Тебя молим о помощи', 'It is You we worship and You we ask for help', 'Iyyaka nabudu wa iyyaka nastain'),
(1, 6, 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Веди нас прямым путем', 'Guide us to the straight way', 'Ihdinas-siratal-mustaqim'),
(1, 7, 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'Путем тех, кого Ты облагодетельствовал, не тех, на которых пал гнев, и не заблудших', 'The way of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray', 'Siratalladhina anamta alayhim ghayril-maghdubi alayhim wa lad-dallin');

-- Insert sample verses from Al-Baqarah
INSERT INTO quran_verses (surah_id, verse_number, arabic_text, russian_translation, english_translation, transliteration) VALUES
(2, 255, 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ', 'Аллах – нет божества, кроме Него, Живого, Поддерживающего жизнь. Не сотрясет Его ни дремота, ни сон. Ему принадлежит то, что на небесах и на земле. Кто заступится перед Ним без Его дозволения? Он знает то, что было до них, и то, что будет после них, а они не постигают из Его знаний ничего, кроме того, что Он пожелает. Его Престол объемлет небеса и землю, и не тяготит Его их хранение. Он – Высокий, Великий', 'Allah – there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great', 'Allahu la ilaha illa huwal hayyul qayyum la takhuzuhu sinatun wa la nawm lahu ma fissamawati wa ma fil ard man dhalladhi yashfau indahu illa bi idhni yalamu ma bayna aydihim wa ma khalfahum wa la yuhituna bi shayin min ilmihi illa bima shaa wasia kursiyyuhus samawati wal ard wa la ya uduhu hifdhuhuma wa huwal aliyyul adhim');

-- ═════════════════════════════════════════════════════════════════════════════
-- HADITH DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert Hadith collections
INSERT INTO hadith_collections (name, arabic_name, english_name, russian_name, narrator, description, total_hadith) VALUES
('Sahih Bukhari', 'صحيح البخاري', 'Sahih al-Bukhari', 'Сахих аль-Бухари', 'Imam al-Bukhari', 'The most authentic collection of hadith', 7563),
('Sahih Muslim', 'صحيح مسلم', 'Sahih Muslim', 'Сахих Муслим', 'Imam Muslim', 'Second most authentic collection', 3033),
('Sunan Abu Dawud', 'سنن أبي داود', 'Sunan Abu Dawud', 'Сунан Абу Дауд', 'Abu Dawud', 'Collection focusing on legal hadith', 4590),
('Jami at-Tirmidhi', 'جامع الترمذي', 'Jami at-Tirmidhi', 'Джами ат-Тирмизи', 'Imam at-Tirmidhi', 'Comprehensive collection with authenticity grading', 3956),
('Sunan an-Nasai', 'سنن النسائي', 'Sunan an-Nasai', 'Сунан ан-Насаи', 'Imam an-Nasai', 'Collection organized by legal topics', 5664),
('Sunan Ibn Majah', 'سنن ابن ماجه', 'Sunan Ibn Majah', 'Сунан Ибн Маджа', 'Ibn Majah', 'Collection covering various aspects of Islam', 4341);

-- Insert sample hadiths
INSERT INTO hadiths (collection_id, hadith_number, arabic_text, russian_translation, english_translation, narrator_chain, chapter, book, authenticity) VALUES
-- From Sahih Bukhari
(1, '1', 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، فَمَنْ هَاجَرَ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ هَاجَرَ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَتَزَوَّجُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ', 'Воистину, дела (оцениваются) по намерениям, и, поистине, каждому человеку (получится) то, что он намеревался (получить), и поэтому переселившийся (ради) Аллаха и Его посланника, его переселение (станет) ради Аллаха и Его посланника, а переселившийся ради чего-то мирского или ради женщины, на которой он женится, его переселение (станет) ради того, к чему он переселился', 'Indeed, actions are judged by intentions, so each man will have what he intended. Thus, whose migration was for Allah and His Messenger, his migration is for Allah and His Messenger; and whose migration was to achieve some worldly benefit or to take a woman in marriage, his migration is for that for which he migrated', 'عن عمر بن الخطاب رضي الله عنه قال', 'Revelation', 'Beginning', 'sahih'),
(1, '8', 'بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لا إِلَهَ إِلا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ', 'Ислам основан на пяти (столпах): свидетельстве о том, что нет бога, кроме Аллаха, и что Мухаммад – посланник Аллаха, совершении молитвы, уплате закята, совершении хаджа и соблюдении поста в рамадане', 'Islam has been built on five [pillars]: testifying that there is no deity but Allah and that Muhammad is the Messenger of Allah, establishing prayer, paying zakah, performing pilgrimage to the House, and fasting in Ramadan', 'عن عبد الله بن عمر رضي الله عنهما', 'Faith', 'Pillars of Islam', 'sahih'),
(1, '13', 'إِذَا جَاءَ شَهْرُ رَمَضَانَ فُتِحَتْ أَبْوَابُ الْجَنَّةِ، وَغُلِّقَتْ أَبْوَابُ النَّارِ، وَسُلْسِلَتِ الشَّيَاطِينُ', 'Когда наступает месяц Рамадан, открываются врата Рая, закрываются врата Ада и дьяволы бывают закованы в оковы', 'When Ramadan begins, the gates of Paradise are opened, the gates of Hell are closed, and the devils are chained', 'عن أبي هريرة رضي الله عنه', 'Fasting', 'Ramadan', 'sahih');

-- From Sahih Muslim
(2, '1', 'الطَّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ تَمْلَأَنِ - أَوْ تَمْلَأُ - مَا بَيْنَ السَّمَاوَاتِ وَالْأَرْضِ، وَالصَّلاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ', 'Чистота – половина веры, и хвала Аллаху заполняет весы, и "Слава Аллаху" и "Хвала Аллаху" заполняют то, что между небесами и землей, и молитва – это свет, и милостыня – доказательство, и терпение – это сияние', 'Purity is half of faith, and Alhamdulillah fills the scale, and Subhanallah and Alhamdulillah fill whatever is between the heavens and the earth, and prayer is a light, and charity is proof, and patience is illumination', 'عن أبي مالك الأشعري رضي الله عنه', 'Faith', 'Purification', 'sahih'),
(2, '234', 'مَنْ نَفَّسَ عَنْ مَالِ امْرِئٍ بِغَيْرِ حَقٍّ لَقِيَ اللَّهَ عَزَّ وَجَلََّّ مَحْرُومًا مَدْبُورًا وَدَخَلَ النَّارَ', 'Кто неправедно присвоит имущество мусульманина, тот встретит Аллаха проклятым и отвергнутым и войдет в Ад', 'He who usurps the right of a Muslim by taking a false oath will be made to meet Allah angry and disgraced', 'عن أبي هريرة رضي الله عنه', 'Business', 'Forbidden transactions', 'sahih');

-- ═════════════════════════════════════════════════════════════════════════════
-- COURSE DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert sample courses
INSERT INTO courses (id, title, arabic_title, russian_title, description, arabic_description, russian_description, instructor_id, category_id, level, duration_weeks, price, currency, language, is_free, is_published, max_students, current_students, rating, review_count, tags, requirements, what_you_learn) VALUES
-- Quran Courses
(uuid_generate_v4(), 'Quran Recitation Basics', 'أساسيات تلاوة القرآن', 'Основы чтения Корана', 'Learn the basics of Quran recitation with proper Tajweed rules', 'تعلم أساسيات تلاوة القرآن بقواعد التجويد الصحيحة', 'Изучите основы чтения Корана с правильными правилами Таджвида', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Quran Studies'), 'beginner', 8, 0, 'USD', 'ar', true, true, 100, 45, 4.8, 23, '{"quran", "tajweed", "recitation", "beginner"}', '{"Basic Arabic knowledge", "Willingness to learn"}', '{"Proper Quran pronunciation", "Basic Tajweed rules", "Memorization techniques"}'),
(uuid_generate_v4(), 'Advanced Tajweed Mastery', 'إتقان التجويد المتقدم', 'Продвинутое владение Таджвидом', 'Master advanced Tajweed rules and perfect your Quran recitation', 'إتقان قواعد التجويد المتقدمة وتحسين تلاوة القرآن', 'Освойте продвинутые правила Таджвида и усовершенствуйте чтение Корана', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Quran Studies'), 'advanced', 12, 99.99, 'USD', 'ar', false, true, 50, 28, 4.9, 15, '{"quran", "tajweed", "advanced", "recitation"}', '{"Basic Tajweed knowledge", "Quran recitation experience"}', '{"Advanced Tajweed rules", "Quranic articulation points", "Recitation styles"}'),

-- Arabic Language Courses
(uuid_generate_v4(), 'Arabic for Quran Understanding', 'العربية لفهم القرآن', 'Арабский для понимания Корана', 'Learn Arabic language specifically for understanding the Quran', 'تعلم اللغة العربية خصيصاً لفهم القرآن', 'Изучайте арабский язык специально для понимания Корана', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Arabic Language'), 'intermediate', 16, 149.99, 'USD', 'ar', false, true, 75, 52, 4.7, 31, '{"arabic", "quran", "language", "intermediate"}', '{"Basic Arabic knowledge", "Quran reading ability"}', '{"Quranic vocabulary", "Arabic grammar", "Quran comprehension"}'),
(uuid_generate_v4(), 'Classical Arabic Grammar', 'النحو العربي الكلاسيكي', 'Классическая арабская грамматика', 'Deep dive into classical Arabic grammar and syntax', 'دراسة متعمقة في النحو والصرف العربي الكلاسيكي', 'Глубокое изучение классической арабской грамматики и синтаксиса', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Arabic Language'), 'advanced', 20, 199.99, 'USD', 'ar', false, true, 40, 18, 4.6, 12, '{"arabic", "grammar", "advanced", "classical"}', '{"Intermediate Arabic", "Grammar foundation"}', '{"Classical grammar rules", "Arabic morphology", "Literary analysis"}'),

-- Islamic Studies Courses
(uuid_generate_v4(), 'Islamic History: Early Period', 'التاريخ الإسلامي: العصر المبكر', 'Исламская история: ранний период', 'Explore the early history of Islam from Prophet Muhammad to the Rightly Guided Caliphs', 'استكشف التاريخ المبكر للإسلام من النبي محمد إلى الخلفاء الراشدين', 'Исследуйте раннюю историю Ислама от пророка Мухаммада до Праведных халифов', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Islamic History'), 'intermediate', 10, 79.99, 'USD', 'ar', false, true, 60, 35, 4.8, 19, '{"history", "islam", "prophet", "caliphs"}', '{"Basic Islamic knowledge", "Interest in history"}', '{"Prophet Muhammad''s life", "Rightly Guided Caliphs", "Early Islamic expansion"}'),
(uuid_generate_v4(), 'Fiqh of Worship', 'فقه العبادات', 'Фикх поклонений', 'Comprehensive study of Islamic jurisprudence related to worship', 'دراسة شاملة للفقه الإسلامي المتعلق بالعبادات', 'Комплексное изучение исламской юриспруденции, связанной с поклонениями', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM course_categories WHERE name = 'Fiqh & Sharia'), 'intermediate', 14, 119.99, 'USD', 'ar', false, true, 80, 47, 4.7, 28, '{"fiqh", "worship", "prayer", "fasting"}', '{"Basic Islamic knowledge", "Understanding of Arabic"}', '{"Prayer jurisprudence", "Fasting rules", "Zakat calculations", "Hajj rituals"}');

-- Insert sample lessons for Quran Recitation Basics course
INSERT INTO course_lessons (id, course_id, title, arabic_title, russian_title, description, content, video_url, duration_minutes, sort_order, is_free, is_published) VALUES
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Introduction to Tajweed', 'مقدمة في التجويد', 'Введение в Таджвид', 'Overview of Tajweed rules and their importance', 'نظرة عامة على قواعد التجويد وأهميتها', 'Обзор правил Таджвида и их важность', 'https://example.com/video1', 45, 1, true, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Arabic Alphabet and Pronunciation', 'الأبجدية العربية والنطق', 'Арабский алфавит и произношение', 'Learn proper Arabic alphabet pronunciation', 'تعلم النطق الصحيح للأبجدية العربية', 'Изучите правильное произношение арабского алфавита', 'https://example.com/video2', 60, 2, true, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Makharij al-Huruf (Articulation Points)', 'مخارج الحروف', 'Махарид аль-Хуруф (точки артикуляции)', 'Detailed study of Arabic letter articulation points', 'دراسة تفصيلية لمخارج الحروف العربية', 'Детальное изучение точек артикуляции арабских букв', 'https://example.com/video3', 55, 3, false, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Sifaat al-Huruf (Letter Characteristics)', 'صفات الحروف', 'Сифат аль-Хуруф (характеристики букв)', 'Understanding the characteristics of Arabic letters', 'فهم خصائص الحروف العربية', 'Понимание характеристик арабских букв', 'https://example.com/video4', 50, 4, false, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Noon (ن) and Meem (م) Rules', 'قواعد النون والميم', 'Правила Нун и Мим', 'Rules for Noon and Meem with Tanween', 'قواعد النون والميم مع التنوين', 'Правила для Нун и Мим с Танвин', 'https://example.com/video5', 40, 5, false, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Laam (ل) Rules', 'قواعد اللام', 'Правила Лам', 'Rules for Laam in different contexts', 'قواعد اللام في سياقات مختلفة', 'Правила для Лам в различных контекстах', 'https://example.com/video6', 35, 6, false, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Qalqalah (Echo) Rules', 'قواعد القلقة', 'Правила Калькала', 'Understanding and applying Qalqalah rules', 'فهم وتطبيق قواعد القلقة', 'Понимание и применение правил Калькала', 'https://example.com/video7', 30, 7, false, true),
(uuid_generate_v4(), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 'Practice and Application', 'الممارسة والتطبيق', 'Практика и применение', 'Putting all Tajweed rules together in practice', 'تطبيق جميع قواعد التجويد معًا في الممارسة', 'Применение всех правил Таджвида вместе на практике', 'https://example.com/video8', 60, 8, false, true);

-- ═════════════════════════════════════════════════════════════════════════════
-- FORUM DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert sample forum posts
INSERT INTO forum_posts (id, title, content, author_id, category_id, is_pinned, view_count, like_count, reply_count, tags, created_at) VALUES
-- General Discussion posts
(uuid_generate_v4(), 'Welcome to Noor Al-Ilm Community!', 'مرحباً بكم في مجتمع نور العلم!', 'Добро пожаловать в сообщество Нур аль-Ильм!', 'Assalamu Alaikum wa Rahmatullahi Wa Barakatuh! Welcome to our Islamic educational community. Feel free to introduce yourself and share your learning journey with us.', 'السلام عليكم ورحمة الله وبركاته! أهلاً بكم في مجتمعنا التعليمي الإسلامي. لا تترددوا في تقديم أنفسكم ومشاركة رحلتكم التعليمية معنا.', 'Ассаляму алейкум ва рахматуллахи ва баракатух! Добро пожаловать в наше исламское образовательное сообщество. Не стесняйтесь представиться и поделиться своим учебным путём с нами.', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'General Discussion'), true, 1250, 89, 45, '{"welcome", "introduction", "community"}', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(uuid_generate_v4(), 'Best resources for learning Arabic?', 'ما هي أفضل الموارد لتعلم العربية؟', 'Какие лучшие ресурсы для изучения арабского?', 'I want to learn Arabic to understand the Quran better. What resources do you recommend for beginners?', 'أريد تعلم العربية لفهم القرآن بشكل أفضل. ما هي الموارد التي توصون بها للمبتدئين؟', 'Я хочу выучить арабский, чтобы лучше понимать Коран. Какие ресурсы вы порекомендуете для начинающих?', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'General Discussion'), false, 890, 67, 34, '{"arabic", "learning", "resources", "beginner"}', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Quran & Hadith posts
(uuid_generate_v4(), 'Understanding Surah Al-Ikhlas', 'فهم سورة الإخلاص', 'Понимание суры "Аль-Ихлас"', 'Can someone explain the deep meaning and significance of Surah Al-Ikhlas? I know it''s about the oneness of Allah, but I''d like to understand it better.', 'هل يمكن لأحد أن يشرح المعنى العميق وأهمية سورة الإخلاص؟ أعلم أنها تتحدث عن وحدانية الله، لكني أود فهمها بشكل أفضل.', 'Может ли кто-нибудь объяснить глубокий смысл и значимость суры "Аль-Ихлас"? Я знаю, что речь идет о единстве Аллаха, но я хотел бы понять ее лучше.', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'Quran & Hadith'), false, 567, 45, 28, '{"quran", "surah-ikhlas", "tawhid", "explanation"}', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(uuid_generate_v4(), 'Hadith about intentions in daily life', 'حديث عن النوايا في الحياة اليومية', 'Хадис о намерениях в повседневной жизни', 'How do we apply the hadith "Indeed, actions are judged by intentions" in our daily modern life? Share your practical examples.', 'كيف نطبق حديث "إنما الأعمال بالنوايا" في حياتنا اليومية الحديثة؟ شاركوا أمثلتكم العملية.', 'Как мы применяем хадис "Воистину, дела оцениваются по намерениям" в нашей современной повседневной жизни? Поделитесь своими практическими примерами.', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'Quran & Hadith'), false, 445, 38, 22, '{"hadith", "intentions", "daily-life", "practical"}', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Islamic Education posts
(uuid_generate_v4(), 'Tips for memorizing the Quran', 'نصائح لحفظ القرآن', 'Советы по заучиванию Корана', 'I want to start memorizing the Quran but I''m struggling with consistency. What techniques have worked for you?', 'أريد أن أبدأ في حفظ القرآن لكني أواجه صعوبة في الاستمرارية. ما هي التقنيات التي نجحت معكم؟', 'Я хочу начать заучивать Коран, но мне трудно поддерживать последовательность. Какие техники сработали для вас?', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'Islamic Education'), false, 789, 92, 56, '{"quran", "memorization", "hifz", "tips"}', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(uuid_generate_v4(), 'Balancing work, family, and Islamic studies', 'موازنة العمل والأسرة والدراسات الإسلامية', 'Балансировка работы, семьи и исламских исследований', 'How do you manage time for Islamic education while working and taking care of family? Share your time management strategies.', 'كيف تديرون الوقت للتعليم الإسلامي أثناء العمل والاهتمام بالأسرة؟ شاركوا استراتيجيات إدارة الوقت الخاصة بكم.', 'Как вы находите время для исламского образования, работая и заботясь о семье? Поделитесь своими стратегиями управления временем.', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), (SELECT id FROM forum_categories WHERE name = 'Islamic Education'), false, 634, 71, 43, '{"time-management", "work-life-balance", "islamic-studies", "family"}', CURRENT_TIMESTAMP - INTERVAL '6 days');

-- ═════════════════════════════════════════════════════════════════════════════
-- USER DATA SEEDING (Sample Users)
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert sample users with different roles
INSERT INTO users (id, email, username, password_hash, first_name, last_name, display_name, avatar_url, bio, country, city, language, timezone, is_active, is_verified, created_at) VALUES
-- Teachers
(uuid_generate_v4(), 'teacher1@noor-al-ilm.com', 'teacher1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Ahmed', 'Mohammed', 'أحمد محمد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1', 'Quran and Arabic teacher with 15 years of experience', 'Egypt', 'Cairo', 'ar', 'Africa/Cairo', true, true, CURRENT_TIMESTAMP - INTERVAL '30 days'),
(uuid_generate_v4(), 'teacher2@noor-al-ilm.com', 'teacher2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Fatima', 'Al-Rashid', 'فاطمة الرشيد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2', 'Islamic studies specialist focusing on Fiqh and Sharia', 'Saudi Arabia', 'Riyadh', 'ar', 'Asia/Riyadh', true, true, CURRENT_TIMESTAMP - INTERVAL '25 days'),
(uuid_generate_v4(), 'teacher3@noor-al-ilm.com', 'teacher3', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Ibrahim', 'Khan', 'إبراهيم خان', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3', 'Arabic language and Quran recitation expert', 'Pakistan', 'Karachi', 'ur', 'Asia/Karachi', true, true, CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Students
(uuid_generate_v4(), 'student1@noor-al-ilm.com', 'student1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Mohammed', 'Ali', 'محمد علي', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1', 'Passionate learner of Quran and Islamic studies', 'UAE', 'Dubai', 'ar', 'Asia/Dubai', true, true, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(uuid_generate_v4(), 'student2@noor-al-ilm.com', 'student2', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Aisha', 'Khalid', 'عائشة خالد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2', 'Learning Arabic to understand the Quran better', 'Russia', 'Moscow', 'ru', 'Europe/Moscow', true, true, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(uuid_generate_v4(), 'student3@noor-al-ilm.com', 'student3', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Abdullah', 'Saeed', 'عبد الله سعيد', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3', 'Beginner in Islamic studies, eager to learn', 'Jordan', 'Amman', 'ar', 'Asia/Amman', true, false, CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Moderators
(uuid_generate_v4(), 'moderator1@noor-al-ilm.com', 'moderator1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'Omar', 'Hassan', 'عمر حسن', 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator1', 'Community moderator helping maintain positive discussions', 'Kuwait', 'Kuwait City', 'ar', 'Asia/Kuwait', true, true, CURRENT_TIMESTAMP - INTERVAL '40 days');

-- Assign roles to users
INSERT INTO user_roles (user_id, role, granted_by) VALUES
((SELECT id FROM users WHERE email = 'teacher1@noor-al-ilm.com'), 'teacher', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'teacher2@noor-al-ilm.com'), 'teacher', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'teacher3@noor-al-ilm.com'), 'teacher', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'moderator1@noor-al-ilm.com'), 'moderator', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), 'student', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), 'student', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com')),
((SELECT id FROM users WHERE email = 'student3@noor-al-ilm.com'), 'student', (SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'));

-- Insert user preferences for all users
INSERT INTO user_preferences (user_id, theme, notification_email, notification_push, language, timezone, privacy_level, show_profile, allow_messages, allow_friend_requests) VALUES
((SELECT id FROM users WHERE email = 'teacher1@noor-al-ilm.com'), 'light', true, true, 'ar', 'Africa/Cairo', 'public', true, true, true),
((SELECT id FROM users WHERE email = 'teacher2@noor-al-ilm.com'), 'light', true, true, 'ar', 'Asia/Riyadh', 'public', true, true, true),
((SELECT id FROM users WHERE email = 'teacher3@noor-al-ilm.com'), 'light', true, true, 'ur', 'Asia/Karachi', 'public', true, true, true),
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), 'dark', true, true, 'ar', 'Asia/Dubai', 'public', true, true, true),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), 'light', true, false, 'ru', 'Europe/Moscow', 'friends', true, true, true),
((SELECT id FROM users WHERE email = 'student3@noor-al-ilm.com'), 'light', true, true, 'ar', 'Asia/Amman', 'public', true, true, true),
((SELECT id FROM users WHERE email = 'moderator1@noor-al-ilm.com'), 'light', true, true, 'ar', 'Asia/Kuwait', 'public', true, true, true);

-- ═════════════════════════════════════════════════════════════════════════════
-- ENROLLMENT DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Enroll students in courses
INSERT INTO course_enrollments (user_id, course_id, progress_percentage, last_accessed_at) VALUES
-- Student 1 enrollments
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 75.5, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Arabic for Quran Understanding'), 45.0, CURRENT_TIMESTAMP - INTERVAL '1 day'),
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Islamic History: Early Period'), 60.0, CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Student 2 enrollments
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 90.0, CURRENT_TIMESTAMP - INTERVAL '4 hours'),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Arabic for Quran Understanding'), 30.0, CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Student 3 enrollments
((SELECT id FROM users WHERE email = 'student3@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), 25.0, CURRENT_TIMESTAMP - INTERVAL '6 hours'),
((SELECT id FROM users WHERE email = 'student3@noor-al-ilm.com'), (SELECT id FROM courses WHERE title = 'Fiqh of Worship'), 15.0, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Update course student counts
UPDATE courses SET current_students = current_students + 1 WHERE id IN (
    SELECT course_id FROM course_enrollments
);

-- ═════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS DATA SEEDING
-- ═════════════════════════════════════════════════════════════════════════════

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, action_url, action_text, created_at) VALUES
-- Welcome notifications
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), 'Welcome to Noor Al-Ilm!', 'We are excited to have you join our community. Start your learning journey today!', 'info', '/courses', 'Browse Courses', CURRENT_TIMESTAMP - INTERVAL '7 days'),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), 'Welcome to Noor Al-Ilm!', 'Welcome to our Islamic educational platform. Explore our courses and community.', 'info', '/quran', 'Read Quran', CURRENT_TIMESTAMP - INTERVAL '10 days'),
((SELECT id FROM users WHERE email = 'student3@noor-al-ilm.com'), 'Welcome to Noor Al-Ilm!', 'Assalamu Alaikum! Welcome to our learning community.', 'info', '/forum', 'Join Forum', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Course progress notifications
((SELECT id FROM users WHERE email = 'student1@noor-al-ilm.com'), 'Great Progress!', 'You have completed 75% of Quran Recitation Basics course. Keep going!', 'success', '/courses', 'Continue Learning', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), 'Course Completed!', 'Congratulations! You have completed Quran Recitation Basics course.', 'success', '/courses', 'View Certificate', CURRENT_TIMESTAMP - INTERVAL '1 day'),

-- Forum notifications
((SELECT id FROM users WHERE email = 'teacher1@noor-al-ilm.com'), 'New Reply to Your Post', 'Someone replied to your forum post about Tajweed rules.', 'forum', '/forum', 'View Reply', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
((SELECT id FROM users WHERE email = 'student2@noor-al-ilm.com'), 'New Discussion Started', 'A new discussion has started in the Quran & Hadith category.', 'forum', '/forum', 'Join Discussion', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- ═════════════════════════════════════════════════════════════════════════════
-- SEEDING COMPLETION
-- ═════════════════════════════════════════════════════════════════════════════

-- Update statistics
UPDATE courses SET current_students = (
    SELECT COUNT(*) FROM course_enrollments 
    WHERE course_enrollments.course_id = courses.id
);

UPDATE forum_posts SET reply_count = (
    SELECT COUNT(*) FROM forum_posts replies 
    WHERE replies.parent_id = forum_posts.id
);

-- Insert audit logs for initial data
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent) VALUES
((SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), 'CREATE', 'user', (SELECT id FROM users WHERE email = 'teacher1@noor-al-ilm.com'), NULL, '{"role": "teacher"}', '127.0.0.1', 'Mozilla/5.0 (Initial Seeding)'),
((SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), 'CREATE', 'course', (SELECT id FROM courses WHERE title = 'Quran Recitation Basics'), NULL, '{"title": "Quran Recitation Basics", "is_published": true}', '127.0.0.1', 'Mozilla/5.0 (Initial Seeding)'),
((SELECT id FROM users WHERE email = 'admin@noor-al-ilm.com'), 'CREATE', 'forum_post', (SELECT id FROM forum_posts WHERE title = 'Welcome to Noor Al-Ilm Community!'), NULL, '{"is_pinned": true}', '127.0.0.1', 'Mozilla/5.0 (Initial Seeding)');

-- Seeding completed
SELECT 'Initial data seeding completed successfully' as status;
