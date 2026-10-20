/**
 * WhatsApp Clinical Communication Helpers
 * Formats phone numbers, sanitizes international codes, and generates
 * rich clinical message templates for appointments, prescriptions, and post-session notes.
 */

export function sanitizePhoneNumber(phone: string, defaultCountryCode = '20'): string {
  if (!phone) return '';
  // Remove all non-digits except a leading +
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    // Egyptian mobile standard (010..., 011..., 012..., 015...)
    cleaned = defaultCountryCode + cleaned.substring(1);
  } else if (cleaned.startsWith('05') && cleaned.length === 10) {
    // Saudi / Gulf standard
    cleaned = '966' + cleaned.substring(1);
  }

  return cleaned.replace(/\D/g, '');
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}

export function openWhatsAppDirect(phone: string, message: string): boolean {
  const clean = sanitizePhoneNumber(phone);
  if (!clean) return false;
  const url = buildWhatsAppLink(clean, message);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Template: Appointment Confirmation / تذكير بالموعد
 */
export function templateAppointment(data: {
  clinicName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName?: string;
  serviceName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}): string {
  const { clinicName, patientName, appointmentDate, appointmentTime, doctorName, serviceName, clinicAddress, clinicPhone } = data;
  
  return `مرحباً أستاذ/ة *${patientName}*
تحياتنا من عيادة *${clinicName}*.

نود تأكيد موعد حجزك القادم لدينا:
- التاريخ: ${appointmentDate}
- الوقت: ${appointmentTime}
${serviceName ? `- الخدمة: ${serviceName}\n` : ''}${doctorName ? `- الطبيب المعالج: ${doctorName}\n` : ''}${clinicAddress ? `- العنوان: ${clinicAddress}\n` : ''}
ملاحظات هامة:
- نرجو الحضور قبل الموعد بـ 10 دقائق لإنهاء إجراءات الدخول.
- في حال الرغبة في التعديل أو الاعتذار، يرجى إبلاغنا مسبقاً.${clinicPhone ? `\n- للاستفسار: ${clinicPhone}` : ''}

نتمنى لكم دوام الصحة والعافية.`;
}

/**
 * Template: Visit Summary, Prescriptions & Post-Session Notes / ملخص الجلسة والروشتة
 */
export function templateVisitSummary(data: {
  clinicName: string;
  patientName: string;
  sessionDate: string;
  diagnosisOrNotes?: string;
  treatmentPlan?: string;
  medications?: Array<{ name: string; dose?: string; freq?: string }>;
  nextFollowUp?: string;
}): string {
  const { clinicName, patientName, sessionDate, diagnosisOrNotes, treatmentPlan, medications, nextFollowUp } = data;

  let msg = `مرحباً أستاذ/ة *${patientName}*
تحياتنا من عيادة *${clinicName}*.

نرفق لك تفاصيل وملخص جلستك اليوم:
- تاريخ الجلسة: ${sessionDate}
`;

  if (diagnosisOrNotes) {
    msg += `\n*ملاحظات الطبيب / تعليمات الجلسة:*\n${diagnosisOrNotes}\n`;
  }

  if (treatmentPlan) {
    msg += `\n*الخطة العلاجية المقترحة:*\n${treatmentPlan}\n`;
  }

  if (medications && medications.length > 0) {
    msg += `\n*الروشتة والأدوية المقررة:*\n`;
    medications.forEach((med, idx) => {
      msg += `${idx + 1}. *${med.name}* - ${med.dose || 'حسب الجرعة'}${med.freq ? ` (${med.freq})` : ''}\n`;
    });
  }

  if (nextFollowUp) {
    msg += `\n*موعد المتابعة القادم المقترح:* ${nextFollowUp}\n`;
  }

  msg += `\n*تعليمات المتابعة:*
- يرجى الالتزام بمواعيد العلاج والجرعات بدقة.
- في حال الشعور بأي أعراض غير معتادة يرجى التواصل معنا فوراً.

مع تمنياتنا لك بالصحة ودوام التألق.`;

  return msg;
}

/**
 * Template: Post-Botox & Neurotoxin Care Instructions
 * تعليمات ما بعد جلسة البوتوكس
 */
export function templateBotoxPostCare(data: {
  clinicName: string;
  patientName: string;
}): string {
  const { clinicName, patientName } = data;
  return `عزيزتي/عزيزي *${patientName}*
تحياتنا من *${clinicName}*.

نرجو منك اتباع تعليمات ما بعد جلسة *البوتوكس* لضمان أفضل نتيجة وأطول فترة ثبات:
1. تجنب الاستلقاء أو النوم على الوجه لمدة 4 إلى 6 ساعات بعد الحقن.
2. تجنب فرك أو تدليك مناطق الحقن نهائياً لمدة 24 ساعة.
3. تجنب ممارسة الرياضات العنيفة أو الانحناء الشديد لمدة 24 ساعة.
4. الابتعاد عن حمامات البخار، الساونا، والماء الساخن جداً لمدة 48 ساعة.
5. تبدأ النتائج الأولية بالظهور بعد 3-5 أيام، والنتيجة النهائية تكتمل بعد 14 يوماً.

موعد جلسة الرتوش والتأكيد (إن لزم) بعد أسبوعين من اليوم.
دمتِ بكامل النضارة.`;
}

/**
 * Template: Post-Dermal Filler Care Instructions
 * تعليمات ما بعد جلسة الفيلر
 */
export function templateFillerPostCare(data: {
  clinicName: string;
  patientName: string;
}): string {
  const { clinicName, patientName } = data;
  return `عزيزتي/عزيزي *${patientName}*
تحياتنا من *${clinicName}*.

نرجو اتباع إرشادات ما بعد حقن *الفيلر* للحفاظ على تناسق النتيجة وتجنب التورم:
1. وضع كمادات باردة (بدون ضغط قوي) لمدة 10 دقائق متقطعة أول 24 ساعة.
2. تجنب السوائل الساخنة جداً أو استخدام الشفاط في حال حقن الشفاه لمدة 24 ساعة.
3. تجنب لمس أو تدليك أو الضغط على منطقة الحقن تماماً.
4. النوم على الظهر مع رفع الرأس بوسادة إضافية في أول ليلتين.
5. شرب كميات وافرة من الماء لمساعدة حمض الهيالورونيك على امتصاص الرطوبة.
6. التورم الخفيف أو الكدمات البسيطة أمر طبيعي ويزول تدريجياً خلال 3-7 أيام.

يسعدنا دائماً الاطمئنان عليكِ في أي وقت.`;
}

/**
 * Template: Post-Laser Hair Removal Care Instructions
 * تعليمات ما بعد جلسة الليزر
 */
export function templateLaserPostCare(data: {
  clinicName: string;
  patientName: string;
}): string {
  const { clinicName, patientName } = data;
  return `عزيزتي/عزيزي *${patientName}*
تحياتنا من *${clinicName}*.

للحفاظ على سلامة بشرتك بعد جلسة *الليزر* وتجنب أي تصبغات:
1. استخدام الكريم المهدئ مرتين يومياً لمدة 2-3 أيام حسب إرشاد الطبيب.
2. الالتزام التام بواقي الشمس SPF 50+ وتجديده كل ساعتين عند الخروج نهاراً.
3. تجنب الماء الساخن، الساونا، والمسبح لمدة 48 ساعة.
4. تجنب تقشير البشرة، الحمام المغربي، أو استخدام السكراب لمدة أسبوع على الأقل.
5. تجنب العطور ومزيلات العرق المحتوية على كحول في المناطق المعالجة لمدة 24 ساعة.

مع تمنياتنا لك ببشرة ناعمة وصافية دائماً.`;
}

