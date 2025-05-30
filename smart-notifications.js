/**
 * نظام الإشعارات والتذكيرات الذكي المتكامل
 * ملف منفصل لإضافة نظام إشعارات وتذكيرات متقدم
 * يدعم إشعارات المتصفح، التذكيرات الصوتية، والمواعيد المجدولة
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="smart-notifications.js"></script>
 */

// ==============================
// إعدادات النظام الافتراضية
// ==============================
const DEFAULT_NOTIFICATION_SETTINGS = {
    // إعدادات الإشعارات العامة
    enabled: true,
    browserNotifications: true,
    soundNotifications: true,
    visualNotifications: true,
    vibrationEnabled: true,
    
    // إعدادات التذكيرات
    remindersEnabled: true,
    autoReminders: true,
    reminderAdvanceTime: 30, // دقائق قبل الموعد
    repeatReminders: true,
    maxReminders: 3,
    
    // إعدادات الصوت
    soundVolume: 0.7,
    notificationSound: 'default', // default, chime, bell, alert
    customSounds: {},
    
    // إعدادات المظهر
    position: 'top-right', // top-right, top-left, bottom-right, bottom-left
    theme: 'modern', // modern, classic, minimal
    showIcons: true,
    showTimestamp: true,
    autoHide: true,
    hideDelay: 5000,
    
    // إعدادات التصنيف
    priorities: {
        low: { color: '#3498db', duration: 3000 },
        normal: { color: '#27ae60', duration: 5000 },
        high: { color: '#f39c12', duration: 7000 },
        urgent: { color: '#e74c3c', duration: 10000 }
    },
    
    // إعدادات المهام والمواعيد
    taskReminders: true,
    appointmentReminders: true,
    followUpReminders: true,
    urgentCaseAlerts: true,
    deadlineWarnings: true,
    
    // إعدادات التوقيت
    workingHours: {
        enabled: true,
        start: '09:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5] // الأحد إلى الخميس
    },
    
    // إعدادات الإحصائيات
    trackStatistics: true,
    showNotificationHistory: true,
    maxHistoryItems: 100
};

// ==============================
// متغيرات النظام
// ==============================
let currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
let notificationSystem = {
    notifications: [],
    reminders: [],
    appointments: [],
    tasks: [],
    history: []
};

let notificationPanel = null;
let calendarPanel = null;
let notificationPermission = 'default';
let activeNotifications = new Map();
let activeTimers = new Map();

// أصوات الإشعارات المدمجة
const NOTIFICATION_SOUNDS = {
    default: {
        frequency: 800,
        duration: 300,
        type: 'sine'
    },
    chime: {
        frequencies: [523, 659, 784],
        duration: 600,
        type: 'sine'
    },
    bell: {
        frequency: 1000,
        duration: 400,
        type: 'triangle'
    },
    alert: {
        frequency: 600,
        duration: 200,
        repeat: 3,
        type: 'sawtooth'
    }
};

// أنواع الإشعارات
const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    REMINDER: 'reminder',
    APPOINTMENT: 'appointment',
    TASK: 'task',
    URGENT: 'urgent'
};

// ==============================
// تهيئة النظام
// ==============================
function initializeNotificationSystem() {
    try {
        console.log('🔔 بدء تهيئة نظام الإشعارات والتذكيرات...');
        
        // تحميل الإعدادات المحفوظة
        loadNotificationSettings();
        
        // طلب أذونات الإشعارات
        requestNotificationPermissions();
        
        // إنشاء واجهة النظام
        createNotificationInterface();
        
        // إعداد مستمعي الأحداث
        setupNotificationEventListeners();
        
        // تهيئة نظام التذكيرات التلقائية
        initializeAutoReminders();
        
        // بدء مراقبة النظام
        startSystemMonitoring();
        
        // إضافة أزرار سريعة
        addQuickActionButtons();
        
        console.log('✅ تم تهيئة نظام الإشعارات بنجاح');
        
        // إشعار ترحيبي
        showSmartNotification({
            title: '🔔 نظام الإشعارات الذكي',
            message: 'تم تفعيل النظام بنجاح! ستتلقى إشعارات وتذكيرات للمواعيد والمهام المهمة.',
            type: NOTIFICATION_TYPES.SUCCESS,
            priority: 'normal',
            actions: [
                { text: 'إعدادات', action: () => openNotificationPanel() },
                { text: 'فهمت', action: null }
            ]
        });
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام الإشعارات:', error);
        showSmartNotification({
            title: 'خطأ في النظام',
            message: 'فشل في تهيئة نظام الإشعارات',
            type: NOTIFICATION_TYPES.ERROR
        });
    }
}

// ==============================
// طلب أذونات الإشعارات
// ==============================
async function requestNotificationPermissions() {
    if (!('Notification' in window)) {
        console.warn('المتصفح لا يدعم إشعارات الويب');
        currentNotificationSettings.browserNotifications = false;
        return;
    }
    
    try {
        notificationPermission = Notification.permission;
        
        if (notificationPermission === 'default') {
            const permission = await Notification.requestPermission();
            notificationPermission = permission;
        }
        
        if (notificationPermission === 'granted') {
            console.log('✅ تم منح أذونات الإشعارات');
        } else {
            console.warn('⚠️ تم رفض أذونات الإشعارات');
            currentNotificationSettings.browserNotifications = false;
        }
        
    } catch (error) {
        console.error('خطأ في طلب أذونات الإشعارات:', error);
        currentNotificationSettings.browserNotifications = false;
    }
}

// ==============================
// إنشاء واجهة النظام
// ==============================
function createNotificationInterface() {
    // إنشاء حاوية الإشعارات
    createNotificationContainer();
    
    // إنشاء لوحة التحكم
    createNotificationControlPanel();
    
    // إنشاء التقويم المدمج
    createCalendarPanel();
    
    // إضافة الأنماط
    addNotificationStyles();
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'smart-notifications-container';
    container.className = `notifications-container ${currentNotificationSettings.position}`;
    
    document.body.appendChild(container);
}

function createNotificationControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'notification-control-panel';
    panel.innerHTML = `
        <div class="notification-overlay">
            <div class="notification-panel-container">
                <div class="notification-panel-header">
                    <h3>🔔 مركز الإشعارات والتذكيرات</h3>
                    <button class="notification-close-btn" onclick="closeNotificationPanel()">✕</button>
                </div>
                
                <div class="notification-panel-tabs">
                    <button class="notification-tab-btn active" onclick="showNotificationTab('dashboard')">
                        📊 لوحة التحكم
                    </button>
                    <button class="notification-tab-btn" onclick="showNotificationTab('reminders')">
                        ⏰ التذكيرات
                    </button>
                    <button class="notification-tab-btn" onclick="showNotificationTab('appointments')">
                        📅 المواعيد
                    </button>
                    <button class="notification-tab-btn" onclick="showNotificationTab('settings')">
                        ⚙️ الإعدادات
                    </button>
                    <button class="notification-tab-btn" onclick="showNotificationTab('history')">
                        📝 السجل
                    </button>
                </div>
                
                <div class="notification-panel-content">
                    <!-- تبويب لوحة التحكم -->
                    <div class="notification-tab-content active" id="dashboard-tab">
                        <div class="notification-dashboard">
                            <div class="notification-stats-grid">
                                <div class="notification-stat-card">
                                    <div class="stat-icon">📨</div>
                                    <div class="stat-info">
                                        <div class="stat-number" id="total-notifications">0</div>
                                        <div class="stat-label">إجمالي الإشعارات</div>
                                    </div>
                                </div>
                                <div class="notification-stat-card">
                                    <div class="stat-icon">⏰</div>
                                    <div class="stat-info">
                                        <div class="stat-number" id="active-reminders">0</div>
                                        <div class="stat-label">التذكيرات النشطة</div>
                                    </div>
                                </div>
                                <div class="notification-stat-card">
                                    <div class="stat-icon">📅</div>
                                    <div class="stat-info">
                                        <div class="stat-number" id="upcoming-appointments">0</div>
                                        <div class="stat-label">المواعيد القادمة</div>
                                    </div>
                                </div>
                                <div class="notification-stat-card">
                                    <div class="stat-icon">🚨</div>
                                    <div class="stat-info">
                                        <div class="stat-number" id="urgent-items">0</div>
                                        <div class="stat-label">العناصر العاجلة</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="notification-quick-actions">
                                <h4>إجراءات سريعة</h4>
                                <div class="quick-action-buttons">
                                    <button class="quick-action-btn" onclick="createQuickReminder()">
                                        ⏰ إنشاء تذكير سريع
                                    </button>
                                    <button class="quick-action-btn" onclick="scheduleAppointment()">
                                        📅 جدولة موعد
                                    </button>
                                    <button class="quick-action-btn" onclick="createUrgentAlert()">
                                        🚨 تنبيه عاجل
                                    </button>
                                    <button class="quick-action-btn" onclick="testNotificationSystem()">
                                        🧪 اختبار النظام
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- تبويب التذكيرات -->
                    <div class="notification-tab-content" id="reminders-tab">
                        <div class="reminders-section">
                            <div class="section-header">
                                <h4>⏰ إدارة التذكيرات</h4>
                                <button class="add-reminder-btn" onclick="showAddReminderForm()">
                                    ➕ إضافة تذكير
                                </button>
                            </div>
                            
                            <div class="add-reminder-form" id="add-reminder-form" style="display: none;">
                                <div class="form-row">
                                    <input type="text" id="reminder-title" placeholder="عنوان التذكير" class="form-input">
                                    <select id="reminder-priority" class="form-select">
                                        <option value="low">أولوية منخفضة</option>
                                        <option value="normal" selected>أولوية عادية</option>
                                        <option value="high">أولوية عالية</option>
                                        <option value="urgent">عاجل</option>
                                    </select>
                                </div>
                                <div class="form-row">
                                    <input type="datetime-local" id="reminder-datetime" class="form-input">
                                    <select id="reminder-repeat" class="form-select">
                                        <option value="none">لا يتكرر</option>
                                        <option value="daily">يومياً</option>
                                        <option value="weekly">أسبوعياً</option>
                                        <option value="monthly">شهرياً</option>
                                    </select>
                                </div>
                                <textarea id="reminder-description" placeholder="وصف التذكير (اختياري)" class="form-textarea"></textarea>
                                <div class="form-actions">
                                    <button onclick="saveReminder()" class="save-btn">حفظ التذكير</button>
                                    <button onclick="hideAddReminderForm()" class="cancel-btn">إلغاء</button>
                                </div>
                            </div>
                            
                            <div class="reminders-list" id="reminders-list">
                                <!-- سيتم ملؤها ديناميكياً -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- تبويب المواعيد -->
                    <div class="notification-tab-content" id="appointments-tab">
                        <div class="appointments-section">
                            <div class="section-header">
                                <h4>📅 إدارة المواعيد</h4>
                                <button class="add-appointment-btn" onclick="showAddAppointmentForm()">
                                    ➕ إضافة موعد
                                </button>
                            </div>
                            
                            <div class="mini-calendar" id="mini-calendar">
                                <!-- تقويم مصغر -->
                            </div>
                            
                            <div class="appointments-list" id="appointments-list">
                                <!-- قائمة المواعيد -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- تبويب الإعدادات -->
                    <div class="notification-tab-content" id="settings-tab">
                        <div class="notification-settings">
                            <div class="settings-section">
                                <h4>🔔 إعدادات الإشعارات</h4>
                                <div class="setting-item">
                                    <label>تفعيل الإشعارات</label>
                                    <input type="checkbox" id="setting-enabled" onchange="updateNotificationSettings()">
                                </div>
                                <div class="setting-item">
                                    <label>إشعارات المتصفح</label>
                                    <input type="checkbox" id="setting-browser" onchange="updateNotificationSettings()">
                                </div>
                                <div class="setting-item">
                                    <label>الإشعارات الصوتية</label>
                                    <input type="checkbox" id="setting-sound" onchange="updateNotificationSettings()">
                                </div>
                                <div class="setting-item">
                                    <label>الاهتزاز</label>
                                    <input type="checkbox" id="setting-vibration" onchange="updateNotificationSettings()">
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>⏰ إعدادات التذكيرات</h4>
                                <div class="setting-item">
                                    <label>التذكيرات التلقائية</label>
                                    <input type="checkbox" id="setting-auto-reminders" onchange="updateNotificationSettings()">
                                </div>
                                <div class="setting-item">
                                    <label>وقت التذكير المسبق (دقائق)</label>
                                    <input type="number" id="setting-advance-time" min="5" max="1440" onchange="updateNotificationSettings()">
                                </div>
                                <div class="setting-item">
                                    <label>تكرار التذكيرات</label>
                                    <input type="checkbox" id="setting-repeat" onchange="updateNotificationSettings()">
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>🎵 إعدادات الصوت</h4>
                                <div class="setting-item">
                                    <label>مستوى الصوت</label>
                                    <input type="range" id="setting-volume" min="0" max="1" step="0.1" onchange="updateNotificationSettings()">
                                    <span id="volume-display">70%</span>
                                </div>
                                <div class="setting-item">
                                    <label>نوع الصوت</label>
                                    <select id="setting-sound-type" onchange="updateNotificationSettings()">
                                        <option value="default">افتراضي</option>
                                        <option value="chime">نغمة</option>
                                        <option value="bell">جرس</option>
                                        <option value="alert">تنبيه</option>
                                    </select>
                                    <button onclick="testNotificationSound()" class="test-sound-btn">🔊 تجربة</button>
                                </div>
                            </div>
                            
                            <div class="settings-section">
                                <h4>🎨 إعدادات المظهر</h4>
                                <div class="setting-item">
                                    <label>موقع الإشعارات</label>
                                    <select id="setting-position" onchange="updateNotificationSettings()">
                                        <option value="top-right">أعلى يمين</option>
                                        <option value="top-left">أعلى يسار</option>
                                        <option value="bottom-right">أسفل يمين</option>
                                        <option value="bottom-left">أسفل يسار</option>
                                    </select>
                                </div>
                                <div class="setting-item">
                                    <label>مدة العرض (ثانية)</label>
                                    <input type="number" id="setting-duration" min="1" max="30" onchange="updateNotificationSettings()">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- تبويب السجل -->
                    <div class="notification-tab-content" id="history-tab">
                        <div class="notification-history">
                            <div class="section-header">
                                <h4>📝 سجل الإشعارات</h4>
                                <button onclick="clearNotificationHistory()" class="clear-history-btn">
                                    🗑️ مسح السجل
                                </button>
                            </div>
                            
                            <div class="history-filters">
                                <select id="history-filter-type">
                                    <option value="all">جميع الأنواع</option>
                                    <option value="reminder">تذكيرات</option>
                                    <option value="appointment">مواعيد</option>
                                    <option value="urgent">عاجل</option>
                                </select>
                                <input type="date" id="history-filter-date">
                                <button onclick="filterNotificationHistory()">فلترة</button>
                            </div>
                            
                            <div class="history-list" id="history-list">
                                <!-- سجل الإشعارات -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="notification-panel-footer">
                    <button class="panel-btn save-btn" onclick="saveNotificationSettings()">
                        💾 حفظ الإعدادات
                    </button>
                    <button class="panel-btn export-btn" onclick="exportNotificationData()">
                        📤 تصدير البيانات
                    </button>
                    <button class="panel-btn import-btn" onclick="importNotificationData()">
                        📥 استيراد البيانات
                    </button>
                    <button class="panel-btn reset-btn" onclick="resetNotificationSettings()">
                        🔄 إعادة تعيين
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    notificationPanel = panel;
    
    // تحديث القيم في النموذج
    updateSettingsForm();
}

// ==============================
// إنشاء الأنماط CSS
// ==============================
function addNotificationStyles() {
    if (document.getElementById('smart-notification-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'smart-notification-styles';
    styles.textContent = `
        /* حاوية الإشعارات */
        .notifications-container {
            position: fixed;
            z-index: 10000;
            pointer-events: none;
            max-width: 400px;
            width: 100%;
        }
        
        .notifications-container.top-right {
            top: 20px;
            right: 20px;
        }
        
        .notifications-container.top-left {
            top: 20px;
            left: 20px;
        }
        
        .notifications-container.bottom-right {
            bottom: 20px;
            right: 20px;
        }
        
        .notifications-container.bottom-left {
            bottom: 20px;
            left: 20px;
        }
        
        /* الإشعار الفردي */
        .smart-notification {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            margin-bottom: 12px;
            padding: 16px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border-left: 4px solid #3498db;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
            min-height: 80px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .smart-notification.show {
            transform: translateX(0);
        }
        
        .smart-notification.hide {
            transform: translateX(100%);
            opacity: 0;
        }
        
        /* أنواع الإشعارات */
        .smart-notification.info {
            border-left-color: #3498db;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
        }
        
        .smart-notification.success {
            border-left-color: #27ae60;
            background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
        }
        
        .smart-notification.warning {
            border-left-color: #f39c12;
            background: linear-gradient(135deg, #ffffff 0%, #fffbf0 100%);
        }
        
        .smart-notification.error {
            border-left-color: #e74c3c;
            background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
        }
        
        .smart-notification.reminder {
            border-left-color: #9b59b6;
            background: linear-gradient(135deg, #ffffff 0%, #fcf8ff 100%);
        }
        
        .smart-notification.urgent {
            border-left-color: #e74c3c;
            background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
            animation: urgentPulse 2s infinite;
        }
        
        @keyframes urgentPulse {
            0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); }
            50% { box-shadow: 0 8px 32px rgba(231, 76, 60, 0.3); }
        }
        
        /* أيقونة الإشعار */
        .notification-icon {
            font-size: 24px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .notification-icon.info { background: #ebf3fd; color: #3498db; }
        .notification-icon.success { background: #edf7ed; color: #27ae60; }
        .notification-icon.warning { background: #fef5e7; color: #f39c12; }
        .notification-icon.error { background: #fdebea; color: #e74c3c; }
        .notification-icon.reminder { background: #f4ecf7; color: #9b59b6; }
        .notification-icon.urgent { background: #fdebea; color: #e74c3c; }
        
        /* محتوى الإشعار */
        .notification-content {
            flex: 1;
            min-width: 0;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
            color: #2c3e50;
            line-height: 1.2;
        }
        
        .notification-message {
            font-size: 14px;
            color: #546e7a;
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .notification-timestamp {
            font-size: 11px;
            color: #90a4ae;
            margin-bottom: 8px;
        }
        
        /* أزرار الإجراءات */
        .notification-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .notification-action-btn {
            background: rgba(52, 152, 219, 0.1);
            border: 1px solid rgba(52, 152, 219, 0.3);
            color: #3498db;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 500;
        }
        
        .notification-action-btn:hover {
            background: #3498db;
            color: white;
        }
        
        /* زر الإغلاق */
        .notification-close {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.1);
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            opacity: 0.7;
            transition: all 0.3s;
        }
        
        .notification-close:hover {
            opacity: 1;
            background: rgba(0, 0, 0, 0.2);
        }
        
        /* شريط التقدم */
        .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #3498db, #2980b9);
            transition: width linear;
            border-radius: 0 0 8px 8px;
        }
        
        /* لوحة التحكم */
        .notification-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            z-index: 10001;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .notification-overlay.show {
            display: flex;
        }
        
        .notification-panel-container {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
        }
        
        /* رأس اللوحة */
        .notification-panel-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-panel-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .notification-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        .notification-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        /* تبويبات اللوحة */
        .notification-panel-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #e3e6f0;
            overflow-x: auto;
        }
        
        .notification-tab-btn {
            background: none;
            border: none;
            padding: 15px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.3s;
            border-bottom: 3px solid transparent;
            white-space: nowrap;
            min-width: 120px;
        }
        
        .notification-tab-btn:hover {
            background: #e9ecef;
            color: #495057;
        }
        
        .notification-tab-btn.active {
            color: #667eea;
            border-bottom-color: #667eea;
            background: white;
        }
        
        /* محتوى اللوحة */
        .notification-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .notification-tab-content {
            display: none;
        }
        
        .notification-tab-content.active {
            display: block;
        }
        
        /* لوحة التحكم الرئيسية */
        .notification-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .notification-stat-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            border: 1px solid #e3e6f0;
            transition: transform 0.3s;
        }
        
        .notification-stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .stat-icon {
            font-size: 32px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .stat-info {
            flex: 1;
        }
        
        .stat-number {
            font-size: 28px;
            font-weight: 700;
            color: #2c3e50;
            line-height: 1;
            margin-bottom: 4px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6c757d;
            font-weight: 500;
        }
        
        /* الإجراءات السريعة */
        .notification-quick-actions {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e3e6f0;
        }
        
        .notification-quick-actions h4 {
            margin: 0 0 16px 0;
            color: #2c3e50;
            font-size: 18px;
        }
        
        .quick-action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        
        .quick-action-btn {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .quick-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
        }
        
        /* النماذج */
        .form-row {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
        }
        
        .form-input, .form-select, .form-textarea {
            flex: 1;
            padding: 10px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .form-textarea {
            resize: vertical;
            min-height: 80px;
        }
        
        .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;
        }
        
        .save-btn, .cancel-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .save-btn {
            background: #27ae60;
            color: white;
        }
        
        .save-btn:hover {
            background: #219a52;
        }
        
        .cancel-btn {
            background: #6c757d;
            color: white;
        }
        
        .cancel-btn:hover {
            background: #5a6268;
        }
        
        /* الإعدادات */
        .settings-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #e3e6f0;
        }
        
        .settings-section h4 {
            margin: 0 0 16px 0;
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #e3e6f0;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .setting-item:last-child {
            border-bottom: none;
        }
        
        .setting-item label {
            font-weight: 500;
            color: #495057;
            flex: 1;
        }
        
        .setting-item input, .setting-item select {
            max-width: 200px;
        }
        
        .test-sound-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 8px;
        }
        
        /* تذييل اللوحة */
        .notification-panel-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .panel-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .panel-btn.save-btn {
            background: #28a745;
            color: white;
        }
        
        .panel-btn.export-btn {
            background: #6f42c1;
            color: white;
        }
        
        .panel-btn.import-btn {
            background: #fd7e14;
            color: white;
        }
        
        .panel-btn.reset-btn {
            background: #dc3545;
            color: white;
        }
        
        /* الأزرار السريعة العائمة */
        .notification-quick-button {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        
        .notification-quick-button:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .notifications-container {
                max-width: calc(100vw - 40px);
                left: 20px !important;
                right: 20px !important;
            }
            
            .notification-panel-container {
                max-height: 95vh;
                width: 100%;
                margin: 0;
            }
            
            .notification-panel-tabs {
                flex-wrap: wrap;
            }
            
            .notification-tab-btn {
                flex: 1;
                min-width: auto;
                padding: 12px 10px;
                font-size: 12px;
            }
            
            .notification-stats-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .quick-action-buttons {
                grid-template-columns: 1fr;
            }
            
            .form-row {
                flex-direction: column;
                gap: 8px;
            }
            
            .notification-panel-footer {
                flex-direction: column;
            }
            
            .panel-btn {
                width: 100%;
                justify-content: center;
            }
            
            .smart-notification {
                margin-left: 10px;
                margin-right: 10px;
            }
        }
        
        /* انيميشن للإشعارات */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInLeft {
            from {
                transform: translateX(-100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notifications-container.top-left .smart-notification,
        .notifications-container.bottom-left .smart-notification {
            transform: translateX(-100%);
        }
        
        .notifications-container.top-left .smart-notification.show,
        .notifications-container.bottom-left .smart-notification.show {
            animation: slideInLeft 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform: translateX(0);
        }
        
        /* تحسينات الأداء */
        .smart-notification {
            will-change: transform, opacity;
        }
        
        .notification-progress {
            will-change: width;
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// إظهار الإشعارات الذكية
// ==============================
function showSmartNotification(options = {}) {
    const {
        title = 'إشعار',
        message = '',
        type = NOTIFICATION_TYPES.INFO,
        priority = 'normal',
        duration = null,
        actions = [],
        icon = null,
        sound = true,
        persistent = false,
        data = {}
    } = options;
    
    // إنشاء معرف فريد للإشعار
    const notificationId = 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // تحديد مدة العرض حسب الأولوية
    const displayDuration = duration || currentNotificationSettings.priorities[priority]?.duration || 5000;
    
    // إنشاء عنصر الإشعار
    const notification = createNotificationElement({
        id: notificationId,
        title,
        message,
        type,
        priority,
        actions,
        icon,
        persistent,
        data
    });
    
    // إضافة الإشعار للحاوية
    const container = document.getElementById('smart-notifications-container');
    if (container) {
        container.appendChild(notification);
        
        // إظهار الإشعار مع تأخير قصير
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // إضافة شريط التقدم إذا لم يكن دائماً
        if (!persistent && displayDuration > 0) {
            addProgressBar(notification, displayDuration);
        }
        
        // حفظ مرجع الإشعار
        activeNotifications.set(notificationId, {
            element: notification,
            data: { title, message, type, priority, timestamp: new Date(), ...data }
        });
        
        // إزالة الإشعار تلقائياً
        if (!persistent && displayDuration > 0) {
            const timer = setTimeout(() => {
                hideNotification(notificationId);
            }, displayDuration);
            
            activeTimers.set(notificationId, timer);
        }
    }
    
    // إشعار المتصفح
    if (currentNotificationSettings.browserNotifications && notificationPermission === 'granted') {
        showBrowserNotification(title, message, icon);
    }
    
    // تشغيل الصوت
    if (sound && currentNotificationSettings.soundNotifications) {
        playNotificationSound(type);
    }
    
    // الاهتزاز
    if (currentNotificationSettings.vibrationEnabled && navigator.vibrate) {
        const vibrationPattern = priority === 'urgent' ? [200, 100, 200, 100, 200] : [100];
        navigator.vibrate(vibrationPattern);
    }
    
    // إضافة للسجل
    addToNotificationHistory({
        id: notificationId,
        title,
        message,
        type,
        priority,
        timestamp: new Date(),
        ...data
    });
    
    // تحديث الإحصائيات
    updateNotificationStatistics();
    
    return notificationId;
}

// ==============================
// إنشاء عنصر الإشعار
// ==============================
function createNotificationElement(options) {
    const {
        id,
        title,
        message,
        type,
        priority,
        actions,
        icon,
        persistent,
        data
    } = options;
    
    const notification = document.createElement('div');
    notification.className = `smart-notification ${type} priority-${priority}`;
    notification.id = id;
    notification.setAttribute('data-notification-id', id);
    
    // أيقونة الإشعار
    const iconClass = icon || getDefaultIcon(type);
    
    // إنشاء HTML الإشعار
    notification.innerHTML = `
        <div class="notification-icon ${type}">
            ${iconClass}
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <div class="notification-timestamp">${formatNotificationTime(new Date())}</div>
            ${actions.length > 0 ? `
                <div class="notification-actions">
                    ${actions.map((action, index) => `
                        <button class="notification-action-btn" data-action-index="${index}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        ${!persistent ? '<button class="notification-close">✕</button>' : ''}
    `;
    
    // إعداد أحداث الأزرار
    setupNotificationEvents(notification, actions, id);
    
    return notification;
}

// ==============================
// إعداد أحداث الإشعار
// ==============================
function setupNotificationEvents(notification, actions, notificationId) {
    // زر الإغلاق
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideNotification(notificationId);
        });
    }
    
    // أزرار الإجراءات
    const actionBtns = notification.querySelectorAll('.notification-action-btn');
    actionBtns.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const action = actions[index];
            if (action && action.action && typeof action.action === 'function') {
                action.action();
            }
            
            // إخفاء الإشعار بعد تنفيذ الإجراء
            hideNotification(notificationId);
        });
    });
    
    // النقر على الإشعار نفسه
    notification.addEventListener('click', () => {
        // يمكن إضافة إجراء افتراضي هنا
        console.log('تم النقر على الإشعار:', notificationId);
    });
}

// ==============================
// إخفاء الإشعار
// ==============================
function hideNotification(notificationId) {
    const notificationData = activeNotifications.get(notificationId);
    if (!notificationData) return;
    
    const notification = notificationData.element;
    
    // إضافة كلاس الإخفاء
    notification.classList.add('hide');
    
    // إزالة من DOM بعد انتهاء الانيميشن
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 400);
    
    // تنظيف المراجع
    activeNotifications.delete(notificationId);
    
    const timer = activeTimers.get(notificationId);
    if (timer) {
        clearTimeout(timer);
        activeTimers.delete(notificationId);
    }
    
    // تحديث الإحصائيات
    updateNotificationStatistics();
}

// ==============================
// إضافة شريط التقدم
// ==============================
function addProgressBar(notification, duration) {
    const progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    progressBar.style.width = '100%';
    
    notification.appendChild(progressBar);
    
    // تحريك شريط التقدم
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '0%';
    }, 100);
}

