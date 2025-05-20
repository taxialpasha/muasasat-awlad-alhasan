/**
 * حل مشكلة الإعدادات وتفعيل وضع الظلام/النور
 * هذا الكود يصلح آلية تطبيق الإعدادات وحفظها
 */
(function fixSettings() {
    console.log("جاري إصلاح مشكلة الإعدادات...");
    
    // 1. تحسين دالة toggleTheme
    window.toggleTheme = function() {
        // تبديل حالة الوضع المظلم
        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        
        // تطبيق الوضع الجديد
        if (isDarkMode) {
            // التحويل للوضع المضيء
            document.documentElement.classList.remove('dark-mode');
            document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
            
            // تحديث الإعدادات
            window.settings.themeMode = 'light';
        } else {
            // التحويل للوضع المظلم
            document.documentElement.classList.add('dark-mode');
            document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
            
            // تحديث الإعدادات
            window.settings.themeMode = 'dark';
        }
        
        // حفظ الإعدادات في localStorage
        localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
        
        console.log(`تم التبديل إلى: ${window.settings.themeMode === 'dark' ? 'الوضع المظلم' : 'الوضع المضيء'}`);
    };
    
    // 2. تحسين دالة تطبيق الإعدادات
    window.applyThemeSettings = function() {
        // التحقق من وجود الإعدادات
        if (!window.settings) {
            console.error("الإعدادات غير متوفرة!");
            return;
        }
        
        // تطبيق وضع الظلام/النور
        if (window.settings.themeMode === 'dark') {
            document.documentElement.classList.add('dark-mode');
            if (document.getElementById('theme-toggle-btn')) {
                document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
            }
        } else if (window.settings.themeMode === 'light') {
            document.documentElement.classList.remove('dark-mode');
            if (document.getElementById('theme-toggle-btn')) {
                document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
            }
        } else if (window.settings.themeMode === 'auto') {
            // الاعتماد على إعدادات النظام
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark-mode');
                if (document.getElementById('theme-toggle-btn')) {
                    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
                }
            } else {
                document.documentElement.classList.remove('dark-mode');
                if (document.getElementById('theme-toggle-btn')) {
                    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
                }
            }
        }
        
        // تطبيق لون السمة الرئيسي
        document.documentElement.style.setProperty('--primary-color', window.settings.themeColor);
        document.documentElement.style.setProperty('--primary-dark', adjustColor(window.settings.themeColor, -20));
        document.documentElement.style.setProperty('--primary-light', adjustColor(window.settings.themeColor, 20));
        
        // تطبيق حجم الخط
        let fontSizeValue = '1rem';
        switch (window.settings.fontSize) {
            case 'small': fontSizeValue = '0.875rem'; break;
            case 'medium': fontSizeValue = '1rem'; break;
            case 'large': fontSizeValue = '1.125rem'; break;
        }
        document.documentElement.style.setProperty('--font-size', fontSizeValue);
        
        // تطبيق إعدادات التأثيرات الحركية
        document.body.classList.remove('no-animations', 'reduced-animations');
        if (window.settings.animations === 'disabled') {
            document.body.classList.add('no-animations');
        } else if (window.settings.animations === 'reduced') {
            document.body.classList.add('reduced-animations');
        }
        
        console.log("تم تطبيق الإعدادات بنجاح");
    };
    
    // 3. تحسين دالة تلوين السمة
    window.changeThemeColor = function(element) {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => option.classList.remove('active'));
        
        element.classList.add('active');
        const color = element.dataset.color;
        window.settings.themeColor = color;
        
        // تطبيق اللون الجديد
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-dark', adjustColor(color, -20));
        document.documentElement.style.setProperty('--primary-light', adjustColor(color, 20));
        
        // حفظ الإعدادات
        localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
        
        console.log(`تم تغيير لون السمة إلى: ${color}`);
    };
    
    // 4. استدعاء تطبيق الإعدادات عند تحميل الصفحة
    function initialApplySettings() {
        // التحقق من وجود الإعدادات
        if (!window.settings) {
            try {
                // محاولة استرجاع الإعدادات من localStorage
                const storedSettings = localStorage.getItem('charityAppSettings');
                if (storedSettings) {
                    window.settings = JSON.parse(storedSettings);
                }
            } catch (e) {
                console.error("خطأ في استرجاع الإعدادات:", e);
            }
        }
        
        // تطبيق الإعدادات إذا وجدت
        if (window.settings) {
            window.applyThemeSettings();
        }
    }
    
    // تطبيق الإعدادات فوراً
    initialApplySettings();
    
    // تطبيق الإعدادات مرة أخرى بعد ثانية للتأكد من تحميل العناصر
    setTimeout(initialApplySettings, 1000);
    
    // 5. تحسين دالة تغيير وضع السمة من إعدادات الواجهة
    window.changeThemeMode = function(mode) {
        // تحديث الإعدادات
        window.settings.themeMode = mode;
        
        // تطبيق الوضع الجديد
        window.applyThemeSettings();
        
        // حفظ الإعدادات
        localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
        
        console.log(`تم تغيير وضع السمة إلى: ${mode}`);
    };
    
    // 6. تحسين دالة حفظ الإعدادات
    const originalSaveSettings = window.saveSettings;
    
    window.saveSettings = function() {
        // استدعاء الدالة الأصلية إذا وجدت
        if (typeof originalSaveSettings === 'function') {
            originalSaveSettings.call(this);
        } else {
            // حفظ الإعدادات يدوياً إذا لم تكن الدالة الأصلية موجودة
            window.settings.orgName = document.getElementById('setting-org-name').value;
            window.settings.organizer = document.getElementById('setting-organizer').value;
            window.settings.adminNames = document.getElementById('setting-admin-names').value;
            window.settings.autoSave = document.getElementById('auto-save').value;
            window.settings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value);
            window.settings.themeMode = document.getElementById('theme-mode').value;
            window.settings.fontSize = document.getElementById('font-size').value;
            window.settings.animations = document.getElementById('animation-setting').value;
            window.settings.paperSize = document.getElementById('paper-size').value;
            window.settings.printOrientation = document.getElementById('print-orientation').value;
            window.settings.printHeader = document.getElementById('print-header').value;
            window.settings.printFooter = document.getElementById('print-footer').value;
            window.settings.printQrSize = document.getElementById('print-qr-size').value;
            window.settings.printPreview = document.getElementById('print-preview').value;
            window.settings.caseIdFormat = document.getElementById('case-id-format').value;
            window.settings.customCaseIdFormat = document.getElementById('custom-case-id-format').value;
            window.settings.dataLocation = document.getElementById('data-location').value;
            window.settings.caseLockTimeout = parseInt(document.getElementById('case-lock-timeout').value);
            
            // حفظ الإعدادات في localStorage
            localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
            
            // تطبيق الإعدادات
            window.applyThemeSettings();
            
            // إظهار رسالة نجاح
            if (typeof showToast === 'function') {
                showToast('تم حفظ الإعدادات بنجاح', 'success');
            } else {
                alert('تم حفظ الإعدادات بنجاح');
            }
            
            // إغلاق نافذة الإعدادات إذا كانت مفتوحة
            if (typeof closeModal === 'function') {
                closeModal('settings-modal');
            }
        }
    };
    
    console.log("تم إصلاح مشكلة الإعدادات بنجاح");
})();

