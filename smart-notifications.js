/**
 * نظام الإشعارات والتذكيرات الذكي المتكامل
 * ملف منفصل لإضافة نظام إشعارات شامل للنظام
 * يدعم الإشعارات المتعددة، التذكيرات، التقويم، والمتابعة
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="smart-notifications.js"></script>
 */

// ==============================
// إعدادات النظام الافتراضية
// ==============================
const DEFAULT_NOTIFICATION_SETTINGS = {
    // إعدادات الإشعارات العامة
    enableNotifications: true,
    enableBrowserNotifications: true,
    enableSounds: true,
    enableVibration: true,
    
    // إعدادات التذكيرات
    enableReminders: true,
    defaultReminderTime: 24, // ساعات قبل الموعد
    snoozeTime: 10, // دقائق للتأجيل
    maxReminders: 3, // عدد التذكيرات القصوى
    
    // إعدادات الصوت
    notificationSound: 'default',
    soundVolume: 0.7,
    customSoundEnabled: false,
    
    // إعدادات المظهر
    showNotificationPanel: true,
    animationDuration: 300,
    autoHideTimeout: 5000,
    maxVisibleNotifications: 5,
    
    // إعدادات التصنيف
    categoryColors: {
        'urgent': '#e74c3c',     // أحمر - عاجل
        'reminder': '#f39c12',   // برتقالي - تذكير
        'success': '#27ae60',    // أخضر - نجاح
        'info': '#3498db',       // أزرق - معلومات
        'warning': '#f1c40f',    // أصفر - تحذير
        'appointment': '#9b59b6', // بنفسجي - موعد
        'followup': '#1abc9c'    // تركوازي - متابعة
    },
    
    // إعدادات المهام
    enableTasks: true,
    taskAutoComplete: false,
    showTaskProgress: true,
    
    // إعدادات التقويم
    enableCalendar: true,
    calendarView: 'month', // month, week, day
    firstDayOfWeek: 0, // 0 = أحد, 1 = اثنين
    
    // إعدادات البريد الإلكتروني (محاكاة)
    enableEmailNotifications: false,
    emailTemplate: 'default',
    
    // إعدادات الفترات
    workingHours: {
        start: '08:00',
        end: '17:00',
        enabled: true
    },
    
    quietHours: {
        start: '22:00',
        end: '08:00',
        enabled: true
    }
};

// ==============================
// متغيرات النظام العامة
// ==============================
let currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
let notificationQueue = [];
let activeNotifications = new Map();
let remindersList = [];
let tasksList = [];
let calendarEvents = [];
let notificationPanel = null;
let notificationHistory = [];
let notificationWorker = null;

// معرفات فريدة
let notificationIdCounter = 1;
let reminderIdCounter = 1;
let taskIdCounter = 1;
let eventIdCounter = 1;

// مؤقتات النظام
let reminderCheckInterval = null;
let notificationCleanupInterval = null;
let autoSaveInterval = null;

// ==============================
// تهيئة النظام
// ==============================
function initializeNotificationSystem() {
    try {
        console.log('🔔 بدء تهيئة نظام الإشعارات الذكي...');
        
        // تحميل الإعدادات والبيانات المحفوظة
        loadNotificationData();
        
        // طلب أذونات الإشعارات
        requestNotificationPermissions();
        
        // إنشاء واجهة الإشعارات
        createNotificationUI();
        
        // بدء خدمات النظام
        startNotificationServices();
        
        // إعداد مستمعي الأحداث
        setupNotificationEventListeners();
        
        // بدء الحفظ التلقائي
        startAutoSave();
        
        // إشعار نجاح التهيئة
        showNotification({
            title: '🔔 نظام الإشعارات جاهز',
            message: 'تم تهيئة نظام الإشعارات والتذكيرات بنجاح',
            category: 'success',
            priority: 'normal'
        });
        
        console.log('✅ تم تهيئة نظام الإشعارات بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة نظام الإشعارات:', error);
        showNotification({
            title: '❌ خطأ في النظام',
            message: 'فشل في تهيئة نظام الإشعارات',
            category: 'urgent',
            priority: 'high'
        });
    }
}

// ==============================
// طلب أذونات الإشعارات
// ==============================
async function requestNotificationPermissions() {
    if (!currentNotificationSettings.enableBrowserNotifications) {
        return false;
    }
    
    if (!('Notification' in window)) {
        console.warn('هذا المتصفح لا يدعم إشعارات المتصفح');
        return false;
    }
    
    try {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showNotification({
                    title: '✅ تم منح الأذونات',
                    message: 'يمكنك الآن تلقي إشعارات المتصفح',
                    category: 'success',
                    priority: 'normal'
                });
                return true;
            } else {
                showNotification({
                    title: '⚠️ لم يتم منح الأذونات',
                    message: 'لن تتلقى إشعارات المتصفح',
                    category: 'warning',
                    priority: 'normal'
                });
                return false;
            }
        }
        
        return Notification.permission === 'granted';
        
    } catch (error) {
        console.error('خطأ في طلب أذونات الإشعارات:', error);
        return false;
    }
}

