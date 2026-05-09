'use client';

import { useState, useEffect } from 'react';

const hadiths = [
  {
    arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
    russian: 'Поистине, дела оцениваются по намерениям.',
    english: 'Actions are judged by intentions.',
    source: 'Sahih Al-Bukhari, 1',
    narrator: 'Umar ibn Al-Khattab (RA)',
  },
  {
    arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
    russian: 'Мусульманин — тот, от языка и рук которого в безопасности другие мусульмане.',
    english: 'A Muslim is one from whose tongue and hands other Muslims are safe.',
    source: 'Sahih Al-Bukhari, 10',
    narrator: 'Abdullah ibn Amr (RA)',
  },
  {
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    russian: 'Никто из вас не уверует по-настоящему, пока не полюбит для своего брата то, что любит для себя.',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
    source: 'Sahih Al-Bukhari, 13',
    narrator: 'Anas ibn Malik (RA)',
  },
  {
    arabic: 'الدِّينُ النَّصِيحَةُ',
    russian: 'Религия — это искренность.',
    english: 'Religion is sincere advice.',
    source: 'Sahih Muslim, 55',
    narrator: 'Tamim Ad-Dari (RA)',
  },
  {
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    russian: 'Лучший из вас — тот, кто изучил Коран и обучает ему других.',
    english: 'The best of you are those who learn the Quran and teach it.',
    source: 'Sahih Al-Bukhari, 5027',
    narrator: 'Uthman ibn Affan (RA)',
  },
  {
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    russian: 'Поиск знания — обязанность каждого мусульманина.',
    english: 'Seeking knowledge is an obligation upon every Muslim.',
    source: 'Ibn Majah, 224',
    narrator: 'Anas ibn Malik (RA)',
  },
  {
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    russian: 'Кто верует в Аллаха и Судный день, пусть говорит благое или молчит.',
    english: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    source: 'Sahih Al-Bukhari, 6018',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا',
    russian: 'Поистине, Аллах Благ и принимает только благое.',
    english: 'Verily, Allah is Good and accepts only that which is good.',
    source: 'Sahih Muslim, 1015',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْكَيْسُ مَنْ دَانَ نَفْسَهُ وَعَمِلَ لِمَا بَعْدَ الْمَوْتِ',
    russian: 'Разумен тот, кто подчинил свою страсть и работал для того, что после смерти.',
    english: 'The wise one is he who disciplines himself and works for what is after death.',
    source: 'Tirmidhi, 2459',
    narrator: 'Umar ibn Al-Khattab (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ الَّذِي يُخَالِطُ النَّاسَ وَيَصْبِرُ عَلَى أَذَاهُمْ خَيْرٌ مِنَ الَّذِي لَا يُخَالِطُ النَّاسَ وَلَا يَصْبِرُ عَلَى أَذَاهُمْ',
    russian: 'Верующий, который общается с людьми и терпит их обиды, лучше того, кто не общается с людьми и не терпит их обид.',
    english: 'A believer who mixes with people and patiently endures their harm is better than one who does not mix with people and does not endure their harm.',
    source: 'Tirmidhi, 2507',
    narrator: 'Ibn Umar (RA)',
  },
  {
    arabic: 'مَنْ صَلَّى عَلَىَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا',
    russian: 'Кто помолится за меня одной молитвой, Аллах помолится за него десятью молитвами.',
    english: 'Whoever sends blessings upon me once, Allah will send blessings upon him ten times.',
    source: 'Sahih Muslim, 384',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'سَبْقَانِ سَبَقَا هَذَا الْكِتَابُ وَسَبَقَتْ هَذِهِ السُّنَّةُ',
    russian: 'Двое опередили: эта Книга и эта Сунна.',
    english: 'Two have preceded: this Book and this Sunnah.',
    source: 'Sahih Muslim, 2401',
    narrator: 'Irbad ibn Sariyah (RA)',
  },
  {
    arabic: 'الْبِرُّ حُسْنُ الْخُلُقِ',
    russian: 'Благочестие — это хороший нрав.',
    english: 'Righteousness is good character.',
    source: 'Sahih Muslim, 2553',
    narrator: 'An-Nawwas ibn Saman (RA)',
  },
  {
    arabic: 'إِذَا أَرَدْتَ عِبَادَةَ اللَّهِ فَاعْلَمْ أَنَّ اللَّهَ لَا يَقْبَلُ مِنَ الْعَمَلِ إِلَّا مَا كَانَ خَالِصًا لَهُ وَابْتَغَى بِهِ وَجْهَهُ',
    russian: 'Когда ты захочешь поклоняться Аллаху, знай, что Аллах не принимает из дел ничего, кроме того, что искренне для Него и с желанием Его Лика.',
    english: 'When you intend to do good deeds, know that Allah does not accept any deed unless it is done sincerely for Him and seeking His Face.',
    source: 'Abu Dawud, 3914',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الصَّبْرُ ضِيَاءٌ',
    russian: 'Терпение — это свет.',
    english: 'Patience is light.',
    source: 'Sahih Muslim, 223',
    narrator: 'Abu Malik Al-Ashari (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ مِثْلُ الْخَامَةِ تَسْتَمِيلُ بِالرِّيحِ مَرَّةً وَتَعُودُ مَرَّةً',
    russian: 'Верующий подобен колосу пшеницы: его наклоняет ветер, и он выпрямляется.',
    english: 'The believer is like a stalk of wheat; the wind bends it and it straightens.',
    source: 'Sahih Muslim, 2742',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ يَأْتِ النَّاسَ يَطْلُبُ مَا عِنْدَهُمْ يَسْتَعْمِلُهُمْ فَلَا يَسْتَعْمِلْهُ اللَّهُ',
    russian: 'Кто приходит к людям, чтобы получить от них пользу и использовать их, того не использует Аллах.',
    english: 'Whoever comes to the people to seek their favor and be employed by them, Allah will not employ him.',
    source: 'Sahih Al-Bukhari, 2072',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'إِنَّ لِرَبِّكَ عَلَيْكَ حَقًّا وَلِنَفْسِكَ عَلَيْكَ حَقًّا وَلِأَهْلِكَ عَلَيْكَ حَقًّا',
    russian: 'Поистине, у твоего Господа есть право на тебя, и у твоей души есть право на тебя, и у твоей семьи есть право на тебя.',
    english: 'Verily, your Lord has a right on you, and your self has a right on you, and your family has a right on you.',
    source: 'Sahih Al-Bukhari, 1967',
    narrator: 'Abdullah ibn Amr (RA)',
  },
  {
    arabic: 'الْمُسْلِمُ أَخُو الْمُسْلِمِ لَا يَظْلِمُهُ وَلَا يَخْذُلُهُ',
    russian: 'Мусульманин — брат мусульманину, он не обижает его и не предает его.',
    english: 'The Muslim is the brother of the Muslim; he does not wrong him nor does he forsake him.',
    source: 'Sahih Muslim, 2580',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ تَشَبَّهَ بِقَوْمٍ فَهُوَ مِنْهُمْ',
    russian: 'Кто уподобляется народу, тот из них.',
    english: 'Whoever imitates a people is one of them.',
    source: 'Abu Dawud, 4031',
    narrator: 'Abdullah ibn Umar (RA)',
  },
  {
    arabic: 'الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ',
    russian: 'Дозволенное ясно, и запретное ясно, а между ними — сомнительные вещи.',
    english: 'The Halal is clear and the Haram is clear, and between them are doubtful matters.',
    source: 'Sahih Al-Bukhari, 52',
    narrator: 'Al-Nuqayy ibn al-Habbab (RA)',
  },
  {
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    russian: 'Кто пойдет по пути, ища знание, Аллах облегчит ему путь в Рай.',
    english: 'Whoever takes a path upon which he seeks knowledge, Allah will make for him a path to Paradise.',
    source: 'Sahih Muslim, 2699',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    russian: 'Поистине, дела оцениваются по намерениям, и каждому человеку — лишь то, что он намеревался.',
    english: 'Verily, deeds are only by intention, and every person will have only what he intended.',
    source: 'Sahih Al-Bukhari, 1',
    narrator: 'Umar ibn Al-Khattab (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ',
    russian: 'Сильный верующий лучше и любимее Аллаху, чем слабый верующий.',
    english: 'The strong believer is better and more beloved to Allah than the weak believer.',
    source: 'Sahih Muslim, 2664',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ أَدْخَلَ عَلَى الْمُسْلِمِينَ سُرُورًا أَدْخَلَ اللَّهُ عَلَيْهِ السُّرُورَ يَوْمَ الْقِيَامَةِ',
    russian: 'Кто принесет мусульманам радость, Аллах принесет ему радость в День Воскресения.',
    english: 'Whoever brings happiness to the believers, Allah will bring him happiness on the Day of Resurrection.',
    source: 'Abu Dawud, 4809',
    narrator: 'Abdullah ibn Amr (RA)',
  },
  {
    arabic: 'الْحَيَاءُ شُعْبَةٌ مِنَ الْإِيمَانِ',
    russian: 'Стыдливость — это часть веры.',
    english: 'Modesty is a part of faith.',
    source: 'Sahih Al-Bukhari, 8',
    narrator: 'Ibn Umar (RA)',
  },
  {
    arabic: 'الْبَذْلُ فِي طَلَبِ الْعِلْمِ كَالْبَذْلِ فِي سَبِيلِ اللَّهِ',
    russian: 'Трата на поиски знания подобна трате на пути Аллаха.',
    english: 'Spending in the pursuit of knowledge is like spending in the cause of Allah.',
    source: 'Tirmidhi, 2674',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ أَحَبَّ أَنْ يُبَسْطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ',
    russian: 'Кто желает, чтобы ему расширили удел и продлили жизнь, пусть поддерживает родственные связи.',
    english: 'Whoever would like his provision to be expanded and his lifespan extended, let him maintain his kinship ties.',
    source: 'Sahih Al-Bukhari, 5985',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ',
    russian: 'Поистине, Аллах не смотрит на ваши тела и богатства, но смотрит на ваши сердца и дела.',
    english: 'Verily, Allah does not look at your bodies or your wealth, but He looks at your hearts and your deeds.',
    source: 'Sahih Muslim, 2564',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ يَأْكُلُ فِي مِعًى وَاحِدٍ وَالْكَافِرُ يَأْكُلُ فِي سَبْعَةِ أَمْعَاءٍ',
    russian: 'Верующий ест в одном желудке, а неверующий — в семи желудках.',
    english: 'The believer eats in one intestine while the disbeliever eats in seven intestines.',
    source: 'Sahih Al-Bukhari, 5380',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ تَوَاضَعَ لِلَّهِ رَفَعَهُ اللَّهُ',
    russian: 'Кто смирится перед Аллахом, того возвысит Аллах.',
    english: 'Whoever humbles himself for the sake of Allah, Allah will elevate him.',
    source: 'Sahih Muslim, 2651',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا',
    russian: 'Верующий для верующего подобен зданию, части которого укрепляют друг друга.',
    english: 'The believer to the believer is like a building, its parts supporting each other.',
    source: 'Sahih Al-Bukhari, 481',
    narrator: 'Abu Musa Al-Ashari (RA)',
  },
  {
    arabic: 'مَنْ عَمِلَ عَمَلًا لَيْسَ عَلَيْهِ أَمْرُنَا فَهُوَ رَدٌّ',
    russian: 'Кто совершит дело, на которое нет нашего повеления, то оно будет отвергнуто.',
    english: 'Whoever does an action that is not upon our command is rejected.',
    source: 'Sahih Al-Bukhari, 669',
    narrator: 'Aisha (RA)',
  },
  {
    arabic: 'إِنَّ مِنْ أَحْبَبْتُمْ أَنْ يُحِبَّكُمُ اللَّهُ وَرَسُولُهُ فَاتَّبِعُونِي',
    russian: 'Поистине, если вы любите, чтобы Аллах и Его Посланник любили вас, следуйте за мной.',
    english: 'Verily, if you love that Allah and His Messenger should love you, then follow me.',
    source: 'Sahih Al-Bukhari, 6215',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الدُّنْيا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ',
    russian: 'Этот мир — тюрьма верующего и Рай неверующего.',
    english: 'This world is a prison for the believer and a paradise for the disbeliever.',
    source: 'Sahih Muslim, 2956',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ بَيْنَ الْخَوْفَيْنِ بَيْنَ أَجَلٍ قَدْ مَضَى وَأَجَلٍ لَا يَدْرِي مَا هُوَ',
    russian: 'Верующий находится между двумя страхами: между сроком, который уже прошел, и сроком, о котором он не знает.',
    english: 'The believer is between two fears: a term that has passed, and a term that he does not know what is.',
    source: 'Tirmidhi, 2334',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
    russian: 'Кто постится в Рамадан с верой и надеждой, тому прощаются предыдущие грехи.',
    english: 'Whoever fasts Ramadan out of faith and seeking reward, his previous sins will be forgiven.',
    source: 'Sahih Al-Bukhari, 38',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ إِذَا أَحَبَّ أَخَاهُ فِي اللَّهِ أَخْبَرَهُ أَنَّهُ يُحِبُّهُ',
    russian: 'Когда верующий любит брата ради Аллаха, он сообщает ему, что любит его.',
    english: 'When a believer loves his brother in Allah, he should tell him that he loves him.',
    source: 'Abu Dawud, 5124',
    narrator: 'Al-Miqdad ibn Al-Aswad (RA)',
  },
  {
    arabic: 'إِنَّ مِنْ شَرَرِ النَّاسِ عِنْدَ اللَّهِ يَوْمَ الْقِيَامَةِ الرَّجُلَ يُكْلِّمُهُ الرَّجُلَ فَيَكْذِبُهُ',
    russian: 'Поистине, из худших людей перед Аллахом в День Воскресения — тот, кому человек говорит, а тот лжет ему.',
    english: 'Verily, among the worst people before Allah on the Day of Resurrection is a man whom another man approaches and speaks to, and he lies to him.',
    source: 'Sahih Al-Bukhari, 6043',
    narrator: 'Abdullah ibn Amr (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ إِذَا لَمْ يَسْتَحْيِ اسْتَحْيَا مِنَ الْحَقِّ',
    russian: 'Верующий, когда не стыдится, стыдится от истины.',
    english: 'The believer, when he does not feel shame, is ashamed of the truth.',
    source: 'Ibn Majah, 4195',
    narrator: 'Abdullah ibn Umar (RA)',
  },
  {
    arabic: 'مَنْ أَصْبَحَ مِنْكُمْ صَائِمًا فَلَا يَجْهَلْ عَلَى أَحَدٍ',
    russian: 'Кто из вас утром постится, пусть не проявляет невежество по отношению к кому-либо.',
    english: 'Whoever among you is fasting in the morning, let him not behave ignorantly towards anyone.',
    source: 'Sahih Al-Bukhari, 1904',
    narrator: 'Abu Hurairah (RA)',
  },
  {
    arabic: 'الْمُسْلِمُ يَسْتَقْبِلُ الْقِبْلَةَ وَالْمُشْرِكُ يَسْتَقْبِلُ كُلَّ جِهَةٍ',
    russian: 'Мусульманин обращается к Кибле, а многобожник обращается во все стороны.',
    english: 'The Muslim faces the Qibla while the polytheist faces every direction.',
    source: 'Sahih Al-Bukhari, 385',
    narrator: 'Abdullah ibn Abbas (RA)',
  },
  {
    arabic: 'إِنَّ اللَّهَ يَرْضَى لَكُمْ أَنْ تَعْبُدُوهُ وَلَا تُشْرِكُوا بِهِ شَيْئًا',
    russian: 'Поистине, Аллах доволен для вас тем, что вы поклоняетесь Ему и не придаете Ему сотоварищей.',
    english: 'Verily, Allah is pleased with you that you worship Him and do not associate anything with Him.',
    source: 'Sahih Muslim, 1716',
    narrator: 'Muadh ibn Jabal (RA)',
  },
  {
    arabic: 'الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا',
    russian: 'Верующий для верующего подобен зданию, части которого укрепляют друг друга.',
    english: 'The believer to the believer is like a building, its parts supporting each other.',
    source: 'Sahih Al-Bukhari, 481',
    narrator: 'Abu Musa Al-Ashari (RA)',
  },
];

