/**
 * نظام الإدخال الصوتي المتكامل
 * ملف منفصل لإضافة ميزة التحكم الصوتي لجميع حقول الإدخال
 * يمكن دمجه مع أي نظام دون تعديل الملف الرئيسي
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
    interimResults: true, // إظهار النتائج المؤقتة
    maxAlternatives: 1, // عدد البدائل المقترحة
    
    // إعدادات الواجهة
    showMicIcon: true, // إظهار أيقونة المايكروفون
    autoInsert: true, // إدراج النص تلقائياً
    confirmBeforeInsert: false, // تأكيد قبل الإدراج
    
    // إعدادات الصوت
    enableBeep: true, // صوت التنبيه
    voiceFeedback: false, // ردود فعل صوتية
    
    // إعدادات المعالجة
    autoCapitalize: true, // كتابة الحرف الأول بحروف كبيرة
    autoCorrect: true, // التصحيح التلقائي
    numberConversion: true, // تحويل الأرقام المنطوقة
    
    // إعدادات متقدمة
    timeout: 10000, // مهلة زمنية للتسجيل (10 ثوان)
    noiseReduction: true, // تقليل الضوضاء
    echoCancellation: true, // إلغاء الصدى
    
    // قائمة الحقول المستثناة
    excludeFields: ['password', 'confirmPassword'],
    
    // اللغات المدعومة
    supportedLanguages: {
        'ar-SA': 'العربية (السعودية)',
        'ar-EG': 'العربية (مصر)',
        'ar-AE': 'العربية (الإمارات)',
        'ar-JO': 'العربية (الأردن)',
        'ar-IQ': 'العربية (العراق)',
        'en-US': 'English (US)',
        'en-GB': 'English (UK)'
    }
};

// ==============================
// متغيرات النظام الصوتي
// ==============================
let currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
let recognition = null;
let isListening = false;
let currentField = null;
let voiceControlPanel = null;
let micButtons = [];
let isInitialized = false;

// قاموس تحويل الأرقام العربية المنطوقة
const arabicNumbers = {
    'صفر': '0', 'واحد': '1', 'اثنين': '2', 'اثنان': '2', 'ثلاثة': '3', 'أربعة': '4',
    'خمسة': '5', 'ستة': '6', 'سبعة': '7', 'ثمانية': '8', 'تسعة': '9', 'عشرة': '10',
    'عشر': '10', 'إحدى عشر': '11', 'اثنا عشر': '12', 'ثلاثة عشر': '13', 'أربعة عشر': '14',
    'خمسة عشر': '15', 'ستة عشر': '16', 'سبعة عشر': '17', 'ثمانية عشر': '18', 'تسعة عشر': '19',
    'عشرون': '20', 'ثلاثون': '30', 'أربعون': '40', 'خمسون': '50', 'ستون': '60',
    'سبعون': '70', 'ثمانون': '80', 'تسعون': '90', 'مائة': '100', 'ألف': '1000'
};

// قاموس الكلمات الشائعة للتصحيح
const commonCorrections = {
    'الف': 'ألف',
    'اله': 'الله',
    'محمد': 'محمد',
    'على': 'علي',
    'حسن': 'حسن',
    'حسين': 'حسين'
};

// ==============================
// تهيئة النظام الصوتي
// ==============================
function initializeVoiceSystem() {
    if (isInitialized) return;
    
    // تحقق من دعم المتصفح
    if (!checkBrowserSupport()) {
        console.warn('❌ المتصفح لا يدعم التعرف على الصوت');
        return;
    }
    
    // تحميل الإعدادات المحفوظة
    loadVoiceSettings();
    
    // تهيئة خدمة التعرف على الصوت
    initializeSpeechRecognition();
    
    // إضافة أيقونات المايكروفون لجميع الحقول
    addMicrophoneIcons();
    
    // إنشاء لوحة التحكم الصوتي
    createVoiceControlPanel();
    
    // مراقبة الحقول الجديدة
    observeNewFields();
    
    // إعداد اختصارات لوحة المفاتيح
    setupVoiceKeyboardShortcuts();
    
    isInitialized = true;
    console.log('🎤 تم تهيئة نظام الإدخال الصوتي بنجاح');
}

// ==============================
// فحص دعم المتصفح
// ==============================
function checkBrowserSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showVoiceToast('المتصفح لا يدعم التعرف على الصوت', 'error');
        return false;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showVoiceToast('المتصفح لا يدعم الوصول للمايكروفون', 'error');
        return false;
    }
    
    return true;
}

// ==============================
// تهيئة خدمة التعرف على الصوت
// ==============================
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // إعداد خصائص التعرف على الصوت
    recognition.language = currentVoiceSettings.language;
    recognition.continuous = currentVoiceSettings.continuous;
    recognition.interimResults = currentVoiceSettings.interimResults;
    recognition.maxAlternatives = currentVoiceSettings.maxAlternatives;
    
    // أحداث التعرف على الصوت
    recognition.onstart = handleRecognitionStart;
    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onend = handleRecognitionEnd;
    recognition.onnomatch = handleNoMatch;
    recognition.onsoundstart = handleSoundStart;
    recognition.onsoundend = handleSoundEnd;
}

// ==============================
// إضافة أيقونات المايكروفون
// ==============================
function addMicrophoneIcons() {
    const inputFields = document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select');
    
    inputFields.forEach(field => {
        if (shouldExcludeField(field)) return;
        
        // تحقق من وجود أيقونة المايكروفون مسبقاً
        if (field.closest('.voice-input-wrapper')) return;
        
        addMicrophoneToField(field);
    });
}

// ==============================
// إضافة مايكروفون لحقل واحد
// ==============================
function addMicrophoneToField(field) {
    // إنشاء wrapper للحقل
    const wrapper = document.createElement('div');
    wrapper.className = 'voice-input-wrapper';
    wrapper.style.cssText = `
        position: relative;
        display: inline-block;
        width: 100%;
    `;
    
    // إنشاء أيقونة المايكروفون
    const micButton = document.createElement('button');
    micButton.type = 'button';
    micButton.className = 'voice-mic-btn';
    micButton.innerHTML = '🎤';
    micButton.setAttribute('aria-label', 'إدخال صوتي');
    micButton.setAttribute('title', 'اضغط للإدخال الصوتي (Ctrl+Shift+V)');
    
    // تنسيق أيقونة المايكروفون
    micButton.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    `;
    
    // إضافة تأثيرات hover
    micButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-50%) scale(1.1)';
        this.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)';
    });
    
    micButton.addEventListener('mouseleave', function() {
        if (!this.classList.contains('listening')) {
            this.style.transform = 'translateY(-50%) scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
        }
    });
    
    // إضافة معالج النقر
    micButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        startVoiceInput(field, micButton);
    });
    
    // تعديل padding الحقل لتوفير مساحة للأيقونة  
    const originalPadding = window.getComputedStyle(field).paddingRight;
    field.style.paddingRight = '45px';
    
    // وضع الحقل داخل wrapper
    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);
    wrapper.appendChild(micButton);
    
    // حفظ مرجع الزر
    micButtons.push({
        button: micButton,
        field: field,
        wrapper: wrapper
    });
}

// ==============================
// فحص الحقول المستثناة
// ==============================
function shouldExcludeField(field) {
    // فحص نوع الحقل
    if (field.type === 'password' || field.type === 'hidden') return true;
    
    // فحص ID الحقل
    if (currentVoiceSettings.excludeFields.includes(field.id)) return true;
    
    // فحص الصفات الخاصة
    if (field.hasAttribute('data-no-voice')) return true;
    
    // فحص readonly أو disabled
    if (field.readOnly || field.disabled) return true;
    
    return false;
}

// ==============================
// بدء الإدخال الصوتي
// ==============================
function startVoiceInput(field, micButton) {
    if (isListening) {
        stopVoiceInput();
        return;
    }
    
    // طلب إذن الوصول للمايكروفون
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            currentField = field;
            isListening = true;
            
            // تحديث مظهر الزر
            updateMicButtonState(micButton, 'listening');
            
            // بدء التعرف على الصوت
            try {
                recognition.start();
                
                // صوت البداية
                if (currentVoiceSettings.enableBeep) {
                    playBeep('start');
                }
                
                // إظهار مؤشر الاستماع
                showListeningIndicator(field);
                
                // مؤقت للإيقاف التلقائي
                setTimeout(() => {
                    if (isListening) {
                        stopVoiceInput();
                    }
                }, currentVoiceSettings.timeout);
                
            } catch (error) {
                console.error('خطأ في بدء التعرف على الصوت:', error);
                showVoiceToast('خطأ في بدء التسجيل الصوتي', 'error');
                resetVoiceInput();
            }
        })
        .catch(error => {
            console.error('خطأ في الوصول للمايكروفون:', error);
            showVoiceToast('يرجى السماح بالوصول للمايكروفون', 'warning');
        });
}

// ==============================
// إيقاف الإدخال الصوتي
// ==============================
function stopVoiceInput() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

// ==============================
// إعادة تعيين حالة الإدخال الصوتي
// ==============================
function resetVoiceInput() {
    isListening = false;
    currentField = null;
    
    // إعادة تعيين جميع أزرار المايكروفون
    micButtons.forEach(({ button }) => {
        updateMicButtonState(button, 'idle');
    });
    
    // إخفاء مؤشر الاستماع
    hideListeningIndicator();
}

// ==============================
// تحديث حالة زر المايكروفون
// ==============================
function updateMicButtonState(button, state) {
    button.classList.remove('listening', 'processing', 'error');
    
    switch (state) {
        case 'listening':
            button.classList.add('listening');
            button.innerHTML = '🔴';
            button.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            button.style.animation = 'pulse 1s infinite';
            button.style.transform = 'translateY(-50%) scale(1.1)';
            break;
            
        case 'processing':
            button.classList.add('processing');
            button.innerHTML = '⏳';
            button.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
            button.style.animation = 'spin 1s linear infinite';
            break;
            
        case 'error':
            button.classList.add('error');
            button.innerHTML = '❌';
            button.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            button.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => updateMicButtonState(button, 'idle'), 2000);
            break;
            
        case 'success':
            button.innerHTML = '✅';
            button.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
            button.style.animation = 'bounce 0.5s ease-in-out';
            setTimeout(() => updateMicButtonState(button, 'idle'), 1500);
            break;
            
        default: // idle
            button.innerHTML = '🎤';
            button.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
            button.style.animation = 'none';
            button.style.transform = 'translateY(-50%) scale(1)';
            break;
    }
}

// ==============================
// إظهار مؤشر الاستماع
// ==============================
function showListeningIndicator(field) {
    // إنشاء مؤشر الاستماع
    const indicator = document.createElement('div');
    indicator.id = 'voice-listening-indicator';
    indicator.innerHTML = `
        <div class="listening-animation">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
        </div>
        <div class="listening-text">🎤 جاري الاستماع...</div>
        <button class="stop-listening-btn" onclick="stopVoiceInput()">إيقاف</button>
    `;
    
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(52, 152, 219, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
        display: flex;
        align-items: center;
        gap: 15px;
        backdrop-filter: blur(10px);
        animation: slideInFromTop 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // إضافة الأنماط للأمواج المتحركة
    if (!document.getElementById('voice-animations-style')) {
        const style = document.createElement('style');
        style.id = 'voice-animations-style';
        style.textContent = `
            @keyframes slideInFromTop {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { transform: translateY(-50%) scale(1); }
                50% { transform: translateY(-50%) scale(1.1); }
            }
            
            @keyframes spin {
                from { transform: translateY(-50%) rotate(0deg); }
                to { transform: translateY(-50%) rotate(360deg); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateY(-50%) translateX(0); }
                25% { transform: translateY(-50%) translateX(-5px); }
                75% { transform: translateY(-50%) translateX(5px); }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(-50%) scale(1); }
                50% { transform: translateY(-50%) scale(1.2); }
            }
            
            .listening-animation {
                display: flex;
                gap: 3px;
                align-items: end;
            }
            
            .wave {
                width: 3px;
                height: 15px;
                background: white;
                border-radius: 2px;
                animation: waveAnimation 1s ease-in-out infinite;
            }
            
            .wave:nth-child(2) { animation-delay: 0.1s; }
            .wave:nth-child(3) { animation-delay: 0.2s; }
            
            @keyframes waveAnimation {
                0%, 100% { height: 15px; opacity: 0.7; }
                50% { height: 25px; opacity: 1; }
            }
            
            .stop-listening-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 5px 15px;
                border-radius: 15px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s;
            }
            
            .stop-listening-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }
}

// ==============================
// إخفاء مؤشر الاستماع
// ==============================
function hideListeningIndicator() {
    const indicator = document.getElementById('voice-listening-indicator');
    if (indicator) {
        indicator.style.animation = 'slideInFromTop 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 300);
    }
}

// ==============================
// معالجات أحداث التعرف على الصوت
// ==============================
function handleRecognitionStart() {
    console.log('🎤 بدء التعرف على الصوت');
    if (currentVoiceSettings.voiceFeedback) {
        speak('بدء التسجيل');
    }
}

function handleRecognitionResult(event) {
    let transcript = '';
    let isFinal = false;
    
    // جمع النتائج
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        
        if (result.isFinal) {
            isFinal = true;
        }
    }
    
    // معالجة النص
    const processedText = processVoiceText(transcript);
    
    if (isFinal) {
        // إدراج النص النهائي
        insertTextToField(processedText);
        
        // إيقاف التسجيل
        setTimeout(() => {
            stopVoiceInput();
        }, 500);
    } else if (currentVoiceSettings.interimResults) {
        // إظهار النتائج المؤقتة
        showInterimResult(processedText);
    }
}

function handleRecognitionError(event) {
    console.error('خطأ في التعرف على الصوت:', event.error);
    
    let errorMessage = 'حدث خطأ في التعرف على الصوت';
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'لم يتم اكتشاف صوت';
            break;
        case 'audio-capture':
            errorMessage = 'لا يمكن الوصول للمايكروفون';
            break;
        case 'not-allowed':
            errorMessage = 'يرجى السماح بالوصول للمايكروفون';
            break;
        case 'network':
            errorMessage = 'خطأ في الاتصال بالإنترنت';
            break;
        case 'service-not-allowed':
            errorMessage = 'خدمة التعرف على الصوت غير متاحة';
            break;
    }
    
    showVoiceToast(errorMessage, 'error');
    
    // تحديث حالة الزر
    const currentMicButton = micButtons.find(({ field }) => field === currentField)?.button;
    if (currentMicButton) {
        updateMicButtonState(currentMicButton, 'error');
    }
    
    resetVoiceInput();
}

function handleRecognitionEnd() {
    console.log('🛑 انتهاء التعرف على الصوت');
    
    if (currentVoiceSettings.enableBeep) {
        playBeep('end');
    }
    
    resetVoiceInput();
}

function handleNoMatch() {
    showVoiceToast('لم يتم التعرف على الصوت بوضوح', 'warning');
}

function handleSoundStart() {
    console.log('🔊 بدء اكتشاف الصوت');
}

function handleSoundEnd() {
    console.log('🔇 انتهاء اكتشاف الصوت');
}

// ==============================
// معالجة النص الصوتي
// ==============================
function processVoiceText(text) {
    let processedText = text.trim();
    
    // تحويل الأرقام المنطوقة
    if (currentVoiceSettings.numberConversion) {
        processedText = convertSpokenNumbers(processedText);
    }
    
    // التصحيح التلقائي
    if (currentVoiceSettings.autoCorrect) {
        processedText = applyAutoCorrection(processedText);
    }
    
    // كتابة الحرف الأول بحروف كبيرة
    if (currentVoiceSettings.autoCapitalize) {
        processedText = capitalizeFirst(processedText);
    }
    
    return processedText;
}

// ==============================
// تحويل الأرقام المنطوقة
// ==============================
function convertSpokenNumbers(text) {
    let convertedText = text;
    
    // تحويل الأرقام العربية المنطوقة
    Object.keys(arabicNumbers).forEach(spoken => {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
        convertedText = convertedText.replace(regex, arabicNumbers[spoken]);
    });
    
    // تحويل الأرقام الإنجليزية المنطوقة
    const englishNumbers = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
        'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
        'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
        'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
        'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
    };
    
    Object.keys(englishNumbers).forEach(spoken => {
        const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
        convertedText = convertedText.replace(regex, englishNumbers[spoken]);
    });
    
    return convertedText;
}

// ==============================
// تطبيق التصحيح التلقائي
// ==============================
function applyAutoCorrection(text) {
    let correctedText = text;
    
    Object.keys(commonCorrections).forEach(wrong => {
        const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
        correctedText = correctedText.replace(regex, commonCorrections[wrong]);
    });
    
    return correctedText;
}

// ==============================
// كتابة الحرف الأول بحروف كبيرة
// ==============================
function capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// ==============================
// إدراج النص في الحقل
// ==============================
function insertTextToField(text) {
    if (!currentField || !text) return;
    
    if (currentVoiceSettings.confirmBeforeInsert) {
        if (!confirm(`هل تريد إدراج النص التالي؟\n"${text}"`)) {
            return;
        }
    }
    
    // إدراج النص حسب نوع الحقل
    if (currentField.tagName.toLowerCase() === 'select') {
        // البحث عن الخيار المطابق في select
        const options = Array.from(currentField.options);
        const matchingOption = options.find(option => 
            option.text.toLowerCase().includes(text.toLowerCase()) ||
            option.value.toLowerCase().includes(text.toLowerCase())
        );
        
        if (matchingOption) {
            currentField.value = matchingOption.value;
            showVoiceToast(`تم اختيار: ${matchingOption.text}`, 'success');
        } else {
            showVoiceToast('لم يتم العثور على خيار مطابق', 'warning');
        }
    } else {
        // إدراج النص في الحقول النصية
        if (currentVoiceSettings.autoInsert) {
            const currentValue = currentField.value;
            const newValue = currentValue ? currentValue + ' ' + text : text;
            currentField.value = newValue;
        } else {
            currentField.value = text;
        }
        
        // تشغيل أحداث التغيير
        currentField.dispatchEvent(new Event('input', { bubbles: true }));
        currentField.dispatchEvent(new Event('change', { bubbles: true }));
        
        showVoiceToast('تم إدراج النص بنجاح', 'success');
    }
    
    // تحديث حالة الزر
    const currentMicButton = micButtons.find(({ field }) => field === currentField)?.button;
    if (currentMicButton) {
        updateMicButtonState(currentMicButton, 'success');
    }
    
    // التركيز على الحقل
    currentField.focus();
}

// ==============================
// إظهار النتائج المؤقتة
// ==============================
function showInterimResult(text) {
    // يمكن إضافة مؤشر للنص المؤقت هنا
    console.log('نتيجة مؤقتة:', text);
}

// ==============================
// تشغيل صوت التنبيه
// ==============================
function playBeep(type) {
    if (!currentVoiceSettings.enableBeep) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(type === 'start' ? 800 : 400, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// ==============================
// النطق (Text to Speech)
// ==============================
function speak(text) {
    if (!currentVoiceSettings.voiceFeedback || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentVoiceSettings.language;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.7;
    
    window.speechSynthesis.speak(utterance);
}

// ==============================
// إنشاء لوحة تحكم الإعدادات الصوتية
// ==============================
function createVoiceControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'voice-control-panel';
    controlPanel.style.display = 'none';
    controlPanel.innerHTML = `
        <div class="voice-control-overlay">
            <div class="voice-control-container">
                <div class="voice-control-header">
                    <h3>🎤 إعدادات الإدخال الصوتي</h3>
                    <button class="close-voice-control-btn" onclick="closeVoiceControlPanel()">✕</button>
                </div>
                
                <div class="voice-control-body">
                    <div class="voice-control-section">
                        <h4>🌐 إعدادات اللغة</h4>
                        <div class="control-row">
                            <label>اللغة:</label>
                            <select id="voiceLanguage">
                                ${Object.entries(currentVoiceSettings.supportedLanguages).map(([code, name]) => 
                                    `<option value="${code}" ${code === currentVoiceSettings.language ? 'selected' : ''}>${name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="voice-control-section">
                        <h4>⚙️ إعدادات التسجيل</h4>
                        <div class="control-row">
                            <label>إظهار النتائج المؤقتة:</label>
                            <input type="checkbox" id="interimResults" ${currentVoiceSettings.interimResults ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>مهلة التسجيل (ثانية):</label>
                            <input type="range" id="voiceTimeout" min="5" max="30" value="${currentVoiceSettings.timeout / 1000}">
                            <span id="timeoutValue">${currentVoiceSettings.timeout / 1000}s</span>
                        </div>
                    </div>
                    
                    <div class="voice-control-section">
                        <h4>🔊 إعدادات الصوت</h4>
                        <div class="control-row">
                            <label>صوت التنبيه:</label>
                            <input type="checkbox" id="enableBeep" ${currentVoiceSettings.enableBeep ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>ردود فعل صوتية:</label>
                            <input type="checkbox" id="voiceFeedback" ${currentVoiceSettings.voiceFeedback ? 'checked' : ''}>
                        </div>
                    </div>
                    
                    <div class="voice-control-section">
                        <h4>📝 إعدادات النص</h4>
                        <div class="control-row">
                            <label>إدراج تلقائي:</label>
                            <input type="checkbox" id="autoInsert" ${currentVoiceSettings.autoInsert ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>تأكيد قبل الإدراج:</label>
                            <input type="checkbox" id="confirmBeforeInsert" ${currentVoiceSettings.confirmBeforeInsert ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>كتابة الحرف الأول بحروف كبيرة:</label>
                            <input type="checkbox" id="autoCapitalize" ${currentVoiceSettings.autoCapitalize ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>التصحيح التلقائي:</label>
                            <input type="checkbox" id="autoCorrect" ${currentVoiceSettings.autoCorrect ? 'checked' : ''}>
                        </div>
                        <div class="control-row">
                            <label>تحويل الأرقام المنطوقة:</label>
                            <input type="checkbox" id="numberConversion" ${currentVoiceSettings.numberConversion ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
                
                <div class="voice-control-footer">
                    <button class="voice-control-btn test-btn" onclick="testVoiceInput()">🎤 اختبار الصوت</button>
                    <button class="voice-control-btn save-btn" onclick="saveVoiceSettings()">💾 حفظ الإعدادات</button>
                    <button class="voice-control-btn reset-btn" onclick="resetVoiceSettings()">🔄 إعادة تعيين</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة الأنماط
    const styles = document.createElement('style');
    styles.id = 'voice-control-styles';
    styles.textContent = `
        .voice-control-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .voice-control-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }
        
        .voice-control-header {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
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
        
        .close-voice-control-btn {
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
        }
        
        .voice-control-body {
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .voice-control-section {
            margin-bottom: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .voice-control-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }
        
        .control-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            gap: 15px;
        }
        
        .control-row label {
            min-width: 180px;
            font-weight: 500;
            color: #495057;
            font-size: 14px;
        }
        
        .control-row input,
        .control-row select {
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #e3e6f0;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .control-row input[type="checkbox"] {
            width: 20px;
            height: 20px;
            flex: none;
        }
        
        .control-row input[type="range"] {
            flex: 1;
        }
        
        #timeoutValue {
            min-width: 40px;
            font-weight: 600;
            color: #3498db;
        }
        
        .voice-control-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .voice-control-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 130px;
            justify-content: center;
        }
        
        .test-btn {
            background: #17a2b8;
            color: white;
        }
        
        .save-btn {
            background: #28a745;
            color: white;
        }
        
        .reset-btn {
            background: #ffc107;
            color: #212529;
        }
        
        .voice-control-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
            .voice-control-overlay {
                padding: 10px;
            }
            
            .control-row {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            
            .control-row label {
                min-width: auto;
            }
            
            .voice-control-footer {
                flex-direction: column;
            }
            
            .voice-control-btn {
                width: 100%;
                min-width: auto;
            }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(controlPanel);
    
    // إضافة معالج تحديث مهلة التسجيل
    const timeoutSlider = controlPanel.querySelector('#voiceTimeout');
    const timeoutValue = controlPanel.querySelector('#timeoutValue');
    
    timeoutSlider.addEventListener('input', function() {
        timeoutValue.textContent = this.value + 's';
    });
    
    voiceControlPanel = controlPanel;
}

// ==============================
// إظهار لوحة التحكم الصوتي
// ==============================
function showVoiceControlPanel() {
    if (voiceControlPanel) {
        voiceControlPanel.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// ==============================
// إغلاق لوحة التحكم الصوتي
// ==============================
function closeVoiceControlPanel() {
    if (voiceControlPanel) {
        voiceControlPanel.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==============================
// اختبار الإدخال الصوتي
// ==============================
function testVoiceInput() {
    // إنشاء حقل اختبار مؤقت
    const testField = document.createElement('input');
    testField.type = 'text';
    testField.placeholder = 'حقل اختبار...';
    testField.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10002;
        padding: 15px;
        border: 2px solid #3498db;
        border-radius: 8px;
        font-size: 16px;
        width: 300px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(testField);
    
    // محاكاة إضافة مايكروفون للحقل
    addMicrophoneToField(testField);
    
    // إظهار رسالة تعليمات
    showVoiceToast('تم إنشاء حقل اختبار. اضغط على المايكروفون لتجربة الإدخال الصوتي', 'info');
    
    // إزالة الحقل بعد 30 ثانية
    setTimeout(() => {
        if (document.body.contains(testField)) {
            const wrapper = testField.closest('.voice-input-wrapper');
            if (wrapper) {
                document.body.removeChild(wrapper);
            } else {
                document.body.removeChild(testField);
            }
        }
    }, 30000);
}

// ==============================
// حفظ إعدادات الصوت
// ==============================
function saveVoiceSettings() {
    // جمع الإعدادات من النموذج
    currentVoiceSettings.language = document.getElementById('voiceLanguage').value;
    currentVoiceSettings.interimResults = document.getElementById('interimResults').checked;
    currentVoiceSettings.timeout = parseInt(document.getElementById('voiceTimeout').value) * 1000;
    currentVoiceSettings.enableBeep = document.getElementById('enableBeep').checked;
    currentVoiceSettings.voiceFeedback = document.getElementById('voiceFeedback').checked;
    currentVoiceSettings.autoInsert = document.getElementById('autoInsert').checked;
    currentVoiceSettings.confirmBeforeInsert = document.getElementById('confirmBeforeInsert').checked;
    currentVoiceSettings.autoCapitalize = document.getElementById('autoCapitalize').checked;
    currentVoiceSettings.autoCorrect = document.getElementById('autoCorrect').checked;
    currentVoiceSettings.numberConversion = document.getElementById('numberConversion').checked;
    
    try {
        localStorage.setItem('charity_voice_settings', JSON.stringify(currentVoiceSettings));
        
        // إعادة تهيئة خدمة التعرف على الصوت
        initializeSpeechRecognition();
        
        showVoiceToast('تم حفظ الإعدادات بنجاح', 'success');
        closeVoiceControlPanel();
    } catch (error) {
        console.error('خطأ في حفظ إعدادات الصوت:', error);
        showVoiceToast('فشل في حفظ الإعدادات', 'error');
    }
}

// ==============================
// تحميل إعدادات الصوت
// ==============================
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

// ==============================
// إعادة تعيين إعدادات الصوت
// ==============================
function resetVoiceSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الصوت إلى القيم الافتراضية؟')) {
        currentVoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
        
        // تحديث النموذج
        document.getElementById('voiceLanguage').value = currentVoiceSettings.language;
        document.getElementById('interimResults').checked = currentVoiceSettings.interimResults;
        document.getElementById('voiceTimeout').value = currentVoiceSettings.timeout / 1000;
        document.getElementById('timeoutValue').textContent = (currentVoiceSettings.timeout / 1000) + 's';
        document.getElementById('enableBeep').checked = currentVoiceSettings.enableBeep;
        document.getElementById('voiceFeedback').checked = currentVoiceSettings.voiceFeedback;
        document.getElementById('autoInsert').checked = currentVoiceSettings.autoInsert;
        document.getElementById('confirmBeforeInsert').checked = currentVoiceSettings.confirmBeforeInsert;
        document.getElementById('autoCapitalize').checked = currentVoiceSettings.autoCapitalize;
        document.getElementById('autoCorrect').checked = currentVoiceSettings.autoCorrect;
        document.getElementById('numberConversion').checked = currentVoiceSettings.numberConversion;
        
        showVoiceToast('تم إعادة تعيين الإعدادات إلى القيم الافتراضية', 'info');
    }
}

// ==============================
// مراقبة الحقول الجديدة
// ==============================
function observeNewFields() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // البحث عن حقول إدخال جديدة
                    const newFields = node.querySelectorAll ? 
                        node.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select') : 
                        [];
                    
                    newFields.forEach(field => {
                        if (!shouldExcludeField(field) && !field.closest('.voice-input-wrapper')) {
                            addMicrophoneToField(field);
                        }
                    });
                    
                    // فحص العقدة نفسها إذا كانت حقل إدخال
                    if (node.matches && node.matches('input[type="text"], input[type="number"], input[type="tel"], input[type="email"], textarea, select')) {
                        if (!shouldExcludeField(node) && !node.closest('.voice-input-wrapper')) {
                            addMicrophoneToField(node);
                        }
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

// ==============================
// إعداد اختصارات لوحة المفاتيح
// ==============================
function setupVoiceKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+V لبدء الإدخال الصوتي للحقل المركز عليه
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            
            const focusedElement = document.activeElement;
            if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA' || focusedElement.tagName === 'SELECT')) {
                const micButtonData = micButtons.find(({ field }) => field === focusedElement);
                if (micButtonData) {
                    startVoiceInput(focusedElement, micButtonData.button);
                }
            } else {
                showVoiceToast('يرجى التركيز على حقل إدخال أولاً', 'info');
            }
        }
        
        // Ctrl+Shift+S لإظهار إعدادات الصوت
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showVoiceControlPanel();
        }
        
        // Escape لإيقاف التسجيل
        if (e.key === 'Escape' && isListening) {
            e.preventDefault();
            stopVoiceInput();
        }
    });
}

// ==============================
// إظهار إشعارات الصوت
// ==============================
function showVoiceToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${type === 'warning' ? '#212529' : 'white'};
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// ==============================
// إنشاء زر عائم للتحكم الصوتي
// ==============================
function createFloatingVoiceButton() {
    const floatingButton = document.createElement('div');
    floatingButton.id = 'floating-voice-btn';
    floatingButton.innerHTML = '🎤';
    floatingButton.setAttribute('title', 'إعدادات الصوت (Ctrl+Shift+S)');
    
    floatingButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
        z-index: 1001;
        transition: all 0.3s ease;
    `;
    
    floatingButton.addEventListener('click', showVoiceControlPanel);
    
    floatingButton.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 12px 35px rgba(231, 76, 60, 0.4)';
    });
    
    floatingButton.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.3)';
    });
    
    document.body.appendChild(floatingButton);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeVoiceSystem();
        createFloatingVoiceButton();
    }, 1000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.voiceInputSystem = {
    start: startVoiceInput,
    stop: stopVoiceInput,
    showSettings: showVoiceControlPanel,
    hideSettings: closeVoiceControlPanel,
    test: testVoiceInput,
    settings: currentVoiceSettings,
    isListening: () => isListening,
    addToField: addMicrophoneToField
};

// ==============================
// معلومات التشخيص
// ==============================
window.voiceDebug = function() {
    return {
        isInitialized: isInitialized,
        isListening: isListening,
        currentField: currentField ? currentField.id || currentField.tagName : null,
        micButtonsCount: micButtons.length,
        settings: currentVoiceSettings,
        browserSupport: checkBrowserSupport(),
        recognition: !!recognition
    };
};

console.log('🎤 تم تحميل نظام الإدخال الصوتي بنجاح!');
console.log('💡 استخدم voiceInputSystem للتحكم أو voiceDebug() للتشخيص');
console.log('⌨️ اختصارات: Ctrl+Shift+V (تسجيل صوتي) | Ctrl+Shift+S (الإعدادات) | Escape (إيقاف)');
