/**
 * نظام الإدخال الصوتي المتكامل
 * ملف منفصل لإضافة إدخال البيانات بالصوت لجميع حقول النظام
 * يستخدم Web Speech API مع دعم كامل للغة العربية
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="voice-input.js"></script>
 */

// ==============================
// إعدادات النظام الصوتي الافتراضية
// ==============================
const DEFAULT_VOICE_SETTINGS = {
    // إعدادات التعرف على الصوت
    language: 'ar-SA', // اللغة الافتراضية (العربية السعودية)
    continuous: false, // التسجيل المستمر
    interimResults: true, // النتائج المؤقتة
    maxAlternatives: 3, // عدد البدائل
    
    // إعدادات الواجهة
    showMicButton: true, // إظهار أزرار المايكروفون
    buttonSize: 'normal', // حجم الأزرار (small, normal, large)
    buttonPosition: 'right', // موقع الأزرار (left, right)
    showPanel: true, // إظهار لوحة التحكم
    
    // إعدادات الصوت
    volume: 0.8, // مستوى الصوت للتنبيهات
    enableSounds: true, // تفعيل الأصوات
    enableVibration: true, // تفعيل الاهتزاز (للهواتف)
    
    // إعدادات التحويل
    autoCapitalize: true, // كتابة أول حرف كبير تلقائياً
    autoCorrect: true, // تصحيح تلقائي
    enablePunctuation: true, // علامات الترقيم التلقائية
    
    // إعدادات الأمان
    confirmBeforeInput: false, // تأكيد قبل الإدخال
    timeoutDuration: 10000, // مهلة التسجيل بالميلي ثانية
    
    // اللغات المدعومة
    supportedLanguages: [
        { code: 'ar-SA', name: 'العربية السعودية', flag: '🇸🇦' },
        { code: 'ar-EG', name: 'العربية المصرية', flag: '🇪🇬' },
        { code: 'ar-AE', name: 'العربية الإماراتية', flag: '🇦🇪' },
        { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
        { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' }
    ]
};

// ==============================
// متغيرات النظام
// ==============================
let currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
let recognition = null;
let isListening = false;
let currentTargetInput = null;
let voiceControlPanel = null;
let micButtons = new Map();

// أصوات التنبيهات
const VOICE_SOUNDS = {
    start: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAIAE...', // بيانات صوتية مضغوطة
    success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAIAE...',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAIAE...',
    end: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAIAE...'
};

// ==============================
// تهيئة النظام الصوتي
// ==============================
function initializeVoiceSystem() {
    try {
        // التحقق من دعم المتصفح
        if (!checkBrowserSupport()) {
            console.warn('❌ المتصفح لا يدعم التعرف على الصوت');
            return;
        }
        
        // تحميل الإعدادات المحفوظة
        loadVoiceSettings();
        
        // تهيئة محرك التعرف على الصوت
        initializeSpeechRecognition();
        
        // إضافة أزرار المايكروفون
        addMicrophoneButtons();
        
        // إنشاء لوحة التحكم
        createVoiceControlPanel();
        
        // إعداد المستمعين
        setupVoiceEventListeners();
        
        console.log('🎤 تم تهيئة نظام الإدخال الصوتي بنجاح');
        
        // إشعار المستخدم
        showVoiceToast('🎤 نظام الإدخال الصوتي جاهز للاستخدام', 'success');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة النظام الصوتي:', error);
        showVoiceToast('فشل في تهيئة النظام الصوتي', 'error');
    }
}

// ==============================
// التحقق من دعم المتصفح
// ==============================
function checkBrowserSupport() {
    // التحقق من Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showVoiceToast('المتصفح لا يدعم التعرف على الصوت', 'error');
        return false;
    }
    
    // التحقق من إمكانية الوصول للمايكروفون
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showVoiceToast('المتصفح لا يدعم الوصول للمايكروفون', 'error');
        return false;
    }
    
    return true;
}

// ==============================
// تهيئة محرك التعرف على الصوت
// ==============================
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        throw new Error('Speech Recognition API غير مدعوم');
    }
    
    recognition = new SpeechRecognition();
    
    // إعداد المحرك
    recognition.lang = currentVoiceSettings.language;
    recognition.continuous = currentVoiceSettings.continuous;
    recognition.interimResults = currentVoiceSettings.interimResults;
    recognition.maxAlternatives = currentVoiceSettings.maxAlternatives;
    
    // أحداث التعرف على الصوت
    recognition.onstart = function() {
        isListening = true;
        updateMicButtonState(currentTargetInput, 'listening');
        playVoiceSound('start');
        showVoiceToast('🎤 جاري الاستماع...', 'info');
        
        if (currentVoiceSettings.enableVibration && navigator.vibrate) {
            navigator.vibrate(100);
        }
    };
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // إظهار النتائج المؤقتة
        if (interimTranscript && currentTargetInput) {
            showInterimResult(interimTranscript);
        }
        
        // معالجة النتائج النهائية
        if (finalTranscript && currentTargetInput) {
            processVoiceInput(finalTranscript);
        }
    };
    
    recognition.onerror = function(event) {
        isListening = false;
        updateMicButtonState(currentTargetInput, 'idle');
        
        let errorMessage = 'حدث خطأ في التعرف على الصوت';
        
        switch(event.error) {
            case 'no-speech':
                errorMessage = 'لم يتم سماع أي صوت';
                break;
            case 'audio-capture':
                errorMessage = 'لا يمكن الوصول للمايكروفون';
                break;
            case 'not-allowed':
                errorMessage = 'تم رفض الإذن للوصول للمايكروفون';
                break;
            case 'network':
                errorMessage = 'خطأ في الشبكة';
                break;
            case 'language-not-supported':
                errorMessage = 'اللغة المحددة غير مدعومة';
                break;
        }
        
        showVoiceToast(errorMessage, 'error');
        playVoiceSound('error');
    };
    
    recognition.onend = function() {
        isListening = false;
        updateMicButtonState(currentTargetInput, 'idle');
        hideInterimResult();
        playVoiceSound('end');
    };
}

