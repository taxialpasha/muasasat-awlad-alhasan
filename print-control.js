/**
 * نظام التحكم في معاينة الطباعة
 * ملف منفصل للتحكم الكامل في إعدادات الطباعة
 * يمكن دمجه مع أي نظام دون تعديل الملف الرئيسي
 * 
 * الاستخدام: قم بتضمين هذا الملف في HTML الخاص بك
 * <script src="print-control.js"></script>
 */

// ==============================
// إعدادات الطباعة الافتراضية
// ==============================
const DEFAULT_PRINT_SETTINGS = {
    // إعدادات الورقة
    paperWidth: '20.3cm',
    paperHeight: '29cm',
    paperMargin: '0.35cm',
    
    // إعدادات الهيدر
    headerHeight: '90px',
    headerBorderWidth: '3.5px',
    headerBorderRadius: '12px',
    headerPadding: '10px',
    headerFontSize: '16px',
    headerFontWeight: '700',
    
    // إعدادات المحتوى
    contentPadding: '38px 18px 18px 18px',
    contentFontSize: '16px',
    contentFontWeight: '900',
    contentLineHeight: '1.4',
    rowMinHeight: '28px',
    rowMargin: '2px 0 1px 0',
    
    // إعدادات الخط والألوان
    fontFamily: 'Traditional Arabic, Arial, sans-serif',
    borderColor: '#000',
    backgroundColor: '#fff',
    textColor: '#2c1a1a',
    labelColor: '#0066cc',
    
    // إعدادات المسافات
    cellPadding: '2px 6px',
    labelMargin: '0 6px 0 0',
    thickDividerHeight: '2px',
    thickDividerMargin: '6px 0',
    
    // إعدادات التذييل
    footerPadding: '15px 0 10px 0',
    footerFontSize: '16px',
    footerFontWeight: '900',
    
    // إعدادات QR Code
    qrSize: '60px',
    qrBorder: '1px solid #000',
    
    // إعدادات الصور
    logoSize: '65px',
    
    // إعدادات خاصة بالهيدر
    headerBackgroundColor: '#ffeb3b',
    headerSayedColor: '#b9f6ca',
    headerAamColor: '#b3e5fc',
    headerExpensesColor: '#ffeb3b'
};

// ==============================
// متغيرات النظام
// ==============================
let currentPrintSettings = { ...DEFAULT_PRINT_SETTINGS };
let printControlPanel = null;
let originalPrintPreview = null;

// ==============================
// تهيئة نظام التحكم في الطباعة
// ==============================
function initializePrintControl() {
    // تحميل الإعدادات المحفوظة
    loadPrintSettings();
    
    // إنشاء لوحة التحكم
    createPrintControlPanel();
    
    // تعديل وظيفة معاينة الطباعة الأصلية
    enhanceOriginalPrintPreview();
    
    console.log('✅ تم تهيئة نظام التحكم في الطباعة بنجاح');
}