// ==============================
// التذكيرات التلقائية
// ==============================
function initializeAutoReminders() {
    if (!currentNotificationSettings.autoReminders) return;
    
    // مراقبة الحالات التي تحتاج متابعة
    setInterval(() => {
        checkForAutoReminders();
    }, 60000); // كل دقيقة
    
    console.log('🔄 تم تفعيل نظام التذكيرات التلقائية');
}

function checkForAutoReminders() {
    try {
        // التحقق من وجود بيانات الحالات (من النظام الرئيسي)
        if (typeof casesData !== 'undefined' && Array.isArray(casesData)) {
            casesData.forEach(caseItem => {
                checkCaseForReminders(caseItem);
            });
        }
        
        // التحقق من التذكيرات المجدولة
        checkScheduledReminders();
        
        // التحقق من المواعيد القادمة
        checkUpcomingAppointments();
        
    } catch (error) {
        console.error('خطأ في فحص التذكيرات التلقائية:', error);
    }
}

function checkCaseForReminders(caseItem) {
    if (!caseItem || !caseItem.id) return;
    
    const caseDate = new Date(caseItem.createdAt || caseItem.caseDate);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - caseDate) / (1000 * 60 * 60 * 24));
    
    // تذكير بمتابعة الحالات القديمة (أكثر من 30 يوم)
    if (daysSinceCreation > 30 && !hasRecentReminder(caseItem.id, 'follow_up')) {
        showSmartNotification({
            title: '📋 تذكير متابعة حالة',
            message: `الحالة "${caseItem.fullName}" تحتاج متابعة (${daysSinceCreation} يوم)`,
            type: NOTIFICATION_TYPES.REMINDER,
            priority: 'normal',
            actions: [
                { text: 'عرض الحالة', action: () => viewCase(caseItem.id) },
                { text: 'تأجيل', action: () => snoozeReminder(caseItem.id, 7) }
            ],
            data: { caseId: caseItem.id, reminderType: 'follow_up' }
        });
        
        // حفظ أن تم إرسال التذكير
        markReminderSent(caseItem.id, 'follow_up');
    }
    
    // تذكير بالحالات العاجلة
    if (caseItem.priority === 'urgent' && !hasRecentReminder(caseItem.id, 'urgent')) {
        showSmartNotification({
            title: '🚨 حالة عاجلة تحتاج اهتمام',
            message: `الحالة العاجلة "${caseItem.fullName}" تحتاج متابعة فورية`,
            type: NOTIFICATION_TYPES.URGENT,
            priority: 'urgent',
            persistent: true,
            actions: [
                { text: 'عرض الآن', action: () => viewCase(caseItem.id) },
                { text: 'اتصال', action: () => callCase(caseItem.id) }
            ],
            data: { caseId: caseItem.id, reminderType: 'urgent' }
        });
        
        markReminderSent(caseItem.id, 'urgent');
    }
}