// ==============================
// إنشاء واجهة الإشعارات
// ==============================
function createNotificationUI() {
    // إنشاء حاوية الإشعارات العائمة
    createFloatingNotificationContainer();
    
    // إنشاء لوحة الإشعارات الجانبية
    createNotificationPanel();
    
    // إنشاء نافذة إدارة التذكيرات
    createReminderManagementModal();
    
    // إنشاء نافذة إدارة المهام
    createTaskManagementModal();
    
    // إنشاء نافذة التقويم
    createCalendarModal();
    
    // إنشاء لوحة التحكم في الإعدادات
    createNotificationSettingsPanel();
    
    // إضافة أيقونة الإشعارات للشريط العلوي
    addNotificationIconToHeader();
    
    // إضافة الأنماط
    addNotificationStyles();
}

// ==============================
// إنشاء حاوية الإشعارات العائمة
// ==============================
function createFloatingNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    
    document.body.appendChild(container);
}

// ==============================
// إنشاء لوحة الإشعارات الجانبية
// ==============================
function createNotificationPanel() {
    const panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.innerHTML = `
        <div class="notification-panel-overlay">
            <div class="notification-panel-container">
                <div class="notification-panel-header">
                    <h3>🔔 مركز الإشعارات</h3>
                    <div class="notification-panel-actions">
                        <button class="notification-action-btn" onclick="markAllAsRead()" title="تحديد الكل كمقروء">
                            <i class="fas fa-check-double"></i>
                        </button>
                        <button class="notification-action-btn" onclick="clearAllNotifications()" title="مسح الكل">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="notification-action-btn" onclick="showNotificationSettings()" title="الإعدادات">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="notification-close-btn" onclick="closeNotificationPanel()">✕</button>
                    </div>
                </div>
                
                <div class="notification-panel-tabs">
                    <button class="notification-tab active" onclick="showNotificationTab('all')">الكل</button>
                    <button class="notification-tab" onclick="showNotificationTab('unread')">غير مقروء</button>
                    <button class="notification-tab" onclick="showNotificationTab('reminders')">التذكيرات</button>
                    <button class="notification-tab" onclick="showNotificationTab('tasks')">المهام</button>
                </div>
                
                <div class="notification-panel-content">
                    <div class="notification-tab-content active" id="all-notifications">
                        <div id="all-notifications-list" class="notifications-list"></div>
                    </div>
                    
                    <div class="notification-tab-content" id="unread-notifications">
                        <div id="unread-notifications-list" class="notifications-list"></div>
                    </div>
                    
                    <div class="notification-tab-content" id="reminders-notifications">
                        <div id="reminders-list" class="notifications-list"></div>
                    </div>
                    
                    <div class="notification-tab-content" id="tasks-notifications">
                        <div id="tasks-list" class="notifications-list"></div>
                    </div>
                </div>
                
                <div class="notification-panel-footer">
                    <button class="notification-btn primary" onclick="showAddReminderModal()">
                        <i class="fas fa-plus"></i> تذكير جديد
                    </button>
                    <button class="notification-btn secondary" onclick="showAddTaskModal()">
                        <i class="fas fa-tasks"></i> مهمة جديدة
                    </button>
                    <button class="notification-btn info" onclick="showCalendarModal()">
                        <i class="fas fa-calendar"></i> التقويم
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    notificationPanel = panel;
}

// ==============================
// إضافة أيقونة الإشعارات للشريط العلوي
// ==============================
function addNotificationIconToHeader() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    const notificationIcon = document.createElement('div');
    notificationIcon.className = 'notification-icon-container';
    notificationIcon.innerHTML = `
        <button class="notification-icon-btn" onclick="toggleNotificationPanel()" title="الإشعارات">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" id="notification-badge">0</span>
        </button>
    `;
    
    // إدراج الأيقونة قبل معلومات المستخدم
    headerActions.insertBefore(notificationIcon, headerActions.firstChild);
}

// ==============================
// إنشاء الأنماط
// ==============================
function addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
        /* حاوية الإشعارات العائمة */
        .notification-container {
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
            max-width: 400px;
            width: 100%;
        }
        
        /* الإشعار المفرد */
        .notification-item {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin-bottom: 12px;
            padding: 16px;
            border-left: 4px solid #3498db;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }
        
        .notification-item.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification-item.urgent {
            border-left-color: #e74c3c;
            animation: urgentPulse 1s infinite;
        }
        
        .notification-item.reminder {
            border-left-color: #f39c12;
        }
        
        .notification-item.success {
            border-left-color: #27ae60;
        }
        
        .notification-item.warning {
            border-left-color: #f1c40f;
        }
        
        .notification-item.appointment {
            border-left-color: #9b59b6;
        }
        
        .notification-item.followup {
            border-left-color: #1abc9c;
        }
        
        @keyframes urgentPulse {
            0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); }
            50% { box-shadow: 0 8px 32px rgba(231, 76, 60, 0.3); }
        }
        
        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 14px;
            color: #2c3e50;
            margin-bottom: 4px;
            line-height: 1.3;
            flex: 1;
        }
        
        .notification-time {
            font-size: 11px;
            color: #7f8c8d;
            white-space: nowrap;
            margin-left: 8px;
        }
        
        .notification-message {
            font-size: 13px;
            color: #34495e;
            line-height: 1.4;
            margin-bottom: 12px;
        }
        
        .notification-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }
        
        .notification-action {
            background: none;
            border: 1px solid #bdc3c7;
            color: #34495e;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .notification-action:hover {
            background: #ecf0f1;
        }
        
        .notification-action.primary {
            background: #3498db;
            color: white;
            border-color: #3498db;
        }
        
        .notification-action.primary:hover {
            background: #2980b9;
        }
        
        .notification-close {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #bdc3c7;
            cursor: pointer;
            font-size: 16px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        
        .notification-close:hover {
            color: #e74c3c;
        }
        
        /* أيقونة الإشعارات في الشريط العلوي */
        .notification-icon-container {
            position: relative;
        }
        
        .notification-icon-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        }
        
        .notification-icon-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }
        
        .notification-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            min-width: 18px;
        }
        
        .notification-badge.hidden {
            display: none;
        }
        
        .notification-badge.pulse {
            animation: badgePulse 1s infinite;
        }
        
        @keyframes badgePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        /* لوحة الإشعارات الجانبية */
        .notification-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: none;
            backdrop-filter: blur(4px);
        }
        
        .notification-panel-overlay.show {
            display: block;
        }
        
        .notification-panel-container {
            position: absolute;
            right: 0;
            top: 0;
            width: 400px;
            max-width: 90vw;
            height: 100vh;
            background: white;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        }
        
        .notification-panel-overlay.show .notification-panel-container {
            transform: translateX(0);
        }
        
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
            font-size: 18px;
            font-weight: 600;
        }
        
        .notification-panel-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .notification-action-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .notification-action-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .notification-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 0.2s;
        }
        
        .notification-close-btn:hover {
            background: rgba(231, 76, 60, 0.8);
        }
        
        .notification-panel-tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .notification-tab {
            flex: 1;
            background: none;
            border: none;
            padding: 12px 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
        }
        
        .notification-tab:hover {
            background: #e9ecef;
            color: #495057;
        }
        
        .notification-tab.active {
            color: #3498db;
            border-bottom-color: #3498db;
            background: white;
        }
        
        .notification-panel-content {
            flex: 1;
            overflow-y: auto;
        }
        
        .notification-tab-content {
            display: none;
            height: 100%;
        }
        
        .notification-tab-content.active {
            display: block;
        }
        
        .notifications-list {
            padding: 16px;
        }
        
        .notification-list-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        }
        
        .notification-list-item:hover {
            background: #f8f9fa;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .notification-list-item.unread {
            border-left: 4px solid #3498db;
            background: #f8f9ff;
        }
        
        .notification-list-item.urgent {
            border-left: 4px solid #e74c3c;
            background: #fff5f5;
        }
        
        .notification-list-title {
            font-weight: 600;
            font-size: 13px;
            color: #2c3e50;
            margin-bottom: 4px;
        }
        
        .notification-list-message {
            font-size: 12px;
            color: #34495e;
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .notification-list-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #7f8c8d;
        }
        
        .notification-list-category {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 500;
        }
        
        .notification-panel-footer {
            background: #f8f9fa;
            padding: 16px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 8px;
        }
        
        .notification-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            justify-content: center;
        }
        
        .notification-btn:hover {
            background: #2980b9;
        }
        
        .notification-btn.secondary {
            background: #95a5a6;
        }
        
        .notification-btn.secondary:hover {
            background: #7f8c8d;
        }
        
        .notification-btn.info {
            background: #1abc9c;
        }
        
        .notification-btn.info:hover {
            background: #16a085;
        }
        
        /* حالة فارغة */
        .notification-empty {
            text-align: center;
            padding: 40px 20px;
            color: #7f8c8d;
        }
        
        .notification-empty i {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        
        .notification-empty p {
            font-size: 14px;
            margin: 0;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .notification-container {
                right: 10px;
                left: 10px;
                max-width: none;
            }
            
            .notification-panel-container {
                width: 100vw;
                max-width: 100vw;
            }
            
            .notification-item {
                margin-bottom: 8px;
                padding: 12px;
            }
            
            .notification-title {
                font-size: 13px;
            }
            
            .notification-message {
                font-size: 12px;
            }
            
            .notification-panel-footer {
                flex-direction: column;
            }
            
            .notification-btn {
                justify-content: center;
            }
        }
        
        /* تأثيرات إضافية */
        .notification-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.5), transparent);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .notification-item.priority-high {
            border-left-width: 6px;
            background: linear-gradient(135deg, #fff, #fff8f8);
        }
        
        .notification-progress {
            height: 2px;
            background: #ecf0f1;
            border-radius: 1px;
            overflow: hidden;
            margin-top: 8px;
        }
        
        .notification-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2980b9);
            border-radius: 1px;
            transition: width 0.3s ease;
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// إظهار الإشعارات
// ==============================
function showNotification(options) {
    const notification = {
        id: generateNotificationId(),
        title: options.title || 'إشعار',
        message: options.message || '',
        category: options.category || 'info',
        priority: options.priority || 'normal',
        timestamp: new Date(),
        read: false,
        actions: options.actions || [],
        data: options.data || {},
        autoHide: options.autoHide !== false,
        sound: options.sound !== false,
        persistent: options.persistent || false
    };
    
    // إضافة للقائمة والتاريخ
    activeNotifications.set(notification.id, notification);
    notificationHistory.push(notification);
    
    // إنشاء الإشعار البصري
    createVisualNotification(notification);
    
    // إشعار المتصفح
    if (currentNotificationSettings.enableBrowserNotifications) {
        createBrowserNotification(notification);
    }
    
    // تشغيل الصوت
    if (currentNotificationSettings.enableSounds && notification.sound) {
        playNotificationSound(notification.category);
    }
    
    // الاهتزاز
    if (currentNotificationSettings.enableVibration && navigator.vibrate) {
        const pattern = getVibrationPattern(notification.priority);
        navigator.vibrate(pattern);
    }
    
    // تحديث العدادات
    updateNotificationBadge();
    updateNotificationPanel();
    
    // حفظ تلقائي
    saveNotificationData();
    
    return notification.id;
}

// ==============================
// إنشاء الإشعار البصري
// ==============================
function createVisualNotification(notification) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notification.category}`;
    notificationElement.id = `notification-${notification.id}`;
    
    if (notification.priority === 'high') {
        notificationElement.classList.add('priority-high');
    }
    
    notificationElement.innerHTML = `
        <button class="notification-close" onclick="dismissNotification('${notification.id}')">×</button>
        <div class="notification-header">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
        </div>
        <div class="notification-message">${notification.message}</div>
        ${notification.actions.length > 0 ? `
            <div class="notification-actions">
                ${notification.actions.map(action => `
                    <button class="notification-action ${action.class || ''}" 
                            onclick="executeNotificationAction('${notification.id}', '${action.id}')">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        ` : ''}
        ${notification.persistent ? '<div class="notification-progress"><div class="notification-progress-bar" style="width: 100%"></div></div>' : ''}
    `;
    
    container.appendChild(notificationElement);
    
    // تأثير الظهور
    setTimeout(() => {
        notificationElement.classList.add('show');
    }, 100);
    
    // إخفاء تلقائي
    if (notification.autoHide && !notification.persistent) {
        setTimeout(() => {
            dismissNotification(notification.id);
        }, currentNotificationSettings.autoHideTimeout);
    }
    
    // تحديد عدد الإشعارات المرئية
    limitVisibleNotifications();
}

// ==============================
// إشعار المتصفح
// ==============================
function createBrowserNotification(notification) {
    if (Notification.permission !== 'granted') return;
    
    try {
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: getNotificationIcon(notification.category),
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
            silent: !currentNotificationSettings.enableSounds
        });
        
        browserNotification.onclick = function() {
            window.focus();
            toggleNotificationPanel();
            this.close();
        };
        
        // إغلاق تلقائي
        setTimeout(() => {
            browserNotification.close();
        }, 5000);
        
    } catch (error) {
        console.error('خطأ في إنشاء إشعار المتصفح:', error);
    }
}

// ==============================
// النظام الصوتي للإشعارات
// ==============================
function playNotificationSound(category) {
    if (!currentNotificationSettings.enableSounds) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // أصوات مختلفة حسب الفئة
        const soundFrequencies = {
            urgent: [800, 1000, 800],
            reminder: [600, 800],
            success: [800, 1200],
            warning: [400, 600],
            info: [600],
            appointment: [900, 700],
            followup: [700, 900, 700]
        };
        
        const frequencies = soundFrequencies[category] || soundFrequencies.info;
        
        let currentTime = audioContext.currentTime;
        
        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(currentNotificationSettings.soundVolume * 0.3, currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
            
            osc.start(currentTime);
            osc.stop(currentTime + 0.2);
            
            currentTime += 0.25;
        });
        
    } catch (error) {
        console.log('لا يمكن تشغيل الصوت:', error);
    }
}

// ==============================
// نظام التذكيرات
// ==============================
function addReminder(options) {
    const reminder = {
        id: generateReminderId(),
        title: options.title || 'تذكير',
        description: options.description || '',
        dateTime: new Date(options.dateTime),
        category: options.category || 'reminder',
        repeatType: options.repeatType || 'none', // none, daily, weekly, monthly, yearly
        isActive: true,
        notificationsSent: 0,
        maxNotifications: currentNotificationSettings.maxReminders,
        reminderTimes: options.reminderTimes || [24, 1, 0], // ساعات قبل الموعد
        associatedCaseId: options.caseId || null,
        createdAt: new Date(),
        lastTriggered: null
    };
    
    remindersList.push(reminder);
    updateNotificationPanel();
    saveNotificationData();
    
    showNotification({
        title: '✅ تم إضافة التذكير',
        message: `تذكير: ${reminder.title} في ${formatDateTime(reminder.dateTime)}`,
        category: 'success',
        autoHide: true
    });
    
    return reminder.id;
}

function checkReminders() {
    const now = new Date();
    
    remindersList.forEach(reminder => {
        if (!reminder.isActive) return;
        
        const timeDiff = reminder.dateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        reminder.reminderTimes.forEach(hours => {
            // تحقق من وقت التذكير
            if (Math.abs(hoursDiff - hours) < 0.1 && reminder.notificationsSent < reminder.maxNotifications) {
                triggerReminder(reminder, hours);
            }
        });
        
        // تحقق من التكرار
        if (timeDiff < 0 && reminder.repeatType !== 'none') {
            scheduleNextRepeat(reminder);
        }
    });
}

function triggerReminder(reminder, hoursBefor) {
    let message = '';
    
    if (hoursBefor === 0) {
        message = `حان وقت: ${reminder.title}`;
    } else if (hoursBefor === 1) {
        message = `تذكير: ${reminder.title} خلال ساعة واحدة`;
    } else if (hoursBefor < 24) {
        message = `تذكير: ${reminder.title} خلال ${hoursBefor} ساعة`;
    } else {
        const days = Math.floor(hoursBefor / 24);
        message = `تذكير: ${reminder.title} خلال ${days} يوم`;
    }
    
    showNotification({
        title: '⏰ تذكير هام',
        message: message,
        category: 'reminder',
        priority: hoursBefor === 0 ? 'high' : 'normal',
        persistent: hoursBefor === 0,
        actions: [
            {
                id: 'snooze',
                label: 'تأجيل',
                class: 'secondary'
            },
            {
                id: 'complete',
                label: 'تم',
                class: 'primary'
            }
        ],
        data: { reminderId: reminder.id, hoursBefor }
    });
    
    reminder.notificationsSent++;
    reminder.lastTriggered = new Date();
    
    saveNotificationData();
}

// ==============================
// نظام المهام
// ==============================
function addTask(options) {
    const task = {
        id: generateTaskId(),
        title: options.title || 'مهمة جديدة',
        description: options.description || '',
        priority: options.priority || 'normal', // low, normal, high, urgent
        status: 'pending', // pending, in-progress, completed, cancelled
        dueDate: options.dueDate ? new Date(options.dueDate) : null,
        category: options.category || 'task',
        assignedTo: options.assignedTo || 'أبو كرار',
        associatedCaseId: options.caseId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        progress: 0,
        subtasks: options.subtasks || [],
        tags: options.tags || []
    };
    
    tasksList.push(task);
    updateNotificationPanel();
    saveNotificationData();
    
    showNotification({
        title: '📋 مهمة جديدة',
        message: `تم إضافة مهمة: ${task.title}`,
        category: 'info',
        actions: [
            {
                id: 'view-task',
                label: 'عرض',
                class: 'primary'
            }
        ],
        data: { taskId: task.id }
    });
    
    return task.id;
}

function updateTaskStatus(taskId, newStatus, progress = null) {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return false;
    
    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date();
    
    if (progress !== null) {
        task.progress = Math.max(0, Math.min(100, progress));
    }
    
    if (newStatus === 'completed') {
        task.completedAt = new Date();
        task.progress = 100;
        
        showNotification({
            title: '✅ تم إنجاز المهمة',
            message: `تم إنجاز: ${task.title}`,
            category: 'success',
            autoHide: true
        });
    }
    
    updateNotificationPanel();
    saveNotificationData();
    
    return true;
}

// ==============================
// إدارة أحداث الإشعارات
// ==============================
function executeNotificationAction(notificationId, actionId) {
    const notification = activeNotifications.get(notificationId);
    if (!notification) return;
    
    switch (actionId) {
        case 'snooze':
            snoozeReminder(notification.data.reminderId);
            break;
        case 'complete':
            completeReminder(notification.data.reminderId);
            break;
        case 'view-task':
            viewTask(notification.data.taskId);
            break;
        case 'view-case':
            viewCase(notification.data.caseId);
            break;
        default:
            console.log('تنفيذ إجراء:', actionId);
    }
    
    dismissNotification(notificationId);
}

function dismissNotification(notificationId) {
    const notificationElement = document.getElementById(`notification-${notificationId}`);
    if (notificationElement) {
        notificationElement.classList.remove('show');
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.parentNode.removeChild(notificationElement);
            }
        }, 300);
    }
    
    // تحديث البيانات
    const notification = activeNotifications.get(notificationId);
    if (notification) {
        notification.read = true;
        activeNotifications.delete(notificationId);
    }
    
    updateNotificationBadge();
    updateNotificationPanel();
    saveNotificationData();
}

// ==============================
// واجهة لوحة الإشعارات
// ==============================
function toggleNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    
    const overlay = panel.querySelector('.notification-panel-overlay');
    
    if (overlay.classList.contains('show')) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

function openNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    
    const overlay = panel.querySelector('.notification-panel-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    updateNotificationPanel();
}

function closeNotificationPanel() {
    const panel = document.getElementById('notification-panel');
    if (!panel) return;
    
    const overlay = panel.querySelector('.notification-panel-overlay');
    overlay.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function showNotificationTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.notification-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    event.target.classList.add('active');
    
    const contentId = tabName === 'all' ? 'all-notifications' :
                     tabName === 'unread' ? 'unread-notifications' :
                     tabName === 'reminders' ? 'reminders-notifications' :
                     'tasks-notifications';
    
    document.getElementById(contentId).classList.add('active');
    
    updateNotificationPanelContent(tabName);
}

function updateNotificationPanel() {
    updateNotificationPanelContent('all');
    updateNotificationPanelContent('unread');
    updateNotificationPanelContent('reminders');
    updateNotificationPanelContent('tasks');
}

function updateNotificationPanelContent(type) {
    let targetList, items;
    
    switch (type) {
        case 'all':
            targetList = document.getElementById('all-notifications-list');
            items = notificationHistory.slice().reverse();
            break;
        case 'unread':
            targetList = document.getElementById('unread-notifications-list');
            items = notificationHistory.filter(n => !n.read).reverse();
            break;
        case 'reminders':
            targetList = document.getElementById('reminders-list');
            items = remindersList.filter(r => r.isActive);
            break;
        case 'tasks':
            targetList = document.getElementById('tasks-list');
            items = tasksList.filter(t => t.status !== 'completed');
            break;
        default:
            return;
    }
    
    if (!targetList) return;
    
    if (items.length === 0) {
        targetList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-inbox"></i>
                <p>لا توجد عناصر</p>
            </div>
        `;
        return;
    }
    
    if (type === 'reminders') {
        targetList.innerHTML = items.map(reminder => `
            <div class="notification-list-item ${!reminder.isActive ? 'read' : 'unread'}" onclick="editReminder('${reminder.id}')">
                <div class="notification-list-title">⏰ ${reminder.title}</div>
                <div class="notification-list-message">${reminder.description}</div>
                <div class="notification-list-meta">
                    <span>${formatDateTime(reminder.dateTime)}</span>
                    <span class="notification-list-category">${reminder.category}</span>
                </div>
            </div>
        `).join('');
    } else if (type === 'tasks') {
        targetList.innerHTML = items.map(task => `
            <div class="notification-list-item ${task.priority === 'urgent' ? 'urgent' : ''}" onclick="editTask('${task.id}')">
                <div class="notification-list-title">📋 ${task.title}</div>
                <div class="notification-list-message">${task.description}</div>
                <div class="notification-list-meta">
                    <span>الحالة: ${getTaskStatusLabel(task.status)}</span>
                    <span class="notification-list-category">${task.priority}</span>
                </div>
                ${task.progress > 0 ? `
                    <div class="notification-progress">
                        <div class="notification-progress-bar" style="width: ${task.progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } else {
        targetList.innerHTML = items.map(notification => `
            <div class="notification-list-item ${notification.read ? 'read' : 'unread'}" onclick="markAsRead('${notification.id}')">
                <div class="notification-list-title">${notification.title}</div>
                <div class="notification-list-message">${notification.message}</div>
                <div class="notification-list-meta">
                    <span>${formatTimeAgo(notification.timestamp)}</span>
                    <span class="notification-list-category">${notification.category}</span>
                </div>
            </div>
        `).join('');
    }
}

// ==============================
// تحديث شارة العداد
// ==============================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    const unreadCount = notificationHistory.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
        
        if (unreadCount > 0 && hasUrgentNotifications()) {
            badge.classList.add('pulse');
        } else {
            badge.classList.remove('pulse');
        }
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('pulse');
    }
}

