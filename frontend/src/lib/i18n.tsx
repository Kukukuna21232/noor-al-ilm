'use client';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { additionalTranslations } from './i18n-additional';

export type Locale = 'ar' | 'ru' | 'en' | 'es' | 'fr' | 'de' | 'tr' | 'ur' | 'bn' | 'id' | 'ms' | 'ha' | 'sw' | 'zh' | 'hi';

const translations: Record<Locale, Record<string, unknown>> = {
  ar: {
    nav: {
      home: 'الرئيسية', quran: 'تعلم القرآن', courses: 'الدورات',
      forum: 'المنتدى', media: 'المكتبة', askImam: 'اسأل الإمام',
      studio: 'الاستوديو', live: 'البث المباشر', dashboard: 'لوحة التحكم',
      admin: 'الإدارة', login: 'تسجيل الدخول', register: 'إنشاء حساب',
      logout: 'تسجيل الخروج', search: 'بحث',
    },
    home: {
      hero: {
        bismillah: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
        title: 'نور العلم',
        subtitle: 'المنصة التعليمية الإسلامية العالمية',
        description: 'تعلم القرآن الكريم، واستكشف العلوم الإسلامية، وتواصل مع المجتمع الإسلامي العالمي',
        cta: 'ابدأ رحلتك التعليمية',
        ctaSecondary: 'استكشف الدورات',
        stats: { students: 'طالب نشط', courses: 'دورة متاحة', teachers: 'معلم متخصص', countries: 'دولة' },
      },
      features: {
        title: 'لماذا نور العلم؟',
        quran: { title: 'تعلم القرآن', desc: 'دروس التجويد والحفظ مع معلمين متخصصين' },
        ai: { title: 'الإمام الذكي', desc: 'مساعد ذكاء اصطناعي متقدم للأسئلة الإسلامية' },
        community: { title: 'مجتمع عالمي', desc: 'تواصل مع المسلمين من ١٨٠+ دولة' },
        video: { title: 'فيديو تعليمي', desc: 'آلاف الفيديوهات التعليمية الإسلامية' },
        live: { title: 'بث مباشر', desc: 'دروس مباشرة مع العلماء والمشايخ' },
        multilingual: { title: 'متعدد اللغات', desc: 'محتوى بالعربية والروسية والإنجليزية' },
      },
      prayer: {
        title: 'مواقيت الصلاة',
        fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر',
        asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
        next: 'الصلاة التالية',
      },
      cta: { title: 'انضم إلى مجتمعنا اليوم', subtitle: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', btn: 'سجل مجاناً' },
    },
    auth: {
      login: 'تسجيل الدخول', register: 'إنشاء حساب جديد',
      email: 'البريد الإلكتروني', password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور', name: 'الاسم الكامل',
      forgotPassword: 'نسيت كلمة المرور؟', noAccount: 'ليس لديك حساب؟',
      hasAccount: 'لديك حساب بالفعل؟', verifyEmail: 'تحقق من بريدك الإلكتروني',
      resetPassword: 'إعادة تعيين كلمة المرور', twoFA: 'رمز التحقق الثنائي',
      rememberMe: 'تذكرني', orContinueWith: 'أو تابع باستخدام',
      signInWithGoogle: 'تسجيل الدخول بحساب جوجل',
      signInWithFacebook: 'تسجيل الدخول بحساب فيسبوك',
      createAccount: 'إنشاء حساب', alreadyHaveAccount: 'لديك حساب بالفعل؟',
      welcomeBack: 'مرحباً بعودتك', enterCredentials: 'أدخل بياناتك للدخول',
      createPassword: 'إنشاء كلمة مرور', agreeToTerms: 'موافق على الشروط والأحكام',
      privacyPolicy: 'سياسة الخصوصية', termsOfService: 'شروط الخدمة',
    },
    quran: {
      title: 'القرآن الكريم', subtitle: 'كتاب الله المبارك',
      selectSurah: 'اختر سورة', selectJuz: 'اختر جزءً', selectPage: 'اختر صفحة',
      reciter: 'القارئ', translation: 'الترجمة', tafsir: 'التفسير',
      play: 'تشغيل', pause: 'إيقاف', stop: 'إيقاف', repeat: 'تكرار',
      bookmark: 'إضافة علامة مرجعية', removeBookmark: 'إزالة العلامة المرجعية',
      shareAyah: 'مشاركة الآية', copyAyah: 'نسخ الآية', memorize: 'الحفظ',
      review: 'المراجعة', progress: 'التقدم', streak: 'السلسلة',
      dailyGoal: 'الهدف اليومي', weeklyGoal: 'الهدف الأسبوعي', monthlyGoal: 'الهدف الشهري',
      statistics: 'الإحصائيات', achievements: 'الإنجازات', leaderboard: 'لوحة الصدارة',
      challenges: 'التحديات', tajweedRules: 'قواعد التجويد', pronunciation: 'النطق',
      meaning: 'المعنى', context: 'السياق', relatedVerses: 'الآيات ذات الصلة',
      notes: 'الملاحظات', reflections: 'التأملات', prayers: 'الأدعية',
      dhikr: 'الذكر', tasbih: 'التسبيح', tajweed: 'أحكام التجويد',
      memorization: 'الحفظ والمراجعة', recitation: 'التلاوة والاستماع',
      lessons: 'الدروس', exercises: 'التمارين', surah: 'سورة', verse: 'آية', juz: 'جزء',
    },
    courses: {
      title: 'الدورات التعليمية', subtitle: 'تعلم الإسلام بشكل منهجي',
      allCourses: 'جميع الدورات', myCourses: 'دوراتي', featured: 'المميزة',
      new: 'جديدة', popular: 'شائعة', free: 'مجانية', premium: 'مميزة',
      enrolled: 'مسجل', completed: 'مكتمل', inProgress: 'قيد التقدم', notStarted: 'لم يبدأ',
      startLearning: 'بدء التعلم', continueLearning: 'متابعة التعلم',
      certificate: 'الشهادة', downloadCertificate: 'تحميل الشهادة', shareCertificate: 'مشاركة الشهادة',
      instructor: 'المدرب', duration: 'المدة', level: 'المستوى', category: 'الفئة',
      rating: 'التقييم', reviews: 'المراجعات', lessons: 'الدروس', exercises: 'التمارين',
      quizzes: 'الاختبارات', assignments: 'المهام', projects: 'المشاريع', resources: 'المصادر',
      discussion: 'النقاش', questions: 'الأسئلة', answers: 'الإجابات', announcements: 'الإعلانات',
      schedule: 'الجدول', calendar: 'التقويم', deadline: 'الموعد النهائي', submission: 'التقديم',
      grade: 'الدرجة', feedback: 'ملاحظات', all: 'جميع الدورات', arabic: 'تعلم العربية',
      history: 'التاريخ الإسلامي', quranStudies: 'علوم القرآن', culture: 'الثقافة الإسلامية',
      fiqh: 'الفقه الإسلامي', aqeedah: 'العقيدة', enroll: 'التسجيل في الدورة',
      progress: 'التقدم', students: 'الطلاب',
    },
    forum: {
      title: 'المنتدى', subtitle: 'تواصل مع المجتمع الإسلامي',
      newPost: 'موضوع جديد', newDiscussion: 'نقاش جديد', createPost: 'إنشاء موضوع',
      postTitle: 'عنوان الموضوع', postContent: 'محتوى الموضوع', postCategory: 'فئة الموضوع',
      postTags: 'وسوم الموضوع', publishPost: 'نشر الموضوع', saveDraft: 'حفظ المسودة',
      preview: 'معاينة', editPost: 'تعديل الموضوع', deletePost: 'حذف الموضوع',
      reply: 'رد', quote: 'اقتباس', mention: 'ذكر', react: 'تفاعل',
      follow: 'متابعة', unfollow: 'إلغاء المتابعة', block: 'حظر', report: 'إبلاغ',
      upvote: 'تصويت إيجابي', downvote: 'تصويت سلبي', trending: 'الأكثر تداولاً',
      recent: 'الأحدث', popular: 'الأكثر شعبية', unanswered: 'بدون إجابة',
      following: 'المتابَع', myPosts: 'مشاركاتي', myReplies: 'ردودي', bookmarks: 'الإشارات المرجعية',
      notifications: 'الإشعارات', messages: 'الرسائل', profile: 'الملف الشخصي',
      settings: 'الإعدادات', help: 'المساعدة', guidelines: 'الإرشادات',
      rules: 'القواعد', faq: 'الأسئلة الشائعة', like: 'إعجاب', categories: 'التصنيفات',
    },
    askImam: {
      title: 'اسأل الإمام', subtitle: 'مساعد ذكاء اصطناعي إسلامي متقدم',
      placeholder: 'اكتب سؤالك هنا...', send: 'إرسال',
      disclaimer: 'هذا المساعد للتوجيه التعليمي فقط. للفتاوى الشرعية، يرجى استشارة عالم متخصص.',
      categories: { prayer: 'الصلاة', quran: 'القرآن', hadith: 'الحديث', history: 'التاريخ', arabic: 'العربية', fiqh: 'الفقه', aqeedah: 'العقيدة', general: 'عام' },
    },
    common: {
      loading: 'جاري التحميل...', error: 'حدث خطأ', success: 'تم بنجاح',
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
      search: 'بحث', filter: 'تصفية', readMore: 'اقرأ المزيد',
      viewAll: 'عرض الكل', back: 'رجوع', next: 'التالي',
      previous: 'السابق', submit: 'إرسال', close: 'إغلاق',
      share: 'مشاركة', report: 'إبلاغ', bookmark: 'حفظ',
      like: 'إعجاب', dislike: 'عدم إعجاب', comment: 'تعليق',
      yes: 'نعم', no: 'لا', ok: 'موافق', retry: 'إعادة المحاولة',
      refresh: 'تحديث', download: 'تحميل', upload: 'رفع', copy: 'نسخ',
      move: 'نقل', rename: 'إعادة تسمية', select: 'اختيار', selectAll: 'تحديد الكل',
      clear: 'مسح', settings: 'الإعدادات', help: 'مساعدة', about: 'حول',
      contact: 'اتصال', feedback: 'ملاحظات', logout: 'تسجيل الخروج',
      profile: 'الملف الشخصي', account: 'الحساب', notifications: 'الإشعارات',
      messages: 'الرسائل', friends: 'الأصدقاء', groups: 'المجموعات',
      language: 'اللغة', theme: 'المظهر', darkMode: 'الوضع الليلي',
      lightMode: 'الوضع النهاري', autoMode: 'الوضع التلقائي',
    },
    errors: {
      networkError: 'خطأ في الشبكة', serverError: 'خطأ في الخادم', notFound: 'غير موجود',
      unauthorized: 'غير مصرح', forbidden: 'ممنوع', validationError: 'خطأ في التحقق',
      timeoutError: 'انتهت المهلة', unknownError: 'خطأ غير معروف', loginRequired: 'مطلوب تسجيل الدخول',
      permissionDenied: 'تم رفض الإذن', quotaExceeded: 'تجاوز الحصة', fileTooBig: 'الملف كبير جداً',
      invalidFormat: 'تنسيق غير صالح', emailExists: 'البريد الإلكتروني موجود بالفعل',
      userNotFound: 'المستخدم غير موجود', incorrectPassword: 'كلمة المرور غير صحيحة',
      accountLocked: 'الحساب مقفل', emailNotVerified: 'البريد الإلكتروني غير موثق',
      weakPassword: 'كلمة المرور ضعيفة جداً', passwordMismatch: 'كلمات المرور غير متطابقة',
      invalidEmail: 'البريد الإلكتروني غير صالح', requiredField: 'هذا الحقل مطلوب',
      invalidDate: 'التاريخ غير صالح', invalidNumber: 'الرقم غير صالح',
      invalidUrl: 'الرابط غير صالح', uploadFailed: 'فشل الرفع', downloadFailed: 'فشل التحميل',
      saveFailed: 'فشل الحفظ', deleteFailed: 'فشل الحذف', updateFailed: 'فشل التحديث',
      connectionLost: 'فقدان الاتصال', tryAgain: 'حاول مرة أخرى', contactSupport: 'اتصل بالدعم الفني',
    },
    success: {
      loginSuccessful: 'تم تسجيل الدخول بنجاح', registrationSuccessful: 'تم التسجيل بنجاح',
      profileUpdated: 'تم تحديث الملف الشخصي', passwordChanged: 'تم تغيير كلمة المرور',
      emailVerified: 'تم توثيق البريد الإلكتروني', postPublished: 'تم نشر الموضوع',
      commentPosted: 'تم نشر التعليق', fileUploaded: 'تم رفع الملف', settingsSaved: 'تم حفظ الإعدادات',
      courseEnrolled: 'تم التسجيل في الدورة', bookmarkAdded: 'تمت إضافة العلامة المرجعية',
      questionSubmitted: 'تم إرسال السؤال', answerPosted: 'تم نشر الإجابة', messageSent: 'تم إرسال الرسالة',
      paymentSuccessful: 'تمت عملية الدفع بنجاح', donationSuccessful: 'تم التبرع بنجاح',
      certificateEarned: 'تم الحصول على الشهادة', achievementUnlocked: 'تم فتح الإنجاز',
    },
    validation: {
      required: 'هذا الحقل مطلوب', email: 'البريد الإلكتروني غير صالح',
      password: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل',
      passwordStrong: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
      confirmPassword: 'كلمات المرور غير متطابقة', minLength: 'يجب أن يحتوي على {min} أحرف على الأقل',
      maxLength: 'يجب أن لا يتجاوز {max} حرفاً', min: 'يجب أن يكون {min} على الأقل',
      max: 'يجب أن لا يتجاوز {max}', numeric: 'يجب أن يكون رقماً',
      url: 'الرابط غير صالح', date: 'التاريخ غير صالح', time: 'الوقت غير صالح',
      phone: 'رقم الهاتف غير صالح', username: 'اسم المستخدم غير صالح',
      acceptTerms: 'يجب قبول الشروط والأحكام', ageRestriction: 'يجب أن تكون {age} عاماً على الأقل',
    },
  },
  es: {
    nav: {
      home: 'Inicio', quran: 'Aprender Corán', courses: 'Cursos',
      forum: 'Foro', media: 'Biblioteca', askImam: 'Preguntar al Imam',
      studio: 'Estudio', live: 'En Vivo', dashboard: 'Panel',
      admin: 'Administración', login: 'Iniciar Sesión', register: 'Registrarse',
      logout: 'Cerrar Sesión', search: 'Buscar',
    },
    home: {
      hero: {
        bismillah: 'En el nombre de Alá, el Clemente, el Misericordioso',
        title: 'Noor Al-Ilm',
        subtitle: 'Ecosistema Educativo Islámico Global',
        description: 'Aprende el Corán, explora las ciencias islámicas y conéctate con la comunidad musulmana global',
        cta: 'Comienza tu Aprendizaje',
        ctaSecondary: 'Explorar Cursos',
        stats: { students: 'estudiantes activos', courses: 'cursos disponibles', teachers: 'especialistas', countries: 'países' },
      },
      features: {
        title: '¿Por qué Noor Al-Ilm?',
        quran: { title: 'Aprender Corán', desc: 'Lecciones de tayywid e hifz con maestros especializados' },
        ai: { title: 'Imam IA', desc: 'Asistente de IA avanzado para preguntas islámicas' },
        community: { title: 'Comunidad Global', desc: 'Conecta con musulmanes de 180+ países' },
        video: { title: 'Video Educativo', desc: 'Miles de videos educativos islámicos' },
        live: { title: 'Transmisión en Vivo', desc: 'Clases en vivo con eruditos y sheijs' },
        multilingual: { title: 'Multiidioma', desc: 'Contenido en árabe, español, inglés y más' },
      },
      prayer: {
        title: 'Tiempos de Oración',
        fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr',
        asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
        next: 'Próxima Oración',
      },
      cta: { title: 'Únete a Nuestra Comunidad Hoy', subtitle: 'Señor, aumenta mi conocimiento', btn: 'Regístrate Gratis' },
    },
    auth: {
      login: 'Iniciar Sesión', register: 'Crear Cuenta',
      email: 'Correo Electrónico', password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña', name: 'Nombre Completo',
      forgotPassword: '¿Olvidaste tu contraseña?', noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?', verifyEmail: 'Verifica tu correo',
      resetPassword: 'Restablecer Contraseña', twoFA: 'Código de 2FA',
    },
    common: {
      loading: 'Cargando...', error: 'Ocurrió un error', success: 'Éxito',
      save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      search: 'Buscar', filter: 'Filtrar', readMore: 'Leer Más',
      viewAll: 'Ver Todo', back: 'Atrás', next: 'Siguiente',
      previous: 'Anterior', submit: 'Enviar', close: 'Cerrar',
      share: 'Compartir', report: 'Reportar', bookmark: 'Guardar',
      like: 'Me Gusta', dislike: 'No me Gusta', comment: 'Comentario',
    },
  },
  fr: {
    nav: {
      home: 'Accueil', quran: 'Apprendre le Coran', courses: 'Cours',
      forum: 'Forum', media: 'Bibliothèque', askImam: 'Demander à l\'Imam',
      studio: 'Studio', live: 'Direct', dashboard: 'Tableau de Bord',
      admin: 'Administration', login: 'Connexion', register: 'S\'inscrire',
      logout: 'Déconnexion', search: 'Rechercher',
    },
    home: {
      hero: {
        bismillah: 'Au nom d\'Allah, le Très Miséricordieux, le Tout Miséricordieux',
        title: 'Noor Al-Ilm',
        subtitle: 'Écosystème Éducatif Islamique Mondial',
        description: 'Apprenez le Coran, explorez les sciences islamiques et connectez-vous avec la communauté musulmane mondiale',
        cta: 'Commencer l\'Apprentissage',
        ctaSecondary: 'Explorer les Cours',
        stats: { students: 'étudiants actifs', courses: 'cours disponibles', teachers: 'spécialistes', countries: 'pays' },
      },
      features: {
        title: 'Pourquoi Noor Al-Ilm?',
        quran: { title: 'Apprendre le Coran', desc: 'Leçons de tajwid et hifz avec des enseignants spécialisés' },
        ai: { title: 'Imam IA', desc: 'Assistant IA avancé pour les questions islamiques' },
        community: { title: 'Communauté Mondiale', desc: 'Connectez-vous avec des musulmans de 180+ pays' },
        video: { title: 'Vidéo Éducative', desc: 'Des milliers de vidéos éducatives islamiques' },
        live: { title: 'Diffusion en Direct', desc: 'Classes en direct avec des savants et cheikhs' },
        multilingual: { title: 'Multilingue', desc: 'Contenu en arabe, français, anglais et plus' },
      },
      prayer: {
        title: 'Heures de Prière',
        fajr: 'Fajr', sunrise: 'Aube', dhuhr: 'Dhuhr',
        asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
        next: 'Prochaine Prière',
      },
      cta: { title: 'Rejoignez Notre Communauté Aujourd\'hui', subtitle: 'Seigneur, augmente mes connaissances', btn: 'S\'inscrire Gratuitement' },
    },
    auth: {
      login: 'Connexion', register: 'Créer un Compte',
      email: 'Email', password: 'Mot de Passe',
      confirmPassword: 'Confirmer le Mot de Passe', name: 'Nom Complet',
      forgotPassword: 'Mot de passe oublié?', noAccount: 'Pas de compte?',
      hasAccount: 'Déjà un compte?', verifyEmail: 'Vérifiez votre email',
      resetPassword: 'Réinitialiser le Mot de Passe', twoFA: 'Code 2FA',
    },
    common: {
      loading: 'Chargement...', error: 'Une erreur est survenue', success: 'Succès',
      save: 'Sauvegarder', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
      search: 'Rechercher', filter: 'Filtrer', readMore: 'Lire Plus',
      viewAll: 'Voir Tout', back: 'Retour', next: 'Suivant',
      previous: 'Précédent', submit: 'Envoyer', close: 'Fermer',
      share: 'Partager', report: 'Signaler', bookmark: 'Sauvegarder',
      like: 'J\'aime', dislike: 'Je n\'aime pas', comment: 'Commentaire',
    },
  },
  de: {
    nav: {
      home: 'Startseite', quran: 'Koran Lernen', courses: 'Kurse',
      forum: 'Forum', media: 'Bibliothek', askImam: 'Imam Fragen',
      studio: 'Studio', live: 'Live', dashboard: 'Dashboard',
      admin: 'Administration', login: 'Anmelden', register: 'Registrieren',
      logout: 'Abmelden', search: 'Suchen',
    },
    home: {
      hero: {
        bismillah: 'Im Namen Allahs, des Allerbarmers, des Barmherzigen',
        title: 'Noor Al-Ilm',
        subtitle: 'Globales Islamisches Bildungsökosystem',
        description: 'Lernen Sie den Koran, erforschen Sie islamische Wissenschaften und verbinden Sie sich mit der globalen muslimischen Gemeinschaft',
        cta: 'Lernen Beginnen',
        ctaSecondary: 'Kurse Entdecken',
        stats: { students: 'aktive Studenten', courses: 'verfügbare Kurse', teachers: 'Spezialisten', countries: 'Länder' },
      },
      features: {
        title: 'Warum Noor Al-Ilm?',
        quran: { title: 'Koran Lernen', desc: 'Tadschwid- und Hifz-Unterricht mit spezialisierten Lehrern' },
        ai: { title: 'KI-Imam', desc: 'Fortschrittter KI-Assistent für islamische Fragen' },
        community: { title: 'Globale Gemeinschaft', desc: 'Verbinden Sie sich mit Muslimen aus 180+ Ländern' },
        video: { title: 'Bildungsvideo', desc: 'Tausende islamische Bildungs-Videos' },
        live: { title: 'Live-Übertragung', desc: 'Live-Unterricht mit Gelehrten und Scheichs' },
        multilingual: { title: 'Mehrsprachig', desc: 'Inhalte auf Arabisch, Deutsch, Englisch und mehr' },
      },
      prayer: {
        title: 'Gebetszeiten',
        fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Dhuhr',
        asr: 'Asr', maghrib: 'Maghrib', isha: 'Ischa',
        next: 'Nächstes Gebet',
      },
      cta: { title: 'Treten Sie Unserer Gemeinschaft Heute Bei', subtitle: 'Herr, vermehre mein Wissen', btn: 'Kostenlos Registrieren' },
    },
    auth: {
      login: 'Anmelden', register: 'Konto Erstellen',
      email: 'E-Mail', password: 'Passwort',
      confirmPassword: 'Passwort Bestätigen', name: 'Vollständiger Name',
      forgotPassword: 'Passwort Vergessen?', noAccount: 'Kein Konto?',
      hasAccount: 'Bereits Konto?', verifyEmail: 'E-Mail Verifizieren',
      resetPassword: 'Passwort Zurücksetzen', twoFA: '2FA-Code',
    },
    common: {
      loading: 'Laden...', error: 'Ein Fehler ist aufgetreten', success: 'Erfolg',
      save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten',
      search: 'Suchen', filter: 'Filtern', readMore: 'Mehr Lesen',
      viewAll: 'Alle Anzeigen', back: 'Zurück', next: 'Nächste',
      previous: 'Vorherige', submit: 'Senden', close: 'Schließen',
      share: 'Teilen', report: 'Melden', bookmark: 'Speichern',
      like: 'Gefällt Mir', dislike: 'Gefällt Mir Nicht', comment: 'Kommentar',
    },
  },
  tr: {
    nav: {
      home: 'Ana Sayfa', quran: 'Kuran Öğren', courses: 'Kurslar',
      forum: 'Forum', media: 'Kütüphane', askImam: 'İmama Sor',
      studio: 'Stüdyo', live: 'Canlı', dashboard: 'Panel',
      admin: 'Yönetim', login: 'Giriş', register: 'Kayıt',
      logout: 'Çıkış', search: 'Ara',
    },
    home: {
      hero: {
        bismillah: 'Rahman ve Rahim olan Allah\'ın adıyla',
        title: 'Noor Al-Ilm',
        subtitle: 'Küresel İslami Eğitim Ekosistemi',
        description: 'Kuran\'ı öğrenin, İslami ilimleri keşfedin ve küresel Müslüman topluluğuyla bağlantı kurun',
        cta: 'Öğrenmeye Başla',
        ctaSecondary: 'Kursları Keşfet',
        stats: { students: 'aktif öğrenci', courses: 'mevcut kurs', teachers: 'uzman', countries: 'ülke' },
      },
      features: {
        title: 'Neden Noor Al-Ilm?',
        quran: { title: 'Kuran Öğrenme', desc: 'Uzman öğretmenlerle tecvid ve hıfz dersleri' },
        ai: { title: 'Yapay Zeka İmam', desc: 'İslami sorular için gelişmiş yapay zeka asistanı' },
        community: { title: 'Küresel Topluluk', desc: '180+ ülkeden Müslümanlarla bağlantı kurun' },
        video: { title: 'Eğitim Videosu', desc: 'Binlerce İslami eğitim videosu' },
        live: { title: 'Canlı Yayın', desc: 'Alimler ve şeyhlerle canlı dersler' },
        multilingual: { title: 'Çok Dilli', desc: 'Arapça, Türkçe, İngilizce ve daha fazlasında içerik' },
      },
      prayer: {
        title: 'Namaz Vakitleri',
        fajr: 'İmsak', sunrise: 'Güneş', dhuhr: 'Öğle',
        asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı',
        next: 'Sonraki Namaz',
      },
      cta: { title: 'Bugün Topluluğumuza Katılın', subtitle: 'Rabbim, ilmiimi artır', btn: 'Ücretsiz Kayıt' },
    },
    auth: {
      login: 'Giriş Yap', register: 'Hesap Oluştur',
      email: 'E-posta', password: 'Şifre',
      confirmPassword: 'Şifre Tekrarı', name: 'Tam Ad',
      forgotPassword: 'Şifremi Unuttum?', noAccount: 'Hesabınız Yok Mu?',
      hasAccount: 'Zaten Hesabınız Var?', verifyEmail: 'E-posta Doğrula',
      resetPassword: 'Şifre Sıfırla', twoFA: 'İki Faktörlü Kod',
    },
    common: {
      loading: 'Yükleniyor...', error: 'Bir hata oluştu', success: 'Başarılı',
      save: 'Kaydet', cancel: 'İptal', delete: 'Sil', edit: 'Düzenle',
      search: 'Ara', filter: 'Filtrele', readMore: 'Daha Fazla Oku',
      viewAll: 'Tümünü Gör', back: 'Geri', next: 'Sonraki',
      previous: 'Önceki', submit: 'Gönder', close: 'Kapat',
      share: 'Paylaş', report: 'Rapor Et', bookmark: 'Kaydet',
      like: 'Beğen', dislike: 'Beğenme', comment: 'Yorum',
    },
  },
  ur: {
    nav: {
      home: 'مرکزی صفحہ', quran: 'قرآن سیکھیں', courses: 'کورسز',
      forum: 'فورم', media: 'لائبریری', askImam: 'امام سے پوچھیں',
      studio: 'اسٹوڈیو', live: 'لائیو', dashboard: 'ڈیش بورڈ',
      admin: 'انتظامیہ', login: 'لاگ ان', register: 'رجسٹر',
      logout: 'لاگ آؤٹ', search: 'تلاش کریں',
    },
    home: {
      hero: {
        bismillah: 'اللہ کے نام سے جو بہت مہربان اور رحیم ہے',
        title: 'نور العلم',
        subtitle: 'عالمی اسلامی تعلیمی نظام',
        description: 'قرآن پڑھیں، اسلامی علوم کی تلاش کریں اور عالمی مسلمان برادری سے رابطہ کریں',
        cta: 'تعلیم شروع کریں',
        ctaSecondary: 'کورسز دیکھیں',
        stats: { students: 'فعال طلبا', courses: ' دستیاب کورسز', teachers: 'ماہرین', countries: 'ممالک' },
      },
      features: {
        title: 'کوئیں نور العلم؟',
        quran: { title: 'قرآن سیکھنا', desc: 'ماہرین اساتذہ کے ساتھ تجوید اور حفظ کی درسیں' },
        ai: { title: 'ای آئی امام', desc: 'اسلامی سوالات کے لیے پیش رفتہ ای آئی اسسٹنٹ' },
        community: { title: 'عالمی برادری', desc: '180+ ممالک کے مسلمانوں سے رابطہ کریں' },
        video: { title: 'تعلیمی ویڈیو', desc: 'ہزاروں اسلامی تعلیمی ویڈیوز' },
        live: { title: 'لائیو براڈکاسٹ', desc: 'علماء اور شیوخ کے ساتھ لائیو کلاسز' },
        multilingual: { title: 'متعدد زبانیں', desc: 'عربی، اردو، انگریزی اور دیگر زبانوں میں مواد' },
      },
      prayer: {
        title: 'نماز کے اوقات',
        fajr: 'فجر', sunrise: 'طلوع آفتاب', dhuhr: 'ظہر',
        asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء',
        next: 'اگلی نماز',
      },
      cta: { title: 'آج ہماری برادری میں شامل ہوں', subtitle: 'اے میرے رب، میری علم میں اضافہ فرما', btn: 'مفت رجسٹر کریں' },
    },
    auth: {
      login: 'لاگ ان', register: 'اکاؤنٹ بنائیں',
      email: 'ای میل', password: 'پاس ورڈ',
      confirmPassword: 'پاس ورڈ تصدیق کریں', name: 'پورا نام',
      forgotPassword: 'پاس ورڈ بھول گے؟', noAccount: 'اکاؤنٹ نہیں ہے؟',
      hasAccount: 'پہلے سے اکاؤنٹ ہے؟', verifyEmail: 'اپنا ای میل تصدیق کریں',
      resetPassword: 'پاس ورڈ ری سیٹ کریں', twoFA: 'دو عنصر کا کوڈ',
    },
    common: {
      loading: 'لوڈ ہو رہا ہے...', error: 'ایک خرابی ہوئی', success: 'کامیابی',
      save: 'محفوظ کریں', cancel: 'منسوخ کریں', delete: 'حذف کریں', edit: 'ترمیم کریں',
      search: 'تلاش کریں', filter: 'فلٹر کریں', readMore: 'مزید پڑھیں',
      viewAll: 'تمام دیکھیں', back: 'پیچھے', next: 'اگلا',
      previous: 'پچھلا', submit: 'جمع کروائیں', close: 'بند کریں',
      share: 'شیئر کریں', report: 'رپورٹ کریں', bookmark: 'محفوظ کریں',
      like: 'پسند کریں', dislike: 'ناپسند کریں', comment: 'تبصرہ',
    },
  },
  ru: {
    nav: {
      home: 'Главная', quran: 'Изучение Корана', courses: 'Курсы',
      forum: 'Форум', media: 'Библиотека', askImam: 'Спросить Имама',
      studio: 'Студия', live: 'Прямой эфир', dashboard: 'Панель управления',
      admin: 'Администрация', login: 'Войти', register: 'Регистрация',
      logout: 'Выйти', search: 'Поиск',
    },
    home: {
      hero: {
        bismillah: 'Бисмиллях ир-рахман ир-рахим',
        title: 'Нур аль-Ильм',
        subtitle: 'Глобальная исламская образовательная платформа',
        description: 'Изучайте Коран, исследуйте исламские науки и общайтесь с мировым мусульманским сообществом',
        cta: 'Начать обучение',
        ctaSecondary: 'Просмотреть курсы',
        stats: { students: 'активных студентов', courses: 'доступных курсов', teachers: 'специалистов', countries: 'стран' },
      },
      features: {
        title: 'Почему Нур аль-Ильм?',
        quran: { title: 'Изучение Корана', desc: 'Уроки таджвида и хифза с опытными преподавателями' },
        ai: { title: 'ИИ-Имам', desc: 'Продвинутый ИИ-помощник для исламских вопросов' },
        community: { title: 'Глобальное сообщество', desc: 'Общайтесь с мусульманами из 180+ стран' },
        video: { title: 'Образовательное видео', desc: 'Тысячи исламских образовательных видео' },
        live: { title: 'Прямой эфир', desc: 'Живые уроки с учёными и шейхами' },
        multilingual: { title: 'Многоязычность', desc: 'Контент на арабском, русском и английском' },
      },
      prayer: {
        title: 'Время намаза',
        fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр',
        asr: 'Аср', maghrib: 'Магриб', isha: 'Иша',
        next: 'Следующий намаз',
      },
      cta: { title: 'Присоединяйтесь к нашему сообществу', subtitle: 'Господи, прибавь мне знания', btn: 'Зарегистрироваться бесплатно' },
    },
    auth: {
      login: 'Войти', register: 'Создать аккаунт',
      email: 'Электронная почта', password: 'Пароль',
      confirmPassword: 'Подтвердите пароль', name: 'Полное имя',
      forgotPassword: 'Забыли пароль?', noAccount: 'Нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?', verifyEmail: 'Подтвердите email',
      resetPassword: 'Сбросить пароль', twoFA: 'Код двухфакторной аутентификации',
      rememberMe: 'Запомнить меня', orContinueWith: 'Или продолжить с',
      signInWithGoogle: 'Войти через Google',
      signInWithFacebook: 'Войти через Facebook',
      createAccount: 'Создать аккаунт', alreadyHaveAccount: 'Уже есть аккаунт?',
      welcomeBack: 'Добро пожаловать', enterCredentials: 'Введите данные для входа',
      createPassword: 'Создать пароль', agreeToTerms: 'Согласен с условиями',
      privacyPolicy: 'Политика конфиденциальности', termsOfService: 'Условия использования',
    },
    quran: {
      title: 'Коран', subtitle: 'Священная книга Аллаха',
      selectSurah: 'Выберите суру', selectJuz: 'Выберите джуз', selectPage: 'Выберите страницу',
      reciter: 'Чтец', translation: 'Перевод', tafsir: 'Тафсир',
      play: 'Воспроизвести', pause: 'Пауза', stop: 'Стоп', repeat: 'Повторить',
      bookmark: 'Добавить закладку', removeBookmark: 'Удалить закладку',
      shareAyah: 'Поделиться аятом', copyAyah: 'Копировать аят', memorize: 'Запомнить',
      review: 'Повторение', progress: 'Прогресс', streak: 'Серия',
      dailyGoal: 'Дневная цель', weeklyGoal: 'Недельная цель', monthlyGoal: 'Месячная цель',
      statistics: 'Статистика', achievements: 'Достижения', leaderboard: 'Таблица лидеров',
      challenges: 'Вызовы', tajweedRules: 'Правила таджвида', pronunciation: 'Произношение',
      meaning: 'Значение', context: 'Контекст', relatedVerses: 'Связанные аяты',
      notes: 'Заметки', reflections: 'Размышления', prayers: 'Молитвы',
      dhikr: 'Зикр', tasbih: 'Тасбих',
    },
    courses: {
      title: 'Образовательные курсы', subtitle: 'Систематическое изучение ислама',
      allCourses: 'Все курсы', myCourses: 'Мои курсы', featured: 'Рекомендуемые',
      new: 'Новые', popular: 'Популярные', free: 'Бесплатные', premium: 'Платные',
      enrolled: 'Записан', completed: 'Завершён', inProgress: 'В процессе', notStarted: 'Не начат',
      startLearning: 'Начать обучение', continueLearning: 'Продолжить обучение',
      certificate: 'Сертификат', downloadCertificate: 'Скачать сертификат', shareCertificate: 'Поделиться сертификатом',
      instructor: 'Преподаватель', duration: 'Продолжительность', level: 'Уровень', category: 'Категория',
      rating: 'Рейтинг', reviews: 'Отзывы', lessons: 'Уроки', exercises: 'Упражнения',
      quizzes: 'Тесты', assignments: 'Задания', projects: 'Проекты', resources: 'Ресурсы',
      discussion: 'Обсуждение', questions: 'Вопросы', answers: 'Ответы', announcements: 'Объявления',
      schedule: 'Расписание', calendar: 'Календарь', deadline: 'Крайний срок', submission: 'Отправка',
      grade: 'Оценка', feedback: 'Обратная связь',
    },
    forum: {
      title: 'Форум', subtitle: 'Общение с исламским сообществом',
      newPost: 'Новая тема', newDiscussion: 'Новое обсуждение', createPost: 'Создать тему',
      postTitle: 'Заголовок темы', postContent: 'Содержание темы', postCategory: 'Категория темы',
      postTags: 'Теги темы', publishPost: 'Опубликовать тему', saveDraft: 'Сохранить черновик',
      preview: 'Предпросмотр', editPost: 'Редактировать тему', deletePost: 'Удалить тему',
      reply: 'Ответить', quote: 'Цитировать', mention: 'Упомянуть', react: 'Реакция',
      follow: 'Подписаться', unfollow: 'Отписаться', block: 'Заблокировать', report: 'Пожаловаться',
      upvote: 'Положительная оценка', downvote: 'Отрицательная оценка', trending: 'В тренде',
      recent: 'Недавние', popular: 'Популярные', unanswered: 'Без ответа',
      following: 'Подписки', myPosts: 'Мои темы', myReplies: 'Мои ответы', bookmarks: 'Закладки',
      notifications: 'Уведомления', messages: 'Сообщения', profile: 'Профиль',
      settings: 'Настройки', help: 'Помощь', guidelines: 'Руководство',
      rules: 'Правила', faq: 'Частые вопросы',
    },
    askImam: {
      title: 'Спросить Имама', subtitle: 'Получите надёжные исламские ответы',
      askQuestion: 'Задать вопрос', questionTitle: 'Заголовок вопроса',
      questionDetails: 'Подробности вопроса', questionCategory: 'Категория вопроса',
      submitQuestion: 'Отправить вопрос', recentQuestions: 'Недавние вопросы',
      popularQuestions: 'Популярные вопросы', myQuestions: 'Мои вопросы',
      answered: 'Отвечен', pending: 'В ожидании', rejected: 'Отклонён',
      answer: 'Ответ', answers: 'Ответы', bestAnswer: 'Лучший ответ',
      helpful: 'Полезно', notHelpful: 'Бесполезно', followUp: 'Дополнительный вопрос',
      relatedQuestions: 'Связанные вопросы',
      categories: {
        prayer: 'Молитва', quran: 'Коран', hadith: 'Хадис', fiqh: 'Фикх',
        aqeedah: 'Акыда', seerah: 'Сира', family: 'Семья', business: 'Бизнес',
        ethics: 'Этика', general: 'Общее'
      }
    },
    common: {
      loading: 'Загрузка...', error: 'Произошла ошибка', success: 'Успешно',
      save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Редактировать',
      search: 'Поиск', filter: 'Фильтр', readMore: 'Читать далее',
      viewAll: 'Показать все', back: 'Назад', next: 'Далее',
      previous: 'Предыдущий', submit: 'Отправить', close: 'Закрыть',
      share: 'Поделиться', report: 'Пожаловаться', bookmark: 'Сохранить',
      like: 'Нравится', dislike: 'Не нравится', comment: 'Комментарий',
      yes: 'Да', no: 'Нет', ok: 'ОК', retry: 'Повторить',
      refresh: 'Обновить', download: 'Скачать', upload: 'Загрузить', copy: 'Копировать',
      move: 'Переместить', rename: 'Переименовать', select: 'Выбрать', selectAll: 'Выбрать всё',
      clear: 'Очистить', settings: 'Настройки', help: 'Помощь', about: 'О проекте',
      contact: 'Контакт', feedback: 'Обратная связь', logout: 'Выйти',
      profile: 'Профиль', account: 'Аккаунт', notifications: 'Уведомления',
      messages: 'Сообщения', friends: 'Друзья', groups: 'Группы',
      language: 'Язык', theme: 'Тема', darkMode: 'Тёмный режим',
      lightMode: 'Светлый режим', autoMode: 'Автоматический режим',
    },
    errors: {
      networkError: 'Ошибка сети', serverError: 'Ошибка сервера', notFound: 'Не найдено',
      unauthorized: 'Не авторизован', forbidden: 'Запрещено', validationError: 'Ошибка валидации',
      timeoutError: 'Время ожидания истекло', unknownError: 'Неизвестная ошибка', loginRequired: 'Требуется вход',
      permissionDenied: 'Доступ запрещён', quotaExceeded: 'Квота превышена', fileTooBig: 'Файл слишком большой',
      invalidFormat: 'Неверный формат', emailExists: 'Email уже существует',
      userNotFound: 'Пользователь не найден', incorrectPassword: 'Неверный пароль',
      accountLocked: 'Аккаунт заблокирован', emailNotVerified: 'Email не подтверждён',
      weakPassword: 'Слишком слабый пароль', passwordMismatch: 'Пароли не совпадают',
      invalidEmail: 'Неверный email', requiredField: 'Это поле обязательно',
      invalidDate: 'Неверная дата', invalidNumber: 'Неверный номер',
      invalidUrl: 'Неверный URL', uploadFailed: 'Загрузка не удалась', downloadFailed: 'Скачивание не удалось',
      saveFailed: 'Сохранение не удалось', deleteFailed: 'Удаление не удалось', updateFailed: 'Обновление не удалось',
      connectionLost: 'Соединение потеряно', tryAgain: 'Попробуйте снова', contactSupport: 'Свяжитесь с поддержкой',
    },
    success: {
      loginSuccessful: 'Вход выполнен успешно', registrationSuccessful: 'Регистрация успешна',
      profileUpdated: 'Профиль обновлён', passwordChanged: 'Пароль изменён',
      emailVerified: 'Email подтверждён', postPublished: 'Тема опубликована',
      commentPosted: 'Комментарий опубликован', fileUploaded: 'Файл загружен', settingsSaved: 'Настройки сохранены',
      courseEnrolled: 'Запись на курс выполнена', bookmarkAdded: 'Закладка добавлена',
      questionSubmitted: 'Вопрос отправлен', answerPosted: 'Ответ опубликован', messageSent: 'Сообщение отправлено',
      paymentSuccessful: 'Платёж успешен', donationSuccessful: 'Пожертвование успешно',
      certificateEarned: 'Сертификат получен', achievementUnlocked: 'Достижение разблокировано',
    },
    validation: {
      required: 'Это поле обязательно', email: 'Неверный email',
      password: 'Пароль должен содержать минимум 8 символов',
      passwordStrong: 'Пароль должен содержать заглавные, строчные буквы, цифры и символы',
      confirmPassword: 'Пароли не совпадают', minLength: 'Минимум {min} символов',
      maxLength: 'Максимум {max} символов', min: 'Минимум {min}',
      max: 'Максимум {max}', numeric: 'Должно быть числом',
      url: 'Неверный URL', date: 'Неверная дата', time: 'Неверное время',
      phone: 'Неверный номер телефона', username: 'Неверное имя пользователя',
      acceptTerms: 'Необходимо принять условия', ageRestriction: 'Вам должно быть минимум {age} лет',
    },
  },
  en: {
    nav: {
      home: 'Home', quran: 'Learn Quran', courses: 'Courses',
      forum: 'Forum', media: 'Library', askImam: 'Ask Imam',
      studio: 'Studio', live: 'Live', dashboard: 'Dashboard',
      admin: 'Admin', login: 'Login', register: 'Register',
      logout: 'Logout', search: 'Search',
    },
    home: {
      hero: {
        bismillah: 'In the name of Allah, the Most Gracious, the Most Merciful',
        title: 'Noor Al-Ilm',
        subtitle: 'Global Islamic Educational Ecosystem',
        description: 'Learn Quran, explore Islamic sciences, and connect with the global Muslim community',
        cta: 'Start Learning',
        ctaSecondary: 'Explore Courses',
        stats: { students: 'active students', courses: 'available courses', teachers: 'specialists', countries: 'countries' },
      },
      cta: { title: 'Join Our Community Today', subtitle: 'My Lord, increase me in knowledge', btn: 'Register Free' },
    },
    auth: {
      login: 'Login', register: 'Create Account',
      email: 'Email', password: 'Password',
      confirmPassword: 'Confirm Password', name: 'Full Name',
      forgotPassword: 'Forgot password?', noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?', verifyEmail: 'Verify your email',
      resetPassword: 'Reset Password', twoFA: 'Two-Factor Code',
    },
    common: {
      loading: 'Loading...', error: 'An error occurred', success: 'Success',
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      search: 'Search', filter: 'Filter', readMore: 'Read More',
      viewAll: 'View All', back: 'Back', next: 'Next',
      previous: 'Previous', submit: 'Submit', close: 'Close',
      share: 'Share', report: 'Report', bookmark: 'Bookmark',
      like: 'Like', dislike: 'Dislike', comment: 'Comment',
    },
  },
  ...additionalTranslations,
};

interface I18nContextType {
  locale: Locale;
  t: (key: string, fallback?: string) => string;
  setLocale: (locale: Locale) => void;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('noor-locale') as Locale;
    if (saved && ['ar', 'ru', 'en', 'es', 'fr', 'de', 'tr', 'ur', 'bn', 'id', 'ms', 'ha', 'sw', 'zh', 'hi'].includes(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' || saved === 'ur' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' || newLocale === 'ur' ? 'rtl' : 'ltr';
    localStorage.setItem('noor-locale', newLocale);
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') value = (value as Record<string, unknown>)[k];
      else return fallback || key;
    }
    return typeof value === 'string' ? value : (fallback || key);
  }, [locale]);

  const dir = locale === 'ar' || locale === 'ur' ? 'rtl' : 'ltr';

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, dir, isRTL: dir === 'rtl' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