// ==============================
// إدارة المواعيد والتذكيرات
// ==============================
function scheduleReminder(reminderData) {
    const {
        title,
        message,
        datetime,
        priority = 'normal',
        repeat = 'none',
        advanceTime = currentNotificationSettings.reminderAdvanceTime
    } = reminderData;
    
    const reminderId = 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const reminderTime = new Date(datetime);
    const notificationTime = new Date(reminderTime.getTime() - (advanceTime * 60 * 1000));
    
    const reminder = {
        id: reminderId,
        title,
        message,
        datetime: reminderTime.toISOString(),
        notificationTime: notificationTime.toISOString(),
        priority,
        repeat,
        status: 'active',
        created: new Date().toISOString()
    };
    
    // حفظ التذكير
    notificationSystem.reminders.push(reminder);
    saveNotificationData();
    
    // جدولة الإشعار
    scheduleNotification(reminder);
    
    showSmartNotification({
        title: '⏰ تم جدولة التذكير',
        message: `سيتم تذكيرك بـ "${title}" في ${formatNotificationTime(reminderTime)}`,
        type: NOTIFICATION_TYPES.SUCCESS,
        priority: 'normal'
    });
    
    return reminderId;
}

function scheduleNotification(reminder) {
    const now = new Date();
    const notificationTime = new Date(reminder.notificationTime);
    const delay = notificationTime.getTime() - now.getTime();
    
    if (delay > 0) {
        const timer = setTimeout(() => {
            showSmartNotification({
                title: `⏰ ${reminder.title}`,
                message: reminder.message,
                type: NOTIFICATION_TYPES.REMINDER,
                priority: reminder.priority,
                actions: [
                    { text: 'تم', action: () => markReminderComplete(reminder.id) },
                    { text: 'تأجيل 15 دقيقة', action: () => snoozeReminderById(reminder.id, 15) },
                    { text: 'تأجيل ساعة', action: () => snoozeReminderById(reminder.id, 60) }
                ],
                data: { reminderId: reminder.id }
            });
            
            // إعداد التكرار إذا كان مطلوباً
            if (reminder.repeat !== 'none') {
                scheduleRepeatedReminder(reminder);
            }
        }, delay);
        
        activeTimers.set(`reminder_${reminder.id}`, timer);
    }
}