// ==============================
// خدمات النظام
// ==============================
function startNotificationServices() {
    // فحص التذكيرات كل دقيقة
    reminderCheckInterval = setInterval(checkReminders, 60000);
    
    // تنظيف الإشعارات القديمة كل ساعة
    notificationCleanupInterval = setInterval(cleanupOldNotifications, 3600000);
    
    // فحص المهام المتأخرة كل 30 دقيقة
    setInterval(checkOverdueTasks, 1800000);
    
    console.log('✅ تم بدء خدمات الإشعارات');
}

function cleanupOldNotifications() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // أسبوع
    const now = new Date().getTime();
    
    notificationHistory = notificationHistory.filter(notification => {
        return (now - notification.timestamp.getTime()) < maxAge;
    });
    
    // حفظ البيانات المنظفة
    saveNotificationData();
    
    console.log('🧹 تم تنظيف الإشعارات القديمة');
}

function checkOverdueTasks() {
    const now = new Date();
    
    tasksList.forEach(task => {
        if (task.dueDate && task.status === 'pending' && task.dueDate < now) {
            showNotification({
                title: '⚠️ مهمة متأخرة',
                message: `المهمة "${task.title}" متأخرة عن موعدها`,
                category: 'warning',
                priority: 'high',
                actions: [
                    {
                        id: 'view-task',
                        label: 'عرض المهمة',
                        class: 'primary'
                    }
                ],
                data: { taskId: task.id }
            });
        }
    });
}

