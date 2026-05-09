require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../../../shared/database');

async function seed() {
  try {
    console.log('Seeding Noor Al-Ilm database...');

    // ── Admin user ────────────────────────────────────────
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@NoorIlm2024', 12);
    await query(`
      INSERT INTO users (name, name_ar, email, password_hash, role, is_verified)
      VALUES ($1,$2,$3,$4,'superadmin',true)
      ON CONFLICT (email) DO NOTHING
    `, ['System Administrator', 'مدير النظام', process.env.ADMIN_EMAIL || 'admin@noor-al-ilm.com', adminHash]);

    // ── Demo teacher ──────────────────────────────────────
    const teacherHash = await bcrypt.hash('Teacher@123', 12);
    const teacherRes = await query(`
      INSERT INTO users (name, name_ar, email, password_hash, role, is_verified)
      VALUES ($1,$2,$3,$4,'teacher',true)
      ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id
    `, ['Sheikh Ahmad Muhammad', 'الشيخ أحمد محمد', 'teacher@noor-al-ilm.com', teacherHash]);

    const teacherId = teacherRes.rows[0]?.id;

    // ── Forum categories ──────────────────────────────────
    const categories = [
      ['القرآن الكريم', 'Коран', 'quran', '#16a34a'],
      ['الفقه الإسلامي', 'Исламское право', 'fiqh', '#2563eb'],
      ['اللغة العربية', 'Арабский язык', 'arabic', '#d97706'],
      ['التاريخ الإسلامي', 'История ислама', 'history', '#7c3aed'],
      ['العقيدة', 'Акыда', 'aqeedah', '#dc2626'],
      ['عام', 'Общее', 'general', '#6b7280'],
    ];
    for (const [name, name_ru, slug, color] of categories) {
      await query(`INSERT INTO forum_categories (name, name_ru, slug, color) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING`,
        [name, name_ru, slug, color]);
    }

    // ── Sample courses ────────────────────────────────────
    if (teacherId) {
      const courses = [
        ['أحكام التجويد للمبتدئين', 'Правила таджвида', 'quranStudies', 'beginner', 0],
        ['اللغة العربية من الصفر', 'Арабский с нуля', 'arabic', 'beginner', 0],
        ['التاريخ الإسلامي الشامل', 'История ислама', 'history', 'intermediate', 49],
        ['حفظ القرآن الكريم', 'Хифз Корана', 'quranStudies', 'all', 0],
        ['الفقه الإسلامي الميسر', 'Основы фикха', 'fiqh', 'beginner', 29],
      ];
      for (const [title, title_ru, category, level, price] of courses) {
        await query(`
          INSERT INTO courses (title, title_ru, category, level, instructor_id, price, is_published)
          VALUES ($1,$2,$3,$4,$5,$6,true) ON CONFLICT DO NOTHING
        `, [title, title_ru, category, level, teacherId, price]);
      }
    }

    // ── Islamic events ────────────────────────────────────
    const events = [
      ['رمضان المبارك', 'Ramadan', 'Рамадан', 9, 1],
      ['عيد الفطر', 'Eid Al-Fitr', 'Ид аль-Фитр', 10, 1],
      ['عيد الأضحى', 'Eid Al-Adha', 'Ид аль-Адха', 12, 10],
      ['المولد النبوي', 'Prophet Birthday', 'День рождения Пророка', 3, 12],
      ['ليلة القدر', 'Laylat Al-Qadr', 'Ночь Предопределения', 9, 27],
    ];
    for (const [name_ar, name_en, name_ru, month, day] of events) {
      await query(`INSERT INTO islamic_events (name_ar, name_en, name_ru, hijri_month, hijri_day) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [name_ar, name_en, name_ru, month, day]);
    }

    console.log('✅ Database seeded successfully');
    console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@noor-al-ilm.com'} / ${process.env.ADMIN_PASSWORD || 'Admin@NoorIlm2024'}`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