// دالة مساعدة لتعديل الألوان
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}






/**
 * حل مشاكل نظام إدارة الحالات الخيرية
 * يعالج:
 * 1. مشكلة حفظ واسترجاع المستمسكات
 * 2. مشكلة تفعيل الإعدادات والوضع المظلم/المضيء
 */
(function() {
    console.log("جاري إصلاح مشاكل النظام...");
    
    // دالة مساعدة لتعديل الألوان
    function adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }
    
    /**
     * 1. إصلاح مشكلة حفظ واسترجاع المستمسكات
     */
    (function fixDocumentsStorage() {
        console.log("جاري إصلاح مشكلة حفظ المستمسكات...");
        
        // 1. إصلاح دالة حفظ الحالة لتحفظ المستمسكات بشكل صحيح
        const originalSaveCase = window.saveCase;
        
        window.saveCase = function() {
            // الحصول على بيانات النموذج
            const formData = window.getFormData ? window.getFormData() : {};
            const caseId = formData.caseId;
            
            // توثيق المستمسكات قبل الحفظ
            console.log(`حفظ المستمسكات للحالة ${caseId}:`, window.currentCaseDocuments ? window.currentCaseDocuments.length : 0);
            
            // حفظ المستمسكات في localStorage بمفتاح منفصل مرتبط بمعرف الحالة
            if (window.currentCaseDocuments && window.currentCaseDocuments.length > 0) {
                // حفظ معلومات المستمسكات بدون البيانات الكبيرة
                const documentsMetadata = window.currentCaseDocuments.map(doc => {
                    // حفظ بيانات الملف في مفتاح منفصل
                    const dataKey = `doc_data_${caseId}_${doc.id}`;
                    try {
                        localStorage.setItem(dataKey, doc.data);
                    } catch (e) {
                        console.warn(`خطأ في تخزين بيانات المستمسك ${doc.id}:`, e);
                    }
                    
                    // إنشاء نسخة من المستمسك بدون البيانات الكبيرة للحفظ مع الحالة
                    const docCopy = { ...doc };
                    delete docCopy.data;
                    docCopy.dataKey = dataKey;
                    return docCopy;
                });
                
                // حفظ معلومات المستمسكات مع الحالة
                formData.documentsMetadata = documentsMetadata;
                
                // حفظ قائمة معرفات المستمسكات بمفتاح منفصل للتتبع
                const docsList = `docs_list_${caseId}`;
                localStorage.setItem(docsList, JSON.stringify(documentsMetadata.map(d => d.id)));
            }
            
            // استدعاء دالة الحفظ الأصلية
            return originalSaveCase.call(this, formData);
        };
        
        // 2. إصلاح دالة عرض الحالة لاسترجاع المستمسكات بشكل صحيح
        const originalViewCase = window.viewCase;
        
        window.viewCase = function(caseId, caseType) {
            // استدعاء الدالة الأصلية أولاً
            originalViewCase.call(this, caseId, caseType);
            
            // البحث عن الحالة
            const caseItem = window.findCaseById(caseId, caseType);
            
            if (!caseItem) {
                console.error(`لم يتم العثور على الحالة: ${caseId}`);
                return;
            }
            
            // إعادة تعيين مصفوفة المستمسكات
            window.currentCaseDocuments = [];
            
            // استرجاع المستمسكات إذا وجدت
            if (caseItem.documentsMetadata && Array.isArray(caseItem.documentsMetadata)) {
                console.log(`استعادة ${caseItem.documentsMetadata.length} مستمسك للحالة ${caseId}`);
                
                // استرجاع بيانات كل مستمسك من localStorage
                window.currentCaseDocuments = caseItem.documentsMetadata.map(docMeta => {
                    try {
                        // استرجاع بيانات الملف من localStorage
                        const data = localStorage.getItem(docMeta.dataKey);
                        
                        // إنشاء كائن المستمسك الكامل
                        return {
                            ...docMeta,
                            data: data || '' // استخدام سلسلة فارغة إذا لم يتم العثور على البيانات
                        };
                    } catch (e) {
                        console.error(`خطأ في استرجاع بيانات المستمسك ${docMeta.id}:`, e);
                        return null;
                    }
                }).filter(doc => doc && doc.data); // تصفية المستمسكات غير الصالحة
            }
            
            // تحديث عرض المستمسكات
            setTimeout(() => {
                if (typeof addDocumentsSectionToForm === 'function') {
                    addDocumentsSectionToForm();
                }
                if (typeof renderDocumentsList === 'function') {
                    renderDocumentsList();
                }
            }, 500);
        };
        
        // 3. إضافة تعديل على دالة حذف الحالة لحذف المستمسكات المرتبطة بها
        const originalDeleteCase = window.deleteCase;
        
        if (originalDeleteCase) {
            window.deleteCase = function(caseId, caseType) {
                // حذف مستمسكات الحالة من localStorage
                try {
                    const docsList = `docs_list_${caseId}`;
                    const docsIds = JSON.parse(localStorage.getItem(docsList) || '[]');
                    
                    // حذف بيانات كل مستمسك
                    docsIds.forEach(docId => {
                        const dataKey = `doc_data_${caseId}_${docId}`;
                        localStorage.removeItem(dataKey);
                    });
                    
                    // حذف قائمة المستمسكات
                    localStorage.removeItem(docsList);
                    
                    console.log(`تم حذف مستمسكات الحالة ${caseId}`);
                } catch (e) {
                    console.warn(`خطأ في حذف مستمسكات الحالة ${caseId}:`, e);
                }
                
                // استدعاء دالة الحذف الأصلية
                return originalDeleteCase.call(this, caseId, caseType);
            };
        }
        
        console.log("تم إصلاح مشكلة حفظ المستمسكات بنجاح");
    })();
    
    /**
     * 2. إصلاح مشكلة الإعدادات وتفعيل وضع الظلام/النور
     */
    (function fixSettings() {
        console.log("جاري إصلاح مشكلة الإعدادات...");
        
        // 1. تحسين دالة toggleTheme
        window.toggleTheme = function() {
            // تبديل حالة الوضع المظلم
            const isDarkMode = document.documentElement.classList.contains('dark-mode');
            
            // تطبيق الوضع الجديد
            if (isDarkMode) {
                // التحويل للوضع المضيء
                document.documentElement.classList.remove('dark-mode');
                document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
                
                // تحديث الإعدادات
                window.settings.themeMode = 'light';
            } else {
                // التحويل للوضع المظلم
                document.documentElement.classList.add('dark-mode');
                document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
                
                // تحديث الإعدادات
                window.settings.themeMode = 'dark';
            }
            
            // حفظ الإعدادات في localStorage
            localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
            
            console.log(`تم التبديل إلى: ${window.settings.themeMode === 'dark' ? 'الوضع المظلم' : 'الوضع المضيء'}`);
        };
        
        // 2. تحسين دالة تطبيق الإعدادات
        window.applyThemeSettings = function() {
            // التحقق من وجود الإعدادات
            if (!window.settings) {
                console.error("الإعدادات غير متوفرة!");
                return;
            }
            
            // تطبيق وضع الظلام/النور
            if (window.settings.themeMode === 'dark') {
                document.documentElement.classList.add('dark-mode');
                if (document.getElementById('theme-toggle-btn')) {
                    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
                }
            } else if (window.settings.themeMode === 'light') {
                document.documentElement.classList.remove('dark-mode');
                if (document.getElementById('theme-toggle-btn')) {
                    document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
                }
            } else if (window.settings.themeMode === 'auto') {
                // الاعتماد على إعدادات النظام
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark-mode');
                    if (document.getElementById('theme-toggle-btn')) {
                        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
                    }
                } else {
                    document.documentElement.classList.remove('dark-mode');
                    if (document.getElementById('theme-toggle-btn')) {
                        document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
                    }
                }
            }
            
            // تطبيق لون السمة الرئيسي
            document.documentElement.style.setProperty('--primary-color', window.settings.themeColor);
            document.documentElement.style.setProperty('--primary-dark', adjustColor(window.settings.themeColor, -20));
            document.documentElement.style.setProperty('--primary-light', adjustColor(window.settings.themeColor, 20));
            
            // تطبيق حجم الخط
            let fontSizeValue = '1rem';
            switch (window.settings.fontSize) {
                case 'small': fontSizeValue = '0.875rem'; break;
                case 'medium': fontSizeValue = '1rem'; break;
                case 'large': fontSizeValue = '1.125rem'; break;
            }
            document.documentElement.style.setProperty('--font-size', fontSizeValue);
            
            // تطبيق إعدادات التأثيرات الحركية
            document.body.classList.remove('no-animations', 'reduced-animations');
            if (window.settings.animations === 'disabled') {
                document.body.classList.add('no-animations');
            } else if (window.settings.animations === 'reduced') {
                document.body.classList.add('reduced-animations');
            }
            
            console.log("تم تطبيق الإعدادات بنجاح");
        };
        
        // 3. تحسين دالة تلوين السمة
        window.changeThemeColor = function(element) {
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => option.classList.remove('active'));
            
            element.classList.add('active');
            const color = element.dataset.color;
            window.settings.themeColor = color;
            
            // تطبيق اللون الجديد
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-dark', adjustColor(color, -20));
            document.documentElement.style.setProperty('--primary-light', adjustColor(color, 20));
            
            // حفظ الإعدادات
            localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
            
            console.log(`تم تغيير لون السمة إلى: ${color}`);
        };
        
        // 4. استدعاء تطبيق الإعدادات عند تحميل الصفحة
        function initialApplySettings() {
            // التحقق من وجود الإعدادات
            if (!window.settings) {
                try {
                    // محاولة استرجاع الإعدادات من localStorage
                    const storedSettings = localStorage.getItem('charityAppSettings');
                    if (storedSettings) {
                        window.settings = JSON.parse(storedSettings);
                    }
                } catch (e) {
                    console.error("خطأ في استرجاع الإعدادات:", e);
                }
            }
            
            // تطبيق الإعدادات إذا وجدت
            if (window.settings) {
                window.applyThemeSettings();
            }
        }
        
        // تطبيق الإعدادات فوراً
        initialApplySettings();
        
        // تطبيق الإعدادات مرة أخرى بعد ثانية للتأكد من تحميل العناصر
        setTimeout(initialApplySettings, 1000);
        
        // 5. تحسين دالة تغيير وضع السمة من إعدادات الواجهة
        window.changeThemeMode = function(mode) {
            // تحديث الإعدادات
            window.settings.themeMode = mode;
            
            // تطبيق الوضع الجديد
            window.applyThemeSettings();
            
            // حفظ الإعدادات
            localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
            
            console.log(`تم تغيير وضع السمة إلى: ${mode}`);
        };
        
        // 6. تحسين دالة حفظ الإعدادات
        const originalSaveSettings = window.saveSettings;
        
        window.saveSettings = function() {
            // استدعاء الدالة الأصلية إذا وجدت
            if (typeof originalSaveSettings === 'function') {
                originalSaveSettings.call(this);
            } else {
                // حفظ الإعدادات يدوياً إذا لم تكن الدالة الأصلية موجودة
                window.settings.orgName = document.getElementById('setting-org-name').value;
                window.settings.organizer = document.getElementById('setting-organizer').value;
                window.settings.adminNames = document.getElementById('setting-admin-names').value;
                window.settings.autoSave = document.getElementById('auto-save').value;
                window.settings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value);
                window.settings.themeMode = document.getElementById('theme-mode').value;
                window.settings.fontSize = document.getElementById('font-size').value;
                window.settings.animations = document.getElementById('animation-setting').value;
                window.settings.paperSize = document.getElementById('paper-size').value;
                window.settings.printOrientation = document.getElementById('print-orientation').value;
                window.settings.printHeader = document.getElementById('print-header').value;
                window.settings.printFooter = document.getElementById('print-footer').value;
                window.settings.printQrSize = document.getElementById('print-qr-size').value;
                window.settings.printPreview = document.getElementById('print-preview').value;
                window.settings.caseIdFormat = document.getElementById('case-id-format').value;
                window.settings.customCaseIdFormat = document.getElementById('custom-case-id-format').value;
                window.settings.dataLocation = document.getElementById('data-location').value;
                window.settings.caseLockTimeout = parseInt(document.getElementById('case-lock-timeout').value);
                
                // حفظ الإعدادات في localStorage
                localStorage.setItem('charityAppSettings', JSON.stringify(window.settings));
                
                // تطبيق الإعدادات
                window.applyThemeSettings();
                
                // إظهار رسالة نجاح
                if (typeof showToast === 'function') {
                    showToast('تم حفظ الإعدادات بنجاح', 'success');
                } else {
                    alert('تم حفظ الإعدادات بنجاح');
                }
                
                // إغلاق نافذة الإعدادات إذا كانت مفتوحة
                if (typeof closeModal === 'function') {
                    closeModal('settings-modal');
                }
            }
        };
        
        console.log("تم إصلاح مشكلة الإعدادات بنجاح");
    })();
    
    // تنفيذ مهام أخرى بعد الإصلاح
    setTimeout(function() {
        // تحديث واجهة المستخدم بعد تطبيق الإصلاحات
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
        
        if (typeof updateSidebarBadges === 'function') {
            updateSidebarBadges();
        }
        
        console.log("تم إصلاح جميع المشاكل بنجاح");
    }, 1500);
})();