export default function DailyHadith() {
  const [hadith, setHadith] = useState(hadiths[0]);
  const [lang, setLang] = useState<'russian' | 'english'>('russian');
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    // Pick hadith based on day of year so it changes daily
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % hadiths.length;
    setDayIndex(index);
    setHadith(hadiths[index]);
  }, []);

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <section className="py-12 px-6 md:px-10" style={{ background: 'rgba(26,107,60,0.04)', borderTop: '0.5px solid rgba(201,168,76,0.15)', borderBottom: '0.5px solid rgba(201,168,76,0.15)' }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-xs tracking-widest mb-1" style={{ color: '#c9a84c', letterSpacing: '1.5px' }}>
              ХАДИС ДНЯ · حديث اليوم
            </p>
            <p className="text-xs" style={{ color: 'rgba(240,236,224,0.45)' }}>{today}</p>
          </div>
          {/* Language toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setLang('russian')}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: lang === 'russian' ? 'rgba(201,168,76,0.15)' : 'transparent',
                border: '0.5px solid rgba(201,168,76,0.3)',
                color: '#c9a84c',
              }}
            >
              Русский
            </button>
            <button
              onClick={() => setLang('english')}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{
                background: lang === 'english' ? 'rgba(201,168,76,0.15)' : 'transparent',
                border: '0.5px solid rgba(201,168,76,0.3)',
                color: '#c9a84c',
              }}
            >
              English
            </button>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6 md:p-8"
          style={{ background: '#131c2e', border: '0.5px solid rgba(201,168,76,0.2)' }}
        >
          {/* Arabic text */}
          <p
            className="text-2xl md:text-3xl leading-loose mb-6 text-center"
            style={{ fontFamily: "'Amiri', serif", color: '#c9a84c', direction: 'rtl' }}
          >
            {hadith.arabic}
          </p>

          {/* Divider */}
          <div style={{ height: '0.5px', background: 'rgba(201,168,76,0.15)', margin: '0 0 20px' }} />

          {/* Translation */}
          <p
            className="text-base text-center leading-relaxed mb-6"
            style={{ color: 'rgba(240,236,224,0.8)' }}
          >
            {hadith[lang]}
          </p>

          {/* Source */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: 'rgba(26,107,60,0.2)', border: '0.5px solid rgba(26,107,60,0.4)', color: '#4ade80' }}
            >
              {hadith.source}
            </span>
            <span className="text-xs" style={{ color: 'rgba(240,236,224,0.4)' }}>
              {hadith.narrator}
            </span>
          </div>
        </div>

        {/* Dots navigation (decorative, shows which hadith of week) */}
        <div className="flex justify-center gap-2 mt-4">
          {hadiths.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === dayIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === dayIndex ? '#c9a84c' : 'rgba(201,168,76,0.25)',
                transition: 'width 0.3s',
              }}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