// ==============================
// التحكم في لوحة الإعدادات
// ==============================
function openNotificationPanel() {
    if (!notificationPanel) {
        createNotificationControlPanel();
    }
    
    const overlay = notificationPanel.querySelector('.notification-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // تحديث البيانات
    updateNotificationDashboard();
    updateRemindersList();
    updateNotificationHistory();
}

function closeNotificationPanel() {
    if (notificationPanel) {
        const overlay = notificationPanel.querySelector('.notification-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function showNotificationTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.notification-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.notification-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    const targetTab = document.getElementById(tabName + '-tab');
    const targetBtn = event.target;
    
    if (targetTab) {
        targetTab.classList.add('active');
        targetBtn.classList.add('active');
    }
    
    // تحديث المحتوى حسب التبويب
    switch(tabName) {
        case 'dashboard':
            updateNotificationDashboard();
            break;
        case 'reminders':
            updateRemindersList();
            break;
        case 'appointments':
            updateAppointmentsList();
            break;
        case 'history':
            updateNotificationHistory();
            break;
    }
}

// ==============================
// إدارة الإعدادات
// ==============================
function updateNotificationSettings() {
    const settings = {
        enabled: document.getElementById('setting-enabled')?.checked,
        browserNotifications: document.getElementById('setting-browser')?.checked,
        soundNotifications: document.getElementById('setting-sound')?.checked,
        vibrationEnabled: document.getElementById('setting-vibration')?.checked,
        autoReminders: document.getElementById('setting-auto-reminders')?.checked,
        reminderAdvanceTime: parseInt(document.getElementById('setting-advance-time')?.value) || 30,
        repeatReminders: document.getElementById('setting-repeat')?.checked,
        soundVolume: parseFloat(document.getElementById('setting-volume')?.value) || 0.7,
        notificationSound: document.getElementById('setting-sound-type')?.value || 'default',
        position: document.getElementById('setting-position')?.value || 'top-right',
        hideDelay: parseInt(document.getElementById('setting-duration')?.value) * 1000 || 5000
    };
    
    // تحديث الإعدادات
    Object.assign(currentNotificationSettings, settings);
    
    // تطبيق التغييرات
    applyNotificationSettings();
}

function applyNotificationSettings() {
    // تحديث موقع حاوية الإشعارات
    const container = document.getElementById('smart-notifications-container');
    if (container) {
        container.className = `notifications-container ${currentNotificationSettings.position}`;
    }
    
    // تحديث عرض مستوى الصوت
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeDisplay) {
        volumeDisplay.textContent = Math.round(currentNotificationSettings.soundVolume * 100) + '%';
    }
}

function saveNotificationSettings() {
    updateNotificationSettings();
    
    try {
        localStorage.setItem('charity_notification_settings', JSON.stringify(currentNotificationSettings));
        localStorage.setItem('charity_notification_data', JSON.stringify(notificationSystem));
        
        showSmartNotification({
            title: '💾 تم حفظ الإعدادات',
            message: 'تم حفظ جميع إعدادات الإشعارات بنجاح',
            type: NOTIFICATION_TYPES.SUCCESS,
            priority: 'normal'
        });
        
    } catch (error) {
        console.error('خطأ في حفظ إعدادات الإشعارات:', error);
        showSmartNotification({
            title: 'خطأ في الحفظ',
            message: 'فشل في حفظ الإعدادات',
            type: NOTIFICATION_TYPES.ERROR,
            priority: 'high'
        });
    }
}

function loadNotificationSettings() {
    try {
        const savedSettings = localStorage.getItem('charity_notification_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsedSettings };
        }
        
        const savedData = localStorage.getItem('charity_notification_data');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            notificationSystem = { ...notificationSystem, ...parsedData };
        }
        
        console.log('✅ تم تحميل إعدادات الإشعارات');
        
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الإشعارات:', error);
        currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
    }
}

function resetNotificationSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الإشعارات؟')) {
        currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
        notificationSystem = {
            notifications: [],
            reminders: [],
            appointments: [],
            tasks: [],
            history: []
        };
        
        updateSettingsForm();
        applyNotificationSettings();
        
        showSmartNotification({
            title: '🔄 تم إعادة التعيين',
            message: 'تم إعادة تعيين جميع الإعدادات للقيم الافتراضية',
            type: NOTIFICATION_TYPES.INFO,
            priority: 'normal'
        });
    }
}