/**
 * حل مشكلة تجاوز سعة التخزين عند حفظ المستمسكات
 * يستخدم IndexedDB بدلاً من localStorage لتخزين الملفات الكبيرة
 */
(function fixStorageQuotaIssue() {
    console.log("جاري إصلاح مشكلة تجاوز سعة التخزين...");
    
    // 1. تهيئة قاعدة بيانات IndexedDB
    let db = null;
    const DB_NAME = 'CharityDocsDB';
    const DB_VERSION = 1;
    const DOCS_STORE = 'documents';
    
    // فتح/إنشاء قاعدة البيانات
    function initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }
            
            if (!window.indexedDB) {
                console.error("متصفحك لا يدعم IndexedDB، سيتم محاولة استخدام localStorage كحل بديل");
                resolve(null);
                return;
            }
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error("خطأ في فتح قاعدة بيانات IndexedDB:", event.target.error);
                resolve(null);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // إنشاء مخزن للمستمسكات إذا لم يكن موجودًا
                if (!db.objectStoreNames.contains(DOCS_STORE)) {
                    db.createObjectStore(DOCS_STORE, { keyPath: 'docKey' });
                    console.log("تم إنشاء مخزن المستمسكات في IndexedDB");
                }
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("تم فتح قاعدة بيانات IndexedDB بنجاح");
                resolve(db);
            };
        });
    }
    
    // حفظ بيانات المستمسك في IndexedDB
    function saveDocToIndexedDB(docKey, docData) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await initIndexedDB();
                
                if (!db) {
                    // الرجوع إلى localStorage إذا كان IndexedDB غير متاح
                    try {
                        localStorage.setItem(docKey, docData);
                        resolve(true);
                    } catch (e) {
                        console.error(`فشل حفظ المستمسك في localStorage: ${e.message}`);
                        reject(e);
                    }
                    return;
                }
                
                const transaction = db.transaction([DOCS_STORE], 'readwrite');
                const store = transaction.objectStore(DOCS_STORE);
                
                const request = store.put({ docKey, docData });
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error("خطأ في حفظ المستمسك:", event.target.error);
                    reject(event.target.error);
                };
                
                transaction.oncomplete = () => {
                    console.log(`تم حفظ المستمسك ${docKey} في IndexedDB`);
                };
            } catch (e) {
                console.error("خطأ في حفظ المستمسك:", e);
                reject(e);
            }
        });
    }
    
    // استرجاع بيانات المستمسك من IndexedDB
    function getDocFromIndexedDB(docKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await initIndexedDB();
                
                if (!db) {
                    // الرجوع إلى localStorage إذا كان IndexedDB غير متاح
                    try {
                        const data = localStorage.getItem(docKey);
                        resolve(data);
                    } catch (e) {
                        console.error(`فشل استرجاع المستمسك من localStorage: ${e.message}`);
                        resolve(null);
                    }
                    return;
                }
                
                const transaction = db.transaction([DOCS_STORE], 'readonly');
                const store = transaction.objectStore(DOCS_STORE);
                
                const request = store.get(docKey);
                
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result.docData);
                    } else {
                        // إذا لم يتم العثور على المستمسك في IndexedDB، نحاول localStorage
                        try {
                            const data = localStorage.getItem(docKey);
                            resolve(data);
                        } catch (e) {
                            resolve(null);
                        }
                    }
                };
                
                request.onerror = (event) => {
                    console.error("خطأ في استرجاع المستمسك:", event.target.error);
                    reject(event.target.error);
                };
            } catch (e) {
                console.error("خطأ في استرجاع المستمسك:", e);
                reject(e);
            }
        });
    }
    
    // حذف المستمسك من IndexedDB
    function deleteDocFromIndexedDB(docKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await initIndexedDB();
                
                if (!db) {
                    // الرجوع إلى localStorage إذا كان IndexedDB غير متاح
                    try {
                        localStorage.removeItem(docKey);
                        resolve(true);
                    } catch (e) {
                        console.error(`فشل حذف المستمسك من localStorage: ${e.message}`);
                        resolve(false);
                    }
                    return;
                }
                
                const transaction = db.transaction([DOCS_STORE], 'readwrite');
                const store = transaction.objectStore(DOCS_STORE);
                
                const request = store.delete(docKey);
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error("خطأ في حذف المستمسك:", event.target.error);
                    resolve(false);
                };
            } catch (e) {
                console.error("خطأ في حذف المستمسك:", e);
                resolve(false);
            }
        });
    }
    
    // 2. تعديل دالة حفظ الحالة لاستخدام IndexedDB
    const originalSaveCase = window.saveCase;
    
    window.saveCase = async function() {
        try {
            // الحصول على بيانات النموذج
            const formData = window.getFormData ? window.getFormData() : {};
            const caseId = formData.caseId;
            
            // توثيق المستمسكات قبل الحفظ
            console.log(`حفظ المستمسكات للحالة ${caseId}:`, window.currentCaseDocuments ? window.currentCaseDocuments.length : 0);
            
            // حفظ المستمسكات في IndexedDB
            if (window.currentCaseDocuments && window.currentCaseDocuments.length > 0) {
                // حفظ معلومات المستمسكات بدون البيانات الكبيرة
                const documentsMetadata = [];
                const savePromises = [];
                
                for (const doc of window.currentCaseDocuments) {
                    const docKey = `doc_data_${caseId}_${doc.id}`;
                    
                    // نحاول حفظ بيانات الملف في قاعدة البيانات
                    savePromises.push(
                        saveDocToIndexedDB(docKey, doc.data)
                        .then(() => {
                            // إنشاء نسخة من المستمسك بدون البيانات الكبيرة
                            const docCopy = { ...doc };
                            delete docCopy.data;
                            docCopy.dataKey = docKey;
                            documentsMetadata.push(docCopy);
                        })
                        .catch(err => {
                            console.error(`فشل حفظ المستمسك ${doc.id}:`, err);
                            // الاستمرار بالرغم من الخطأ
                        })
                    );
                }
                
                // انتظار انتهاء جميع عمليات الحفظ
                await Promise.allSettled(savePromises);
                
                // حفظ معلومات المستمسكات مع الحالة
                formData.documentsMetadata = documentsMetadata;
                
                // حفظ قائمة معرفات المستمسكات للتتبع
                const docsList = `docs_list_${caseId}`;
                localStorage.setItem(docsList, JSON.stringify(documentsMetadata.map(d => d.id)));
            }
            
            // استدعاء دالة الحفظ الأصلية
            return originalSaveCase.call(this, formData);
        } catch (error) {
            console.error("خطأ أثناء حفظ الحالة:", error);
            
            // إظهار رسالة خطأ للمستخدم
            if (typeof showToast === 'function') {
                showToast('حدث خطأ أثناء حفظ المستمسكات. يرجى التحقق من حجم الملفات.', 'error');
            } else {
                alert('حدث خطأ أثناء حفظ المستمسكات. يرجى التحقق من حجم الملفات.');
            }
            
            // استمر في الحفظ بدون المستمسكات
            return originalSaveCase.call(this, formData);
        }
    };
    
    // 3. تعديل دالة عرض الحالة لاسترجاع المستمسكات من IndexedDB
    const originalViewCase = window.viewCase;
    
    window.viewCase = async function(caseId, caseType) {
        // استدعاء الدالة الأصلية أولاً
        originalViewCase.call(this, caseId, caseType);
        
        try {
            // البحث عن الحالة
            const caseItem = window.findCaseById(caseId, caseType);
            
            if (!caseItem) {
                console.error(`لم يتم العثور على الحالة: ${caseId}`);
                return;
            }
            
            // إعادة تعيين مصفوفة المستمسكات
            window.currentCaseDocuments = [];
            
            // استرجاع المستمسكات إذا وجدت
            if (caseItem.documentsMetadata && Array.isArray(caseItem.documentsMetadata)) {
                console.log(`استعادة ${caseItem.documentsMetadata.length} مستمسك للحالة ${caseId}`);
                
                const loadPromises = caseItem.documentsMetadata.map(async (docMeta) => {
                    try {
                        // استرجاع بيانات الملف من IndexedDB
                        const data = await getDocFromIndexedDB(docMeta.dataKey);
                        
                        if (data) {
                            // إنشاء كائن المستمسك الكامل
                            return {
                                ...docMeta,
                                data: data
                            };
                        }
                        return null;
                    } catch (e) {
                        console.error(`خطأ في استرجاع بيانات المستمسك ${docMeta.id}:`, e);
                        return null;
                    }
                });
                
                // انتظار استرجاع جميع المستمسكات
                const docs = await Promise.all(loadPromises);
                
                // تصفية المستمسكات غير الصالحة
                window.currentCaseDocuments = docs.filter(doc => doc !== null);
            }
            
            // تحديث عرض المستمسكات
            setTimeout(() => {
                if (typeof addDocumentsSectionToForm === 'function') {
                    addDocumentsSectionToForm();
                }
                if (typeof renderDocumentsList === 'function') {
                    renderDocumentsList();
                }
            }, 500);
        } catch (error) {
            console.error("خطأ أثناء استرجاع المستمسكات:", error);
        }
    };
    
    // 4. تعديل دالة حذف الحالة لحذف المستمسكات من IndexedDB
    const originalDeleteCase = window.deleteCase;
    
    if (originalDeleteCase) {
        window.deleteCase = async function(caseId, caseType) {
            try {
                // حذف مستمسكات الحالة من IndexedDB
                const docsList = `docs_list_${caseId}`;
                const docsIdsStr = localStorage.getItem(docsList);
                
                if (docsIdsStr) {
                    const docsIds = JSON.parse(docsIdsStr);
                    
                    // حذف بيانات كل مستمسك
                    const deletePromises = docsIds.map(docId => {
                        const dataKey = `doc_data_${caseId}_${docId}`;
                        return deleteDocFromIndexedDB(dataKey);
                    });
                    
                    await Promise.allSettled(deletePromises);
                    
                    // حذف قائمة المستمسكات
                    localStorage.removeItem(docsList);
                    
                    console.log(`تم حذف مستمسكات الحالة ${caseId}`);
                }
            } catch (e) {
                console.warn(`خطأ في حذف مستمسكات الحالة ${caseId}:`, e);
            }
            
            // استدعاء دالة الحذف الأصلية
            return originalDeleteCase.call(this, caseId, caseType);
        };
    }
    
    // 5. تعديل دالة deleteDoc لحذف المستمسك من IndexedDB
    const originalDeleteDoc = window.deleteDoc;
    
    if (originalDeleteDoc) {
        window.deleteDoc = function(docId) {
            // احتفظ بالسلوك الأصلي للتأكيد
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'تأكيد الحذف',
                    text: 'هل أنت متأكد من رغبتك في حذف هذا المستمسك؟',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#9ca3af',
                    confirmButtonText: 'نعم، حذف',
                    cancelButtonText: 'إلغاء'
                }).then((result) => {
                    if (result.isConfirmed) {
                        removeDocumentEnhanced(docId);
                    }
                });
            } else {
                if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستمسك؟')) {
                    removeDocumentEnhanced(docId);
                }
            }
        };
    }
    
    // دالة مساعدة لحذف المستمسك من IndexedDB والذاكرة
    async function removeDocumentEnhanced(docId) {
        // البحث عن المستمسك في المصفوفة الحالية
        const index = window.currentCaseDocuments.findIndex(d => d.id === docId);
        
        if (index === -1) return;
        
        const doc = window.currentCaseDocuments[index];
        
        // حذف بيانات المستمسك من IndexedDB إذا كان له مفتاح تخزين
        if (doc.dataKey) {
            try {
                await deleteDocFromIndexedDB(doc.dataKey);
            } catch (e) {
                console.warn(`خطأ في حذف بيانات المستمسك ${docId}:`, e);
            }
        }
        
        // حذف المستمسك من المصفوفة
        window.currentCaseDocuments.splice(index, 1);
        
        // تحديث عرض المستمسكات
        if (typeof renderDocumentsList === 'function') {
            renderDocumentsList();
        }
        
        // تحديث تبويبات المستمسكات إذا كانت مفتوحة
        if (document.getElementById('docs-modal') && typeof fillDocumentsTabs === 'function') {
            fillDocumentsTabs();
        }
        
        // عرض رسالة نجاح
        if (typeof showToast === 'function') {
            showToast('تم حذف المستمسك بنجاح', 'success');
        }
    }
    
    // 6. تهيئة IndexedDB عند تحميل الصفحة
    initIndexedDB().then(() => {
        console.log("تم تهيئة نظام تخزين المستمسكات بنجاح");
    }).catch(err => {
        console.error("فشل في تهيئة نظام تخزين المستمسكات:", err);
    });
    
    console.log("تم إصلاح مشكلة تجاوز سعة التخزين بنجاح");
})();