// ==============================
// حفظ وتحميل البيانات
// ==============================
function saveNotificationData() {
    try {
        const data = {
            settings: currentNotificationSettings,
            history: notificationHistory.slice(-100), // آخر 100 إشعار
            reminders: remindersList,
            tasks: tasksList,
            events: calendarEvents,
            lastSaved: new Date().toISOString(),
            version: '1.0.0'
        };
        
        localStorage.setItem('charity_notifications', JSON.stringify(data));
        console.log('💾 تم حفظ بيانات الإشعارات');
        
    } catch (error) {
        console.error('❌ خطأ في حفظ بيانات الإشعارات:', error);
    }
}

function loadNotificationData() {
    try {
        const savedData = localStorage.getItem('charity_notifications');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            if (data.settings) {
                currentNotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...data.settings };
            }
            
            if (data.history) {
                notificationHistory = data.history.map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
            
            if (data.reminders) {
                remindersList = data.reminders.map(item => ({
                    ...item,
                    dateTime: new Date(item.dateTime),
                    createdAt: new Date(item.createdAt),
                    lastTriggered: item.lastTriggered ? new Date(item.lastTriggered) : null
                }));
            }
            
            if (data.tasks) {
                tasksList = data.tasks.map(item => ({
                    ...item,
                    createdAt: new Date(item.createdAt),
                    updatedAt: new Date(item.updatedAt),
                    dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    completedAt: item.completedAt ? new Date(item.completedAt) : null
                }));
            }
            
            if (data.events) {
                calendarEvents = data.events;
            }
            
            console.log('📥 تم تحميل بيانات الإشعارات');
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات الإشعارات:', error);
    }
}