// ==============================
// وظائف مساعدة
// ==============================
function updateSettingsForm() {
    // تحديث قيم النموذج مع الإعدادات الحالية
    const settings = [
        'setting-enabled', 'setting-browser', 'setting-sound', 'setting-vibration',
        'setting-auto-reminders', 'setting-repeat', 'setting-advance-time',
        'setting-volume', 'setting-sound-type', 'setting-position', 'setting-duration'
    ];
    
    settings.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const settingKey = id.replace('setting-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            
            if (element.type === 'checkbox') {
                element.checked = currentNotificationSettings[settingKey] || false;
            } else if (settingKey === 'duration') {
                element.value = (currentNotificationSettings.hideDelay || 5000) / 1000;
            } else {
                element.value = currentNotificationSettings[settingKey] || '';
            }
        }
    });
    
    applyNotificationSettings();
}

function getDefaultIcon(type) {
    const icons = {
        [NOTIFICATION_TYPES.INFO]: '💬',
        [NOTIFICATION_TYPES.SUCCESS]: '✅',
        [NOTIFICATION_TYPES.WARNING]: '⚠️',
        [NOTIFICATION_TYPES.ERROR]: '❌',
        [NOTIFICATION_TYPES.REMINDER]: '⏰',
        [NOTIFICATION_TYPES.APPOINTMENT]: '📅',
        [NOTIFICATION_TYPES.TASK]: '📋',
        [NOTIFICATION_TYPES.URGENT]: '🚨'
    };
    
    return icons[type] || '📢';
}

function formatNotificationTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // أقل من دقيقة
        return 'الآن';
    } else if (diff < 3600000) { // أقل من ساعة
        const minutes = Math.floor(diff / 60000);
        return `منذ ${minutes} دقيقة`;
    } else if (diff < 86400000) { // أقل من يوم
        const hours = Math.floor(diff / 3600000);
        return `منذ ${hours} ساعة`;
    } else {
        return date.toLocaleDateString('ar-EG');
    }
}

function playNotificationSound(type) {
    if (!currentNotificationSettings.soundNotifications) return;
    
    try {
        const soundConfig = NOTIFICATION_SOUNDS[currentNotificationSettings.notificationSound] || NOTIFICATION_SOUNDS.default;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (soundConfig.frequencies) {
            // صوت متعدد النغمات
            soundConfig.frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    playTone(audioContext, freq, soundConfig.duration / soundConfig.frequencies.length, soundConfig.type);
                }, index * (soundConfig.duration / soundConfig.frequencies.length));
            });
        } else {
            // صوت واحد
            const repeat = soundConfig.repeat || 1;
            for (let i = 0; i < repeat; i++) {
                setTimeout(() => {
                    playTone(audioContext, soundConfig.frequency, soundConfig.duration, soundConfig.type);
                }, i * (soundConfig.duration + 100));
            }
        }
        
    } catch (error) {
        console.log('لا يمكن تشغيل الصوت:', error);
    }
}

