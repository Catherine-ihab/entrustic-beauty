// App shell screens: dashboard, login, appointments. Keys merge into `common`.
export const appShell = {
  en: {
    appTitle: 'Entrustic Beauty',
    // Dashboard — mock service labels
    appServiceSpecialistAssessment: 'Specialist Assessment',
    appServiceTherapeuticSession: 'Therapeutic Session',
    appServiceFollowUpReview: 'Follow-Up Review',
    appServiceInitialConsultation: 'Initial Consultation',
    appDoctor: 'Doctor',
    // Appointments — queue statuses
    appQueueWaiting: 'Waiting',
    appQueueWithDoctor: 'With Doctor',
    appQueueCompleted: 'Completed',
    appQueueCancelled: 'Cancelled',
    appTotalToday: 'Total Today',
    // Appointments — actions & messages
    appWhatsappReminder: 'WhatsApp Reminder',
    appWhatsappMessage:
      'Hello {{name}}, this is a reminder of your appointment today at {{time}}. Wishing you a speedy recovery 🌿',
    appRemoveFromQueueConfirm: 'Remove from queue?',
    appNoSearchResults: 'No results found',
    appNoAppointments: 'No appointments',
    appServiceLabel: 'Service',
    appServicePlaceholder: 'e.g. General Checkup, Follow-Up...',
    appTime: 'Time',
    appTimePlaceholder: 'e.g. 10:30',
    appRequired: 'Required',
    appEditBooking: 'Edit Booking',
    appAddPatientToQueue: 'Add Patient to Queue',
    appNewAppointmentBooking: 'Book New Appointment',
    // Appointments — data loading, booking form & messages
    appAppointmentsLoadFailed: 'Failed to load appointments',
    appAppointmentSaveFailed: 'Failed to save appointment',
    appAppointmentCancelFailed: 'Failed to cancel appointment',
    appAppointmentCancelled: 'Appointment cancelled',
    appNoDoctorsConfigured: 'No doctors are configured for this clinic yet',
    appAssignedDoctor: 'Attending Doctor',
    appSelectDoctorPlaceholder: 'Select attending doctor...',
    appSelectRegisteredPatient: 'Please select a registered patient, or switch to a new patient',
    // Login — demo accounts (platform owner only)
    appDemoAccountsOwnerView: 'Demo Accounts (Owner View)',
    appDemoAccountFilled: 'Filled: {{name}} ({{role}})',
  },
  ar: {
    appTitle: 'Entrustic Beauty',
    // لوحة التحكم — خدمات البيانات التجريبية
    appServiceSpecialistAssessment: 'تقييم متخصص',
    appServiceTherapeuticSession: 'جلسة علاجية',
    appServiceFollowUpReview: 'مراجعة متابعة',
    appServiceInitialConsultation: 'استشارة أولية',
    appDoctor: 'دكتور',
    // المواعيد — حالات قائمة الانتظار
    appQueueWaiting: 'في الانتظار',
    appQueueWithDoctor: 'عند الطبيب',
    appQueueCompleted: 'تم الكشف',
    appQueueCancelled: 'ملغي',
    appTotalToday: 'إجمالي اليوم',
    // المواعيد — الإجراءات والرسائل
    appWhatsappReminder: 'تذكير واتساب',
    appWhatsappMessage:
      'أهلاً {{name}}، نذكركم بموعدكم اليوم الساعة {{time}}. نتمنى لكم الشفاء العاجل 🌿',
    appRemoveFromQueueConfirm: 'حذف من القائمة؟',
    appNoSearchResults: 'لا توجد نتائج للبحث',
    appNoAppointments: 'لا توجد مواعيد',
    appServiceLabel: 'خدمة',
    appServicePlaceholder: 'مثال: كشف عام، متابعة...',
    appTime: 'الوقت',
    appTimePlaceholder: 'مثال: 10:30',
    appRequired: 'مطلوب',
    appEditBooking: 'تعديل الحجز',
    appAddPatientToQueue: 'إضافة مريض للقائمة',
    appNewAppointmentBooking: 'حجز موعد جديد',
    // المواعيد — تحميل البيانات ونموذج الحجز والرسائل
    appAppointmentsLoadFailed: 'تعذر تحميل المواعيد',
    appAppointmentSaveFailed: 'تعذر حفظ الموعد',
    appAppointmentCancelFailed: 'تعذر إلغاء الموعد',
    appAppointmentCancelled: 'تم إلغاء الموعد',
    appNoDoctorsConfigured: 'لا يوجد أطباء مُسجّلون في هذه العيادة بعد',
    appAssignedDoctor: 'الطبيب المعالج',
    appSelectDoctorPlaceholder: 'اختر الطبيب المعالج...',
    appSelectRegisteredPatient: 'يرجى اختيار مريض مسجل، أو التبديل إلى مريض جديد',
    // تسجيل الدخول — الحسابات التجريبية (للمالك فقط)
    appDemoAccountsOwnerView: 'حسابات تجريبية (عرض المالك)',
    appDemoAccountFilled: 'تم الملء: {{name}} ({{role}})',
  },
};