function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        saveNotificationData();
    }, 30000); // حفظ كل 30 ثانية
    
    console.log('🔄 تم بدء الحفظ التلقائي');
}

// ==============================
// وظائف مساعدة
// ==============================
function generateNotificationId() {
    return 'notif_' + Date.now() + '_' + (notificationIdCounter++);
}

function generateReminderId() {
    return 'reminder_' + Date.now() + '_' + (reminderIdCounter++);
}

function generateTaskId() {
    return 'task_' + Date.now() + '_' + (taskIdCounter++);
}

function generateEventId() {
    return 'event_' + Date.now() + '_' + (eventIdCounter++);
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-EG');
}

function formatDateTime(date) {
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getNotificationIcon(category) {
    const icons = {
        urgent: '🚨',
        reminder: '⏰',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
        appointment: '📅',
        followup: '📋'
    };
    
    return icons[category] || icons.info;
}

function getVibrationPattern(priority) {
    const patterns = {
        low: [100],
        normal: [100, 50, 100],
        high: [200, 100, 200, 100, 200],
        urgent: [300, 100, 300, 100, 300, 100, 300]
    };
    
    return patterns[priority] || patterns.normal;
}

function getTaskStatusLabel(status) {
    const labels = {
        pending: 'معلقة',
        'in-progress': 'قيد التنفيذ',
        completed: 'مكتملة',
        cancelled: 'ملغية'
    };
    
    return labels[status] || status;
}

function hasUrgentNotifications() {
    return notificationHistory.some(n => !n.read && (n.category === 'urgent' || n.priority === 'high'));
}

function limitVisibleNotifications() {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notifications = container.querySelectorAll('.notification-item');
    const maxVisible = currentNotificationSettings.maxVisibleNotifications;
    
    if (notifications.length > maxVisible) {
        for (let i = maxVisible; i < notifications.length; i++) {
            notifications[i].remove();
        }
    }
}

// ==============================
// وظائف إضافية للإدارة
// ==============================
function markAllAsRead() {
    notificationHistory.forEach(notification => {
        notification.read = true;
    });
    
    updateNotificationBadge();
    updateNotificationPanel();
    saveNotificationData();
    
    showNotification({
        title: '✅ تم تحديد الكل كمقروء',
        message: 'تم تحديد جميع الإشعارات كمقروءة',
        category: 'success',
        autoHide: true
    });
}

function clearAllNotifications() {
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
        notificationHistory = [];
        activeNotifications.clear();
        
        // مسح الإشعارات المرئية
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        
        updateNotificationBadge();
        updateNotificationPanel();
        saveNotificationData();
        
        showNotification({
            title: '🗑️ تم مسح الإشعارات',
            message: 'تم حذف جميع الإشعارات',
            category: 'info',
            autoHide: true
        });
    }
}