function playTone(audioContext, frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(currentNotificationSettings.soundVolume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

function showBrowserNotification(title, message, icon) {
    if (notificationPermission !== 'granted') return;
    
    try {
        const notification = new Notification(title, {
            body: message,
            icon: icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'charity-notification',
            requireInteraction: false,
            silent: true // نستخدم أصواتنا المخصصة
        });
        
        // إغلاق تلقائي بعد 5 ثوان
        setTimeout(() => {
            notification.close();
        }, 5000);
        
    } catch (error) {
        console.log('خطأ في إشعار المتصفح:', error);
    }
}

// ==============================
// إضافة الأزرار السريعة
// ==============================
function addQuickActionButtons() {
    // إضافة زر سريع لفتح لوحة التحكم
    const quickButton = document.createElement('div');
    quickButton.className = 'notification-quick-button';
    quickButton.innerHTML = '🔔';
    quickButton.title = 'مركز الإشعارات والتذكيرات';
    quickButton.onclick = openNotificationPanel;
    
    document.body.appendChild(quickButton);
    
    // إضافة اختصار لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            openNotificationPanel();
        }
    });
}

// ==============================
// وظائف الإجراءات السريعة
// ==============================
function createQuickReminder() {
    showAddReminderForm();
}

function scheduleAppointment() {
    showAddAppointmentForm();
}

function createUrgentAlert() {
    const message = prompt('اكتب رسالة التنبيه العاجل:');
    if (message) {
        showSmartNotification({
            title: '🚨 تنبيه عاجل',
            message: message,
            type: NOTIFICATION_TYPES.URGENT,
            priority: 'urgent',
            persistent: true,
            actions: [
                { text: 'تم الاطلاع', action: null }
            ]
        });
    }
}

function testNotificationSystem() {
    showSmartNotification({
        title: '🧪 اختبار النظام',
        message: 'هذا اختبار لنظام الإشعارات. جميع الميزات تعمل بشكل صحيح!',
        type: NOTIFICATION_TYPES.SUCCESS,
        priority: 'normal',
        actions: [
            { text: 'ممتاز!', action: null },
            { text: 'اختبار آخر', action: testNotificationSystem }
        ]
    });
}

function testNotificationSound() {
    playNotificationSound('test');
}

// ==============================
// إدارة البيانات
// ==============================
function saveNotificationData() {
    try {
        localStorage.setItem('charity_notification_data', JSON.stringify(notificationSystem));
    } catch (error) {
        console.error('خطأ في حفظ بيانات الإشعارات:', error);
    }
}

function exportNotificationData() {
    const exportData = {
        settings: currentNotificationSettings,
        data: notificationSystem,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `notification_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showSmartNotification({
        title: '📤 تم التصدير',
        message: 'تم تصدير بيانات الإشعارات بنجاح',
        type: NOTIFICATION_TYPES.SUCCESS,
        priority: 'normal'
    });
}

function importNotificationData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.settings) {
                    currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...importData.settings };
                }
                
                if (importData.data) {
                    notificationSystem = { ...notificationSystem, ...importData.data };
                }
                
                updateSettingsForm();
                saveNotificationData();
                
                showSmartNotification({
                    title: '📥 تم الاستيراد',
                    message: 'تم استيراد بيانات الإشعارات بنجاح',
                    type: NOTIFICATION_TYPES.SUCCESS,
                    priority: 'normal'
                });
                
            } catch (error) {
                console.error('خطأ في استيراد البيانات:', error);
                showSmartNotification({
                    title: 'خطأ في الاستيراد',
                    message: 'فشل في قراءة ملف البيانات',
                    type: NOTIFICATION_TYPES.ERROR,
                    priority: 'high'
                });
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================
// وظائف مساعدة إضافية
// ==============================
function addToNotificationHistory(notificationData) {
    notificationSystem.history.unshift(notificationData);
    
    // الاحتفاظ بآخر 100 إشعار فقط
    if (notificationSystem.history.length > currentNotificationSettings.maxHistoryItems) {
        notificationSystem.history = notificationSystem.history.slice(0, currentNotificationSettings.maxHistoryItems);
    }
    
    saveNotificationData();
}

function updateNotificationStatistics() {
    // تحديث إحصائيات لوحة التحكم
    const totalNotifications = notificationSystem.history.length;
    const activeReminders = notificationSystem.reminders.filter(r => r.status === 'active').length;
    const upcomingAppointments = notificationSystem.appointments.filter(a => new Date(a.datetime) > new Date()).length;
    const urgentItems = notificationSystem.history.filter(h => h.priority === 'urgent').length;
    
    updateElement('total-notifications', totalNotifications);
    updateElement('active-reminders', activeReminders);
    updateElement('upcoming-appointments', upcomingAppointments);
    updateElement('urgent-items', urgentItems);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupNotificationEventListeners() {
    // مراقبة تغييرات النظام الرئيسي
    document.addEventListener('DOMContentLoaded', () => {
        // تأخير قصير للتأكد من تحميل النظام الرئيسي
        setTimeout(() => {
            startSystemMonitoring();
        }, 2000);
    });
    
    // مراقبة تغيير الصفحة
    window.addEventListener('beforeunload', () => {
        saveNotificationData();
    });
}

function startSystemMonitoring() {
    console.log('🔍 بدء مراقبة النظام للتذكيرات التلقائية');
    
    // مراقبة دورية كل دقيقة
    setInterval(() => {
        checkForAutoReminders();
    }, 60000);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة للتأكد من تحميل الملف الرئيسي
    setTimeout(() => {
        initializeNotificationSystem();
    }, 1500);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.smartNotificationSystem = {
    show: showSmartNotification,
    hide: hideNotification,
    openPanel: openNotificationPanel,
    closePanel: closeNotificationPanel,
    scheduleReminder: scheduleReminder,
    test: testNotificationSystem,
    settings: currentNotificationSettings,
    data: notificationSystem,
    types: NOTIFICATION_TYPES
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('smart-notifications')) {
        console.error('خطأ في نظام الإشعارات الذكي:', e.error);
    }
});

console.log('🔔 تم تحميل نظام الإشعارات والتذكيرات الذكي بنجاح!');
console.log('💡 استخدم Ctrl+Shift+N لفتح مركز الإشعارات');
console.log('🚀 استخدم smartNotificationSystem للتحكم البرمجي');