// ==============================
// إضافة أزرار المايكروفون
// ==============================
function addMicrophoneButtons() {
    // البحث عن جميع حقول الإدخال
    const inputFields = document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select');
    
    inputFields.forEach(addMicButtonToField);
    
    // مراقبة إضافة حقول جديدة
    observeNewInputFields();
}

function addMicButtonToField(inputField) {
    // تجاهل الحقول المخفية أو الغير قابلة للتعديل  
    if (inputField.type === 'hidden' || inputField.readOnly || inputField.disabled) {
        return;
    }
    
    // تجاهل الحقول التي تحتوي على مايكروفون بالفعل
    if (micButtons.has(inputField)) {
        return;
    }
    
    // إنشاء زر المايكروفون
    const micButton = createMicButton(inputField);
    
    // إضافة الزر للحقل
    insertMicButton(inputField, micButton);
    
    // حفظ المرجع
    micButtons.set(inputField, micButton);
}

function createMicButton(inputField) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'voice-mic-button';
    button.title = 'إدخال بالصوت';
    button.setAttribute('data-target', inputField.id || generateFieldId(inputField));
    
    // تحديد حجم الزر
    const sizeClass = `mic-${currentVoiceSettings.buttonSize}`;
    button.classList.add(sizeClass);
    
    // أيقونة المايكروفون
    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2ZM19 11C19 15.42 15.42 19 11 19V21H13V23H11C10.45 23 10 22.55 10 22S10.45 21 11 21V19C6.58 19 3 15.42 3 11H5C5 13.76 7.24 16 10 16H14C16.76 16 19 13.76 19 11H19ZM17 11C17 13.21 15.21 15 13 15H11C8.79 15 7 13.21 7 11V5C7 2.79 8.79 1 11 1H13C15.21 1 17 2.79 17 5V11Z"/>
        </svg>
        <span class="mic-status"></span>
    `;
    
    // أحداث الزر
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMicButtonClick(inputField, button);
    });
    
    return button;
}

function insertMicButton(inputField, micButton) {
    const container = inputField.parentNode;
    
    // إنشاء حاوية للحقل والزر إذا لم تكن موجودة
    if (!container.classList.contains('voice-input-container')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'voice-input-container';
        
        // نسخ الحقل إلى الحاوية الجديدة
        container.insertBefore(wrapper, inputField);
        wrapper.appendChild(inputField);
        wrapper.appendChild(micButton);
    } else {
        container.appendChild(micButton);
    }
}

function generateFieldId(field) {
    return 'voice_field_' + Math.random().toString(36).substr(2, 9);
}

// ==============================
// معالجة النقر على زر المايكروفون
// ==============================
function handleMicButtonClick(inputField, micButton) {
    if (isListening) {
        stopListening();
        return;
    }
    
    // التحقق من الأذونات
    requestMicrophonePermission()
        .then(() => {
            startListening(inputField, micButton);
        })
        .catch((error) => {
            console.error('خطأ في أذونات المايكروفون:', error);
            showVoiceToast('يرجى السماح بالوصول للمايكروفون', 'error');
        });
}

function requestMicrophonePermission() {
    return navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // إيقاف التدفق بعد التحقق من الأذونات
            stream.getTracks().forEach(track => track.stop());
            return true;
        });
}

function startListening(inputField, micButton) {
    try {
        currentTargetInput = inputField;
        
        // تحديث إعدادات المحرك
        recognition.lang = currentVoiceSettings.language;
        
        // بدء التسجيل
        recognition.start();
        
        // تعيين مهلة زمنية
        setTimeout(() => {
            if (isListening) {
                stopListening();
                showVoiceToast('انتهت مهلة التسجيل', 'warning');
            }
        }, currentVoiceSettings.timeoutDuration);
        
    } catch (error) {
        console.error('خطأ في بدء التسجيل:', error);
        showVoiceToast('فشل في بدء التسجيل', 'error');
        updateMicButtonState(inputField, 'idle');
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

// ==============================
// معالجة الإدخال الصوتي
// ==============================
function processVoiceInput(transcript) {
    if (!currentTargetInput || !transcript.trim()) {
        return;
    }
    
    let processedText = transcript.trim();
    
    // تطبيق المعالجات
    if (currentVoiceSettings.autoCapitalize) {
        processedText = capitalizeFirst(processedText);
    }
    
    if (currentVoiceSettings.autoCorrect) {
        processedText = applyAutoCorrect(processedText);
    }
    
    if (currentVoiceSettings.enablePunctuation) {
        processedText = addPunctuation(processedText);
    }
    
    // معالجة خاصة حسب نوع الحقل
    processedText = processFieldSpecificInput(currentTargetInput, processedText);
    
    // إدراج النص
    if (currentVoiceSettings.confirmBeforeInput) {
        showConfirmationDialog(processedText)
            .then(confirmed => {
                if (confirmed) {
                    insertTextToField(currentTargetInput, processedText);
                }
            });
    } else {
        insertTextToField(currentTargetInput, processedText);
    }
}

function insertTextToField(field, text) {
    // إدراج النص في الحقل
    if (field.tagName.toLowerCase() === 'select') {
        // للقوائم المنسدلة، البحث عن الخيار المناسب
        selectBestOption(field, text);
    } else {
        // للحقول النصية
        field.value = text;
        field.focus();
        
        // إطلاق أحداث التغيير
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    playVoiceSound('success');
    showVoiceToast(`تم إدخال: "${text}"`, 'success');
    
    if (currentVoiceSettings.enableVibration && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// ==============================
// معالجات النصوص
// ==============================
function capitalizeFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function applyAutoCorrect(text) {
    // قاموس التصحيحات الشائعة
    const corrections = {
        'واحد': '1',
        'اثنان': '2',
        'ثلاثة': '3',
        'أربعة': '4',
        'خمسة': '5',
        'ستة': '6',
        'سبعة': '7',
        'ثمانية': '8',
        'تسعة': '9',
        'عشرة': '10',
        'صفر': '0',
        'نعم': 'نعم',
        'لا': 'لا',
        'ذكر': 'ذكر',
        'أنثى': 'أنثى',
        'متزوج': 'متزوج/ة',
        'عازب': 'أعزب/عزباء',
        'أرمل': 'أرمل/ة',
        'مطلق': 'مطلق/ة'
    };
    
    let correctedText = text;
    
    Object.keys(corrections).forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        correctedText = correctedText.replace(regex, corrections[word]);
    });
    
    return correctedText;
}

function addPunctuation(text) {
    // إضافة علامات الترقيم التلقائية
    let punctuatedText = text;
    
    // استبدال الكلمات بعلامات الترقيم
    const punctuationMap = {
        'نقطة': '.',
        'فاصلة': ',',
        'علامة استفهام': '؟',
        'علامة تعجب': '!',
        'نقطتان': ':',
        'فاصلة منقوطة': ';',
        'قوس مفتوح': '(',
        'قوس مقفل': ')',
        'خط': '-',
        'شرطة': '_'
    };
    
    Object.keys(punctuationMap).forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        punctuatedText = punctuatedText.replace(regex, punctuationMap[word]);
    });
    
    return punctuatedText;
}

function processFieldSpecificInput(field, text) {
    const fieldType = field.type ? field.type.toLowerCase() : 'text';
    const fieldId = field.id ? field.id.toLowerCase() : '';
    
    // معالجة خاصة بالأرقام
    if (fieldType === 'number' || fieldType === 'tel') {
        return extractNumbers(text);
    }
    
    // معالجة خاصة بالتواريخ
    if (fieldType === 'date' || fieldId.includes('date') || fieldId.includes('تاريخ')) {
        return convertDateFromSpeech(text);
    }
    
    // معالجة البريد الإلكتروني
    if (fieldType === 'email' || fieldId.includes('email') || fieldId.includes('بريد')) {
        return convertEmailFromSpeech(text);
    }
    
    // معالجة أرقام الهواتف
    if (fieldId.includes('phone') || fieldId.includes('هاتف') || fieldId.includes('جوال')) {
        return formatPhoneNumber(extractNumbers(text));
    }
    
    return text;
}

function extractNumbers(text) {
    // استخراج الأرقام من النص
    return text.replace(/[^\d]/g, '');
}

function convertDateFromSpeech(text) {
    // تحويل التاريخ المنطوق إلى تنسيق رقمي
    const today = new Date();
    
    if (text.includes('اليوم')) {
        return today.toISOString().split('T')[0];
    }
    
    if (text.includes('أمس')) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }
    
    if (text.includes('غداً') || text.includes('غدا')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    
    // استخراج أرقام التاريخ
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
        const day = numbers[0].padStart(2, '0');
        const month = numbers[1].padStart(2, '0');
        const year = numbers[2].length === 2 ? '20' + numbers[2] : numbers[2];
        return `${year}-${month}-${day}`;
    }
    
    return text;
}

function convertEmailFromSpeech(text) {
    // تحويل البريد الإلكتروني المنطوق
    let email = text.toLowerCase()
        .replace(/\s+/g, '')
        .replace('نقطة', '.')
        .replace('دوت', '.')
        .replace('أت', '@')
        .replace('ات', '@')
        .replace('في', '@');
    
    return email;
}

function formatPhoneNumber(numbers) {
    // تنسيق رقم الهاتف
    if (numbers.length === 11 && numbers.startsWith('07')) {
        return numbers;
    }
    
    if (numbers.length === 10 && numbers.startsWith('7')) {
        return '0' + numbers;
    }
    
    return numbers;
}

// ==============================
// إدارة القوائم المنسدلة
// ==============================
function selectBestOption(selectField, spokenText) {
    const options = Array.from(selectField.options);
    const lowerSpokenText = spokenText.toLowerCase();
    
    // البحث عن تطابق مباشر
    let bestMatch = options.find(option => 
        option.text.toLowerCase().includes(lowerSpokenText) ||
        option.value.toLowerCase().includes(lowerSpokenText)
    );
    
    // إذا لم يجد تطابق، ابحث عن أفضل تطابق جزئي
    if (!bestMatch) {
        bestMatch = options.find(option => {
            const optionWords = option.text.toLowerCase().split(' ');
            const spokenWords = lowerSpokenText.split(' ');
            
            return spokenWords.some(spokenWord => 
                optionWords.some(optionWord => 
                    optionWord.includes(spokenWord) || spokenWord.includes(optionWord)
                )
            );
        });
    }
    
    if (bestMatch) {
        selectField.value = bestMatch.value;
        selectField.dispatchEvent(new Event('change', { bubbles: true }));
        showVoiceToast(`تم اختيار: "${bestMatch.text}"`, 'success');
    } else {
        showVoiceToast('لم يتم العثور على خيار مناسب', 'warning');
    }
}

// ==============================
// تحديث حالة أزرار المايكروفون
// ==============================
function updateMicButtonState(inputField, state) {
    const micButton = micButtons.get(inputField);
    if (!micButton) return;
    
    // إزالة جميع حالات الأزرار
    micButton.classList.remove('listening', 'processing', 'success', 'error');
    
    // إضافة الحالة الجديدة
    if (state !== 'idle') {
        micButton.classList.add(state);
    }
    
    // تحديث التلميح
    const tooltips = {
        idle: 'إدخال بالصوت',
        listening: 'جاري الاستماع... اضغط للإيقاف',
        processing: 'جاري المعالجة...',
        success: 'تم بنجاح',
        error: 'حدث خطأ'
    };
    
    micButton.title = tooltips[state] || tooltips.idle;
}

// ==============================
// عرض النتائج المؤقتة
// ==============================
function showInterimResult(text) {
    let interimDisplay = document.getElementById('voice-interim-result');
    
    if (!interimDisplay) {
        interimDisplay = document.createElement('div');
        interimDisplay.id = 'voice-interim-result';
        interimDisplay.className = 'voice-interim-display';
        document.body.appendChild(interimDisplay);
    }
    
    interimDisplay.textContent = text;
    interimDisplay.style.display = 'block';
    
    // تحديد موقع العرض بالقرب من الحقل النشط
    if (currentTargetInput) {
        const rect = currentTargetInput.getBoundingClientRect();
        interimDisplay.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        interimDisplay.style.left = (rect.left + window.scrollX) + 'px';
    }
}

function hideInterimResult() {
    const interimDisplay = document.getElementById('voice-interim-result');
    if (interimDisplay) {
        interimDisplay.style.display = 'none';
    }
}

// ==============================
// لوحة التحكم في الإعدادات الصوتية
// ==============================
function createVoiceControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'voice-control-panel';
    panel.innerHTML = `
        <div class="voice-control-overlay">
            <div class="voice-control-container">
                <div class="voice-control-header">
                    <h3>🎤 إعدادات الإدخال الصوتي</h3>
                    <button class="close-voice-btn" onclick="closeVoiceControlPanel()">✕</button>
                </div>
                
                <div class="voice-control-body">
                    <div class="voice-control-tabs">
                        <button class="voice-tab-btn active" onclick="showVoiceTab('language')">اللغة</button>
                        <button class="voice-tab-btn" onclick="showVoiceTab('appearance')">المظهر</button>
                        <button class="voice-tab-btn" onclick="showVoiceTab('behavior')">السلوك</button>
                        <button class="voice-tab-btn" onclick="showVoiceTab('advanced')">متقدم</button>
                    </div>
                    
                    <div class="voice-control-content">
                        <!-- تبويب اللغة -->
                        <div class="voice-tab-content active" id="language-tab">
                            <div class="voice-control-section">
                                <h4>🌍 إعدادات اللغة</h4>
                                <div class="voice-control-row">
                                    <label>اللغة الأساسية:</label>
                                    <select id="voiceLanguage">
                                        ${currentVoiceSettings.supportedLanguages.map(lang => 
                                            `<option value="${lang.code}" ${lang.code === currentVoiceSettings.language ? 'selected' : ''}>
                                                ${lang.flag} ${lang.name}
                                            </option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="voice-control-row">
                                    <label>الكتابة التلقائية:</label>
                                    <input type="checkbox" id="autoCapitalize" ${currentVoiceSettings.autoCapitalize ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>التصحيح التلقائي:</label>
                                    <input type="checkbox" id="autoCorrect" ${currentVoiceSettings.autoCorrect ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>علامات الترقيم:</label>
                                    <input type="checkbox" id="enablePunctuation" ${currentVoiceSettings.enablePunctuation ? 'checked' : ''}>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب المظهر -->
                        <div class="voice-tab-content" id="appearance-tab">
                            <div class="voice-control-section">
                                <h4>🎨 إعدادات المظهر</h4>
                                <div class="voice-control-row">
                                    <label>إظهار أزرار المايكروفون:</label>
                                    <input type="checkbox" id="showMicButton" ${currentVoiceSettings.showMicButton ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>حجم الأزرار:</label>
                                    <select id="buttonSize">
                                        <option value="small" ${currentVoiceSettings.buttonSize === 'small' ? 'selected' : ''}>صغير</option>
                                        <option value="normal" ${currentVoiceSettings.buttonSize === 'normal' ? 'selected' : ''}>عادي</option>
                                        <option value="large" ${currentVoiceSettings.buttonSize === 'large' ? 'selected' : ''}>كبير</option>
                                    </select>
                                </div>
                                <div class="voice-control-row">
                                    <label>موقع الأزرار:</label>
                                    <select id="buttonPosition">
                                        <option value="right" ${currentVoiceSettings.buttonPosition === 'right' ? 'selected' : ''}>يمين</option>
                                        <option value="left" ${currentVoiceSettings.buttonPosition === 'left' ? 'selected' : ''}>يسار</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب السلوك -->
                        <div class="voice-tab-content" id="behavior-tab">
                            <div class="voice-control-section">
                                <h4>⚙️ إعدادات السلوك</h4>
                                <div class="voice-control-row">
                                    <label>تأكيد قبل الإدخال:</label>
                                    <input type="checkbox" id="confirmBeforeInput" ${currentVoiceSettings.confirmBeforeInput ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>مهلة التسجيل (ثانية):</label>
                                    <input type="range" id="timeoutDuration" min="5" max="30" value="${currentVoiceSettings.timeoutDuration / 1000}">
                                    <span id="timeoutValue">${currentVoiceSettings.timeoutDuration / 1000}s</span>
                                </div>
                                <div class="voice-control-row">
                                    <label>تفعيل الأصوات:</label>
                                    <input type="checkbox" id="enableSounds" ${currentVoiceSettings.enableSounds ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>تفعيل الاهتزاز:</label>
                                    <input type="checkbox" id="enableVibration" ${currentVoiceSettings.enableVibration ? 'checked' : ''}>
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب متقدم -->
                        <div class="voice-tab-content" id="advanced-tab">
                            <div class="voice-control-section">
                                <h4>🔧 إعدادات متقدمة</h4>
                                <div class="voice-control-row">
                                    <label>التسجيل المستمر:</label>
                                    <input type="checkbox" id="continuous" ${currentVoiceSettings.continuous ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>النتائج المؤقتة:</label>
                                    <input type="checkbox" id="interimResults" ${currentVoiceSettings.interimResults ? 'checked' : ''}>
                                </div>
                                <div class="voice-control-row">
                                    <label>عدد البدائل:</label>
                                    <input type="number" id="maxAlternatives" min="1" max="10" value="${currentVoiceSettings.maxAlternatives}">
                                </div>
                                <div class="voice-control-row">
                                    <label>مستوى الصوت:</label>
                                    <input type="range" id="volume" min="0" max="1" step="0.1" value="${currentVoiceSettings.volume}">
                                    <span id="volumeValue">${Math.round(currentVoiceSettings.volume * 100)}%</span>
                                </div>
                            </div>
                            
                            <div class="voice-control-section">
                                <h4>🧪 اختبار النظام</h4>
                                <button class="voice-test-btn" onclick="testVoiceSystem()">🎤 اختبار المايكروفون</button>
                                <button class="voice-test-btn" onclick="testVoiceSounds()">🔊 اختبار الأصوات</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="voice-control-footer">
                    <button class="voice-control-btn apply-btn" onclick="applyVoiceSettings()">✅ تطبيق</button>
                    <button class="voice-control-btn save-btn" onclick="saveVoiceSettings()">💾 حفظ</button>
                    <button class="voice-control-btn reset-btn" onclick="resetVoiceSettings()">🔄 إعادة تعيين</button>
                    <button class="voice-control-btn export-btn" onclick="exportVoiceSettings()">📤 تصدير</button>
                    <button class="voice-control-btn import-btn" onclick="importVoiceSettings()">📥 استيراد</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة الأنماط
    addVoiceStyles();
    
    document.body.appendChild(panel);
    voiceControlPanel = panel;
    
    // إعداد المستمعين للإعدادات
    setupVoiceSettingsListeners();
}

// ==============================
// إضافة أنماط CSS
// ==============================
function addVoiceStyles() {
    if (document.getElementById('voice-input-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'voice-input-styles';
    styles.textContent = `
        /* أنماط أزرار المايكروفون */
        .voice-input-container {
            position: relative;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .voice-mic-button {
            background: linear-gradient(135deg, #3498db, #2980b9);
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        }
        
        .voice-mic-button:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
        }
        
        .voice-mic-button.mic-small {
            width: 30px;
            height: 30px;
        }
        
        .voice-mic-button.mic-normal {
            width: 36px;
            height: 36px;
        }
        
        .voice-mic-button.mic-large {
            width: 42px;
            height: 42px;
        }
        
        .voice-mic-button svg {
            width: 60%;
            height: 60%;
        }
        
        .voice-mic-button.listening {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            animation: voicePulse 1s infinite;
        }
        
        .voice-mic-button.processing {
            background: linear-gradient(135deg, #f39c12, #e67e22);
        }
        
        .voice-mic-button.success {
            background: linear-gradient(135deg, #27ae60, #229954);
        }
        
        .voice-mic-button.error {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
        }
        
        @keyframes voicePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }
        
        .mic-status {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
        }
        
        .voice-mic-button.listening .mic-status {
            background: #e74c3c;
            animation: voiceBlink 0.5s infinite;
        }
        
        @keyframes voiceBlink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        /* عرض النتائج المؤقتة */
        .voice-interim-display {
            position: absolute;
            background: rgba(52, 152, 219, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            display: none;
        }
        
        .voice-interim-display::before {
            content: '';
            position: absolute;
            top: -5px;
            left: 20px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 5px solid rgba(52, 152, 219, 0.9);
        }
        
        /* لوحة التحكم */
        .voice-control-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .voice-control-overlay.show {
            display: flex;
        }
        
        .voice-control-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 700px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .voice-control-header {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .voice-control-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .close-voice-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
        }
        
        .close-voice-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .voice-control-body {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .voice-control-tabs {
            display: flex;
            border-bottom: 1px solid #e3e6f0;
            background: #f8f9fa;
        }
        
        .voice-tab-btn {
            background: none;
            border: none;
            padding: 15px 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6c757d;
            transition: all 0.3s;
            border-bottom: 3px solid transparent;
            flex: 1;
            text-align: center;
        }
        
        .voice-tab-btn:hover {
            background: #e9ecef;
            color: #495057;
        }
        
        .voice-tab-btn.active {
            color: #3498db;
            border-bottom-color: #3498db;
            background: white;
        }
        
        .voice-control-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .voice-tab-content {
            display: none;
        }
        
        .voice-tab-content.active {
            display: block;
        }
        
        .voice-control-section {
            margin-bottom: 25px;
        }
        
        .voice-control-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #e3e6f0;
        }
        
        .voice-control-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            gap: 15px;
        }
        
        .voice-control-row label {
            min-width: 150px;
            font-weight: 500;
            color: #495057;
            font-size: 14px;
        }
        
        .voice-control-row input,
        .voice-control-row select {
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .voice-control-row input:focus,
        .voice-control-row select:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .voice-control-row input[type="checkbox"] {
            width: auto;
            flex: none;
        }
        
        .voice-control-row input[type="range"] {
            flex: 1;
        }
        
        .voice-test-btn {
            background: #17a2b8;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: background 0.3s;
        }
        
        .voice-test-btn:hover {
            background: #138496;
        }
        
        .voice-control-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .voice-control-btn {
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
            min-width: 120px;
            justify-content: center;
        }
        
        .apply-btn {
            background: #17a2b8;
            color: white;
        }
        
        .apply-btn:hover {
            background: #138496;
        }
        
        .save-btn {
            background: #28a745;
            color: white;
        }
        
        .save-btn:hover {
            background: #218838;
        }
        
        .reset-btn {
            background: #ffc107;
            color: #212529;
        }
        
        .reset-btn:hover {
            background: #e0a800;
        }
        
        .export-btn {
            background: #6f42c1;
            color: white;
        }
        
        .export-btn:hover {
            background: #5a359a;
        }
        
        .import-btn {
            background: #fd7e14;
            color: white;
        }
        
        .import-btn:hover {
            background: #dc6502;
        }
        
        /* تحسينات للهواتف */
        @media (max-width: 768px) {
            .voice-control-overlay {
                padding: 10px;
            }
            
            .voice-control-container {
                max-height: 95vh;
            }
            
            .voice-control-tabs {
                flex-wrap: wrap;
            }
            
            .voice-tab-btn {
                flex: none;
                min-width: 100px;
                padding: 10px 12px;
                font-size: 12px;
            }
            
            .voice-control-row {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            
            .voice-control-row label {
                min-width: auto;
                font-size: 13px;
            }
            
            .voice-control-footer {
                flex-direction: column;
            }
            
            .voice-control-btn {
                width: 100%;
                min-width: auto;
            }
            
            .voice-input-container {
                flex-wrap: wrap;
            }
            
            .voice-mic-button.mic-small {
                width: 28px;
                height: 28px;
            }
            
            .voice-mic-button.mic-normal {
                width: 32px;
                height: 32px;
            }
            
            .voice-mic-button.mic-large {
                width: 38px;
                height: 38px;
            }
        }
        
        /* إشعارات صوتية */
        .voice-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        }
        
        .voice-toast.show {
            transform: translateX(0);
        }
        
        .voice-toast.success {
            background: #27ae60;
        }
        
        .voice-toast.error {
            background: #e74c3c;
        }
        
        .voice-toast.warning {
            background: #f39c12;
        }
        
        .voice-toast.info {
            background: #3498db;
        }
    `;
    
    document.head.appendChild(styles);
}

// ==============================
// وظائف لوحة التحكم
// ==============================
function showVoiceControlPanel() {
    if (!voiceControlPanel) {
        createVoiceControlPanel();
    }
    
    const overlay = voiceControlPanel.querySelector('.voice-control-overlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeVoiceControlPanel() {
    if (voiceControlPanel) {
        const overlay = voiceControlPanel.querySelector('.voice-control-overlay');
        overlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function showVoiceTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.voice-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.voice-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// ==============================
// إدارة الإعدادات
// ==============================
function setupVoiceSettingsListeners() {
    // مستمع تغيير مهلة التسجيل
    const timeoutSlider = document.getElementById('timeoutDuration');
    const timeoutValue = document.getElementById('timeoutValue');
    
    if (timeoutSlider && timeoutValue) {
        timeoutSlider.addEventListener('input', function() {
            timeoutValue.textContent = this.value + 's';
        });
    }
    
    // مستمع تغيير مستوى الصوت
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volumeValue');
    
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', function() {
            volumeValue.textContent = Math.round(this.value * 100) + '%';
        });
    }
}

function applyVoiceSettings() {
    updateVoiceSettingsFromForm();
    
    // تطبيق إعدادات المحرك
    if (recognition) {
        recognition.lang = currentVoiceSettings.language;
        recognition.continuous = currentVoiceSettings.continuous;
        recognition.interimResults = currentVoiceSettings.interimResults;
        recognition.maxAlternatives = currentVoiceSettings.maxAlternatives;
    }
    
    // تحديث أزرار المايكروفون
    updateMicrophoneButtons();
    
    showVoiceToast('تم تطبيق الإعدادات', 'success');
}

function saveVoiceSettings() {
    updateVoiceSettingsFromForm();
    
    try {
        localStorage.setItem('charity_voice_settings', JSON.stringify(currentVoiceSettings));
        applyVoiceSettings();
        showVoiceToast('تم حفظ الإعدادات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في حفظ إعدادات الصوت:', error);
        showVoiceToast('فشل في حفظ الإعدادات', 'error');
    }
}

function loadVoiceSettings() {
    try {
        const savedSettings = localStorage.getItem('charity_voice_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS, ...parsedSettings };
            console.log('تم تحميل إعدادات الصوت المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الصوت:', error);
        currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
    }
}

function resetVoiceSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الصوت؟')) {
        currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
        setVoiceSettingsToForm();
        applyVoiceSettings();
        showVoiceToast('تم إعادة تعيين الإعدادات', 'info');
    }
}

function updateVoiceSettingsFromForm() {
    const formElements = document.querySelectorAll('#voice-control-panel input, #voice-control-panel select');
    
    formElements.forEach(element => {
        if (element.id && currentVoiceSettings.hasOwnProperty(element.id)) {
            if (element.type === 'checkbox') {
                currentVoiceSettings[element.id] = element.checked;
            } else if (element.type === 'range' && element.id === 'timeoutDuration') {
                currentVoiceSettings[element.id] = parseInt(element.value) * 1000;
            } else if (element.type === 'range' && element.id === 'volume') {
                currentVoiceSettings[element.id] = parseFloat(element.value);
            } else {
                currentVoiceSettings[element.id] = element.value;
            }
        }
    });
}

function setVoiceSettingsToForm() {
    Object.keys(currentVoiceSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = currentVoiceSettings[key];
            } else if (element.type === 'range' && key === 'timeoutDuration') {
                element.value = currentVoiceSettings[key] / 1000;
            } else {
                element.value = currentVoiceSettings[key];
            }
        }
    });
}

// ==============================
// اختبار النظام
// ==============================
function testVoiceSystem() {
    if (!recognition) {
        showVoiceToast('المحرك غير متاح للاختبار', 'error');
        return;
    }
    
    showVoiceToast('قل شيئاً لاختبار النظام...', 'info');
    
    // إنشاء حقل اختبار مؤقت
    const testInput = document.createElement('input');
    testInput.type = 'text';
    testInput.placeholder = 'نتيجة الاختبار ستظهر هنا';
    testInput.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10002;
        padding: 15px;
        font-size: 16px;
        border: 2px solid #3498db;
        border-radius: 8px;
        width: 300px;
        text-align: center;
        background: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(testInput);
    
    // بدء التسجيل
    currentTargetInput = testInput;
    recognition.start();
    
    // إزالة الحقل بعد 15 ثانية
    setTimeout(() => {
        if (document.body.contains(testInput)) {
            document.body.removeChild(testInput);
        }
        currentTargetInput = null;
    }, 15000);
}

function testVoiceSounds() {
    showVoiceToast('اختبار الأصوات...', 'info');
    
    setTimeout(() => playVoiceSound('start'), 500);
    setTimeout(() => playVoiceSound('success'), 1500);
    setTimeout(() => playVoiceSound('error'), 2500);
    setTimeout(() => playVoiceSound('end'), 3500);
}

// ==============================
// تصدير واستيراد الإعدادات
// ==============================
function exportVoiceSettings() {
    updateVoiceSettingsFromForm();
    
    const exportData = {
        voiceSettings: currentVoiceSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `voice_settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showVoiceToast('تم تصدير إعدادات الصوت', 'success');
}

function importVoiceSettings() {
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
                
                if (importData.voiceSettings) {
                    currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS, ...importData.voiceSettings };
                    setVoiceSettingsToForm();
                    applyVoiceSettings();
                    showVoiceToast('تم استيراد إعدادات الصوت', 'success');
                } else {
                    showVoiceToast('تنسيق الملف غير صحيح', 'error');
                }
            } catch (error) {
                console.error('خطأ في استيراد الإعدادات:', error);
                showVoiceToast('خطأ في قراءة ملف الإعدادات', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================
// وظائف مساعدة
// ==============================
function updateMicrophoneButtons() {
    // إعادة إنشاء الأزرار مع الإعدادات الجديدة
    micButtons.forEach((button, input) => {
        button.remove();
    });
    
    micButtons.clear();
    
    if (currentVoiceSettings.showMicButton) {
        addMicrophoneButtons();
    }
}

function observeNewInputFields() {
    // مراقبة إضافة حقول جديدة
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // عنصر HTML
                    // البحث عن حقول الإدخال الجديدة
                    const newInputs = node.querySelectorAll ? 
                        node.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select') : 
                        [];
                    
                    newInputs.forEach(addMicButtonToField);
                    
                    // إذا كان العنصر نفسه حقل إدخال
                    if (node.matches && node.matches('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select')) {
                        addMicButtonToField(node);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function playVoiceSound(soundType) {
    if (!currentVoiceSettings.enableSounds) return;
    
    try {
        // إنشاء نغمة بسيطة
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // تحديد التردد حسب نوع الصوت
        const frequencies = {
            start: 800,
            success: 1000,
            error: 400,
            end: 600
        };
        
        oscillator.frequency.setValueAtTime(frequencies[soundType] || 600, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(currentVoiceSettings.volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
    } catch (error) {
        console.log('لا يمكن تشغيل الصوت:', error);
    }
}

function showVoiceToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `voice-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // إظهار الإشعار
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showConfirmationDialog(text) {
    return new Promise((resolve) => {
        const confirmed = confirm(`هل تريد إدخال النص التالي؟\n\n"${text}"`);
        resolve(confirmed);
    });
}

// ==============================
// إعداد مستمعي الأحداث
// ==============================
function setupVoiceEventListeners() {
    // مستمع تغيير القسم لإضافة أزرار جديدة
    document.addEventListener('click', function(e) {
        // تأخير قصير للسماح للعناصر الجديدة بالظهور
        setTimeout(() => {
            const newInputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select');
            newInputs.forEach(input => {
                if (!micButtons.has(input)) {
                    addMicButtonToField(input);
                }
            });
        }, 500);
    });
    
    // مستمع اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // Ctrl + Shift + V لفتح لوحة التحكم
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            showVoiceControlPanel();
        }
        
        // Escape لإيقاف التسجيل
        if (e.key === 'Escape' && isListening) {
            e.preventDefault();
            stopListening();
        }
    });
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة للتأكد من تحميل الملف الرئيسي
    setTimeout(() => {
        initializeVoiceSystem();
    }, 1500);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.voiceInputSystem = {
    show: showVoiceControlPanel,
    hide: closeVoiceControlPanel,
    test: testVoiceSystem,
    start: (inputElement) => {
        if (inputElement) {
            const micButton = micButtons.get(inputElement);
            if (micButton) {
                handleMicButtonClick(inputElement, micButton);
            }
        }
    },
    stop: stopListening,
    settings: currentVoiceSettings,
    isListening: () => isListening
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('voice-input')) {
        console.error('خطأ في نظام الإدخال الصوتي:', e.error);
    }
});

console.log('🎤 تم تحميل نظام الإدخال الصوتي بنجاح!');
console.log('💡 استخدم Ctrl+Shift+V لفتح لوحة التحكم');
console.log('🔊 استخدم voiceInputSystem للتحكم البرمجي');