function markAsRead(notificationId) {
    const notification = notificationHistory.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        updateNotificationBadge();
        updateNotificationPanel();
        saveNotificationData();
    }
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupNotificationEventListeners() {
    // مستمع للنقر خارج اللوحة لإغلاقها
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('notification-panel');
        const notificationIcon = document.querySelector('.notification-icon-btn');
        
        if (panel && panel.querySelector('.notification-panel-overlay').classList.contains('show')) {
            if (!panel.contains(e.target) && !notificationIcon.contains(e.target)) {
                closeNotificationPanel();
            }
        }
    });
    
    // مستمع اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Ctrl + Shift + N لفتح لوحة الإشعارات
        if (e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            toggleNotificationPanel();
        }
        
        // Escape لإغلاق لوحة الإشعارات
        if (e.key === 'Escape') {
            closeNotificationPanel();
        }
    });
    
    // مستمع تغيير الصفحة لإضافة إشعارات جديدة
    document.addEventListener('click', function(e) {
        // مراقبة تغيير الأقسام لإضافة إشعارات ذات صلة
        if (e.target.classList.contains('nav-item')) {
            setTimeout(() => {
                checkSectionNotifications();
            }, 1000);
        }
    });
    
    // مراقبة تغيير وضع الصفحة (مرئية/مخفية)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // الصفحة مخفية - يمكن تجميع الإشعارات
            console.log('الصفحة مخفية - وضع الإشعارات الهادئ');
        } else {
            // الصفحة مرئية - إظهار الإشعارات المتراكمة
            console.log('الصفحة مرئية - إظهار الإشعارات');
        }
    });
}

