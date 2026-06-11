document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const landingPage = document.getElementById('landing-page');
    const uploadPage = document.getElementById('upload-page');
    const resultPage = document.getElementById('result-page');
    
    const startBtn = document.getElementById('start-btn');
    const backToLandingBtn = document.getElementById('back-to-landing');
    const newAnalysisBtn = document.getElementById('new-analysis-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const fileNameDisplay = document.getElementById('file-name');
    const loadingState = document.getElementById('loading-state');
    const resultContent = document.getElementById('result-content');
    
    let currentFile = null;

    // --- Navigation Functions ---
    function showSection(section) {
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
            sec.classList.add('hidden');
        });
        section.classList.remove('hidden');
        // Force reflow
        void section.offsetWidth;
        section.classList.add('active', 'fade-in');
    }

    startBtn.addEventListener('click', () => showSection(uploadPage));
    backToLandingBtn.addEventListener('click', () => {
        resetUploadState();
        showSection(landingPage);
    });
    newAnalysisBtn.addEventListener('click', () => {
        resetUploadState();
        showSection(uploadPage);
    });

    // --- Upload Handlers ---
    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                currentFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    fileNameDisplay.textContent = file.name;
                    dropZone.classList.add('hidden');
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file (JPG, PNG).');
            }
        }
    }

    function resetUploadState() {
        currentFile = null;
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
    }

    // --- Analysis Handler ---
    analyzeBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // UI updates for loading
        previewContainer.classList.add('hidden');
        backToLandingBtn.classList.add('hidden');
        loadingState.classList.remove('hidden');

        const formData = new FormData();
        formData.append('image', currentFile);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            renderResult(data);
            showSection(resultPage);
            
        } catch (error) {
            alert('Error analyzing image: ' + error.message);
            resetUploadState();
            previewContainer.classList.remove('hidden');
            dropZone.classList.add('hidden');
        } finally {
            backToLandingBtn.classList.remove('hidden');
        }
    });

    // --- Render Result ---
    function renderResult(data) {
        const isSafe = data.status === 'SAFE';
        
        // Build explanation list
        const explanationsHtml = data.explanations
            .map(exp => `<li>${exp}</li>`)
            .join('');
            
        // Determine which image to show
        // Use highlighted image if suspicious, otherwise original
        const displayImageUrl = (!isSafe && data.highlighted_image_url) 
            ? data.highlighted_image_url 
            : data.original_image_url;

        resultContent.className = `result-card ${isSafe ? 'safe' : 'fake'}`;
        
        resultContent.innerHTML = `
            <div class="result-header">
                <span class="status-icon">${isSafe ? '✅' : '❌'}</span>
                <span class="status-text">${isSafe ? 'Safe / Real Image' : 'Suspicious / Deepfake Image Detected'}</span>
            </div>
            
            <div class="confidence-score">
                Confidence Score: ${data.confidence}% ${isSafe ? 'Real' : 'Fake'}
            </div>
            
            <ul class="explanation-list">
                ${explanationsHtml}
            </ul>
            
            <div class="result-image-container">
                <img src="${displayImageUrl}" class="result-image" alt="Analysis Result">
            </div>
        `;
    }

    // --- PDF Download Handler ---
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('result-content');
        const opt = {
            margin:       1,
            filename:     'DeepShield_AI_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        // Hide buttons during generation
        const btnText = downloadPdfBtn.innerHTML;
        downloadPdfBtn.innerHTML = '<span>⏳</span> Generating...';
        downloadPdfBtn.disabled = true;

        html2pdf().set(opt).from(element).save().then(() => {
            downloadPdfBtn.innerHTML = btnText;
            downloadPdfBtn.disabled = false;
        });
    });
});