// ==============================
// إنشاء لوحة التحكم
// ==============================
function createPrintControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'print-control-panel';
    controlPanel.innerHTML = `
        <div class="print-control-overlay">
            <div class="print-control-container">
                <div class="print-control-header">
                    <h3>🎨 لوحة التحكم في الطباعة</h3>
                    <button class="close-control-btn" onclick="closePrintControlPanel()">✕</button>
                </div>
                
                <div class="print-control-body">
                    <div class="control-tabs">
                        <button class="tab-btn active" onclick="showControlTab('paper')">الورقة</button>
                        <button class="tab-btn" onclick="showControlTab('header')">الهيدر</button>
                        <button class="tab-btn" onclick="showControlTab('content')">المحتوى</button>
                        <button class="tab-btn" onclick="showControlTab('fonts')">الخطوط</button>
                        <button class="tab-btn" onclick="showControlTab('spacing')">المسافات</button>
                        <button class="tab-btn" onclick="showControlTab('colors')">الألوان</button>
                    </div>
                    
                    <div class="control-content">
                        <!-- تبويب الورقة -->
                        <div class="tab-content active" id="paper-tab">
                            <div class="control-section">
                                <h4>📄 إعدادات الورقة</h4>
                                <div class="control-row">
                                    <label>عرض الورقة:</label>
                                    <input type="text" id="paperWidth" value="${currentPrintSettings.paperWidth}">
                                </div>
                                <div class="control-row">
                                    <label>ارتفاع الورقة:</label>
                                    <input type="text" id="paperHeight" value="${currentPrintSettings.paperHeight}">
                                </div>
                                <div class="control-row">
                                    <label>هامش الورقة:</label>
                                    <input type="text" id="paperMargin" value="${currentPrintSettings.paperMargin}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب الهيدر -->
                        <div class="tab-content" id="header-tab">
                            <div class="control-section">
                                <h4>📋 إعدادات الهيدر</h4>
                                <div class="control-row">
                                    <label>ارتفاع الهيدر:</label>
                                    <input type="text" id="headerHeight" value="${currentPrintSettings.headerHeight}">
                                </div>
                                <div class="control-row">
                                    <label>سماكة الحدود:</label>
                                    <input type="text" id="headerBorderWidth" value="${currentPrintSettings.headerBorderWidth}">
                                </div>
                                <div class="control-row">
                                    <label>انحناء الحدود:</label>
                                    <input type="text" id="headerBorderRadius" value="${currentPrintSettings.headerBorderRadius}">
                                </div>
                                <div class="control-row">
                                    <label>حشو الهيدر:</label>
                                    <input type="text" id="headerPadding" value="${currentPrintSettings.headerPadding}">
                                </div>
                                <div class="control-row">
                                    <label>حجم خط الهيدر:</label>
                                    <input type="text" id="headerFontSize" value="${currentPrintSettings.headerFontSize}">
                                </div>
                                <div class="control-row">
                                    <label>سماكة خط الهيدر:</label>
                                    <input type="text" id="headerFontWeight" value="${currentPrintSettings.headerFontWeight}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب المحتوى -->
                        <div class="tab-content" id="content-tab">
                            <div class="control-section">
                                <h4>📝 إعدادات المحتوى</h4>
                                <div class="control-row">
                                    <label>حشو المحتوى:</label>
                                    <input type="text" id="contentPadding" value="${currentPrintSettings.contentPadding}">
                                </div>
                                <div class="control-row">
                                    <label>حجم خط المحتوى:</label>
                                    <input type="text" id="contentFontSize" value="${currentPrintSettings.contentFontSize}">
                                </div>
                                <div class="control-row">
                                    <label>سماكة خط المحتوى:</label>
                                    <input type="text" id="contentFontWeight" value="${currentPrintSettings.contentFontWeight}">
                                </div>
                                <div class="control-row">
                                    <label>ارتفاع السطر:</label>
                                    <input type="text" id="contentLineHeight" value="${currentPrintSettings.contentLineHeight}">
                                </div>
                                <div class="control-row">
                                    <label>أدنى ارتفاع للصف:</label>
                                    <input type="text" id="rowMinHeight" value="${currentPrintSettings.rowMinHeight}">
                                </div>
                                <div class="control-row">
                                    <label>هامش الصف:</label>
                                    <input type="text" id="rowMargin" value="${currentPrintSettings.rowMargin}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب الخطوط -->
                        <div class="tab-content" id="fonts-tab">
                            <div class="control-section">
                                <h4>🔤 إعدادات الخطوط</h4>
                                <div class="control-row">
                                    <label>عائلة الخط:</label>
                                    <select id="fontFamily">
                                        <option value="Traditional Arabic, Arial, sans-serif">Traditional Arabic</option>
                                        <option value="Arial, sans-serif">Arial</option>
                                        <option value="Times New Roman, serif">Times New Roman</option>
                                        <option value="Courier New, monospace">Courier New</option>
                                        <option value="Tahoma, sans-serif">Tahoma</option>
                                        <option value="Verdana, sans-serif">Verdana</option>
                                    </select>
                                </div>
                                <div class="control-row">
                                    <label>حجم خط التذييل:</label>
                                    <input type="text" id="footerFontSize" value="${currentPrintSettings.footerFontSize}">
                                </div>
                                <div class="control-row">
                                    <label>سماكة خط التذييل:</label>
                                    <input type="text" id="footerFontWeight" value="${currentPrintSettings.footerFontWeight}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب المسافات -->
                        <div class="tab-content" id="spacing-tab">
                            <div class="control-section">
                                <h4>📏 إعدادات المسافات</h4>
                                <div class="control-row">
                                    <label>حشو الخلايا:</label>
                                    <input type="text" id="cellPadding" value="${currentPrintSettings.cellPadding}">
                                </div>
                                <div class="control-row">
                                    <label>هامش التسميات:</label>
                                    <input type="text" id="labelMargin" value="${currentPrintSettings.labelMargin}">
                                </div>
                                <div class="control-row">
                                    <label>ارتفاع الفاصل السميك:</label>
                                    <input type="text" id="thickDividerHeight" value="${currentPrintSettings.thickDividerHeight}">
                                </div>
                                <div class="control-row">
                                    <label>هامش الفاصل السميك:</label>
                                    <input type="text" id="thickDividerMargin" value="${currentPrintSettings.thickDividerMargin}">
                                </div>
                                <div class="control-row">
                                    <label>حشو التذييل:</label>
                                    <input type="text" id="footerPadding" value="${currentPrintSettings.footerPadding}">
                                </div>
                                <div class="control-row">
                                    <label>حجم QR Code:</label>
                                    <input type="text" id="qrSize" value="${currentPrintSettings.qrSize}">
                                </div>
                                <div class="control-row">
                                    <label>حجم الشعار:</label>
                                    <input type="text" id="logoSize" value="${currentPrintSettings.logoSize}">
                                </div>
                            </div>
                        </div>
                        
                        <!-- تبويب الألوان -->
                        <div class="tab-content" id="colors-tab">
                            <div class="control-section">
                                <h4>🎨 إعدادات الألوان</h4>
                                <div class="control-row">
                                    <label>لون الحدود:</label>
                                    <input type="color" id="borderColor" value="#000000">
                                </div>
                                <div class="control-row">
                                    <label>لون الخلفية:</label>
                                    <input type="color" id="backgroundColor" value="#ffffff">
                                </div>
                                <div class="control-row">
                                    <label>لون النص:</label>
                                    <input type="color" id="textColor" value="#2c1a1a">
                                </div>
                                <div class="control-row">
                                    <label>لون التسميات:</label>
                                    <input type="color" id="labelColor" value="#0066cc">
                                </div>
                                <div class="control-row">
                                    <label>لون هيدر السيد:</label>
                                    <input type="color" id="headerSayedColor" value="#b9f6ca">
                                </div>
                                <div class="control-row">
                                    <label>لون هيدر العام:</label>
                                    <input type="color" id="headerAamColor" value="#b3e5fc">
                                </div>
                                <div class="control-row">
                                    <label>لون هيدر المصاريف:</label>
                                    <input type="color" id="headerExpensesColor" value="#ffeb3b">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="print-control-footer">
                    <button class="control-btn preview-btn" onclick="applyPrintSettings()">👁️ معاينة التغييرات</button>
                    <button class="control-btn save-btn" onclick="savePrintSettings()">💾 حفظ وتطبيق</button>
                    <button class="control-btn reset-btn" onclick="resetPrintSettings()">🔄 إعادة تعيين</button>
                    <button class="control-btn export-btn" onclick="exportPrintSettings()">📤 تصدير الإعدادات</button>
                    <button class="control-btn import-btn" onclick="importPrintSettings()">📥 استيراد الإعدادات</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة الأنماط
    const styles = document.createElement('style');
    styles.textContent = `
        .print-control-overlay {
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
            box-sizing: border-box;
        }
        
        .print-control-container {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }
        
        .print-control-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .print-control-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .close-control-btn {
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
        
        .close-control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .print-control-body {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .control-tabs {
            display: flex;
            border-bottom: 1px solid #e3e6f0;
            background: #f8f9fa;
        }
        
        .tab-btn {
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
        
        .tab-btn:hover {
            background: #e9ecef;
            color: #495057;
        }
        
        .tab-btn.active {
            color: #3498db;
            border-bottom-color: #3498db;
            background: white;
        }
        
        .control-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .control-section {
            margin-bottom: 25px;
        }
        
        .control-section h4 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #e3e6f0;
        }
        
        .control-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            gap: 15px;
        }
        
        .control-row label {
            min-width: 140px;
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
            transition: border-color 0.3s;
        }
        
        .control-row input:focus,
        .control-row select:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .control-row input[type="color"] {
            width: 50px;
            height: 40px;
            padding: 2px;
            cursor: pointer;
        }
        
        .print-control-footer {
            padding: 20px;
            background: #f8f9fa;
            border-top: 1px solid #e3e6f0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .control-btn {
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
            min-width: 130px;
            justify-content: center;
        }
        
        .preview-btn {
            background: #17a2b8;
            color: white;
        }
        
        .preview-btn:hover {
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
            .print-control-overlay {
                padding: 10px;
            }
            
            .print-control-container {
                max-height: 95vh;
            }
            
            .control-tabs {
                flex-wrap: wrap;
            }
            
            .tab-btn {
                flex: none;
                min-width: 120px;
                padding: 12px 15px;
                font-size: 13px;
            }
            
            .control-row {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            
            .control-row label {
                min-width: auto;
                font-size: 13px;
            }
            
            .print-control-footer {
                flex-direction: column;
            }
            
            .control-btn {
                width: 100%;
                min-width: auto;
            }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(controlPanel);
    
    // تعيين القيم الحالية
    setCurrentValuesToForm();
    
    printControlPanel = controlPanel;
}

// ==============================
// وظائف التحكم في التبويبات
// ==============================
function showControlTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // إظهار التبويب المطلوب
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// ==============================
// تطبيق الإعدادات على معاينة الطباعة
// ==============================
function applyPrintSettings() {
    // تحديث الإعدادات من النموذج
    updateSettingsFromForm();
    
    // تطبيق الإعدادات على معاينة الطباعة
    const printContainer = document.querySelector('.print-container');
    if (printContainer) {
        applySettingsToContainer(printContainer);
        showPrintControlToast('تم تطبيق التغييرات على المعاينة', 'success');
    } else {
        showPrintControlToast('لم يتم العثور على معاينة الطباعة', 'error');
    }
}

// ==============================
// تطبيق الإعدادات على الحاوية
// ==============================
function applySettingsToContainer(container) {
    // إعدادات الورقة
    container.style.width = currentPrintSettings.paperWidth;
    container.style.minHeight = currentPrintSettings.paperHeight;
    container.style.maxHeight = currentPrintSettings.paperHeight;
    container.style.margin = currentPrintSettings.paperMargin;
    container.style.padding = currentPrintSettings.contentPadding;
    container.style.fontSize = currentPrintSettings.contentFontSize;
    container.style.fontWeight = currentPrintSettings.contentFontWeight;
    container.style.lineHeight = currentPrintSettings.contentLineHeight;
    container.style.fontFamily = currentPrintSettings.fontFamily;
    container.style.backgroundColor = currentPrintSettings.backgroundColor;
    container.style.color = currentPrintSettings.textColor;
    
    // إعدادات الهيدر
    const header = container.querySelector('.print-header');
    if (header) {
        header.style.minHeight = currentPrintSettings.headerHeight;
        header.style.padding = currentPrintSettings.headerPadding;
        header.style.fontSize = currentPrintSettings.headerFontSize;
        header.style.fontWeight = currentPrintSettings.headerFontWeight;
        header.style.borderRadius = currentPrintSettings.headerBorderRadius + ' ' + currentPrintSettings.headerBorderRadius + ' 0 0';
        
        // تطبيق لون الهيدر حسب النوع
        if (header.classList.contains('header-sayed')) {
            header.style.backgroundColor = currentPrintSettings.headerSayedColor;
        } else if (header.classList.contains('header-aam')) {
            header.style.backgroundColor = currentPrintSettings.headerAamColor;
        } else {
            header.style.backgroundColor = currentPrintSettings.headerExpensesColor;
        }
    }
    
    // إعدادات الحدود
    const borderElement = container.querySelector('::before') || container;
    container.style.border = `${currentPrintSettings.headerBorderWidth} solid ${currentPrintSettings.borderColor}`;
    container.style.borderRadius = currentPrintSettings.headerBorderRadius;
    
    // إعدادات المحتوى
    const contentRows = container.querySelectorAll('.content-row');
    contentRows.forEach(row => {
        row.style.minHeight = currentPrintSettings.rowMinHeight;
        row.style.margin = currentPrintSettings.rowMargin;
    });
    
    // إعدادات الخلايا
    const cells = container.querySelectorAll('.content-cell');
    cells.forEach(cell => {
        cell.style.padding = currentPrintSettings.cellPadding;
        cell.style.fontSize = currentPrintSettings.contentFontSize;
        cell.style.fontWeight = currentPrintSettings.contentFontWeight;
        cell.style.lineHeight = currentPrintSettings.contentLineHeight;
    });
    
    // إعدادات التسميات
    const labels = container.querySelectorAll('.label');
    labels.forEach(label => {
        label.style.color = currentPrintSettings.labelColor;
        label.style.margin = currentPrintSettings.labelMargin;
        label.style.fontSize = currentPrintSettings.contentFontSize;
        label.style.fontWeight = currentPrintSettings.contentFontWeight;
    });
    
    // إعدادات القيم
    const values = container.querySelectorAll('.value');
    values.forEach(value => {
        value.style.color = currentPrintSettings.textColor;
        value.style.fontSize = currentPrintSettings.contentFontSize;
        value.style.fontWeight = currentPrintSettings.contentFontWeight;
    });
    
    // إعدادات الفواصل السميكة
    const thickDividers = container.querySelectorAll('.thick-divider');
    thickDividers.forEach(divider => {
        divider.style.height = currentPrintSettings.thickDividerHeight;
        divider.style.backgroundColor = currentPrintSettings.borderColor;
        divider.style.margin = currentPrintSettings.thickDividerMargin;
    });
    
    // إعدادات التذييل
    const footer = container.querySelector('.print-footer');
    if (footer) {
        footer.style.padding = currentPrintSettings.footerPadding;
        footer.style.fontSize = currentPrintSettings.footerFontSize;
        footer.style.fontWeight = currentPrintSettings.footerFontWeight;
    }
    
    // إعدادات QR Code
    const qrCode = container.querySelector('canvas');
    if (qrCode) {
        qrCode.style.maxWidth = currentPrintSettings.qrSize;
        qrCode.style.maxHeight = currentPrintSettings.qrSize;
        qrCode.style.border = currentPrintSettings.qrBorder;
    }
    
    // إعدادات الشعار
    const logo = container.querySelector('.header-center img');
    if (logo) {
        logo.style.width = currentPrintSettings.logoSize;
        logo.style.height = currentPrintSettings.logoSize;
    }
}

// ==============================
// حفظ الإعدادات
// ==============================
function savePrintSettings() {
    updateSettingsFromForm();
    
    try {
        localStorage.setItem('charity_print_settings', JSON.stringify(currentPrintSettings));
        applyPrintSettings();
        showPrintControlToast('تم حفظ الإعدادات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في حفظ إعدادات الطباعة:', error);
        showPrintControlToast('فشل في حفظ الإعدادات', 'error');
    }
}

// ==============================
// تحميل الإعدادات
// ==============================
function loadPrintSettings() {
    try {
        const savedSettings = localStorage.getItem('charity_print_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            currentPrintSettings = { ...DEFAULT_PRINT_SETTINGS, ...parsedSettings };
            console.log('تم تحميل إعدادات الطباعة المحفوظة');
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات الطباعة:', error);
        currentPrintSettings = { ...DEFAULT_PRINT_SETTINGS };
    }
}

// ==============================
// إعادة تعيين الإعدادات
// ==============================
function resetPrintSettings() {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع إعدادات الطباعة إلى القيم الافتراضية؟')) {
        currentPrintSettings = { ...DEFAULT_PRINT_SETTINGS };
        setCurrentValuesToForm();
        applyPrintSettings();
        showPrintControlToast('تم إعادة تعيين الإعدادات إلى القيم الافتراضية', 'info');
    }
}

// ==============================
// تصدير الإعدادات
// ==============================
function exportPrintSettings() {
    updateSettingsFromForm();
    
    const exportData = {
        printSettings: currentPrintSettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `print_settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showPrintControlToast('تم تصدير الإعدادات بنجاح', 'success');
}

// ==============================
// استيراد الإعدادات
// ==============================
function importPrintSettings() {
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
                
                if (importData.printSettings) {
                    currentPrintSettings = { ...DEFAULT_PRINT_SETTINGS, ...importData.printSettings };
                    setCurrentValuesToForm();
                    applyPrintSettings();
                    showPrintControlToast('تم استيراد الإعدادات بنجاح', 'success');
                } else {
                    showPrintControlToast('تنسيق الملف غير صحيح', 'error');
                }
            } catch (error) {
                console.error('خطأ في استيراد الإعدادات:', error);
                showPrintControlToast('خطأ في قراءة ملف الإعدادات', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==============================
// تحديث الإعدادات من النموذج
// ==============================
function updateSettingsFromForm() {
    const formElements = document.querySelectorAll('#print-control-panel input, #print-control-panel select');
    
    formElements.forEach(element => {
        if (element.id && currentPrintSettings.hasOwnProperty(element.id)) {
            currentPrintSettings[element.id] = element.value;
        }
    });
}

// ==============================
// تعيين القيم الحالية للنموذج
// ==============================
function setCurrentValuesToForm() {
    Object.keys(currentPrintSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = currentPrintSettings[key];
        }
    });
}

// ==============================
// إغلاق لوحة التحكم
// ==============================
function closePrintControlPanel() {
    if (printControlPanel) {
        document.body.removeChild(printControlPanel);
        printControlPanel = null;
    }
}

// ==============================
// إظهار لوحة التحكم
// ==============================
function showPrintControlPanel() {
    if (!printControlPanel) {
        createPrintControlPanel();
    }
}

// ==============================
// تحسين وظيفة معاينة الطباعة الأصلية
// ==============================
function enhanceOriginalPrintPreview() {
    // حفظ الوظيفة الأصلية
    if (typeof enhancedPrintPreview !== 'undefined') {
        originalPrintPreview = enhancedPrintPreview;
        
        // استبدال الوظيفة الأصلية بوظيفة محسنة
        window.enhancedPrintPreview = function(caseData = null) {
            originalPrintPreview(caseData).then(() => {
                // إضافة زر التحكم في الطباعة
                addPrintControlButton();
                
                // تطبيق الإعدادات المحفوظة
                setTimeout(() => {
                    applyPrintSettings();
                }, 500);
            });
        };
    }
}

// ==============================
// إضافة زر التحكم في الطباعة
// ==============================
function addPrintControlButton() {
    const printActions = document.getElementById('print-preview-actions');
    if (printActions && !document.getElementById('print-control-btn')) {
        const controlButton = document.createElement('button');
        controlButton.id = 'print-control-btn';
        controlButton.className = 'btn btn-warning';
        controlButton.innerHTML = '<i class="fas fa-cogs"></i><span>تحكم في الطباعة</span>';
        controlButton.onclick = showPrintControlPanel;
        
        // إدراج الزر في بداية الإجراءات
        printActions.insertBefore(controlButton, printActions.firstChild);
    }
}

// ==============================
// إظهار إشعارات خاصة بالتحكم في الطباعة
// ==============================
function showPrintControlToast(message, type = 'info') {
    // إنشاء إشعار مخصص
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
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
    
    // إظهار الإشعار
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ==============================
// تهيئة النظام عند تحميل الصفحة
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة قليلاً للتأكد من تحميل الملف الرئيسي
    setTimeout(() => {
        initializePrintControl();
    }, 1000);
});

// ==============================
// إتاحة الوظائف عالمياً
// ==============================
window.printControlSystem = {
    show: showPrintControlPanel,
    hide: closePrintControlPanel,
    apply: applyPrintSettings,
    save: savePrintSettings,
    reset: resetPrintSettings,
    export: exportPrintSettings,
    import: importPrintSettings,
    settings: currentPrintSettings
};

// ==============================
// معالج الأخطاء
// ==============================
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('print-control')) {
        console.error('خطأ في نظام التحكم في الطباعة:', e.error);
    }
});

console.log('🎨 تم تحميل نظام التحكم في الطباعة بنجاح!');
console.log('💡 استخدم printControlSystem.show() لإظهار لوحة التحكم');