// فحص إشعارات القسم الحالي
function checkSectionNotifications() {
    // يمكن إضافة لوجيك لإشعارات خاصة بكل قسم
    console.log('فحص إشعارات القسم الحالي');
}

// ==============================
// إنشاء النوافذ المنبثقة الإضافية
// ==============================
function createReminderManagementModal() {
    // سيتم إضافتها في التحديث القادم
    console.log('إنشاء نافذة إدارة التذكيرات');
}

function createTaskManagementModal() {
    // سيتم إضافتها في التحديث القادم
    console.log('إنشاء نافذة إدارة المهام');
}

function createCalendarModal() {
    // سيتم إضافتها في التحديث القادم
    console.log('إنشاء نافذة التقويم');
}

function createNotificationSettingsPanel() {
    // سيتم إضافتها في التحديث القادم
    console.log('إنشاء لوحة إعدادات الإشعارات');
}

// ==============================
// وظائف النوافذ المنبثقة
// ==============================
function showAddReminderModal() {
    alert('قريباً: نافذة إضافة تذكير جديد');
}

function showAddTaskModal() {
    alert('قريباً: نافذة إضافة مهمة جديدة');
}

function showCalendarModal() {
    alert('قريباً: نافذة التقويم');
}

function showNotificationSettings() {
    alert('قريباً: إعدادات الإشعارات المتقدمة');
}

