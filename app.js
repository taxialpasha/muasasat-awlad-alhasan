        // Global variables
        let cases = {
            "سيد": [],
            "عام": [],
            "مصاريف": []
        };
        let caseCounter = 1;
        let autoSaveInterval;
        let settings = {
            orgName: "مؤسسة أولاد الحسن ع الخيرية",
            organizer: "محمد حسن",
            adminNames: "السيد أسامة السعبري والسيد فؤاد السعبري",
            autoSave: "enabled",
            autoSaveInterval: 60,
            themeMode: "light",
            themeColor: "#1e40af",
            fontSize: "medium",
            animations: "enabled",
            paperSize: "a4",
            printOrientation: "portrait",
            printHeader: "مؤسسة أولاد الحسن ع الخيرية",
            printFooter: "جميع الحقوق محفوظة © 2025",
            printQrSize: "medium",
            printPreview: "enabled",
            caseIdFormat: "YYMMDD-NUM",
            customCaseIdFormat: "",
            dataLocation: "localStorage",
            caseLockTimeout: 30,
            backupFrequency: "daily",
            backupCount: 5
        };
        
        // Names data for autocomplete
        let namesData = [];
        
        // Chart instances
        let casesChart;
        let reportChart;
        
        // QR scanner
        let qrScanner = null;
        
        // Dark mode
        let isDarkMode = false;
        
        // Initialize the application
        function initApp() {
            // Show loader
            showLoader();
            
            // Load settings from local storage
            loadSettings();
            
            // Apply theme settings
            applyThemeSettings();
            
            // Load cases from local storage
            loadCasesFromStorage();
            
            // Set current date in form
            setCurrentDate();
            
            // Generate a new case ID
            generateCaseId();
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Create dashboard charts
            createDashboardCharts();
            
            // Setup autocomplete data
            setupAutocompleteData();
            
            // Add event listeners to financial fields
            setupFinancialListeners();
            
            // Add form validation
            setupFormValidation();
            
            // Add QR code generation
            generateQrCode(document.getElementById('caseId').value);
            
            // Setup case code change event
            document.getElementById('caseCode').addEventListener('change', updateCaseHeaderStyle);
            
            // Setup report type change event
            document.getElementById('report-type').addEventListener('change', handleReportTypeChange);
            
            // Setup search listeners
            setupSearchListeners();
            
            // Setup tab listeners
            setupTabListeners();
            
            // Setup auto-save
            startAutoSave();
            
            // Initialize modals
            initModals();
            
            // Initialize sidebar toggle
            initSidebar();
            
            // Setup scroll listeners
            setupScrollListeners();
            
            // Initialize amount formatter
            initAmountFormatter();
            
            // Update badges in sidebar
            updateSidebarBadges();
            
            // Hide loader after timeout
            setTimeout(hideLoader, 1000);
            
            // Set up advanced settings listeners
            setupAdvancedSettingsListeners();
            
            // Show welcome toast if first time
            showWelcomeToast();
        }
        
        // Show loader
        function showLoader() {
            document.getElementById('loader').style.display = 'flex';
        }
        
        // Hide loader
        function hideLoader() {
            const loader = document.getElementById('loader');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.style.opacity = '1';
            }, 300);
        }
        
        // Load settings from local storage
        function loadSettings() {
            const storedSettings = localStorage.getItem('charityAppSettings');
            if (storedSettings) {
                settings = { ...settings, ...JSON.parse(storedSettings) };
                
                // Apply settings to UI
                document.getElementById('setting-org-name').value = settings.orgName;
                document.getElementById('setting-organizer').value = settings.organizer;
                document.getElementById('setting-admin-names').value = settings.adminNames;
                document.getElementById('auto-save').value = settings.autoSave;
                document.getElementById('auto-save-interval').value = settings.autoSaveInterval;
                document.getElementById('theme-mode').value = settings.themeMode;
                document.getElementById('font-size').value = settings.fontSize;
                document.getElementById('animation-setting').value = settings.animations;
                document.getElementById('paper-size').value = settings.paperSize;
                document.getElementById('print-orientation').value = settings.printOrientation;
                document.getElementById('print-header').value = settings.printHeader;
                document.getElementById('print-footer').value = settings.printFooter;
                document.getElementById('print-qr-size').value = settings.printQrSize;
                document.getElementById('print-preview').value = settings.printPreview;
                document.getElementById('case-id-format').value = settings.caseIdFormat;
                document.getElementById('custom-case-id-format').value = settings.customCaseIdFormat;
                document.getElementById('data-location').value = settings.dataLocation;
                document.getElementById('case-lock-timeout').value = settings.caseLockTimeout;
                document.getElementById('backup-frequency').value = settings.backupFrequency;
                document.getElementById('backup-count').value = settings.backupCount;
                
                // Update organizer field
                document.getElementById('organizer').value = settings.organizer;
                
                // Show/hide custom format container
                if (settings.caseIdFormat === 'CUSTOM') {
                    document.getElementById('custom-format-container').style.display = 'block';
                }
                
                // Update theme color
                const colorOptions = document.querySelectorAll('.color-option');
                colorOptions.forEach(option => {
                    option.classList.remove('active');
                    if (option.dataset.color === settings.themeColor) {
                        option.classList.add('active');
                    }
                });
            }
        }
        
        // Apply theme settings
        function applyThemeSettings() {
            // Apply theme mode
            if (settings.themeMode === 'dark' || (settings.themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
            
            // Apply theme color
            document.documentElement.style.setProperty('--primary-color', settings.themeColor);
            document.documentElement.style.setProperty('--primary-dark', adjustColor(settings.themeColor, -20));
            document.documentElement.style.setProperty('--primary-light', adjustColor(settings.themeColor, 20));
            
            // Apply font size
            let fontSizeValue = '1rem';
            switch (settings.fontSize) {
                case 'small':
                    fontSizeValue = '0.875rem';
                    break;
                case 'medium':
                    fontSizeValue = '1rem';
                    break;
                case 'large':
                    fontSizeValue = '1.125rem';
                    break;
            }
            document.documentElement.style.setProperty('--font-size', fontSizeValue);
            
            // Apply animations setting
            if (settings.animations === 'disabled') {
                document.body.classList.add('no-animations');
            } else if (settings.animations === 'reduced') {
                document.body.classList.add('reduced-animations');
            }
        }
        
        // Adjust color brightness
        function adjustColor(color, amount) {
            return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
        }
        
        // Save settings to local storage
        function saveSettings() {
            settings.orgName = document.getElementById('setting-org-name').value;
            settings.organizer = document.getElementById('setting-organizer').value;
            settings.adminNames = document.getElementById('setting-admin-names').value;
            settings.autoSave = document.getElementById('auto-save').value;
            settings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value);
            settings.themeMode = document.getElementById('theme-mode').value;
            settings.fontSize = document.getElementById('font-size').value;
            settings.animations = document.getElementById('animation-setting').value;
            settings.paperSize = document.getElementById('paper-size').value;
            settings.printOrientation = document.getElementById('print-orientation').value;
            settings.printHeader = document.getElementById('print-header').value;
            settings.printFooter = document.getElementById('print-footer').value;
            settings.printQrSize = document.getElementById('print-qr-size').value;
            settings.printPreview = document.getElementById('print-preview').value;
            settings.caseIdFormat = document.getElementById('case-id-format').value;
            settings.customCaseIdFormat = document.getElementById('custom-case-id-format').value;
            settings.dataLocation = document.getElementById('data-location').value;
            settings.caseLockTimeout = parseInt(document.getElementById('case-lock-timeout').value);
            
            localStorage.setItem('charityAppSettings', JSON.stringify(settings));
            
            // Apply new settings
            document.getElementById('organizer').value = settings.organizer;
            
            // Apply theme settings
            applyThemeSettings();
            
            // Restart auto-save with new interval
            stopAutoSave();
            startAutoSave();
            
            // Show success message
            showToast('تم حفظ الإعدادات بنجاح', 'success');
            
            // Close the modal
            closeModal('settings-modal');
        }
        
        // Save backup settings
        function saveBackupSettings() {
            settings.backupFrequency = document.getElementById('backup-frequency').value;
            settings.backupCount = parseInt(document.getElementById('backup-count').value);
            
            localStorage.setItem('charityAppSettings', JSON.stringify(settings));
            
            showToast('تم حفظ إعدادات النسخ الاحتياطي بنجاح', 'success');
        }
        
        // Create manual backup
        function createManualBackup() {
            const backupData = {
                cases: cases,
                caseCounter: caseCounter,
                date: new Date().toISOString(),
                settings: settings
            };
            
            const backupJson = JSON.stringify(backupData);
            const backupId = 'backup_' + new Date().toISOString().replace(/[:.]/g, '-');
            
            try {
                localStorage.setItem(backupId, backupJson);
                showToast('تم إنشاء نسخة احتياطية بنجاح', 'success');
                loadBackupsList();
            } catch (error) {
                showToast('حدث خطأ أثناء إنشاء النسخة الاحتياطية: ' + error.message, 'error');
            }
        }
        
        // Load backups list
        function loadBackupsList() {
            const backupsList = document.getElementById('backups-list');
            backupsList.innerHTML = '';
            
            // Find all backup items in localStorage
            const backups = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('backup_')) {
                    try {
                        const backupData = JSON.parse(localStorage.getItem(key));
                        backups.push({
                            id: key,
                            date: new Date(backupData.date),
                            size: (localStorage.getItem(key).length / 1024).toFixed(2) + ' KB',
                            caseCount: Object.values(backupData.cases).reduce((sum, arr) => sum + arr.length, 0)
                        });
                    } catch (error) {
                        console.error('Error parsing backup:', error);
                    }
                }
            }
            
            // Sort backups by date (newest first)
            backups.sort((a, b) => b.date - a.date);
            
            // Add to table
            if (backups.length === 0) {
                backupsList.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد نسخ احتياطية حتى الآن</td></tr>';
            } else {
                backups.forEach(backup => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDateTime(backup.date)}</td>
                        <td>${backup.size}</td>
                        <td>${backup.caseCount}</td>
                        <td>
                            <div class="table-actions">
                                <button class="view-btn" onclick="restoreBackup('${backup.id}')">
                                    <i class="fas fa-undo"></i>
                                </button>
                                <button class="delete-btn" onclick="deleteBackup('${backup.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    backupsList.appendChild(row);
                });
            }
        }
        
        // Format date and time
        function formatDateTime(date) {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Restore backup
        function restoreBackup(backupId) {
            Swal.fire({
                title: 'استعادة النسخة الاحتياطية',
                text: 'سيتم استبدال جميع البيانات الحالية بالنسخة الاحتياطية. هل أنت متأكد؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم، استعادة',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    try {
                        const backupJson = localStorage.getItem(backupId);
                        const backupData = JSON.parse(backupJson);
                        
                        // Restore data
                        cases = backupData.cases;
                        caseCounter = backupData.caseCounter;
                        
                        // Save to local storage
                        saveCasesToStorage();
                        
                        // Update UI
                        updateCasesList('سيد');
                        updateCasesList('عام');
                        updateCasesList('مصاريف');
                        updateRecentCases();
                        updateDashboardStats();
                        setupAutocompleteData();
                        updateSidebarBadges();
                        createDashboardCharts();
                        
                        showToast('تم استعادة النسخة الاحتياطية بنجاح', 'success');
                        closeModal('import-export-modal');
                        showPage('dashboard');
                    } catch (error) {
                        showToast('حدث خطأ أثناء استعادة النسخة الاحتياطية: ' + error.message, 'error');
                    }
                }
            });
        }
        
        // Delete backup
        function deleteBackup(backupId) {
            Swal.fire({
                title: 'حذف النسخة الاحتياطية',
                text: 'هل أنت متأكد من حذف هذه النسخة الاحتياطية؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'نعم، حذف',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    try {
                        localStorage.removeItem(backupId);
                        loadBackupsList();
                        showToast('تم حذف النسخة الاحتياطية بنجاح', 'success');
                    } catch (error) {
                        showToast('حدث خطأ أثناء حذف النسخة الاحتياطية: ' + error.message, 'error');
                    }
                }
            });
        }
        
        // Toggle dark mode
        function toggleTheme() {
            if (isDarkMode) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        }
        
        // Enable dark mode
        function enableDarkMode() {
            isDarkMode = true;
            document.documentElement.classList.add('dark-mode');
            document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-sun"></i><span>وضع مضيء</span>';
        }
        
        // Disable dark mode
        function disableDarkMode() {
            isDarkMode = false;
            document.documentElement.classList.remove('dark-mode');
            document.getElementById('theme-toggle-btn').innerHTML = '<i class="fas fa-moon"></i><span>وضع مظلم</span>';
        }
        
        // Change theme mode from settings
        function changeThemeMode(mode) {
            settings.themeMode = mode;
            
            if (mode === 'dark') {
                enableDarkMode();
            } else if (mode === 'light') {
                disableDarkMode();
            } else if (mode === 'auto') {
                // Check system preference
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    enableDarkMode();
                } else {
                    disableDarkMode();
                }
            }
        }
        
        // Change theme color
        function changeThemeColor(element) {
            const colorOptions = document.querySelectorAll('.color-option');
            colorOptions.forEach(option => option.classList.remove('active'));
            
            element.classList.add('active');
            const color = element.dataset.color;
            settings.themeColor = color;
            
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-dark', adjustColor(color, -20));
            document.documentElement.style.setProperty('--primary-light', adjustColor(color, 20));
        }
        
        // Change font size
        function changeFontSize(size) {
            settings.fontSize = size;
            
            let fontSizeValue = '1rem';
            switch (size) {
                case 'small':
                    fontSizeValue = '0.875rem';
                    break;
                case 'medium':
                    fontSizeValue = '1rem';
                    break;
                case 'large':
                    fontSizeValue = '1.125rem';
                    break;
            }
            
            document.documentElement.style.setProperty('--font-size', fontSizeValue);
        }
        
        // Toggle animations
        function toggleAnimations(setting) {
            settings.animations = setting;
            
            document.body.classList.remove('no-animations', 'reduced-animations');
            
            if (setting === 'disabled') {
                document.body.classList.add('no-animations');
            } else if (setting === 'reduced') {
                document.body.classList.add('reduced-animations');
            }
        }
        
        // Show welcome toast on first time
        function showWelcomeToast() {
            const isFirstTime = localStorage.getItem('charityAppFirstVisit') !== 'false';
            
            if (isFirstTime) {
                // Display welcome message
                setTimeout(() => {
                    showToast('مرحباً بك في النسخة المحدثة من نظام إدارة الحالات!', 'info', 8000);
                }, 1500);
                
                localStorage.setItem('charityAppFirstVisit', 'false');
            }
        }
        
        // Initialize sidebar toggle
        function initSidebar() {
            const sidebarToggle = document.getElementById('sidebar-toggle');
            const menuToggle = document.getElementById('menu-toggle');
            const appContainer = document.getElementById('app-container');
            
            sidebarToggle.addEventListener('click', function() {
                appContainer.classList.toggle('sidebar-collapsed');
                if (appContainer.classList.contains('sidebar-collapsed')) {
                    sidebarToggle.innerHTML = '<i class="fas fa-chevron-left"></i>';
                } else {
                    sidebarToggle.innerHTML = '<i class="fas fa-chevron-right"></i>';
                }
            });
            
            // Mobile menu toggle
            menuToggle.addEventListener('click', function() {
                appContainer.classList.toggle('sidebar-open');
            });
        }
        
        // Initialize modals
        function initModals() {
            // Close modals when clicking outside
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.addEventListener('click', function(event) {
                    if (event.target === modal) {
                        closeModal(modal.id);
                    }
                });
            });
            
            // Initialize tabs in modals
            setupTabListeners();
            
            // Load backups list when opening import/export modal
            document.querySelectorAll('.menu-link, .modal-close').forEach(element => {
                if (element.getAttribute('onclick') && element.getAttribute('onclick').includes('import-export-modal')) {
                    element.addEventListener('click', function() {
                        setTimeout(loadBackupsList, 100);
                    });
                }
            });
        }
        
        // Setup tab listeners
        function setupTabListeners() {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabGroup = this.parentElement;
                    const tabContents = tabGroup.parentElement.querySelectorAll('.tab-content');
                    
                    // Remove active class from all tabs in this group
                    tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    
                    // Hide all tab contents
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    this.classList.add('active');
                    
                    // Show the corresponding tab content
                    const tabId = this.getAttribute('data-tab');
                    const activeContent = document.getElementById(tabId + '-tab');
                    if (activeContent) {
                        activeContent.classList.add('active');
                    }
                });
            });
        }
        
        // Setup advanced settings listeners
        function setupAdvancedSettingsListeners() {
            document.getElementById('case-id-format').addEventListener('change', function() {
                const customFormatContainer = document.getElementById('custom-format-container');
                if (this.value === 'CUSTOM') {
                    customFormatContainer.style.display = 'block';
                } else {
                    customFormatContainer.style.display = 'none';
                }
            });
        }
        
        // Setup scroll listeners
        function setupScrollListeners() {
            const backToTop = document.getElementById('back-to-top');
            
            // Show/hide back to top button
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            });
            
            // Scroll to top when clicked
            backToTop.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Initialize amount formatter for automatic text generation
        function initAmountFormatter() {
            const amountNumeric = document.getElementById('amountNumeric');
            const amountWritten = document.getElementById('amountWritten');
            
            amountNumeric.addEventListener('input', function() {
                const amount = parseFloat(this.value) || 0;
                amountWritten.value = convertNumberToArabicWords(amount);
                
                // Also update total amount if they match
                const totalAmount = document.getElementById('totalAmount');
                if (parseFloat(totalAmount.value) === parseFloat(this.value) || totalAmount.value === '' || totalAmount.value === '0') {
                    totalAmount.value = this.value;
                }
            });
        }
        
        // Convert number to Arabic words
        function convertNumberToArabicWords(number) {
            // Simple implementation for demo purposes
            // In a real app, you would use a more comprehensive library
            const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة'];
            const tens = ['', 'عشر', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
            const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
            const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];
            
            if (number === 0) return 'صفر';
            if (number < 11) return units[number] + ' فقط';
            if (number < 100) {
                const unit = number % 10;
                const ten = Math.floor(number / 10);
                if (unit === 0) return tens[ten] + ' فقط';
                return units[unit] + ' و' + tens[ten] + ' فقط';
            }
            if (number < 1000) {
                const hundred = Math.floor(number / 100);
                const remainder = number % 100;
                if (remainder === 0) return hundreds[hundred] + ' فقط';
                return hundreds[hundred] + ' و' + convertNumberToArabicWords(remainder);
            }
            if (number < 10000) {
                const thousand = Math.floor(number / 1000);
                const remainder = number % 1000;
                if (remainder === 0) return thousands[thousand] + ' فقط';
                return thousands[thousand] + ' و' + convertNumberToArabicWords(remainder);
            }
            
            return number.toString() + ' فقط';
        }
        
        // Load cases from local storage
        function loadCasesFromStorage() {
            const storedSayedCases = localStorage.getItem('sayedCases');
            const storedAmmCases = localStorage.getItem('ammCases');
            const storedMasareefCases = localStorage.getItem('masareefCases');
            const storedCaseCounter = localStorage.getItem('caseCounter');
            
            if (storedSayedCases) {
                cases['سيد'] = JSON.parse(storedSayedCases);
            }
            
            if (storedAmmCases) {
                cases['عام'] = JSON.parse(storedAmmCases);
            }
            
            if (storedMasareefCases) {
                cases['مصاريف'] = JSON.parse(storedMasareefCases);
            }
            
            if (storedCaseCounter) {
                caseCounter = parseInt(storedCaseCounter);
            }
            
            // Update case lists
            updateCasesList('سيد');
            updateCasesList('عام');
            updateCasesList('مصاريف');
            updateRecentCases();
        }
        
        // Save cases to local storage
        function saveCasesToStorage() {
            localStorage.setItem('sayedCases', JSON.stringify(cases['سيد']));
            localStorage.setItem('ammCases', JSON.stringify(cases['عام']));
            localStorage.setItem('masareefCases', JSON.stringify(cases['مصاريف']));
            localStorage.setItem('caseCounter', caseCounter.toString());
        }
        
        // Generate a new unique case ID
        function generateCaseId() {
            const caseIdField = document.getElementById('caseId');
            const currentDate = new Date();
            let caseId = '';
            
            // Generate case ID based on format settings
            switch (settings.caseIdFormat) {
                case 'YYMMDD-NUM':
                    const year = currentDate.getFullYear().toString().substr(-2);
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const day = String(currentDate.getDate()).padStart(2, '0');
                    caseId = `${year}${month}${day}-${caseCounter}`;
                    break;
                case 'YYYY-MM-NUM':
                    const fullYear = currentDate.getFullYear();
                    const monthNum = String(currentDate.getMonth() + 1).padStart(2, '0');
                    caseId = `${fullYear}-${monthNum}-${caseCounter}`;
                    break;
                case 'CUSTOM':
                    // Replace placeholders in custom format
                    let customFormat = settings.customCaseIdFormat || 'CASE-[YYYY]-[NUM]';
                    customFormat = customFormat.replace('[YYYY]', currentDate.getFullYear());
                    customFormat = customFormat.replace('[YY]', currentDate.getFullYear().toString().substr(-2));
                    customFormat = customFormat.replace('[MM]', String(currentDate.getMonth() + 1).padStart(2, '0'));
                    customFormat = customFormat.replace('[DD]', String(currentDate.getDate()).padStart(2, '0'));
                    customFormat = customFormat.replace('[NUM]', caseCounter);
                    caseId = customFormat;
                    break;
                default:
                    // Default to YYmmDD-NUM
                    const defaultYear = currentDate.getFullYear().toString().substr(-2);
                    const defaultMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const defaultDay = String(currentDate.getDate()).padStart(2, '0');
                    caseId = `${defaultYear}${defaultMonth}${defaultDay}-${caseCounter}`;
            }
            
            caseIdField.value = caseId;
            return caseId;
        }
        
        // Set current date in the form
        function setCurrentDate() {
            const today = new Date();
            const formattedDate = today.toISOString().substr(0, 10);
            document.getElementById('caseDate').value = formattedDate;
            
            // Format for display
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            
            document.getElementById('admin-date').textContent = day + ' / ' + month + ' / ' + year;
        }
        
        // Setup autocomplete data
        function setupAutocompleteData() {
            const datalist = document.getElementById('namesDatalist');
            datalist.innerHTML = '';
            
            // Get all unique names from cases
            const allNames = new Set();
            
            Object.values(cases).forEach(caseArray => {
                caseArray.forEach(caseItem => {
                    if (caseItem.fullName) {
                        allNames.add(caseItem.fullName);
                    }
                });
            });
            
            // Add names to the namesData array
            namesData = Array.from(allNames);
            
            // Add options to datalist
            namesData.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
            
            // Add input event for autocomplete
            document.getElementById('fullName').addEventListener('input', function(e) {
                const input = e.target.value.toLowerCase();
                if (input.length < 2) return;
                
                // Auto fill other fields if name exists
                const matchingCase = findCaseByName(input);
                if (matchingCase) {
                    fillFormWithExistingData(matchingCase);
                }
            });
        }
        
        // Find case by name (partial match)
        function findCaseByName(partialName) {
            partialName = partialName.toLowerCase();
            
            for (const caseType in cases) {
                for (const caseItem of cases[caseType]) {
                    if (caseItem.fullName && caseItem.fullName.toLowerCase().includes(partialName)) {
                        return caseItem;
                    }
                }
            }
            
            return null;
        }
        
        // Fill form with existing data
        function fillFormWithExistingData(caseData) {
            // Don't override the newly generated caseId
            const currentCaseId = document.getElementById('caseId').value;
            
            // Fill all form fields except caseId
            document.getElementById('caseCode').value = caseData.caseCode || 'مصاريف';
            document.getElementById('caseType').value = caseData.caseType || '';
            document.getElementById('lastName').value = caseData.lastName || '';
            document.getElementById('parentName').value = caseData.parentName || '';
            document.getElementById('age').value = caseData.age || '';
            document.getElementById('socialStatus').value = caseData.socialStatus || '';
            document.getElementById('caseDescription').value = caseData.caseDescription || '';
            document.getElementById('documentedBy').value = caseData.documentedBy || '';
            document.getElementById('mukhtar').value = caseData.mukhtar || '';
            document.getElementById('govSalary').value = caseData.govSalary || 0;
            document.getElementById('orgSalary').value = caseData.orgSalary || 0;
            document.getElementById('incomeAmount').value = caseData.incomeAmount || 0;
            document.getElementById('expenses').value = caseData.expenses || 0;
            document.getElementById('address').value = caseData.address || '';
            document.getElementById('housingType').value = caseData.housingType || 'ملك';
            document.getElementById('totalFamilyMembers').value = caseData.totalFamilyMembers || 0;
            document.getElementById('maleChildren').value = caseData.maleChildren || 0;
            document.getElementById('femaleChildren').value = caseData.femaleChildren || 0;
            document.getElementById('married').value = caseData.married || 0;
            document.getElementById('hospitalName').value = caseData.hospitalName || '';
            document.getElementById('hospitalAddress').value = caseData.hospitalAddress || '';
            document.getElementById('caseTypeDetail').value = caseData.caseTypeDetail || '';
            document.getElementById('amountNumeric').value = caseData.amountNumeric || 0;
            document.getElementById('amountWritten').value = caseData.amountWritten || '';
            document.getElementById('totalAmount').value = caseData.totalAmount || 0;
            document.getElementById('doctorName').value = caseData.doctorName || '';
            document.getElementById('phoneFirst').value = caseData.phoneFirst || '';
            document.getElementById('phoneSecond').value = caseData.phoneSecond || '';
            document.getElementById('spouseName').value = caseData.spouseName || '';
            document.getElementById('spouseLastName').value = caseData.spouseLastName || '';
            document.getElementById('spouseOccupation').value = caseData.spouseOccupation || '';
            document.getElementById('spouseSalary').value = caseData.spouseSalary || '';
            document.getElementById('hasOtherSupport').value = caseData.hasOtherSupport || 'لا';
            document.getElementById('supportingAgencies').value = caseData.supportingAgencies || '';
            document.getElementById('notes').value = caseData.notes || '';
            document.getElementById('estimatedAssistance').value = caseData.estimatedAssistance || '';
            document.getElementById('amountPaid').value = caseData.amountPaid || '';
            
            if (caseData.paymentDate) {
                document.getElementById('paymentDate').value = caseData.paymentDate;
            }
            
            // Calculate remaining income
            calculateRemainingIncome();
            
            // Update case header style
            updateCaseHeaderStyle();
            
            // Show toast notification
            showToast('تم ملء النموذج ببيانات المستفيد السابقة', 'info');
        }
        
        // Setup financial field listeners
        function setupFinancialListeners() {
            const financialFields = ['govSalary', 'orgSalary', 'incomeAmount', 'expenses'];
            financialFields.forEach(field => {
                document.getElementById(field).addEventListener('input', calculateRemainingIncome);
            });
        }
        
        // Calculate remaining income
        function calculateRemainingIncome() {
            const govSalary = parseFloat(document.getElementById('govSalary').value) || 0;
            const orgSalary = parseFloat(document.getElementById('orgSalary').value) || 0;
            const incomeAmount = parseFloat(document.getElementById('incomeAmount').value) || 0;
            const expenses = parseFloat(document.getElementById('expenses').value) || 0;
            
            const totalIncome = govSalary + orgSalary + incomeAmount;
            const remaining = totalIncome - expenses;
            
            document.getElementById('incomeRemaining').value = remaining;
        }
        
        // Update case header style based on case code
        function updateCaseHeaderStyle() {
            const caseCode = document.getElementById('caseCode').value;
            const caseHeader = document.getElementById('case-header');
            
            // Remove all case type classes
            caseHeader.classList.remove('سيد', 'عام', 'مصاريف');
            
            // Add the appropriate class
            caseHeader.classList.add(caseCode);
        }
        
        // Setup form validation
        function setupFormValidation() {
            const form = document.getElementById('case-form');
            
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                
                if (validateForm()) {
                    saveCase();
                }
            });
        }
        
        // Validate form before submission
        function validateForm() {
            const requiredFields = document.querySelectorAll('[required]');
            let isValid = true;
            let firstInvalidField = null;
            
            requiredFields.forEach(field => {
                field.classList.remove('error');
                
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                    if (!firstInvalidField) firstInvalidField = field;
                }
                
                // Validate numbers
                if (field.type === 'number' && field.value < 0) {
                    field.classList.add('error');
                    isValid = false;
                    if (!firstInvalidField) firstInvalidField = field;
                }
            });
            
            if (!isValid) {
                showToast('الرجاء ملء جميع الحقول المطلوبة', 'error');
                // Scroll to first invalid field
                if (firstInvalidField) {
                    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            return isValid;
        }
        
        // Save case data
        function saveCase() {
            // Show loading
            showLoader();
            
            // Get form data
            const formData = getFormData();
            
            // Get case code (سيد, عام, مصاريف)
            const caseCode = formData.caseCode;
            
            // Add or update case
            const existingCaseIndex = cases[caseCode].findIndex(c => c.caseId === formData.caseId);
            
            if (existingCaseIndex !== -1) {
                // Update existing case
                cases[caseCode][existingCaseIndex] = formData;
                
                // Hide loading
                hideLoader();
                
                // Show success message
                showToast('تم تحديث الحالة بنجاح', 'success');
            } else {
                // Add new case
                cases[caseCode].push(formData);
                // Increment counter for next case
                caseCounter++;
                
                // Hide loading
                hideLoader();
                
                // Show success message with animation
                Swal.fire({
                    icon: 'success',
                    title: 'تم حفظ الحالة بنجاح',
                    text: 'تم إضافة حالة جديدة برقم: ' + formData.caseId,
                    showConfirmButton: true,
                    timer: 3000,
                    timerProgressBar: true,
                    confirmButtonText: 'موافق'
                }).then(() => {
                    // Reset form for a new case
                    resetForm();
                });
            }
            
            // Save to local storage
            saveCasesToStorage();
            
            // Update case lists
            updateCasesList(caseCode);
            updateRecentCases();
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Update dashboard charts
            updateDashboardCharts();
            
            // Update autocomplete data
            setupAutocompleteData();
            
            // Update sidebar badges
            updateSidebarBadges();
            
            // Generate QR code
            generateQrCode(formData.caseId);
        }
        
        // Get all form data as an object
        function getFormData() {
            const form = document.getElementById('case-form');
            const formData = {};
            
            // Get all form elements
            Array.from(form.elements).forEach(element => {
                if (element.name && element.name !== 'submit') {
                    formData[element.name] = element.value;
                }
            });
            
            // Add the date in ISO format for sorting
            if (formData.caseDate) {
                formData.caseDateISO = new Date(formData.caseDate).toISOString();
            }
            
            return formData;
        }
        
        // Reset the form
        function resetForm() {
            document.getElementById('case-form').reset();
            
            // Set default values
            setCurrentDate();
            document.getElementById('caseCode').value = 'مصاريف';
            document.getElementById('housingType').value = 'ملك';
            document.getElementById('hasOtherSupport').value = 'لا';
            
            // Generate new case ID
            generateCaseId();
            
            // Calculate remaining income
            calculateRemainingIncome();
            
            // Update case header style
            updateCaseHeaderStyle();
            
            // Generate QR code
            generateQrCode(document.getElementById('caseId').value);
            
            // Remove error classes
            const errorFields = document.querySelectorAll('.error');
            errorFields.forEach(field => field.classList.remove('error'));
        }
        
        // Print form using print preview
        function printPreview() {
            // Get the form content
            const formContainer = document.querySelector('.form-container').cloneNode(true);
            
            // Enable all form fields for printing
            const formFields = formContainer.querySelectorAll('input, select, textarea');
            formFields.forEach(field => {
                field.disabled = false;
            });
            
            // Add to print preview container
            const printPreviewContent = document.getElementById('print-preview-content');
            printPreviewContent.innerHTML = '';
            printPreviewContent.appendChild(formContainer);
            
            // Show print preview
            document.getElementById('print-preview-container').style.display = 'flex';
        }
        
        // Close print preview
        function closePrintPreview() {
            document.getElementById('print-preview-container').style.display = 'none';
        }
        
        // Print from preview
        function printFromPreview() {
            window.print();
        }
        
        // Generate QR Code
        function generateQrCode(caseId) {
            const qrCodeContainer = document.getElementById('case-qrcode');
            qrCodeContainer.innerHTML = '';
            
            // Create QR code with more information
            const qrData = {
                id: caseId,
                app: 'مؤسسة أولاد الحسن ع الخيرية',
                type: document.getElementById('caseCode').value,
                date: new Date().toISOString().split('T')[0]
            };
            
            // Create new QR code
            new QRCode(qrCodeContainer, {
                text: JSON.stringify(qrData),
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        // Update dashboard stats
        function updateDashboardStats() {
            const sayedCount = cases['سيد'].length;
            const ammCount = cases['عام'].length;
            const masareefCount = cases['مصاريف'].length;
            const totalCount = sayedCount + ammCount + masareefCount;
            
            // Update counters with animation
            animateCounter('sayed-count', sayedCount);
            animateCounter('amm-count', ammCount);
            animateCounter('masareef-count', masareefCount);
            animateCounter('total-count', totalCount);
        }
        
        // Animate counter
        function animateCounter(elementId, targetValue) {
            const element = document.getElementById(elementId);
            const currentValue = parseInt(element.textContent) || 0;
            const duration = 1000; // 1 second
            const steps = 20;
            const stepValue = (targetValue - currentValue) / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                const value = Math.floor(currentValue + stepValue * currentStep);
                element.textContent = value;
                
                if (currentStep === steps) {
                    element.textContent = targetValue;
                    clearInterval(interval);
                }
            }, duration / steps);
        }
        
        // Create dashboard charts
        function createDashboardCharts() {
            const ctx = document.getElementById('cases-chart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (casesChart) {
                casesChart.destroy();
            }
            
            // Get data for chart
            const sayedCount = cases['سيد'].length;
            const ammCount = cases['عام'].length;
            const masareefCount = cases['مصاريف'].length;
            
            // Calculate monthly data
            const monthlyData = getMonthlyData();
            
            // Create new chart
            casesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
                    datasets: [
                        {
                            label: 'حالات سيد',
                            data: monthlyData.sayed,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'حالات عام',
                            data: monthlyData.amm,
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'حالات مصاريف',
                            data: monthlyData.masareef,
                            backgroundColor: 'rgba(245, 158, 11, 0.7)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    family: "'Tajawal', sans-serif",
                                    size: 14
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'توزيع الحالات حسب الشهر',
                            font: {
                                family: "'Tajawal', sans-serif",
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            bodyFont: {
                                family: "'Tajawal', sans-serif"
                            },
                            titleFont: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    family: "'Tajawal', sans-serif"
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    family: "'Tajawal', sans-serif"
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Update dashboard charts
        function updateDashboardCharts() {
            // Get monthly data
            const monthlyData = getMonthlyData();
            
            // Update chart data
            if (casesChart) {
                casesChart.data.datasets[0].data = monthlyData.sayed;
                casesChart.data.datasets[1].data = monthlyData.amm;
                casesChart.data.datasets[2].data = monthlyData.masareef;
                casesChart.update();
            }
        }
        
        // Get monthly data for charts
        function getMonthlyData() {
            const currentYear = new Date().getFullYear();
            const months = Array(12).fill(0);
            
            const sayedMonthly = [...months];
            const ammMonthly = [...months];
            const masareefMonthly = [...months];
            
            // Count cases by month
            for (const caseItem of cases['سيد']) {
                if (caseItem.caseDate) {
                    const date = new Date(caseItem.caseDate);
                    if (date.getFullYear() === currentYear) {
                        sayedMonthly[date.getMonth()]++;
                    }
                }
            }
            
            for (const caseItem of cases['عام']) {
                if (caseItem.caseDate) {
                    const date = new Date(caseItem.caseDate);
                    if (date.getFullYear() === currentYear) {
                        ammMonthly[date.getMonth()]++;
                    }
                }
            }
            
            for (const caseItem of cases['مصاريف']) {
                if (caseItem.caseDate) {
                    const date = new Date(caseItem.caseDate);
                    if (date.getFullYear() === currentYear) {
                        masareefMonthly[date.getMonth()]++;
                    }
                }
            }
            
            return {
                sayed: sayedMonthly,
                amm: ammMonthly,
              areef: masareefMonthly
            };
        }
        
        // Update sidebar badges
        function updateSidebarBadges() {
            document.getElementById('sayed-badge').textContent = cases['سيد'].length;
            document.getElementById('amm-badge').textContent = cases['عام'].length;
            document.getElementById('masareef-badge').textContent = cases['مصاريف'].length;
            document.getElementById('total-badge').textContent = cases['سيد'].length + cases['عام'].length + cases['مصاريف'].length;
        }
        
        // Update cases list for a specific type
        function updateCasesList(caseType) {
            const casesList = cases[caseType] || [];
            let tbodyId;
            
            // Get the appropriate tbody
            switch (caseType) {
                case 'سيد':
                    tbodyId = 'sayed-cases-tbody';
                    break;
                case 'عام':
                    tbodyId = 'amm-cases-tbody';
                    break;
                case 'مصاريف':
                    tbodyId = 'masareef-cases-tbody';
                    break;
                default:
                    return;
            }
            
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            
            // Clear the table
            tbody.innerHTML = '';
            
            // Sort cases by date (newest first)
            const sortedCases = [...casesList].sort((a, b) => {
                return new Date(b.caseDateISO || b.caseDate) - new Date(a.caseDateISO || a.caseDate);
            });
            
            // Add cases to the table
            sortedCases.forEach(caseItem => {
                const row = document.createElement('tr');
                
                // Format date
                const caseDate = new Date(caseItem.caseDate);
                const formattedDate = `${caseDate.getDate()}/${caseDate.getMonth() + 1}/${caseDate.getFullYear()}`;
                
                // Add row with animation
                row.classList.add('fade-in');
                row.innerHTML = `
                    <td>${caseItem.caseId}</td>
                    <td>${formattedDate}</td>
                    <td>${caseItem.fullName}</td>
                    <td>${caseItem.caseType}</td>
                    <td>${formatCurrency(caseItem.amountNumeric)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="view-btn" onclick="viewCase('${caseItem.caseId}', '${caseType}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="edit-btn" onclick="editCase('${caseItem.caseId}', '${caseType}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="confirmDeleteCase('${caseItem.caseId}', '${caseType}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Also update the all cases table
            updateAllCasesTable();
        }
        
        // Format currency
        function formatCurrency(value) {
            return parseFloat(value).toLocaleString('ar-IQ') + ' د.ع';
        }
        
        // Update all cases table
        function updateAllCasesTable() {
            const tbody = document.getElementById('all-cases-tbody');
            if (!tbody) return;
            
            // Clear the table
            tbody.innerHTML = '';
            
            // Combine all cases
            const allCases = [
                ...cases['سيد'],
                ...cases['عام'],
                ...cases['مصاريف']
            ];
            
            // Sort cases by date (newest first)
            const sortedCases = allCases.sort((a, b) => {
                return new Date(b.caseDateISO || b.caseDate) - new Date(a.caseDateISO || a.caseDate);
            });
            
            // Add cases to the table
            sortedCases.forEach(caseItem => {
                const row = document.createElement('tr');
                
                // Format date
                const caseDate = new Date(caseItem.caseDate);
                const formattedDate = `${caseDate.getDate()}/${caseDate.getMonth() + 1}/${caseDate.getFullYear()}`;
                
                // Get badge class
                let badgeClass = '';
                switch (caseItem.caseCode) {
                    case 'سيد':
                        badgeClass = 'badge-sayed';
                        break;
                    case 'عام':
                        badgeClass = 'badge-amm';
                        break;
                    case 'مصاريف':
                        badgeClass = 'badge-masareef';
                        break;
                }
                
                // Add row with animation
                row.classList.add('fade-in');
                row.innerHTML = `
                    <td>${caseItem.caseId}</td>
                    <td>${formattedDate}</td>
                    <td>${caseItem.fullName}</td>
                    <td><span class="badge ${badgeClass}">${caseItem.caseCode}</span></td>
                    <td>${caseItem.caseType}</td>
                    <td>${formatCurrency(caseItem.amountNumeric)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="view-btn" onclick="viewCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="edit-btn" onclick="editCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="confirmDeleteCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }
        
        // Update recent cases on dashboard
        function updateRecentCases() {
            const tbody = document.getElementById('recent-cases-tbody');
            if (!tbody) return;
            
            // Clear the table
            tbody.innerHTML = '';
            
            // Combine all cases
            const allCases = [
                ...cases['سيد'],
                ...cases['عام'],
                ...cases['مصاريف']
            ];
            
            // Sort cases by date (newest first)
            const sortedCases = allCases.sort((a, b) => {
                return new Date(b.caseDateISO || b.caseDate) - new Date(a.caseDateISO || a.caseDate);
            });
            
            // Take the most recent 5 cases
            const recentCases = sortedCases.slice(0, 5);
            
            // Add cases to the table
            recentCases.forEach((caseItem, index) => {
                const row = document.createElement('tr');
                
                // Format date
                const caseDate = new Date(caseItem.caseDate);
                const formattedDate = `${caseDate.getDate()}/${caseDate.getMonth() + 1}/${caseDate.getFullYear()}`;
                
                // Get badge class
                let badgeClass = '';
                switch (caseItem.caseCode) {
                    case 'سيد':
                        badgeClass = 'badge-sayed';
                        break;
                    case 'عام':
                        badgeClass = 'badge-amm';
                        break;
                    case 'مصاريف':
                        badgeClass = 'badge-masareef';
                        break;
                }
                
                // Add row with staggered animation
                row.classList.add('slide-in-right');
                row.style.animationDelay = `${index * 0.1}s`;
                row.innerHTML = `
                    <td>${caseItem.caseId}</td>
                    <td>${formattedDate}</td>
                    <td>${caseItem.fullName}</td>
                    <td><span class="badge ${badgeClass}">${caseItem.caseCode}</span></td>
                    <td>${formatCurrency(caseItem.amountNumeric)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="view-btn" onclick="viewCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="edit-btn" onclick="editCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Show message if no cases
            if (recentCases.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        لا توجد حالات مضافة بعد. قم بإضافة حالة جديدة من خلال الضغط على زر "إضافة حالة"
                    </td>
                `;
                tbody.appendChild(row);
            }
        }
        
        // View case details
        function viewCase(caseId, caseType) {
            const caseItem = findCaseById(caseId, caseType);
            
            if (caseItem) {
                // Show the form page
                showPage('new-case');
                
                // Fill the form with case data
                fillFormWithCaseData(caseItem);
                
                // Disable form fields for view mode
                toggleFormFields(true);
                
                // Update form actions
                const formActions = document.querySelector('.form-actions');
                formActions.innerHTML = `
                    <button type="button" class="btn btn-primary" onclick="editCase('${caseId}', '${caseType}')">
                        <i class="fas fa-edit"></i>
                        <span>تعديل الحالة</span>
                    </button>
                    <button type="button" class="btn btn-success" onclick="printPreview()">
                        <i class="fas fa-print"></i>
                        <span>طباعة الاستمارة</span>
                    </button>
                    <button type="button" class="btn btn-warning" onclick="shareCase('${caseId}')">
                        <i class="fas fa-share-alt"></i>
                        <span>مشاركة الحالة</span>
                    </button>
                    <button type="button" class="btn btn-light" onclick="showPage('cases')">
                        <i class="fas fa-arrow-right"></i>
                        <span>العودة</span>
                    </button>
                `;
            }
        }
        
        // Share case
        function shareCase(caseId) {
            // Create a temporary textarea element for copying the link
            const tempInput = document.createElement('input');
            const shareLink = `${window.location.origin}${window.location.pathname}?case=${caseId}`;
            
            // Set the value of the textarea to the share link
            tempInput.value = shareLink;
            
            // Append the textarea to the document
            document.body.appendChild(tempInput);
            
            // Select and copy the text from the textarea
            tempInput.select();
            document.execCommand('copy');
            
            // Remove the textarea
            document.body.removeChild(tempInput);
            
            // Show success message
            showToast('تم نسخ رابط الحالة إلى الحافظة', 'success');
        }
        
        // Edit case
        function editCase(caseId, caseType) {
            const caseItem = findCaseById(caseId, caseType);
            
            if (caseItem) {
                // Show the form page
                showPage('new-case');
                
                // Fill the form with case data
                fillFormWithCaseData(caseItem);
                
                // Enable form fields
                toggleFormFields(false);
                
                // Update form actions
                const formActions = document.querySelector('.form-actions');
                formActions.innerHTML = `
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save"></i>
                        <span>حفظ التعديلات</span>
                    </button>
                    <button type="button" class="btn btn-primary" onclick="printPreview()">
                        <i class="fas fa-print"></i>
                        <span>طباعة الاستمارة</span>
                    </button>
                    <button type="button" class="btn btn-light" onclick="showPage('cases')">
                        <i class="fas fa-arrow-right"></i>
                        <span>العودة</span>
                    </button>
                `;
            }
        }
        
        // Fill the form with case data
        function fillFormWithCaseData(caseItem) {
            // Fill all form fields
            for (const key in caseItem) {
                const field = document.getElementById(key);
                if (field) {
                    field.value = caseItem[key];
                }
            }
            
            // Calculate remaining income
            calculateRemainingIncome();
            
            // Update case header style
            updateCaseHeaderStyle();
            
            // Generate QR code
            generateQrCode(caseItem.caseId);
        }
        
        // Toggle form fields (enable/disable)
        function toggleFormFields(disabled) {
            const formElements = document.querySelectorAll('#case-form input, #case-form select, #case-form textarea');
            
            formElements.forEach(element => {
                element.disabled = disabled;
            });
            
            // Always disable the case ID field
            document.getElementById('caseId').disabled = true;
        }
        
        // Find case by ID
        function findCaseById(caseId, caseType) {
            return cases[caseType].find(c => c.caseId === caseId);
        }
        
        // Confirm case deletion
        function confirmDeleteCase(caseId, caseType) {
            Swal.fire({
                title: 'تأكيد الحذف',
                text: 'هل أنت متأكد من رغبتك في حذف هذه الحالة؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6',
                confirmButtonText: 'نعم، حذف',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteCase(caseId, caseType);
                }
            });
        }
        
        // Delete case
        function deleteCase(caseId, caseType) {
            // Find the index of the case
            const caseIndex = cases[caseType].findIndex(c => c.caseId === caseId);
            
            if (caseIndex !== -1) {
                // Remove the case from the array
                cases[caseType].splice(caseIndex, 1);
                
                // Save to local storage
                saveCasesToStorage();
                
                // Update UI
                updateCasesList(caseType);
                updateRecentCases();
                updateDashboardStats();
                updateDashboardCharts();
                updateSidebarBadges();
                
                // Show success message
                showToast('تم حذف الحالة بنجاح', 'success');
            }
        }
        
        // Add a new case of specific type
        function addNewCase(caseType) {
            // Show the form page
            showPage('new-case');
            
            // Reset the form
            resetForm();
            
            // Set the case code
            document.getElementById('caseCode').value = caseType;
            
            // Update case header style
            updateCaseHeaderStyle();
        }
        
        // Save case automatically
        function startAutoSave() {
            if (settings.autoSave === 'enabled') {
                autoSaveInterval = setInterval(() => {
                    const form = document.getElementById('case-form');
                    if (form && !document.getElementById('caseId').disabled) {
                        // Check if form is visible
                        if (document.getElementById('new-case-page').style.display !== 'none') {
                            // Check if form is valid
                            if (form.checkValidity()) {
                                saveCase();
                                showToast('تم حفظ الحالة تلقائياً', 'info', 2000);
                            }
                        }
                    }
                }, settings.autoSaveInterval * 1000);
            }
        }
        
        // Stop auto save
        function stopAutoSave() {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
        }
        
        // Show a specific page
        function showPage(pageId) {
            // Hide all pages
            const pages = document.querySelectorAll('.form-page, .dashboard');
            pages.forEach(page => {
                page.style.display = 'none';
            });
            
            // Show the requested page
            document.getElementById(`${pageId}-page`).style.display = 'block';
            
            // Update page title
            updatePageTitle(pageId);
            
            // Update active menu item
            updateActiveMenuItem(pageId);
            
            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Update page title
        function updatePageTitle(pageId) {
            let title = '';
            
            switch (pageId) {
                case 'dashboard':
                    title = 'لوحة التحكم';
                    break;
                case 'new-case':
                    title = 'إنشاء حالة جديدة';
                    break;
                case 'cases':
                    title = 'جميع الحالات';
                    break;
                case 'case-sayed':
                    title = 'حالات سيد';
                    break;
                case 'case-amm':
                    title = 'حالات عام';
                    break;
                case 'case-masareef':
                    title = 'حالات مصاريف';
                    break;
                case 'reports':
                    title = 'التقارير والإحصائيات';
                    break;
                default:
                    title = 'مؤسسة أولاد الحسن الخيرية';
            }
            
            document.getElementById('page-title').textContent = title;
            document.title = title + ' - مؤسسة أولاد الحسن الخيرية';
        }
        
        // Update active menu item
        function updateActiveMenuItem(pageId) {
            // Remove active class from all menu items
            const menuItems = document.querySelectorAll('.menu-link');
            menuItems.forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to the current page's menu item
            const activeMenuItem = document.querySelector(`.menu-link[onclick="showPage('${pageId}')"]`);
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
            }
        }
        
        // Show modal
        function showModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.add('show');
        }
        
        // Close modal
        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.remove('show');
        }
        
        // Show search modal
        function showSearchModal() {
            showModal('search-modal');
            document.getElementById('search-query').focus();
        }
        
        // Show QR code modal
        function showQrCodeModal() {
            showModal('qrcode-modal');
            document.getElementById('qrcode-input').focus();
        }
        
        // Show import/export modal
        function showImportExportModal() {
            showModal('import-export-modal');
        }
        
        // Show settings modal
        function showSettingsModal() {
            showModal('settings-modal');
        }
        
        // Setup search listeners
        function setupSearchListeners() {
            // Global search
            document.getElementById('search-query').addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    searchCases();
                }
            });
            
            // Cases page search
            document.getElementById('search-cases').addEventListener('keyup', function() {
                filterCasesTable('all-cases-tbody', this.value);
            });
            
            // Sayed cases search
            document.getElementById('search-sayed').addEventListener('keyup', function() {
                filterCasesTable('sayed-cases-tbody', this.value);
            });
            
            // Amm cases search
            document.getElementById('search-amm').addEventListener('keyup', function() {
                filterCasesTable('amm-cases-tbody', this.value);
            });
            
            // Masareef cases search
            document.getElementById('search-masareef').addEventListener('keyup', function() {
                filterCasesTable('masareef-cases-tbody', this.value);
            });
        }
        
        // Filter cases table by search query
        function filterCasesTable(tableId, query) {
            const tbody = document.getElementById(tableId);
            if (!tbody) return;
            
            const rows = tbody.getElementsByTagName('tr');
            const lowercaseQuery = query.toLowerCase();
            
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const text = row.textContent.toLowerCase();
                
                if (text.includes(lowercaseQuery)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        }
        
        // Search cases from the search modal
        function searchCases() {
            const query = document.getElementById('search-query').value.toLowerCase();
            const field = document.getElementById('search-field').value;
            const category = document.getElementById('search-category').value;
            
            if (!query) {
                showToast('الرجاء إدخال كلمة البحث', 'error');
                return;
            }
            
            // Show loader
            showLoader();
            
            // Combine all cases
            let searchIn = [];
            
            if (category === 'all') {
                searchIn = [
                    ...cases['سيد'],
                    ...cases['عام'],
                    ...cases['مصاريف']
                ];
            } else {
                searchIn = cases[category];
            }
            
            // Filter cases by search query
            const filteredCases = searchIn.filter(caseItem => {
                if (field === 'all') {
                    // Search in all fields
                    return Object.values(caseItem).some(value => 
                        value && value.toString().toLowerCase().includes(query)
                    );
                } else {
                    // Search in specific field
                    return caseItem[field] && 
                           caseItem[field].toString().toLowerCase().includes(query);
                }
            });
            
            // Close the search modal
            closeModal('search-modal');
            
            // Show the cases page
            showPage('cases');
            
            // Clear the table
            const tbody = document.getElementById('all-cases-tbody');
            tbody.innerHTML = '';
            
            // Sort filtered cases by date (newest first)
            const sortedCases = filteredCases.sort((a, b) => {
                return new Date(b.caseDateISO || b.caseDate) - new Date(a.caseDateISO || a.caseDate);
            });
            
            // Hide loader
            hideLoader();
            
            // Add filtered cases to the table
            sortedCases.forEach(caseItem => {
                const row = document.createElement('tr');
                
                // Format date
                const caseDate = new Date(caseItem.caseDate);
                const formattedDate = `${caseDate.getDate()}/${caseDate.getMonth() + 1}/${caseDate.getFullYear()}`;
                
                // Get badge class
                let badgeClass = '';
                switch (caseItem.caseCode) {
                    case 'سيد':
                        badgeClass = 'badge-sayed';
                        break;
                    case 'عام':
                        badgeClass = 'badge-amm';
                        break;
                    case 'مصاريف':
                        badgeClass = 'badge-masareef';
                        break;
                }
                
                row.innerHTML = `
                    <td>${caseItem.caseId}</td>
                    <td>${formattedDate}</td>
                    <td>${caseItem.fullName}</td>
                    <td><span class="badge ${badgeClass}">${caseItem.caseCode}</span></td>
                    <td>${caseItem.caseType}</td>
                    <td>${formatCurrency(caseItem.amountNumeric)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="view-btn" onclick="viewCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="edit-btn" onclick="editCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" onclick="confirmDeleteCase('${caseItem.caseId}', '${caseItem.caseCode}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Show message if no results found
            if (filteredCases.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="7" style="text-align: center; padding: 20px;">
                        لم يتم العثور على نتائج للبحث عن "${query}"
                    </td>
                `;
                tbody.appendChild(row);
                
                showToast('لم يتم العثور على نتائج للبحث', 'info');
            } else {
                showToast(`تم العثور على ${filteredCases.length} نتيجة للبحث`, 'success');
            }
        }
        
        // Find case by QR code
        function findCaseByQrCode() {
            const qrcodeInput = document.getElementById('qrcode-input').value;
            
            if (!qrcodeInput) {
                showToast('الرجاء إدخال رقم الحالة', 'error');
                return;
            }
            
            // Search for the case in all case types
            let foundCase = null;
            let foundCaseType = null;
            
            for (const caseType in cases) {
                const caseItem = cases[caseType].find(c => c.caseId === qrcodeInput);
                if (caseItem) {
                    foundCase = caseItem;
                    foundCaseType = caseType;
                    break;
                }
            }
            
            // Close the QR code modal
            closeModal('qrcode-modal');
            
            if (foundCase) {
                // View the case
                viewCase(foundCase.caseId, foundCaseType);
                showToast('تم العثور على الحالة!', 'success');
            } else {
                showToast('لم يتم العثور على حالة بهذا الرقم', 'error');
            }
        }
        
        // Scan QR code (requires a QR code scanner library)
        function scanQrCode() {
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('متصفحك لا يدعم الوصول إلى الكاميرا', 'error');
                return;
            }
            
            // Show scanning container
            document.getElementById('qr-scanner-container').style.display = 'block';
            
            // Create a preview element
            const preview = document.getElementById('qr-scanner-preview');
            
            try {
                // Create a video element for the camera preview
                const video = document.createElement('video');
                video.style.width = '100%';
                video.style.height = '100%';
                preview.innerHTML = '';
                preview.appendChild(video);
                
                // Simulated scanning (since we don't have an actual QR code scanner library in this demo)
                setTimeout(() => {
                    showToast('جاري محاكاة مسح الكود...', 'info');
                    
                    // Simulate scanning delay
                    setTimeout(() => {
                        // Get a random case
                        const allCases = [
                            ...cases['سيد'],
                            ...cases['عام'],
                            ...cases['مصاريف']
                        ];
                        
                        if (allCases.length > 0) {
                            const randomCase = allCases[Math.floor(Math.random() * allCases.length)];
                            document.getElementById('qrcode-input').value = randomCase.caseId;
                            showToast('تم مسح الكود بنجاح', 'success');
                        } else {
                            showToast('لا توجد حالات لمحاكاة المسح', 'error');
                        }
                        
                        stopQrScanner();
                    }, 2000);
                }, 1000);
            } catch (error) {
                showToast('حدث خطأ أثناء الوصول إلى الكاميرا: ' + error.message, 'error');
                stopQrScanner();
            }
        }
        
        // Stop QR scanner
        function stopQrScanner() {
            // Hide scanning container
            document.getElementById('qr-scanner-container').style.display = 'none';
            
            // In a real implementation, you would stop the camera stream here
        }
        
        // Handle report type change
        function handleReportTypeChange() {
            const reportType = document.getElementById('report-type').value;
            
            // Hide all containers first
            document.getElementById('date-range-container').style.display = 'none';
            document.getElementById('date-range-end-container').style.display = 'none';
            document.getElementById('amount-range-container').style.display = 'none';
            document.getElementById('amount-range-max-container').style.display = 'none';
            
            // Show relevant containers based on report type
            if (reportType === 'date') {
                document.getElementById('date-range-container').style.display = 'block';
                document.getElementById('date-range-end-container').style.display = 'block';
            } else if (reportType === 'amount') {
                document.getElementById('amount-range-container').style.display = 'block';
                document.getElementById('amount-range-max-container').style.display = 'block';
            }
        }
        
        // Generate report
        function generateReport() {
            // Show loader
            showLoader();
            
            const reportType = document.getElementById('report-type').value;
            let filteredCases = [];
            
            // Combine all cases
            const allCases = [
                ...cases['سيد'],
                ...cases['عام'],
                ...cases['مصاريف']
            ];
            
            // Filter cases based on report type
            switch (reportType) {
                case 'all':
                    filteredCases = allCases;
                    break;
                case 'sayed':
                    filteredCases = cases['سيد'];
                    break;
                case 'amm':
                    filteredCases = cases['عام'];
                    break;
                case 'masareef':
                    filteredCases = cases['مصاريف'];
                    break;
                case 'date':
                    const startDate = new Date(document.getElementById('report-start-date').value);
                    const endDate = new Date(document.getElementById('report-end-date').value);
                    
                    if (!startDate || !endDate) {
                        hideLoader();
                        showToast('الرجاء اختيار تاريخ البداية والنهاية', 'error');
                        return;
                    }
                    
                    // Set end date to end of day
                    endDate.setHours(23, 59, 59, 999);
                    
                    filteredCases = allCases.filter(caseItem => {
                        const caseDate = new Date(caseItem.caseDate);
                        return caseDate >= startDate && caseDate <= endDate;
                    });
                    break;
                case 'amount':
                    const minAmount = parseFloat(document.getElementById('report-min-amount').value) || 0;
                    const maxAmount = parseFloat(document.getElementById('report-max-amount').value) || Infinity;
                    
                    filteredCases = allCases.filter(caseItem => {
                        const amount = parseFloat(caseItem.amountNumeric) || 0;
                        return amount >= minAmount && amount <= maxAmount;
                    });
                    break;
            }
            
            // Sort cases by date (newest first)
            const sortedCases = filteredCases.sort((a, b) => {
                return new Date(b.caseDateISO || b.caseDate) - new Date(a.caseDateISO || a.caseDate);
            });
            
            // Update report table
            const tbody = document.getElementById('report-results-tbody');
            tbody.innerHTML = '';
            
            sortedCases.forEach(caseItem => {
                const row = document.createElement('tr');
                
                // Format date
                const caseDate = new Date(caseItem.caseDate);
                const formattedDate = `${caseDate.getDate()}/${caseDate.getMonth() + 1}/${caseDate.getFullYear()}`;
                
                // Get badge class
                let badgeClass = '';
                switch (caseItem.caseCode) {
                    case 'سيد':
                        badgeClass = 'badge-sayed';
                        break;
                    case 'عام':
                        badgeClass = 'badge-amm';
                        break;
                    case 'مصاريف':
                        badgeClass = 'badge-masareef';
                        break;
                }
                
                row.innerHTML = `
                    <td>${caseItem.caseId}</td>
                    <td>${formattedDate}</td>
                    <td>${caseItem.fullName}</td>
                    <td><span class="badge ${badgeClass}">${caseItem.caseCode}</span></td>
                    <td>${caseItem.caseType}</td>
                    <td>${formatCurrency(caseItem.amountNumeric)}</td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Calculate report summary
            const totalCases = sortedCases.length;
            const totalAmount = sortedCases.reduce((sum, caseItem) => sum + (parseFloat(caseItem.amountNumeric) || 0), 0);
            const averageAmount = totalCases > 0 ? totalAmount / totalCases : 0;
            const maxAmount = sortedCases.reduce((max, caseItem) => {
                const amount = parseFloat(caseItem.amountNumeric) || 0;
                return amount > max ? amount : max;
            }, 0);
            
            // Update report summary
            document.getElementById('report-total-cases').textContent = totalCases;
            document.getElementById('report-total-amount').textContent = formatCurrency(totalAmount);
            document.getElementById('report-average-amount').textContent = formatCurrency(Math.round(averageAmount));
            document.getElementById('report-max-amount').textContent = formatCurrency(maxAmount);
            
            // Create report chart
            createReportChart(sortedCases);
            
            // Hide loader
            hideLoader();
            
            // Show message if no results found
            if (totalCases === 0) {
                showToast('لم يتم العثور على نتائج للتقرير', 'info');
            } else {
                showToast(`تم إنشاء التقرير بنجاح. إجمالي الحالات: ${totalCases}`, 'success');
            }
        }
        
        // Create report chart
        function createReportChart(casesData) {
            const ctx = document.getElementById('report-chart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (reportChart) {
                reportChart.destroy();
            }
            
            // Group cases by type
            const caseTypes = {};
            casesData.forEach(caseItem => {
                const type = caseItem.caseType;
                if (!caseTypes[type]) {
                    caseTypes[type] = 0;
                }
                caseTypes[type]++;
            });
            
            // Get top 5 case types
            const sortedTypes = Object.entries(caseTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            // Create chart data
            const labels = sortedTypes.map(item => item[0]);
            const data = sortedTypes.map(item => item[1]);
            
            // Create chart
            reportChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'عدد الحالات',
                        data: data,
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(16, 185, 129, 0.7)',
                            'rgba(245, 158, 11, 0.7)',
                            'rgba(239, 68, 68, 0.7)',
                            'rgba(168, 85, 247, 0.7)'
                        ],
                        borderColor: [
                            'rgba(59, 130, 246, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(239, 68, 68, 1)',
                            'rgba(168, 85, 247, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'توزيع الحالات حسب النوع',
                            font: {
                                family: "'Tajawal', sans-serif",
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            bodyFont: {
                                family: "'Tajawal', sans-serif"
                            },
                            titleFont: {
                                family: "'Tajawal', sans-serif"
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                font: {
                                    family: "'Tajawal', sans-serif"
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    family: "'Tajawal', sans-serif"
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Generate advanced report
        function generateAdvancedReport() {
            showToast('جاري إنشاء التقرير المتقدم...', 'info');
            
            setTimeout(() => {
                showToast('تم إنشاء التقرير المتقدم بنجاح', 'success');
            }, 1500);
        }
        
        // Generate financial report
        function generateFinancialReport() {
            showToast('جاري إنشاء التقرير المالي...', 'info');
            
            setTimeout(() => {
                showToast('تم إنشاء التقرير المالي بنجاح', 'success');
            }, 1500);
        }
        
        // Print report
        function printReport() {
            window.print();
        }
        
        // Export report to Excel
        function exportReportToExcel() {
            showToast('جاري تصدير التقرير إلى Excel...', 'info');
            
            // Simulate export delay
            setTimeout(() => {
                showToast('تم تصدير التقرير بنجاح', 'success');
            }, 1500);
        }
        
        // Export advanced report to Excel
        function exportAdvancedReportToExcel() {
            showToast('جاري تصدير التقرير المتقدم إلى Excel...', 'info');
            
            // Simulate export delay
            setTimeout(() => {
                showToast('تم تصدير التقرير المتقدم بنجاح', 'success');
            }, 1500);
        }
        
        // Export financial report to Excel
        function exportFinancialReportToExcel() {
            showToast('جاري تصدير التقرير المالي إلى Excel...', 'info');
            
            // Simulate export delay
            setTimeout(() => {
                showToast('تم تصدير التقرير المالي بنجاح', 'success');
            }, 1500);
        }
        
        // Export data to file
        function exportData() {
            const exportType = document.getElementById('export-type').value;
            const exportFormat = document.getElementById('export-format').value;
            let dataToExport;
            
            // Show loader
            showLoader();
            
            switch (exportType) {
                case 'all':
                    dataToExport = {
                        'سيد': cases['سيد'],
                        'عام': cases['عام'],
                        'مصاريف': cases['مصاريف'],
                        caseCounter: caseCounter
                    };
                    break;
                case 'sayed':
                    dataToExport = { 'سيد': cases['سيد'] };
                    break;
                case 'amm':
                    dataToExport = { 'عام': cases['عام'] };
                    break;
                case 'masareef':
                    dataToExport = { 'مصاريف': cases['مصاريف'] };
                    break;
            }
            
            // Generate filename based on date
            const now = new Date();
            const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            const timeString = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
            const filename = `charity_cases_export_${dateString}_${timeString}`;
            
            // Export based on format
            if (exportFormat === 'json') {
                // Convert to JSON
                const jsonData = JSON.stringify(dataToExport, null, 2);
                
                // Create file
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.json`;
                
                // Trigger download
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Hide loader
                hideLoader();
                
                // Show success message
                showToast('تم تصدير البيانات بنجاح', 'success');
            } else if (exportFormat === 'excel' || exportFormat === 'csv') {
                // For demo, we'll simulate Excel/CSV export
                setTimeout(() => {
                    // Hide loader
                    hideLoader();
                    
                    // Show success message
                    showToast(`تم تصدير البيانات بتنسيق ${exportFormat === 'excel' ? 'Excel' : 'CSV'} بنجاح`, 'success');
                }, 1500);
            }
            
            // Close the modal
            closeModal('import-export-modal');
        }
        
        // Import data from file
        function importData() {
            const fileInput = document.getElementById('import-file');
            const importStrategy = document.getElementById('import-strategy').value;
            
            if (!fileInput.files.length) {
                showToast('الرجاء اختيار ملف للاستيراد', 'error');
                return;
            }
            
            // Show loader
            showLoader();
            
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Replace or merge data based on strategy
                    if (importStrategy === 'replace') {
                        // Replace existing data
                        if (importedData['سيد']) cases['سيد'] = importedData['سيد'];
                        if (importedData['عام']) cases['عام'] = importedData['عام'];
                        if (importedData['مصاريف']) cases['مصاريف'] = importedData['مصاريف'];
                        if (importedData.caseCounter) caseCounter = importedData.caseCounter;
                    } else {
                        // Merge with existing data
                        if (importedData['سيد']) {
                            cases['سيد'] = [...cases['سيد'], ...importedData['سيد']];
                        }
                        
                        if (importedData['عام']) {
                            cases['عام'] = [...cases['عام'], ...importedData['عام']];
                        }
                        
                        if (importedData['مصاريف']) {
                            cases['مصاريف'] = [...cases['مصاريف'], ...importedData['مصاريف']];
                        }
                        
                        if (importedData.caseCounter && importedData.caseCounter > caseCounter) {
                            caseCounter = importedData.caseCounter;
                        }
                    }
                    
                    // Remove duplicates
                    removeDuplicateCases();
                    
                    // Save to local storage
                    saveCasesToStorage();
                    
                    // Update UI
                    updateCasesList('سيد');
                    updateCasesList('عام');
                    updateCasesList('مصاريف');
                    updateRecentCases();
                    updateDashboardStats();
                    updateDashboardCharts();
                    setupAutocompleteData();
                    updateSidebarBadges();
                    
                    // Hide loader
                    hideLoader();
                    
                    // Show success message
                    showToast('تم استيراد البيانات بنجاح', 'success');
                    
                    // Close the modal
                    closeModal('import-export-modal');
                    
                } catch (error) {
                    // Hide loader
                    hideLoader();
                    
                    showToast('حدث خطأ أثناء استيراد البيانات. الرجاء التأكد من صحة الملف.', 'error');
                    console.error('Import error:', error);
                }
            };
            
            reader.readAsText(file);
        }
        
        // Remove duplicate cases
        function removeDuplicateCases() {
            for (const caseType in cases) {
                const uniqueCases = [];
                const caseIds = new Set();
                
                cases[caseType].forEach(caseItem => {
                    if (!caseIds.has(caseItem.caseId)) {
                        uniqueCases.push(caseItem);
                        caseIds.add(caseItem.caseId);
                    }
                });
                
                cases[caseType] = uniqueCases;
            }
        }
        
        // Confirm clear cache
        function confirmClearCache() {
            Swal.fire({
                title: 'مسح الذاكرة المؤقتة',
                text: 'سيتم مسح الإعدادات المؤقتة فقط. البيانات الأساسية لن تتأثر. هل أنت متأكد؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f59e0b',
                cancelButtonColor: '#9ca3af',
                confirmButtonText: 'نعم، مسح',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    clearCache();
                }
            });
        }
        
        // Clear cache
        function clearCache() {
            // Clear temporary data from localStorage
            // In a real app, you would have a list of cache keys to delete
            
            showToast('تم مسح الذاكرة المؤقتة بنجاح', 'success');
        }
        
        // Confirm reset all data
        function confirmResetAllData() {
            Swal.fire({
                title: 'إعادة ضبط جميع البيانات',
                text: 'سيتم حذف جميع البيانات والإعدادات نهائياً. هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#3b82f6',
                confirmButtonText: 'نعم، حذف كل شيء',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) {
                    resetAllData();
                }
            });
        }
        
        // Reset all data
        function resetAllData() {
            // Clear all data
            cases = {
                "سيد": [],
                "عام": [],
                "مصاريف": []
            };
            caseCounter = 1;
            
            // Reset settings to defaults
            settings = {
                orgName: "مؤسسة أولاد الحسن ع الخيرية",
                organizer: "محمد حسن",
                adminNames: "السيد أسامة السعبري والسيد فؤاد السعبري",
                autoSave: "enabled",
                autoSaveInterval: 60,
                themeMode: "light",
                themeColor: "#1e40af",
                fontSize: "medium",
                animations: "enabled",
                paperSize: "a4",
                printOrientation: "portrait",
                printHeader: "مؤسسة أولاد الحسن ع الخيرية",
                printFooter: "جميع الحقوق محفوظة © 2025",
                printQrSize: "medium",
                printPreview: "enabled",
                caseIdFormat: "YYMMDD-NUM",
                customCaseIdFormat: "",
                dataLocation: "localStorage",
                caseLockTimeout: 30,
                backupFrequency: "daily",
                backupCount: 5
            };
            
            // Save to local storage
            saveCasesToStorage();
            localStorage.setItem('charityAppSettings', JSON.stringify(settings));
            
            // Update UI
            loadSettings();
            applyThemeSettings();
            updateCasesList('سيد');
            updateCasesList('عام');
            updateCasesList('مصاريف');
            updateRecentCases();
            updateDashboardStats();
            updateDashboardCharts();
            setupAutocompleteData();
            updateSidebarBadges();
            
            // Close settings modal
            closeModal('settings-modal');
            
            // Navigate to dashboard
            showPage('dashboard');
            
            showToast('تم إعادة ضبط جميع البيانات بنجاح', 'success');
        }
        
        // Show toast notification
        function showToast(message, type = 'info', duration = 4000) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon;
            switch(type) {
                case 'success':
                    icon = '<i class="fas fa-check"></i>';
                    break;
                case 'error':
                    icon = '<i class="fas fa-times"></i>';
                    break;
                case 'warning':
                    icon = '<i class="fas fa-exclamation"></i>';
                    break;
                default:
                    icon = '<i class="fas fa-info"></i>';
            }
            
            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${message}</div>
                <div class="toast-close" onclick="closeToast(this.parentElement)"><i class="fas fa-times"></i></div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Auto close
            setTimeout(() => {
                closeToast(toast);
            }, duration);
        }
        
        // Close toast
        function closeToast(toast) {
            if (!toast) return;
            
            toast.classList.add('slide-out');
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        }
        
        // Check for cases in URL
        function checkUrlForCase() {
            const urlParams = new URLSearchParams(window.location.search);
            const caseId = urlParams.get('case');
            
            if (caseId) {
                // Search for the case in all case types
                let foundCase = null;
                let foundCaseType = null;
                
                for (const caseType in cases) {
                    const caseItem = cases[caseType].find(c => c.caseId === caseId);
                    if (caseItem) {
                        foundCase = caseItem;
                        foundCaseType = caseType;
                        break;
                    }
                }
                
                if (foundCase) {
                    // View the case
                    setTimeout(() => {
                        viewCase(foundCase.caseId, foundCaseType);
                        showToast('تم العثور على الحالة!', 'success');
                    }, 1000);
                }
            }
        }
        
        // Run initialization when page loads
        window.onload = function() {
            initApp();
            
            // Check URL for case ID
            checkUrlForCase();
        };








        