function editReminder(reminderId) {
    alert('قريباً: تحرير التذكير');
}

function editTask(taskId) {
    alert('قريباً: تحرير المهمة');
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير قصير للتأكد من تحميل الملف الرئيسي
    setTimeout(() => {
        initializeNotificationSystem();
    }, 2000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.notificationSystem = {
    // الوظائف الأساسية
    show: showNotification,
    dismiss: dismissNotification,
    togglePanel: toggleNotificationPanel,
    
    // إدارة التذكيرات
    addReminder: addReminder,
    checkReminders: checkReminders,
    
    // إدارة المهام
    addTask: addTask,
    updateTask: updateTaskStatus,
    
    // الإعدادات
    settings: currentNotificationSettings,
    
    // الإحصائيات
    getStats: () => ({
        totalNotifications: notificationHistory.length,
        unreadCount: notificationHistory.filter(n => !n.read).length,
        activeReminders: remindersList.filter(r => r.isActive).length,
        pendingTasks: tasksList.filter(t => t.status === 'pending').length
    }),
    
    // أدوات المطورين
    debug: () => ({
        notifications: notificationHistory,
        reminders: remindersList,
        tasks: tasksList,
        settings: currentNotificationSettings
    })
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('smart-notifications')) {
        console.error('خطأ في نظام الإشعارات:', e.error);
        
        // إشعار خطأ للمطور
        if (window.notificationSystem) {
            showNotification({
                title: '⚠️ خطأ في النظام',
                message: 'حدث خطأ في نظام الإشعارات',
                category: 'warning',
                priority: 'normal'
            });
        }
    }
});

// معالج إغلاق النافذة
window.addEventListener('beforeunload', function() {
    saveNotificationData();
});

// رسالة في وحدة التحكم
console.log(`
🔔 نظام الإشعارات والتذكيرات الذكي
📋 الإصدار: 1.0.0
⚡ تم التحميل بنجاح
🎯 استخدم notificationSystem للتحكم البرمجي
⌨️ Ctrl+Shift+N لفتح لوحة الإشعارات
`);
